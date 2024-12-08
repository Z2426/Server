const requestWithCircuitBreaker = require('../shared/utils/circuitBreaker.js');
const userServiceUrl = process.env.URL_USER_SERVICE;
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
    const urlCreateUser = `${userServiceUrl}`;
    try {
        const headers = {
            'Content-Type': 'application/json',
        };
        const newUser = await requestWithCircuitBreaker(urlCreateUser, 'POST', userData, headers);
        return newUser;
    } catch (error) {
        console.error('ERROR WHEN CREATE  USER:', error.response ? error.response.data : error.message);
        throw new Error(error.response ? error.response.data.message : error.message);
    }
};
exports.loginUser = async (email, password) => {
    const urlGetUser = `${userServiceUrl}/find-email-user`;
    const urlUpdateInfoLogin = `${userServiceUrl}/login-info`;
    try {
        const user = await requestWithCircuitBreaker(urlGetUser, "POST", { email: email });
        if (!user) {
            throw new Error('Email invalid.');
        }
        const isMatch = await global.checkPassword(password, user.password);
        if (!isMatch) {
            user.loginAttempts += 1;
            await requestWithCircuitBreaker(urlUpdateInfoLogin, "PUT", {
                email: email,
                loginAttempts: user.loginAttempts,
                lastLogin: user.lastLogin
            });
            throw new Error('PASSWORD INCORECT.');
        }
        const token = global.generateToken({ userId: user._id, role: user.role, avatar: user.redirectUrl, name: user.firstName });
        const infoLogin = {
            email: email,
            loginAttempts: 0,
            lastLogin: new Date()
        };
        await requestWithCircuitBreaker(urlUpdateInfoLogin, "PUT", infoLogin);
        user.password = undefined;
        return { user, token };
    } catch (error) {
        console.log(error)
        throw new Error(`ERROR LOGIN: ${error.message}`);
    }
};