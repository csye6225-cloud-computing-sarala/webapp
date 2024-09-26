import express from "express";
const router = express.Router();
import { handleHealthCheck } from "../services/database.js";

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
router.get("/healthz", handleHealthCheck);

export default router;
