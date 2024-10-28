const User = require('../models/userModel');
exports.loginUser = async (email, password) => {
    try {
        // Tìm người dùng theo email
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw new Error("Invalid email or password!");
        }
        const isMatch = await global.checkPassword(password, user.password);
        logger.info("ismath", isMatch)
        if (!isMatch) {
            throw new Error("Invalid email or password!");
        }
        if (!user.verified) {
            throw new Error("Please verify email before ")
        }
        // Tạo token
        const token = generateToken({ id: user._id, role: user.role });
        return { user, token }; // Trả về thông tin người dùng và token

    } catch (error) {
        console.log(error)
        throw error;
    }

};