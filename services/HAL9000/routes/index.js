const express = require('express');
const router = express.Router();
const contentGenRoute = require('./contentgen');
router.use('/api/ai-assist', contentGenRoute);
module.exports = router;