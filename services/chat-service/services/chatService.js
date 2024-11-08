const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const redisClient = require("../config/redis");

module.exports = {
    // Gửi tin nhắn cá nhân
    async sendPersonalMessage(senderId, recipientId, content) {
        const timestamp = Date.now(); // Lấy thời gian hiện tại (milliseconds)

        // Tạo hoặc tìm cuộc hội thoại cá nhân
        const conversation = await Conversation.findOneAndUpdate(
            { type: "personal", members: { $all: [senderId, recipientId] } },
            { $setOnInsert: { type: "personal", members: [senderId, recipientId] } },
            { upsert: true, new: true }
        );

        // Lưu tin nhắn vào MongoDB
        const newMessage = await Message.create({
            conversationId: conversation._id,
            senderId,
            text: content,
            timestamp, // Thêm thời gian vào MongoDB
        });

        // Dữ liệu tin nhắn để phát qua Redis
        const messageData = {
            type: 'personal',
            senderId,
            recipientId,
            message: newMessage,
            timestamp, // Thêm thời gian vào Redis
        };

        // Kiểm tra trạng thái online của người nhận
        const status = await redisClient.get(`user:${recipientId}:status`);

        if (status === "online") {
            // Nếu người nhận online, phát tin nhắn qua Redis
            redisClient.publish(`user:${recipientId}`, JSON.stringify(messageData));
        } else {
            // Nếu người nhận không online, lưu tin nhắn chưa đọc vào Redis
            await this.saveUnreadPersonalMessage(recipientId, senderId, messageData);
        }

        return newMessage;
    },

    // Gửi tin nhắn nhóm
    async sendGroupMessage(senderId, groupId, content) {
        const timestamp = Date.now(); // Lấy thời gian hiện tại (milliseconds)

        // Tìm cuộc hội thoại nhóm
        const conversation = await Conversation.findById(groupId);
        if (!conversation || conversation.type !== "group") return null;

        // Lưu tin nhắn vào MongoDB
        const newMessage = await Message.create({
            conversationId: conversation._id,
            senderId,
            text: content,
            timestamp, // Thêm thời gian vào MongoDB
        });

        // Dữ liệu tin nhắn để phát qua Redis
        const messageData = {
            type: 'group',
            senderId,
            groupId,
            message: newMessage,
            timestamp, // Thêm thời gian vào Redis
        };

        // Lọc các thành viên trong nhóm và kiểm tra trạng thái online
        for (const memberId of conversation.members) {
            const status = await redisClient.get(`user:${memberId}:status`);

            if (status === "online") {
                // Nếu thành viên online, phát tin nhắn qua Redis
                redisClient.publish(`group:${groupId}:${memberId}`, JSON.stringify(messageData));
            } else {
                // Nếu thành viên offline, lưu tin nhắn chưa đọc vào Redis
                this.saveUnreadGroupMessage(memberId, groupId, messageData);
            }
        }

        return newMessage;
    },

    // Lưu tin nhắn chưa đọc cho tin nhắn cá nhân
    async saveUnreadPersonalMessage(recipientId, senderId, message) {
        await redisClient.lpush(`user:${recipientId}:unread`, JSON.stringify(message));
    },

    // Lưu tin nhắn chưa đọc cho tin nhắn nhóm
    async saveUnreadGroupMessage(userId, groupId, message) {
        await redisClient.lpush(`user:${userId}:unread:group`, JSON.stringify(message));
    },

    // Lấy danh sách tin nhắn chưa đọc cá nhân
    async getUnreadPersonalMessages(userId) {
        const unreadMessages = await redisClient.lrange(`user:${userId}:unread`, 0, -1);
        return unreadMessages.map(msg => JSON.parse(msg));
    },

    // Lấy danh sách tin nhắn chưa đọc nhóm
    async getUnreadGroupMessages(userId) {
        const unreadMessages = await redisClient.lrange(`user:${userId}:unread:group`, 0, -1);
        return unreadMessages.map(msg => JSON.parse(msg));
    },

    // Đánh dấu tin nhắn là đã đọc
    async markMessagesAsRead(userId, conversationId) {
        // Đánh dấu tin nhắn là đã đọc trong MongoDB
        await Message.updateMany(
            { conversationId, "readBy": { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );

        // Cập nhật trạng thái "đã đọc" trong Redis cho cuộc hội thoại
        await redisClient.publish(`conversation:${conversationId}`, JSON.stringify({ userId, status: "read" }));
    }
};
