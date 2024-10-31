// import { statsdClient } from "../config/statsd.js";
// import { calculateDuration } from "./timingUtils.js";

// export const trackDatabaseQuery = async (queryLabel, dbOperation) => {
//   const start = process.hrtime();
//   try {
//     const result = await queryFunction();
//     const diff = process.hrtime(start);
//     const durationMs = diff[0] * 1000 + diff[1] / 1e6;

//     // Track the query execution time in StatsD
//     statsdClient.timing(`db.${queryName}.duration`, durationMs);
//     return result;
//   } catch (error) {
//     // Log any error in the StatsD metrics
//     statsdClient.increment(`db.${queryName}.error_count`);
//     throw error;
//   }
// };
