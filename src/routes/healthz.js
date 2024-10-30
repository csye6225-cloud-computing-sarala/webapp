import express from "express";
const router = express.Router();
import { handleHealthCheck } from "../services/database.js";
import { statsdClient } from "../app.js";
import logger from "../utils/logger.js";
import { calculateDuration } from "../utils/timingUtils.js";

// Middleware to restrict HTTP methods on /healthz
router.use("/healthz", (req, res, next) => {
  if (
    ["POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"].includes(req.method)
  ) {
    logger.warn(`Method ${req.method} not allowed on /healthz`);
    res.status(405).end();
  } else {
    next(); // Continue to the next route handler
  }
});

// Route handler for GET requests on /healthz with monitoring
router.use("/healthz", (req, res, next) => {
  const startTime = process.hrtime();

  // Track the health check API call count
  statsdClient.increment("api.healthz.call_count");
  logger.info(`Health check requested at ${new Date().toISOString()}`);

  // Capture and log the response time after response is sent
  res.on("finish", () => {
    const durationMs = calculateDuration(startTime);
    statsdClient.timing("api.healthz.response_time", durationMs);
    logger.info(`Health check completed in ${durationMs.toFixed(2)} ms`);
  });

  next();
});

// Handle the actual health check logic
router.get("/healthz", handleHealthCheck);

export default router;
