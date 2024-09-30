const User = require("../models/User");
const bcrypt = require("bcryptjs");

async function createUser(userData) {
  const hashedPassword = await bcrypt.hash(userData.password, 8);
  userData.password = hashedPassword;
  return User.create(userData);
}

async function authenticateUser(email, password) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error("Authentication failed!");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Authentication failed!");
  }

  return user;
}

module.exports = {
  createUser,
  authenticateUser,
};
