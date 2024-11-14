// routes/indexRoute.js
const express = require('express');
const router = express.Router();

// Import các route con
const chatRoute = require('./chatRoutes');
const groupRoute = require('./groupRoutes');

// Kết nối các route con vào router tổng hợp
router.use('/chat', chatRoute);
router.use('/group', groupRoute);

// Route cho trang chủ
router.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

module.exports = router;
