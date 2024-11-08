const { Server } = require("socket.io");
const { addUserSocket, removeUserSocket } = require("../shared/redis/redisHandler");

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

        // Khi người dùng online
        socket.on("userOnline", async ({ userId }) => {
            socket.userId = userId; // Lưu userId vào socket
            await addUserSocket(userId, socket.id);  // Lưu socket.id vào Redis
        });

        // Khi người dùng offline
        socket.on("userOffline", async ({ userId }) => {
            await removeUserSocket(userId, socket.id); // Xóa socket.id khỏi Redis
        });


        // Khi người dùng ngắt kết nối
        socket.on('disconnect', async () => {
            console.log('Client disconnected');
            const userId = socket.userId;

            if (userId) {
                await removeUserSocket(userId, socket.id); // Xóa socket.id khỏi Redis khi ngắt kết nối
            }
        });
    });

    return io;
};

module.exports = createSocketServer;
