const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ConversationSchema = new mongoose.Schema({
    type: { type: String, enum: ["personal", "group"], required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessage: {
        content: String,
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: Date,
    },
    name: { type: String, required: false }, // Trường tên nhóm (chỉ áp dụng cho nhóm)
    unreadCounts: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            count: { type: Number, default: 0 },
        },
    ], blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Lưu người bị chặn
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model("Conversation", ConversationSchema);
