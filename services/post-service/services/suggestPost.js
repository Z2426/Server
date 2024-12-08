const axios = require('axios');
const Post = require('../models/Post');
const { getPostDistributionByGroup, getUserTopTopics } = require("../shared/redis/interactionAndWeightCalculator");
const { getFriendsList } = require('../shared/redis/redisHandler');
/** ================================================
 *                NEWSFEED
 * ================================================ */
exports.getNewsfeed = async (userId, page = 1, limit = 10) => {
    try {
        const postCounts = await getPostDistributionByGroup(userId, limit);
        const interest = await getUserTopTopics(userId);
        const friends = await getFriendsList(userId);

        // Match conditions for posts
        const matchConditions = {
            userId: { $ne: userId },  // Exclude the user's own posts
            status: { $ne: 'rejected' },  // Exclude rejected posts
            visibility: { $ne: 'private' },  // Exclude private posts
            viewers: { $ne: userId },  // Exclude posts the user has already viewed
        };

        // Adjust the post count distribution based on available groups
        const adjustedPostCounts = {
            popular: postCounts.popular,
            interest: Array.isArray(interest) && interest.length > 0 ? postCounts.interest : 0,
            friend: Array.isArray(friends) && friends.length > 0 ? postCounts.friend : 0,
        };

        // Define the aggregation pipeline
        const pipeline = [
            { $match: matchConditions },
            {
                $facet: {
                    popular: [
                        { $match: { views: { $gt: 50 } } },  // Only popular posts with views > 50
                        { $sort: { createdAt: -1 } },  // Sort by creation date descending
                        { $limit: Math.floor(limit * adjustedPostCounts.popular / (adjustedPostCounts.popular + adjustedPostCounts.interest + adjustedPostCounts.friend)) }
                    ],

                    // Only apply the interest group if the array is not empty
                    interest: (Array.isArray(interest) && interest.length > 0) ? [
                        { $match: { categories: { $in: interest } } },  // Match posts from the user's interests
                        { $sort: { createdAt: -1 } },  // Sort by creation date descending
                        { $limit: Math.floor(limit * adjustedPostCounts.interest / (adjustedPostCounts.popular + adjustedPostCounts.interest + adjustedPostCounts.friend)) }
                    ] : [],

                    // Only apply the friends group if the array is not empty
                    friends: (Array.isArray(friends) && friends.length > 0) ? [
                        { $match: { userId: { $in: friends } } },  // Only posts from friends
                        { $sort: { createdAt: -1 } },  // Sort by creation date descending
                        { $limit: Math.floor(limit * adjustedPostCounts.friend / (adjustedPostCounts.popular + adjustedPostCounts.interest + adjustedPostCounts.friend)) }
                    ] : []
                }
            },
            {
                $project: {
                    allPosts: {
                        $concatArrays: [
                            { $ifNull: ['$popular', []] },
                            { $ifNull: ['$interest', []] },
                            { $ifNull: ['$friends', []] }
                        ]
                    }
                }
            },
            { $unwind: '$allPosts' },
            { $sort: { 'allPosts.createdAt': -1 } },  // Sort all posts by creation date descending
            { $skip: (page - 1) * limit },  // Pagination: skip posts for the given page
            { $limit: limit }  // Limit the number of posts returned
        ];

        // Execute the aggregation pipeline
        const result = await Post.aggregate(pipeline);

        // If no posts returned, return popular posts as fallback
        if (result.length === 0) {
            const fallbackPipeline = [
                { $match: matchConditions },
                {
                    $facet: {
                        popular: [
                            { $match: { views: { $gt: 50 } } },
                            { $sort: { createdAt: -1 } },
                            { $limit: limit }
                        ]
                    }
                },
                {
                    $project: {
                        allPosts: { $ifNull: ['$popular', []] }
                    }
                },
                { $unwind: '$allPosts' },
                { $sort: { 'allPosts.createdAt': -1 } },
                { $skip: (page - 1) * limit },
                { $limit: limit }
            ];

            const fallbackResult = await Post.aggregate(fallbackPipeline);
            return fallbackResult.map(item => item.allPosts);
        }

        // Return the aggregated posts (only the list of posts)
        return result.flatMap(item => item.allPosts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        throw new Error('Could not fetch posts');
    }
};