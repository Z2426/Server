const express = require('express');
const connectDB = require('./shared/db/db.js');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./shared/middleware/errorHandler.js')
require('./shared/middleware/logRequest.js')
require('./shared/utils/circuitBreaker.js')
require('./shared/utils/logger.js')
require('./utils/index.js');
require('dotenv').config();
const app = express();
app.use(express.json());
connectDB();

(async () => {
  // Mật khẩu cần băm
  const plainPassword = 'my_secure_password';

  // Băm mật khẩu
  const hashedPassword = await hashPassword(plainPassword);
  console.log('Hashed Password:', hashedPassword);

  // Kiểm tra mật khẩu
  const isPasswordValid = await checkPassword(plainPassword, hashedPassword);
  console.log('Is Password Valid:', isPasswordValid); // Kết quả sẽ là true

  // Dữ liệu payload để tạo token
  const userPayload = { id: 'user_id', email: 'user@example.com' };

  // Tạo token
  const token = generateToken(userPayload);
  console.log('Generated Token:', token);

  // Giải mã token
  const decodedData = verifyToken(token);
  if (decodedData) {
    console.log('Decoded Data:', decodedData);
  } else {
    console.log('Invalid Token');
  }
})();

app.use('/api/users', userRoutes);
app.get('/', async (req, res) => { // Đánh dấu hàm là async
  try {
    const data = await requestWithCircuitBreaker('https://jsonplaceholder.typicode.com/todos/1'); // Sử dụng await
    return res.status(200).json(data); // Trả dữ liệu
  } catch (error) {
    console.error('Error fetching data:', error.message); // In lỗi ra console
    return res.status(500).json({ message: 'Error fetching data' }); // Trả về lỗi cho client
  }
});
app.use(errorHandler)
const PORT = process.env.USER_SERVICE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
  console.log("1120555")
  console.log('T')
});
