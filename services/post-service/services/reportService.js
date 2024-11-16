const Report = require('../models/reportModel'); // Import model Report
const Post = require('../models/Post');
// 1. Thống kê số lượng báo cáo theo bài post
exports.getReportsByPost = async function () {
    try {
        const reportsByPost = await Report.aggregate([
            {
                $group: {
                    _id: "$postId", // Nhóm theo postId
                    totalReports: { $sum: 1 } // Đếm số lượng báo cáo cho mỗi bài post
                }
            },
            {
                $project: {
                    _id: 0, // Loại bỏ _id
                    postId: "$_id", // Giữ lại postId
                    totalReports: 1 // Giữ lại số lượng báo cáo
                }
            }
        ]);
        return reportsByPost;
    } catch (error) {
        console.error(error);
        throw error;
    }
};


// 2. Thống kê số lượng báo cáo theo lý do
exports.getReportsByReason = async function () {
    try {
        const reportsByReason = await Report.aggregate([
            {
                $group: {
                    _id: "$reason", // Nhóm theo lý do
                    totalReports: { $sum: 1 } // Đếm số lượng báo cáo theo lý do
                }
            },
            {
                $sort: { totalReports: -1 } // Sắp xếp theo số lượng báo cáo giảm dần
            }
        ]);
        return reportsByReason;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// 3. Thống kê số lượng báo cáo theo thời gian (ngày, tháng, năm)

exports.getReportsByDate = async function (groupBy) {
    try {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // Lấy tháng (0-indexed, nên +1)
        const currentDay = currentDate.getDate();

        const matchStage = {};

        // Tạo điều kiện lọc (matchStage) dựa trên groupBy
        if (groupBy === 'day') {
            // Ngày đầu tiên trong tháng đến ngày hiện tại
            const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
            matchStage.createdAt = { $gte: startOfMonth, $lte: currentDate };
        } else if (groupBy === 'month') {
            // Các tháng từ tháng đầu tiên đến tháng hiện tại trong năm
            const startOfYear = new Date(currentYear, 0, 1);
            matchStage.createdAt = { $gte: startOfYear, $lte: currentDate };
        } else if (groupBy === 'year') {
            // Các năm từ 2024 đến năm hiện tại
            const startOfYear = new Date(2024, 0, 1);
            matchStage.createdAt = { $gte: startOfYear, $lte: currentDate };
        } else {
            throw new Error("Invalid groupBy parameter. Use 'day', 'month', or 'year'.");
        }

        // Xác định nhóm
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

        // Pipeline tổng hợp
        const reportsByDate = await Report.aggregate([
            { $match: matchStage }, // Lọc theo thời gian
            { $group: groupStage }, // Nhóm theo ngày, tháng, hoặc năm
            { $sort: { "_id": 1 } } // Sắp xếp theo thời gian tăng dần
        ]);

        return reportsByDate;
    } catch (error) {
        console.error(error);
        throw error;
    }
};
// 4. Thống kê bài post được tạo trong ngày tháng năm
exports.getPostsByDate = async function (groupBy) {
    try {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // Lấy tháng (0-indexed, nên +1)
        const currentDay = currentDate.getDate();

        const matchStage = {};

        // Tạo bộ lọc (matchStage) dựa trên groupBy
        if (groupBy === 'day') {
            // Lọc từ ngày đầu tiên của tháng đến ngày hiện tại
            const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
            matchStage.createdAt = { $gte: startOfMonth, $lte: currentDate };
        } else if (groupBy === 'month') {
            // Lọc từ tháng đầu tiên của năm đến tháng hiện tại
            const startOfYear = new Date(currentYear, 0, 1);
            matchStage.createdAt = { $gte: startOfYear, $lte: currentDate };
        } else if (groupBy === 'year') {
            // Lọc từ năm 2024 đến năm hiện tại
            const startOfYear = new Date(2024, 0, 1);
            matchStage.createdAt = { $gte: startOfYear, $lte: currentDate };
        } else {
            throw new Error("Invalid groupBy parameter. Use 'day', 'month', or 'year'.");
        }

        // Xác định nhóm
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

        // Pipeline tổng hợp
        const postsByDate = await Post.aggregate([
            { $match: matchStage }, // Lọc theo thời gian
            { $group: groupStage }, // Nhóm theo ngày, tháng, hoặc năm
            { $sort: { "_id": 1 } } // Sắp xếp theo thời gian tăng dần
        ]);

        return postsByDate;
    } catch (error) {
        console.error(error);
        throw error;
    }
};