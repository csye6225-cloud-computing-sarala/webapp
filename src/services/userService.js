import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { trackDatabaseQuery } from "../utils/monitoringUtils.js";
import logger from "../utils/logger.js";

/**
 * @desc Fetch user data excluding the password field
 * @param {string} userId - The ID of the user
 * @returns {object|null} User data or null if not found
 */
export const getUserData = async (userId) => {
  logger.info(`Fetching user data for user ID: ${userId}`);

  try {
    const user = await trackDatabaseQuery("getUserData", async () =>
      User.findByPk(userId, { attributes: { exclude: ["password"] } })
    );

    if (user) {
      logger.info(`User data retrieved successfully for user ID: ${userId}`);
      return user.get({ plain: true });
    } else {
      logger.warn(`User not found for user ID: ${userId}`);
      return null;
    }
  } catch (error) {
    logger.error(
      `Error fetching user data for user ID ${userId}: ${error.message}`
    );
    throw error;
  }
};

/**
 * @desc Create a new user with hashed password
 * @param {object} userData - User data including first_name, last_name, email, and password
 * @returns {object} Created user data excluding the password
 */
export const createUser = async (userData) => {
  logger.info(`Creating a new user with email: ${userData.email}`);

  try {
    const { first_name, last_name, email, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await trackDatabaseQuery("createUser", async () =>
      User.create({
        first_name,
        last_name,
        email,
        password: hashedPassword,
      })
    );

    logger.info(`User created successfully with email: ${email}`);
    const { password: _, ...userWithoutPassword } = user.get({ plain: true });
    return userWithoutPassword;
  } catch (error) {
    logger.error(
      `Error creating user with email ${userData.email}: ${error.message}`
    );
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

  try {
    const user = await trackDatabaseQuery("findByPk", async () =>
      User.findByPk(userId)
    );

    if (!user) {
      logger.warn(`User not found for user ID: ${userId}`);
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
      throw new Error(message); // You can catch and handle this error in the controller
    }

    // Check if any changes were made
    const isSameData =
      (!first_name || first_name === user.first_name) &&
      (!last_name || last_name === user.last_name) &&
      (!password || (await bcrypt.compare(password, user.password)));

    if (isSameData) {
      logger.info(`No changes detected for user ID: ${userId}`);
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
    const userWithoutPassword = updatedUser.get({
      plain: true,
      attributes: { exclude: ["password"] },
    });
    // delete userWithoutPassword.password;

    logger.info(`User details updated successfully for user ID: ${userId}`);
    return updatedUser;
  } catch (error) {
    logger.error(
      `Error updating user details for user ID ${userId}: ${error.message}`
    );
    throw error;
  }
};
