// statsController.js
const userService = require('../services/statsService');
/** ================================================
 *                USER STATS
 * ================================================ */

// Controller to get overall user stats
exports.getUserStatsController = async (req, res) => {
    try {
        const stats = await userService.getUserStats();
        return res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Controller to get user registration stats by time period
exports.getUserRegistrationStats = async (req, res) => {
    try {
        const { timePeriod } = req.query; // Get timePeriod from query (e.g., day, week, month)
        const stats = await userService.getUserRegistrationStats(timePeriod || 'day');
        return res.status(200).json(stats); // Return the registration stats
    } catch (error) {
        console.error("Error fetching registration stats:", error);
        return res.status(500).json({ error: error.message });
    }
};

// Controller to get user gender stats
exports.getGenderStats = async (req, res) => {
    try {
        const stats = await userService.getGenderStats();
        return res.status(200).json(stats); // Return the gender stats
    } catch (error) {
        console.error("Error fetching gender stats:", error);
        return res.status(500).json({ error: error.message });
    }
};

// Controller to get user age stats
exports.getAgeStats = async (req, res) => {
    try {
        const stats = await userService.getAgeStats();
        return res.status(200).json(stats); // Return the age stats
    } catch (error) {
        console.error("Error fetching age stats:", error);
        return res.status(500).json({ error: error.message });
    }
};