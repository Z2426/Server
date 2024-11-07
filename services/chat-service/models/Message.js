const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // If it's a personal message
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" }, // If it's a group message
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Message", messageSchema);
