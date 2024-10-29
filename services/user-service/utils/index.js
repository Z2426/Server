const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
// Số lượng vòng lặp để băm (thường là 10)
const SALT_ROUNDS = 10;

// Khóa bí mật để mã hóa và giải mã token
const SECRET_KEY = process.env.SECRET_KEY; // Thay đổi khóa bí mật này cho an toàn

// Hàm băm mật khẩu
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(SALT_ROUNDS); // Tạo salt
    const hashedPassword = await bcrypt.hash(password, salt); // Băm mật khẩu
    return hashedPassword; // Trả về mật khẩu đã băm
}

// Hàm kiểm tra mật khẩu
async function checkPassword(password, hashedPassword) {
    const isMatch = await bcrypt.compare(password, hashedPassword); // So sánh mật khẩu
    return isMatch; // Trả về kết quả so sánh
}

// Hàm tạo token
function generateToken(payload) {
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' }); // Token sẽ hết hạn sau 1 giờ
    return token; // Trả về token đã tạo
}

// Hàm xác thực token
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, SECRET_KEY); // Giải mã token
        return decoded; // Trả về dữ liệu đã giải mã
    } catch (error) {
        return null; // Nếu token không hợp lệ, trả về null
    }
}

// Gán vào global để sử dụng toàn cục
global.hashPassword = hashPassword;
global.checkPassword = checkPassword;
global.generateToken = generateToken;
global.verifyToken = verifyToken;
module.exports = {
    hashPassword,
    checkPassword,
    generateToken,
    verifyToken,
};
