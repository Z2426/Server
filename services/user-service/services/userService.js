
const User = require('../models/userModel');
const logger = global.logger; // Sử dụng logger đã gán vào global
// Create a new user
exports.createUser = async (userData) => {
  //logger.info('Thông điệp thông tin');
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
