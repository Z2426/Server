const User = require('../models/userModel');

// Create a new user
exports.createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

// Get all users
exports.getAllUsers = async () => {
  return await User.find();
};

// Update a user by ID
exports.updateUser = async (userId, updateData) => {
  return await User.findByIdAndUpdate(userId, updateData, { new: true });
};

// Delete a user by ID
exports.deleteUser = async (userId) => {
  return await User.findByIdAndDelete(userId);
};
