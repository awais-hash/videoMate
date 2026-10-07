import request from "supertest";
import { app } from "../src/app.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/db.js";
import { createTestUser } from "./helpers/createTestUser.js";

const LOGIN_URL = "/api/v1/users/login";
const CURRENT_USER_URL = "/api/v1/users/current-user";

let testUser;
let testPassword;

beforeAll(connectTestDB, 90000000);
afterAll(disconnectTestDB);

beforeEach(async () => {
  const { user, password } = await createTestUser();
  testUser = user;
  testPassword = password;
});

afterEach(clearTestDB);

describe("POST /api/v1/users/login", () => {
  it("rejects a request without a password", async () => {
    const res = await request(app).post(LOGIN_URL).send({ userName: "testuser" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
  });

  it("rejects a request that has neither email nor username", async () => {
    const res = await request(app).post(LOGIN_URL).send({ password: testPassword });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.errors[0].message).toBe("Either email or username is required");
  });

  it("logs in with only a username", async () => {
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ userName: "testuser", password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.userName).toBe("testuser");
    expect(res.body.data.user.password).toBeUndefined();
  });

  it("logs in with only an email", async () => {
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ email: "testuser@example.com", password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe("testuser@example.com");
  });

  it("rejects a wrong password", async () => {
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ userName: "testuser", password: "Wrong@1234" });

    expect(res.status).toBe(401);
  });

  it("returns 404 for a user that does not exist", async () => {
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ userName: "nobody", password: testPassword });

    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/users/current-user", () => {
  it("rejects requests without a token", async () => {
    const res = await request(app).get(CURRENT_USER_URL);

    expect(res.status).toBe(401);
  });

  it("returns the logged-in user when a valid token is sent", async () => {
    const token = testUser.generateAccessToken();

    const res = await request(app)
      .get(CURRENT_USER_URL)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.userName).toBe("testuser");
    expect(res.body.data.password).toBeUndefined();
  });
});
