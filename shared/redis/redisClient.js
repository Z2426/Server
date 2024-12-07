const redis = require('redis');
const crypto = require('crypto');
const redisClient = redis.createClient({
    url: 'redis://redis:6379'
});
const redisSubscriber = redis.createClient({
    url: 'redis://redis:6379'
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
const createDuplicateClient = () => {
    const duplicatedClient = redisClient.duplicate();
    duplicatedClient.connect();
    return duplicatedClient;
};
const subscribeAndListen = async (channel) => {
    return new Promise((resolve, reject) => {
        redisSubscriber.subscribe(channel, (err) => {
            if (err) {
                return reject(`Error subscribing to channel ${channel}: ${err}`);
            }
            console.log(`Successfully subscribed to channel: ${channel}`);
        });
        redisSubscriber.on('message', (receivedChannel, message) => {
            if (receivedChannel === channel) {
                try {
                    console.log('Received raw message:', message);
                    const data = JSON.parse(message);
                    console.log('Parsed message:', data);
                    resolve(data);
                } catch (error) {
                    reject(`Error processing message: ${error}`);
                }
            }
        });
        redisSubscriber.on('error', (err) => {
            reject(`Redis error: ${err}`);
        });
    });
};
function generateTaskId() {
    const randomValue = crypto.randomInt(1000, 9999);
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    return `task_${timestamp}_${randomValue}`;
}
const sendToQueue = async (queueName, action, data) => {
    try {
        console.log("Starting to add task to queue:", queueName);
        const task_id = generateTaskId();
        const task = {
            task_id,
            action,
            data
        };
        await redisClient.rPush(queueName, JSON.stringify(task));
        console.log(`Task with ID: ${task_id} has been successfully added to the queue: ${queueName}.`);
    } catch (error) {
        console.error('Error while sending task to queue:', error);
    }
};

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
const sendMessageToRedis = async (channel, message) => {
    const messageStr = JSON.stringify(message);
    redisClient.publish(channel, messageStr, (err, result) => {
        if (err) {
            console.error("Error sending message to Redis:", err);
        } else {
            console.log(`Message sent to channel ${channel}: ${messageStr}`);
        }
    });
};
const checkRedisConnection = async () => {
    try {
        const info = await redisClient.info();
        console.log("Redis info:", info);
    } catch (err) {
        console.error("Error checking Redis connection:", err);
    }
};
const disconnectFromRedis = async () => {
    try {
        await redisClient.quit();
        await redisSubscriber.quit();
        console.log('Disconnected from Redis');
    } catch (err) {
        console.error('Error disconnecting from Redis:', err);
    }
};
const getValueSubscribe = async (channel) => {
    return new Promise((resolve, reject) => {
        if (typeof channel !== 'string') {
            console.error('channel must be a string');
            reject('Invalid channel');
            return;
        }
        redisSubscriber.subscribe(channel, (message) => {
            try {
                console.log(`Received message from channel ${channel}:`, message);
                resolve(message);
            } catch (callbackError) {
                console.error(`Error processing message from channel ${channel}:`, callbackError);
                reject(callbackError);
            }
        });
    });
};
const subscribeToChannels = async (channels, callback) => {
    if (!Array.isArray(channels)) {
        console.error('channels must be an array');
        return;
    }
    try {
        await Promise.all(channels.map(channel =>
            redisSubscriber.subscribe(channel, (message) => {
                try {
                    console.log(`Received message from channel ${channel}:`, message);
                    callback(channel, message);
                } catch (callbackError) {
                    console.error(`Error processing message from channel ${channel}:`, callbackError);
                }
            })
        ));

        console.log(`Successfully subscribed to channels: ${channels.join(', ')}`);
    } catch (err) {
        console.error('Error during Redis subscribe:', err);
    }
};

module.exports = {
    connectToRedis,
    subscribeToChannels,
    unsubscribeFromChannels,
    sendMessageToRedis,
    checkRedisConnection,
    disconnectFromRedis,
    redisClient,
    redisSubscriber,
    generateTaskId,
    subscribeAndListen,
    getValueSubscribe,
    sendToQueue,
    createDuplicateClient

};
