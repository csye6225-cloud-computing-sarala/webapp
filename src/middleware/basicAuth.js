import User from "../models/User.js";
import bcrypt from "bcryptjs";

const basicAuth = async (req, res, next) => {
  console.log("Authorising");
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii"
  );
  const [email, password] = credentials.split(":");

  console.log({ email, providedPassword: password }); // Log the credentials for debugging

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    console.log({ dbPassword: user.password }); // Log the password from the database for debugging

    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).json({ message: "Password does not match" });
    }

    req.user = user; // Store the user details in the request object for further use in the route handler
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error during authentication" });
  }
};

export default basicAuth;
