const express = require('express');
const router = express.Router();

// Import controllers
const {
    getReportsByPostController,
    getReportsByReasonController,
    getReportsByDateController,
    getPostsByDateController
} = require('../controllers/reportController');


/** ================================================
 *               Report Statistics Routes
 * ================================================ */
// Route to get report statistics by post
router.get('/reports-by-post', getReportsByPostController);

// Route to get report statistics by reason
router.get('/reports-by-reason', getReportsByReasonController);

// Route to get report statistics by date (day, month, year)
router.get('/reports-by-date', getReportsByDateController);

// ===========================
// Group 2: Post Statistics Routes
// ===========================

// Route to get post statistics by date (day, month, year)
router.get('/posts-created-by-date', getPostsByDateController);

module.exports = router;
