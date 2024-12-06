// Import các hàm từ service
const { getReportsByPost, getReportsByReason, getReportsByDate, getPostsByDate } = require('../services/reportService');

/** ================================================
 *               Report Statistics Routes
 * ================================================ */
exports.getReportsByPostController = async (req, res) => {
    try {
        const reports = await getReportsByPost();
        return res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error retrieving statistics by post", error: error.message });
    }
};

exports.getReportsByReasonController = async (req, res) => {
    try {
        const reports = await getReportsByReason();
        return res.status(200).json(reports); // Return the result
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error retrieving statistics by reason", error: error.message });
    }
};

// Controller to get report statistics by date (day, month, year)
exports.getReportsByDateController = async (req, res) => {
    const { groupBy } = req.query; // groupBy parameter can be 'day', 'month', or 'year'

    if (!groupBy) {
        return res.status(400).json({ message: "Missing query parameter: groupBy" });
    }

    try {
        const reports = await getReportsByDate(groupBy); // Call the service function
        return res.status(200).json(reports); // Return the result
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error retrieving statistics by date", error: error.message });
    }
};

/** ================================================
 *               Post Statistics Routes
 * ================================================ */

// Controller to get post statistics by date (day, month, year)
exports.getPostsByDateController = async (req, res) => {
    try {
        const { groupBy } = req.query;

        // Validate groupBy parameter
        if (!groupBy || !['day', 'month', 'year'].includes(groupBy)) {
            return res.status(400).json({ error: "Invalid 'groupBy' parameter. Use 'day', 'month', or 'year'." });
        }

        const postsByDate = await getPostsByDate(groupBy); // Call the service function

        return res.status(200).json(postsByDate); // Return the result
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An error occurred while retrieving post statistics." });
    }
};