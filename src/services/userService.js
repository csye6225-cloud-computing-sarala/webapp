import bcrypt from "bcryptjs";
import User from "../models/User.js";

// Fetch user data excluding the password
export const getUserData = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password"] },
  });
  return user ? user.get({ plain: true }) : null;
};

// Create a new user
export const createUser = async (userData) => {
  const { first_name, last_name, email, password } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    first_name,
    last_name,
    email,
    password: hashedPassword,
  });
  // Exclude the password field from the response
  const { password: _, ...userWithoutPassword } = user.get({ plain: true });
  return userWithoutPassword;
};

// Update user details
export const updateUserDetails = async (userId, updates) => {
  const user = await User.findByPk(userId);
  const { first_name, last_name, password } = updates;

  // Check for unsupported fields
  const allowedFields = ["first_name", "last_name", "password"];
  const invalidFields = Object.keys(updates).filter(
    (key) => !allowedFields.includes(key)
  );
  if (invalidFields.length > 0) {
    const message = `Invalid fields: ${invalidFields.join(", ")}`;
    throw new Error(message); // You can catch and handle this error in the controller
  }

  // Check if any changes were made to first_name, last_name, or password
  const isSameData =
    (!first_name || first_name === user.first_name) &&
    (!last_name || last_name === user.last_name) &&
    (!password || (await bcrypt.compare(password, user.password)));

  // If no changes were detected, return null to indicate no changes
  if (isSameData) {
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
  await user.save();
  return user.get({ plain: true, attributes: { exclude: ["password"] } });
};
