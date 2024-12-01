// eventListener.js
const { redisSubscriber, redisClient } = require("./shared/redis/redisClient");
const { isFriendOf } = require('./services/userService')
// Hàm lắng nghe sự kiện và gọi hàm xử lý tương ứng
const listenForEvents = () => {
    // Đăng ký kênh sự kiện với Redis
    redisSubscriber.subscribe('friendship_status_request', async (message) => {
        try {
            const { idTask, userId, friendId } = JSON.parse(message);
            const isFriend = await isFriendOf(userId, friendId);
            console.log(isFriend)
            console.log(`Received check friends request for user ${userId}`);
            const result = { idTask, isFriend };
            redisClient.publish(`${idTask}`, JSON.stringify(result));
        } catch (error) {
            console.error('Error processing check_friends_request:', error);
        }
    });
};

// Export hàm listenForEvents để sử dụng
module.exports = {
    listenForEvents
};
