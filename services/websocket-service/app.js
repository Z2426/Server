const express = require('express');
const http = require('http');
const redis = require('redis');
const { connectToRedis, redisSubscriber } = require('./shared/redis/redisClient'); // Redis client
const createSocketServer = require('./untils/createSocketServer'); // Import the createSocketServer function
const subscribeToRedisChannels = require('./shared/redis/RedisChat.js'); // Import function to subscribe to Redis channels
require('dotenv').config();
const cors = require('cors');
// Tạo ứng dụng Express
const app = express();

// Cấu hình CORS
const corsOptions = {
    origin: "*",  // Cho phép mọi nguồn (cổng khác nhau)
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các phương thức được phép
    allowedHeaders: ['Content-Type', 'Authorization'], // Các header cho phép
};

// Sử dụng middleware CORS
app.use(cors(corsOptions));

// Tạo HTTP server
const createHttpServer = () => {
    return http.createServer(app);
};

// Tạo và kết nối Redis, subscribe các kênh Redis
const startRedisConnection = async (io) => {
    try {
        await connectToRedis(); // Connect to Redis
        console.log('Connected to Redis');
        // Subscribe to Redis channels using subscribeToRedisChannels
        // Đăng ký và lắng nghe sự kiện pmessage
        // Đăng ký kênh trước
        // redisSubscriber.pSubscribe("chatuser:*", (pattern, channel, message) => {
        //     console.log(`Received message on channel: ${channel} with pattern: ${pattern}`);

        //     try {
        //         if (message && message !== "undefined" && message !== "null") {
        //             const parsedMessage = JSON.parse(message); // Phân tích cú pháp JSON
        //             console.log("Parsed message:", parsedMessage);

        //             // Kiểm tra kênh và gửi tin nhắn
        //             if (pattern === "chatuser:*") {
        //                 const userId = channel.split(":")[1];
        //                 console.log(`Sending message to userId: ${userId}`);
        //                 io.to(userId).emit("receivePersonalMessage", parsedMessage);
        //             } else if (pattern === "chatgroup:*") {
        //                 const [_, groupId, memberId] = channel.split(":");
        //                 console.log(`Sending message to group ${groupId}, member ${memberId}`);
        //                 io.to(memberId).emit("receiveGroupMessage", parsedMessage);
        //             }
        //         } else {
        //             console.error("Received invalid message:", message);
        //         }
        //     } catch (error) {
        //         console.error(`Error processing message on channel ${channel}:`, error);
        //     }
        // });
        redisSubscriber.pSubscribe("chatuser:*", (message, channel) => {
            // console.log(`Pattern: ${pattern}`);  // Should log 'chatuser:*'
            console.log(`Channel: ${channel}`);  // Should log something like 'chatuser:60d5c5f4e0f8a7451b7eaf46'
            console.log(`Message: ${message}`);  // Should log the message sent to the channel

            try {
                if (message && message !== "undefined" && message !== "null") {
                    const parsedMessage = JSON.parse(message);  // Parse the message if it's valid JSON
                    console.log("Parsed message:", parsedMessage);
                    // Process the parsed message here
                    // Tiến hành xử lý tin nhắn sau khi phân tích
                    const userId = channel.split(":")[1];
                    io.to(userId).emit("receivePersonalMessage", parsedMessage);
                    console.log("đã  gửi tin nhắn" + userId)
                } else {
                    console.error("Received invalid message:", message);
                }
            } catch (error) {
                console.error("Error parsing message:", error);
            }
        });
        // Đăng ký lắng nghe mẫu kênh (pattern) "chatuser:*"
        // redisSubscriber.pSubscribe("chatuser:*", (pattern, channel, message) => {
        //     console.log(`Pattern: ${pattern}`);  // Đây sẽ là "chatuser:*"
        //     console.log(`Channel: ${channel}`);  // Đây sẽ là "chatuser:60d5c5f4e0f8a7451b7eaf46"
        //     console.log(`Message: ${message}`);  // Đây là tin nhắn bạn đã gửi đi, ví dụ: {"type": "personal", ...}
        //     console.log(`Received message on channel: ${channel} with pattern: ${pattern}`);
        //     console.log("Raw message:", message); // In thông báo gốc của message trước khi phân tích cú pháp

        //     try {
        //         if (message && message !== "undefined" && message !== "null") {
        //             const parsedMessage = JSON.parse(message);
        //             console.log("Parsed message:", parsedMessage);

        //             // Tiến hành xử lý tin nhắn sau khi phân tích
        //             const userId = channel.split(":")[1];
        //             io.to(userId).emit("receivePersonalMessage", parsedMessage);
        //         } else {
        //             console.error("Received invalid message:", message);
        //         }
        //     } catch (error) {
        //         console.error("Error parsing message:", error);
        //     }
        // });



        //subscribeToRedisChannels(io, redisSubscriber);
    } catch (err) {
        console.error('Error connecting to Redis:', err);
    }
};

// Start HTTP, WebSocket và Redis connection
const startServer = () => {
    const server = createHttpServer(); // Tạo HTTP server từ Express
    const io = createSocketServer(server); // Tạo WebSocket server từ HTTP server

    // Start HTTP server
    server.listen(process.env.WS_SERVICE_PORT, () => {
        console.log(`WebSocket server running on ws://localhost:${process.env.WS_SERVICE_PORT}`);
    });

    // Kết nối Redis và subscribe các kênh
    startRedisConnection(io);
};

// Start server
startServer();
