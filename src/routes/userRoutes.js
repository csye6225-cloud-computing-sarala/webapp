import express from "express";
import basicAuth from "../middleware/basicAuth.js";
import {
  getUserController,
  createUserController,
  updateUserController,
} from "../controllers/userController.js";

const userRoutes = express.Router();

// Define allowed headers
const allowedHeaders = [
  "user-agent",
  "accept",
  "postman-token",
  "host",
  "accept-encoding",
  "connection",
  "content-type",
  "authorization",
  "content-length",
];

// Middleware to check for any disallowed headers
const hasDisallowedHeaders = (req, res, next) => {
  const disallowedHeader = Object.keys(req.headers).find(
    (header) => !allowedHeaders.includes(header.toLowerCase())
  );
  if (disallowedHeader) {
    return res
      .status(400)
      .json({ message: `Disallowed header: ${disallowedHeader}` });
  }
  next();
};

// Middleware to reject unwanted HTTP methods on specific endpoints
userRoutes.use("/user/self", basicAuth, (req, res, next) => {
  if (["DELETE", "PATCH", "OPTIONS", "HEAD"].includes(req.method)) {
    return res.status(405).end();
  }
  next();
});

// Middleware to reject query parameters on POST requests
const noQueryParams = (req, res, next) => {
  if (Object.keys(req.query).length > 0) {
    return res
      .status(400)
      .json({ message: "Query parameters are not allowed in POST requests" });
  }
  next();
};

// Middleware to prevent caching
const noCache = (req, res, next) => {
  res.setHeader("Cache-Control", "no-cache");
  next();
};

// Middleware to reject body parameters (for GET or DELETE requests that shouldn't have a body)
const noBodyParams = (req, res, next) => {
  if (req.method === "GET" || req.method === "DELETE") {
    if (Object.keys(req.body).length > 0) {
      return res
        .status(400)
        .json({ message: "Body parameters are not allowed" });
    }
  }
  next();
};

// Middleware to enforce Content-Type for POST/PUT requests
const checkContentType = (req, res, next) => {
  if (["POST", "PUT"].includes(req.method)) {
    if (req.headers["content-type"] !== "application/json") {
      return res
        .status(400)
        .json({ message: "Content-Type must be application/json" });
    }
  }
  next();
};

// Middleware to reject empty body in POST/PUT requests
const rejectEmptyBody = (req, res, next) => {
  if (
    ["POST", "PUT"].includes(req.method) &&
    Object.keys(req.body).length === 0
  ) {
    return res.status(400).json({ message: "Request body cannot be empty" });
  }
  next();
};

// Middleware to enforce Authorization header for authenticated routes
const checkAuthorizationHeader = (req, res, next) => {
  if (!req.headers.authorization) {
    return res
      .status(401)
      .json({ message: "Authorization header is required" });
  }
  next();
};

userRoutes.get(
  "/user/self",
  basicAuth,
  noCache,
  noQueryParams,
  hasDisallowedHeaders,
  noBodyParams,
  getUserController
);
userRoutes.post(
  "/user",
  noCache,
  noQueryParams,
  hasDisallowedHeaders,
  checkContentType,
  rejectEmptyBody,
  createUserController
);
userRoutes.put(
  "/user/self",
  basicAuth,
  noCache,
  noQueryParams,
  hasDisallowedHeaders,
  checkContentType,
  rejectEmptyBody,
  updateUserController
);

export default userRoutes;
