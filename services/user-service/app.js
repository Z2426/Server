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

app.post('/send-friend-request', async (req, res) => {
  const { senderId, receiverId } = req.body;
  const message = JSON.stringify({
    success: true,
    message: `${senderId} has sent a friend request to ${receiverId}`
  });

  try {
    const reply = await redisClient.publish('friend_requests', message);
    console.log('Message published to Redis:', message);
    return res.send('Friend request sent successfully'); // Thêm return ở đây
  } catch (err) {
    console.error('Error publishing message to Redis:', err);
    return res.status(500).send('Error publishing message'); // Thêm return ở đây
  }
});

// Sử dụng middleware xử lý lỗi
app.use(errorHandler);

// Khởi động server
const PORT = process.env.USER_SERVICE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});
