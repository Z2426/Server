const Users = require('../models/userModel'); // Đảm bảo đường dẫn chính xác đến model User
const requestWithCircuitBreaker = require('../shared/utils/circuitBreaker.js');
const axios = require('axios');
//MANGE REPORT
// Lấy danh sách bài post bị báo cáo
exports.getReportedPosts = async () => {
    try {
        const response = await requestWithCircuitBreaker(`${process.env.URL_POST_SERVICE}/reported`)
        console.log("REPHONE ", response)
        return response; // Hoặc `response` tùy vào cấu trúc phản hồi
    } catch (error) {
        throw new Error('Error fetching reported posts');
    }
};

// Xóa bài post nếu vi phạm nguyên tắc
exports.deletePostIfViolating = async (postId) => {
    try {
        const response = await requestWithCircuitBreaker(`${process.env.URL_POST_SERVICE}/${postId}/delete-violate`, 'DELETE');
        return response; // Hoặc `response` tùy vào cấu trúc phản hồi
    } catch (error) {
        throw new Error('Error deleting post');
    }
};

// Gỡ bỏ báo cáo và giữ lại bài post
exports.removeReportFromPost = async (postId) => {
    try {
        const response = await requestWithCircuitBreaker(`${process.env.URL_POST_SERVICE}/${postId}/approve`, 'POST');
        return response.data; // Hoặc `response` tùy vào cấu trúc phản hồi
    } catch (error) {
        throw new Error('Error approving post');
    }
};
//MANGE USER
// Lấy danh sách người dùng với các tùy chọn lọc, chỉ trả về các trường được phép
exports.getUsers = async (filters) => {
    return await Users.find(filters).select('firstName lastName email verified statusActive lastLogin');
};
// Lấy chi tiết người dùng theo ID, chỉ trả về các trường được phép
exports.getUserById = async (id) => {
    return await Users.findById(id).select('firstName lastName email verified statusActive lastLogin');
};

// Cập nhật thông tin người dùng theo ID, chỉ trả về các trường được phép
exports.updateUser = async (id, updates) => {
    const updatedUser = await Users.findByIdAndUpdate(id, updates, { new: true })
        .select('firstName lastName email verified statusActive lastLogin'); // Chỉ trả về các trường được phép
    return updatedUser;
};
// Hàm để toggle trạng thái người dùng
exports.toggleUserStatus = async (id) => {
    const user = await this.getUserById(id);
    if (!user) {
        throw new Error("User not found");
    }
    // Đảo ngược trạng thái active
    const newStatus = !user.statusActive;
    // Cập nhật trạng thái người dùng
    return await this.updateUser(id, { statusActive: newStatus });
};
// Xóa người dùng theo ID
exports.deleteUser = async (id) => {
    return await Users.findByIdAndDelete(id);
};