// middlewares/logRequest.js
const logger = require('../utils/logger'); // Import logger

// Middleware để ghi log thông tin yêu cầu
const logRequest = (req, res, next) => {
  logger.info(`Request URL: ${req.originalUrl}`); // Ghi log URL yêu cầu
  logger.info(`Request Method: ${req.method}`); // Ghi log phương thức yêu cầu
  logger.info(`Request Body: ${JSON.stringify(req.body)}`); // Ghi log body yêu cầu

  next(); // Chuyển tiếp đến middleware tiếp theo
};

module.exports = logRequest;
