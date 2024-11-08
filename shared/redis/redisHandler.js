const redisClient = require("./redisClient");

const updateUserStatus = async (userId, status, socket, io) => {
    try {
        const key = `user:${userId}:sessions`;
        let currentSessions = await redisClient.get(key);

        currentSessions = parseInt(currentSessions) || 0;

        if (status === "online") {
            // Tăng số lượng phiên kết nối
            currentSessions++;
            await redisClient.set(key, currentSessions);
            if (currentSessions === 1) {
                await redisClient.set(`user:${userId}:status`, "online");
                console.log(`User ${userId} is online`);
            }
        } else if (status === "offline") {
            // Giảm số lượng phiên kết nối
            currentSessions--;
            await redisClient.set(key, currentSessions);
            if (currentSessions === 0) {
                await redisClient.set(`user:${userId}:status`, "offline");
                console.log(`User ${userId} is offline`);
            }
        }
    } catch (error) {
        console.error("Error updating user status:", error);
    }
};



const handleUserDisconnect = async (userId, socket, io) => {
    try {
        const currentSessions = await redisClient.decr(`user:${userId}:sessions`);

        if (currentSessions === 0) {
            await redisClient.set(`user:${userId}:status`, "offline");
            console.log(`User ${userId} is offline (disconnected)`);
        }
    } catch (error) {
        console.error("Error handling user disconnect:", error);
    }
};

// Thêm một kết nối mới vào danh sách kết nối của người dùng
const addUserSocket = async (userId, socketId) => {
    await redisClient.sadd(`user:${userId}:sockets`, socketId);
};

// Xóa kết nối của người dùng khi họ ngắt kết nối
const removeUserSocket = async (userId, socketId) => {
    await redisClient.srem(`user:${userId}:sockets`, socketId);
};

// Lấy tất cả các socket.id của người dùng
const getUserSockets = async (userId) => {
    return await redisClient.smembers(`user:${userId}:sockets`);
};

// Gửi tin nhắn tới tất cả các kết nối của người dùng
const sendMessageToAllSockets = async (userId, io, messageData) => {
    try {
        const sockets = await getUserSockets(userId);
        sockets.forEach((socketId) => {
            io.to(socketId).emit('receive_message', messageData);
        });
    } catch (error) {
        console.error("Error sending message to all sockets:", error);
    }
};

module.exports = { addUserSocket, removeUserSocket, getUserSockets, sendMessageToAllSockets, updateUserStatus, handleUserDisconnect };
