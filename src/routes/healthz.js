import express from "express";
const router = express.Router();
import { handleHealthCheck } from "../services/database.js";
import logger from "../utils/logger.js";

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
// Route handler for GET
router.get("/healthz", handleHealthCheck);

export default router;
