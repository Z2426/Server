const redis = require('redis');

const scanForChannels = async (redisSubscriber, pattern, callback) => {
    let cursor = '0';
    let channels = [];
    do {
        // SCAN Redis để tìm các kênh phù hợp với pattern
        const [newCursor, keys] = await new Promise((resolve, reject) => {
            redisSubscriber.scan(cursor, 'MATCH', pattern, 'COUNT', 100, (err, res) => {
                if (err) reject(err);
                resolve(res);
            });
        });

        cursor = newCursor;
        channels = channels.concat(keys); // Thêm các kênh tìm được vào danh sách

    } while (cursor !== '0');  // Quay lại khi SCAN hoàn tất

    // Đăng ký vào tất cả kênh tìm được
    channels.forEach(channel => {
        redisSubscriber.subscribe(channel, (err, count) => {
            if (err) {
                console.error(`Error subscribing to ${channel}:`, err);
            } else {
                console.log(`Successfully subscribed to ${channel}`);
            }
        });
    });

    // Callback sau khi đăng ký
    callback(channels);
};

const subscribeToRedisChannels = async (io, redisSubscriber) => {
    try {
        // Lắng nghe sự kiện "message" từ Redis
        redisSubscriber.on("message", (channel, message) => {
            const parsedMessage = JSON.parse(message);

            // Xử lý thông điệp theo kênh
            if (channel.startsWith("user:")) {
                const userId = channel.split(":")[1];
                io.to(userId).emit("receivePersonalMessage", parsedMessage);
            } else if (channel.startsWith("group:")) {
                const [_, groupId, memberId] = channel.split(":");
                io.to(memberId).emit("receiveGroupMessage", parsedMessage);
            } else if (channel === "user_status") {
                const { userId, status } = parsedMessage;
                io.emit("userStatusUpdate", { userId, status });
            } else if (channel === "new_group_message") {
                const { groupId, messageData } = parsedMessage;
                io.to(`group:${groupId}`).emit("newGroupMessage", messageData);
            }
        });

        // Mô phỏng psubscribe với các pattern động
        await scanForChannels(redisSubscriber, 'user:*', (channels) => {
            console.log(`Subscribed to user channels: ${channels}`);
        });

        await scanForChannels(redisSubscriber, 'group:*', (channels) => {
            console.log(`Subscribed to group channels: ${channels}`);
        });

        await scanForChannels(redisSubscriber, 'new_group_message', (channels) => {
            console.log(`Subscribed to new_group_message channel`);
        });

        await scanForChannels(redisSubscriber, 'user_status', (channels) => {
            console.log(`Subscribed to user_status channel`);
        });

        console.log('Successfully subscribed to Redis channels');
    } catch (error) {
        console.error('Error subscribing to Redis channels:', error);
    }
};

module.exports = subscribeToRedisChannels;
