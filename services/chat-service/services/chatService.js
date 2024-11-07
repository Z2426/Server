const Message = require("../models/Message");
const redisClient = require("../config/redis");
const Group = require("../models/Group"); // Import schema Group nếu cần

module.exports = {
    async sendPersonalMessage(senderId, recipientId, content) {
        // Lưu tin nhắn vào MongoDB
        const newMessage = await Message.create({
            sender: senderId,
            recipient: recipientId,
            content,
        });

        // Phát sự kiện qua Redis để phân phối cho các bên liên quan
        const messageData = {
            type: 'personal',
            senderId,
            recipientId,
            message: newMessage,
        };

        // Kiểm tra trạng thái online của người nhận
        const status = await redisClient.get(`user:${recipientId}:status`);

        if (status === "online") {
            // Nếu người nhận online, phát tin nhắn qua Redis
            redisClient.publish(`user:${recipientId}`, JSON.stringify(messageData));
        } else {
            // Nếu người nhận không online, lưu tin nhắn vào Redis
            await this.saveUnreadPersonalMessage(recipientId, senderId, messageData);
        }

        // Trả về tin nhắn mới
        return newMessage;
    },

    async sendGroupMessage(socket, groupId, content) {
        const group = await Group.findById(groupId);
        if (!group) return;

        // Lưu tin nhắn vào MongoDB
        const newMessage = await Message.create({
            sender: socket.userId,  // Giả sử bạn có userId của người gửi từ socket
            group: groupId,
            content,
        });

        // Phát sự kiện qua Redis để phân phối cho các bên liên quan
        const messageData = {
            type: 'group',
            senderId: socket.userId,
            groupId,
            message: newMessage,
        };

        // Lọc ra các thành viên trong nhóm và kiểm tra xem họ có online không
        group.members.forEach(async (memberId) => {
            // Kiểm tra xem người dùng có online trong Redis không
            const status = await redisClient.get(`user:${memberId}:status`);

            // Nếu người nhận online, phát tin nhắn qua Redis
            if (status === "online") {
                redisClient.publish(`group:${groupId}:${memberId}`, JSON.stringify(messageData)); // Phát tin nhắn tới kênh của thành viên online
            } else {
                // Nếu không online, lưu tin nhắn vào Redis cho đến khi người dùng online
                this.saveUnreadGroupMessage(memberId, groupId, messageData);
            }
        });

        // Trả về tin nhắn mới
        return newMessage;
    },

    // Lưu tin nhắn chưa đọc cá nhân
    async saveUnreadPersonalMessage(recipientId, senderId, message) {
        await redisClient.lpush(`user:${recipientId}:unread`, JSON.stringify(message));
    },

    // Lưu tin nhắn chưa đọc nhóm
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
    async markMessageAsRead(userId, messageId) {
        const message = await Message.findById(messageId);
        if (!message.readBy.includes(userId)) {
            message.readBy.push(userId);
            await message.save();
        }
    }
};
