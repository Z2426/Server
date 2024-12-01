const express = require('express');
const connectDB = require('./shared/db/db.js');
const postRoutes = require('./routes/postRoutes.js');
const statRoutes = require('./routes/reportRoutes.js');
const { connectToRedis, sendMessageToRedis, sendToQueue } = require("./shared/redis/redisClient");
const { handleUserInteraction, getUserWeights, getPostDistributionByGroup } = require("./shared/redis/interactionAndWeightCalculator");
const { processTaskFromQueue } = require("./task_processor.js")
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(express.json());
const startServer = async () => {
  try {
    // Kết nối đến cơ sở dữ liệu MongoDB
    await connectDB();
    // Kết nối đến Redis
    await connectToRedis();
    // CORS middleware
    const corsOptions = {
      origin: "*",  // Cho phép mọi nguồn (cổng khác nhau)
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    };
    app.use(cors(corsOptions));
    // Route middleware
    app.use('/api/posts', postRoutes);
    app.use('/api/stat', statRoutes);
    // Khởi động server
    const PORT = process.env.POST_SERVICE_PORT || 3002;

    processTaskFromQueue()
    app.listen(PORT, () => {
      console.log(`Post service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);  // Dừng ứng dụng nếu có lỗi nghiêm trọng
  }
};
// Chạy hàm khởi động server
startServer();
