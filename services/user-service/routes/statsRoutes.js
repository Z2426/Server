// statsRoutes.js
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController'); // Đảm bảo đường dẫn đúng
// Định nghĩa route để lấy thống kê người dùng
router.get('/user-stats', statsController.getUserStatsController);

// Route để lấy thống kê người dùng theo thời gian đăng ký
router.get('/registration-stats', statsController.getUserRegistrationStats);

// Route để lấy thống kê người dùng theo giới tính
router.get('/gender-stats', statsController.getGenderStats);

// Route để lấy thống kê người dùng theo độ tuổi
router.get('/age-stats', statsController.getAgeStats);

module.exports = router;
