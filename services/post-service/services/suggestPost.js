const axios = require('axios');
const Post = require('../models/Post');
const { getPostDistributionByGroup, getUserTopTopics } = require("./../shared/redis/interactionAndWeightCalculator");
const { getFriendsList } = require('./../shared/redis/redisHandler');
/** ================================================
 *                NEWSFEED
 * ================================================ */

exports.getNewsfeed = async (userId, page, limit, data) => {
    let newsfeed = [];
    const friendLimit = data.postDistribution.friend || 0;
    const interestLimit = data.postDistribution.interest || 0;
    const popularLimit = data.postDistribution.popular || 0;
    let remainingLimit = limit;
    const startIndex = (page - 1) * limit;
    const [friendPosts, topicPosts, popularPosts] = await Promise.all([
        Post.find({
            userId: { $in: data.friendsList },
            visibility: { $in: ['public', 'friends'] },
            viewers: { $ne: userId },
            userId: { $ne: userId }
        }).limit(friendLimit).skip(startIndex).sort({ createdAt: -1 }).lean(),

        Post.find({
            categories: { $in: data.topTopics },
            visibility: { $in: ['public', 'friends'] },
            viewers: { $ne: userId },
            userId: { $ne: userId }
        }).limit(interestLimit).skip(startIndex).sort({ createdAt: -1 }).lean(),

        Post.find({
            viewers: { $gt: 50 },
            visibility: { $in: ['public', 'friends'] },
            viewers: { $ne: userId },
            userId: { $ne: userId }
        }).limit(popularLimit).skip(startIndex).sort({ createdAt: -1 }).lean()
    ]);
    if (friendPosts.length > 0) {
        const friendPostsWithType = friendPosts.map(post => ({
            ...post,
            type: 'friend'
        }));
        newsfeed = [...newsfeed, ...friendPostsWithType];
        remainingLimit -= friendPosts.length;
    }
    if (topicPosts.length > 0 && remainingLimit > 0) {
        const topicPostsWithType = topicPosts.map(post => ({
            ...post,
            type: 'interest'
        }));
        newsfeed = [...newsfeed, ...topicPostsWithType];
        remainingLimit -= topicPosts.length;
    }
    if (popularPosts.length > 0 && remainingLimit > 0) {
        const popularPostsWithType = popularPosts.map(post => ({
            ...post,
            type: 'popular'
        }));
        newsfeed = [...newsfeed, ...popularPostsWithType];
    }
    return newsfeed.slice(0, limit);
}