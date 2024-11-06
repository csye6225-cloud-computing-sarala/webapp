import sequelize from "../config/database.js";
import logger from "../utils/logger.js";
import { statsdClient } from "../config/statsd.js";
import { calculateDuration } from "../utils/timingUtils.js";
import { sendMetricToCloudWatch } from "../utils/cloudwatchMetrics.js";

/**
 * @desc Handles health check by verifying database connection and ensuring request headers are valid
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
async function handleHealthCheck(req, res) {
  const start = process.hrtime();
  logger.info("Starting health check");

  // Define allowed headers
  const allowedHeaders = [
    "user-agent",
    "accept",
    "postman-token",
    "host",
    "accept-encoding",
    "connection",
    "x-forwarded-for",
    "x-forwarded-proto",
    "x-forwarded-host",
    "x-forwarded-port",
  ];

  logger.debug("Received headers:", req.headers);
  console.log("Received headers:", req.headers);

  // Check for any disallowed headers
  const hasDisallowedHeaders = Object.keys(req.headers).some(
    (header) => !allowedHeaders.includes(header.toLowerCase())
  );

  // If there are disallowed headers, query parameters, or body content, return a 400 error
  if (
    Object.keys(req.query).length > 0 ||
    Object.keys(req.body).length > 0 ||
    hasDisallowedHeaders
  ) {
    logger.warn(
      "Invalid request: Disallowed headers or unexpected query/body parameters"
    );
    res.setHeader("Cache-Control", "no-cache");
    sendMetricToCloudWatch("healthCheck.invalid_request", 1, "Count");
    return res.status(400).end();
  }
  try {
    // Attempt to authenticate with the database
    await sequelize.authenticate();
    const durationMs = calculateDuration(start);
    statsdClient.timing("database.healthCheck.duration", durationMs);
    sendMetricToCloudWatch("database.healthCheck.success", 1, "Count"); // Track successful health check
    sendMetricToCloudWatch(
      "database.healthCheck.duration",
      durationMs,
      "Milliseconds"
    ); // Track health check duration

    logger.info("Database connection verified successfully");
    res.setHeader("Cache-Control", "no-cache");
    res.status(200).end();
  } catch (error) {
    // Log and track database connectivity issues
    const durationMs = calculateDuration(start);
    statsdClient.timing("database.healthCheck.duration", durationMs);
    sendMetricToCloudWatch("database.healthCheck.failure", 1, "Count"); // Track failed health check
    sendMetricToCloudWatch(
      "database.healthCheck.duration",
      durationMs,
      "Milliseconds"
    ); // Track health check duration for failure

    logger.error("Database connection failed:", error);
    console.error("Unable to connect to the database:", error);
    res.setHeader("Cache-Control", "no-cache");
    res.status(503).end();
  }
}

export { handleHealthCheck };
