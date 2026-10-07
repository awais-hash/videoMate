import request from "supertest";
import { app } from "../src/app.js";
import { connectTestDB, disconnectTestDB } from "./setup/db.js";

beforeAll(connectTestDB, 90000000);
afterAll(disconnectTestDB);

describe("Health and fallback routes", () => {
  it("GET /api/v1/health responds with 200 and JSON", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
  });

  it("GET /api/v1/docs/ serves the Swagger UI", async () => {
    const res = await request(app).get("/api/v1/docs/");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });

  it("returns the JSON 404 response for unknown routes", async () => {
    const res = await request(app).get("/api/v1/this-route-does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: "Route not found",
      statusCode: 404,
    });
  });
});