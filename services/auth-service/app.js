const express = require('express');
const connectDB = require('./shared/db/db.js');
const authRoutes = require('./routes/authRoutes.js')
const errorHandler = require('./shared/middleware/errorHandler.js')
require('./shared/middleware/logRequest.js')
require('./shared/utils/circuitBreaker.js')
require('./shared/utils/logger.js')
require('./utils/index.js');
require('dotenv').config();
const app = express();
const cors = require('cors');
app.use(express.json());
// Cấu hình CORS
const corsOptions = {
  origin: 'http://localhost:3001', // Cho phép từ frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các phương thức được phép
  allowedHeaders: ['Content-Type', 'Authorization'], // Các header cho phép
};

app.use(cors(corsOptions));
connectDB();
app.use('/api/auth', authRoutes);
app.use(errorHandler)
const PORT = process.env.AUTH_SERVICE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});
