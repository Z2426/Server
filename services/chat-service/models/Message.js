const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
    reply_to_message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null }, // to store the replied message
    file_url: { type: String }, // luu link tai tai lieu,
    readStatus: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });
// Thêm chỉ mục cho việc tìm kiếm
MessageSchema.index({ text: 'text' }); // Tạo chỉ mục tìm kiếm văn bản
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ timestamp: 1 });
module.exports = mongoose.model("Message", MessageSchema);
