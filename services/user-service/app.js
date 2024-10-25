const express = require('express');
//const connectDB = require('../../shared/db/db.js');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());
//connectDB();

app.use('/api/users', userRoutes);

const PORT = process.env.USER_SERVICE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
  console.log("1120555")
  console.log('T')
});
