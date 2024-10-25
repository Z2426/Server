
const winston = require('winston');

// Tạo logger với cấu hình
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'error' : 'info', // Chỉ ghi log lỗi trong môi trường sản xuất
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Định dạng JSON cho log
  ),
  transports: [
    new winston.transports.Console(), // Ghi log vào console
    new winston.transports.File({ filename: 'error.log', level: 'error' }), // Ghi log lỗi vào file
    new winston.transports.File({ filename: 'combined.log' }) // Ghi tất cả log vào file
  ],
});

module.exports = logger;
