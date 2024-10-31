// models/Reply.js
const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Danh sách người dùng đã thích phản hồi
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reply', ReplySchema);
