const redisClient = require("../config/redis");

module.exports = (socket) => {

    socket.on("message", (data) => {
        const { recipientId, content, groupId } = data;

        if (groupId) {
            redisClient.publish(`group:${groupId}`, JSON.stringify(data));
        } else {
            redisClient.publish(`user:${recipientId}`, JSON.stringify(data));
        }
    });
    // Lắng nghe sự kiện từ Redis
    redisClient.on("message", (channel, message) => {
        // Kiểm tra kênh và gửi tin nhắn đến đúng client
        if (channel.startsWith('user:')) {
            socket.emit('receivePersonalMessage', JSON.parse(message)); // Tin nhắn cá nhân
        } else if (channel.startsWith('group:')) {
            socket.emit('receiveGroupMessage', JSON.parse(message)); // Tin nhắn nhóm
        }
    });
};

