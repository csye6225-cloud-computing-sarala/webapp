import multer from "multer";
import logger from "../utils/logger.js";
import {
  uploadProfilePicService,
  getProfilePicService,
  deleteProfilePicService,
} from "../services/profilePicService.js";

const upload = multer({ storage: multer.memoryStorage() }).single("profilePic");

/**
 * @desc Uploads a profile picture to S3 and saves metadata in the database
 * @route POST /user/self/pic
 * @access Private
 */
export const uploadProfilePic = async (req, res, next) => {
  try {
    await uploadProfilePicService(req);
    res.status(201).json({ message: "Profile picture uploaded successfully" });
  } catch (error) {
    logger.error("Error uploading profile picture:", error);
    next(error);
  }
};

/**
 * @desc Retrieves the profile picture metadata for the authenticated user
 * @route GET /user/self/pic
 * @access Private
 */
export const getProfilePic = async (req, res, next) => {
  try {
    const profilePic = await getProfilePicService(req.user.id);
    res.status(200).json(profilePic);
  } catch (error) {
    logger.error("Error retrieving profile picture:", error);
    next(error);
  }
};

/**
 * @desc Deletes the profile picture from S3 and removes metadata from the database
 * @route DELETE /user/self/pic
 * @access Private
 */
export const deleteProfilePic = async (req, res, next) => {
  try {
    await deleteProfilePicService(req.user.id);
    logger.info(
      `Profile picture deleted successfully for user ID: ${req.user.id}`
    );
    res.status(204).end();
  } catch (error) {
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
