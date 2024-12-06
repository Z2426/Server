const Users = require('../models/userModel'); // Đảm bảo đường dẫn chính xác đến model User
const requestWithCircuitBreaker = require('../shared/utils/circuitBreaker.js');
const axios = require('axios');
/** ================================================
 *                MAGE REPORT
 * ================================================ */
exports.getReportedPosts = async () => {
    try {
        const response = await requestWithCircuitBreaker(`${process.env.URL_POST_SERVICE}/reported`)
        return response;
    } catch (error) {
        throw new Error('Error fetching reported posts');
    }
};
exports.deletePostIfViolating = async (postId) => {
    try {
        const response = await requestWithCircuitBreaker(`${process.env.URL_POST_SERVICE}/${postId}/delete-violate`, 'DELETE');
        return response;
    } catch (error) {
        throw new Error('Error deleting post');
    }
};
exports.removeReportFromPost = async (postId) => {
    try {
        const response = await requestWithCircuitBreaker(`${process.env.URL_POST_SERVICE}/${postId}/approve`, 'POST');
        return response.data;
    } catch (error) {
        throw new Error('Error approving post');
    }
};
/** ================================================
 *                MAGE USER
 * ================================================ */
exports.getUsers = async (filters) => {
    return await Users.find(filters).select('firstName lastName email verified statusActive lastLogin');
};
exports.getUserById = async (id) => {
    return await Users.findById(id).select('firstName lastName email verified statusActive lastLogin');
};
exports.updateUser = async (id, updates) => {
    const updatedUser = await Users.findByIdAndUpdate(id, updates, { new: true })
        .select('firstName lastName email verified statusActive lastLogin');
    return updatedUser;
};
exports.toggleUserStatus = async (id) => {
    const user = await this.getUserById(id);
    if (!user) {
        throw new Error("User not found");
    }
    const newStatus = !user.statusActive;
    return await this.updateUser(id, { statusActive: newStatus });
};
exports.deleteUser = async (id) => {
    return await Users.findByIdAndDelete(id);
};