const userService = require('../services/userService');
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

console.log(userService); // Check if all functions are available

// READ all users with optional field selection
exports.getAllUsers = async (req, res) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'email', 'profileUrl'];
    // Call the service to get all users, passing the fields parameter
    const users = await userService.getAllUsers(allowedFields);
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.userId; // Extract userId from params

    // Define allowed fields
    const allowedFields = [
      'firstName',
      'lastName',
      'email',
      'profileUrl',
      'profession',
      'location',
      'birthDate',
      'verified',
      'statusActive',
      'lastLogin'
    ];

    // Validate the userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }



    // Call the service to get user by ID, passing the fields array
    const user = await userService.getUserById(userId, allowedFields);

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user); // Return the user data
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// CREATE user
exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// UPDATE user
exports.updateUser = async (req, res) => {
  try {
    console.log(req.params.userId)    // Use req.params.userId instead of req.params.id
    const user = await userService.updateUser(req.params.userId, req.body);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE user
exports.deleteUser = async (req, res) => {
  try {
    const user = await userService.deleteUser(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
