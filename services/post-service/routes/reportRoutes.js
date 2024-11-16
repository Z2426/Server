const express = require('express');
const router = express.Router();

// Import các controller
const { getReportsByPostController, getReportsByReasonController, getReportsByDateController, getPostsByDateController } = require('../controllers/reportController');

// Route lấy thống kê số lượng báo cáo theo bài post
router.get('/reports-by-post', getReportsByPostController);

// Route lấy thống kê số lượng báo cáo theo lý do
router.get('/reports-by-reason', getReportsByReasonController);

// Route lấy thống kê số lượng báo cáo theo thời gian (ngày, tháng, năm)
router.get('/reports-by-date', getReportsByDateController);
// Route để lấy thống kê bài post theo ngày, tháng, hoặc năm
router.get('/posts-created-by-date', getPostsByDateController);
module.exports = router;
