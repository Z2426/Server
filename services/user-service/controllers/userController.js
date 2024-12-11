const userService = require('../services/userService');
const mongoose = require('mongoose');

/** ================================================
 *                User Search and Retrieval
 * ================================================ */
exports.finUserByInfo = async (req, res) => {
  try {
    let { age, name, workplace, province, school, address, interest } = req.query;
    const criteria = {};
    if (age && age !== 'undefined') criteria.age = age;
    if (name && name !== 'undefined') criteria.name = name;
    if (workplace && workplace !== 'undefined') criteria.workplace = workplace;
    if (province && province !== 'undefined') criteria.province = province;
    if (school && school !== 'undefined') criteria.school = school;
    if (address && address !== 'undefined') criteria.address = address;
    if (interest && interest !== 'undefined') criteria.interest = interest;
    const users = await userService.findUsers(criteria);
    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error in find-users controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
exports.searchUsers = async (req, res) => {
  const { keyword } = req.query;
  try {
    const users = await userService.searchUsersByKeyword(keyword);
    return res.json(users);
  } catch (error) {
    console.error('Error searching users:', error.message);
    return res.status(500).json({ message: error.message });
  }
};
exports.getFriends = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { page = 1, limit = 10 } = req.query;
    const friendsData = await userService.getFriends(userId, parseInt(page), parseInt(limit));
    return res.status(200).json(friendsData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
exports.getUsersBulk = async (req, res) => {
  let { userIds } = req.query;
  let userIdArray = [];
  if (typeof userIds === 'string') {
    userIdArray = userIds.split(',').map(id => id.trim());
  } else if (Array.isArray(userIds)) {
    userIdArray = userIds;
  }
  try {
    const users = await userService.getUsersByIds(userIdArray);
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;
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
      'lastLogin',
      'interests',
      'cover_photo',
      'friends',
      'createdAt',
      'friendRequests'
    ];
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const user = await userService.getUserById(userId, allowedFields);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json(user);
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: error.message });
  }
};
/** ================================================
 *                Friendship Management
 * ================================================ */
exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const following = await userService.getFollowing(userId);
    return res.status(200).json({ following });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};
exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const followers = await userService.getFollowers(userId);
    return res.status(200).json({ followers });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};
exports.toggleFollowUser = async (req, res) => {
  try {
    const { followedId } = req.params;
    const followerId = req.body.user.userId;
    const { followedUser, isFollowing } = await userService.toggleFollowUser(followerId, followedId);
    const message = isFollowing ? "User followed successfully" : "User unfollowed successfully";
    return res.status(200).json({ message, followedUser });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const senderId = req.body.user.userId;
    if (senderId === userId) {
      return res.status(400).json({ message: "You cannot send a friend request to yourself." });
    }
    const user = await userService.sendFriendRequest(userId, senderId);
    return res.status(200).json({ message: "Friend request sent", user });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
exports.updateFriendRequest = async (req, res) => {
  try {
    const { requestId, newStatus } = req.body;
    const { userId } = req.body.user;
    if (!requestId || !newStatus || !userId) {
      return res.status(400).json({
        message: 'Missing required fields: requestId, newStatus, or userId.',
      });
    }
    const result = await userService.updateFriendRequestStatus(userId, requestId, newStatus);
    if (result.success) {
      return res.status(200).json({
        message: 'Update success',
        request: result.request,
      });
    }
    return res.status(400).json({
      message: result.message,
    });
  } catch (error) {
    console.error('Error updating friend request:', error);
    return res.status(500).json({
      message: 'An error occurred while updating the friend request status.',
      error: error.message,
    });
  }
};
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.body.user.userId;
    const requests = await userService.getFriendRequests(userId);
    return res.status(200).json(requests);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



/** ================================================
 *                Authentication and Security
 * ================================================ */
exports.updateLoginAttempts = async (req, res) => {
  const { loginAttempts, lastLogin, email } = req.body;
  try {
    if (loginAttempts === undefined || !lastLogin) {
      return res.status(400).json({ message: "Login attempts and last login time are required!" });
    }
    const updatedUser = await userService.updateLoginInfo(email, loginAttempts, lastLogin);
    return res.status(200).json({
      message: "Login information updated successfully!",
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
exports.getUserByEmailWithPass = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userService.getUserByEmailWithPass(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error('Internal server error', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
exports.verifyAccount = async (req, res) => {
  const { userId } = req.body.user;
  try {
    const message = await userService.verifyAccount(userId);
    return res.status(200).json({ message });
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const token = await userService.generateResetToken(email);
    return res.status(200).json({ message: "Reset token generated", token });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    await userService.resetPassword(email);
    return res.status(200).json({ message: "Password reset have send email  successful" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
exports.changePassword = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { oldPassword, newPassword } = req.body;
    const result = await userService.changePassword(userId, oldPassword, newPassword);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
exports.getBlockedUsers = async (req, res) => {
  try {
    const currentUserId = req.body.user.userId;
    const blockedUsers = await userService.getBlockedUsers(currentUserId);
    if (!blockedUsers) {
      return res.status(404).json({ message: "User not found or no blocked users" });
    }
    return res.status(200).json({ blockedUsers: blockedUsers.blockedUsers });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
exports.toggleBlockStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.body.user.userId;
    const message = await userService.toggleBlockStatus(currentUserId, userId);
    return res.status(200).json({ message });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


/** ================================================
 *                 User Information Management
 * ================================================ */
exports.getAllUsers = async (req, res) => {
  const user = req.body.user
  try {
    if (user.role != "Admin") {
      const error = new Error('You do not have access rights.');
      error.statusCode = 403;
      throw error;
    }
    const allowedFields = ['firstName', 'lastName', 'email', 'profileUrl'];
    const users = await userService.getAllUsers(allowedFields);
    return res.status(200).json(users);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ message: error.message });
  }
};
exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    return res.status(201).json(user);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.body.user
    const user = await userService.updateUser(userId, req.body);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.body.user
    const user = await userService.deleteUser(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};





















