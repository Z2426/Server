const messageService = require("../services/chatPrivateService");
exports.sendMessageController = async (req, res) => {
    try {
        const { conversationId, senderId, text, fileUrl, replyToMessageId } = req.body;

        // Gọi hàm service để gửi tin nhắn
        const newMessage = await messageService.sendMessage(
            conversationId,
            senderId,
            text,
            fileUrl,
            replyToMessageId
        );

        // Trả về phản hồi thành công
        res.status(201).json({
            message: "Message sent successfully",
            data: newMessage,
        });
    } catch (error) {
        // Trả về lỗi nếu có
        res.status(500).json({
            message: "Error sending message",
            error: error.message,
        });
    }
};
// Lấy thông tin cuộc hội thoại theo ID
exports.getConversationById = async (req, res) => {
    try {
        const { conversationId } = req.params;
        // Gọi hàm từ service để lấy cuộc hội thoại
        const conversation = await messageService.getConversationById(conversationId);

        // Kiểm tra nếu không có cuộc hội thoại
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
        res.status(200).json(conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getAllMessagesInConversation = async (req, res) => {
    const { conversationId } = req.params;  // Lấy conversationId từ params
    const { limit = 20, page = 1 } = req.query;  // Lấy limit và page từ query string, nếu không có thì mặc định là 20 và trang 1

    try {
        // Gọi service để lấy tin nhắn trong hội thoại với phân trang và số trang còn lại
        const { messages, remainingPages } = await messageService.getAllMessagesInConversation(conversationId, parseInt(limit), parseInt(page));

        return res.status(200).json({
            messages,
            page: page,
            limit: limit,
            remainingPages: remainingPages  // Trả về số trang còn lại
        });
    } catch (error) {
        console.error("Lỗi khi lấy tin nhắn trong hội thoại:", error);
        return res.status(500).json({ message: "Không thể lấy tin nhắn trong hội thoại." });
    }
};
// exports.getAllMessagesInConversation = async (req, res) => {
//     const { conversationId } = req.params;  // Lấy conversationId từ params
//     const { limit, page } = req.query;      // Lấy limit và page từ query string

//     try {
//         // Lấy tất cả tin nhắn trong hội thoại
//         const messages = await messageService.getAllMessagesInConversation(conversationId, parseInt(limit), parseInt(page));

//         return res.status(200).json({
//             messages,
//             page: page,
//             limit: limit
//         });
//     } catch (error) {
//         console.error("Lỗi khi lấy tin nhắn trong hội thoại:", error);
//         return res.status(500).json({ message: "Không thể lấy tin nhắn trong hội thoại." });
//     }
// };
exports.createPersonalConversation = async (req, res) => {
    const { userIds } = req.body;  // Lấy danh sách userIds từ request body

    try {
        const newConversation = await messageService.createPersonalConversation(userIds);
        res.status(201).json(newConversation);  // Trả về hội thoại đã tạo
    } catch (error) {
        console.error("Lỗi khi tạo hội thoại cá nhân:", error);
        res.status(500).json({ message: error.message });  // Trả về lỗi nếu có
    }
};
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

exports.sendMessageController = async (req, res) => {
    try {
        const { conversationId, senderId, text, fileUrl, replyToMessageId } = req.body;

        // Gọi hàm service để gửi tin nhắn
        const newMessage = await messageService.sendMessage(
            conversationId,
            senderId,
            text,
            fileUrl,
            replyToMessageId
        );

        // Trả về phản hồi thành công
        res.status(201).json({
            message: "Message sent successfully",
            data: newMessage,
        });
    } catch (error) {
        // Trả về lỗi nếu có
        res.status(500).json({
            message: "Error sending message",
            error: error.message,
        });
    }
};


exports.markMessagesAsReadController = async (req, res) => {
    const { messageId, userId } = req.body;
    try {
        const result = await messageService.markMessagesAsRead(messageId, userId);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({ error: error.message });
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
    const { conversationId } = req.body;
    const { userId } = req.params

    try {
        const result = await messageService.toggleBlockUserMessage(conversationId, userId);
        return res.status(200).json(result);
    } catch (error) {
        console.error("Lỗi khi chặn/mở khóa người dùng:", error);
        return res.status(500).json({ message: "Không thể thực hiện chặn/mở khóa người dùng." });
    }
};
