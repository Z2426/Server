// eventListener.js
const { redisSubscriber } = require("./shared/redis/redisClient");
// Hàm lắng nghe sự kiện và gọi hàm xử lý tương ứng
const listenForEvents = () => {
    // Đăng ký kênh sự kiện với Redis
    redisSubscriber.subscribe('notifications', (message) => {
        try {
            const { userId } = JSON.parse(message);
            console.log(`Received check friends request for user ${userId}`);


        } catch (error) {
            console.error('Error processing check_friends_request:', error);
        }
    });
};

// Export hàm listenForEvents để sử dụng
module.exports = {
    listenForEvents
};
