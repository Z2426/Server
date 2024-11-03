// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notiController');
const authMidddleware = require('../middleware/authMiddleware')
// Gửi thông báo
router.post('/send', authMidddleware.verifyTokenMiddleware, notificationController.sendNotification);
// Đánh dấu thông báo là đã đọc
router.put('/:notiId/read', authMidddleware.verifyTokenMiddleware, notificationController.markNotificationAsRead);
// Xóa thông báo
router.delete('/:notiId', authMidddleware.verifyTokenMiddleware, notificationController.deleteNotification);  // Thêm route xóa thông báo
// Lấy danh sách thông báo
router.get('/', authMidddleware.verifyTokenMiddleware, notificationController.getNotifications);
module.exports = router;
