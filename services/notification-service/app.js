const express = require('express');
const connectDB = require('./shared/db/db.js');
const notifiRoutes = require('./routes/notiRoutes.js')
const errorHandler = require('./shared/middleware/errorHandler.js')
const { connectToRedis, subscribeToChannels, sendMessageToRedis } = require('./shared/utils/redisClient');
require('./shared/middleware/logRequest.js')
require('./shared/utils/circuitBreaker.js')
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
app.use('/api/notifi', notifiRoutes);
app.use(errorHandler)

const PORT = process.envNOTIFi_SERVICE_PORT || 3004;
app.listen(PORT, () => {
    console.log(`User service running on port ${PORT}`);
});
