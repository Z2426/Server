const authService = require('../services/authService')
const userService = require('../services/userService');
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Kiểm tra xem tất cả các trường cần thiết đã được cung cấp
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required!" });
        }
        // Gọi service đăng nhập
        const { user, token } = await authService.loginUser(email, password);
        logger.info(user)
        logger.info(token)
        // Trả về thông tin người dùng và token
        return res.status(200).json({
            message: "Login successful!",
            user,
            token
        });
    } catch (error) {
        // Xử lý lỗi từ service
        if (error.message === "Invalid email or password!") {
            return res.status(401).json({ message: error.message });
        }
        // Trả về lỗi 500 cho các lỗi khác
        return res.status(500).json({ message: error.message });
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
        const user = await userService.createUser({ firstName, lastName, email, password: hashedPassword });
        return res.status(201).json({
            message: "User registered successfully!",
            user
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}