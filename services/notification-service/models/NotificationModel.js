const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    senderInfo: {
        userId: { type: String, required: true },
        avatar: { type: String },
        name: { type: String }
    }, // thông tin của người tương tác sự kiện
    reciveId: { type: String, required: true }, // Chỉ lưu userId của người nhận thông báo
    type: {
        type: String,
        enum: ['FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'COMMENT', 'LIKE'],
        required: true
    },
    postId: { type: String }, // Chỉ lưu postId của bài post
    message: { type: String },
    redirectUrl: { type: String },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
