// service-post/redis/publisher.js
const { redisClient, redisSubscriber, generateTaskId } = require("../shared/redis/redisClient");

const checkFriendship = async (userId, postOwnerId) => {
    const taskId = generateTaskId();  // Tạo task ID
    const message = { userId, postOwnerId, taskId };
    console.log(message)
    // Gửi yêu cầu kiểm tra bạn bè đến kênh Redis
    await redisClient.publish('friendCheckChannel', JSON.stringify(message));


    // Đảm bảo rằng redisSubscriber đang lắng nghe kênh 'friendCheckChannel'
    redisSubscriber.on('message', (channel, message) => {
        if (channel === 'friendCheckChannel') {
            console.log('Nhận thông điệp từ kênh friendCheckChannel:', message);
            // Bạn có thể kiểm tra thông điệp và thực hiện hành động tùy ý ở đây
        }
    });

    // Đăng ký kênh 'friendCheckChannel'
    await redisSubscriber.subscribe('friendCheckChannel');
}

module.exports = {
    checkFriendship
}