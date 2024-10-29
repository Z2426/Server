// services/userService.js
const Users = require('../models/userModel'); // Ensure this is the correct path to your user model
const { checkPassword, hashPassword, generateToken, verifyToken } = require("../utils/index");
// API để cập nhật số lần đăng nhập thất bại và thời gian đăng nhập cuối
exports.updateLoginInfo = async (email, loginAttempts, lastLogin) => {
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { email: email }, // Tìm kiếm người dùng theo email
      {
        $set: {
          loginAttempts: loginAttempts, // Cập nhật số lần đăng nhập thất bại
          lastLogin: lastLogin // Cập nhật thời gian đăng nhập cuối
        }
      },
      { new: true } // Trả về người dùng đã được cập nhật
    );

    if (!updatedUser) {
      throw new Error('User not found'); // Ném lỗi nếu không tìm thấy người dùng
    }

    return updatedUser; // Trả về dữ liệu người dùng đã được cập nhật
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin đăng nhập:', error.message);
    throw new Error(error.message); // Ném lỗi với thông điệp rõ ràng hơn
  }
};
// Tìm kiếm người dùng theo email
exports.getUserByEmailWithPass = async (email) => {
  return await Users.findOne({ email }).select('+password'); // Chọn cả trường password
};

// Cập nhật thông tin người dùng
exports.updateInfoLoginUser = async (email, updateData) => {
  return await Users.findOneAndUpdate({ email }, updateData, {
    new: true,
    runValidators: true,
  });
};
exports.verifyAccount = async (token) => {
  // Verify the token
  const decoded = verifyToken(token);
  if (!decoded) {
    throw new Error('Invalid or expired token');
  }

  // Find the user by ID from the token
  const user = await Users.findById(decoded.id);
  if (!user) {
    throw new Error('User not found');
  }

  // Update user's verified status
  user.verified = true;
  await user.save();

  return 'Account verified successfully';
};
// Generate a reset token for the user
exports.generateResetToken = async (email) => {
  const user = await Users.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  // Create a token with user ID and set an expiration
  const token = generateToken({ id: user._id });
  return token; // Return the generated token
}

// Verify token and reset password
exports.resetPassword = async (email, newPassword, token) => {
  // Verify the token
  const decoded = verifyToken(token);

  if (!decoded) {
    throw new Error("Invalid or expired token");
  }

  // Find the user
  const user = await Users.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  // Hash the new password
  const hashedPassword = await hashPassword(newPassword);

  // Update user's password
  user.password = hashedPassword;
  await user.save();

  return user; // Return the updated user object if needed
}

exports.changePassword = async (userId, oldPassword, newPassword) => {
  // Fetch the user, including their hashed password
  const user = await Users.findById(userId).select("+password");

  if (!user) throw new Error("User not found");
  console.log(oldPassword, newPassword)
  // Check if the old password is correct
  const isMatch = await checkPassword(oldPassword, user.password);
  if (!isMatch) throw new Error("Old password is incorrect");

  // Hash the new password
  user.password = await hashPassword(newPassword);
  await user.save();

  return { message: "Password updated successfully" };
};
// Function to get the list of users a given user is following
exports.getFollowing = async (userId) => {
  const user = await Users.findById(userId)
    .select("following")
    .populate("following", "firstName lastName email profileUrl"); // Populate with necessary fields

  if (!user) throw new Error("User not found");
  return user.following;
};

// Function to get the list of followers for a given user
exports.getFollowers = async (userId) => {
  const user = await Users.findById(userId)
    .select("followers")
    .populate("followers", "firstName lastName email profileUrl"); // Populate with necessary fields

  if (!user) throw new Error("User not found");
  return user.followers;
};
exports.toggleFollowUser = async (followerId, followedId) => {
  if (followerId === followedId) throw new Error("Cannot follow yourself");

  const followedUser = await Users.findById(followedId);
  const follower = await Users.findById(followerId);
  if (!followedUser || !follower) throw new Error("User not found");

  const isAlreadyFollowing = followedUser.followers.includes(followerId);

  if (isAlreadyFollowing) {
    // Unfollow the user
    followedUser.followers.pull(followerId);
    follower.following.pull(followedId);
  } else {
    // Follow the user
    followedUser.followers.push(followerId);
    follower.following.push(followedId);
  }

  await followedUser.save();
  await follower.save();

  return { followedUser, isFollowing: !isAlreadyFollowing };
};
exports.sendFriendRequest = async (userId, senderId) => {
  const user = await Users.findById(userId);
  if (!user) throw new Error("User not found");

  // Prevent sending a friend request to themselves
  if (userId === senderId) {
    throw new Error("You cannot send a friend request to yourself");
  }

  // Check if the sender is already in the friends list
  if (user.friends.includes(senderId)) {
    throw new Error("You are already friends with this user");
  }
  // Check if a pending friend request already exists
  const existingRequest = user.friendRequests.find(request =>
    request.sender.toString() === senderId && request.status === 'pending'
  );
  if (existingRequest) {
    throw new Error("A pending friend request already exists from this user");
  }
  if (user) {
    // Tạo đối tượng yêu cầu kết bạn mới
    const newFriendRequest = {
      sender: senderId, // Thay thế bằng ID của người gửi
      status: 'pending', // Trạng thái mặc định
    };
    // Add the senderId to the friendRequests array
    user.friendRequests.push(newFriendRequest);

    // Save the updated user document
    await user.save();

    return user; // Return the updated user
  };
}
exports.updateFriendRequestStatus = async (userId, requestId, newStatus) => {
  try {
    // Tìm người dùng
    const user = await Users.findById(userId);

    if (!user) {
      return { success: false, message: 'Người dùng không tồn tại.' };
    }

    // Tìm yêu cầu kết bạn trong mảng friendRequests
    const request = user.friendRequests.id(requestId);

    if (!request) {
      return { success: false, message: 'Yêu cầu kết bạn không tồn tại.' };
    }

    // Cập nhật trạng thái
    request.status = newStatus;
    // Nếu trạng thái là 'accepted', cập nhật danh sách bạn bè
    if (newStatus === 'accepted') {
      // Tìm người gửi yêu cầu
      const senderId = request.sender;

      // Cập nhật danh sách bạn bè cho cả hai người dùng
      await Users.updateOne(
        { _id: userId },
        { $addToSet: { friends: senderId } } // Thêm sender vào danh sách bạn bè của người nhận
      );

      await Users.updateOne(
        { _id: senderId },
        { $addToSet: { friends: userId } } // Thêm người nhận vào danh sách bạn bè của người gửi
      );
    }
    // Nếu trạng thái không phải là 'pending', xóa yêu cầu
    if (newStatus !== 'pending') {
      user.friendRequests = user.friendRequests.filter(req => req._id.toString() !== requestId); // Xóa yêu cầu kết bạn
    }
    // Lưu thay đổi
    await user.save();
    // Nếu trạng thái là 'rejected', xóa yêu cầu

    return { success: true, request };
  } catch (error) {
    console.error('Lỗi:', error);
    return { success: false, message: 'Đã xảy ra lỗi trong quá trình cập nhật.' };
  }
};

exports.getFriendRequests = async (userId) => {
  try {
    // Tìm người dùng và populate friendRequests với thông tin người gửi
    const user = await Users.findById(userId)
      .populate({
        path: 'friendRequests.sender', // Populate trường sender trong friendRequests
        select: 'firstName lastName email profileUrl' // Chọn các trường cần thiết
      })
      .select('friendRequests'); // Chọn trường friendRequests

    if (!user) {
      console.log('Người dùng không tồn tại.');
      return null; // Hoặc xử lý theo cách bạn muốn
    }

    console.log(user.friendRequests);
    return user.friendRequests; // Trả về các yêu cầu kết bạn đã được populate
  } catch (error) {
    console.error('Lỗi:', error);
  }
};

exports.getBlockedUsers = async (userId) => {
  // Find the user by ID and populate the blockedUsers array
  return await Users.findById(userId)
    .select('blockedUsers')  // Only select blockedUsers to reduce data size
    .populate('blockedUsers', 'firstName lastName  profileUrl'); // Populate with specific fields
};
exports.toggleBlockStatus = async (currentUserId, targetUserId) => {
  const currentUser = await Users.findById(currentUserId);

  if (!currentUser) {
    throw new Error("Current user not found");
  }

  const isBlocked = currentUser.blockedUsers.includes(targetUserId);

  // Define the update operation based on block status
  const updateOperation = isBlocked
    ? { $pull: { blockedUsers: targetUserId } } // Unblock if blocked
    : { $addToSet: { blockedUsers: targetUserId } }; // Block if not blocked

  // Update the user's blockedUsers array
  await Users.findByIdAndUpdate(currentUserId, updateOperation);

  return isBlocked ? 'User unblocked successfully' : 'User blocked successfully';
};
// CREATE user
exports.createUser = async (userData) => {
  // Giới hạn các trường được phép tạo người dùng
  const allowedFields = ['firstName', 'lastName', 'email', 'password', 'location', 'profileUrl', 'profession', 'workplace', 'birthDate'];
  const fieldsToCreate = Object.keys(userData).filter(key => allowedFields.includes(key));

  if (fieldsToCreate.length === 0) {
    throw new Error("No valid fields provided for user creation");
  }

  const validUserData = {};
  fieldsToCreate.forEach(field => {
    validUserData[field] = userData[field];
  });

  const user = new Users(validUserData);
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
exports.updateUser = async (userId, updateData) => {
  // Giới hạn các trường được phép cập nhật
  const allowedUpdates = ['firstName', 'lastName', 'location', 'profileUrl', 'profession', 'workplace', 'birthDate'];
  const updates = Object.keys(updateData).filter(key => allowedUpdates.includes(key));

  if (updates.length === 0) {
    throw new Error("No valid fields to update");
  }

  // Tạo một đối tượng cập nhật chỉ chứa các trường được phép
  const validUpdateData = {};
  updates.forEach(update => {
    validUpdateData[update] = updateData[update];
  });

  const user = await Users.findByIdAndUpdate(userId, validUpdateData, { new: true, runValidators: true });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}


// DELETE user
exports.deleteUser = async (userId) => {
  return await Users.findByIdAndDelete(userId);
};
