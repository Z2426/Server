// Import Redis client and ensure it's connected
const { redisClient, connectToRedis } = require("../../shared/redis/redisClient");
connectToRedis();
const setUserStatus = async (recipientId, status) => {
    const key = `user:${recipientId}:status`; // Tạo key
    const expiration = 3600; // TTL (thời gian sống) tính bằng giây, ví dụ 1 giờ

    try {
        // Lưu trạng thái vào Redis với thời gian sống
        await redisClient.set(key, status, { EX: expiration });
        console.log(`Đã lưu trạng thái '${status}' cho user ${recipientId} với key '${key}'.`);
    } catch (error) {
        console.error('Lỗi khi lưu trạng thái:', error);
    }
}
// Add a socket ID to the user's list of active connections
const addUserSocket = async (userId, socketId) => {
    try {
        await redisClient.sAdd(`user:${userId}:sockets`, socketId); // Corrected to sAdd
        console.log(`Socket ID ${socketId} added for user ${userId}`);
    } catch (error) {
        console.error("Error adding socket ID to Redis:", error);
    }
};

// Remove a socket ID from the user's list of active connections
const removeUserSocket = async (userId, socketId) => {
    try {
        await redisClient.sRem(`user:${userId}:sockets`, socketId); // Corrected to sRem
        console.log(`Socket ID ${socketId} removed for user ${userId}`);
        // Kiểm tra xem danh sách còn lại bao nhiêu socket
        const remainingSockets = await redisClient.sCard(`user:${userId}:sockets`);

        if (remainingSockets === 0) {
            // Nếu không còn kết nối nào, cập nhật trạng thái thành "offline"
            await redisClient.set(`user:${userId}:status`, 'offline');
            console.log(`User ${userId} is now offline.`);
        }
    } catch (error) {
        console.error("Error removing socket ID from Redis:", error);
    }
};

// Retrieve all socket IDs for a specific user
const getUserSockets = async (userId) => {
    try {
        return await redisClient.sMembers(`user:${userId}:sockets`); // Corrected to sMembers
    } catch (error) {
        console.error("Error fetching user sockets:", error);
        return [];
    }
};

// Send a message to all sockets associated with a user
const sendMessageToAllSockets = async (userId, io, messageData) => {
    try {
        const sockets = await getUserSockets(userId);
        sockets.forEach((socketId) => {
            io.to(socketId).emit("receive_message", messageData);
        });
    } catch (error) {
        console.error("Error sending message to all sockets:", error);
    }
};

module.exports = {
    addUserSocket,
    removeUserSocket,
    getUserSockets,
    sendMessageToAllSockets,
    setUserStatus
};
