import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { trackDatabaseQuery } from "../config/statsd.js";
import logger from "../utils/logger.js";
import { sendMetricToCloudWatch } from "../utils/cloudwatchMetrics.js";
import { calculateDuration } from "../utils/timingUtils.js";
import { isTokenExpired } from "../utils/tokenUtils.js";
import validator from "validator";

/**
 * @desc Fetch user data excluding the password field
 * @param {string} userId - The ID of the user
 * @returns {object|null} User data or null if not found
 */
export const getUserData = async (userId) => {
  logger.info(`Fetching user data for user ID: ${userId}`);
  const start = process.hrtime();

  try {
    const user = await trackDatabaseQuery("getUserData", async () =>
      User.findByPk(userId, { attributes: { exclude: ["password"] } })
    );

    const durationMs = calculateDuration(start);
    sendMetricToCloudWatch(
      "database.getUserData.duration",
      durationMs,
      "Milliseconds"
    );

    if (user) {
      logger.info(`User data retrieved successfully for user ID: ${userId}`);
      sendMetricToCloudWatch("database.getUserData.success", 1, "Count");
      return user.get({ plain: true });
    } else {
      logger.warn(`User not found for user ID: ${userId}`);
      sendMetricToCloudWatch("database.getUserData.not_found", 1, "Count");
      return null;
    }
  } catch (error) {
    logger.error(
      `Error fetching user data for user ID ${userId}: ${error.message}`
    );
    sendMetricToCloudWatch("database.getUserData.error", 1, "Count");
    throw error;
  }
};

/**
 * @desc Create a new user with hashed password
 * @param {object} userData - User data including first_name, last_name, email, and password
 * @returns {object} Created user data excluding the password
 */
export const createUser = async (userData) => {
  const { email } = userData;

  // Validate email
  if (!validator.isEmail(email)) {
    throw new Error("Invalid email format");
  }
  logger.info(`Creating a new user with email: ${userData.email}`);
  const start = process.hrtime();

  try {
    const { first_name, last_name, email, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await trackDatabaseQuery("createUser", async () =>
      User.create({
        first_name,
        last_name,
        email,
        password: hashedPassword,
        isVerified: false,
      })
    );

    const durationMs = calculateDuration(start);
    sendMetricToCloudWatch(
      "database.createUser.duration",
      durationMs,
      "Milliseconds"
    );

    logger.info(`User created successfully with email: ${email}`);
    sendMetricToCloudWatch("database.createUser.success", 1, "Count");

    const { password: _, ...userWithoutPassword } = user.get({ plain: true });
    return userWithoutPassword;
  } catch (error) {
    const durationMs = calculateDuration(start);
    sendMetricToCloudWatch(
      "database.createUser.error.duration",
      durationMs,
      "Milliseconds"
    );
    logger.error(
      `Error creating user with email ${userData.email}: ${error.message}`
    );
    sendMetricToCloudWatch("database.createUser.error", 1, "Count");
    throw error;
  }
};

/**
 * @desc Update user details if changes are detected
 * @param {string} userId - The ID of the user
 * @param {object} updates - Fields to update (first_name, last_name, password)
 * @returns {object|null} Updated user data or null if no changes were detected
 */
export const updateUserDetails = async (userId, updates) => {
  logger.info(`Updating user details for user ID: ${userId}`);
  const start = process.hrtime();

  try {
    const user = await trackDatabaseQuery("findByPk", async () =>
      User.findByPk(userId)
    );

    if (!user) {
      logger.warn(`User not found for user ID: ${userId}`);
      sendMetricToCloudWatch(
        "database.updateUserDetails.not_found",
        1,
        "Count"
      );
      return null;
    }

    const { first_name, last_name, password } = updates;

    // Check for unsupported fields
    const allowedFields = ["first_name", "last_name", "password"];
    const invalidFields = Object.keys(updates).filter(
      (key) => !allowedFields.includes(key)
    );
    if (invalidFields.length > 0) {
      const message = `Invalid fields: ${invalidFields.join(", ")}`;
      logger.warn(message);
      throw new Error(message);
    }

    // Check if any changes were made
    const isSameData =
      (!first_name || first_name === user.first_name) &&
      (!last_name || last_name === user.last_name) &&
      (!password || (await bcrypt.compare(password, user.password)));

    if (isSameData) {
      logger.info(`No changes detected for user ID: ${userId}`);
      sendMetricToCloudWatch(
        "database.updateUserDetails.no_change",
        1,
        "Count"
      );
      return null;
    }

    // Update only if there are changes
    if (first_name && first_name !== user.first_name) {
      user.first_name = first_name;
    }
    if (last_name && last_name !== user.last_name) {
      user.last_name = last_name;
    }
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await trackDatabaseQuery("saveUser", async () =>
      user.save()
    );

    const durationMs = calculateDuration(start);
    sendMetricToCloudWatch(
      "database.updateUserDetails.duration",
      durationMs,
      "Milliseconds"
    );

    logger.info(`User details updated successfully for user ID: ${userId}`);
    sendMetricToCloudWatch("database.updateUserDetails.success", 1, "Count");

    const userWithoutPassword = updatedUser.get({
      plain: true,
      attributes: { exclude: ["password"] },
    });
    return userWithoutPassword;
  } catch (error) {
    const durationMs = calculateDuration(start);
    sendMetricToCloudWatch(
      "database.updateUserDetails.error.duration",
      durationMs,
      "Milliseconds"
    );
    logger.error(
      `Error updating user details for user ID ${userId}: ${error.message}`
    );
    sendMetricToCloudWatch("database.updateUserDetails.error", 1, "Count");
    throw error;
  }
};
