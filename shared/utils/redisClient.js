// ./services/websocket-service/redisClient.js
const redis = require('redis');

const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
});
const redisSubscriber = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
});


const connectToRedis = async () => {
    try {
        await redisClient.connect();
        await redisSubscriber.connect();
        console.log('Connected to Redis successfully');
    } catch (err) {
        console.error('Error connecting to Redis:', err);
    }
};

const subscribeToChannels = (channels, callback) => {
    if (!Array.isArray(channels)) {
        console.error('channels must be an array');
        return;
    }

    channels.forEach(channel => {
        redisSubscriber.subscribe(channel, (message) => {
            console.log(`Received message from channel ${channel}:`, message);
            callback(channel, message); // Gửi cả kênh và tin nhắn về callback
        });
    });

    console.log(`Subscribed to channels: ${channels.join(', ')}`);
};

const unsubscribeFromChannels = (channels) => {
    if (!Array.isArray(channels)) {
        console.error('channels must be an array');
        return;
    }

    channels.forEach(channel => {
        redisSubscriber.unsubscribe(channel);
    });

    console.log(`Unsubscribed from channels: ${channels.join(', ')}`);
};

module.exports = {
    connectToRedis,
    subscribeToChannels,
    unsubscribeFromChannels,
};
