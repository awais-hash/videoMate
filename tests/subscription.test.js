import request from "supertest";
import { app } from "../src/app.js";
import { Subscription } from "../src/models/subscription.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/db.js";
import { createTestUser } from "./helpers/createTestUser.js";

const BASE_URL = "/api/v1/subscriptions";

beforeAll(connectTestDB, 900000);
afterAll(disconnectTestDB);
afterEach(clearTestDB);

describe("Subscription Endpoints", () => {
  let subscriber, channel, authHeader;

  beforeEach(async () => {
    const subData = await createTestUser({
      userName: "subscriber_1",
      email: "sub1@example.com",
    });
    const channelData = await createTestUser({
      userName: "channel_1",
      email: "channel1@example.com",
    });

    subscriber = subData.user;
    authHeader = `Bearer ${subData.user.generateAccessToken()}`;
    channel = channelData.user;
  });

  describe(`POST ${BASE_URL}/toggle/:channelId`, () => {
    it("rejects unauthorized requests", async () => {
      const res = await request(app).post(`${BASE_URL}/toggle/${channel._id}`);
      expect(res.status).toBe(401);
    });

    it("rejects an invalid channel id", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/toggle/not-a-valid-id`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(400);
    });

    it("toggles subscription status correctly", async () => {
      const subscribeRes = await request(app)
        .post(`${BASE_URL}/toggle/${channel._id}`)
        .set("Authorization", authHeader);

      expect(subscribeRes.status).toBe(200);

      const subscriptionExists = await Subscription.findOne({
        subscriber: subscriber._id,
        channel: channel._id,
      });
      expect(subscriptionExists).not.toBeNull();

      const unsubscribeRes = await request(app)
        .post(`${BASE_URL}/toggle/${channel._id}`)
        .set("Authorization", authHeader);

      expect(unsubscribeRes.status).toBe(200);

      const subscriptionRemoved = await Subscription.findOne({
        subscriber: subscriber._id,
        channel: channel._id,
      });
      expect(subscriptionRemoved).toBeNull();
    });
  });

  describe(`GET ${BASE_URL}/c/:channelId`, () => {
    it("returns the list of subscribers for a channel", async () => {
      await Subscription.create({
        subscriber: subscriber._id,
        channel: channel._id,
      });

      const res = await request(app)
        .get(`${BASE_URL}/c/${channel._id}`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe(`GET ${BASE_URL}/u/:subscriberId`, () => {
    it("returns the list of channels a user has subscribed to", async () => {
      await Subscription.create({
        subscriber: subscriber._id,
        channel: channel._id,
      });

      const res = await request(app)
        .get(`${BASE_URL}/u/${subscriber._id}`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});