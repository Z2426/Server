const suggestPost = require('../services/suggestPost')
const { getPostDistributionByGroup, getUserTopTopics } = require("../shared/redis/interactionAndWeightCalculator");
const { getFriendsList } = require('../shared/redis/redisHandler');
/** ================================================
 *               Newsfeed 
 * ================================================ */
exports.getNewsfeed = async (req, res) => {
    try {
        const { userId } = req.body.user;
        const { page = 1, limit = 20 } = req.query;
        const data = {};
        const friendsList = await getFriendsList(userId);
        if (friendsList && friendsList.length > 0) {
            data.friendsList = friendsList;
        }
        const postDistribution = await getPostDistributionByGroup(userId);
        if (postDistribution && Object.keys(postDistribution).length > 0) {
            data.postDistribution = postDistribution;
        }
        const topTopics = await getUserTopTopics(userId);
        if (topTopics && topTopics.length > 0) {
            data.topTopics = topTopics;
        }
        const newsfeed = await suggestPost.getNewsfeed(userId, page, limit, data);
        return res.status(200).json({
            message: 'Newsfeed list',
            data: newsfeed,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Error retrieving newsfeed',
            error: error.message,
        });
    }
};