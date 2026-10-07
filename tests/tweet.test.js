import request from "supertest";
import { app } from "../src/app.js";
import { Tweet } from "../src/models/tweet.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/db.js";
import { createTestUser } from "./helpers/createTestUser.js";

const BASE_URL = "/api/v1/tweets";

beforeAll(connectTestDB, 900000);
afterAll(disconnectTestDB);
afterEach(clearTestDB);

describe("Tweet Endpoints", () => {
  let testUser, authHeader, testTweet;

  beforeEach(async () => {
    const { user } = await createTestUser();
    testUser = user;
    authHeader = `Bearer ${user.generateAccessToken()}`;

    testTweet = await Tweet.create({
      content: "Original tweet content",
      owner: testUser._id,
    });
  });

  describe(`POST ${BASE_URL}`, () => {
    it("rejects unauthorized requests", async () => {
      const res = await request(app).post(BASE_URL).send({ content: "Hello" });
      expect(res.status).toBe(401);
    });

    it("creates a tweet successfully", async () => {
      const res = await request(app)
        .post(BASE_URL)
        .set("Authorization", authHeader)
        .send({ content: "This is a new tweet!" });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe("This is a new tweet!");
    });
  });

  describe(`GET ${BASE_URL}/user/:userId`, () => {
    it("fetches tweets of a user successfully", async () => {
      const res = await request(app).get(`${BASE_URL}/user/${testUser._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe(`PATCH ${BASE_URL}/:tweetId`, () => {
    it("updates a tweet successfully", async () => {
      const res = await request(app)
        .patch(`${BASE_URL}/${testTweet._id}`)
        .set("Authorization", authHeader)
        .send({ content: "Updated tweet content" });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe("Updated tweet content");
    });
  });

  describe(`DELETE ${BASE_URL}/:tweetId`, () => {
    it("deletes a tweet successfully", async () => {
      const res = await request(app)
        .delete(`${BASE_URL}/${testTweet._id}`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(200);

      const deletedTweet = await Tweet.findById(testTweet._id);
      expect(deletedTweet).toBeNull();
    });
  });
});