import express from "express";
import sequelize from "./config/database.js";
import healthzRoutes from "./routes/healthz.js";
import userRoutes from "./routes/userRoutes.js";
import {
  closeStatsdClient,
  statsdClient,
  apiMetricsMiddleware,
} from "./config/statsd.js";
import profilePicRoutes from "./routes/profilePicRoutes.js";
import { sendMetricToCloudWatch } from "../src/utils/cloudwatchMetrics.js";

const app = express();
app.use(express.json());

// Use the API metrics middleware for all routes
app.use(apiMetricsMiddleware);

// Middleware to measure API call count and response time
app.use((req, res, next) => {
  const route = req.route ? req.route.path : req.path;
  const metricPath = route.replace(/\//g, "_");

  // Count each API call
  statsdClient.increment(`api.calls.${metricPath}`);
  sendMetricToCloudWatch(`api.calls.${metricPath}`, 1, "Count");

  // Track response time
  const startTime = process.hrtime();
  res.on("finish", () => {
    const diff = process.hrtime(startTime);
    const durationMs = diff[0] * 1000 + diff[1] / 1e6;
    statsdClient.timing(`api.response_time.${metricPath}`, durationMs);
    sendMetricToCloudWatch(
      `api.response_time.${metricPath}`,
      durationMs,
      "Milliseconds"
    );
  });

  next();
});

app.use(healthzRoutes);

app.use("/v1", userRoutes);

app.use("/v1", profilePicRoutes);

sequelize
  .sync()
  .then(() => {
    console.log("Database synced");
    sendMetricToCloudWatch("database.sync.success", 1, "Count");
  })
  .catch((error) => {
    console.error("Failed to sync database:", error);
    sendMetricToCloudWatch("database.sync.error", 1, "Count");
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("API Error:", err);
  sendMetricToCloudWatch("api.errors", 1, "Count"); // Track errors in CloudWatch
  res.status(500).send("Internal Server Error");
});

// Close StatsD client when the application shuts down
process.on("exit", () => {
  closeStatsdClient();
});

export default app;
