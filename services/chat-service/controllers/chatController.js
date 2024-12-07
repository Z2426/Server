const messageService = require("../services/chatPrivateService");

/** ================================================
 * Conversation Management
 * ================================================ */
exports.getConversationById = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const conversation = await messageService.getConversationById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }
        return res.status(200).json(conversation);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getConversationsByUser = async (req, res) => {
    const { userId } = req.params;
    try {
        const conversations = await messageService.getConversationsByUser(userId);
        return res.status(200).json(conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.markMessagesAsReadController = async (req, res) => {
    const { messageId, userId } = req.body;
    try {
        const result = await messageService.markMessagesAsRead(messageId, userId);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/** ================================================
 * Message Management
 * ================================================ */

exports.sendMessageController = async (req, res) => {
    try {
        const { conversationId, senderId, text, fileUrl, replyToMessageId } = req.body;
        const newMessage = await messageService.sendMessage(
            conversationId,
            senderId,
            text,
            fileUrl,
            replyToMessageId
        );
        return res.status(201).json({
            message: "Message sent successfully",
            data: newMessage,
        });
    } catch (error) {
        console.error("Error send messages in the conversation:", error);
        return res.status(500).json({
            message: "Error sending message",
            error: error.message,
        });
    }
};

exports.getAllMessagesInConversation = async (req, res) => {
    const { conversationId } = req.params;
    const { limit = 20, page = 1 } = req.query;
    try {
        const { messages, remainingPages } = await messageService.getAllMessagesInConversation(conversationId, parseInt(limit), parseInt(page));
        return res.status(200).json({
            messages,
            page: page,
            limit: limit,
            remainingPages: remainingPages
        });
    } catch (error) {
        console.error("Error fetching messages in the conversation:", error);
        return res.status(500).json({ message: "Unable to fetch messages in the conversation." });
    }
};

exports.createPersonalConversation = async (req, res) => {
    const { userIds } = req.body;
    try {
        const newConversation = await messageService.createPersonalConversation(userIds);
        return res.status(201).json(newConversation);
    } catch (error) {
        console.error("Error creating personal conversation:", error);
        return res.status(500).json({ message: error.message });
    }
};

exports.replyToMessageController = async (req, res) => {
    const { senderId, conversationId, messageId, content, file } = req.body;
    try {
        const newMessage = await messageService.replyToMessage(senderId, conversationId, messageId, content, file);
        return res.status(200).json(newMessage);
    } catch (err) {
        console.error("Error replying to message:", err);
        return res.status(500).json({ message: "Unable to send reply message." });
    }
};

exports.searchMessagesByContentController = async (req, res) => {
    const { conversationId, searchQuery, limit, page } = req.query;
    try {
        const messages = await messageService.searchMessagesByContent(conversationId, searchQuery, limit, page);
        return res.status(200).json(messages);
    } catch (error) {
        console.error("Error searching for messages:", error);
        return res.status(500).json({ message: "Unable to search messages." });
    }
};
exports.toggleBlockUserMessageController = async (req, res) => {
    const { conversationId } = req.body;
    const { userId } = req.params;
    try {
        const result = await messageService.toggleBlockUserMessage(conversationId, userId);
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error blocking/unblocking user:", error);
        return res.status(500).json({ message: "Unable to block/unblock user." });
    }
};










