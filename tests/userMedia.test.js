import request from "supertest";
import { jest } from "@jest/globals";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/db.js";
import { createTestUser } from "./helpers/createTestUser.js";

const uploadToCloudinary = jest.fn().mockResolvedValue({
  public_id: "mocked_id",
  url: "http://example.com/mocked_image.png",
  secure_url: "http://example.com/mocked_image.png",
});
const deleteFromCloudinary = jest.fn().mockResolvedValue(true);

jest.unstable_mockModule("../src/utils/cloudinaryUpload.js", () => ({
  uploadToCloudinary,
  deleteFromCloudinary,
}));

const { app } = await import("../src/app.js");

const BASE_URL = "/api/v1/users";

beforeAll(connectTestDB, 900000);
afterAll(disconnectTestDB);
afterEach(clearTestDB);

describe("User Media Endpoints", () => {
  let authHeader;
  const dummyBuffer = Buffer.from("dummy image content");

  beforeEach(async () => {
    const { user } = await createTestUser();
    authHeader = `Bearer ${user.generateAccessToken()}`;
    jest.clearAllMocks();
  });

  describe(`PATCH ${BASE_URL}/update-avatar`, () => {
    it("rejects unauthorized requests", async () => {
      const res = await request(app)
        .patch(`${BASE_URL}/update-avatar`)
        .attach("avatar", dummyBuffer, "avatar.png");

      expect(res.status).toBe(401);
      expect(uploadToCloudinary).not.toHaveBeenCalled();
    });

    it("fails if avatar file is missing", async () => {
      const res = await request(app)
        .patch(`${BASE_URL}/update-avatar`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(400);
      expect(uploadToCloudinary).not.toHaveBeenCalled();
    });

    it("updates avatar successfully", async () => {
      const res = await request(app)
        .patch(`${BASE_URL}/update-avatar`)
        .set("Authorization", authHeader)
        .attach("avatar", dummyBuffer, "avatar.png");

      expect(res.status).toBe(200);
      expect(res.body.data.avatar.url || res.body.data.avatar).toBe(
        "http://example.com/mocked_image.png"
      );
      expect(uploadToCloudinary).toHaveBeenCalledTimes(1);
    });
  });

  describe(`PATCH ${BASE_URL}/update-cover-image`, () => {
    it("rejects unauthorized requests", async () => {
      const res = await request(app)
        .patch(`${BASE_URL}/update-cover-image`)
        .attach("coverImage", dummyBuffer, "cover.png");

      expect(res.status).toBe(401);
      expect(uploadToCloudinary).not.toHaveBeenCalled();
    });

    it("fails if cover image file is missing", async () => {
      const res = await request(app)
        .patch(`${BASE_URL}/update-cover-image`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(400);
      expect(uploadToCloudinary).not.toHaveBeenCalled();
    });

    it("updates cover image successfully", async () => {
      const res = await request(app)
        .patch(`${BASE_URL}/update-cover-image`)
        .set("Authorization", authHeader)
        .attach("coverImage", dummyBuffer, "cover.png");

      expect(res.status).toBe(200);
      expect(res.body.data.coverImage.url || res.body.data.coverImage).toBe(
        "http://example.com/mocked_image.png"
      );
      expect(uploadToCloudinary).toHaveBeenCalledTimes(1);
    });
  });
});