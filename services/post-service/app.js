const express = require('express');
const connectDB = require('./shared/db/db.js');
const postRoutes = require('./routes/postRoutes.js');
const statRoutes = require('./routes/reportRoutes.js');
const { connectToRedis } = require("./shared/redis/redisClient");
const { processTaskFromQueue } = require("./task_processor.js")
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(express.json());
const startServer = async () => {
  try {
    await connectDB();
    await connectToRedis()
    // CORS middleware
    const corsOptions = {
      origin: "*",
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    };
    app.use(cors(corsOptions));
    app.use('/api/posts', postRoutes);
    app.use('/api/stat', statRoutes);
    const PORT = process.env.POST_SERVICE_PORT || 3002;
    processTaskFromQueue()
    app.listen(PORT, () => {
      console.log(`Post service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};
startServer();
