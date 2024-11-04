// models/reportModel.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reportSchema = new Schema({
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true }, // ID bài post
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // ID người dùng đã báo cáo
    reason: { type: String, required: true }, // Lý do báo cáo
    createdAt: { type: Date, default: Date.now } // Thời gian báo cáo
});

const Report = mongoose.model("Report", reportSchema);
module.exports = Report;
