// Import các hàm từ service
const reportService = require('../services/reportService');
/** ================================================
 *               Report Statistics Routes
 * ================================================ */
exports.getReportsByPostController = async (req, res) => {
    try {
        const reports = await reportService.getReportsByPost();
        return res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error retrieving statistics by post", error: error.message });
    }
};

exports.getReportsByReasonController = async (req, res) => {
    try {
        const reports = await reportService.getReportsByReason();
        return res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error retrieving statistics by reason", error: error.message });
    }
};
exports.getReportsByDateController = async (req, res) => {
    const { groupBy } = req.query;
    if (!groupBy) {
        return res.status(400).json({ message: "Missing query parameter: groupBy" });
    }
    try {
        const reports = await reportService.getReportsByDate(groupBy);
        return res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error retrieving statistics by date", error: error.message });
    }
};

/** ================================================
 *               Post Statistics Routes
 * ================================================ */
exports.getPostsByDateController = async (req, res) => {
    try {
        const { groupBy } = req.query;
        if (!groupBy || !['day', 'month', 'year'].includes(groupBy)) {
            return res.status(400).json({ error: "Invalid 'groupBy' parameter. Use 'day', 'month', or 'year'." });
        }
        const postsByDate = await reportService.getPostsByDate(groupBy);
        return res.status(200).json(postsByDate);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An error occurred while retrieving post statistics." });
    }
};