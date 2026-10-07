import { jest } from "@jest/globals";
import request from "supertest";

const uploadToCloudinary = jest.fn().mockResolvedValue({
  url: "https://example.com/mock-file.mp4",
  public_id: "mock-file-id",
});
const deleteFromCloudinary = jest.fn().mockResolvedValue({ result: "ok" });

jest.unstable_mockModule("../src/utils/cloudinaryUpload.js", () => ({
  uploadToCloudinary,
  deleteFromCloudinary,
}));

const { app } = await import("../src/app.js");
const { Video } = await import("../src/models/video.model.js");
const { connectTestDB, clearTestDB, disconnectTestDB } = await import("./setup/db.js");
const { createTestUser } = await import("./helpers/createTestUser.js");

const BASE_URL = "/api/v1/videos";

beforeAll(connectTestDB, 900000);
afterAll(disconnectTestDB);
afterEach(clearTestDB);
beforeEach(() => jest.clearAllMocks());

describe("Video Endpoints", () => {
  let testUser;
  let authHeader;

  beforeEach(async () => {
    const { user } = await createTestUser();
    testUser = user;
    authHeader = `Bearer ${user.generateAccessToken()}`;
  });

  describe(`POST ${BASE_URL}/publish`, () => {
    it("rejects unauthorized requests", async () => {
      const res = await request(app).post(`${BASE_URL}/publish`).send({});
      expect(res.status).toBe(401);
    });

    it("publishes a video with valid data and attachments", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/publish`)
        .set("Authorization", authHeader)
        .field("title", "Integration Test Video")
        .field("description", "Video description for testing")
        .attach("videoFile", Buffer.from("fake-video-buffer"), "video.mp4")
        .attach("thumbnail", Buffer.from("fake-thumb-buffer"), "thumb.png");

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Integration Test Video");
      expect(uploadToCloudinary).toHaveBeenCalledTimes(2);

      const videoExists = await Video.findById(res.body.data._id);
      expect(videoExists).not.toBeNull();
      expect(videoExists.owner.toString()).toBe(testUser._id.toString());
    });
  });

  describe(`DELETE ${BASE_URL}/:videoId`, () => {
    it("deletes an existing video and triggers cloudinary cleanup", async () => {
      const video = await Video.create({
        title: "To be deleted",
        description: "Will be deleted",
        videoFile: "url",
        videoFilePublicId: "video-id",
        thumbnail: "url",
        thumbnailPublicId: "thumb-id",
        duration: 120,
        owner: testUser._id,
      });

      const res = await request(app)
        .delete(`${BASE_URL}/${video._id}`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(200);

      const deletedVideo = await Video.findById(video._id);
      expect(deletedVideo).toBeNull();
      expect(deleteFromCloudinary).toHaveBeenCalledTimes(2);
    });
  });
});