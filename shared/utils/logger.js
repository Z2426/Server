const winston = require('winston');

// Hàm chuyển đổi timestamp sang múi giờ
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  // Thay đổi 7 là số giờ bạn muốn điều chỉnh (ví dụ: UTC+7)
  const offset = date.getTimezoneOffset() * 60000; // Chuyển đổi phút sang mili giây
  const localDate = new Date(date.getTime() + offset + (7 * 60 * 60 * 1000)); // Thay đổi số giờ nếu cần
  return localDate.toISOString().replace('T', ' ').substr(0, 19); // Chuyển sang định dạng dễ đọc
};

// Tạo định dạng log tùy chỉnh
const customFormat = winston.format.printf(({ timestamp, level, message }) => {
  const formattedTimestamp = formatTimestamp(timestamp);
  return `${formattedTimestamp} [${level}]: ${message}`;
});

// Tạo logger với cấu hình
const logger = winston.createLogger({
  level: 'silly',
  format: winston.format.combine(
    winston.format.timestamp(), // Sử dụng timestamp mặc định
    customFormat // Sử dụng định dạng tùy chỉnh
  ),
  transports: [
    new winston.transports.Console(),
    //new winston.transports.File({ filename: 'error.log', level: 'error' }),
    //new winston.transports.File({ filename: 'combined.log' })
  ],
});

// Gán logger vào global
global.logger = logger;

