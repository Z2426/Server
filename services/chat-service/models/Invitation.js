const mongoose = require("mongoose");

const InvitationSchema = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true }, // ID nhóm
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người gửi lời mời
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người nhận lời mời
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }, // Trạng thái lời mời
    createdAt: { type: Date, default: Date.now }, // Thời gian gửi lời mời
});

const Invitation = mongoose.model("Invitation", InvitationSchema);

module.exports = Invitation;
