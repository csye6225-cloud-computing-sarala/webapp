import logger from "../utils/logger.js";
import { sendMetricToCloudWatch } from "../utils/cloudwatchMetrics.js";

const verifyEmailMiddleware = async (req, res, next) => {
  try {
    const user = req.user; // Assuming the user object is added to the request by `basicAuth`

    if (!user) {
      logger.warn("User object not found in request");
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!user.email_verified) {
      logger.info(`Blocked request from unverified user: ${user.email}`);
      sendMetricToCloudWatch("api.unverified_user_access_attempt", 1, "Count");

      return res.status(403).json({
        message: "Please verify your email address to access this resource.",
      });
    }

    // User is verified, proceed to the next middleware/route
    next();
  } catch (error) {
    logger.error("Error in verifyEmailMiddleware:", error);
    sendMetricToCloudWatch("api.middleware.verify_email.error", 1, "Count");

    return res
      .status(500)
      .json({ message: "Internal Server Error during email verification" });
  }
};

export default verifyEmailMiddleware;
