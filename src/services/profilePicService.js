import {
  uploadToS3,
  deleteFromS3,
  trackDatabaseQuery,
} from "../config/statsd.js";
import Image from "../models/Image.js";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import logger from "../utils/logger.js";
import { calculateDuration } from "../utils/timingUtils.js";
import { sendMetricToCloudWatch } from "../utils/cloudwatchMetrics.js";

const upload = multer({ storage: multer.memoryStorage() }).single("profilePic");

/**
 * @desc Service to upload a profile picture to S3 and save metadata in the database
 * @param {object} req - Express request object
 */
export const uploadProfilePicService = async (req) => {
  const start = process.hrtime();
  return new Promise((resolve, reject) => {
    upload(req, null, async (err) => {
      if (err) {
        sendMetricToCloudWatch("profilepic.upload.error", 1, "Count");
        return reject(new Error("File upload error"));
      }

      const { file } = req;
      if (
        !file ||
        !["image/png", "image/jpg", "image/jpeg"].includes(file.mimetype)
      ) {
        sendMetricToCloudWatch(
          "profilepic.upload.error.unsupported_file_type",
          1,
          "Count"
        );
        return reject(new Error("Unsupported file type"));
      }

      const fileName = `${uuidv4()}-${file.originalname}`;
      const uploadParams = {
        Bucket: process.env.S3_BUCKET,
        Key: `profile-pics/${fileName}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      try {
        const existingProfilePic = await trackDatabaseQuery(
          "Image.findOne",
          () => Image.findOne({ where: { user_id: req.user.id } })
        );

        if (existingProfilePic) {
          sendMetricToCloudWatch(
            "profilepic.upload.error.already_exists",
            1,
            "Count"
          );
          // Send an error response if an image already exists
          return reject(
            new Error(
              "Profile picture already exists. Please delete the existing picture before uploading a new one."
            )
          );
        }

        await uploadToS3(uploadParams); // Upload to S3
        sendMetricToCloudWatch("profilepic.upload.s3.success", 1, "Count");

        await trackDatabaseQuery("Image.create", () =>
          Image.create({
            user_id: req.user.id,
            file_name: fileName,
            url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/profile-pics/${fileName}`,
            upload_date: new Date(),
          })
        );

        const durationMs = calculateDuration(start);
        sendMetricToCloudWatch(
          "profilepic.upload.duration",
          durationMs,
          "Milliseconds"
        );
        sendMetricToCloudWatch("profilepic.upload.success", 1, "Count");

        logger.info(
          `Profile picture uploaded successfully for user ID: ${req.user.id}`
        );
        resolve();
      } catch (error) {
        sendMetricToCloudWatch("profilepic.upload.error", 1, "Count");
        logger.error(
          `S3 Upload Error for user ID ${req.user.id}: ${error.message}`
        );
        reject(error);
      }
    });
  });
};

/**
 * @desc Service to retrieve the profile picture metadata
 * @param {string} userId - User ID
 * @returns {object} Profile picture metadata
 */
export const getProfilePicService = async (userId) => {
  const start = process.hrtime();
  try {
    const profilePic = await trackDatabaseQuery("Image.findOne", () =>
      Image.findOne({ where: { user_id: userId } })
    );

    if (!profilePic) {
      sendMetricToCloudWatch("profilepic.get.error.not_found", 1, "Count");
      throw new Error("Profile picture not found");
    }

    const durationMs = calculateDuration(start);
    sendMetricToCloudWatch("profilepic.get.success", 1, "Count");
    sendMetricToCloudWatch(
      "profilepic.get.duration",
      durationMs,
      "Milliseconds"
    );

    logger.info(
      `Profile picture retrieved successfully for user ID: ${userId}`
    );
    return profilePic;
  } catch (error) {
    sendMetricToCloudWatch("profilepic.get.error", 1, "Count");
    logger.error(
      `Error retrieving profile picture for user ID ${userId}: ${error.message}`
    );
    throw error;
  }
};

/**
 * @desc Service to delete the profile picture from S3 and remove metadata from the database
 * @param {string} userId - User ID
 */
export const deleteProfilePicService = async (userId) => {
  const start = process.hrtime();

  try {
    const profilePic = await trackDatabaseQuery("Image.findOne", () =>
      Image.findOne({ where: { user_id: userId } })
    );

    if (!profilePic) {
      sendMetricToCloudWatch("profilepic.delete.error.not_found", 1, "Count");
      throw new Error("Profile picture not found");
    }

    const deleteParams = {
      Bucket: process.env.S3_BUCKET,
      Key: `profile-pics/${profilePic.file_name}`,
    };

    await deleteFromS3(deleteParams); // Delete from S3
    sendMetricToCloudWatch("profilepic.delete.s3.success", 1, "Count");

    await trackDatabaseQuery("Image.destroy", () => profilePic.destroy());
    sendMetricToCloudWatch("profilepic.delete.success", 1, "Count");

    const durationMs = calculateDuration(start);
    sendMetricToCloudWatch(
      "profilepic.delete.duration",
      durationMs,
      "Milliseconds"
    );

    logger.info(`Profile picture deleted successfully for user ID: ${userId}`);
  } catch (error) {
    sendMetricToCloudWatch("profilepic.delete.error", 1, "Count");
    logger.error(
      `Error deleting profile picture for user ID ${userId}: ${error.message}`
    );
    throw error;
  }
};
