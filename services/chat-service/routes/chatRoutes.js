const express = require("express");
const router = express.Router();
const messageController = require("../controllers/chatController");

/** ================================================
 * Message Routes
 * ================================================ */

// Get a list of conversations a user is part of
router.get("/users/:userId/conversations", messageController.getConversationsByUser);

// Get conversation details by conversation ID
router.get('/conversations/:conversationId', messageController.getConversationById);

// Send a reply to a message
router.post("/message/reply", messageController.replyToMessageController);

// Send a personal message
router.post("/message/send", messageController.sendMessageController);

// Mark messages as read
router.put("/message/mark-read", messageController.markMessagesAsReadController);

// Search for messages by content
router.get("/message/search", messageController.searchMessagesByContentController);

// Block/unblock a user in a conversation
router.put("/message/block-user/:userId", messageController.toggleBlockUserMessageController);

/** ================================================
 * Conversation Routes
 * ================================================ */

// Get all messages in a conversation by conversation ID
router.get("/conversation/:conversationId/messages", messageController.getAllMessagesInConversation);

// Create a personal conversation (message thread)
router.post('/message/create', messageController.createPersonalConversation);
module.exports = router;
