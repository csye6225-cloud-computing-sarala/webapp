// verificationController.js
import VerificationToken from "../models/VerificationToken.js";
import User from "../models/User.js";

export const verificationController = async (req, res) => {
  console.log("Hi");
  const { token } = req.query;
  console.log("Received token:", token);

  if (!token) {
    return res.status(400).json({ message: "Verification token is missing." });
  }

  try {
    // Find the verification token in the database
    const verificationToken = await VerificationToken.findOne({
      where: { token },
    });

    if (!verificationToken) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token." });
    }

    const { email, expiryTime } = verificationToken;

    // Check if the token has expired
    if (new Date() > new Date(expiryTime)) {
      // Optionally, delete expired token
      await verificationToken.destroy();
      return res
        .status(400)
        .json({ message: "Verification token has expired." });
    }

    // Update the user's verification status
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.email_verified = true;
    await user.save();

    // Optionally, delete the verification token after successful verification
    await verificationToken.destroy();

    return res.status(200).json({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};
