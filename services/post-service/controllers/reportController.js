// Import các hàm từ service
const { getReportsByPost, getReportsByReason, getReportsByDate, getPostsByDate } = require('../services/reportService');

// Controller lấy thống kê số lượng báo cáo theo bài post
exports.getReportsByPostController = async (req, res) => {
    try {
        const reports = await getReportsByPost(); // Gọi hàm từ service
        res.status(200).json(reports); // Trả về kết quả
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi lấy thống kê theo bài post", error: error.message });
    }
};

// Controller lấy thống kê số lượng báo cáo theo lý do
exports.getReportsByReasonController = async (req, res) => {
    try {
        const reports = await getReportsByReason(); // Gọi hàm từ service
        res.status(200).json(reports); // Trả về kết quả
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi lấy thống kê theo lý do", error: error.message });
    }
};

// Controller lấy thống kê số lượng báo cáo theo thời gian (ngày, tháng, năm)
exports.getReportsByDateController = async (req, res) => {
    const { groupBy } = req.query; // Tham số groupBy có thể là 'day', 'month', 'year'

    if (!groupBy) {
        return res.status(400).json({ message: "Missing query parameter: groupBy" });
    }

    try {
        const reports = await getReportsByDate(groupBy); // Gọi hàm từ service
        res.status(200).json(reports); // Trả về kết quả
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi lấy thống kê theo thời gian", error: error.message });
    }
};
// Controller để lấy thống kê bài post theo ngày, tháng, năm
exports.getPostsByDateController = async function (req, res) {
    try {
        const { groupBy } = req.query;

        if (!groupBy || !['day', 'month', 'year'].includes(groupBy)) {
            return res.status(400).json({ error: "Invalid 'groupBy' parameter. Use 'day', 'month', or 'year'." });
        }

        const postsByDate = await getPostsByDate(groupBy);

        res.status(200).json(postsByDate);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while retrieving post statistics." });
    }
};