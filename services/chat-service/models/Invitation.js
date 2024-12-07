const mongoose = require("mongoose");

const InvitationSchema = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});
InvitationSchema.index({ groupId: 1, recipientId: 1, status: 1 });

module.exports = mongoose.model("Invitation", InvitationSchema);