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
exports.getUserRegistrationStats = async (timePeriod = 'day') => {
    let match = {};  // Điều kiện lọc dữ liệu theo thời gian

    // Xử lý các trường hợp "ngày", "tuần", "tháng"
    if (timePeriod === 'week') {
        match.createdAt = {
            $gte: moment().subtract(1, 'weeks').startOf('week').toDate(),  // Tính từ đầu tuần hiện tại
        };
    } else if (timePeriod === 'month') {
        match.createdAt = {
            $gte: moment().subtract(1, 'months').startOf('month').toDate(),  // Tính từ đầu tháng hiện tại
        };
    } else {
        // Mặc định là thống kê theo ngày
        match.createdAt = {
            $gte: moment().startOf('day').toDate(), // Tính từ đầu ngày hiện tại
        };
    }

    // Tạo truy vấn để nhóm số người dùng đăng ký theo ngày
    const result = await Users.aggregate([
        { $match: match },  // Lọc dữ liệu theo khoảng thời gian
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },  // Nhóm theo ngày tháng
                count: { $sum: 1 }  // Đếm số lượng người dùng trong mỗi nhóm
            }
        },
        { $sort: { "_id": 1 } }  // Sắp xếp theo ngày (tăng dần)
    ]);

    return result;  // Trả về kết quả
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
                    age: {
                        $subtract: [
                            { $year: new Date() },  // Năm hiện tại
                            { $year: "$birthDate" }  // Năm sinh của người dùng
                        ]
                    }
                }
            },
            {
                $bucket: {
                    groupBy: "$age",  // Nhóm theo độ tuổi
                    boundaries: [0, 18, 25, 35, 45, 55, 65, 100],  // Các nhóm độ tuổi
                    default: "Others",  // Nếu ngoài phạm vi thì nhóm là "Others"
                    output: {
                        count: { $sum: 1 }  // Đếm số lượng người dùng trong mỗi nhóm độ tuổi
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    ageGroup: "$_id",  // Tên nhóm độ tuổi
                    count: 1
                }
            },
            {
                $sort: { ageGroup: 1 }  // Sắp xếp theo nhóm độ tuổi
            }
        ]);

        return ageStats;
    } catch (error) {
        throw new Error("Error fetching age statistics: " + error.message);
    }
};


