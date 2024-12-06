const Report = require('../models/reportModel'); // Import model Report
const Post = require('../models/Post');
/** ================================================
 *                Statisics post & report
 * ================================================ */
exports.getReportsByPost = async function () {
    try {
        const reportsByPost = await Report.aggregate([
            {
                $group: {
                    _id: "$postId",
                    totalReports: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    postId: "$_id",
                    totalReports: 1
                }
            }
        ]);
        return reportsByPost;
    } catch (error) {
        console.error(error);
        throw error;
    }
};
exports.getReportsByReason = async function () {
    try {
        const reportsByReason = await Report.aggregate([
            {
                $group: {
                    _id: "$reason",
                    totalReports: { $sum: 1 }
                }
            },
            {
                $sort: { totalReports: -1 }
            }
        ]);
        return reportsByReason;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

exports.getReportsByDate = async function (groupBy) {
    try {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const currentDay = currentDate.getDate();
        const matchStage = {};
        if (groupBy === 'day') {
            const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
            matchStage.createdAt = { $gte: startOfMonth, $lte: currentDate };
        } else if (groupBy === 'month') {
            const startOfYear = new Date(currentYear, 0, 1);
            matchStage.createdAt = { $gte: startOfYear, $lte: currentDate };
        } else if (groupBy === 'year') {
            const startOfYear = new Date(2024, 0, 1);
            matchStage.createdAt = { $gte: startOfYear, $lte: currentDate };
        } else {
            throw new Error("Invalid groupBy parameter. Use 'day', 'month', or 'year'.");
        }
        const groupStage = {
            _id: null,
            totalReports: { $sum: 1 }
        };
        if (groupBy === 'day') {
            groupStage._id = {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
                day: { $dayOfMonth: "$createdAt" }
            };
        } else if (groupBy === 'month') {
            groupStage._id = {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" }
            };
        } else if (groupBy === 'year') {
            groupStage._id = { year: { $year: "$createdAt" } };
        }
        const reportsByDate = await Report.aggregate([
            { $match: matchStage },
            { $group: groupStage },
            { $sort: { "_id": 1 } }
        ]);

        return reportsByDate;
    } catch (error) {
        console.error(error);
        throw error;
    }
};
exports.getPostsByDate = async function (groupBy) {
    try {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const currentDay = currentDate.getDate();
        const matchStage = {};
        if (groupBy === 'day') {
            const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
            matchStage.createdAt = { $gte: startOfMonth, $lte: currentDate };
        } else if (groupBy === 'month') {
            const startOfYear = new Date(currentYear, 0, 1);
            matchStage.createdAt = { $gte: startOfYear, $lte: currentDate };
        } else if (groupBy === 'year') {
            const startOfYear = new Date(2024, 0, 1);
            matchStage.createdAt = { $gte: startOfYear, $lte: currentDate };
        } else {
            throw new Error("Invalid groupBy parameter. Use 'day', 'month', or 'year'.");
        }
        const groupStage = {
            _id: null,
            totalPosts: { $sum: 1 }
        };

        if (groupBy === 'day') {
            groupStage._id = {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
                day: { $dayOfMonth: "$createdAt" }
            };
        } else if (groupBy === 'month') {
            groupStage._id = {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" }
            };
        } else if (groupBy === 'year') {
            groupStage._id = { year: { $year: "$createdAt" } };
        }
        const postsByDate = await Post.aggregate([
            { $match: matchStage },
            { $group: groupStage },
            { $sort: { "_id": 1 } }
        ]);

        return postsByDate;
    } catch (error) {
        console.error(error);
        throw error;
    }
};