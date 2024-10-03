import request from "supertest";
import app from "../../src/app";
import User from "../../src/models/User";
import sequelize from "../../src/config/database";
import bcrypt from "bcryptjs";

describe("User API Endpoints", () => {
  let testUser;
  beforeAll(async () => {
    await sequelize.sync({ force: true }); // Reset the database before running tests
  });

  beforeEach(async () => {
    await User.destroy({ where: {} }); // Clear the Users table

    // Create the user used for authentication
    testUser = await User.create({
      first_name: "Test",
      last_name: "User",
      email: "user@example.com",
      password: await bcrypt.hash("password123", 10), // Ensure this matches the password in your tests
    });
  });

  jest.mock("sequelize", () => {
    const actualSequelize = jest.requireActual("sequelize");

    class MockSequelize extends actualSequelize.Sequelize {
      constructor() {
        super("database", "username", "password", {
          dialect: "postgres",
          logging: false,
        });
        this.authenticate = jest.fn();
        this.close = jest.fn();
      }
    }

    return {
      ...actualSequelize,
      Sequelize: MockSequelize,
    };
  });

  describe("GET /v1/user/self", () => {
    it("should require authentication", async () => {
      const res = await request(app).get("/v1/user/self");
      expect(res.status).toBe(401); // Expecting Unauthorized status if not authenticated
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
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
    });
  });

  describe("PUT /v1/user/self", () => {
    it("should update user information for authenticated users", async () => {
      const res = await request(app)
        .put("/v1/user/self")
        .set(
          "Authorization",
          `Basic ${Buffer.from("user@example.com:password123").toString(
            "base64"
          )}`
        )
        .send({ first_name: "Updated", last_name: "User" });
      expect(res.status).toBe(204);
    });

    it("should not allow unauthenticated updates", async () => {
      const res = await request(app)
        .put("/v1/user/self")-
        .send({ first_name: "Bad", last_name: "User" });
      expect(res.status).toBe(401);
    });

    it("should reject invalid field updates", async () => {
      const res = await request(app)
        .put("/v1/user/self")
        .set(
          "Authorization",
          `Basic ${Buffer.from("user@example.com:password").toString("base64")}`
        )
        .send({ invalidField: "value" });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /v1/user", () => {
    beforeEach(async () => {
      await User.destroy({ where: {} });
    });

    it("should create a user successfully", async () => {
      const res = await request(app).post("/v1/user").send({
        first_name: "Jane",
        last_name: "Doe",
        email: "jane.doe@example.com",
        password: "password123",
      });
      expect(res.status).toBe(201);
    });

    it("should return a bad request for duplicate email", async () => {
      await User.create({
        first_name: "Jane",
        last_name: "Doe",
        email: "jane.doe@example.com",
        password: "password123",
      });

      const res = await request(app).post("/v1/user").send({
        first_name: "Jane",
        last_name: "Doe",
        email: "jane.doe@example.com",
        password: "password123",
      });
      expect(res.status).toBe(400);
    });
  });

  afterAll(async () => {
    await sequelize.close(); // Properly close the connection
  });
});
