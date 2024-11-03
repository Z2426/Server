const mongoose = require('mongoose');  // Đảm bảo khai báo ở đây
const Users = require('../models/userModel'); // Đảm bảo đường dẫn chính xác đến model User
const { checkPassword, hashPassword, generateToken, verifyToken } = require("../utils/index");  // Đảm bảo đường dẫn chính xác
exports.searchUsersByKeyword = async (keyword) => {
  try {
    const users = await Users.find({
      $or: [
        { firstName: new RegExp(keyword, 'i') }, // Tìm theo tên
        { lastName: new RegExp(keyword, 'i') },  // Tìm theo họ
        { email: new RegExp(keyword, 'i') }       // Tìm theo email
      ]
    }, 'firstName lastName profileUrl'); // Chỉ chọn các thuộc tính này
    return users; // Trả về danh sách người dùng tìm được
  } catch (error) {
    console.error('Error searching users:', error.message);
    throw new Error('Lỗi trong quá trình tìm kiếm người dùng');
  }
};
exports.getFriends = async (userId, page = 1, limit = 10) => {
  // Lấy thông tin người dùng và danh sách bạn bè
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
// Hàm lấy thông tin người dùng theo nhiều ID
exports.getUsersByIds = async (userIds) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'profileUrl']
    // Tạo chuỗi trường cho phép từ mảng allowedFields
    const fieldsToSelect = allowedFields.join(' ');
    // Tìm người dùng theo ID và chỉ lấy các trường cho phép
    const users = await Users.find({ _id: { $in: userIds } }).select(fieldsToSelect);
    return users;
  } catch (error) {
    throw new Error('Error fetching users');
  }
};
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
  try {
    const user = await Users.findOne({ email }).select('+password'); // Chọn cả trường password
    if (!user) {
      throw new Error('User not found'); // Ném lỗi nếu không tìm thấy người dùng
    }
    return user; // Trả về người dùng nếu tìm thấy
  } catch (error) {
    console.error('Lỗi khi tìm kiếm người dùng:', error.message);
    throw new Error(error.message); // Ném lỗi với thông điệp rõ ràng hơn
  }
};

// Cập nhật thông tin người dùng
exports.updateInfoLoginUser = async (email, updateData) => {
  try {
    const updatedUser = await Users.findOneAndUpdate({ email }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      throw new Error('User not found'); // Ném lỗi nếu không tìm thấy người dùng
    }

    return updatedUser; // Trả về người dùng đã được cập nhật
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin người dùng:', error.message);
    throw new Error(error.message); // Ném lỗi với thông điệp rõ ràng hơn
  }
};

// Xác minh tài khoản người dùng
exports.verifyAccount = async (userId) => {
  try {
    const user = await Users.findById(userId); // Tìm kiếm người dùng theo ID
    if (!user) {
      throw new Error('User not found'); // Ném lỗi nếu không tìm thấy người dùng
    }

    // Cập nhật trạng thái xác minh của người dùng
    user.verified = true;
    await user.save();

    return 'Account verified successfully'; // Trả về thông báo thành công
  } catch (error) {
    console.error('Lỗi khi xác minh tài khoản:', error.message);
    throw new Error(error.message); // Ném lỗi với thông điệp rõ ràng hơn
  }
};



// Tạo một token đặt lại cho người dùng
exports.generateResetToken = async (email) => {
  try {
    const user = await Users.findOne({ email });
    if (!user) {
      throw new Error("User not found"); // Ném lỗi nếu không tìm thấy người dùng
    }

    // Tạo một token với ID người dùng và thiết lập thời gian hết hạn
    const token = generateToken({ id: user._id });
    return token; // Trả về token đã tạo
  } catch (error) {
    console.error('Lỗi khi tạo token đặt lại:', error.message);
    throw new Error(error.message); // Ném lỗi với thông điệp rõ ràng hơn
  }
};

// Xác minh token và đặt lại mật khẩu
exports.resetPassword = async (email, newPassword, token) => {
  try {
    // Xác minh token
    const decoded = verifyToken(token);
    if (!decoded) {
      throw new Error("Invalid or expired token"); // Ném lỗi nếu token không hợp lệ hoặc hết hạn
    }

    // Tìm người dùng
    const user = await Users.findOne({ email });
    if (!user) {
      throw new Error("User not found"); // Ném lỗi nếu không tìm thấy người dùng
    }

    // Băm mật khẩu mới
    const hashedPassword = await hashPassword(newPassword);

    // Cập nhật mật khẩu của người dùng
    user.password = hashedPassword;
    await user.save();

    return user; // Trả về đối tượng người dùng đã được cập nhật nếu cần
  } catch (error) {
    console.error('Lỗi khi đặt lại mật khẩu:', error.message);
    throw new Error(error.message); // Ném lỗi với thông điệp rõ ràng hơn
  }
};

// Thay đổi mật khẩu
exports.changePassword = async (userId, oldPassword, newPassword) => {
  try {
    // Lấy thông tin người dùng, bao gồm mật khẩu đã băm
    const user = await Users.findById(userId).select("+password");
    if (!user) throw new Error("User not found"); // Ném lỗi nếu không tìm thấy người dùng

    // Kiểm tra xem mật khẩu cũ có đúng không
    const isMatch = await checkPassword(oldPassword, user.password);
    if (!isMatch) throw new Error("Old password is incorrect"); // Ném lỗi nếu mật khẩu cũ không đúng

    // Băm mật khẩu mới
    user.password = await hashPassword(newPassword);
    await user.save();

    return { message: "Password updated successfully" }; // Trả về thông báo thành công
  } catch (error) {
    console.error('Lỗi khi thay đổi mật khẩu:', error.message);
    throw new Error(error.message); // Ném lỗi với thông điệp rõ ràng hơn
  }
};

// Hàm để lấy danh sách người dùng mà một người dùng nhất định đang theo dõi
exports.getFollowing = async (userId) => {
  try {
    const user = await Users.findById(userId)
      .select("following") // Chọn trường following
      .populate("following", "firstName lastName email profileUrl"); // Populate với các trường cần thiết

    if (!user) throw new Error("User not found"); // Ném lỗi nếu không tìm thấy người dùng
    return user.following; // Trả về danh sách người dùng mà người dùng này đang theo dõi
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người theo dõi:', error.message);
    throw new Error(error.message); // Ném lỗi với thông điệp rõ ràng hơn
  }
};



// Hàm để lấy danh sách người theo dõi cho một người dùng nhất định
exports.getFollowers = async (userId) => {
  try {
    const user = await Users.findById(userId)
      .select("followers") // Chọn trường followers
      .populate("followers", "firstName lastName email profileUrl"); // Populate với các trường cần thiết

    if (!user) throw new Error("User not found"); // Ném lỗi nếu không tìm thấy người dùng
    return user.followers; // Trả về danh sách người theo dõi
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người theo dõi:', error.message);
    throw new Error(error.message); // Ném lỗi với thông điệp rõ ràng hơn
  }
};

// Hàm để theo dõi hoặc bỏ theo dõi một người dùng
exports.toggleFollowUser = async (followerId, followedId) => {
  try {
    if (followerId === followedId) throw new Error("Cannot follow yourself"); // Ném lỗi nếu người dùng cố gắng theo dõi chính mình

    const followedUser = await Users.findById(followedId);
    const follower = await Users.findById(followerId);
    if (!followedUser || !follower) throw new Error("User not found"); // Ném lỗi nếu không tìm thấy người dùng

    const isAlreadyFollowing = followedUser.followers.includes(followerId); // Kiểm tra xem đã theo dõi chưa

    if (isAlreadyFollowing) {
      // Bỏ theo dõi
      followedUser.followers.pull(followerId);
      follower.following.pull(followedId);
    } else {
      // Theo dõi
      followedUser.followers.push(followerId);
      follower.following.push(followedId);
    }

    await followedUser.save(); // Lưu thay đổi cho người được theo dõi
    await follower.save(); // Lưu thay đổi cho người theo dõi

    return { followedUser, isFollowing: !isAlreadyFollowing }; // Trả về người được theo dõi và trạng thái theo dõi
  } catch (error) {
    console.error('Lỗi khi thay đổi trạng thái theo dõi:', error.message);
    throw new Error(error.message); // Ném lỗi với thông điệp rõ ràng hơn
  }
};

// Hàm để gửi yêu cầu kết bạn
exports.sendFriendRequest = async (userId, senderId) => {
  try {
    const user = await Users.findById(userId);
    if (!user) throw new Error("User not found"); // Ném lỗi nếu không tìm thấy người dùng

    // Ngăn không cho gửi yêu cầu kết bạn đến chính mình
    if (userId === senderId) {
      throw new Error("You cannot send a friend request to yourself");
    }

    // Kiểm tra xem người gửi đã là bạn chưa
    if (user.friends.includes(senderId)) {
      throw new Error("You are already friends with this user");
    }

    // Kiểm tra yêu cầu kết bạn đang chờ xử lý
    const existingRequest = user.friendRequests.find(request =>
      request.sender.toString() === senderId && request.status === 'pending'
    );
    if (existingRequest) {
      throw new Error("A pending friend request already exists from this user");
    }

    // Tạo đối tượng yêu cầu kết bạn mới
    const newFriendRequest = {
      sender: senderId, // ID của người gửi
      status: 'pending', // Trạng thái mặc định
    };

    // Thêm senderId vào mảng friendRequests
    user.friendRequests.push(newFriendRequest);

    // Lưu thay đổi
    await user.save();

    return user; // Trả về người dùng đã được cập nhật
  } catch (error) {
    console.error('Lỗi khi gửi yêu cầu kết bạn:', error.message);
    throw new Error(error.message); // Ném lỗi với thông điệp rõ ràng hơn
  }
};

// Hàm để cập nhật trạng thái yêu cầu kết bạn
exports.updateFriendRequestStatus = async (userId, requestId, newStatus) => {
  try {
    const user = await Users.findById(userId);
    if (!user) {
      return { success: false, message: 'Người dùng không tồn tại.' };
    }

    const request = user.friendRequests.id(requestId);
    if (!request) {
      return { success: false, message: 'Yêu cầu kết bạn không tồn tại.' };
    }

    // Cập nhật trạng thái
    request.status = newStatus;

    // Nếu trạng thái là 'accepted', cập nhật danh sách bạn bè
    if (newStatus === 'accepted') {
      const senderId = request.sender; // ID người gửi yêu cầu

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

    return { success: true, request }; // Trả về yêu cầu đã được cập nhật
  } catch (error) {
    console.error('Lỗi:', error);
    return { success: false, message: 'Đã xảy ra lỗi trong quá trình cập nhật.' };
  }
};

// Hàm để lấy danh sách yêu cầu kết bạn của người dùng
exports.getFriendRequests = async (userId) => {
  try {
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


// Get blocked users
exports.getBlockedUsers = async (userId) => {
  try {
    return await Users.findById(userId)
      .select('blockedUsers')  // Only select blockedUsers to reduce data size
      .populate('blockedUsers', 'firstName lastName profileUrl'); // Populate with specific fields
  } catch (error) {
    throw new Error("Error fetching blocked users: " + error.message);
  }
};

// Toggle block status
exports.toggleBlockStatus = async (currentUserId, targetUserId) => {
  try {
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
  } catch (error) {
    throw new Error("Error toggling block status: " + error.message);
  }
};

// CREATE user
exports.createUser = async (userData) => {
  try {
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
  } catch (error) {
    throw new Error("Error creating user: " + error.message);
  }
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
  try {
    const selectFields = fields.join(' '); // Create a space-separated string of fields
    return await Users.findById(userId, selectFields); // Find user by ID and select fields if provided
  } catch (error) {
    throw new Error("Error fetching user by ID: " + error.message);
  }
};

// UPDATE user
exports.updateUser = async (userId, updateData) => {
  try {
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
  } catch (error) {
    throw new Error("Error updating user: " + error.message);
  }
};

// DELETE user
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