const { Server } = require("socket.io");
const {
    addUserSocket,
    removeUserSocket,
    setUserStatus,
    addUserToGroup,
    removeUserFromGroup,
    getUsersInGroup,
    getUserSockets,
    updateUserInterest,
    getUserTopTopics
} = require("../shared/redis/redisHandler");

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

        // Xử lý sự kiện khi người dùng online
        socket.on("userOnline", async ({ userId }) => {
            if (!userId) {
                console.error("userOnline event received without userId");
                return;
            }
            try {
                socket.userId = userId;
                await addUserSocket(userId, socket.id); // Lưu socket.id vào Redis
                await setUserStatus(userId, "online");
                console.log(`User ${userId} is now online.`);
            } catch (error) {
                console.error("Error in userOnline:", error);
            }
        });
        // Lắng nghe sự kiện "user_interaction" từ frontend
        socket.on('user_interaction', async (data) => {
            const { user_id, post_id, post_category, action } = data;
            console.log(`Received interaction from User ${user_id} on Post ${post_id} (Category: ${post_category}) with Action: ${action}`);
            // Gọi hàm để cập nhật điểm quan tâm vào Redis
            updateUserInterest(user_id, post_id, post_category, action);
            console.log(await getUserTopTopics('1'))

        });


        // Xử lý người dùng tham gia nhóm
        socket.on("joinGroup", async ({ userId, groupId }) => {
            if (!userId || !groupId) {
                console.error("joinGroup event received with missing userId or groupId");
                return;
            }
            try {
                console.log(`User ${userId} joining group ${groupId}`);
                await addUserToGroup(userId, groupId); // Thêm vào nhóm Redis
                socket.join(groupId); // Tham gia room
                console.log(`User ${userId} joined group ${groupId}`);
            } catch (error) {
                console.error("Error in joinGroup:", error);
            }
        });

        // Xử lý người dùng gửi tin nhắn
        socket.on("sendMessage", async (data) => {
            try {
                const { idConversation, message } = data;

                if (!idConversation || !message) {
                    console.error("Missing idConversation or message in sendMessage event");
                    return;
                }

                // Kiểm tra socket có ở trong nhóm hay không
                if (socket.rooms.has(idConversation)) {
                    // Phát tin nhắn tới các thành viên trong nhóm (trừ socket gửi)
                    socket.to(idConversation).emit("receiveMessage", { message });
                    console.log(`Message sent to room ${idConversation}:`, message);
                } else {
                    console.error(`Socket ${socket.id} is not in room ${idConversation}`);
                }
            } catch (error) {
                console.error("Error in sendMessage:", error);
            }
        });

        // Xử lý người dùng rời nhóm
        socket.on("leaveGroup", async ({ userId, groupId }) => {
            if (!userId || !groupId) {
                console.error("leaveGroup event received with missing userId or groupId");
                return;
            }
            try {
                console.log(`User ${userId} leaving group ${groupId}`);
                await removeUserFromGroup(userId, groupId); // Xóa khỏi nhóm Redis
                socket.leave(groupId); // Rời room
                console.log(`User ${userId} left group ${groupId}`);
            } catch (error) {
                console.error("Error in leaveGroup:", error);
            }
        });

        // Xử lý khi người dùng ngắt kết nối
        socket.on("disconnect", async () => {
            console.log(`Client disconnected with id: ${socket.id}`);
            const userId = socket.userId;

            try {
                if (userId) {
                    await removeUserSocket(userId, socket.id); // Xóa socket khỏi Redis
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
