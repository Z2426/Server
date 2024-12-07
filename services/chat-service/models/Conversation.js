const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ConversationSchema = new mongoose.Schema({
    type: { type: String, enum: ["personal", "group"], required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId }],
    lastMessage: {
        content: String,
        senderId: { type: mongoose.Schema.Types.ObjectId },
        timestamp: Date,
    },
    name: { type: String, required: false },
    unreadCounts: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId },
            count: { type: Number, default: 0 },
        },
    ], blockedUsers: [{ type: mongoose.Schema.Types.ObjectId }],
    admins: [{ type: Schema.Types.ObjectId }]
}, { timestamps: true });
ConversationSchema.index({ members: 1 });
module.exports = mongoose.model("Conversation", ConversationSchema);
