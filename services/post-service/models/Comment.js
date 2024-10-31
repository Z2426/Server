// models/Comment.js
const mongoose = require('mongoose');
const ReplySchema = require('./Reply').schema;

const CommentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Danh sách người dùng đã thích bình luận
    createdAt: { type: Date, default: Date.now },
    replies: [ReplySchema],  // Danh sách phản hồi cho bình luận
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Người dùng theo dõi bình luận
});

module.exports = mongoose.model('Comment', CommentSchema);
