const { redisSubscriber } = require("./shared/redis/redisClient");
const listenForEvents = () => {
    redisSubscriber.subscribe('notifications', (message) => {
        try {
            const { userId } = JSON.parse(message);
            console.log(`Received check friends request for user ${userId}`);
        } catch (error) {
            console.error('Error processing check_friends_request:', error);
        }
    });
};
module.exports = {
    listenForEvents
};
