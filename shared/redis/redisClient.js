const redis = require('redis');

const redisClient = redis.createClient({
    url: 'redis://redis:6379'
});
const redisSubscriber = redis.createClient({
    url: 'redis://redis:6379'
});

// Kết nối tới Redis
const connectToRedis = async () => {
    try {
        // Chờ Redis client và subscriber kết nối
        await redisClient.connect();
        await redisSubscriber.connect();
        console.log('Connected to Redis successfully');
    } catch (err) {
        console.error('Error connecting to Redis:', err);
    }
};

// Đăng ký lắng nghe các kênh Redis
const subscribeToChannels = async (channels, callback) => {
    if (!Array.isArray(channels)) {
        console.error('channels must be an array');
        return;
    }

    for (const channel of channels) {
        // Đảm bảo rằng subscribe được thực hiện đúng sau khi kết nối
        await redisSubscriber.subscribe(channel, (message) => {
            console.log(`Received message from channel ${channel}:`, message);
            callback(channel, message); // Gửi kênh và thông điệp về callback
        });
    }

    console.log(`Subscribed to channels: ${channels.join(', ')}`);
};

// Hủy đăng ký khỏi các kênh Redis
const unsubscribeFromChannels = async (channels) => {
    if (!Array.isArray(channels)) {
        console.error('channels must be an array');
        return;
    }

    for (const channel of channels) {
        await redisSubscriber.unsubscribe(channel);
    }

    console.log(`Unsubscribed from channels: ${channels.join(', ')}`);
};

// Gửi thông điệp vào Redis
const sendMessageToRedis = (channel, message) => {
    redisClient.publish(channel, message, (err, result) => {
        if (err) {
            console.error("Error sending message to Redis:", err);
        } else {
            console.log(`Message sent to channel ${channel}: ${message}`);
        }
    });
};

// Hàm kiểm tra kết nối
const checkRedisConnection = async () => {
    try {
        const info = await redisClient.info(); // Kiểm tra thông tin kết nối
        console.log("Redis info:", info);
    } catch (err) {
        console.error("Error checking Redis connection:", err);
    }
};

// Hàm ngắt kết nối Redis khi không còn cần thiết
const disconnectFromRedis = async () => {
    try {
        await redisClient.quit();
        await redisSubscriber.quit();
        console.log('Disconnected from Redis');
    } catch (err) {
        console.error('Error disconnecting from Redis:', err);
    }
};

// Xuất các hàm
module.exports = {
    connectToRedis,
    subscribeToChannels,
    unsubscribeFromChannels,
    sendMessageToRedis,
    checkRedisConnection,
    disconnectFromRedis,
    redisClient,
    redisSubscriber,
};
