import { app, sequelize, server } from "../../src/server.js";
import request from "supertest";

afterAll(async () => {
  await sequelize.close();
  server.close();
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
  beforeEach(() => {
    sequelize.authenticate.mockClear();
  });

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
