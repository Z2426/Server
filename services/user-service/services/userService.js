const mongoose = require('mongoose');
const Users = require('../models/userModel');
const notification = require('../shared/utils/notification')
const { sendNewPasswordEmail } = require('../utils/sendEmailResetPass.js')
const { sendToQueue } = require("../shared/redis/redisClient");
const crypto = require('crypto');
/** ================================================
 *                User Search and Retrieval
 * ================================================ */
exports.getFriendIds = async (userId) => {
  try {
    const user = await Users.findById(userId).select('friends');
    if (!user) {
      console.log('User not found');
      return [];
    }
    return user.friends;
  } catch (error) {
    console.error('Error fetching friend IDs:', error);
    return [];
  }
};
exports.findUsers = async (criteria) => {
  const query = {};
  if (criteria.age) {
    const ageStr = criteria.age.replace(/\D+/g, ' ').trim();
    const ageParts = ageStr.split(' ');
    const currentYear = new Date().getFullYear();
    if (ageParts.length === 1) {
      const age = parseInt(ageParts[0], 10);
      const startOfBirthYear = new Date(currentYear - age, 0, 1);
      const endOfBirthYear = new Date(currentYear - age, 11, 31);
      query.birthDate = { $gte: startOfBirthYear, $lte: endOfBirthYear };

    } else if (ageParts.length === 2) {
      const ageFrom = parseInt(ageParts[0], 10);
      const ageTo = parseInt(ageParts[1], 10);
      const startOfBirthYear = new Date(currentYear - ageTo, 0, 1);
      const endOfBirthYear = new Date(currentYear - ageFrom, 11, 31);
      query.birthDate = { $gte: startOfBirthYear, $lte: endOfBirthYear };
    }
  }
  if (criteria.name) {
    query.$or = [
      { firstName: { $regex: criteria.name, $options: 'i' } },
      { lastName: { $regex: criteria.name, $options: 'i' } }
    ];
  }
  if (criteria.interest) {
    query.interests = { $regex: criteria.interest, $options: 'i' };
  }
  ['workplace', 'province', 'school', 'address'].forEach(field => {
    if (criteria[field]) {
      query[field] = { $regex: criteria[field], $options: 'i' };
    }
  });
  try {
    const users = await Users.find(query).select('firstName lastName profileUrl');
    return users;
  } catch (error) {
    console.error("Error finding users:", error);
    throw error;
  }
};
exports.searchUsersByKeyword = async (keyword) => {
  try {
    const users = await Users.find({
      $or: [
        { firstName: new RegExp(keyword, 'i') },
        { lastName: new RegExp(keyword, 'i') },
        { email: new RegExp(keyword, 'i') }
      ]
    }, 'firstName lastName profileUrl');
    return users;
  } catch (error) {
    console.error('Error searching users:', error.message);
    throw new Error('Error searching users:', error.message);
  }
};
exports.getUsersByIds = async (userIds) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'profileUrl']
    const fieldsToSelect = allowedFields.join(' ');
    const users = await Users.find({ _id: { $in: userIds } }).select(fieldsToSelect);
    return users;
  } catch (error) {
    throw new Error('Error fetching users');
  }
};
exports.getUserByEmailWithPass = async (email) => {
  try {
    const user = await Users.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    console.error('Error when search with pass:', error.message);
    throw new Error(error.message);
  }
};
/** ================================================
 *                Friendship Management
 * ================================================ */
exports.sendFriendRequest = async (userId, senderId) => {
  try {
    const user = await Users.findById(userId);
    if (!user) throw new Error("User not found");
    if (userId === senderId) {
      throw new Error("You cannot send a friend request to yourself");
    }
    if (user.friends.includes(senderId)) {
      throw new Error("You are already friends with this user");
    }
    const existingRequest = user.friendRequests.find(request =>
      request.sender && request.sender.toString() === senderId && request.status === 'pending'
    );

    if (existingRequest) {
      throw new Error("A friend request is already pending from this user");
    }
    const newFriendRequest = {
      sender: senderId,
      status: 'pending',
    };
    user.friendRequests.push(newFriendRequest);
    notification.notifyFriendRequest(userId, senderId);
    await user.save();
    return user;
  } catch (error) {
    console.error('error when send request friend :', error.message);
    throw new Error(error.message);
  }
};
exports.isFriendOf = async (userId, potentialFriendId) => {
  try {
    const user = await Users.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const isFriend = user.friends.includes(potentialFriendId);
    return isFriend;
  } catch (error) {
    console.error('Error checking friendship:', error);
    return false;
  }
}
exports.getFriends = async (userId, page = 1, limit = 10) => {
  const user = await Users.findById(userId).populate({
    path: 'friends',
    select: 'firstName lastName email profileUrl location profession',
    options: { skip: (page - 1) * limit, limit: limit },
  });
  if (!user) {
    throw new Error('Người dùng không tìm thấy');
  }
  const totalFriends = user.friends.length;
  const totalPages = Math.ceil(totalFriends / limit);
  return {
    friends: user.friends,
    totalFriends,
    totalPages,
    currentPage: page,
  };
};
exports.getFollowing = async (userId) => {
  try {
    const user = await Users.findById(userId)
      .select("following")
      .populate("following", "firstName lastName email profileUrl");

    if (!user) throw new Error("User not found");
    return user.following;
  } catch (error) {
    console.error('Error get following :', error.message);
    throw new Error(error.message);
  }
};
exports.getFollowers = async (userId) => {
  try {
    const user = await Users.findById(userId)
      .select("followers")
      .populate("followers", "firstName lastName email profileUrl");

    if (!user) throw new Error("User not found");
    return user.followers;
  } catch (error) {
    console.error('Error get follower ', error.message);
    throw new Error(error.message);
  }
};
exports.toggleFollowUser = async (followerId, followedId) => {
  try {
    if (followerId === followedId) throw new Error("Cannot follow yourself");
    const followedUser = await Users.findById(followedId);
    const follower = await Users.findById(followerId);
    if (!followedUser || !follower) throw new Error("User not found");
    const isAlreadyFollowing = followedUser.followers.includes(followerId);
    if (isAlreadyFollowing) {
      followedUser.followers.pull(followerId);
      follower.following.pull(followedId);
    } else {
      followedUser.followers.push(followerId);
      follower.following.push(followedId);
    }
    await followedUser.save();
    await follower.save();
    return { followedUser, isFollowing: !isAlreadyFollowing };
  } catch (error) {
    console.error('Error toggle Follow user:', error.message);
    throw new Error(error.message);
  }
};
exports.updateFriendRequestStatus = async (userId, requestId, newStatus) => {
  try {
    const user = await Users.findById(userId);
    if (!user) {
      return { success: false, message: 'User not exist' };
    }
    const request = user.friendRequests.id(requestId);
    if (!request) {
      return { success: false, message: 'Friend request not found' };
    }
    request.status = newStatus;
    if (newStatus === 'accepted') {
      const senderId = request.sender;
      await Users.updateOne(
        { _id: userId },
        { $addToSet: { friends: senderId } }
      );
      await Users.updateOne(
        { _id: senderId },
        { $addToSet: { friends: userId } }
      );
      notification.notifyFriendAccepted(senderId, userId)
    }
    if (newStatus !== 'pending') {
      user.friendRequests = user.friendRequests.filter(req => req._id.toString() !== requestId);
    }
    await user.save();
    return { success: true, request };
  } catch (error) {
    console.error('Error :', error);
    return { success: false, message: error };
  }
};
exports.getFriendRequests = async (userId) => {
  try {
    const user = await Users.findById(userId)
      .populate({
        path: 'friendRequests.sender',
        select: 'firstName lastName email profileUrl'
      })
      .select('friendRequests');

    if (!user) {
      console.log('User not found');
      return null;
    }
    return user.friendRequests;
  } catch (error) {
    console.error('Error :', error);
    return { success: false, message: error };
  }
};
/** ================================================
 *                Authentication and Security
 * ================================================ */
exports.updateLoginInfo = async (email, loginAttempts, lastLogin) => {
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { email: email },
      {
        $set: {
          loginAttempts: loginAttempts,
          lastLogin: lastLogin
        }
      },
      { new: true }
    );
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  } catch (error) {
    console.error('Error update login info', error.message);
    throw new Error(error.message);
  }
};
exports.verifyAccount = async (userId) => {
  try {
    const user = await Users.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.verified = true;
    await user.save();
    return 'Account verified successfully';
  } catch (error) {
    console.error('Error verify account :', error.message);
    throw new Error(error.message);
  }
};
exports.generateResetToken = async (email) => {
  try {
    const user = await Users.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }
    const token = global.generateToken({ id: user._id });
    return token;
  } catch (error) {
    console.error('Error generate reset token:', error.message);
    throw new Error(error.message);
  }
};
exports.resetPassword = async (email) => {
  try {
    const user = await Users.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    } const randomBytes = crypto.randomBytes(3);
    const randomNumber = randomBytes.readUIntBE(0, 3);
    const newPassword = (randomNumber % 1000000).toString().padStart(6, '0');
    const hashedPassword = await global.hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();
    await sendNewPasswordEmail(email, newPassword)
    return user;
  } catch (error) {
    console.error('Error reset password:', error.message);
    throw new Error(error.message);
  }
};
exports.changePassword = async (userId, oldPassword, newPassword) => {
  try {
    const user = await Users.findById(userId).select("+password");
    if (!user) throw new Error("User not found");
    const isMatch = await global.checkPassword(oldPassword, user.password);
    if (!isMatch) throw new Error("Old password is incorrect");
    user.password = await global.hashPassword(newPassword);
    await user.save();
    return { message: "Password updated successfully" };
  } catch (error) {
    console.error('Error change password', error.message);
    throw new Error(error.message);
  }
};
exports.updateInfoLoginUser = async (email, updateData) => {
  try {
    const updatedUser = await Users.findOneAndUpdate({ email }, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  } catch (error) {
    console.error('Error when update info login user:', error.message);
    throw new Error(error.message);
  }
};
exports.getBlockedUsers = async (userId) => {
  try {
    return await Users.findById(userId)
      .select('blockedUsers')
      .populate('blockedUsers', 'firstName lastName profileUrl');
  } catch (error) {
    throw new Error("Error fetching blocked users: " + error.message);
  }
};
exports.toggleBlockStatus = async (currentUserId, targetUserId) => {
  try {
    const currentUser = await Users.findById(currentUserId);
    if (!currentUser) {
      throw new Error("Current user not found");
    }
    const isBlocked = currentUser.blockedUsers.includes(targetUserId);
    const updateOperation = isBlocked
      ? { $pull: { blockedUsers: targetUserId } }
      : { $addToSet: { blockedUsers: targetUserId } };
    await Users.findByIdAndUpdate(currentUserId, updateOperation);
    return isBlocked ? 'User unblocked successfully' : 'User blocked successfully';
  } catch (error) {
    throw new Error("Error toggling block status: " + error.message);
  }
};
/** ================================================
 *                 User Information Management
 * ================================================ */
exports.createUser = async (userData) => {
  try {
    const user = new Users(userData);
    return await user.save();
  } catch (error) {
    throw new Error("Error creating user: " + error.message);
  }
};
exports.getAllUsers = async (fields) => {
  try {
    const selectFields = fields.join(' ');
    return await Users.find({}, selectFields);
  } catch (error) {
    throw new Error("Error fetching users: " + error.message);
  }
};
exports.getUserById = async (userId, fields) => {
  try {
    const selectFields = fields.join(' ');
    return await Users.findById(userId, selectFields);
  } catch (error) {
    throw new Error("Error fetching user by ID: " + error.message);
  }
};
exports.deleteUser = async (userId) => {
  try {
    const deletedUser = await Users.findByIdAndDelete(userId);
    if (!deletedUser) {
      throw new Error("User not found");
    }
    return deletedUser;
  } catch (error) {
    throw new Error("Error deleting user: " + error.message);
  }
};
exports.updateUser = async (userId, updateData) => {
  try {
    const user = await Users.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });
    if (!user) {
      throw new Error("User not found");
    }
    const action = 'embed_image';
    const data = { user_id: user._id, image_url: user.profileUrl };
    await sendToQueue('task_queue_suggest_service', action, data);
    return user;
  } catch (error) {
    throw new Error("Error updating user: " + error.message);
  }
};











































