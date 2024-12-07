const requestWithCircuitBreaker = require('./circuitBreaker')
exports.sendNotification = async (reciveId, senderId, type, postId) => {
    try {
        let senderInfo = {};
        if (!senderId || senderId === 'system') {
            senderInfo = {
                userId: 'system',
                avatar: 'system_avatar_url.png',
                name: 'Hệ thống',
            };
        } else {
            const senderArray = await requestWithCircuitBreaker(
                `${process.env.URL_USER_SERVICE}/getUsersBulk?userIds=${senderId}`,
                'GET'
            );
            if (!senderArray || senderArray.length === 0) {
                console.error('No sender found for senderId:', senderId);
                throw new Error('No sender found');
            }
            const sender = senderArray[0];
            senderInfo = {
                userId: sender._id,
                avatar: sender.profileUrl || 'default_avatar_url.png',
                name: sender.firstName,
            };
        }
        let message;
        switch (type) {
            case 'FRIEND_REQUEST':
                message = `${senderInfo.name} đã gửi cho bạn một lời mời kết bạn.`;
                break;
            case 'FRIEND_ACCEPTED':
                message = `${senderInfo.name} đã chấp nhận lời mời kết bạn của bạn.`;
                break;
            case 'COMMENT':
                message = `${senderInfo.name} đã bình luận về bài viết của bạn.`;
                break;
            case 'LIKE':
                message = `${senderInfo.name} đã thích bài viết của bạn.`;
                break;
            case 'VIOLATE_POST':
                message = `Hệ thống phát hiện bài viết của bạn vi phạm tiêu chuẩn cộng đồng. Bài viết của bạn đã bị ẩn.`;
                break;
            default:
                message = `${senderInfo.name} đã gửi cho bạn một thông báo.`;
        }
        const notificationData = {
            senderInfo,
            reciveId,
            type,
            postId,
            message,
            redirectUrl: postId ? `/post/${postId}` : `/profile/${senderInfo.userId}`,
        };
        const notification = await requestWithCircuitBreaker(
            `${process.env.URL_NOTIFI_SERVICE}/send`,
            'POST',
            notificationData
        );

        return notification;
    } catch (error) {
        console.error('Error while sending notification:', error.message);
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
exports.violatePost = async (reciveId, postId) => {
    return await this.sendNotification(reciveId, null, 'VIOLATE_POST', postId);
};
