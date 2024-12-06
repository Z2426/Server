const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const SALT_ROUNDS = 10;
const SECRET_KEY = process.env.SECRET_KEY;
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
}
async function checkPassword(password, hashedPassword) {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
}
function generateToken(payload) {
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '144h' });
    return token;
}
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded;
    } catch (error) {
        return null;
    }
}
global.hashPassword = hashPassword;
global.checkPassword = checkPassword;
global.generateToken = generateToken;
global.verifyToken = verifyToken;
