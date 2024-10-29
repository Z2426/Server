const express = require('express');
const connectDB = require('./shared/db/db.js');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./shared/middleware/errorHandler.js')
require('./shared/middleware/logRequest.js')
require('./shared/utils/circuitBreaker.js')
require('./shared/utils/logger.js')
require('dotenv').config();
const app = express();
const cors = require('cors');
// Cấu hình CORS
const corsOptions = {
  origin: 'http://localhost:3002', // Cho phép từ frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các phương thức được phép
  allowedHeaders: ['Content-Type', 'Authorization'], // Các header cho phép
};
app.use(cors(corsOptions));
app.use(express.json());
connectDB();
app.use('/api/users', userRoutes);
app.use(errorHandler)
const PORT = process.env.USER_SERVICE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});
