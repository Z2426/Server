
const subscribeToRedisChannels = async (io, redisSubscriber) => {
    try {
        // Kết nối Redis
        await redisSubscriber.connect();
        console.log("Redis subscriber connected.");

        // Lắng nghe sự kiện 'message'
        redisSubscriber.on("message", (channel, message) => {
            try {
                const parsedMessage = JSON.parse(message); // Thử phân tích cú pháp JSON
                console.log(`Received message on channel ${channel}:`, parsedMessage);

                // Xử lý tin nhắn dựa trên kênh
                if (channel.startsWith("chatuser:")) {
                    const userId = channel.split(":")[1];
                    console.log("test chat person")
                    io.to(userId).emit("receivePersonalMessage", parsedMessage);
                } else if (channel.startsWith("chatgroup:")) {
                    const [_, groupId, memberId] = channel.split(":");
                    io.to(memberId).emit("receiveGroupMessage", parsedMessage);
                } else if (channel === "user_status") {
                    const { userId, status } = parsedMessage;
                    io.emit("userStatusUpdate", { userId, status });
                } else if (channel === "new_group_message") {
                    const { groupId, messageData } = parsedMessage;
                    io.to(`group:${groupId}`).emit("newGroupMessage", messageData);
                }
            } catch (error) {
                console.error(`Error processing message for channel ${channel}:`, error);
            }
        });

        // Subscribe các kênh Redis sau khi kết nối thành công
        await redisSubscriber.subscribe('user:*', (message) => {
            console.log(`Subscribed to user channels: ${message}`);
        });

        await redisSubscriber.subscribe('group:*', (message) => {
            console.log(`Subscribed to group channels: ${message}`);
        });

        await redisSubscriber.subscribe('new_group_message', (message) => {
            console.log(`Subscribed to new_group_message channel: ${message}`);
        });

        await redisSubscriber.subscribe('user_status', (message) => {
            console.log(`Subscribed to user_status channel: ${message}`);
        });

        console.log("Successfully subscribed to Redis channels");
    } catch (error) {
        console.error('Error connecting to Redis or subscribing to channels:', error);
    }
};

module.exports = subscribeToRedisChannels;
