const express = require('express');
const connectDB = require('./shared/db/db.js');
const postRoutes = require('./routes/postRoutes.js');
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(express.json());
connectDB();
// // Cấu hình CORS
// const corsOptions = {
//   origin: [`${process.env.URL_POST_SERVICE}`, `${process.env.URL_AUTH_SERVICE}`], // Cho phép từ frontend
//   methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các phương thức được phép
//   allowedHeaders: ['Content-Type', 'Authorization'], // Các header cho phép
// };
const corsOptions = {
  origin: "*",  // Cho phép mọi nguồn (cổng khác nhau)
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các phương thức được phép
  allowedHeaders: ['Content-Type', 'Authorization'], // Các header cho phép
};
// Sử dụng middleware
app.use(cors(corsOptions));
app.use('/api/posts', postRoutes);
const PORT = process.env.POST_SERVICE_PORT || 3002;
app.listen(PORT, () => {
  console.log(`Post service running on port  ${PORT}`);
});
