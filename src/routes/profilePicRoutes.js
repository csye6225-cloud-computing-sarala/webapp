import express from "express";
import {
  uploadProfilePic,
  getProfilePic,
  deleteProfilePic,
} from "../controllers/profilePicController.js";
import basicAuth from "../middleware/basicAuth.js";
import logger from "../utils/logger.js";
import { calculateDuration } from "../utils/timingUtils.js";
import { sendMetricToCloudWatch } from "../utils/cloudwatchMetrics.js";

const profilePicRoutes = express.Router();

/**
 * @route POST /user/self/pic
 * @description Uploads a profile picture for the authenticated user.
 * Requires the user to be authenticated.
 */
profilePicRoutes.post("/user/self/pic", basicAuth, async (req, res, next) => {
  try {
    await uploadProfilePic(req, res);

    const durationMs = calculateDuration(start);
    sendMetricToCloudWatch("api.profilepic.upload.success", 1, "Count");
    sendMetricToCloudWatch(
      "api.profilepic.upload.duration",
      durationMs,
      "Milliseconds"
    );
  } catch (error) {
    const durationMs = calculateDuration(start);
    sendMetricToCloudWatch("api.profilepic.upload.error", 1, "Count");
    sendMetricToCloudWatch(
      "api.profilepic.upload.error.duration",
      durationMs,
      "Milliseconds"
    );

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

    const durationMs = calculateDuration(start);
    sendMetricToCloudWatch("api.profilepic.get.success", 1, "Count");
    sendMetricToCloudWatch(
      "api.profilepic.get.duration",
      durationMs,
      "Milliseconds"
    );

    logger.info("Profile picture retrieved successfully");
  } catch (error) {
    const durationMs = calculateDuration(start);
    sendMetricToCloudWatch("api.profilepic.get.error", 1, "Count");
    sendMetricToCloudWatch(
      "api.profilepic.get.error.duration",
      durationMs,
      "Milliseconds"
    );

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

    const durationMs = calculateDuration(start);
    sendMetricToCloudWatch("api.profilepic.delete.success", 1, "Count");
    sendMetricToCloudWatch(
      "api.profilepic.delete.duration",
      durationMs,
      "Milliseconds"
    );

    logger.info("Profile picture deleted successfully");
  } catch (error) {
    const durationMs = calculateDuration(start);
    sendMetricToCloudWatch("api.profilepic.delete.error", 1, "Count");
    sendMetricToCloudWatch(
      "api.profilepic.delete.error.duration",
      durationMs,
      "Milliseconds"
    );

    logger.error("Error deleting profile picture:", error);
    next(error); // Pass error to error-handling middleware
  }
});

export default profilePicRoutes;
