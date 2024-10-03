import {
  getUserData,
  createUser,
  updateUserDetails,
} from "../services/userService.js";

export const getUserController = async (req, res) => {
  try {
    const userData = await getUserData(req.user.id);
    res.json(userData);
  } catch (error) {
    console.error("GET User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createUserController = async (req, res) => {
  try {
    const userData = await createUser(req.body);
    res.status(201).json(userData);
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateUserController = async (req, res) => {
  try {
    const updatedUserData = await updateUserDetails(req.user.id, req.body);
    res.status(204).json(updatedUserData);
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
