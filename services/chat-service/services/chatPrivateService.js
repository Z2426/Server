const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { redisClient, connectToRedis } = require("../shared/redis/redisClient")
connectToRedis()
exports.getAllMessagesInConversation = async (conversationId, limit = 20, page = 1) => {
    try {
        // Tính toán số tin nhắn cần bỏ qua cho phân trang
        const skip = (page - 1) * limit;

        // Truy vấn tin nhắn trong hội thoại với phân trang
        const messages = await Message.find({ conversationId })
            .sort({ timestamp: 1 }) // Sắp xếp theo thời gian tin nhắn
            .skip(skip)
            .limit(limit);

        return messages;
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

exports.sendPersonalMessage = async (senderId, recipientId, content, file) => {
    const timestamp = Date.now();

    try {
        const conversation = await Conversation.findOneAndUpdate(
            { type: "personal", members: { $all: [senderId, recipientId] } },
            { $setOnInsert: { type: "personal", members: [senderId, recipientId] } },
            { upsert: true, new: true }
        );

        if (conversation.blockedUsers && conversation.blockedUsers.includes(senderId)) {
            throw new Error("Bạn đã bị chặn bởi người nhận.");
        }

        const newMessage = await createMessage(conversation._id, senderId, content, timestamp, file);

        const messageData = {
            type: 'personal',
            senderId,
            recipientId,
            message: newMessage,
            timestamp,
        };

        const status = await redisClient.get(`user:${recipientId}:status`);
        if (status === "online") {
            redisClient.publish(`chatuser:${recipientId}`, JSON.stringify(messageData));
        }

        return newMessage;
    } catch (err) {
        console.error("Lỗi khi gửi tin nhắn cá nhân:", err);
        throw new Error("Không thể gửi tin nhắn.");
    }
};

exports.markMessagesAsRead = async (conversationId, userId) => {
    try {
        const result = await Message.updateMany(
            { conversationId, senderId: { $ne: userId }, status: "sent" },
            { $set: { status: "read" } }
        );

        await Conversation.updateOne(
            { _id: conversationId, "unreadCounts.userId": userId },
            { $set: { "unreadCounts.$.count": 0 } }
        );

        return result;
    } catch (error) {
        console.error("Lỗi khi đánh dấu tin nhắn là đã đọc:", error);
        throw error;
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


