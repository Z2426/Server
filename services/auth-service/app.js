const express = require('express');
const connectDB = require('./shared/db/db.js');
const authRoutes = require('./routes/authRoutes.js')
require('./shared/utils/handleToken.js')
require('dotenv').config();
const cors = require('cors');
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
  app.use('/api/auth', authRoutes);
  return app;
};

/** ================================================ 
* Start Server
* ================================================ */
const startServer = async () => {
  try {
    await connectDB();
    const app = configureApp();
    const PORT = process.env.AUTH_SERVICE_PORT || 3003;
    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();