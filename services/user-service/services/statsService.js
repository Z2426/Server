const mongoose = require('mongoose');
const Users = require('../models/userModel');
/* STATICS ABOUT USER */
/** ================================================
 *               InsightsService  POST USER
 * ================================================ */
exports.getUserStats = async () => {
    try {
        const totalUsers = await Users.countDocuments();
        const totalRegularUsers = await Users.countDocuments({ role: 'User' });
        const totalAdmins = await Users.countDocuments({ role: 'Admin' });
        const totalVerifiedUsers = await Users.countDocuments({ verified: true });
        return {
            totalUsers,
            totalRegularUsers,
            totalAdmins,
            totalVerifiedUsers
        };
    } catch (error) {
        console.error("Error getting user statistics:", error);
        throw new Error("Error getting user statistics");
    }
};
exports.getUserRegistrationStats = async (timePeriod = 'day') => {
    const now = new Date();
    let groupBy, startDate;
    if (timePeriod === 'day') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    } else if (timePeriod === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - (now.getDay() + 1) - 7 * 11)
        startDate.setHours(0, 0, 0, 0);
        groupBy = {
            $dateToString: { format: "%Y-%U", date: "$createdAt" }
        };
    } else if (timePeriod === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
    } else {
        throw new Error("Invalid timePeriod. Use 'day', 'week', or 'month'.");
    }
    try {
        const result = await Users.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: groupBy,
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        return result;
    } catch (error) {
        console.error("Error fetching user registration stats:", error);
        throw new Error("Error fetching user registration stats");
    }
};
exports.getGenderStats = async () => {
    try {
        const genderStats = await Users.aggregate([
            {
                $group: {
                    _id: "$gender",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    gender: "$_id",
                    count: 1
                }
            },
            {
                $sort: { gender: 1 }
            }
        ]);
        return genderStats;
    } catch (error) {
        throw new Error("Error fetching gender statistics: " + error.message);
    }
};
exports.getAgeStats = async () => {
    try {
        const ageStats = await Users.aggregate([
            {
                $addFields: {
                    birthDate: {
                        $cond: [
                            { $eq: [{ $type: "$birthDate" }, "string"] },
                            { $toDate: "$birthDate" },
                            "$birthDate"
                        ]
                    },
                    age: {
                        $subtract: [
                            new Date().getFullYear(),
                            { $year: "$birthDate" }
                        ]
                    }
                }
            },
            {
                $bucket: {
                    groupBy: "$age",
                    boundaries: [0, 18, 25, 35, 45, 55, 65, 100],
                    default: "Others",
                    output: {
                        count: { $sum: 1 }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    ageGroup: "$_id",
                    count: 1
                }
            },
            {
                $sort: { ageGroup: 1 }
            }
        ]);
        return ageStats;
    } catch (error) {
        throw new Error("Error fetching age statistics: " + error.message);
    }
};


