import multer from "multer";
import logger from "../utils/logger.js";
import {
  uploadProfilePicService,
  getProfilePicService,
  deleteProfilePicService,
} from "../services/profilePicService.js";
import { calculateDuration } from "../utils/timingUtils.js";
import { sendMetricToCloudWatch } from "../utils/cloudwatchMetrics.js";

const upload = multer({ storage: multer.memoryStorage() }).single("profilePic");

/**
 * @desc Uploads a profile picture to S3 and saves metadata in the database
 * @route POST /user/self/pic
 * @access Private
 */
export const uploadProfilePic = async (req, res, next) => {
  const start = process.hrtime();
  try {
    await uploadProfilePicService(req);
    const durationMs = calculateDuration(start);

    sendMetricToCloudWatch("profilepic.upload.success", 1, "Count");
    sendMetricToCloudWatch(
      "profilepic.upload.duration",
      durationMs,
      "Milliseconds"
    );

    logger.info("Profile picture uploaded successfully");
    res.status(201).json({ message: "Profile picture uploaded successfully" });
  } catch (error) {
    const durationMs = calculateDuration(start);
    sendMetricToCloudWatch("profilepic.upload.error", 1, "Count");
    sendMetricToCloudWatch(
      "profilepic.upload.error.duration",
      durationMs,
      "Milliseconds"
    );

    logger.error("Error uploading profile picture:", error);
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc Retrieves the profile picture metadata for the authenticated user
 * @route GET /user/self/pic
 * @access Private
 */
export const getProfilePic = async (req, res, next) => {
  const start = process.hrtime();
  try {
    const profilePic = await getProfilePicService(req.user.id);
    const durationMs = calculateDuration(start);

    sendMetricToCloudWatch("profilepic.get.success", 1, "Count");
    sendMetricToCloudWatch(
      "profilepic.get.duration",
      durationMs,
      "Milliseconds"
    );

    logger.info("Profile picture retrieved successfully");
    res.status(200).json(profilePic);
  } catch (error) {
    const durationMs = calculateDuration(start);
    sendMetricToCloudWatch("profilepic.get.error", 1, "Count");
    sendMetricToCloudWatch(
      "profilepic.get.error.duration",
      durationMs,
      "Milliseconds"
    );

    logger.error("Error retrieving profile picture:", error);
    res.status(404).json({ message: error.message });
  }
};

/**
 * @desc Deletes the profile picture from S3 and removes metadata from the database
 * @route DELETE /user/self/pic
 * @access Private
 */
export const deleteProfilePic = async (req, res, next) => {
  const start = process.hrtime();
  try {
    await deleteProfilePicService(req.user.id);
    const durationMs = calculateDuration(start);

    sendMetricToCloudWatch("profilepic.delete.success", 1, "Count");
    sendMetricToCloudWatch(
      "profilepic.delete.duration",
      durationMs,
      "Milliseconds"
    );
    logger.info(
      `Profile picture deleted successfully for user ID: ${req.user.id}`
    );
    res.status(204).end();
  } catch (error) {
    const durationMs = calculateDuration(start);
    sendMetricToCloudWatch("profilepic.delete.error", 1, "Count");
    sendMetricToCloudWatch(
      "profilepic.delete.error.duration",
      durationMs,
      "Milliseconds"
    );

    if (error.message === "Profile picture not found") {
      logger.warn(
        `Attempted to delete a non-existing profile picture for user ID: ${req.user.id}`
      );
      res.status(404).json({ message: "Profile picture not found" });
    } else {
      logger.error(
        `Error deleting profile picture for user ID ${req.user.id}: ${error.message}`
      );
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};
