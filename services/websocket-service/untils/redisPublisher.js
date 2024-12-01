const { createClient } = require('redis');

// Tạo client Redis để publish
const redisPublisher = createClient();

async function publishMessage(channelName, message) {
    try {
        // Kết nối tới Redis
        await redisPublisher.connect();

        // Gửi thông điệp tới kênh
        await redisPublisher.publish(channelName, message);
        console.log(`Đã gửi thông điệp: "${message}" tới kênh: "${channelName}"`);

        // Đóng kết nối sau khi hoàn thành (tùy theo trường hợp sử dụng)
        await redisPublisher.disconnect();
    } catch (err) {
        console.error('Có lỗi khi publish thông điệp:', err);
    }
}

// Xuất hàm
module.exports = { publishMessage };
