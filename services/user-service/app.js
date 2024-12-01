const express = require('express');
const connectDB = require('./shared/db/db.js');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes.js')
const statisticsRoute = require('./routes/statsRoutes.js')
const errorHandler = require('./shared/middleware/errorHandler.js');
const { connectToRedis, sendToQueue } = require("./shared/redis/redisClient");
const { handleUserInteraction } = require("./shared/redis/redisHandler");
const { listenForEvents } = require("./eventListener.js")
require('./shared/middleware/logRequest.js');
require('./shared/utils/logger.js');
require('dotenv').config();
const axios = require('axios');
const app = express();
const cors = require('cors');
const corsOptions = {
  origin: "*",  // Cho phép mọi nguồn (cổng khác nhau)
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các phương thức được phép
  allowedHeaders: ['Content-Type', 'Authorization'], // Các header cho phép
};
// Sử dụng middleware
app.use(cors(corsOptions));
app.use(express.json());
// Kết nối tới cơ sở dữ liệu
connectDB();
connectToRedis()
listenForEvents()

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
