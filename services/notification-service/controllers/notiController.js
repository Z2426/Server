const notificationService = require('../services/NotificationService');
exports.createNotification = async (req, res) => {
    try {
        const { senderInfo, reciveId, type, postId, message, redirectUrl } = req.body;
        if (senderInfo.userId === reciveId) {
            return res.status(400).json({ message: "Cannot send notification to yourself" });
        }
        const notificationData = {
            senderInfo,
            reciveId,
            type,
            postId,
            message,
            redirectUrl,
        };
        const notification = await notificationService.createNotification(notificationData);
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getNotifications = async (req, res) => {
    try {
        const reciveId = req.body.user.userId;
        const notifications = await notificationService.getNotificationsByReceiverId(reciveId);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.markNotificationAsRead = async (req, res) => {
    try {
        const { notiId } = req.params;
        const reciveId = req.body.user.userId;
        const notification = await notificationService.markNotificationAsRead(notiId, reciveId);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteNotification = async (req, res) => {
    try {
        const { notiId } = req.params;
        const reciveId = req.body.user.userId;
        const notification = await notificationService.deleteNotification(notiId, reciveId);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};