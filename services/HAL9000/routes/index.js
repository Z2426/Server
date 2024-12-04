// routes/indexRoute.js
const express = require('express');
const router = express.Router();

// Import các route con
const contentGenRoute = require('./contentgen');


// Kết nối các route con vào router tổng hợp
router.use('/api/ai-assist', contentGenRoute);
// Route cho trang chủ
router.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

// Route cho trang chủ
router.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

module.exports = router;