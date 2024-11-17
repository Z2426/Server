const subscribeToRedisChannels = async (io, redisSubscriber) => {
    try {
        // Kết nối Redis Subscriber
        await redisSubscriber.connect();
        console.log("Redis subscriber connected.", Date.now());

        // // Lắng nghe sự kiện 'message' cho các kênh cụ thể (SUBSCRIBE)
        // redisSubscriber.on("message", (channel, message) => {
        //     try {
        //         const parsedMessage = JSON.parse(message);
        //         console.log(`Received message on channel ${channel}:`, parsedMessage);

        //         // Xử lý theo kênh
        //         if (channel === "user_status") {
        //             const { userId, status } = parsedMessage;
        //             io.emit("userStatusUpdate", { userId, status });
        //         } else if (channel === "new_group_message") {
        //             const { groupId, messageData } = parsedMessage;
        //             io.to(`group:${groupId}`).emit("newGroupMessage", messageData);
        //         }
        //     } catch (error) {
        //         console.error(`Error processing message on channel ${channel}:`, error);
        //     }
        // });

        // redisSubscriber.on("pmessage", (pattern, channel, message) => {
        //     console.log(`Received message on channel: ${channel} with pattern: ${pattern}`);
        //     try {
        //         const parsedMessage = JSON.parse(message); // Phân tích cú pháp JSON
        //         console.log("Parsed message:", parsedMessage);

        //         if (pattern === "chatuser:*") {
        //             const userId = channel.split(":")[1];
        //             console.log(`Sending message to userId: ${userId}`);
        //             io.to(userId).emit("receivePersonalMessage", parsedMessage);
        //         } else if (pattern === "chatgroup:*") {
        //             const [_, groupId, memberId] = channel.split(":");
        //             console.log(`Sending message to group ${groupId}, member ${memberId}`);
        //             io.to(memberId).emit("receiveGroupMessage", parsedMessage);
        //         }
        //     } catch (error) {
        //         console.error(`Error processing message for channel ${channel}:`, error);
        //     }
        // });
        // redisSubscriber.on("pmessage", (pattern, channel, message) => {
        //     console.log(`Pattern: ${pattern}, Channel: ${channel}, Message: ${message}`);
        //     try {
        //         const parsedMessage = JSON.parse(message);
        //         console.log("Parsed message:", parsedMessage);
        //         // Xử lý tiếp theo
        //     } catch (error) {
        //         console.error("Error parsing message:", error);
        //     }
        // });

        // Đăng ký các kênh cụ thể
        await redisSubscriber.subscribe("user_status");
        console.log("Subscribed to user_status channel");

        await redisSubscriber.subscribe("new_group_message");
        console.log("Subscribed to new_group_message channel");

        // Đăng ký các mẫu kênh
        await redisSubscriber.pSubscribe("chatuser:*");
        console.log("Subscribed to chatuser:* channels");

        await redisSubscriber.pSubscribe("chatgroup:*");
        console.log("Subscribed to chatgroup:* channels");

        console.log("Successfully subscribed to Redis channels");
    } catch (error) {
        console.error("Error connecting to Redis or subscribing to channels:", error);
    }
};

// const subscribeToRedisChannels = async (io, redisSubscriber) => {
//     try {
//         // Kết nối Redis
//         await redisSubscriber.connect();
//         console.log("Redis subscriber connected.", Date.now());

//         // Lắng nghe sự kiện 'message'
//         redisSubscriber.on("message", (channel, message) => {
//             try {
//                 const parsedMessage = JSON.parse(message); // Thử phân tích cú pháp JSON
//                 console.log(`Received message on channel ${channel}:`, parsedMessage);

//                 // Xử lý tin nhắn dựa trên kênh
//                 if (channel.startsWith("chatuser:")) {
//                     const userId = channel.split(":")[1];
//                     console.log("test chat person")
//                     io.to(userId).emit("receivePersonalMessage", parsedMessage);
//                 } else if (channel.startsWith("chatgroup:")) {
//                     const [_, groupId, memberId] = channel.split(":");
//                     io.to(memberId).emit("receiveGroupMessage", parsedMessage);
//                 } else if (channel === "user_status") {
//                     const { userId, status } = parsedMessage;
//                     io.emit("userStatusUpdate", { userId, status });
//                 } else if (channel === "new_group_message") {
//                     const { groupId, messageData } = parsedMessage;
//                     io.to(`group:${groupId}`).emit("newGroupMessage", messageData);
//                 }
//             } catch (error) {
//                 console.error(`Error processing message for channel ${channel}:`, error);
//             }
//         });

//         // Subscribe các kênh Redis sau khi kết nối thành công
//         await redisSubscriber.subscribe('chatuser:*', (message) => {
//             console.log(`Subscribed to user channels: ${message}`);
//         });

//         await redisSubscriber.subscribe('chatgroup:*', (message) => {
//             console.log(`Subscribed to group channels: ${message}`);
//         });

//         await redisSubscriber.subscribe('new_group_message', (message) => {
//             console.log(`Subscribed to new_group_message channel: ${message}`);
//         });

//         await redisSubscriber.subscribe('user_status', (message) => {
//             console.log(`Subscribed to user_status channel: ${message}`);
//         });

//         console.log("Successfully subscribed to Redis channels");
//     } catch (error) {
//         console.error('Error connecting to Redis or subscribing to channels:', error);
//     }
// };

module.exports = subscribeToRedisChannels;
