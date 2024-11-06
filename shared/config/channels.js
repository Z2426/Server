// ./config/channels.js

const channels = {
    redis: {
        FRIEND_REQUESTS: 'friend_requests',  // Kênh cho yêu cầu kết bạn
        POST_LIKES: 'post_likes',            // Kênh cho lượt thích bài viết
        POST_COMMENTS: 'post_comments',      // Kênh cho bình luận bài viết
        MESSAGES: 'messages',                // Kênh cho tin nhắn
        NOTIFICATIONS: 'notifications',      // Kênh cho thông báo
    },
    socket: {
        NEW_FRIEND_REQUEST: 'new_friend_request', // Kênh cho yêu cầu kết bạn mới
        NEW_POST_LIKE: 'new_post_like',           // Kênh cho lượt thích bài viết
        NEW_POST_COMMENT: 'new_post_comment',     // Kênh cho bình luận bài viết
        NEW_MESSAGE: 'new_message',               // Kênh cho tin nhắn mới
    }
};
global.channels = channels
//module.exports = channels;
