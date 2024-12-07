const express = require('express');
const connectDB = require('./shared/db/db.js');
const notifiRoutes = require('./routes/notiRoutes.js')
require('./shared/utils/circuitBreaker.js')
require('dotenv').config();
const cors = require('cors');
const { connectToRedis } = require("./shared/redis/redisClient");
/** ================================================ 
 * Configure Express App
 * ================================================ */
const configureApp = () => {
    const app = express();
    app.use(express.json());
    const corsOptions = {
        origin: "*",
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    };
    app.use(cors(corsOptions));
    app.use('/api/notifi', notifiRoutes);
    return app;
};
/** ================================================ 
 * Start Server
 * ================================================ */
const startServer = async () => {
    try {
        await connectDB();
        await connectToRedis();
        const app = configureApp();
        const PORT = process.env.NOTIFI_SERVICE_PORT || 3004;
        app.listen(PORT, () => {
            console.log(`Notification service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start the server:', error.message);
        process.exit(1);
    }
};
// Start the server
startServer();
