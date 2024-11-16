const mongoose = require('mongoose');
const Users = require('../models/userModel');
//const moment = require('moment'); // Đảm bảo đã cài moment
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
// Service to get user registration statistics by time period (day, week, month)
// Service to get user registration statistics by time period (day, week, month)
// Service to get user registration statistics by time period (day, week, month)
exports.getUserRegistrationStats = async (timePeriod = 'day') => {
    const now = new Date(); // Ngày hiện tại
    let groupBy, startDate;

    if (timePeriod === 'day') {
        // Thống kê theo ngày trong tháng hiện tại
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Đầu tháng hiện tại
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }; // Nhóm theo ngày
    } else if (timePeriod === 'week') {
        // Thống kê tối đa 12 tuần
        startDate = new Date(now);
        startDate.setDate(now.getDate() - (now.getDay() + 1) - 7 * 11); // 12 tuần trước
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian đầu ngày
        groupBy = {
            $dateToString: { format: "%Y-%U", date: "$createdAt" } // Nhóm theo tuần (năm-tuần)
        };
    } else if (timePeriod === 'month') {
        // Thống kê tối đa 12 tháng trước đó
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // 12 tháng trước
        groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } }; // Nhóm theo tháng
    } else {
        throw new Error("Invalid timePeriod. Use 'day', 'week', or 'month'.");
    }

    try {
        // Truy vấn dữ liệu thống kê
        const result = await Users.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate } // Lọc bản ghi từ `startDate` trở đi
                }
            },
            {
                $group: {
                    _id: groupBy, // Nhóm theo ngày, tuần, hoặc tháng
                    count: { $sum: 1 } // Đếm số lượng người dùng trong mỗi nhóm
                }
            },
            {
                $sort: { _id: 1 } // Sắp xếp kết quả theo thời gian tăng dần
            }
        ]);

        return result; // Trả về kết quả
    } catch (error) {
        console.error("Error fetching user registration stats:", error);
        throw new Error("Error fetching user registration stats");
    }
};


// Service to get the number of users grouped by gender
exports.getGenderStats = async () => {
    try {
        const genderStats = await Users.aggregate([
            {
                $group: {
                    _id: "$gender",  // Nhóm theo giới tính
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    gender: "$_id",  // Chuyển đổi _id thành field gender
                    count: 1
                }
            },
            {
                $sort: { gender: 1 } // Sắp xếp theo giới tính (tùy chọn)
            }
        ]);

        return genderStats;
    } catch (error) {
        throw new Error("Error fetching gender statistics: " + error.message);
    }
};

// Service to get the number of users grouped by age group
exports.getAgeStats = async () => {
    try {
        const ageStats = await Users.aggregate([
            {
                $addFields: {
                    birthDate: {
                        $cond: [
                            { $eq: [{ $type: "$birthDate" }, "string"] }, // Nếu birthDate là chuỗi
                            { $toDate: "$birthDate" },                  // Chuyển đổi thành Date
                            "$birthDate"                               // Ngược lại giữ nguyên
                        ]
                    },
                    age: {
                        $subtract: [
                            new Date().getFullYear(), // Năm hiện tại
                            { $year: "$birthDate" }  // Năm sinh của người dùng
                        ]
                    }
                }
            },
            {
                $bucket: {
                    groupBy: "$age", // Nhóm theo độ tuổi
                    boundaries: [0, 18, 25, 35, 45, 55, 65, 100], // Các nhóm độ tuổi
                    default: "Others", // Nếu ngoài phạm vi thì nhóm là "Others"
                    output: {
                        count: { $sum: 1 } // Đếm số lượng người dùng trong mỗi nhóm độ tuổi
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    ageGroup: "$_id", // Tên nhóm độ tuổi
                    count: 1
                }
            },
            {
                $sort: { ageGroup: 1 } // Sắp xếp theo nhóm độ tuổi
            }
        ]);

        return ageStats;
    } catch (error) {
        throw new Error("Error fetching age statistics: " + error.message);
    }
};


