// Schema cho bảng lưu hoạt động nhóm
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupActivitySchema = new Schema({
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    activityType: { type: String, enum: ['add_member', 'remove_member', 'change_role', 'update_group', 'block_member'], required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Người thực hiện hành động
    affectedUser: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Người bị ảnh hưởng
    timestamp: { type: Date, default: Date.now },
    additionalInfo: { type: String, default: '' }, // Thông tin bổ sung (ví dụ: lý do thay đổi)
});

const GroupActivity = mongoose.model('GroupActivity', groupActivitySchema);
