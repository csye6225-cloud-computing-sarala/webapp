import User from "../models/User.js";
import bcrypt from "bcryptjs";
import logger from "../utils/logger.js";
import { sendMetricToCloudWatch } from "../utils/cloudwatchMetrics.js";

const basicAuth = async (req, res, next) => {
  logger.info("Authorizing user via basicAuth middleware");
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    logger.warn("Authorization header missing or improperly formatted");
    return res.status(401).json({ message: "Authentication required" });
  }

  // Decode and parse credentials
  const base64Credentials = authHeader.split(" ")[1];
  let credentials;
  try {
    credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
  } catch (error) {
    logger.error("Error decoding base64 credentials:", error);
    return res.status(400).json({ message: "Invalid credentials format" });
  }

  const [email, password] = credentials.split(":");

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      logger.warn(`User with email ${email} not found`);
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isVerified) {
      sendMetricToCloudWatch("user.unverified_access_attempt", 1, "Count");
      logger.warn(`Access denied for unverified user ${user.email}`);
      return res.status(403).json({
        message: "Please verify your email address to access this resource.",
      });
    }

    // Validate password
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
      logger.warn("Invalid password for user:", email);
      return res.status(401).json({ message: "Password does not match" });
    }

    // Attach user information to the request object
    req.user = user;
    logger.info(`User ${email} successfully authenticated`);
    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    console.error("Authentication error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error during authentication" });
  }
};

export default basicAuth;
