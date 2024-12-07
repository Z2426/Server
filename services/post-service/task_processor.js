const { createDuplicateClient } = require("./shared/redis/redisClient"); // Client Redis ban đầu
const { violatePost } = require("./shared/utils/notification"); // Client Redis ban đầu
const { handleUserInteraction } = require("./shared/redis/interactionAndWeightCalculator");
const { markPostAsViewed } = require("./services/postService");
const { createReport } = require('./services/postService');
const processTaskFromQueue = async () => {
    console.log('Worker is ready to process tasks from the queue.');
    while (true) {
        try {
            const redisClient = createDuplicateClient();
            const taskData = await redisClient.blPop('process_post', 0);
            const message = taskData.element;
            const task = JSON.parse(message);
            console.log(`Received task from the queue: ${task.task_id}`);
            let retries = 3;
            let success = false;
            while (retries > 0 && !success) {
                try {
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
                    if (task.action === 'processvioletpost') {
                        console.log("Processing violet post...");
                        console.log(task.data);
                        createReport(task.data.post_id, task.data.user_id, "ContentToxic", isSensitive = true);
                        await violatePost(task.data.user_id, task.data.post_id)
                        success = true;
                    }
                } catch (error) {
                    console.error('Error while processing task:', error);
                    retries--;
                    if (retries > 0) {
                        console.log(`Retrying attempt ${4 - retries}...`);
                        await new Promise(resolve => setTimeout(resolve, 2000));  // Wait 2 seconds before retrying
                    } else {
                        console.log('Retries exhausted, moving task to error queue.');
                        await redisClient.rPush('error_queue', JSON.stringify(task));  // Push failed task to error queue
                    }
                }
            }
        } catch (error) {
            console.error('Error during task processing:', error);
        }
    }
};
module.exports = {
    processTaskFromQueue
};
