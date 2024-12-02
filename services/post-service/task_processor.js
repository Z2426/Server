const { redisClient, redisSubscriber, connectToRedis, sendMessageToRedis } = require("./shared/redis/redisClient");
const { handleUserInteraction } = require("./shared/redis/interactionAndWeightCalculator");
const { markPostAsViewed } = require("./services/postService")
// Tạo Redis Publisher (client dùng để push dữ liệu vào hàng đợi)
const publisher = redisClient.duplicate();
// Tạo Redis Subscriber (client dùng để lắng nghe hàng đợi)
const subscriber = redisClient.duplicate();
// Hàm xử lý task từ hàng đợi
const processTaskFromQueue = async () => {
    try {
        console.log('Worker đã sẵn sàng để xử lý các task từ hàng đợi.');

        // Lắng nghe hàng đợi "process_post" để xử lý task
        subscriber.on('message', async (channel, message) => {
            try {
                const task = JSON.parse(message);  // Chuyển đổi chuỗi JSON thành đối tượng
                console.log(`Nhận task từ hàng đợi: ${task.task_id}`);

                let retries = 3;
                let success = false;

                while (retries > 0 && !success) {
                    try {
                        // Xử lý task tùy theo action
                        if (task.action === 'handleUserInteraction') {
                            await markPostAsViewed(task.data.postId, task.data.userId);
                            await handleUserInteraction(
                                task.data.userId,
                                task.data.friendId,
                                task.data.postId,
                                task.data.postCategory,
                                task.action
                            );
                            success = true;
                        }
                    } catch (error) {
                        console.error('Lỗi khi xử lý task:', error);
                        retries--;
                        if (retries > 0) {
                            console.log(`Thử lại lần ${4 - retries}...`);
                            await new Promise(resolve => setTimeout(resolve, 2000));  // Đợi 2 giây trước khi thử lại
                        } else {
                            console.log('Retry đã hết, đưa task vào hàng đợi lỗi.');
                            await redisClient.rpush('error_queue', JSON.stringify(task));  // Đẩy task lỗi vào hàng đợi error
                        }
                    }
                }
            } catch (error) {
                console.error('Lỗi khi nhận và xử lý task:', error);
            }
        });

        // Subscribe đến hàng đợi "process_post"
        subscriber.subscribe('process_post', (err, count) => {
            if (err) {
                console.error('Lỗi khi subscribe hàng đợi:', err);
            } else {
                console.log(`Đã subscribe ${count} channel.`);
            }
        });

    } catch (error) {
        console.error('Lỗi trong quá trình xử lý task:', error);
    }
};


module.exports = {
    processTaskFromQueue
};
