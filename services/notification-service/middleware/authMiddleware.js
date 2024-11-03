const requestWithCircuitBreaker = require('../shared/utils/circuitBreaker.js');
const axios = require('axios');
exports.verifyTokenMiddleware = async (req, res, next) => {
    // Lấy token từ header (ví dụ: Bearer Token)
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Token missing" });
    }
    try {
        // Gửi yêu cầu đến auth service để xác thực token bằng requestWithCircuitBreaker
        const authServiceUrl = process.env.URL_AUTH_SERVICE; // URL của auth service từ .env
        const userData = await requestWithCircuitBreaker(`${authServiceUrl}/verifyToken`, 'POST', { token });
        console.log(userData)
        // Lưu thông tin người dùng vào request object để sử dụng trong các route tiếp theo
        req.body.user = userData;
        return next(); // Tiếp tục đến route tiếp theo
    } catch (error) {
        console.error('Token verification error:', error); // Log the error for debugging
        const statusCode = error.response?.status === 403 ? 403 : 500;
        const message = statusCode === 403 ? "Invalid token" : "Internal server error";
        return res.status(statusCode).json({ message });
    }
};