require('./shared/config/channels.js');
const { Server } = require("socket.io"); // Import đúng Socket.IO
const { connectToRedis, subscribeToChannels } = require('./shared/utils/redisClient');

const startSocketServer = async () => {
    // Khởi tạo server HTTP cho WebSocket
    const server = require('http').createServer();

    // Khởi tạo Socket.IO server với CORS
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:3006", // URL của frontend React
            methods: ["GET", "POST"], // Các phương thức HTTP được phép
            allowedHeaders: ["Content-Type"], // Headers được phép
            credentials: true, // Cho phép sử dụng cookie nếu cần
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected');

        // Lắng nghe khi client ngắt kết nối
        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });

        // Ví dụ gửi sự kiện cho client
        socket.emit('welcome', 'Welcome to the WebSocket server');
    });

    console.log(`Socket.IO server is running on ws://localhost:${process.env.WS_PORT}`);

    // Kết nối Redis
    await connectToRedis();
    const chanelsubcribe = ['friend_requests'];

    // Đăng ký lắng nghe các kênh, ví dụ kênh 'friend_requests'
    subscribeToChannels(chanelsubcribe, (channel, message) => {
        console.log("Test change", message);

        // Gửi thông điệp đến tất cả client đang kết nối
        io.emit('new_message', { channel, message });
    });

    // Bắt đầu lắng nghe yêu cầu WebSocket trên cổng WS_PORT
    server.listen(process.env.WS_PORT, () => {
        console.log(`Server is listening on port ${process.env.WS_PORT}`);
    });
};

// Khởi động server
startSocketServer().catch(console.error);
