import express from "express";
import basicAuth from "../middleware/basicAuth.js";
import {
  getUserController,
  createUserController,
  updateUserController,
} from "../controllers/userController.js";
import logger from "../utils/logger.js";
import { sendMetricToCloudWatch } from "../utils/cloudwatchMetrics.js";
import { verificationController } from "../controllers/verificationController.js";

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
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-forwarded-host",
  "x-forwarded-port",
  "x-amzn-trace-id",
];

// Middleware to check for any disallowed headers
const hasDisallowedHeaders = (req, res, next) => {
  const disallowedHeader = Object.keys(req.headers).find(
    (header) => !allowedHeaders.includes(header.toLowerCase())
  );
  if (disallowedHeader) {
    logger.warn(`Disallowed header: ${disallowedHeader}`);
    sendMetricToCloudWatch("userRoutes.disallowedHeader", 1, "Count");
    return res
      .status(400)
      .json({ message: `Disallowed header: ${disallowedHeader}` });
  }
  next();
};

// Middleware to reject unwanted HTTP methods on specific endpoints
userRoutes.use("/user/self", basicAuth, (req, res, next) => {
  if (
    ["DELETE", "PATCH", "OPTIONS", "HEAD"].includes(req.method) &&
    req.path === "/user/self"
  ) {
    logger.info(`Method ${req.method} not allowed on /user/self`);
    sendMetricToCloudWatch("userRoutes.invalidMethod.user_self", 1, "Count");
    return res.status(405).end();
  }
  next();
});

// Middleware to reject query parameters on POST requests
const noQueryParams = (req, res, next) => {
  if (Object.keys(req.query).length > 0) {
    logger.warn("Query parameters are not allowed in POST requests");
    sendMetricToCloudWatch("userRoutes.queryParamsNotAllowed", 1, "Count");
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

// Middleware to reject body parameters (for GET or DELETE requests)
const noBodyParams = (req, res, next) => {
  if (
    ["GET", "DELETE"].includes(req.method) &&
    Object.keys(req.body).length > 0
  ) {
    logger.warn("Body parameters are not allowed for GET or DELETE requests");
    sendMetricToCloudWatch("userRoutes.bodyParamsNotAllowed", 1, "Count");
    return res.status(400).json({ message: "Body parameters are not allowed" });
  }
  next();
};

// Middleware to enforce Content-Type for POST/PUT requests
const checkContentType = (req, res, next) => {
  if (
    ["POST", "PUT"].includes(req.method) &&
    req.headers["content-type"] !== "application/json"
  ) {
    logger.warn("Content-Type must be application/json for POST/PUT requests");
    sendMetricToCloudWatch("userRoutes.invalidContentType", 1, "Count");
    return res
      .status(400)
      .json({ message: "Content-Type must be application/json" });
  }
  next();
};

// Middleware to reject empty body in POST/PUT requests
const rejectEmptyBody = (req, res, next) => {
  if (
    ["POST", "PUT"].includes(req.method) &&
    Object.keys(req.body).length === 0
  ) {
    logger.warn("Request body cannot be empty for POST/PUT requests");
    sendMetricToCloudWatch("userRoutes.emptyBodyNotAllowed", 1, "Count");
    return res.status(400).json({ message: "Request body cannot be empty" });
  }
  next();
};

// Middleware to enforce Authorization header
const checkAuthorizationHeader = (req, res, next) => {
  if (!req.headers.authorization) {
    logger.warn("Authorization header is required");
    sendMetricToCloudWatch("userRoutes.missingAuthorization", 1, "Count");
    return res
      .status(401)
      .json({ message: "Authorization header is required" });
  }
  next();
};

// Route definitions
userRoutes.get(
  "/user/self",
  basicAuth,
  noCache,
  noQueryParams,
  hasDisallowedHeaders,
  noBodyParams,
  (req, res, next) => {
    sendMetricToCloudWatch("userRoutes.getUserSelf", 1, "Count");
    next();
  },
  getUserController
);

userRoutes.post(
  "/user",
  noCache,
  noQueryParams,
  hasDisallowedHeaders,
  checkContentType,
  rejectEmptyBody,
  (req, res, next) => {
    sendMetricToCloudWatch("userRoutes.createUser", 1, "Count");
    next();
  },
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
  (req, res, next) => {
    sendMetricToCloudWatch("userRoutes.updateUserSelf", 1, "Count");
    next();
  },
  updateUserController
);

userRoutes.get("/user/verify-email", verificationController);

export default userRoutes;
