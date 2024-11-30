const express = require('express');
const connectDB = require('./shared/db/db.js');
const postRoutes = require('./routes/postRoutes.js');
const statRoutes = require('./routes/reportRoutes.js')
const { connectToRedis } = require("./shared/redis/redisClient");
const { checkFriendship } = require("./utils/pubSubRedis.js")
connectToRedis()
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(express.json());
connectDB();
const corsOptions = {
  origin: "*",  // Cho phép mọi nguồn (cổng khác nhau)
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các phương thức được phép
  allowedHeaders: ['Content-Type', 'Authorization'], // Các header cho phép
};



// Sử dụng middleware
app.use(cors(corsOptions));
app.use('/api/posts', postRoutes);
app.use('/api/stat', statRoutes);
const PORT = process.env.POST_SERVICE_PORT || 3002;
// Chạy kiểm tra bạn bè với userId và postOwnerId
async function run() {
  try {
    const result = await checkFriendship("2", "1");
    console.log(result); // Kết quả kiểm tra bạn bè sẽ được in ra

    if (result) {
      console.log('Tiến hành kiểm tra bài viết...');
      // Tiến hành các bước kiểm tra tiếp theo nếu là bạn bè
    } else {
      console.log('Không phải bạn bè, dừng kiểm tra.');
      // Nếu không phải bạn bè, dừng kiểm tra
    }
  } catch (error) {
    console.error('Có lỗi trong quá trình kiểm tra bạn bè:', error);
  }
}

// Gọi hàm chạy kiểm tra bạn bè
run();
app.listen(PORT, () => {
  console.log(`Post service running on port  ${PORT}`);
});
