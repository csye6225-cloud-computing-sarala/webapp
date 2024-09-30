import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import basicAuth from "../middleware/basicAuth.js";

const userRoutes = express.Router();

//avoiding unnecessary request types
userRoutes.use("/user/self", basicAuth, (req, res, next) => {
  if (["DELETE", "PATCH", "OPTIONS", "HEAD"].includes(req.method)) {
    return res.status(405).end();
  }
  next();
});

// Get user information route using Basic Authentication
userRoutes.get("/user/self", basicAuth, async (req, res) => {
  console.log("GET REQUEST");
  const { password, ...userData } = req.user.get({ plain: true });
  res.json(userData);
});

//create user with given information using email as username and hashing password
userRoutes.post("/user", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      account_created: user.account_created,
      account_updated: user.account_updated,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).send("A user with this email already exists.");
    } else {
      console.error("Server Error:", error);
      res.status(500).send("Internal Server Error");
    }
  }
});

// Update user information
userRoutes.put("/user/self", basicAuth, async (req, res) => {
  const { first_name, last_name, password } = req.body;

  // Check for invalid field updates
  const keys = Object.keys(req.body);
  console.log("Keys: ", keys);
  const allowedUpdates = ["first_name", "last_name", "password"];
  const isValidOperation = keys.every((key) => allowedUpdates.includes(key));

  if (isValidOperation) {
    return res.status(400).send({ message: "Invalid updates!" });
  }

  try {
    const user = req.user;

    // Update allowed fields
    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();

    // Exclude password from the response
    const { password: pwd, ...updatedUserData } = user.get({ plain: true });

    res.status(204).end();
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

export default userRoutes;
