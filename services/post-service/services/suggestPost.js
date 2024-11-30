const axios = require('axios');
const Post = require('../models/Post');
exports.getNewsfeed = async (userId, page = 1, limit = 10) => {
    try {
        console.log("NEWFEEDS");

        // Lấy bài viết mới nhất
        const latestPosts = await Post.aggregate([
            {
                $match: {
                    $or: [
                        { visibility: 'public' },
                        { specifiedUsers: userId }, // Chỉ lấy bài viết có người dùng được chỉ định
                    ],
                },
            },
            { $sort: { createdAt: -1 } }, // Lấy bài viết mới nhất
            { $skip: (page - 1) * limit }, // Phân trang
            { $limit: limit }, // Lấy tối đa limit bài viết
        ]);
        console.log(latestPosts);

        // Lấy bài viết ngẫu nhiên
        const randomPosts = await Post.aggregate([
            {
                $match: {
                    $or: [
                        { visibility: 'public' },
                        { specifiedUsers: userId }, // Chỉ lấy bài viết có người dùng được chỉ định
                    ],
                },
            },
            { $sample: { size: limit } }, // Bài viết ngẫu nhiên
        ]);

        // Lấy danh sách các userId duy nhất từ các bài viết
        const uniqueUserIds = [
            ...new Set([...latestPosts.map(post => post.userId), ...randomPosts.map(post => post.userId)]),
        ];

        let userInfoMap = {}; // Khởi tạo đối tượng để ánh xạ thông tin người dùng

        if (uniqueUserIds.length > 0) {
            try {
                // Chuyển mảng uniqueUserIds thành chuỗi để đưa vào query
                const userIdsQuery = uniqueUserIds.join(',');

                // Gọi API để lấy thông tin người dùng với userIds được truyền qua query
                const userInfoResponse = await axios.get(`${process.env.URL_USER_SERVICE}/getUsersBulk?userIds=${userIdsQuery}`);
                console.log(userInfoResponse.data);

                // Kiểm tra xem users có tồn tại và là mảng hay không
                if (Array.isArray(userInfoResponse.data)) {
                    // Ánh xạ thông tin người dùng
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

        // Gắn thông tin người dùng vào mỗi bài viết
        const attachUserInfo = (posts) => posts.map(post => ({
            ...post,
            user: userInfoMap[post.userId] || null, // Gắn thông tin người dùng hoặc null nếu không tìm thấy
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
        throw new Error('Lỗi trong quá trình lấy tin tức');
    }
};