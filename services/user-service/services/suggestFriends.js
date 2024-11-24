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

    // Lấy danh sách suggestFriends từ cơ sở dữ liệu của người dùng
    const suggestFriends = user.suggestFriends.map(friend => friend.toString());

    // Tìm những người dùng chưa phải bạn bè, chưa có trong danh sách bạn bè hoặc yêu cầu bạn bè, và có trong suggestFriends
    let suggestedFriends = await Users.find({
        _id: { $in: suggestFriends }, // Chỉ lấy những người có trong suggestFriends của người dùng
        statusActive: true // Chỉ gợi ý người dùng có tài khoản hoạt động
    })
        .select('firstName lastName location profileUrl profession suggestFriends'); // Chọn trường thông tin cần thiết

    // Nếu số lượng gợi ý chưa đủ, lấy thêm người dùng từ cơ sở dữ liệu
    if (suggestedFriends.length < limit) {
        const remainingLimit = limit - suggestedFriends.length;

        const additionalFriends = await Users.find({
            _id: { $nin: excludeIds }, // Loại trừ các userId trong mảng excludeIds
            statusActive: true // Chỉ gợi ý người dùng có tài khoản hoạt động
        })
            .limit(remainingLimit) // Lấy thêm số lượng còn thiếu
            .select('firstName lastName location profileUrl profession'); // Chọn trường thông tin cần thiết

        suggestedFriends = [...suggestedFriends, ...additionalFriends]; // Kết hợp danh sách đã lấy và thêm gợi ý mới
    }

    return suggestedFriends.slice(0, limit); // Đảm bảo danh sách gợi ý không vượt quá giới hạn
};
