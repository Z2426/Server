// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notiController');
const authMidddleware = require('../middleware/authMiddleware')
router.post('/send', notificationController.createNotification);
router.put('/:notiId/read', authMidddleware.verifyTokenMiddleware, notificationController.markNotificationAsRead);
router.delete('/:notiId', authMidddleware.verifyTokenMiddleware, notificationController.deleteNotification);
router.get('/', authMidddleware.verifyTokenMiddleware, notificationController.getNotifications);
module.exports = router;
