// statsRoutes.js
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController'); // Đảm bảo đường dẫn đúng
/** ================================================
 *                USER STATISTICS
 * ================================================ */
router.get('/user-stats', statsController.getUserStatsController); // Get user statistics
router.get('/registration-stats', statsController.getUserRegistrationStats); // Get statistics by registration date
router.get('/gender-stats', statsController.getGenderStats); // Get statistics by gender
router.get('/age-stats', statsController.getAgeStats); // Get statistics by age

module.exports = router;
