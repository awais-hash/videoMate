import request from "supertest";
import { app } from "../src/app.js";
import { Like } from "../src/models/like.model.js";
import { Video } from "../src/models/video.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/db.js";
import { createTestUser } from "./helpers/createTestUser.js";

const BASE_URL = "/api/v1/likes";

beforeAll(connectTestDB, 900000);
afterAll(disconnectTestDB);
afterEach(clearTestDB);

describe("Like Endpoints", () => {
  let testUser, authHeader, testVideo;

  beforeEach(async () => {
    const { user } = await createTestUser();
    testUser = user;
    authHeader = `Bearer ${user.generateAccessToken()}`;

    testVideo = await Video.create({
      title: "Test Video",
      description: "Test Description",
      videoFile: "url",
      videoFilePublicId: "id",
      thumbnail: "url",
      thumbnailPublicId: "id",
      duration: 120,
      owner: testUser._id,
    });
  });

  describe(`POST ${BASE_URL}/toggle/video/:videoId`, () => {
    it("rejects unauthorized requests", async () => {
      const res = await request(app).post(`${BASE_URL}/toggle/video/${testVideo._id}`);
      expect(res.status).toBe(401);
    });

    it("toggles video like status correctly", async () => {
      const likeRes = await request(app)
        .post(`${BASE_URL}/toggle/video/${testVideo._id}`)
        .set("Authorization", authHeader);

      expect(likeRes.status).toBe(200);

      const likeExists = await Like.findOne({
        video: testVideo._id,
        likedBy: testUser._id,
      });
      expect(likeExists).not.toBeNull();

      const unlikeRes = await request(app)
        .post(`${BASE_URL}/toggle/video/${testVideo._id}`)
        .set("Authorization", authHeader);

      expect(unlikeRes.status).toBe(200);

      const likeRemoved = await Like.findOne({
        video: testVideo._id,
        likedBy: testUser._id,
      });
      expect(likeRemoved).toBeNull();
    });
  });

  describe(`GET ${BASE_URL}/videos/liked`, () => {
    it("returns a list of liked videos", async () => {
      await Like.create({
        video: testVideo._id,
        likedBy: testUser._id,
      });

      const res = await request(app)
        .get(`${BASE_URL}/videos/liked`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});