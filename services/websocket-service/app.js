const http = require('http');
const redis = require('redis');
const { connectToRedis } = require('./shared/redis/redisClient'); // Redis client
const createSocketServer = require('./untils/createSocketServer'); // Import the createSocketServer function
const subscribeToRedisChannels = require('./shared/redis/RedisChat.js'); // Import function to subscribe to Redis channels
require('dotenv').config();
const redisSubscriber = redis.createClient({
    url: 'redis://redis:6379'
});
// Create HTTP server
const createHttpServer = () => {
    const server = http.createServer();
    return server;
};
// Connect to Redis and subscribe to Redis channels
const startRedisConnection = async (io) => {
    try {
        await connectToRedis(); // Connect to Redis
        console.log('Connected to Redis');
        // Subscribe to Redis channels using subscribeToRedisChannels
        subscribeToRedisChannels(io, redisSubscriber);
    } catch (err) {
        console.error('Error connecting to Redis:', err);
    }
};
// Start HTTP, WebSocket, and Redis connection
const startServer = () => {
    const server = createHttpServer();
    const io = createSocketServer(server); // Create the WebSocket server
    // Start the HTTP server
    server.listen(process.env.WS_SERVICE_PORT, () => {
        console.log(`WebSocket server running on ws://localhost:${process.env.WS_SERVICE_PORT}`);
    });
    // Start Redis connection and subscribe to channels
    startRedisConnection(io);
};

// Start the server
startServer();
