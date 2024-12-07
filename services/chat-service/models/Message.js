const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
    reply_to_message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    file_url: { type: String },
    readStatus: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId },
            status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });
MessageSchema.index({ senderId: 1 });
module.exports = mongoose.model("Message", MessageSchema);
