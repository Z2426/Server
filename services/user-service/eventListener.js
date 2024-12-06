const { createDuplicateClient } = require("./shared/redis/redisClient");
const { isFriendOf } = require('./services/userService')
const redisClient = createDuplicateClient();
const redisSubscriber = createDuplicateClient();
const listenForEvents = () => {
    redisSubscriber.subscribe('friendship_status_request', async (message) => {
        try {
            const { idTask, userId, friendId } = JSON.parse(message);
            const isFriend = await isFriendOf(userId, friendId);
            console.log(`Received check friends request for user ${userId}:${isFriend}`);
            const result = { idTask, isFriend };
            redisClient.publish(`${idTask}`, JSON.stringify(result));
        } catch (error) {
            console.error('Error processing check_friends_request:', error);
        }
    });
};
module.exports = {
    listenForEvents
};
