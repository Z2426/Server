const { redisClient, connectToRedis } = require("../../shared/redis/redisClient");
connectToRedis()
// Cập nhật điểm quan tâm của người dùng vào Redis
const updateUserInterest = async (user_id, post_id, post_category, action) => {
    const action_points = {
        'Like': 3,
        'Xem': 1,
        'Comment': 5
    };

    const score = action_points[action] || 0;

    const key = `user:${user_id}:topics`;

    redisClient.zincrby(key, score, post_category, (err, res) => {
        if (err) {
            console.error('Error updating interest:', err);
        } else {
            console.log(`User ${user_id} updated interest in ${post_category} with score ${score}`);
        }
    });
}
// Lấy top 3 chủ đề quan tâm từ Redis
const getUserTopTopics = async (user_id) => {
    return new Promise((resolve, reject) => {
        const key = `user:${user_id}:topics`;

        redisClient.zrevrange(key, 0, 2, 'WITHSCORES', (err, res) => {
            if (err) {
                reject(err);
            } else {
                const top_topics = [];
                for (let i = 0; i < res.length; i += 2) {
                    top_topics.push(res[i]);  // Thêm chủ đề vào mảng
                }
                resolve(top_topics);
            }
        });
    });
}

// Lưu trạng thái người dùng (online/offline)
const setUserStatus = async (userId, status) => {
    const key = `user:${userId}:status`; // Tạo key
    const expiration = 3600; // TTL (thời gian sống) tính bằng giây, ví dụ 1 giờ

    try {
        await redisClient.set(key, status, { EX: expiration });
        console.log(`Đã lưu trạng thái '${status}' cho user ${userId}`);
    } catch (error) {
        console.error('Lỗi khi lưu trạng thái:', error);
    }
};

// Thêm socket ID vào danh sách kết nối của người dùng
const addUserSocket = async (userId, socketId) => {
    try {
        await redisClient.sAdd(`user:${userId}:sockets`, socketId); // Thêm socketId vào Redis
        console.log(`Socket ID ${socketId} added for user ${userId}`);
    } catch (error) {
        console.error("Error adding socket ID to Redis:", error);
    }
};

// Xóa socket ID khỏi danh sách kết nối của người dùng
const removeUserSocket = async (userId, socketId) => {
    try {
        await redisClient.sRem(`user:${userId}:sockets`, socketId); // Xóa socketId khỏi Redis
        console.log(`Socket ID ${socketId} removed for user ${userId}`);
        const remainingSockets = await redisClient.sCard(`user:${userId}:sockets`);
        if (remainingSockets === 0) {
            await setUserStatus(userId, 'offline');
        }
    } catch (error) {
        console.error("Error removing socket ID from Redis:", error);
    }
};

// Lấy tất cả socket ID của một người dùng
const getUserSockets = async (userId) => {
    try {
        return await redisClient.sMembers(`user:${userId}:sockets`);
    } catch (error) {
        console.error("Error fetching user sockets:", error);
        return [];
    }
};

// Thêm người dùng vào nhóm (room)
const addUserToGroup = async (userId, groupId) => {
    try {
        await redisClient.sAdd(`group:${groupId}:users`, userId);
        console.log(`User ${userId} added to group ${groupId}`);
    } catch (error) {
        console.error("Error adding user to group:", error);
    }
};

// Xóa người dùng khỏi nhóm (room)
const removeUserFromGroup = async (userId, groupId) => {
    try {
        await redisClient.sRem(`group:${groupId}:users`, userId);
        console.log(`User ${userId} removed from group ${groupId}`);
    } catch (error) {
        console.error("Error removing user from group:", error);
    }
};

// Lấy tất cả người dùng trong nhóm
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
    getUserTopTopics,
    updateUserInterest
};
