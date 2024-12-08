const { Server } = require("socket.io");
const {
    addUserSocket,
    removeUserSocket,
    setUserStatus,
    addUserToGroup,
    removeUserFromGroup,
    checkFriendsExist
} = require("../shared/redis/redisHandler");
const { redisSubscriber, sendMessageToRedis } = require("../shared/redis/redisClient");
const {
    connectToRedis, sendToQueue, generateTaskId
} = require("../shared/redis/redisClient");
connectToRedis()

const createSocketServer = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["Content-Type"],
            credentials: true,
        },
    });
    io.on("connection", (socket) => {
        console.log(`Client connected with id: ${socket.id}`);
        redisSubscriber.subscribe('notification', (message) => {
            try {
                const notification = JSON.parse(message);
                console.log(message)
                if (notification && notification.userId) {
                    io.to(notification.reciveId).emit("receiveNotification", notification);
                    //console.log(`Notification sent to user ${notification.userId}:`, notification.message);
                }
            } catch (error) {
                console.error('Error handling Redis message:', error);
            }
        });

        socket.on("userOnline", async ({ userId }) => {
            if (!userId) {
                console.error("userOnline event received without userId");
                return;
            }
            try {
                socket.userId = userId;
                await addUserSocket(userId, socket.id);
                await setUserStatus(userId, "online");
                console.log(`User ${userId} is now online.`);
                const updateFriend = await checkFriendsExist(userId)
                if (true) {
                    console.log("Gui su kien cpa nhat friend")
                    const isTask = generateTaskId();
                    await sendMessageToRedis("update_friendship", { isTask, userId })
                }
            } catch (error) {
                console.error("Error in userOnline:", error);
            }
        });
        socket.on('interactPost', async (data) => {
            try {
                console.log('Received interactpost:', data);
                if (!data.user_id || !data.friendId || !data.post_id || !data.post_category) {
                    console.error('Invalid data received:', data);
                    return;
                }
                const taskData = {
                    userId: data.user_id,
                    friendId: data.friendId,
                    postId: data.post_id,
                    postCategory: data.post_category,
                };
                await sendToQueue('process_post', 'handleUserInteraction', taskData);
            } catch (error) {
                console.error('Error processing interactpost:', error);
            }
        });
        socket.on("joinGroup", async ({ userId, groupId }) => {
            if (!userId || !groupId) {
                console.error("joinGroup event received with missing userId or groupId");
                return;
            }
            try {
                console.log(`User ${userId} joining group ${groupId}`);
                await addUserToGroup(userId, groupId);
                socket.join(groupId);
                console.log(`User ${userId} joined group ${groupId}`);
            } catch (error) {
                console.error("Error in joinGroup:", error);
            }
        });
        socket.on("sendMessage", async (data) => {
            try {
                const { idConversation, message } = data;

                if (!idConversation || !message) {
                    console.error("Missing idConversation or message in sendMessage event");
                    return;
                }
                if (socket.rooms.has(idConversation)) {
                    socket.to(idConversation).emit("receiveMessage", { message });
                    console.log(`Message sent to room ${idConversation}:`, message);
                } else {
                    console.error(`Socket ${socket.id} is not in room ${idConversation}`);
                }
            } catch (error) {
                console.error("Error in sendMessage:", error);
            }
        });
        socket.on("leaveGroup", async ({ userId, groupId }) => {
            if (!userId || !groupId) {
                console.error("leaveGroup event received with missing userId or groupId");
                return;
            }
            try {
                console.log(`User ${userId} leaving group ${groupId}`);
                await removeUserFromGroup(userId, groupId);
                socket.leave(groupId);
                console.log(`User ${userId} left group ${groupId}`);
            } catch (error) {
                console.error("Error in leaveGroup:", error);
            }
        });
        socket.on("disconnect", async () => {
            console.log(`Client disconnected with id: ${socket.id}`);
            const userId = socket.userId;

            try {
                if (userId) {
                    await removeUserSocket(userId, socket.id);
                    await setUserStatus(userId, "offline");
                    console.log(`User ${userId} is now offline.`);
                }
            } catch (error) {
                console.error("Error in disconnect:", error);
            }
        });
    });
    return io;
};

module.exports = createSocketServer;
