const express = require('express');
const connectDB = require('./shared/db/db.js');
const AiRoutes = require('./routes/index.js')
const errorHandler = require('./shared/middleware/errorHandler.js')
require('./shared/middleware/logRequest.js')
require('./shared/utils/circuitBreaker.js')
require('dotenv').config();
const app = express();
const cors = require('cors');
app.use(express.json());
const corsOptions = {
    origin: "*",  // Cho phép mọi nguồn (cổng khác nhau)
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các phương thức được phép
    allowedHeaders: ['Content-Type', 'Authorization'], // Các header cho phép
};
app.use(cors(corsOptions));
app.use('/', AiRoutes);
app.use(errorHandler)

const PORT = process.env.BOT_PORT || 4000;
app.listen(PORT, () => {
    console.log(`User service running on port ${PORT}`);
});