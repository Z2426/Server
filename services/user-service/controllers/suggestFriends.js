const suggestFriends = require('../services/suggestFriends')
exports.getSuggestedFriends = async (req, res) => {
    try {
        const { userId } = req.body.user; // Lấy userId từ token hoặc yêu cầu
        const { limit } = req.query; // Số lượng đề xuất gợi ý, mặc định là 10
        console.log("Get suggest friends")
        const suggestedFriends = await suggestFriends.getFriendSuggestions(userId, limit);
        res.status(200).json({
            message: 'Danh sách gợi ý bạn bè',
            suggestedFriends
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Lỗi trong quá trình gợi ý bạn bè',
            error: error.message
        });
    }
};
