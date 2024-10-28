import express from "express";
const router = express.Router();
import { handleHealthCheck } from "../services/database.js";
import { statsdClient } from "../app.js";

// Middleware to restrict methods
router.use("/healthz", (req, res, next) => {
  if (
    ["POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"].includes(req.method)
  ) {
    res.status(405).end();
  } else {
    next(); // Continue to the next route handler
  }
});

// Route handler for GET
router.use("/healthz", (req, res, next) => {
  const startTime = process.hrtime();

  // Increment call count metric
  statsdClient.increment("api.healthz.call_count");

  // Log request details
  console.log(`Health check requested at ${new Date().toISOString()}`);

  // Capture response time metric
  res.on("finish", () => {
    const diff = process.hrtime(startTime);
    const durationMs = diff[0] * 1000 + diff[1] / 1e6;
    statsdClient.timing("api.healthz.response_time", durationMs);
    console.log(`Health check completed in ${durationMs.toFixed(2)} ms`);
  });

  next();
});

export default router;
