// import { statsdClient } from "../config/statsd.js";

// const apiMetricsMiddleware = (req, res, next) => {
//   const routePath = req.route ? req.route.path : req.path;
//   const method = req.method.toLowerCase();
//   const metricBase = `${method}.${routePath.replace(/\//g, "_")}`;

//   // Increment call count metric
//   statsdClient.increment(`api.${metricBase}.call_count`);

//   // Track response time
//   const start = process.hrtime();
//   res.on("finish", () => {
//     const diff = process.hrtime(start);
//     const durationMs = diff[0] * 1000 + diff[1] / 1e6;

//     // Track total response time for this endpoint
//     statsdClient.timing(`api.${metricBase}.duration`, durationMs);

//     // Track error count if status code is 4xx or 5xx
//     if (res.statusCode >= 400 && res.statusCode < 600) {
//       statsdClient.increment(`api.${metricBase}.error_count`);
//     }
//   });

//   next();
// };

// export default apiMetricsMiddleware;
