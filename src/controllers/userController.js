import {
  getUserData,
  createUser,
  updateUserDetails,
} from "../services/userService.js";

export const getUserController = async (req, res) => {
  try {
    const userData = await getUserData(req.user.id);
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(userData);
  } catch (error) {
    console.error("GET User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createUserController = async (req, res) => {
  try {
    const userData = await createUser(req.body);
    res.status(200).json(userData);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      console.error("User already exists:", error);
      res.status(400).json({ message: "User already exists" });
    } else {
      console.error("Create User Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

export const updateUserController = async (req, res) => {
  try {
    const updatedUserData = await updateUserDetails(req.user.id, req.body);

    // If no changes were made, return 400 Bad Request
    if (updatedUserData === null) {
      return res.status(400).json({ message: "No changes detected" });
    }

    // Respond with 204 No Content if update was successful
    res.status(204).json(updatedUserData);
  } catch (error) {
    // If error message indicates invalid fields, return 400 Bad Request
    if (error.message.startsWith("Invalid fields")) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Update User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};