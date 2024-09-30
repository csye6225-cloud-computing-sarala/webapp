import express from "express";
import basicAuth from "../middleware/basicAuth.js";
import {
  getUserController,
  createUserController,
  updateUserController,
} from "../controllers/userController.js";

const userRoutes = express.Router();

// Middleware to reject unwanted HTTP methods on specific endpoints
userRoutes.use("/user/self", basicAuth, (req, res, next) => {
  if (["DELETE", "PATCH", "OPTIONS", "HEAD"].includes(req.method)) {
    return res.status(405).end();
  }
  next();
});

// Routes for user self-management and user creation
userRoutes.get("/user/self", basicAuth, getUserController); // Fetch authenticated user's data
userRoutes.post("/user", createUserController); // Create a new user
userRoutes.put("/user/self", basicAuth, updateUserController); // Update authenticated user's data

export default userRoutes;
