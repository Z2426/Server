const { connectToRedis, redisClient, redisSubscriber } = require("./shared/redis/redisClient");

const initRedis = async () => {
    try {
        // Kết nối Redis
        // await connectToRedis();

        // Kiểm tra kết nối thành công
        redisClient.on('connect', () => {
            console.log('Connected to Redis');
        });

        redisClient.on('error', (err) => {
            console.error('Redis connection error:', err);
        });

        // Gửi thông điệp vào Redis khi kết nối thành công
        redisClient.publish('friendCheckChannel', JSON.stringify({ userId: 123, action: 'check_friend' }));
        console.log('Message published to friendCheckChannel');
    } catch (error) {
        console.error('Error connecting to Redis or publishing message:', error);
    }
};

// Lắng nghe kênh 'friendCheckChannel'
redisSubscriber.on('message', (channel, message) => {
    if (channel === 'friendCheckChannel') {
        console.log('Received message from friendCheckChannel:', message);
    }
});

// Đăng ký kênh 'friendCheckChannel'
const subscribeToRedis = async () => {
    await redisSubscriber.subscribe('friendCheckChannel');
    console.log('Subscribed to friendCheckChannel');
};

// Gọi hàm khởi tạo Redis
initRedis();

// Đảm bảo đã đăng ký kênh Redis
subscribeToRedis();
