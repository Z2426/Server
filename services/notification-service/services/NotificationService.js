const Notification = require('../models/NotificationModel');
const { sendMessageToRedis } = require("../shared/redis/redisClient");
exports.createNotification = async (notificationData) => {
    const savedNotification = new Notification(notificationData);
    // Publish the entire notification object to Redis
    await sendMessageToRedis("notification", {
        ...notificationData,
        id: savedNotification._id,
        createdAt: savedNotification.createdAt,
    });

    console.log('Notification sent 100:', savedNotification);
    return await savedNotification.save();
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
