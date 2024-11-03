// services/notificationService.js
const Notification = require('../models/NotificationModel');

exports.createNotification = async (userId, type, content) => {
    const notification = new Notification({ userId, type, content });
    await notification.save();
    return notification;
};

exports.fetchNotifications = async (userId) => {
    return await Notification.find({ userId });
};

exports.updateNotificationStatus = async (id) => {
    const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
    return notification;
};
// Xóa thông báo
exports.deleteNotification = async (id) => {
    return await Notification.findByIdAndDelete(id);  // Xóa thông báo
};
