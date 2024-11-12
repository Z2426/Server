const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const redisClient = require("../config/redis");

const handleRedisStatus = async (userIds) => {
    const statusPromises = userIds.map(userId => redisClient.get(`user:${userId}:status`));
    const statuses = await Promise.all(statusPromises);
    return userIds.reduce((acc, userId, idx) => {
        acc[userId] = statuses[idx];
        return acc;
    }, {});
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
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return null;

        const originalMessage = await Message.findById(messageId);
        if (!originalMessage) return null;

        const newMessage = await createMessage(conversationId, senderId, content, timestamp, file, originalMessage._id);

        const messageDataToPublish = {
            type: 'group',
            senderId,
            groupId: conversation._id,
            message: newMessage,
            replyToMessage: originalMessage,
            timestamp,
        };

        const onlineMembers = await handleRedisStatus(conversation.members);
        for (const memberId of conversation.members) {
            if (onlineMembers[memberId] === "online") {
                redisClient.publish(`chatgroup:${conversation._id}:${memberId}`, JSON.stringify(messageDataToPublish));
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
        const result = await Conversation.updateOne(
            { _id: conversationId },
            { $pull: { blockedUsers: userId } },
            { upsert: true }
        );

        if (result.modifiedCount === 0) {
            await Conversation.updateOne(
                { _id: conversationId },
                { $push: { blockedUsers: userId } }
            );
            return { message: 'Người dùng đã bị chặn và không thể gửi tin nhắn.' };
        }

        return { message: 'Người dùng đã được mở khóa và có thể gửi tin nhắn.' };
    } catch (error) {
        console.error("Lỗi khi chặn/mở khóa người dùng:", error);
        throw error;
    }
};

