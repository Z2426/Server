const express = require('express');
const connectDB = require('./shared/db/db.js');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./shared/middleware/errorHandler.js');
const redisClient = require('./shared/utils/redisClient');
require('./shared/middleware/logRequest.js');
require('./shared/utils/circuitBreaker.js');
require('./shared/utils/logger.js');
require('dotenv').config();

const app = express();
const cors = require('cors');

// Cấu hình CORS
const corsOptions = {
  origin: 'http://localhost:3002', // Cho phép từ frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các phương thức được phép
  allowedHeaders: ['Content-Type', 'Authorization'], // Các header cho phép
};

// Sử dụng middleware
app.use(cors(corsOptions));
app.use(express.json());
// Kết nối tới cơ sở dữ liệu
connectDB();
// Định nghĩa các routes
app.use('/api/users', userRoutes);
// Sử dụng middleware xử lý lỗi
app.use(errorHandler);
// Khởi động server
const PORT = process.env.USER_SERVICE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});
