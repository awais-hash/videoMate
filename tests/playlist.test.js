import request from "supertest";
import { app } from "../src/app.js";
import { Playlist } from "../src/models/playlist.model.js";
import { Video } from "../src/models/video.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/db.js";
import { createTestUser } from "./helpers/createTestUser.js";

const BASE_URL = "/api/v1/playlists";

beforeAll(connectTestDB, 900000);
afterAll(disconnectTestDB);
afterEach(clearTestDB);

describe("Playlist Endpoints", () => {
  let testUser, authHeader, testVideo, testPlaylist;

  beforeEach(async () => {
    const { user } = await createTestUser();
    testUser = user;
    authHeader = `Bearer ${user.generateAccessToken()}`;

    testVideo = await Video.create({
      title: "Playlist Video",
      description: "Video for playlist test",
      videoFile: "url",
      videoFilePublicId: "id",
      thumbnail: "url",
      thumbnailPublicId: "id",
      duration: 120,
      owner: testUser._id,
    });

    testPlaylist = await Playlist.create({
      name: "My Favourites",
      description: "Best videos",
      owner: testUser._id,
      videos: [],
    });
  });

  describe(`POST ${BASE_URL}`, () => {
    it("rejects unauthorized requests", async () => {
      const res = await request(app).post(BASE_URL).send({ name: "Test" });
      expect(res.status).toBe(401);
    });

    it("creates a playlist successfully", async () => {
      const res = await request(app)
        .post(BASE_URL)
        .set("Authorization", authHeader)
        .send({ name: "New Playlist", description: "Test Description" });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("New Playlist");
    });
  });

  describe(`GET ${BASE_URL}/user/:userId`, () => {
    it("fetches user playlists successfully", async () => {
      const res = await request(app).get(`${BASE_URL}/user/${testUser._id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe(`GET ${BASE_URL}/:playlistId`, () => {
    it("fetches a playlist by id successfully", async () => {
      const res = await request(app).get(`${BASE_URL}/${testPlaylist._id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(testPlaylist._id.toString());
    });
  });

  describe(`PATCH ${BASE_URL}/add/:videoId/:playlistId`, () => {
    it("adds a video to a playlist successfully", async () => {
      const res = await request(app)
        .patch(`${BASE_URL}/add/${testVideo._id}/${testPlaylist._id}`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(200);
      
      const updatedPlaylist = await Playlist.findById(testPlaylist._id);
      expect(updatedPlaylist.videos).toContainEqual(testVideo._id);
    });
  });

  describe(`PATCH ${BASE_URL}/remove/:videoId/:playlistId`, () => {
    it("removes a video from a playlist successfully", async () => {
      await Playlist.findByIdAndUpdate(testPlaylist._id, {
        $push: { videos: testVideo._id }
      });

      const res = await request(app)
        .patch(`${BASE_URL}/remove/${testVideo._id}/${testPlaylist._id}`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(200);
      
      const updatedPlaylist = await Playlist.findById(testPlaylist._id);
      expect(updatedPlaylist.videos).not.toContainEqual(testVideo._id);
    });
  });

  describe(`PATCH ${BASE_URL}/:playlistId`, () => {
    it("updates playlist details successfully", async () => {
      const res = await request(app)
        .patch(`${BASE_URL}/${testPlaylist._id}`)
        .set("Authorization", authHeader)
        .send({ name: "Updated Name", description: "Updated Description" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated Name");
    });
  });

  describe(`DELETE ${BASE_URL}/:playlistId`, () => {
    it("deletes a playlist successfully", async () => {
      const res = await request(app)
        .delete(`${BASE_URL}/${testPlaylist._id}`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(200);

      const deletedPlaylist = await Playlist.findById(testPlaylist._id);
      expect(deletedPlaylist).toBeNull();
    });
  });
});