import {
  getUserData,
  createUser,
  updateUserDetails,
} from "../services/userService.js";
import { statsdClient } from "../app.js";
import { calculateDuration } from "../utils/timingUtils.js";
import logger from "../utils/logger.js";

/**
 * @desc Get user data based on the authenticated user's ID
 * @route GET /user/self
 * @access Private
 */
export const getUserController = async (req, res) => {
  const start = process.hrtime(); // Start timing for performance tracking
  logger.info(
    `Received GET request to retrieve user data for user ID: ${req.user.id}`
  );

  try {
    const userData = await getUserData(req.user.id);
    const durationMs = calculateDuration(start); // Calculate duration for StatsD
    statsdClient.timing("api.user.get.duration", durationMs);

    if (!userData) {
      logger.warn(`User data not found for user ID: ${req.user.id}`);
      return res.status(404).json({ message: "User not found" });
    }

    logger.info(`User data successfully retrieved for user ID: ${req.user.id}`);
    res.json(userData);
  } catch (error) {
    logger.error(`GET User Error for user ID ${req.user.id}: ${error.message}`);
    console.error("GET User Error:", error);
    res.status(500).json({ message: "Internal Server Error" }); // Handle unexpected errors
  }
};

/**
 * @desc Create a new user
 * @route POST /user
 * @access Public
 */
export const createUserController = async (req, res) => {
  const start = process.hrtime(); // Start timing for performance tracking
  logger.info(
    `Received POST request to create a new user with email: ${req.body.email}`
  );

  try {
    const userData = await createUser(req.body); // Attempt to create a new user
    const durationMs = calculateDuration(start); // Calculate duration for StatsD
    statsdClient.timing("api.user.create.duration", durationMs);

    logger.info(`User created successfully with email: ${req.body.email}`);
    res.status(200).json(userData); // Return the created user's data
  } catch (error) {
    const durationMs = calculateDuration(start); // Calculate duration in case of error
    statsdClient.timing("api.user.create.error.duration", durationMs);

    if (error.name === "SequelizeUniqueConstraintError") {
      logger.warn(
        `User creation failed. User already exists with email: ${req.body.email}`
      );
      console.error("User already exists:", error);
      res.status(400).json({ message: "User already exists" });
    } else {
      // Handle unexpected errors
      logger.error(
        `Create User Error for email ${req.body.email}: ${error.message}`
      );
      console.error("Create User Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

/**
 * @desc Update details of the authenticated user
 * @route PUT /user/self
 * @access Private
 */
export const updateUserController = async (req, res) => {
  const start = process.hrtime(); // Start timing for performance tracking
  logger.info(
    `Received PUT request to update user data for user ID: ${req.user.id}`
  );

  try {
    const updatedUserData = await updateUserDetails(req.user.id, req.body); // Attempt to update user details
    const durationMs = calculateDuration(start); // Calculate duration for StatsD
    statsdClient.timing("api.user.update.duration", durationMs);

    // If no changes were detected, log and respond with a 400 status
    if (updatedUserData === null) {
      logger.warn(`No changes detected for user ID: ${req.user.id}`);
      return res.status(400).json({ message: "No changes detected" });
    }

    logger.info(`User data updated successfully for user ID: ${req.user.id}`);
    res.status(204).json(updatedUserData); // Return the updated user data with no content status
  } catch (error) {
    const durationMs = calculateDuration(start); // Calculate duration in case of error
    statsdClient.timing("api.user.update.error.duration", durationMs);

    if (error.message.startsWith("Invalid fields")) {
      // If invalid fields are provided, respond with a 400 status
      logger.warn(
        `Update User Error: Invalid fields in request for user ID: ${req.user.id}`
      );
      return res.status(400).json({ message: error.message });
    }

    // Handle unexpected errors
    logger.error(
      `Update User Error for user ID ${req.user.id}: ${error.message}`
    );
    console.error("Update User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
