const authService = require('../services/authService')
const axios = require('axios');
exports.verifyTokenController = (req, res) => {
    const token = req.body.token;

    try {
        const data = authService.verifyToken(token);
        res.json(data);
    } catch (error) {
        const status = error.message === "Token missing" ? 401 : 403;
        res.status(status).json({ message: error.message });
    }
};
// Hàm đăng nhập người dùng
exports.login = async (req, res) => {
    const { email, password } = req.body; // Lấy email và password từ request body

    try {
        // Gọi hàm loginUser trong authService để đăng nhập người dùng
        const result = await authService.loginUser(email, password);

        // Trả về thông tin người dùng và token
        return res.status(200).json({
            message: 'Đăng nhập thành công',
            user: result.user,
            token: result.token,
        });
    } catch (error) {
        // Xử lý lỗi nếu có
        return res.status(401).json({
            message: `Lỗi đăng nhập: ${error.message}`,
        });
    }
}
exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "All fields are required!" });
        }
        const hashedPassword = await global.hashPassword(password);
        // Gọi service đăng ký
        const user = await authService.registerUser({ firstName, lastName, email, password: hashedPassword });
        return res.status(201).json({
            message: "User registered successfully!",
            user
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}