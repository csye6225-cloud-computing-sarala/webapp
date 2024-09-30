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
  return user.get({ plain: true });
};

// Update user details
export const updateUserDetails = async (userId, updates) => {
  const user = await User.findByPk(userId);
  const { first_name, last_name, password } = updates;

  if (first_name) user.first_name = first_name;
  if (last_name) user.last_name = last_name;
  if (password) user.password = await bcrypt.hash(password, 10);

  await user.save();
  return user.get({ plain: true, attributes: { exclude: ["password"] } });
};
