const express = require('express');
const connectDB = require('./shared/db/db.js');
const AiRoutes = require('./routes/index.js')
require('./shared/utils/circuitBreaker.js')
const cors = require('cors');
require('dotenv').config();
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
    app.use('/', AiRoutes);
    return app;
};

/** ================================================ 
 * Start Server
 * ================================================ */
const startServer = async () => {
    try {
        await connectDB();
        const app = configureApp();
        const PORT = process.env.BOT_PORT || 4000;
        app.listen(PORT, () => {
            console.log(`HAL9000 service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start the server:', error.message);
        process.exit(1);
    }
};
startServer();