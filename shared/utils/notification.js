const requestWithCircuitBreaker = require('./circuitBreaker')
exports.sendNotification = async (reciveId, senderId, type, postId) => {
    try {
        const senderArray = await requestWithCircuitBreaker(
            `${process.env.URL_USER_SERVICE}/getUsersBulk?userIds=${senderId}`,
            'GET'
        );
        if (!senderArray || senderArray.length === 0) {
            throw new Error('Không tìm thấy người gửi');
        }
        const sender = senderArray[0];
        const senderInfo = {
            userId: sender._id,
            avatar: sender.profileUrl || 'default_avatar_url.png',
            name: sender.firstName,
        };
        let message;
        switch (type) {
            case 'FRIEND_REQUEST':
                message = `${sender.firstName} đã gửi cho bạn một lời mời kết bạn.`;
                break;
            case 'FRIEND_ACCEPTED':
                message = `${sender.firstName} đã chấp nhận lời mời kết bạn của bạn.`;
                break;
            case 'COMMENT':
                message = `${sender.firstName} đã bình luận về bài viết của bạn.`;
                break;
            case 'LIKE':
                message = `${sender.firstName} đã thích bài viết của bạn.`;
                break;
            default:
                message = `${sender.firstName} đã gửi cho bạn một thông báo.`;
        }
        const notificationData = {
            senderInfo,
            reciveId,
            type,
            postId,
            message,
            redirectUrl: postId ? `/post/${postId}` : `/profile/${sender._id}`,
        };
        const notification = await requestWithCircuitBreaker(`${process.env.URL_NOTIFI_SERVICE}/send`, 'POST', notificationData);
        return notification;
    } catch (error) {
        console.error('Lỗi khi gửi thông báo:', error.message);
        throw error;
    }
};
exports.notifyFriendRequest = async (reciveId, senderId) => {
    return await this.sendNotification(reciveId, senderId, 'FRIEND_REQUEST', null);
};
exports.notifyFriendAccepted = async (reciveId, senderId) => {
    return await this.sendNotification(reciveId, senderId, 'FRIEND_ACCEPTED', null);
};
exports.notifyComment = async (reciveId, senderId, postId) => {
    return await this.sendNotification(reciveId, senderId, 'COMMENT', postId);
};
exports.notifyLike = async (reciveId, senderId, postId) => {
    return await this.sendNotification(reciveId, senderId, 'LIKE', postId);
};
