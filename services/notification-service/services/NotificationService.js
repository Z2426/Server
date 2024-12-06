const Notification = require('../models/NotificationModel');
exports.createNotification = async (notificationData) => {
    const notification = new Notification(notificationData);
    return await notification.save();
};
exports.getNotificationsByReceiverId = async (reciveId) => {
    return await Notification.find({ reciveId }).sort({ createdAt: -1 });
};
exports.markNotificationAsRead = async (notiId, reciveId) => {
    return await Notification.findOneAndUpdate(
        { _id: notiId, reciveId },
        { isRead: true },
        { new: true }
    );
};
exports.deleteNotification = async (notiId, reciveId) => {
    return await Notification.findOneAndDelete({ _id: notiId, reciveId });
};
