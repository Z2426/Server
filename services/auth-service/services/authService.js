const requestWithCircuitBreaker = require('../shared/utils/circuitBreaker.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const userServiceUrl = process.env.URL_USER_SERVICE;
const postServiceUrl = process.env.URL_POST_SERVICE;
const authServiceUrl = process.env.URL_AUTH_SERVICE;
require('dotenv').config();
exports.verifyToken = (token) => {
    if (!token) {
        throw new Error("Token missing");
    }
    try {
        const data = global.verifyToken(token);
        if (!data) {
            throw new Error("Invalid token");
        }
        return data;
    } catch (error) {
        throw new Error("Invalid token");
    }
};
exports.registerUser = async (userData) => {
    const url = `http://user-service:${process.env.USER_SERVICE_PORT}/api/users`; // Địa chỉ của service tạo người dùng
    try {
        const headers = {
            'Content-Type': 'application/json',
        };
        // Sử dụng hàm requestWithCircuitBreaker để gửi yêu cầu POST
        const newUser = await requestWithCircuitBreaker(url, 'POST', userData, headers);
        return newUser; // Trả về dữ liệu người dùng mới
    } catch (error) {
        console.error('Lỗi khi tạo người dùng:', error.response ? error.response.data : error.message);
        throw new Error(error.response ? error.response.data.message : error.message); // Ném lỗi với thông điệp rõ ràng hơn
    }
};
exports.loginUser = async (email, password) => {
    const urlGetUser = `${userServiceUrl}/find-email-user`;
    const urlUpdateInfoLogin = `${userServiceUrl}/login-info`;
    try {
        // Tìm người dùng theo email
        const user = await requestWithCircuitBreaker(urlGetUser, "POST", { email: email }); // Chọn cả trường password
        // Kiểm tra nếu không tìm thấy người dùng
        if (!user) {
            throw new Error('Email không đúng.');
        }
        const isMatch = await global.checkPassword(password, user.password);
        if (!isMatch) {
            // Nếu mật khẩu không khớp, tăng số lần đăng nhập thất bại
            user.loginAttempts += 1;
            await requestWithCircuitBreaker(urlUpdateInfoLogin, "PUT", {
                email: email,
                loginAttempts: user.loginAttempts,
                lastLogin: user.lastLogin
            });
            throw new Error('Mật khẩu không đúng.');
        }
        // Tạo token
        const token = global.generateToken({ userId: user._id, role: user.role, avatar: user.redirectUrl, name: user.firstName });
        // Ghi lại thời gian đăng nhập và reset loginAttempts
        const infoLogin = {
            email: email,
            loginAttempts: 0,
            lastLogin: new Date()
        };
        await requestWithCircuitBreaker(urlUpdateInfoLogin, "PUT", infoLogin);
        return { user, token }; // Trả về thông tin người dùng và token
    } catch (error) {
        console.log(error)
        throw new Error(`Lỗi đăng nhập: ${error.message}`);
    }
};