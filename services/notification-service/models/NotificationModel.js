const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    senderInfo: {
        userId: { type: String, required: true },
        avatar: { type: String },
        name: { type: String }
    },
    reciveId: { type: String, required: true },
    type: {
        type: String,
        enum: ['FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'COMMENT', 'LIKE', 'VIOLATE_POST'],
        required: true
    },
    postId: { type: String },
    message: { type: String },
    redirectUrl: { type: String },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
notificationSchema.index({ reciveId: 1, isRead: 1 });
module.exports = mongoose.model('Notification', notificationSchema);
