// services/userService.js
const Users = require('../models/userModel'); // Ensure this is the correct path to your user model
// CREATE user
exports.createUser = async (userData) => {
  const user = new Users(userData);
  return await user.save();
};

// Get all users with optional fields
exports.getAllUsers = async (fields) => {
  try {
    // Create a space-separated string of fields for the query
    const selectFields = fields.join(' '); // Join the fields array with space
    // Find all users and select fields if provided
    return await Users.find({}, selectFields);
  } catch (error) {
    throw new Error("Error fetching users: " + error.message); // Throw an error if the DB operation fails
  }
};

// Get user by ID with optional fields
exports.getUserById = async (userId, fields) => {
  const selectFields = fields.join(' '); // Create a space-separated string of fields
  return await Users.findById(userId, selectFields); // Find user by ID and select fields if provided
};

// UPDATE user
exports.updateUser = async (userId, userData) => {
  return await Users.findByIdAndUpdate(userId, userData, { new: true });
};

// DELETE user
exports.deleteUser = async (userId) => {
  return await Users.findByIdAndDelete(userId);
};
