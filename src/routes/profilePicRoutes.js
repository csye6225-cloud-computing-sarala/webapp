import express from "express";
import {
  uploadProfilePic,
  getProfilePic,
  deleteProfilePic,
} from "../controllers/profilePicController.js";
import basicAuth from "../middleware/basicAuth.js";
import logger from "../utils/logger.js";

const profilePicRoutes = express.Router();

/**
 * @route POST /user/self/pic
 * @description Uploads a profile picture for the authenticated user.
 * Requires the user to be authenticated.
 */
profilePicRoutes.post("/user/self/pic", basicAuth, async (req, res, next) => {
  try {
    await uploadProfilePic(req, res);
  } catch (error) {
    logger.error("Error uploading profile picture:", error);
    next(error); // Pass error to error-handling middleware
  }
});

/**
 * @route GET /user/self/pic
 * @description Retrieves the profile picture metadata for the authenticated user.
 * Requires the user to be authenticated.
 */
profilePicRoutes.get("/user/self/pic", basicAuth, async (req, res, next) => {
  try {
    await getProfilePic(req, res);
  } catch (error) {
    logger.error("Error retrieving profile picture:", error);
    next(error); // Pass error to error-handling middleware
  }
});

/**
 * @route DELETE /user/self/pic
 * @description Deletes the profile picture for the authenticated user.
 * Requires the user to be authenticated.
 */
profilePicRoutes.delete("/user/self/pic", basicAuth, async (req, res, next) => {
  try {
    await deleteProfilePic(req, res);
  } catch (error) {
    logger.error("Error deleting profile picture:", error);
    next(error); // Pass error to error-handling middleware
  }
});

export default profilePicRoutes;
