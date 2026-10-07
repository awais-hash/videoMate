import { jest } from "@jest/globals";
import request from "supertest";

const uploadToCloudinary = jest.fn();
const deleteFromCloudinary = jest.fn().mockResolvedValue({ result: "ok" });

jest.unstable_mockModule("../src/utils/cloudinaryUpload.js", () => ({
  uploadToCloudinary,
  deleteFromCloudinary,
}));

const { app } = await import("../src/app.js");
const { User } = await import("../src/models/user.model.js");
const { Subscription } = await import("../src/models/subscription.model.js");
const { connectTestDB, clearTestDB, disconnectTestDB } = await import("./setup/db.js");
const { createTestUser } = await import("./helpers/createTestUser.js");

const DELETE_URL = "/api/v1/users/delete-account";
const authHeader = (user) => ({ Authorization: `Bearer ${user.generateAccessToken()}` });

beforeAll(connectTestDB, 90000000);
afterAll(disconnectTestDB);
beforeEach(() => jest.clearAllMocks());
afterEach(clearTestDB);

describe("DELETE /api/v1/users/delete-account", () => {
  it("rejects requests without a token", async () => {
    const res = await request(app).delete(DELETE_URL).send({ password: "Test@1234" });

    expect(res.status).toBe(401);
  });

  it("rejects a request without a password and keeps the account", async () => {
    const { user } = await createTestUser();

    const res = await request(app).delete(DELETE_URL).set(authHeader(user)).send({});

    expect(res.status).toBe(400);
    expect(await User.findById(user._id)).not.toBeNull();
    expect(deleteFromCloudinary).not.toHaveBeenCalled();
  });

  it("rejects a wrong password and keeps the account", async () => {
    const { user } = await createTestUser();

    const res = await request(app)
      .delete(DELETE_URL)
      .set(authHeader(user))
      .send({ password: "Wrong@1234" });

    expect(res.status).toBe(401);
    expect(await User.findById(user._id)).not.toBeNull();
    expect(deleteFromCloudinary).not.toHaveBeenCalled();
  });

  it("deletes the account, cascades related data and cleans up Cloudinary", async () => {
    const { user: alice, password } = await createTestUser();
    const { user: bob } = await createTestUser({
      userName: "bob",
      email: "bob@example.com",
      fullName: "Bob Smith",
    });
    const { user: carol } = await createTestUser({
      userName: "carol",
      email: "carol@example.com",
      fullName: "Carol Jones",
    });

    await Subscription.create([
      { subscriber: alice._id, channel: bob._id },
      { subscriber: bob._id, channel: alice._id },
      { subscriber: carol._id, channel: bob._id },
    ]);

    const res = await request(app)
      .delete(DELETE_URL)
      .set(authHeader(alice))
      .send({ password });

    expect(res.status).toBe(200);

    expect(await User.findById(alice._id)).toBeNull();
    expect(await User.findById(bob._id)).not.toBeNull();

    const aliceSubscriptions = await Subscription.countDocuments({
      $or: [{ subscriber: alice._id }, { channel: alice._id }],
    });
    expect(aliceSubscriptions).toBe(0);

    const untouched = await Subscription.countDocuments({
      subscriber: carol._id,
      channel: bob._id,
    });
    expect(untouched).toBe(1);

    expect(deleteFromCloudinary).toHaveBeenCalledTimes(1);
    expect(deleteFromCloudinary).toHaveBeenCalledWith("test-avatar", "image");

    const cookies = (res.headers["set-cookie"] || []).join(";");
    expect(cookies).toContain("accessToken=;");
    expect(cookies).toContain("refreshToken=;");
  });
});
