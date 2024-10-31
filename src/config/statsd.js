import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import StatsD from "node-statsd";

// Initialize StatsD client with a namespace
const statsdClient = new StatsD({
  host: "localhost",
  port: 8125,
  prefix: "csye6225.",
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

// Middleware to track API calls and duration
export const apiMetricsMiddleware = (req, res, next) => {
  const routePath = req.route ? req.route.path : req.path;
  const method = req.method.toLowerCase();
  const metricBase = `api.${method}.${routePath.replace(/\//g, "_")}`;

  // Count API call
  statsdClient.increment(`${metricBase}.call_count`);

  // Start timing the API response
  const start = process.hrtime();
  res.on("finish", () => {
    const diff = process.hrtime(start);
    const durationMs = diff[0] * 1000 + diff[1] / 1e6;
    statsdClient.timing(`${metricBase}.duration`, durationMs);
  });

  next();
};

// Helper function to track database query duration
export const trackDatabaseQuery = async (queryName, queryFunction) => {
  const start = process.hrtime();
  try {
    const result = await queryFunction();
    const diff = process.hrtime(start);
    const durationMs = diff[0] * 1000 + diff[1] / 1e6;
    statsdClient.timing(`db.${queryName}.duration`, durationMs);
    return result;
  } catch (error) {
    statsdClient.increment(`db.${queryName}.error_count`);
    throw error;
  }
};

// Helper function to measure S3 operation duration with StatsD
async function withStatsD(operation, label, command) {
  const start = process.hrtime();
  try {
    const response = await s3Client.send(command);
    const diff = process.hrtime(start);
    const durationMs = diff[0] * 1000 + diff[1] / 1e6;
    statsdClient.timing(`${label}.duration`, durationMs);
    statsdClient.increment(`${label}.success`);
    return response;
  } catch (error) {
    statsdClient.increment(`${label}.error`);
    throw error;
  }
}

// Wrapped S3 operations with StatsD metrics
export const uploadToS3 = (params) =>
  withStatsD("s3.upload", "upload", new PutObjectCommand(params));

export const deleteFromS3 = (params) =>
  withStatsD("s3.delete", "delete", new DeleteObjectCommand(params));

// Function to close StatsD client
function closeStatsdClient() {
  statsdClient.close();
  statsdClient.socket.unref();
}

export { statsdClient, closeStatsdClient };
