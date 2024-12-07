const requestWithCircuitBreaker = require('../shared/utils/circuitBreaker.js');
exports.verifyTokenMiddleware = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Token missing" });
    }
    try {
        const authServiceUrl = process.env.URL_AUTH_SERVICE;
        const userData = await requestWithCircuitBreaker(`${authServiceUrl}/verifyToken`, 'POST', { token });
        req.body.user = userData;
        return next();
    } catch (error) {
        console.error('Token verification error:', error);
        const statusCode = error.response?.status === 403 ? 403 : 500;
        const message = statusCode === 403 ? "Invalid token" : "Internal server error";
        return res.status(statusCode).json({ message });
    }
};