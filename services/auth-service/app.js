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
app.use(express.json());
connectDB();
app.use('/api/auth', authRoutes);
app.use(errorHandler)
const PORT = process.env.AUTH_SERVICE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
  console.log("1120555")
  console.log('T')
});
