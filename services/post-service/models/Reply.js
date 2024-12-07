// models/Reply.js
const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    comment: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId }],
    createdAt: { type: Date, default: Date.now }
});
ReplySchema.index({ userId: 1 });
module.exports = mongoose.model('Reply', ReplySchema);
