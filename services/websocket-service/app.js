const http = require('http');
const { Server } = require('socket.io');
const { connectToRedis, redisSubscriber } = require('./shared/redis/redisClient'); // Redis client kết nối
const subscribeToRedisChannels = require('./shared/redis/RedisChat'); // Hàm đăng ký lắng nghe Redis channels
require('dotenv').config();
// Khởi tạo HTTP server
const createHttpServer = () => {
    const server = http.createServer();
    return server;
};
// Khởi tạo WebSocket server
const createSocketServer = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_PORT || "*",  // Cho phép kết nối từ frontend URL, hoặc tất cả nếu không có
            methods: ["GET", "POST"],
            allowedHeaders: ["Content-Type"],
            credentials: true // Cung cấp cookie nếu cần
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected with id: ${socket.id}`);

        // Lắng nghe khi client ngắt kết nối
        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });

        // Lắng nghe các sự kiện khác từ client nếu cần (ví dụ: gửi tin nhắn, nhận tin nhắn)
        socket.on('send_message', (messageData) => {
            // Xử lý gửi tin nhắn
            console.log(`Received message from ${socket.id}:`, messageData);
        });
    });

    return io;
};

// Khởi tạo Redis và đăng ký lắng nghe các kênh
const startRedisConnection = async (io) => {
    try {
        await connectToRedis(); // Kết nối Redis
        console.log('Connected to Redis');

        // Sau khi kết nối thành công, đăng ký lắng nghe các kênh Redis
        subscribeToRedisChannels(io, redisSubscriber);
    } catch (err) {
        console.error('Error connecting to Redis:', err);
    }
};

// Khởi động HTTP và WebSocket server
const startServer = () => {
    const server = createHttpServer();

    const io = createSocketServer(server);

    // Khởi động WebSocket server
    server.listen(process.env.WS_SERVICE_PORT, () => {
        console.log(`WebSocket server running on ws://localhost:${process.env.WS_SERVICE_PORT}`);
    });

    // Kết nối Redis và đăng ký lắng nghe các kênh
    startRedisConnection(io);
};

// Bắt đầu khởi động server
startServer();
