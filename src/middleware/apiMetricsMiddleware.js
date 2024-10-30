import { statsdClient } from "../config/statsd.js";

const apiMetricsMiddleware = (req, res, next) => {
  const routePath = req.route ? req.route.path : req.path;
  const metricBase = routePath.replace(/\//g, "_");

  // Increment call count metric
  statsdClient.increment(`api.${metricBase}.call_count`);

  // Track response time
  const start = process.hrtime();
  res.on("finish", () => {
    const diff = process.hrtime(start);
    const durationMs = diff[0] * 1000 + diff[1] / 1e6;
    statsdClient.timing(`api.${metricBase}.duration`, durationMs);
  });

  next();
};

export default apiMetricsMiddleware;
