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
import validator from "validator";
import VerificationToken from "../models/VerificationToken.js";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";

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
    // Create the user
    const userData = await createUser(req.body);

    // Generate a verification token
    const verificationToken = uuidv4();

    const expiryTime = new Date(Date.now() + 2 * 60 * 1000); // Token valid for 2 min

    const verificationUrl = `http://${process.env.DOMAIN}/v1/user/verify-email?token=${verificationToken}`;

    console.log("url: " + verificationUrl);

    // Store the verification token in the database
    const savedToken = await VerificationToken.create({
      email: userData.email,
      id: userData.id,
      token: verificationToken,
      expiryTime,
    });

    console.log("Verification token saved:", savedToken);

    // Prepare the message payload for SNS
    const messagePayload = {
      email: userData.email,
      url: verificationUrl,
      timestamp: new Date().toISOString(),
    };

    console.log("message payload: " + messagePayload);
    // Publish the message to SNS
    const sns = new AWS.SNS();
    const params = {
      Message: JSON.stringify(messagePayload),
      TopicArn: process.env.SNS_TOPIC_ARN,
    };

    try {
      await sns.publish(params).promise();
      logger.info(`Published message to SNS for user ${userData.email}`);
    } catch (snsError) {
      logger.error(
        `Error publishing message to SNS for user ${userData.email}: ${snsError.message}`
      );
      sendMetricToCloudWatch("api.user.create.sns_publish_error", 1, "Count");
      throw snsError;
    }

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
