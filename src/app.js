import express from "express";
import sequelize from "./config/database.js";
import healthzRoutes from "./routes/healthz.js";
import userRoutes from "./routes/userRoutes.js";
import StatsD from "node-statsd";

const app = express();
app.use(express.json());

// Initialize StatsD client
const statsdClient = new StatsD({
  host: "localhost",
  port: 8125,
});

// Middleware to measure API call count and response time
app.use((req, res, next) => {
  const route = req.route ? req.route.path : req.path;
  const metricPath = route.replace(/\//g, "_");

  // Count each API call
  statsdClient.increment(`api.calls.${metricPath}`);

  // Track response time
  const startTime = process.hrtime();
  res.on("finish", () => {
    const diff = process.hrtime(startTime);
    const durationMs = diff[0] * 1000 + diff[1] / 1e6;
    statsdClient.timing(`api.response_time.${metricPath}`, durationMs);
  });

  next();
});

app.use(healthzRoutes);

app.use("/v1", userRoutes);

sequelize
  .sync()
  .then(() => {
    console.log("Database synced");
  })
  .catch((error) => {
    console.error("Failed to sync database:", error);
  });

export { app, statsdClient };
