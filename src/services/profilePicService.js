import { uploadToS3, deleteFromS3 } from "../config/statsd.js";
import Image from "../models/Image.js";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import logger from "../utils/logger.js";
import { calculateDuration } from "../utils/timingUtils.js";
import { trackDatabaseQuery } from "../utils/monitoringUtils.js";

const upload = multer({ storage: multer.memoryStorage() }).single("profilePic");

/**
 * @desc Service to upload a profile picture to S3 and save metadata in the database
 * @param {object} req - Express request object
 */
export const uploadProfilePicService = async (req) => {
  return new Promise((resolve, reject) => {
    upload(req, null, async (err) => {
      if (err) return reject(new Error("File upload error"));

      const { file } = req;
      if (
        !file ||
        !["image/png", "image/jpg", "image/jpeg"].includes(file.mimetype)
      ) {
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
          // Delete the existing picture from S3
          const deleteParams = {
            Bucket: process.env.S3_BUCKET,
            Key: `profile-pics/${existingProfilePic.file_name}`,
          };
          await deleteFromS3(deleteParams);
          await trackDatabaseQuery("Image.destroy", () =>
            existingProfilePic.destroy()
          );
          logger.info(
            `Existing profile picture deleted for user ID: ${req.user.id}`
          );
        }

        await uploadToS3(uploadParams); // Upload to S3

        await trackDatabaseQuery("Image.create", () =>
          Image.create({
            user_id: req.user.id,
            file_name: fileName,
            url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/profile-pics/${fileName}`,
            upload_date: new Date(),
          })
        );

        logger.info(
          `Profile picture uploaded successfully for user ID: ${req.user.id}`
        );
        resolve();
      } catch (error) {
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
  const profilePic = await trackDatabaseQuery("Image.findOne", () =>
    Image.findOne({ where: { user_id: userId } })
  );

  if (!profilePic) {
    throw new Error("Profile picture not found");
  }

  logger.info(`Profile picture retrieved successfully for user ID: ${userId}`);
  return profilePic;
};

/**
 * @desc Service to delete the profile picture from S3 and remove metadata from the database
 * @param {string} userId - User ID
 */
export const deleteProfilePicService = async (userId) => {
  const profilePic = await trackDatabaseQuery("Image.findOne", () =>
    Image.findOne({ where: { user_id: userId } })
  );

  if (!profilePic) {
    throw new Error("Profile picture not found");
  }

  const deleteParams = {
    Bucket: process.env.S3_BUCKET,
    Key: `profile-pics/${profilePic.file_name}`,
  };

  const response = await deleteFromS3(deleteParams); // Delete from S3
  logger.info(`S3 Delete Response: ${JSON.stringify(response)}`);

  await trackDatabaseQuery("Image.destroy", () => profilePic.destroy());

  logger.info(`Profile picture deleted successfully for user ID: ${userId}`);
};
