const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { redisClient } = require("../shared/redis/redisClient")
/** ================================================
 * Conversation Management
 * ================================================ */
exports.getConversationById = async (conversationId) => {
    try {
        const conversation = await Conversation.findById(conversationId)
        return conversation;
    } catch (error) {
        throw new Error('Error while fetching conversation: ' + error.message);
    }
};
exports.getConversationsByUser = async (userId) => {
    try {
        const conversations = await Conversation.find({
            members: userId
        })
        return conversations;
    } catch (error) {
        console.error("Error in conversation service:", error);
        throw error;
    }
};

/** ================================================
 * Message Management
 * ================================================ */

exports.getAllMessagesInConversation = async (conversationId, limit = 20, page = 1) => {
    try {
        const skip = (page - 1) * limit;
        const totalMessages = await Message.countDocuments({ conversationId });
        const totalPages = Math.ceil(totalMessages / limit);
        const remainingPages = totalPages - page;
        const messages = await Message.find({ conversationId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        return { messages, remainingPages };
    } catch (error) {
        throw new Error("get all mess in conversation occur bug " + error.message);
    }
};

exports.createPersonalConversation = async (userIds) => {
    if (userIds.length !== 2) {
        throw new Error('A personal conversation can only be created between two users.');
    }

    try {
        const existingConversation = await Conversation.findOne({
            type: 'personal',
            members: { $all: userIds },
        });

        if (existingConversation) {
            return existingConversation;
        }


        const newConversation = new Conversation({
            type: 'personal',
            members: userIds,
        });

        await newConversation.save();
        return newConversation;
    } catch (error) {
        throw new Error('Unable to create personal conversation: ' + error.message);
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
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return null;
        const isGroupChat = conversation.members.length > 2;
        const originalMessage = await Message.findById(messageId);
        if (!originalMessage) return null;
        const newMessage = await createMessage(conversationId, senderId, content, timestamp, file, originalMessage._id);
        const messageDataToPublish = {
            type: isGroupChat ? 'group' : 'private',
            senderId,
            conversationId,
            message: newMessage,
            replyToMessage: originalMessage,
            timestamp,
        };
        if (isGroupChat) {
            const onlineMembers = await handleRedisStatus(conversation.members);
            for (const memberId of conversation.members) {
                if (onlineMembers[memberId] === "online") {
                    redisClient.publish(`chatgroup:${conversation._id}:${memberId}`, JSON.stringify(messageDataToPublish));
                }
            }
        } else {
            for (const memberId of conversation.members) {
                redisClient.publish(`chatuser:${conversation._id}:${memberId}`, JSON.stringify(messageDataToPublish));
            }
        }
        return newMessage;
    } catch (err) {
        console.error("Error while sending reply message:", err);
        throw new Error("Unable to send reply message.");
    }
};

exports.replyToMessage = async (senderId, conversationId, messageId, content, file) => {
    const timestamp = Date.now();
    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return null;
        const isGroupChat = conversation.members.length > 2;
        const originalMessage = await Message.findById(messageId);
        if (!originalMessage) return null;
        const newMessage = await createMessage(conversationId, senderId, content, timestamp, file, originalMessage._id);
        const messageDataToPublish = {
            type: isGroupChat ? 'group' : 'private',
            senderId,
            conversationId,
            message: newMessage,
            replyToMessage: originalMessage,
            timestamp,
        };
        if (isGroupChat) {
            const onlineMembers = await handleRedisStatus(conversation.members);
            for (const memberId of conversation.members) {
                if (onlineMembers[memberId] === "online") {
                    redisClient.publish(`chatgroup:${conversation._id}:${memberId}`, JSON.stringify(messageDataToPublish));
                }
            }
        } else {
            for (const memberId of conversation.members) {
                redisClient.publish(`chatuser:${conversation._id}:${memberId}`, JSON.stringify(messageDataToPublish));
            }
        }
        return newMessage;
    } catch (err) {
        console.error("Error while sending reply message:", err);
        throw new Error("Unable to send reply message.");
    }
};

exports.sendMessage = async (conversationId, senderId, text, fileUrl = null, replyToMessageId = null) => {
    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new Error("Conversation not found");
        }
        const newMessage = new Message({
            conversationId: conversationId,
            senderId: senderId,
            text: text,
            file_url: fileUrl,
            status: "sent",
            readStatus: conversation.members.map(member => ({
                userId: member,
                status: member.toString() === senderId.toString() ? "read" : "sent",
                timestamp: new Date(),
            })),
            ...(replyToMessageId && { reply_to_message: replyToMessageId }),
        });
        await newMessage.save();
        conversation.lastMessage = {
            content: text,
            senderId: senderId,
            timestamp: new Date(),
        };
        conversation.unreadCounts.forEach((userUnreadCount) => {
            if (userUnreadCount.userId.toString() !== senderId.toString()) {
                userUnreadCount.count += 1;
            }
        });
        await conversation.save();
        return newMessage;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

exports.markMessagesAsRead = async (messageId, userId) => {
    try {
        const message = await Message.findById(messageId);
        if (!message) {
            throw new Error("Message not found");
        }
        const userStatus = message.readStatus.find(status => status.userId.toString() === userId.toString());
        if (userStatus && userStatus.status !== "read") {
            userStatus.status = "read";
            userStatus.timestamp = new Date();
            const allRead = message.readStatus.every(status => status.status === "read");
            if (allRead) {
                message.status = "read";
            }
            await message.save();
        }
        return { message: "Message marked as read successfully." };
    } catch (error) {
        console.error("Error marking message as read:", error);
        throw new Error("Error marking message as read");
    }
};

exports.toggleBlockUserMessage = async (conversationId, userId) => {
    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new Error("Conversation does not exist.");
        }
        const isUserBlocked = conversation.blockedUsers.includes(userId);
        if (isUserBlocked) {
            await Conversation.updateOne(
                { _id: conversationId },
                { $pull: { blockedUsers: userId } }
            );
            return { message: 'User has been unblocked and can send messages.' };
        } else {
            await Conversation.updateOne(
                { _id: conversationId },
                { $push: { blockedUsers: userId } }
            );
            return { message: 'User has been blocked and cannot send messages.' };
        }
    } catch (error) {
        console.error("Error blocking/unblocking user:", error);
        throw error;
    }
};

exports.searchMessagesByContent = async (conversationId, searchQuery, limit = 20, page = 1) => {
    try {
        limit = parseInt(limit, 10);
        page = parseInt(page, 10);
        if (isNaN(limit) || limit <= 0) {
            limit = 20;
        }
        if (isNaN(page) || page < 1) {
            page = 1;
        }
        const query = { conversationId, $text: { $search: searchQuery || "" } };
        return await Message.find(query)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
    } catch (error) {
        console.error("Error searching messages:", error);
        throw error;
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









