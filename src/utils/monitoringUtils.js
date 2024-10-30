import { statsdClient } from "../config/statsd.js";
import { calculateDuration } from "./timingUtils.js";

export const trackDatabaseQuery = async (queryLabel, dbOperation) => {
  const start = process.hrtime();
  const result = await dbOperation();
  const durationMs = calculateDuration(start);
  statsdClient.timing(`database.query.${queryLabel}.duration`, durationMs);
  return result;
};
