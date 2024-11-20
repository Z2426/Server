const express = require('express');
const connectDB = require('./shared/db/db.js');
const chatRoutes = require('./routes/indexRoute.js')
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
connectDB();
app.use('/', chatRoutes);
app.use(errorHandler)
const PORT = process.env.CHAT_SERVICE_PORT || 3007;
app.listen(PORT, () => {
    console.log(`User service running on port ${PORT}`);
});
