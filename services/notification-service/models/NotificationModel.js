// models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    type: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
});

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;
