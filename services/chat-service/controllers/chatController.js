const messageService = require("../services/messageService");

exports.replyToMessageController = async (req, res) => {
    const { senderId, conversationId, messageId, content, file } = req.body;

    try {
        const newMessage = await messageService.replyToMessage(senderId, conversationId, messageId, content, file);
        return res.status(200).json(newMessage);
    } catch (err) {
        console.error("Lỗi khi gửi tin nhắn trả lời:", err);
        return res.status(500).json({ message: "Không thể gửi tin nhắn trả lời." });
    }
};

exports.sendPersonalMessageController = async (req, res) => {
    const { senderId, recipientId, content, file } = req.body;

    try {
        const newMessage = await messageService.sendPersonalMessage(senderId, recipientId, content, file);
        return res.status(200).json(newMessage);
    } catch (err) {
        console.error("Lỗi khi gửi tin nhắn cá nhân:", err);
        return res.status(500).json({ message: "Không thể gửi tin nhắn." });
    }
};

exports.markMessagesAsReadController = async (req, res) => {
    const { conversationId, userId } = req.body;

    try {
        const result = await messageService.markMessagesAsRead(conversationId, userId);
        return res.status(200).json(result);
    } catch (error) {
        console.error("Lỗi khi đánh dấu tin nhắn là đã đọc:", error);
        return res.status(500).json({ message: "Không thể đánh dấu tin nhắn là đã đọc." });
    }
};

exports.searchMessagesByContentController = async (req, res) => {
    const { conversationId, searchQuery, limit, page } = req.query;

    try {
        const messages = await messageService.searchMessagesByContent(conversationId, searchQuery, limit, page);
        return res.status(200).json(messages);
    } catch (error) {
        console.error("Lỗi khi tìm kiếm tin nhắn:", error);
        return res.status(500).json({ message: "Không thể tìm kiếm tin nhắn." });
    }
};

exports.toggleBlockUserMessageController = async (req, res) => {
    const { conversationId, userId } = req.body;

    try {
        const result = await messageService.toggleBlockUserMessage(conversationId, userId);
        return res.status(200).json(result);
    } catch (error) {
        console.error("Lỗi khi chặn/mở khóa người dùng:", error);
        return res.status(500).json({ message: "Không thể thực hiện chặn/mở khóa người dùng." });
    }
};
