const suggestPost = require('../services/suggestPost')
exports.getNewsfeed = async (req, res) => {
    try {
        const { userId } = req.body.user; // Lấy userId từ token hoặc yêu cầu
        const { page = 1, limit = 10 } = req.query; // Thông tin phân trang

        const newsfeed = await suggestPost.getNewsfeed(userId, page, limit);

        res.status(200).json({
            message: 'Danh sách tin tức',
            data: newsfeed,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Lỗi trong quá trình lấy tin tức',
            error: error.message,
        });
    }
};