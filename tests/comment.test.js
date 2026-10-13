import request from "supertest";
import { app } from "../src/app.js";
import { Comment } from "../src/models/comment.model.js";
import { Video } from "../src/models/video.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/db.js";
import { createTestUser } from "./helpers/createTestUser.js";

const BASE_URL = "/api/v1/comments";

beforeAll(connectTestDB, 900000);
afterAll(disconnectTestDB);
afterEach(clearTestDB);

describe("Comment Endpoints", () => {
  let testUser, authHeader, hackerHeader, testVideo, testComment;

  beforeEach(async () => {
    const { user } = await createTestUser();
    testUser = user;
    authHeader = `Bearer ${user.generateAccessToken()}`;

    const { user: hacker } = await createTestUser({ email: "hacker1@test.com", userName: "hacker1" });
    hackerHeader = `Bearer ${hacker.generateAccessToken()}`;

    testVideo = await Video.create({
      title: "Test Video for Comment",
      description: "Testing comments",
      videoFile: "url",
      videoFilePublicId: "id",
      thumbnail: "url",
      thumbnailPublicId: "id",
      duration: 120,
      owner: testUser._id,
    });

    testComment = await Comment.create({
      content: "This is an old comment",
      video: testVideo._id,
      owner: testUser._id,
    });
  });

  describe(`POST ${BASE_URL}/:videoId`, () => {
    it("rejects unauthorized requests", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/${testVideo._id}`)
        .send({ content: "Nice video!" });
      expect(res.status).toBe(401);
    });

    it("adds a comment to a video successfully", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/${testVideo._id}`)
        .set("Authorization", authHeader)
        .send({ content: "Great video!" });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe("Great video!");
    });
  });

  describe(`GET ${BASE_URL}/:videoId`, () => {
    it("fetches comments of a video successfully", async () => {
      const res = await request(app).get(`${BASE_URL}/${testVideo._id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  describe(`PATCH ${BASE_URL}/c/:commentId`, () => {
    it("updates a comment successfully", async () => {
      const res = await request(app)
        .patch(`${BASE_URL}/c/${testComment._id}`)
        .set("Authorization", authHeader)
        .send({ content: "Updated comment text" });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe("Updated comment text");
    });

    it("returns 403 if another user tries to update the comment", async () => {
      const res = await request(app)
        .patch(`${BASE_URL}/c/${testComment._id}`)
        .set("Authorization", hackerHeader)
        .send({ content: "Hacked comment" });

      expect(res.status).toBe(403);
    });
  });

  describe(`DELETE ${BASE_URL}/c/:commentId`, () => {
    it("deletes a comment successfully", async () => {
      const res = await request(app)
        .delete(`${BASE_URL}/c/${testComment._id}`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(200);

      const deletedComment = await Comment.findById(testComment._id);
      expect(deletedComment).toBeNull();
    });

    it("returns 403 if another user tries to delete the comment", async () => {
      const res = await request(app)
        .delete(`${BASE_URL}/c/${testComment._id}`)
        .set("Authorization", hackerHeader);

      expect(res.status).toBe(403);
    });
  });
});