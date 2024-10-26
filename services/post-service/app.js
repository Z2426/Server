const express = require('express');
const connectDB = require('./shared/db/db.js');
const postRoutes = require('./routes/postRoutes');
const logRequest =require('./shared/middleware/logRequest.js')
//const requestWithCircuitBreaker = require('./shared/utils/circuitBreaker.js')
// Kiểm tra các thư viện cần thiết
// const libraries = [
//   'express',
//   'mongoose',
//   'cors',
//   'nodemon',
//   'dotenv',
//   'express-validator',
//   'winston',
//   'opossum'
// ];

// libraries.forEach(lib => {
//   try {
//     require.resolve(lib);
//     console.log(`${lib} is installed.`);
//   } catch (e) {
//     console.log(`${lib} is NOT installed.`);
//   }
// });

require('dotenv').config();

const app = express();
app.use(express.json());
connectDB();

app.use('/api/posts', postRoutes);

const PORT = process.env.POST_SERVICE_PORT || 3002;
app.listen(PORT, () => {
  console.log(`Post service running on port  ${PORT}`);
 console.log('T1223 455')
});
