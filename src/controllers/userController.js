import {
  getUserData,
  createUser,
  updateUserDetails,
} from "../services/userService.js";
import { statsdClient } from "../config/statsd.js";
import { calculateDuration } from "../utils/timingUtils.js";
import logger from "../utils/logger.js";
import { sendMetricToCloudWatch } from "../utils/cloudwatchMetrics.js";
import AWS from "aws-sdk";
import { isTokenExpired } from "../utils/tokenUtils.js";
import validator from "validator";

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
    sendMetricToCloudWatch("api.user.get.duration", durationMs, "Milliseconds");

    if (!userData) {
      logger.warn(`User data not found for user ID: ${req.user.id}`);
      sendMetricToCloudWatch("api.user.get.not_found", 1, "Count");
      return res.status(404).json({ message: "User not found" });
    }

    logger.info(`User data successfully retrieved for user ID: ${req.user.id}`);
    sendMetricToCloudWatch("api.user.get.success", 1, "Count");
    res.json(userData);
  } catch (error) {
    logger.error(`GET User Error for user ID ${req.user.id}: ${error.message}`);
    sendMetricToCloudWatch("api.user.get.error", 1, "Count");
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

  const { email } = req.body;

  // Validate email
  if (!validator.isEmail(email)) {
    logger.warn(`Invalid email format: ${email}`);
    sendMetricToCloudWatch("api.user.create.invalid_email", 1, "Count");
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    const userData = await createUser(req.body); // Attempt to create a new user
    // Prepare the message payload for SNS
    const messagePayload = {
      email: userData.email,
      userId: userData.id,
      name: userData.name,
      timestamp: new Date().toISOString(),
    };
    // Publish the message to SNS
    const sns = new AWS.SNS();
    const params = {
      Message: JSON.stringify(messagePayload),
      TopicArn: process.env.SNS_TOPIC_ARN,
    };

    await sns.publish(params).promise();
    logger.info(`Published message to SNS for user ${userData.email}`);

    const durationMs = calculateDuration(start); // Calculate duration for StatsD
    statsdClient.timing("api.user.create.duration", durationMs);
    sendMetricToCloudWatch(
      "api.user.create.duration",
      durationMs,
      "Milliseconds"
    );

    logger.info(`User created successfully with email: ${req.body.email}`);
    sendMetricToCloudWatch("api.user.create.success", 1, "Count");
    res.status(200).json(userData); // Return the created user's data
  } catch (error) {
    const durationMs = calculateDuration(start); // Calculate duration in case of error
    statsdClient.timing("api.user.create.error.duration", durationMs);
    sendMetricToCloudWatch(
      "api.user.create.error.duration",
      durationMs,
      "Milliseconds"
    );

    if (error.name === "SequelizeUniqueConstraintError") {
      logger.warn(
        `User creation failed. User already exists with email: ${req.body.email}`
      );
      sendMetricToCloudWatch("api.user.create.exists", 1, "Count");
      console.error("User already exists:", error);
      res.status(400).json({ message: "User already exists" });
    } else {
      // Handle unexpected errors
      logger.error(
        `Create User Error for email ${req.body.email}: ${error.message}`
      );
      console.error("Create User Error:", error);
      sendMetricToCloudWatch("api.user.create.error", 1, "Count");
      logger.info("Error publishing to SNS:", error);
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
    sendMetricToCloudWatch(
      "api.user.update.duration",
      durationMs,
      "Milliseconds"
    );

    // If no changes were detected, log and respond with a 400 status
    if (updatedUserData === null) {
      logger.warn(`No changes detected for user ID: ${req.user.id}`);
      sendMetricToCloudWatch("api.user.update.no_change", 1, "Count");
      return res.status(400).json({ message: "No changes detected" });
    }

    logger.info(`User data updated successfully for user ID: ${req.user.id}`);
    sendMetricToCloudWatch("api.user.update.success", 1, "Count");
    res.status(204).json(updatedUserData); // Return the updated user data with no content status
  } catch (error) {
    const durationMs = calculateDuration(start); // Calculate duration in case of error
    statsdClient.timing("api.user.update.error.duration", durationMs);
    sendMetricToCloudWatch(
      "api.user.update.error.duration",
      durationMs,
      "Milliseconds"
    );

    if (error.message.startsWith("Invalid fields")) {
      // If invalid fields are provided, respond with a 400 status
      logger.warn(
        `Update User Error: Invalid fields in request for user ID: ${req.user.id}`
      );
      sendMetricToCloudWatch("api.user.update.invalid_fields", 1, "Count");
      return res.status(400).json({ message: error.message });
    }

    // Handle unexpected errors
    logger.error(
      `Update User Error for user ID ${req.user.id}: ${error.message}`
    );
    sendMetricToCloudWatch("api.user.update.error", 1, "Count");
    console.error("Update User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyEmailController = async (req, res) => {
  const { token } = req.query;

  try {
    // Validate the token (you'll need to implement token validation logic)
    const email = await validateVerificationToken(token);

    if (!email) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token." });
    }

    // Update the user's isVerified status
    await User.update({ isVerified: true }, { where: { email } });

    res.status(200).json({ message: "Email verified successfully!" });
  } catch (error) {
    logger.error(`Email verification error: ${error.message}`);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const validateVerificationToken = async (token) => {
  // Query the database to find the token
  const record = await VerificationToken.findOne({ where: { token } });

  if (record && !isTokenExpired(record.expiresAt)) {
    return record.email;
  }

  return null;
};
