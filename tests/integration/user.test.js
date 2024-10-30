import request from "supertest";
import app from "../../src/app";
import User from "../../src/models/User";
import sequelize from "../../src/config/database";
import bcrypt from "bcryptjs";
import { closeStatsdClient } from "../../src/config/statsd.js";

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

  afterAll(() => {
    closeStatsdClient();
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
      // Mock the User.findOne method to return null
      jest.spyOn(User, "findOne").mockResolvedValueOnce(null);

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

    it("should reject disallowed headers", async () => {
      const res = await request(app)
        .put("/v1/user/self")
        .set({
          Authorization: `Basic ${Buffer.from(
            "user@example.com:password123"
          ).toString("base64")}`,
          "disallowed-header": "value",
        })
        .send({ first_name: "Updated", last_name: "User" });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Disallowed header/);
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
      expect(res.status).toBe(200);
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
      expect(res.body.message).toBe("User already exists");
    });

    it("should reject query parameters in POST request", async () => {
      const res = await request(app)
        .post("/v1/user")
        .query({ someQueryParam: "value" })
        .send({
          first_name: "Jane",
          last_name: "Doe",
          email: "jane.doe@example.com",
          password: "password123",
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        "Query parameters are not allowed in POST requests"
      );
    });

    it("should reject disallowed headers", async () => {
      const res = await request(app)
        .post("/v1/user")
        .set("disallowed-header", "value")
        .send({
          first_name: "Jane",
          last_name: "Doe",
          email: "jane.doe@example.com",
          password: "password123",
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Disallowed header/);
    });
  });

  describe("GET /v1/user/self (Edge Cases)", () => {
    it("should return 400 if disallowed header is present", async () => {
      const res = await request(app)
        .get("/v1/user/self")
        .set("X-Custom-Header", "disallowed-header") // Disallowed header
        .set(
          "Authorization",
          `Basic ${Buffer.from("user@example.com:password123").toString(
            "base64"
          )}`
        );
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Disallowed header: x-custom-header");
    });

    it("should return 400 if body parameters are sent in GET request", async () => {
      const res = await request(app)
        .get("/v1/user/self")
        .set(
          "Authorization",
          `Basic ${Buffer.from("user@example.com:password123").toString(
            "base64"
          )}`
        )
        .send({ invalidParam: "notAllowed" });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Body parameters are not allowed");
    });
  });

  describe("POST /v1/user (Edge Cases)", () => {
    it("should return 400 if disallowed header is present", async () => {
      const res = await request(app)
        .post("/v1/user")
        .set("X-Custom-Header", "disallowed-header")
        .send({
          first_name: "Jane",
          last_name: "Doe",
          email: "jane.doe@example.com",
          password: "password123",
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Disallowed header: x-custom-header");
    });

    it("should return 400 if query parameters are present", async () => {
      const res = await request(app)
        .post("/v1/user")
        .query({ queryParam: "notAllowed" })
        .send({
          first_name: "Jane",
          last_name: "Doe",
          email: "jane.doe@example.com",
          password: "password123",
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        "Query parameters are not allowed in POST requests"
      );
    });

    it("should return 400 if Content-Type is not application/json", async () => {
      const res = await request(app)
        .post("/v1/user")
        .set("Content-Type", "text/plain")
        .send(
          `first_name=Jane&last_name=Doe&email=jane.doe@example.com&password=password123`
        );
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Content-Type must be application/json");
    });

    it("should return 400 if request body is empty", async () => {
      const res = await request(app).post("/v1/user").send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Request body cannot be empty");
    });
  });

  describe("PUT /v1/user/self (Edge Cases)", () => {
    it("should return 400 if Content-Type is not application/json", async () => {
      const res = await request(app)
        .put("/v1/user/self")
        .set(
          "Authorization",
          `Basic ${Buffer.from("user@example.com:password123").toString(
            "base64"
          )}`
        )
        .set("Content-Type", "text/plain")
        .send(`first_name=Updated&last_name=User`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Content-Type must be application/json");
    });

    it("should return 400 if request body is empty", async () => {
      const res = await request(app)
        .put("/v1/user/self")
        .set(
          "Authorization",
          `Basic ${Buffer.from("user@example.com:password123").toString(
            "base64"
          )}`
        )
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Request body cannot be empty");
    });

    it("should return 405 if PATCH method is used", async () => {
      const res = await request(app)
        .patch("/v1/user/self")
        .set(
          "Authorization",
          `Basic ${Buffer.from("user@example.com:password123").toString(
            "base64"
          )}`
        )
        .send({ first_name: "Updated", last_name: "User" });
      expect(res.status).toBe(405);
    });
    it("should return 400 Bad Request when invalid fields are provided", async () => {
      const res = await request(app)
        .put("/v1/user/self")
        .set(
          "Authorization",
          `Basic ${Buffer.from("user@example.com:password123").toString(
            "base64"
          )}`
        )
        .send({
          first_name: "NewFirstName", // valid
          last_name: "NewLastName", // valid
          email: "newemail@example.com", // invalid field
          phone: "1234567890", // another invalid field
        });

      // Assertions for invalid field case
      expect(res.status).toBe(400); // Should return 400 Bad Request
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe("Invalid fields: email, phone");
    });
  });

  afterAll(async () => {
    await sequelize.close(); // Properly close the connection
  });
});
