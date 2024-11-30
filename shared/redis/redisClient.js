const redis = require('redis');
const crypto = require('crypto');
const redisClient = redis.createClient({
    url: 'redis://redis:6379'
});
const redisSubscriber = redis.createClient({
    url: 'redis://redis:6379'
});
// Danh sách enum các action hợp lệ
const VALID_ACTIONS = ['embed_image', 'suggest_friend_by_image'];
// Kết nối taới Redis
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

// Function to connect to Redis and listen for events
// Hàm tạo task_id từ timestamp
function generateTaskId() {
    const randomValue = crypto.randomInt(1000, 9999); // Tạo số ngẫu nhiên từ 1000 đến 9999
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, ''); // Tạo timestamp không chứa ký tự đặc biệt
    return `task_${timestamp}_${randomValue}`; // Kết hợp timestamp và giá trị ngẫu nhiên
}

// Hàm gửi task vào hàng đợi
const sendTaskToQueueSuggestService = async (action, data) => {
    try {
        // Kiểm tra action hợp lệ
        if (!VALID_ACTIONS.includes(action)) {
            console.error(`Action không hợp lệ: ${action}`);
            return;
        }

        // Tạo task_id
        const task_id = generateTaskId();

        // Tạo task object
        const task = {
            task_id,
            action,
            data
        };

        // Chuyển đổi task thành chuỗi JSON và đẩy vào hàng đợi Redis
        await redisClient.rPush('task_queue_suggest_service', JSON.stringify(task));
        // Lắng nghe kết quả từ channel dựa trên task_id
        redisSubscriber.subscribe(task_id, (message) => {
            console.log(`Kết quả nhận được cho ${task_id}:`, message);
        });
        console.log(`Task ${task_id} đã được thêm vào hàng đợi thành công.`);
    } catch (error) {
        console.error('Lỗi khi gửi task vào hàng đợi:', error);
    }
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
const scanForChannels = async (redisSubscriber, pattern, callback) => {
    let cursor = '0';
    let channels = [];

    try {
        do {
            // Quét Redis theo mẫu pattern
            const [nextCursor, foundChannels] = await redisSubscriber.scan(cursor, 'MATCH', pattern);

            cursor = nextCursor;

            // Kiểm tra nếu foundChannels là một mảng hợp lệ
            if (Array.isArray(foundChannels)) {
                channels.push(...foundChannels);
            } else {
                console.error('Expected foundChannels to be an array, but got:', foundChannels);
            }
        } while (cursor !== '0');  // Quét đến khi cursor trở về '0'

        // Kiểm tra nếu có kênh nào đã được tìm thấy
        if (channels.length > 0) {
            await subscribeToChannels(channels, callback); // Đăng ký các kênh
        } else {
            console.log(`No channels matched the pattern: ${pattern}`);
        }

        // Gọi callback nếu có
        if (callback) callback(channels);
    } catch (error) {
        console.error('Error during Redis scan or subscription:', error);
    }
};

// Subscribe to Redis channels (with parallel subscription)
const subscribeToChannels = async (channels, callback) => {
    if (!Array.isArray(channels)) {
        console.error('channels must be an array');
        return;
    }

    try {
        // Đăng ký tất cả các kênh đồng thời
        await Promise.all(channels.map(channel =>
            redisSubscriber.subscribe(channel, (message) => {
                try {
                    console.log(`Received message from channel ${channel}:`, message);
                    callback(channel, message); // Gửi kênh và thông điệp về callback
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
    generateTaskId,
    scanForChannels,
    sendTaskToQueueSuggestService
};
