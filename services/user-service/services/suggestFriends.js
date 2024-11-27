const Users = require('../models/userModel'); // Đảm bảo đường dẫn chính xác đến model Userconst Users = require('../models/userModel'); // Đảm bảo đường dẫn chính xác đến model User
exports.getFriendSuggestions = async (userId, limit = 20) => {
    try {
        // Tìm người dùng theo userId và chỉ chọn các trường cần thiết
        const user = await Users.findById(userId)
            .select('firstName lastName profileUrl suggestfriends friends blockedUsers') // Chỉ chọn các trường cần thiết
            .exec();

        if (!user) {
            throw new Error('Người dùng không tồn tại');
        }

        // Lấy danh sách bạn bè gợi ý ban đầu từ trường suggestfriends
        let suggestions = user.suggestfriends;

        // Nếu số lượng gợi ý bạn bè ít hơn 20, lấy thêm người dùng khác
        const additionalUsersRequired = limit - suggestions.length;

        if (additionalUsersRequired > 0) {
            // Tìm các người dùng chưa phải bạn bè, không bị chặn và không phải là người dùng hiện tại
            const additionalUsers = await Users.find({
                _id: { $ne: userId }, // Loại bỏ người dùng hiện tại
                _id: { $nin: user.friends }, // Loại bỏ những người đã là bạn bè
                _id: { $nin: user.blockedUsers } // Loại bỏ những người bị chặn
            })
                .select('firstName lastName profileUrl') // Chỉ chọn các trường cần thiết
                .limit(additionalUsersRequired) // Giới hạn kết quả để lấy đúng số người cần thiết
                .exec();

            // Thêm các người dùng mới vào danh sách gợi ý
            suggestions = [...suggestions, ...additionalUsers];
        }

        // Trả về tối đa 20 người gợi ý
        return suggestions.slice(0, 20);
    } catch (error) {
        console.error(error);
        throw new Error('Có lỗi khi lấy gợi ý bạn bè');
    }
}
