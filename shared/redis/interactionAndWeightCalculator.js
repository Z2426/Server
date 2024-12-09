// const { redisClient, redisSubscriber, generateTaskId, sendMessageToRedis } = require("../../shared/redis/redisClient");
const { generateTaskId, sendMessageToRedis } = require("../../shared/redis/redisClient");

const { createDuplicateClient } = require("../../shared/redis/redisClient");
const redisClient = createDuplicateClient();
const redisSubscriber = createDuplicateClient();
const MIN_WEIGHT = 0.05;
const MAX_WEIGHT = 0.6;
const GROUPS = ["friend", "interest", "popular"];
const INITIAL_WEIGHTS = {
    friend: 0.2,
    interest: 0.3,
    popular: 0.5
};
const MAX_WINDOW_SIZE = 10;
const getUserTopTopics = async (user_id, limit = 2) => {
    const key = `user:${user_id}:topics`;
    try {
        const data = await redisClient.zRangeWithScores(key, 0, -1);
        if (data.length === 0) {
            return {};
        }
        const sortedData = data.reverse();
        const topInterests = sortedData.slice(0, limit).map(item => item.value);
        //console.log("Top intestes", topInterests)
        return topInterests;
    } catch (err) {
        return null;
    }
};
function updateWeights(interactions, baseWeights) {
    const interactionCount = { friend: 0, interest: 0, popular: 0 };
    interactions.forEach((interaction) => {
        if (interactionCount[interaction] !== undefined) {
            interactionCount[interaction] += 1;
        }
    });
    const totalInteractions = Object.values(interactionCount).reduce((a, b) => a + b, 0);
    if (totalInteractions === 0) {
        return baseWeights;
    }
    let updatedWeights = {};
    for (let group of GROUPS) {
        updatedWeights[group] = baseWeights[group] * (1 + interactionCount[group] / totalInteractions);
        if (updatedWeights[group] > MAX_WEIGHT) {
            updatedWeights[group] = MAX_WEIGHT;
        } else if (updatedWeights[group] < MIN_WEIGHT) {
            updatedWeights[group] = MIN_WEIGHT;
        }
    }
    const totalWeight = Object.values(updatedWeights).reduce((a, b) => a + b, 0);
    for (let group in updatedWeights) {
        updatedWeights[group] /= totalWeight;
    }
    return updatedWeights;
}
function calculateCombinedWeights(shortTermWindow, longTermData, baseWeights, alpha = 0.7) {
    const shortTermWeights = updateWeights(shortTermWindow, baseWeights);
    const longTermWeights = updateWeights(longTermData, baseWeights);
    let combinedWeights = {};
    for (let group of GROUPS) {
        combinedWeights[group] = alpha * shortTermWeights[group] + (1 - alpha) * longTermWeights[group];
    }
    const totalWeight = Object.values(combinedWeights).reduce((a, b) => a + b, 0);
    for (let group in combinedWeights) {
        combinedWeights[group] /= totalWeight;
    }
    return combinedWeights;
}
const saveInteractionAndUpdateWeights = async (userId, interaction) => {
    try {
        const interactionKey = `user:${userId}:interactions`;
        await redisClient.lPush(interactionKey, interaction);
        const interactionCount = await redisClient.lLen(interactionKey);
        if (interactionCount > MAX_WINDOW_SIZE) {
            await redisClient.rPop(interactionKey);
        }
        const shortTermInteractions = await redisClient.lRange(interactionKey, 0, -1);
        const longTermKey = `user:${userId}:longTermInteractions`;
        await redisClient.rPush(longTermKey, interaction);
        const longTermInteractions = await redisClient.lRange(longTermKey, 0, -1);
        const currentWeights = calculateCombinedWeights(
            shortTermInteractions,
            longTermInteractions,
            INITIAL_WEIGHTS
        );
        const weightKey = `user:${userId}:weights`;
        for (let group in currentWeights) {
            await redisClient.hSet(weightKey, group, currentWeights[group]);
        }
        return currentWeights;
    } catch (error) {
        throw error;
    }
}
const updateUserInterest = async (user_id, post_id, post_category, action) => {
    const action_points = {
        'Like': 3,
        'Xem': 1,
        'Comment': 5
    };
    const score = action_points[action] || 0;
    const key = `user:${user_id}:topics`;
    try {
        await redisClient.zIncrBy(key, score, post_category);
    } catch (err) {
    }
}
const classifyTypeInteract = async (userId, friendId, typePost) => {
    return new Promise(async (resolve, reject) => {
        try {
            const taskId = generateTaskId();
            const requestMessage = { idTask: taskId, userId, friendId };
            await sendMessageToRedis('friendship_status_request', requestMessage);
            redisSubscriber.subscribe(taskId, async (message) => {
                const { isFriend } = JSON.parse(message);
                if (isFriend) {
                    console.log("type interact : friend")
                    resolve('friend');
                } else {
                    const topTopics = await getUserTopTopics(userId, 3);
                    const isInterest = topTopics && topTopics.includes(typePost);
                    if (isInterest) {
                        console.log("interest")
                        resolve('interest');
                    } else {
                        console.log("type interact : popular")
                        resolve('popular');
                    }
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};
const getUserWeights = async (userId) => {
    const weightKey = `user:${userId}:weights`;
    //console.log(`[getUserWeights] Fetching weights for userId: ${userId}, key: ${weightKey}`);
    try {
        const weights = await redisClient.hGetAll(weightKey);
        //console.log(`[getUserWeights] Retrieved weights:`, weights);

        if (!weights || Object.keys(weights).length === 0) {
            //console.warn(`[getUserWeights] No weights found. Returning INITIAL_WEIGHTS.`);
            return INITIAL_WEIGHTS;
        }
        const parsedWeights = {};
        for (let group of GROUPS) {
            parsedWeights[group] = parseFloat(weights[group]) || INITIAL_WEIGHTS[group];
            //console.log(`[getUserWeights] Parsed weight for group "${group}":`, parsedWeights[group]);
        }
        //console.log("[getUserWeights] Successfully fetched and parsed weights:", parsedWeights);
        return parsedWeights;
    } catch (error) {
        console.error(`[getUserWeights] Error occurred:`, error);
        return INITIAL_WEIGHTS;
    }
};

const compareWeights = (oldWeight, updatedWeights) => {
    const result = [];
    for (const key in oldWeight) {
        if (oldWeight.hasOwnProperty(key) && updatedWeights.hasOwnProperty(key)) {
            const oldValue = oldWeight[key];
            const newValue = updatedWeights[key];
            if (newValue > oldValue) {
                result.push({
                    group: key,
                    oldValue: oldValue,
                    newValue: newValue,
                    change: 'increased'
                });
            }
            else if (newValue < oldValue) {
                result.push({
                    group: key,
                    oldValue: oldValue,
                    newValue: newValue,
                    change: 'decreased'
                });
            } else {
                result.push({
                    group: key,
                    oldValue: oldValue,
                    newValue: newValue,
                    change: 'no change'
                });
            }
        }
    }

    return result;
};

const handleUserInteraction = async (userId, friendId, postId, postCategory, action) => {
    try {
        const oldWeight = await getUserWeights(userId)
        await updateUserInterest(userId, postId, postCategory, action);
        const interactionType = await classifyTypeInteract(userId, friendId, postCategory);
        const updatedWeights = await saveInteractionAndUpdateWeights(userId, interactionType);
        const increasedGroups = compareWeights(oldWeight, updatedWeights);
        if (increasedGroups.length > 0) {
            console.log(`Groups that increased for user ${userId}:`);
            console.log(increasedGroups);
        } else {
            console.log(`No groups increased for user ${userId}.`);
        }
        return updatedWeights;
    } catch (error) {
        throw error;
    }
};
const getPostDistributionByGroup = async (userId, numPosts = 20) => {
    // Fetch user-specific weights from Redis or default values
    const weights = await getUserWeights(userId);
    // console.log(weights)
    // Calculate the weighted count of posts for each group
    const weightedCounts = {};
    GROUPS.forEach(group => {
        weightedCounts[group] = Math.round(weights[group] * numPosts);
    });

    // Adjust the total number of posts if it doesn't match `numPosts`
    let totalPosts = Object.values(weightedCounts).reduce((sum, count) => sum + count, 0);

    while (totalPosts !== numPosts) {
        if (totalPosts < numPosts) {
            // Increase posts in the group with the highest weight
            const maxGroup = Object.keys(weightedCounts).reduce((max, group) => weights[group] > weights[max] ? group : max);
            weightedCounts[maxGroup] += 1;
        } else if (totalPosts > numPosts) {
            // Decrease posts in the group with the lowest weight
            const minGroup = Object.keys(weightedCounts).reduce((min, group) => weights[group] < weights[min] ? group : min);
            weightedCounts[minGroup] -= 1;
        }
        totalPosts = Object.values(weightedCounts).reduce((sum, count) => sum + count, 0);
    }
    //console.log(weightedCounts)
    // Return the number of posts for each group
    return weightedCounts;
};
module.exports = {
    handleUserInteraction,
    getUserWeights,
    getPostDistributionByGroup,
    getUserTopTopics
};
