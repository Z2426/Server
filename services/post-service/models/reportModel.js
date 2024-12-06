// models/reportModel.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reportSchema = new Schema({
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    reason: {
        type: String,
        required: true,
        enum: [
            'Spam',                // Spam
            'Offensive Language',   // Ngôn từ thù địch
            'Misinformation',       // Thông tin sai lệch
            'Harassment',           // Quấy rối
            'Violence',             // Bạo lực
            'Nudity',               // Hình ảnh khiêu dâm
            'Hate Speech',          // Ngôn từ căm thù
            'Illegal Content',
            'ContentToxic',   // Nội dung bất hợp pháp
            'Other'                 // Lý do khác
        ]
    },
    createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model("Report", reportSchema);
module.exports = Report;
