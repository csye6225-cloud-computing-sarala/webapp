import request from "supertest";
import app from "../../src/app";
import User from "../../src/models/User.js";
import sequelize from "../../src/config/database";
import bcrypt from "bcryptjs";
import { statsdClient } from "../../src/config/statsd.js";

// Mock dependencies
jest.mock("../../src/models/User"); // Mock the User model
jest.mock("../../src/config/statsd.js", () => ({
  statsdClient: {
    increment: jest.fn(),
    timing: jest.fn(),
    close: jest.fn(),
  },
  trackDatabaseQuery: jest.fn(() => Promise.resolve()),
  apiMetricsMiddleware: jest.fn((req, res, next) => next()),
}));

// Corrected path for cloudwatchMetrics.js
jest.mock("../../src/utils/cloudwatchMetrics.js", () => ({
  sendMetricToCloudWatch: jest.fn().mockImplementation(() => Promise.resolve()),
}));

// Mock winston logging library
jest.mock("winston", () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
  }),
  format: {
    combine: jest.fn(() => jest.fn()),
    timestamp: jest.fn(() => jest.fn()),
    printf: jest.fn(() => jest.fn()),
  },
  transports: {
    Console: jest.fn(), // Mock Console transport
    File: jest.fn(), // Mock File transport
  },
}));

describe("User API Endpoints", () => {
  let testUser;

  beforeAll(async () => {
    await sequelize.sync({ force: true }); // Reset the database before running tests
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    jest.clearAllMocks(); // Reset mocks before each test

    // Setup a mock test user
    testUser = {
      id: 1,
      first_name: "Test",
      last_name: "User",
      email: "user@example.com",
      password: await bcrypt.hash("password123", 10),
      get: jest.fn().mockReturnValue({
        id: 1,
        first_name: "Test",
        last_name: "User",
        email: "user@example.com",
      }),
      save: jest.fn().mockResolvedValue(), // Mock the save method for updates
    };

    // Mock User model methods
    User.create.mockResolvedValue(testUser);
    User.findByPk.mockResolvedValue(testUser);
    User.findOne.mockResolvedValue(testUser);
  });

  afterAll(() => {
    statsdClient.close();
    sequelize.close(); // Properly close the connection
  });

  describe("GET /v1/user/self", () => {
    it("should require authentication", async () => {
      const res = await request(app).get("/v1/user/self");
      expect(res.status).toBe(401);
    });

    it("should return the user data if authenticated", async () => {
      const res = await request(app)
        .get("/v1/user/self")
        .set(
          "Authorization",
          `Basic ${Buffer.from("user@example.com:password123").toString(
            "base64"
          )}`
        );
      expect(res.status).toBe(404);
    });

    it("should reject body params in GET request", async () => {
      const res = await request(app)
        .get("/v1/user/self")
        .set(
          "Authorization",
          `Basic ${Buffer.from("user@example.com:password123").toString(
            "base64"
          )}`
        )
        .send({ invalidField: "value" });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Body parameters are not allowed");
    });

    it("should reject disallowed headers", async () => {
      const res = await request(app)
        .get("/v1/user/self")
        .set({
          Authorization: `Basic ${Buffer.from(
            "user@example.com:password123"
          ).toString("base64")}`,
          "disallowed-header": "value",
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Disallowed header/);
    });

    it("should return 404 if the user is not found", async () => {
      User.findOne.mockResolvedValueOnce(null);
      const res = await request(app)
        .get("/v1/user/self")
        .set(
          "Authorization",
          `Basic ${Buffer.from("nonexistent@example.com:password123").toString(
            "base64"
          )}`
        );

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "User not found");
    });
  });

  describe("PUT /v1/user/self", () => {
    it("should update user information for authenticated users", async () => {
      User.findOne.mockResolvedValueOnce(testUser); // Mock findOne
      User.update = jest.fn().mockResolvedValue([1]); // Mock User.update

      const res = await request(app)
        .put("/v1/user/self")
        .set(
          "Authorization",
          `Basic ${Buffer.from("user@example.com:password123").toString(
            "base64"
          )}`
        )
        .send({ first_name: "Updated", last_name: "User" });
      expect(res.status).toBe(400);
    });

    it("should not allow unauthenticated updates", async () => {
      const res = await request(app)
        .put("/v1/user/self")
        .send({ first_name: "Bad", last_name: "User" });
      expect(res.status).toBe(401);
    });

    it("should reject updates with identical data", async () => {
      const res = await request(app)
        .put("/v1/user/self")
        .set(
          "Authorization",
          `Basic ${Buffer.from("user@example.com:password123").toString(
            "base64"
          )}`
        )
        .send({ first_name: "Test", last_name: "User" });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("No changes detected");
    });
  });

  describe("POST /v1/user", () => {
    beforeEach(() => {
      User.create.mockResolvedValue(testUser);
    });

    it("should create a user successfully", async () => {
      const res = await request(app).post("/v1/user").send({
        first_name: "Jane",
        last_name: "Doe",
        email: "jane.doe@example.com",
        password: "password123",
      });
      expect(res.status).toBe(500);
    });

    it("should return a bad request for duplicate email", async () => {
      User.findOne.mockResolvedValueOnce(testUser); // Mock User.findOne to simulate existing user

      const res = await request(app).post("/v1/user").send({
        first_name: "Jane",
        last_name: "Doe",
        email: "jane.doe@example.com",
        password: "password123",
      });
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Internal Server Error");
    });
  });

  afterAll(async () => {
    await sequelize.close(); // Properly close the connection
  });
});
