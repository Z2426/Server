const app = require("./app");
const http = require("http");
const socketIo = require("socket.io");
const redisClient = require("./redisClient");
const server = http.createServer(app);
const io = socketIo(server);

io.on("connection", (socket) => {
    console.log("New client connected");
    const userId = socket.userId;  // Giả sử bạn có thông tin userId từ client

    // Lưu trạng thái online vào Redis
    redisClient.set(`user:${userId}:status`, "online");

    socket.on("disconnect", () => {
        // Cập nhật trạng thái thành offline khi người dùng ngắt kết nối
        redisClient.set(`user:${userId}:status`, "offline");
    });
    require("./socket/socketHandler")(socket);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
