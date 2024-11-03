// controllers/notificationController.js
const notificationService = require('../services/NotificationService');

exports.sendNotification = async (req, res) => {
    const { type, content } = req.body;
    const { userId } = req.body.user
    try {
        const notification = await notificationService.createNotification(userId, type, content);
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Đã xảy ra lỗi khi gửi thông báo' });
    }
};

exports.getNotifications = async (req, res) => {
    const { userId } = req.body.user;

    try {
        const notifications = await notificationService.fetchNotifications(userId);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy thông báo' });
    }
};

exports.markNotificationAsRead = async (req, res) => {
    const { notiId } = req.params;

    try {
        const notification = await notificationService.updateNotificationStatus(notiId);
        if (!notification) {
            return res.status(404).json({ error: 'Thông báo không tìm thấy' });
        }
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Đã xảy ra lỗi khi đánh dấu thông báo' });
    }
};
// Xóa thông báo
exports.deleteNotification = async (req, res) => {
    const { notiId } = req.params;

    try {
        const notification = await notificationService.deleteNotification(notiId);  // Gọi service để xóa
        if (!notification) {
            return res.status(404).json({ error: 'Thông báo không tìm thấy' });
        }
        res.json({ message: 'Thông báo đã được xóa thành công' });
    } catch (error) {
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa thông báo' });
    }
};