const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
    type: { type: String, enum: ["personal", "group"], required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessage: {
        content: String,
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: Date,
    },
    unreadCounts: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            count: { type: Number, default: 0 },
        },
    ],
}, { timestamps: true });

module.exports = mongoose.model("Conversation", ConversationSchema);
