const { Server } = require("socket.io");
const { updateUserStatus, handleSendMessage, handleUserDisconnect } = require("../shared/redis/redisHandler");

const createSocketServer = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_PORT || "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["Content-Type"],
            credentials: true
        }
    });
    io.on('connection', (socket) => {
        console.log(`Client connected with id: ${socket.id}`);
        // Khi người dùng online (mở trang)
        socket.on("userOnline", async ({ userId }) => {
            await updateUserStatus(userId, "online", socket, io);
        });
        // Khi người dùng offline (đóng trang)
        socket.on("userOffline", async ({ userId }) => {
            await updateUserStatus(userId, "offline", socket, io);
        });

        // Khi người dùng gửi tin nhắn
        socket.on('send_message', async (messageData) => {
            console.log(`Received message from ${socket.id}:`, messageData);
            await handleSendMessage(messageData, socket);
        });
        // Khi người dùng ngắt kết nối
        socket.on('disconnect', async () => {
            console.log('Client disconnected');
            const userId = socket.userId; // Giả sử userId đã được gán từ phía client khi đăng nhập

            if (userId) {
                await handleUserDisconnect(userId, socket, io);
            }
        });
    });

    return io;
};
module.exports = createSocketServer;
