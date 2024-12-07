// models/Comment.js
const mongoose = require('mongoose');
const ReplySchema = require('./Reply').schema;
const CommentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    comment: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId }],
    createdAt: { type: Date, default: Date.now },
    replies: [ReplySchema],
    followers: [{ type: mongoose.Schema.Types.ObjectId }]
});
CommentSchema.index({ userId: 1 });
module.exports = mongoose.model('Comment', CommentSchema);
