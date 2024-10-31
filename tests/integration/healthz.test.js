import { app, sequelize, server } from "../../src/server.js";
import request from "supertest";
import { statsdClient } from "../../src/config/statsd.js"; // Import the StatsD client

// Close all open connections after tests
afterAll(async () => {
  await sequelize.close();
  await server.close();
  statsdClient.close(); // Ensure StatsD client closes
});

// Mock Sequelize to avoid real database connections
jest.mock("../../src/config/database", () => {
  const { Sequelize } = jest.requireActual("sequelize");

  class MockSequelize extends Sequelize {
    constructor() {
      super("database", "username", "password", {
        dialect: "postgres",
        logging: false,
      });
      this.authenticate = jest.fn();
      this.close = jest.fn();
    }
  }

  return new MockSequelize();
});

jest.mock("aws-sdk", () => {
  const mockCloudWatch = {
    putMetricData: jest.fn().mockReturnThis(),
    promise: jest.fn().mockResolvedValue({}),
  };

  return {
    CloudWatch: jest.fn(() => mockCloudWatch),
  };
});

beforeEach(() => {
  sequelize.authenticate.mockClear();
});

describe("Method Not Allowed Handling", () => {
  it("should return 405 for POST requests", async () => {
    const response = await request(app).post("/healthz");
    expect(response.statusCode).toBe(405);
  });

  it("should return 405 for PUT requests", async () => {
    const response = await request(app).put("/healthz");
    expect(response.statusCode).toBe(405);
  });

  it("should return 405 for DELETE requests", async () => {
    const response = await request(app).delete("/healthz");
    expect(response.statusCode).toBe(405);
  });

  it("should return 405 for PATCH requests", async () => {
    const response = await request(app).patch("/healthz");
    expect(response.statusCode).toBe(405);
  });
});

describe("/healthz endpoint", () => {
  it("should return 200 if the database connection is successful", async () => {
    sequelize.authenticate.mockResolvedValueOnce();
    const response = await request(app).get("/healthz");
    expect(response.statusCode).toBe(200);
  });

  it("should return 503 if the database connection fails", async () => {
    sequelize.authenticate.mockRejectedValueOnce(
      new Error("DB connection failed")
    );
    const response = await request(app).get("/healthz");
    expect(response.statusCode).toBe(503);
  });

  it("should return 400 if query parameters are provided", async () => {
    const response = await request(app).get("/healthz?param=1");
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 if a body payload is sent", async () => {
    const response = await request(app).get("/healthz").send({ key: "value" });
    expect(response.statusCode).toBe(400);
  });
});
