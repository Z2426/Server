// routes/indexRoute.js
const express = require('express');
const router = express.Router();
const chatRoute = require('./chatRoutes');
const groupRoute = require('./groupRoutes');

router.use('/chat', chatRoute);
router.use('/group', groupRoute);

module.exports = router;
