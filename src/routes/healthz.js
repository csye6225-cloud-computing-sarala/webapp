import express from "express";
const router = express.Router();
import { handleHealthCheck } from "../services/database.js";

router.get("/healthz", handleHealthCheck);

router.use("/healthz", (req, res) => {
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    res.status(405).end();
  }
});

export default router;
