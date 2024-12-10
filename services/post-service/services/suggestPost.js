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
    const startIndexFriends = (page - 1) * friendLimit;
    const startIndexInterests = (page - 1) * interestLimit;
    const startIndexPopular = (page - 1) * popularLimit;
    const [friendPosts, topicPosts, popularPosts] = await Promise.all([
        Post.find({
            userId: { $in: data.friendsList },
            visibility: { $in: ['public', 'friends'] },
            viewers: { $ne: userId },
            userId: { $ne: userId },
            status: { $ne: 'rejected' }
        })
            .limit(friendLimit)
            .skip(startIndexFriends)
            .sort({ createdAt: -1 })
            .lean(),

        Post.find({
            categories: { $in: data.topTopics },
            visibility: { $in: ['public', 'friends'] },
            viewers: { $ne: userId },
            userId: { $ne: userId },
            status: { $ne: 'rejected' }
        })
            .limit(interestLimit)
            .skip(startIndexInterests)
            .sort({ createdAt: -1 })
            .lean(),

        Post.find({
            viewers: { $gt: 50 },
            visibility: { $in: ['public', 'friends'] },
            viewers: { $ne: userId },
            userId: { $ne: userId },
            status: { $ne: 'rejected' }
        })
            .limit(popularLimit)
            .skip(startIndexPopular)
            .sort({ createdAt: -1 })
            .lean()
    ]);
    if (friendPosts.length > 0) {
        const friendPostsWithType = friendPosts.map(post => ({
            ...post,
            type: 'friend'
        }));
        newsfeed = [...newsfeed, ...friendPostsWithType];
    }
    if (topicPosts.length > 0) {
        const topicPostsWithType = topicPosts.map(post => ({
            ...post,
            type: 'interest'
        }));
        newsfeed = [...newsfeed, ...topicPostsWithType];
    }
    if (popularPosts.length > 0) {
        const popularPostsWithType = popularPosts.map(post => ({
            ...post,
            type: 'popular'
        }));
        newsfeed = [...newsfeed, ...popularPostsWithType];
    }
    return newsfeed.slice(0, limit);
};