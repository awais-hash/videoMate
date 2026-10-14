import request from "supertest";
import { app } from "../src/app.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/db.js";
import { createTestUser } from "./helpers/createTestUser.js";

const BASE_URL = "/api/v1/users";

beforeAll(connectTestDB, 900000);
afterAll(disconnectTestDB);
afterEach(clearTestDB);

describe("User Profile Endpoints", () => {
  let  authHeader;
  const currentPassword = "password123";

  beforeEach(async () => {
    const { user } = await createTestUser({
      userName: "profiletestuser",
      email: "profile@example.com",
      password: currentPassword,
    });
    authHeader = `Bearer ${user.generateAccessToken()}`;
  });

  describe(`GET ${BASE_URL}/current-user`, () => {
    it("rejects unauthorized requests", async () => {
      const res = await request(app).get(`${BASE_URL}/current-user`);
      expect(res.status).toBe(401);
    });

    it("fetches the current user successfully", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/current-user`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe("profile@example.com");
      expect(res.body.data.userName).toBe("profiletestuser");
    });
  });

  describe(`PATCH ${BASE_URL}/update-details`, () => {
    it("rejects unauthorized requests", async () => {
      const res = await request(app)
        .patch(`${BASE_URL}/update-details`)
        .send({ fullName: "New Name", email: "new@example.com" });
      
      expect(res.status).toBe(401);
    });

    it("updates user details successfully", async () => {
      const res = await request(app)
        .patch(`${BASE_URL}/update-details`)
        .set("Authorization", authHeader)
        .send({ fullName: "Updated Name", email: "updated@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe("Updated Name");
      expect(res.body.data.email).toBe("updated@example.com");
    });

    it("fails if email is already in use by another account", async () => {
      await createTestUser({
        userName: "otheruser",
        email: "conflict@example.com",
      });

      const res = await request(app)
        .patch(`${BASE_URL}/update-details`)
        .set("Authorization", authHeader)
        .send({ fullName: "My Name", email: "conflict@example.com" });

      expect(res.status).toBe(409);
    });
  });

  describe(`PATCH ${BASE_URL}/update-password`, () => {
    it("rejects unauthorized requests", async () => {
      const res = await request(app)
        .patch(`${BASE_URL}/update-password`)
        .send({ currentPassword: "password123", newPassword: "newpassword123" });
      
      expect(res.status).toBe(401);
    });

    it("updates password successfully with correct current password", async () => {
      const res = await request(app)
        .patch(`${BASE_URL}/update-password`)
        .set("Authorization", authHeader)
        .send({ 
          currentPassword: currentPassword, 
          newPassword: "newStrongPassword123!" 
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/success/i);
    });

    it("fails to update password with incorrect current password", async () => {
      const res = await request(app)
        .patch(`${BASE_URL}/update-password`)
        .set("Authorization", authHeader)
        .send({ 
          currentPassword: "wrongPassword", 
          newPassword: "newStrongPassword123!" 
        });

      expect(res.status).toBe(401);
    });
  });
});