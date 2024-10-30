const requestWithCircuitBreaker = require('../shared/utils/circuitBreaker.js');
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Authentication token is missing" });

    try {
        const response = await axios.post(`http://auth-service-url/auth/verifyToken`, { token });
        req.userId = response.data.userId;
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid token" });
    }
};