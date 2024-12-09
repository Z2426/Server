const express = require('express');
const connectDB = require('./shared/db/db.js');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes.js')
const statisticsRoute = require('./routes/statsRoutes.js')

require('./shared/utils/handleToken.js')
const { connectToRedis } = require("./shared/redis/redisClient");
const { listenForEvents } = require("./eventListener.js")
require('dotenv').config();
const cors = require('cors');
/** ================================================ 
 * Configure Express App
 * ================================================ */
const configureApp = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  const corsOptions = {
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  app.use(cors(corsOptions));
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/stat', statisticsRoute);
  return app;
};
/** ================================================ 
* Start Server
* ================================================ */
const startServer = async () => {
  try {
    await connectDB();
    await connectToRedis();
    listenForEvents();
    const app = configureApp();
    const PORT = process.env.USER_SERVICE_PORT || 3001;
    app.listen(PORT, () => {
      console.log(`User service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error.message);
    process.exit(1);
  }
};

startServer();