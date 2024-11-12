const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

// Gửi tin nhắn trả lời
router.post("/message/reply", messageController.replyToMessageController);

// Gửi tin nhắn cá nhân
router.post("/message/personal", messageController.sendPersonalMessageController);

// Đánh dấu tin nhắn là đã đọc
router.put("/message/mark-read", messageController.markMessagesAsReadController);

// Tìm kiếm tin nhắn theo nội dung
router.get("/message/search", messageController.searchMessagesByContentController);

// Chặn/mở khóa người dùng trong tin nhắn
router.put("/message/block-user", messageController.toggleBlockUserMessageController);

module.exports = router;
