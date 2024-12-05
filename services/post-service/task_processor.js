const { redisClient } = require("./shared/redis/redisClient");
const { handleUserInteraction } = require("./shared/redis/interactionAndWeightCalculator");
const { markPostAsViewed } = require("./services/postService");

// Hàm xử lý task từ hàng đợi
const processTaskFromQueue = async () => {
    console.log('Worker đã sẵn sàng để xử lý các task từ hàng đợi.');

    while (true) {
        try {
            // Chờ và lấy task từ hàng đợi "process_post" (BLPOP chờ đến khi có dữ liệu)
            const taskData = await redisClient.blPop('process_post', 0); // Tham số 0: chờ vô thời hạn

            if (taskData) {
                const message = taskData.element;  // `element` chứa dữ liệu của task
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
                            await redisClient.rPush('error_queue', JSON.stringify(task));  // Đẩy task lỗi vào hàng đợi error
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Lỗi trong quá trình xử lý task:', error);
        }
    }
};

module.exports = {
    processTaskFromQueue
};
