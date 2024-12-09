const { createDuplicateClient } = require("./shared/redis/redisClient");
const { updateFriends } = require("./shared/redis/redisHandler")
const { isFriendOf, getFriendIds } = require('./services/userService')
const redisClient = createDuplicateClient();
const redisSubscriber = createDuplicateClient();
const listenForEvents = () => {
    redisSubscriber.subscribe('friendship_status_request', async (message) => {
        try {
            const { idTask, userId, friendId } = JSON.parse(message);
            const isFriend = await isFriendOf(userId, friendId);
            console.log(`Received check friends request for user ${userId}`);
            const result = { idTask, isFriend };
            redisClient.publish(`${idTask}`, JSON.stringify(result));
        } catch (error) {
            console.error('Error processing check_friends_request:', error);
        }
    });
    redisSubscriber.subscribe('update_friendship', async (message) => {
        try {
            const { idTask, userId } = JSON.parse(message);
            const listFriend = await getFriendIds(userId)
            const updateFriend = await updateFriends(userId, listFriend);
            console.log(`Received check friends update request for user ${userId}:${updateFriend}`);
            const result = { idTask, updateFriend };
            redisClient.publish(`${idTask}`, JSON.stringify(result));
        } catch (error) {
            console.error('Error processing update_friendship:', error);
        }
    });

};
module.exports = {
    listenForEvents
};
