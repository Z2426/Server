const express = require('express');
const connectDB = require('./shared/db/db.js');
const postRoutes = require('./routes/postRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());
connectDB();

app.use('/api/posts', postRoutes);

const PORT = process.env.POST_SERVICE_PORT || 3002;
app.listen(PORT, () => {
  console.log(`Post service running on port  ${PORT}`);
 console.log('T1223 455')
});
