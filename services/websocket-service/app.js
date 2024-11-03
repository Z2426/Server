// ./services/websocket-service/socketServer.js
const WebSocket = require('ws');
const { connectToRedis, subscribeToChannels } = require('./shared/utils/redisClient');

const startSocketServer = async () => {
    const wss = new WebSocket.Server({ port: process.env.WS_PORT });

    // Khi có client kết nối
    wss.on('connection', (ws) => {
        console.log('Client connected');

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });

    console.log(`WebSocket server is running on ws://localhost:${process.env.WS_PORT}`);

    await connectToRedis();

    // Đăng ký lắng nghe các kênh, bao gồm cả 'friend_requests'
    subscribeToChannels(['friend_requests'], (channel, message) => {
        // Gửi thông điệp đến tất cả client đang kết nối
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(`Channel: ${channel}, Message: ${message}`);
            }
        });
    });
};

// Khởi động server
startSocketServer().catch(console.error);
