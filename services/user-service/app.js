const express = require('express');
const connectDB = require('./shared/db/db.js');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./shared/middleware/errorHandler.js')
require('./shared/middleware/logRequest.js')
require('./shared/utils/circuitBreaker.js')
require('./shared/utils/logger.js')
require('dotenv').config();
const app = express();
app.use(express.json());
connectDB();
app.use('/api/users', userRoutes);
app.use(errorHandler)
const PORT = process.env.USER_SERVICE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});
