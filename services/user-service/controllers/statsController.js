// statsController.js
const userService = require('../services/statsService'); // Đảm bảo rằng đường dẫn đúng
exports.getUserStatsController = async (req, res) => {
    try {
        const stats = await userStatsService.getUserStats();
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// Controller để lấy thống kê người dùng theo thời gian đăng ký
exports.getUserRegistrationStats = async (req, res) => {
    try {
        const { timePeriod } = req.query; // Lấy tham số từ query (ví dụ: day, week, month)
        const stats = await userService.getUserRegistrationStats(timePeriod || 'day');
        return res.status(200).json(stats); // Trả về kết quả thống kê
    } catch (error) {
        console.error("Error fetching registration stats:", error);
        return res.status(500).json({ error: error.message });
    }
};

// Controller để lấy thống kê người dùng theo giới tính
exports.getGenderStats = async (req, res) => {
    try {
        const stats = await userService.getGenderStats();
        return res.status(200).json(stats); // Trả về kết quả thống kê
    } catch (error) {
        console.error("Error fetching gender stats:", error);
        return res.status(500).json({ error: error.message });
    }
};

// Controller để lấy thống kê người dùng theo độ tuổi
exports.getAgeStats = async (req, res) => {
    try {
        const stats = await userService.getAgeStats();
        return res.status(200).json(stats); // Trả về kết quả thống kê
    } catch (error) {
        console.error("Error fetching age stats:", error);
        return res.status(500).json({ error: error.message });
    }
};
