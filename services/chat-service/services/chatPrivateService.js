const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { redisClient, connectToRedis } = require("../shared/redis/redisClient")

connectToRedis()
// Lấy thông tin cuộc hội thoại theo ID
exports.getConversationById = async (conversationId) => {
    try {
        // Tìm cuộc hội thoại trong DB
        const conversation = await Conversation.findById(conversationId)
        return conversation;
    } catch (error) {
        throw new Error('Error while fetching conversation: ' + error.message);
    }
};

exports.getConversationsByUser = async (userId) => {
    try {
        console.log(userId)
        const conversations = await Conversation.find({
            members: userId
        })
        console.log(conversations)
        return conversations;
    } catch (error) {
        console.error("Error in conversation service:", error);
        throw error;
    }
};
exports.getAllMessagesInConversation = async (conversationId, limit = 20, page = 1) => {
    try {
        // Tính toán số tin nhắn cần bỏ qua cho phân trang
        const skip = (page - 1) * limit;

        // Đếm tổng số tin nhắn trong cuộc trò chuyện để tính số trang
        const totalMessages = await Message.countDocuments({ conversationId });

        // Tính toán số trang còn lại
        const totalPages = Math.ceil(totalMessages / limit);
        const remainingPages = totalPages - page;

        // Truy vấn tin nhắn trong hội thoại với phân trang
        const messages = await Message.find({ conversationId })
            .sort({ timestamp: -1 }) // Sắp xếp theo thời gian tin nhắn
            .skip(skip)
            .limit(limit);

        return { messages, remainingPages }; // Trả về cả tin nhắn và số trang còn lại
    } catch (error) {
        throw new Error("Không thể lấy tin nhắn trong hội thoại: " + error.message);
    }
};

const handleRedisStatus = async (userIds) => {
    const statusPromises = userIds.map(userId => redisClient.get(`user:${userId}:status`));
    const statuses = await Promise.all(statusPromises);
    return userIds.reduce((acc, userId, idx) => {
        acc[userId] = statuses[idx];
        return acc;
    }, {});
};
exports.createPersonalConversation = async (userIds) => {
    // Kiểm tra xem có chính xác 2 người dùng không
    if (userIds.length !== 2) {
        throw new Error('Chỉ có thể tạo hội thoại cá nhân giữa hai người dùng.');
    }

    try {
        // Kiểm tra xem hội thoại giữa hai người dùng này đã tồn tại chưa
        const existingConversation = await Conversation.findOne({
            type: 'personal',
            members: { $all: userIds },  // Kiểm tra cả 2 người dùng có trong members
        });

        if (existingConversation) {
            return existingConversation;  // Trả lại hội thoại đã có
        }

        // Tạo hội thoại mới nếu không tồn tại
        const newConversation = new Conversation({
            type: 'personal',
            members: userIds,
        });

        await newConversation.save();
        return newConversation;
    } catch (error) {
        throw new Error('Không thể tạo hội thoại cá nhân: ' + error.message);
    }
};
const createMessage = async (conversationId, senderId, content, timestamp, file = null, replyToMessageId = null) => {
    const messageData = {
        conversationId,
        senderId,
        text: content,
        timestamp,
        reply_to_message: replyToMessageId ? mongoose.Types.ObjectId(replyToMessageId) : null,
        file_url: file ? file.path : null
    };
    return await Message.create(messageData);
};
exports.replyToMessage = async (senderId, conversationId, messageId, content, file) => {
    const timestamp = Date.now();

    try {
        // Tìm hội thoại
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return null;

        // Xác định kiểu hội thoại
        const isGroupChat = conversation.members.length > 2;

        // Tìm tin nhắn gốc để reply
        const originalMessage = await Message.findById(messageId);
        console.log(originalMessage)
        if (!originalMessage) return null;

        // Tạo tin nhắn mới với thông tin trả lời
        const newMessage = await createMessage(conversationId, senderId, content, timestamp, file, originalMessage._id);

        // Chuẩn bị dữ liệu tin nhắn để gửi qua Redis
        const messageDataToPublish = {
            type: isGroupChat ? 'group' : 'private',
            senderId,
            conversationId,
            message: newMessage,
            replyToMessage: originalMessage,
            timestamp,
        };

        if (isGroupChat) {
            // Trường hợp hội thoại nhóm: phát tới từng thành viên qua kênh `chatgroup`
            const onlineMembers = await handleRedisStatus(conversation.members);
            for (const memberId of conversation.members) {
                if (onlineMembers[memberId] === "online") {
                    redisClient.publish(`chatgroup:${conversation._id}:${memberId}`, JSON.stringify(messageDataToPublish));
                }
            }
        } else {
            // Trường hợp hội thoại cá nhân: phát tới kênh `chatuser`
            for (const memberId of conversation.members) {
                redisClient.publish(`chatuser:${conversation._id}:${memberId}`, JSON.stringify(messageDataToPublish));
            }
        }

        return newMessage;
    } catch (err) {
        console.error("Lỗi khi gửi tin nhắn trả lời:", err);
        throw new Error("Không thể gửi tin nhắn trả lời.");
    }
};
exports.sendMessage = async (conversationId, senderId, text, fileUrl = null, replyToMessageId = null) => {
    try {
        // Kiểm tra xem cuộc trò chuyện có tồn tại không
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new Error("Conversation not found");
        }

        // Tạo đối tượng tin nhắn mới
        const newMessage = new Message({
            conversationId: conversationId,
            senderId: senderId,
            text: text,
            file_url: fileUrl,
            status: "sent", // Đặt trạng thái tin nhắn ban đầu là "sent"
            readStatus: conversation.members.map(member => ({
                userId: member,
                status: member.toString() === senderId.toString() ? "read" : "sent", // Người gửi tin nhắn có trạng thái "read"
                timestamp: new Date(),
            })),
            ...(replyToMessageId && { reply_to_message: replyToMessageId }),
        });
        console.log(newMessage)
        // Lưu tin nhắn vào database
        await newMessage.save();

        // Cập nhật thông tin cuộc trò chuyện (lastMessage, unreadCounts)
        conversation.lastMessage = {
            content: text,
            senderId: senderId,
            timestamp: new Date(),
        };

        // Cập nhật số lượng tin nhắn chưa đọc cho từng thành viên
        conversation.unreadCounts.forEach((userUnreadCount) => {
            if (userUnreadCount.userId.toString() !== senderId.toString()) {
                userUnreadCount.count += 1; // Tăng số tin nhắn chưa đọc cho những thành viên khác
            }
        });

        // Lưu lại cuộc trò chuyện với thông tin mới
        await conversation.save();

        // Trả về tin nhắn đã gửi
        return newMessage;

    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};
exports.markMessagesAsRead = async (messageId, userId) => {
    try {
        // Tìm tin nhắn cần cập nhật
        const message = await Message.findById(messageId);
        if (!message) {
            throw new Error("Message not found");
        }
        // Tìm trạng thái của người dùng trong readStatus
        const userStatus = message.readStatus.find(status => status.userId.toString() === userId.toString());
        if (userStatus && userStatus.status !== "read") {
            // Cập nhật trạng thái của người dùng thành "read"
            userStatus.status = "read";
            userStatus.timestamp = new Date();

            // Kiểm tra nếu tất cả người dùng trong cuộc trò chuyện đã đọc tin nhắn
            const allRead = message.readStatus.every(status => status.status === "read");

            // Nếu tất cả đã đọc, thay đổi trạng thái tin nhắn chính thức thành "read"
            if (allRead) {
                message.status = "read"; // Cập nhật trạng thái của tin nhắn thành "read"
            }

            // Lưu tin nhắn với trạng thái đã cập nhật
            await message.save();
        }
        return { message: "Message marked as read successfully." };
    } catch (error) {
        console.error("Error marking message as read:", error);
        throw new Error("Error marking message as read");
    }
};

exports.searchMessagesByContent = async (conversationId, searchQuery, limit = 20, page = 1) => {
    try {
        // Chuyển đổi limit và page thành kiểu số nguyên
        limit = parseInt(limit, 10);
        page = parseInt(page, 10);

        // Kiểm tra nếu limit hoặc page không hợp lệ (ví dụ: limit <= 0 hoặc page < 1)
        if (isNaN(limit) || limit <= 0) {
            limit = 20; // Giá trị mặc định nếu limit không hợp lệ
        }
        if (isNaN(page) || page < 1) {
            page = 1; // Giá trị mặc định nếu page không hợp lệ
        }

        const query = { conversationId, $text: { $search: searchQuery || "" } };

        return await Message.find(query)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
    } catch (error) {
        console.error("Lỗi khi tìm kiếm tin nhắn:", error);
        throw error;
    }
};
exports.toggleBlockUserMessage = async (conversationId, userId) => {
    try {
        // Tìm cuộc trò chuyện với conversationId
        const conversation = await Conversation.findById(conversationId);

        // Nếu không tìm thấy cuộc trò chuyện, trả về lỗi
        if (!conversation) {
            throw new Error("Cuộc trò chuyện không tồn tại.");
        }

        // Kiểm tra nếu userId đã bị chặn trong cuộc trò chuyện
        const isUserBlocked = conversation.blockedUsers.includes(userId);

        if (isUserBlocked) {
            // Nếu người dùng đã bị chặn, bỏ họ khỏi mảng blockedUsers
            await Conversation.updateOne(
                { _id: conversationId },
                { $pull: { blockedUsers: userId } }
            );
            return { message: 'Người dùng đã được mở khóa và có thể gửi tin nhắn.' };
        } else {
            // Nếu người dùng chưa bị chặn, thêm họ vào mảng blockedUsers
            await Conversation.updateOne(
                { _id: conversationId },
                { $push: { blockedUsers: userId } }
            );
            return { message: 'Người dùng đã bị chặn và không thể gửi tin nhắn.' };
        }
    } catch (error) {
        console.error("Lỗi khi chặn/mở khóa người dùng:", error);
        throw error;
    }
};


