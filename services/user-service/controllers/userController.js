const userService = require('../services/userService');
const mongoose = require("mongoose");
exports.updateLoginAttempts = async (req, res) => {
  const { loginAttempts, lastLogin, email } = req.body; // Lấy thông tin từ body
  try {
    // Kiểm tra xem các trường cần thiết có được cung cấp không
    if (loginAttempts === undefined || !lastLogin) {
      return res.status(400).json({ message: "Login attempts and last login time are required!" });
    }
    const updatedUser = await userService.updateLoginInfo(email, loginAttempts, lastLogin); // Gọi service để cập nhật thông tin
    return res.status(200).json({
      message: "Login information updated successfully!",
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
// Tìm kiếm người dùng dựa vào email
exports.getUserByEmailWithPass = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userService.getUserByEmailWithPass(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Lỗi khi tìm người dùng:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Cập nhật thông tin người dùng
exports.updateUser = async (req, res) => {
  const { email } = req.params;
  const updateData = req.body;

  try {
    const user = await userService.updateUser(email, updateData);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Lỗi khi cập nhật người dùng:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};
//verify account 
exports.verifyAccount = async (req, res) => {
  const { userId } = req.body.user; // Expecting the token in the request body
  console.log(req.body)
  try {
    const message = await userService.verifyAccount(userId);
    res.status(200).json({ message });
  } catch (error) {
    res.status(401).json({ message: error.message }); // Changed status to 401 for invalid token or user not found
  }
};
// API to request a password reset token
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Generate reset token
    const token = await userService.generateResetToken(email);

    // Here you would typically send the token to the user's email
    // For simplicity, we'll just return the token in the response
    res.status(200).json({ message: "Reset token generated", token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// API to reset the password
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, token } = req.body;
    console.log(req.body)
    // Call the user service to reset the password
    await userService.resetPassword(email, newPassword, token);

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.changePassword = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { oldPassword, newPassword } = req.body;

    const result = await userService.changePassword(userId, oldPassword, newPassword);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const following = await userService.getFollowing(userId);
    res.status(200).json({ following });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Controller function to get the list of followers for this user
exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const followers = await userService.getFollowers(userId);
    res.status(200).json({ followers });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
// Toggle follow/unfollow a user
exports.toggleFollowUser = async (req, res) => {
  try {
    const { followedId } = req.params; // ID of the user to follow/unfollow
    const followerId = req.body.user.userId; // ID of the current user (from token or session)

    const { followedUser, isFollowing } = await userService.toggleFollowUser(followerId, followedId);
    const message = isFollowing ? "User followed successfully" : "User unfollowed successfully";

    res.status(200).json({ message, followedUser });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
exports.sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params; // ID of the user to send the request to
    const senderId = req.body.user.userId; // ID of the current user (from token or session)
    // Check if the senderId and userId are the same
    if (senderId === userId) {
      return res.status(400).json({ message: "You cannot send a friend request to yourself." });
    }

    const user = await userService.sendFriendRequest(userId, senderId);
    res.status(200).json({ message: "Friend request sent", user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateFriendRequest = async (req, res) => {
  const { requestId, newStatus } = req.body; // Lấy thông tin từ body yêu cầu
  const { userId } = req.body.user
  console.log(userId)
  const result = await userService.updateFriendRequestStatus(userId, requestId, newStatus);

  if (result.success) {
    return res.status(200).json({
      message: 'Cập nhật trạng thái thành công.',
      request: result.request,
    });
  }

  return res.status(400).json({
    message: result.message,
  });
};

exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.body.user.userId; // ID of the current user (from token or session)
    const requests = await userService.getFriendRequests(userId);
    res.status(200).json(requests);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
//console.log(userService); // Check if all functions are available
// get list user blocked
exports.getBlockedUsers = async (req, res) => {
  try {
    const currentUserId = req.body.user.userId; // Assumes user ID is retrieved from token/session

    const blockedUsers = await userService.getBlockedUsers(currentUserId);

    if (!blockedUsers) {
      return res.status(404).json({ message: "User not found or no blocked users" });
    }

    res.status(200).json({ blockedUsers: blockedUsers.blockedUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Controller function to toggle block/unblock
exports.toggleBlockStatus = async (req, res) => {
  try {
    const { userId } = req.params; // ID of the user to toggle block status
    const currentUserId = req.body.user.userId; // ID of the current user (from token or session)

    // Call the service to toggle block/unblock
    const message = await userService.toggleBlockStatus(currentUserId, userId);

    res.status(200).json({ message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// READ all users with optional field selection
exports.getAllUsers = async (req, res) => {
  const user = req.body.user
  try {
    if (user.role != "Admin") {
      const error = new Error('Ban khong co quyen truy cap.');
      error.statusCode = 403; // Mã lỗi 403 
      throw error; // Ném lỗi
    }
    const allowedFields = ['firstName', 'lastName', 'email', 'profileUrl'];
    // Call the service to get all users, passing the fields parameter
    const users = await userService.getAllUsers(allowedFields);
    res.status(200).json(users);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ message: error.message });
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
    const { userId } = req.body.user
    const user = await userService.updateUser(userId, req.body);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.body.user
    const user = await userService.deleteUser(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
