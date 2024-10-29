const requestWithCircuitBreaker = require('../shared/utils/circuitBreaker.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
exports.registerUser = async (userData) => {
    const url = `http://user-service:${process.env.USER_SERVICE_PORT}/api/users`; // Địa chỉ của service tạo người dùng
    try {
        const headers = {
            'Content-Type': 'application/json',
        };
        // Sử dụng hàm requestWithCircuitBreaker để gửi yêu cầu POST
        const newUser = await requestWithCircuitBreaker(url, 'POST', userData, headers);
        console.log('Người dùng mới đã được tạo:', newUser);
        return newUser; // Trả về dữ liệu người dùng mới
    } catch (error) {
        console.error('Lỗi khi tạo người dùng:', error.response ? error.response.data : error.message);
        throw new Error(error.response ? error.response.data.message : error.message); // Ném lỗi với thông điệp rõ ràng hơn
    }
};
exports.loginUser = async (email, password) => {
    console.log(email, password);
    const urlGetUser = `http://user-service:${process.env.USER_SERVICE_PORT}/api/users/find-email-user`;
    const urlUpdateInfoLogin = `http://user-service:${process.env.USER_SERVICE_PORT}/api/users/login-info`;
    try {
        // Tìm người dùng theo email
        const user = await requestWithCircuitBreaker(urlGetUser, "POST", { email: email }); // Chọn cả trường password

        // Kiểm tra nếu không tìm thấy người dùng
        if (!user) {
            throw new Error('Email không đúng.');
        }
        console.log(user.loginAttempts)
        // Kiểm tra mật khẩu
        const isMatch = await global.checkPassword(password, user.password);
        if (!isMatch) {
            // Nếu mật khẩu không khớp, tăng số lần đăng nhập thất bại
            user.loginAttempts += 1;
            console.log(user.loginAttempts)
            await requestWithCircuitBreaker(urlUpdateInfoLogin, "PUT", {
                email: email,
                loginAttempts: user.loginAttempts,
                lastLogin: user.lastLogin
            });
            throw new Error('Mật khẩu không đúng.');
        }

        // Tạo token
        const token = global.generateToken({ userId: user._id });

        // Ghi lại thời gian đăng nhập và reset loginAttempts
        const infoLogin = {
            email: email,
            loginAttempts: 0,
            lastLogin: new Date()
        };
        user.loginAttempts = 0; // Reset số lần đăng nhập thất bại
        await requestWithCircuitBreaker(urlUpdateInfoLogin, "PUT", infoLogin);

        return { user, token }; // Trả về thông tin người dùng và token
    } catch (error) {
        throw new Error(`Lỗi đăng nhập: ${error.message}`);
    }
};