const redisClient = require("./redisClient");

const updateUserStatus = async (userId, status, socket, io) => {
    try {
        const key = `user:${userId}:sessions`;
        const currentSessions = status === "online"
            ? await redisClient.incr(key)
            : await redisClient.decr(key);

        if (status === "online" && currentSessions === 1) {
            await redisClient.set(`user:${userId}:status`, "online");
            // io.emit("userStatusUpdate", { userId, status: "online" });
            console.log(`User ${userId} is online`);
        } else if (status === "offline" && currentSessions === 0) {
            await redisClient.set(`user:${userId}:status`, "offline");
            // io.emit("userStatusUpdate", { userId, status: "offline" });
            console.log(`User ${userId} is offline`);
        }
    } catch (error) {
        console.error("Error updating user status:", error);
    }
};

const handleSendMessage = async (messageData, socket) => {
    const { senderId, recipientId, text } = messageData;

    try {
        const status = await redisClient.get(`user:${recipientId}:status`);

        if (status === "online") {
            socket.to(`user:${recipientId}`).emit("receive_message", messageData);
        } else {
            // Lưu tin nhắn cho người nhận chưa online
            console.log(`User ${recipientId} is offline, storing message.`);
            // Store the message for later delivery (You can use a Redis list or database)
        }
    } catch (error) {
        console.error("Error sending message:", error);
    }
};

const handleUserDisconnect = async (userId, socket, io) => {
    try {
        const currentSessions = await redisClient.decr(`user:${userId}:sessions`);

        if (currentSessions === 0) {
            await redisClient.set(`user:${userId}:status`, "offline");
            //io.emit("userStatusUpdate", { userId, status: "offline" });
            console.log(`User ${userId} is offline (disconnected)`);
        }
    } catch (error) {
        console.error("Error handling user disconnect:", error);
    }
};

module.exports = { updateUserStatus, handleSendMessage, handleUserDisconnect };
