// service-user/redis/processor.js
const { redisSubscriber, redisClient } = require("../shared/redis/redisClient");
// Lắng nghe kênh Redis để nhận yêu cầu kiểm tra bạn bè
redisSubscriber.on('message', async (channel, message) => {
    console.log(`Nhận thông điệp từ kênh ${channel}:`, message);

    if (channel === 'friendCheckChannel') {
        const { userId, postOwnerId, taskId } = JSON.parse(message);
        console.log(`Đang kiểm tra bạn bè giữa ${userId} và ${postOwnerId}`);

        try {
            const isFriend = await checkIfFriend(userId, postOwnerId);  // Kiểm tra bạn bè

            // Gửi kết quả trả về vào kênh task_id
            redisPublisher.publish(taskId, JSON.stringify({ isFriend }));

            console.log(`Kết quả kiểm tra bạn bè giữa ${userId} và ${postOwnerId}: ${isFriend ? 'Là bạn' : 'Không phải bạn'}`);
        } catch (error) {
            console.error('Lỗi khi kiểm tra bạn bè:', error);
        }
    }
});

// Hàm kiểm tra bạn bè (giả định)
async function checkIfFriend(userId, postOwnerId) {
    // Logic kiểm tra bạn bè (truy vấn DB hoặc logic khác)
    return userId === postOwnerId;  // Giả sử là bạn bè nếu ID giống nhau
}
