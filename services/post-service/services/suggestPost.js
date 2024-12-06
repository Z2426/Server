const axios = require('axios');
const Post = require('../models/Post');
/** ================================================
 *                NEWSFEED
 * ================================================ */
exports.getNewsfeed = async (userId, page = 1, limit = 10) => {
    try {
        const latestPosts = await Post.aggregate([
            {
                $match: {
                    $or: [
                        { visibility: 'public' },
                        { specifiedUsers: userId },
                    ],
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
        ]);
        const randomPosts = await Post.aggregate([
            {
                $match: {
                    $or: [
                        { visibility: 'public' },
                        { specifiedUsers: userId },
                    ],
                },
            },
            { $sample: { size: limit } },
        ]);
        const uniqueUserIds = [
            ...new Set([...latestPosts.map(post => post.userId), ...randomPosts.map(post => post.userId)]),
        ];

        let userInfoMap = {};

        if (uniqueUserIds.length > 0) {
            try {
                const userIdsQuery = uniqueUserIds.join(',');
                const userInfoResponse = await axios.get(`${process.env.URL_USER_SERVICE}/getUsersBulk?userIds=${userIdsQuery}`);
                console.log(userInfoResponse.data);
                if (Array.isArray(userInfoResponse.data)) {
                    userInfoMap = userInfoResponse.data.reduce((map, user) => {
                        map[user._id] = {
                            firstName: user.firstName,
                            lastName: user.lastName,
                            profileUrl: user.profileUrl,
                        };
                        return map;
                    }, {});
                } else {
                    console.warn('Invalid user data format:', userInfoResponse.data);
                }
            } catch (error) {
                console.error('Error fetching user info:', error.message);
            }
        }
        const attachUserInfo = (posts) => posts.map(post => ({
            ...post,
            user: userInfoMap[post.userId] || null,
        }));

        return {
            latestPosts: attachUserInfo(latestPosts),
            randomPosts: attachUserInfo(randomPosts),
            totalPosts: latestPosts.length + randomPosts.length,
            currentPage: page,
            totalPages: Math.ceil((latestPosts.length + randomPosts.length) / limit),
        };
    } catch (error) {
        console.error('Error fetching newsfeed:', error.message);
        throw new Error('Error fetching newsfeed:');
    }
};