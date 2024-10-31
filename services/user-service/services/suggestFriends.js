const Users = require('../models/userModel'); // Đảm bảo đường dẫn chính xác đến model Userconst Users = require('../models/userModel'); // Đảm bảo đường dẫn chính xác đến model User
exports.suggestFriends = async (userId, limit = 10) => {
    const user = await Users.findById(userId);

    if (!user) {
        throw new Error('Người dùng không tìm thấy');
    }

    // Tập hợp các userId bạn bè hiện tại, người đã theo dõi hoặc đã nhận lời mời kết bạn
    const excludeIds = [
        userId, // Không đề xuất chính bản thân
        ...user.friends.map(friend => friend.toString()),
        ...user.friendRequests.map(request => request.sender.toString()),
        ...user.followers.map(follower => follower.toString()),
    ];

    // Tìm những người dùng chưa phải bạn bè, chưa có trong danh sách bạn bè hoặc yêu cầu bạn bè
    const suggestedFriends = await Users.find({
        _id: { $nin: excludeIds }, // Loại trừ các userId trong mảng excludeIds
        statusActive: true // Chỉ gợi ý người dùng có tài khoản hoạt động
    })
        .limit(limit) // Giới hạn số lượng người dùng gợi ý
        .select('firstName lastName location profileUrl profession'); // Chọn trường thông tin cần thiết

    return suggestedFriends;
};
