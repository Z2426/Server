const express = require('express');
const connectDB = require('./shared/db/db.js');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes.js')
const statisticsRoute = require('./routes/statsRoutes.js')
require('./shared/utils/handleToken.js')
const { connectToRedis } = require("./shared/redis/redisClient");
const { listenForEvents } = require("./eventListener.js")
require('dotenv').config();
const app = express();
const cors = require('cors');
const corsOptions = {
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
const PORT = process.env.USER_SERVICE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});
