const express = require('express');
const connectDB = require('./shared/db/db.js');
const postRoutes = require('./routes/postRoutes.js');
const axios = require('axios');

require('dotenv').config();
const app = express();
app.use(express.json());
connectDB();
app.use('/api/posts', postRoutes);
const PORT = process.env.POST_SERVICE_PORT || 3002;
async function fetchReportedPosts() {
  try {
    const response = await axios.get('http://localhost:3002/api/posts/reported');
    console.log(response.data); // Xử lý dữ liệu trả về từ API
  } catch (error) {
    console.error('Error fetching reported posts:', error.message);
  }
}

fetchReportedPosts();
app.listen(PORT, () => {
  console.log(`Post service running on port  ${PORT}`);
});
