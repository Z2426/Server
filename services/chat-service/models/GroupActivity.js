// Schema cho bảng lưu hoạt động nhóm
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupActivitySchema = new Schema({
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    activityType: { type: String, enum: ['add_member', 'remove_member', 'change_role', 'update_group', 'block_member', 'unblock_member', 'send_message'], required: true },
    performedBy: { type: Schema.Types.ObjectId },
    affectedUser: { type: Schema.Types.ObjectId },
    timestamp: { type: Date, default: Date.now },
    additionalInfo: { type: String, default: '' },
});
groupActivitySchema.index({ groupId: 1, timestamp: -1 });

module.exports = mongoose.model("GroupActivity", groupActivitySchema);
