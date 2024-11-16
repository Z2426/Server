const express = require('express');
const connectDB = require('./shared/db/db.js');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes.js')
const statisticsRoute = require('./routes/statsRoutes.js')
const errorHandler = require('./shared/middleware/errorHandler.js');
//const moment = require('moment');

require('./shared/middleware/logRequest.js');
require('./shared/utils/logger.js');
require('dotenv').config();
const axios = require('axios');
const app = express();
const cors = require('cors');
// Cấu hình CORS
const corsOptions = {
  origin: [`${process.env.URL_POST_SERVICE}`, `${process.env.URL_AUTH_SERVICE}`, `${process.env.URL_CLIENT}`],// Cho phép từ frontend
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
app.use('/api/admin', adminRoutes);
app.use('/api/stat', statisticsRoute)
// Sử dụng middleware xử lý lỗi
app.use(errorHandler);
// Khởi động server
const PORT = process.env.USER_SERVICE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});
