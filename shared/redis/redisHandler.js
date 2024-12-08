//const { redisClient } = require("../../shared/redis/redisClient");
const { createDuplicateClient } = require("../../shared/redis/redisClient");
const redisClient = createDuplicateClient();
const getFriendsList = async (userId) => {
    const redisKey = `user:${userId}:friends`;
    try {
        const exists = await redisClient.exists(redisKey);
        if (exists) {
            const friendsList = await redisClient.sMembers(redisKey);
            //console.log(`The friends list for ${userId}:`, friendsList);
            return friendsList;
        } else {
            //console.log(`No friends list found for ${userId}.`);
            return [];
        }
    } catch (error) {
        console.error('Error fetching the friends list:', error);
        return [];
    }
};
const checkFriendsExist = async (userId) => {
    const redisKey = `user:${userId}:friends`;
    try {
        const exists = await redisClient.exists(redisKey);
        if (exists) {
            // console.log(`The friends list for ${userId} exists.`);
            return true;
        } else {
            console.log(`The friends list for ${userId} does not exist.`);
            return false;
        }
    } catch (error) {
        console.error('Error checking the existence of the friends list:', error);
        return false;
    }
};
const updateFriends = async (userId, friendsList) => {
    const redisKey = `user:${userId}:friends`;
    const expiration = 600;
    if (!Array.isArray(friendsList) || friendsList.length === 0) {
        console.log('The friends list is not valid!');
        return;
    }
    const validFriendsList = friendsList.map(friend => String(friend));
    //console.log(validFriendsList);
    try {
        await redisClient.del(redisKey);
        const multi = redisClient.multi();
        validFriendsList.forEach(friend => {
            multi.sAdd(redisKey, friend);
        });
        await multi.exec();
        await redisClient.expire(redisKey, expiration);
        //console.log(`The friends list for ${userId} has been saved to Redis with TTL of ${expiration} seconds.`);
    } catch (error) {
        console.error('Error saving the friends list to Redis:', error);
    }
};

const setUserStatus = async (userId, status) => {
    const key = `user:${userId}:status`;
    const expiration = 3600;

    try {
        await redisClient.set(key, status, { EX: expiration });
        console.log(`Status '${status}' has been saved for user ${userId}.`);
    } catch (error) {
        console.error('Error saving status:', error);
    }
};

const addUserSocket = async (userId, socketId) => {
    try {
        await redisClient.sAdd(`user:${userId}:sockets`, socketId);
        console.log(`Socket ID ${socketId} added for user ${userId}`);
    } catch (error) {
        console.error("Error adding socket ID to Redis:", error);
    }
};

const removeUserSocket = async (userId, socketId) => {
    try {
        await redisClient.sRem(`user:${userId}:sockets`, socketId);
        console.log(`Socket ID ${socketId} removed for user ${userId}`);
        const remainingSockets = await redisClient.sCard(`user:${userId}:sockets`);
        if (remainingSockets === 0) {
            await setUserStatus(userId, 'offline');
        }
    } catch (error) {
        console.error("Error removing socket ID from Redis:", error);
    }
};

const getUserSockets = async (userId) => {
    try {
        return await redisClient.sMembers(`user:${userId}:sockets`);
    } catch (error) {
        console.error("Error fetching user sockets:", error);
        return [];
    }
};

const addUserToGroup = async (userId, groupId) => {
    try {
        await redisClient.sAdd(`group:${groupId}:users`, userId);
        console.log(`User ${userId} added to group ${groupId}`);
    } catch (error) {
        console.error("Error adding user to group:", error);
    }
};

const removeUserFromGroup = async (userId, groupId) => {
    try {
        await redisClient.sRem(`group:${groupId}:users`, userId);
        console.log(`User ${userId} removed from group ${groupId}`);
    } catch (error) {
        console.error("Error removing user from group:", error);
    }
};

const getUsersInGroup = async (groupId) => {
    try {
        return await redisClient.sMembers(`group:${groupId}:users`);
    } catch (error) {
        console.error("Error fetching users in group:", error);
        return [];
    }
};


module.exports = {
    addUserSocket,
    removeUserSocket,
    getUserSockets,
    setUserStatus,
    addUserToGroup,
    removeUserFromGroup,
    getUsersInGroup,
    updateFriends,
    checkFriendsExist,
    getFriendsList


};
