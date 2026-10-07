import request from "supertest";
import { app } from "../src/app.js";
import { User } from "../src/models/user.model.js";
import { Video } from "../src/models/video.model.js";
import { Subscription } from "../src/models/subscription.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/db.js";
import { createTestUser } from "./helpers/createTestUser.js";

const BASE_URL = "/api/v1/users";

beforeAll(connectTestDB, 900000);
afterAll(disconnectTestDB);
afterEach(clearTestDB);

describe("User History and Channel Endpoints", () => {
  let testUser, authHeader, channelUser, testVideo;

  beforeEach(async () => {
    const { user } = await createTestUser({
      userName: "mainuser",
      email: "main@test.com",
    });
    testUser = user;
    authHeader = `Bearer ${user.generateAccessToken()}`;

    const { user: cUser } = await createTestUser({
      userName: "testchannel",
      email: "channel@test.com",
    });
    channelUser = cUser;

    testVideo = await Video.create({
      title: "History Video",
      description: "Test description",
      videoFile: "url",
      videoFilePublicId: "id",
      thumbnail: "url",
      thumbnailPublicId: "id",
      duration: 120,
      owner: channelUser._id,
    });
  });

  describe(`GET ${BASE_URL}/history`, () => {
    it("rejects unauthorized requests", async () => {
      const res = await request(app).get(`${BASE_URL}/history`);
      expect(res.status).toBe(401);
    });

    it("fetches the watch history successfully", async () => {
      await User.findByIdAndUpdate(testUser._id, {
        $push: { watchHistory: testVideo._id },
      });

      const res = await request(app)
        .get(`${BASE_URL}/history`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]._id.toString()).toBe(testVideo._id.toString());
      expect(res.body.data[0].owner.userName).toBe("testchannel");
    });
  });

  describe(`PATCH ${BASE_URL}/history-clear`, () => {
    it("rejects unauthorized requests", async () => {
      const res = await request(app).patch(`${BASE_URL}/history-clear`);
      expect(res.status).toBe(401);
    });

    it("clears the watch history successfully", async () => {
      await User.findByIdAndUpdate(testUser._id, {
        $push: { watchHistory: testVideo._id },
      });

      const res = await request(app)
        .patch(`${BASE_URL}/history-clear`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(0);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.watchHistory.length).toBe(0);
    });
  });

  describe(`GET ${BASE_URL}/c/:userName`, () => {
    it("rejects unauthorized requests", async () => {
      const res = await request(app).get(`${BASE_URL}/c/testchannel`);
      expect(res.status).toBe(401);
    });

    it("fails if channel does not exist", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/c/nonexistentuser`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(404);
    });

    it("fetches channel profile with correct subscriber stats", async () => {
      await Subscription.create({
        subscriber: testUser._id,
        channel: channelUser._id,
      });

      const res = await request(app)
        .get(`${BASE_URL}/c/${channelUser.userName}`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.userName).toBe("testchannel");
      expect(res.body.data.subscribersCount).toBe(1);
      expect(res.body.data.isSubscribed).toBe(true);
    });
  });
});
