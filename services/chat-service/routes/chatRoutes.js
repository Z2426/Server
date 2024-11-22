const express = require("express");
const router = express.Router();
const messageController = require("../controllers/chatController");

// lấy danh sách hội thoại user có tham gia
router.get("/users/:userId/conversations", messageController.getConversationsByUser);
// API lấy thông tin cuộc hội thoại theo ID
router.get('/conversations/:conversationId', messageController.getConversationById);

// Gửi tin nhắn trả lời
router.post("/message/reply", messageController.replyToMessageController);

// Gửi tin nhắn cá nhân
router.post("/message/send", messageController.sendMessageController);

// Đánh dấu tin nhắn là đã đọc
router.put("/message/mark-read", messageController.markMessagesAsReadController);

// Tìm kiếm tin nhắn theo nội dung
router.get("/message/search", messageController.searchMessagesByContentController);

// Chặn/mở khóa người dùng trong tin nhắn
router.put("/message/block-user/:userId", messageController.toggleBlockUserMessageController);
// Mở cuộc hội thoại tin nhắn
router.get("/conversation/:conversationId/messages", messageController.getAllMessagesInConversation);
// Mở đoạn thoại cá nhân
router.post('/message/create', messageController.createPersonalConversation);
module.exports = router;
