const { redisClient, redisSubscriber, connectToRedis, sendMessageToRedis } = require("./shared/redis/redisClient");
const { handleUserInteraction } = require("./shared/redis/interactionAndWeightCalculator");
const { markPostAsViewed } = require("./services/postService")
const processTaskFromQueue = async () => {
    try {
        console.log('Worker đã sẵn sàng để xử lý các task từ hàng đợi.');

        while (true) {
            // Sử dụng sendCommand để gọi BRPOP
            const taskJsonArray = await redisClient.sendCommand(['BRPOP', 'process_post', '0']); // '0' block vô thời hạn

            if (taskJsonArray && taskJsonArray[1]) {
                const taskJson = taskJsonArray[1];  // Task đầu tiên trong mảng trả về
                const task = JSON.parse(taskJson);  // Chuyển đổi chuỗi JSON thành đối tượng

                let retries = 3;
                let success = false;

                while (retries > 0 && !success) {
                    try {
                        if (task.action === 'handleUserInteraction') {
                            await markPostAsViewed(task.data.postId, task.data.userId)
                            await handleUserInteraction(task.data.userId, task.data.friendId, task.data.postId, task.data.postCategory, task.action);
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
                            await redisClient.rpush('error_queue', JSON.stringify(task));
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Lỗi trong quá trình xử lý task:', error);
    }
};


module.exports = {
    processTaskFromQueue
};
