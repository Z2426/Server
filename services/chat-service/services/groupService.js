const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const GroupActivity = require("../models/GroupActivity");
const Invitation = require("../models/Invitation");
const redis = require('redis');

const redisClient = redis.createClient({
    url: 'redis://redis:6379'
});
// Gửi tin nhắn nhóm
// Gửi tin nhắn nhóm (có thể kèm tệp)
exports.sendGroupMessage = async (senderId, groupId, content, file) => {
    const timestamp = Date.now(); // Lấy thời gian hiện tại (milliseconds)

    // Tìm cuộc hội thoại nhóm
    let conversation;
    try {
        conversation = await Conversation.findById(groupId);
        if (!conversation || conversation.type !== "group") return null;
    } catch (err) {
        console.error("Lỗi khi tìm cuộc trò chuyện nhóm:", err);
        return null;
    }

    // Lưu tin nhắn vào MongoDB (có thể kèm theo file)
    let newMessage;
    try {
        const messageData = {
            conversationId: conversation._id,
            senderId,
            text: content,
            timestamp, // Thêm thời gian vào MongoDB
        };

        // Nếu có tệp, lưu URL tệp vào MongoDB
        if (file) {
            messageData.file_url = file.path; // Lưu đường dẫn tệp (hoặc URL nếu sử dụng dịch vụ lưu trữ như S3, Cloudinary)
        }

        newMessage = await Message.create(messageData);
    } catch (err) {
        console.error("Lỗi khi lưu tin nhắn vào MongoDB:", err);
        throw new Error("Không thể lưu tin nhắn.");
    }

    // Dữ liệu tin nhắn để phát qua Redis
    const messageDataToPublish = {
        type: 'group',
        senderId,
        groupId,
        message: newMessage,
        timestamp, // Thêm thời gian vào Redis
    };

    // Lọc các thành viên trong nhóm và kiểm tra trạng thái online
    for (const memberId of conversation.members) {
        let status;
        try {
            status = await redisClient.get(`user:${memberId}:status`);
        } catch (err) {
            console.error("Lỗi khi truy vấn Redis:", err);
            status = null;
        }

        if (status === "online") {
            // Nếu thành viên online, phát tin nhắn qua Redis
            redisClient.publish(`chatgroup:${groupId}:${memberId}`, JSON.stringify(messageDataToPublish));
        }
    }

    return newMessage;
};

// Tạo nhóm
exports.createGroup = async (userId, groupName, groupDescription, isPrivate) => {
    const conversation = new Conversation({
        name: groupName,
        description: groupDescription,
        isPrivate,
        members: [userId], // Người tạo nhóm là thành viên đầu tiên
        admins: [userId],  // Người tạo nhóm là quản trị viên đầu tiên
        createdBy: userId,
    });
    await conversation.save();
    return conversation;
};

// Xóa thành viên khỏi nhóm
exports.removeMemberFromGroup = async (conversationId, adminId, memberId) => {
    const conversation = await Conversation.findById(conversationId);
    if (conversation.admins.includes(adminId)) {
        const memberIndex = conversation.members.indexOf(memberId);
        if (memberIndex !== -1) {
            conversation.members.splice(memberIndex, 1);
            await conversation.save();
            return conversation;
        }
        throw new Error("Không tìm thấy thành viên trong nhóm");
    }
    throw new Error("Bạn không có quyền xóa thành viên");
};

// Thay đổi quyền thành viên
exports.changeMemberRole = async (conversationId, adminId, memberId, newRole) => {
    const conversation = await Conversation.findById(conversationId);
    if (conversation.admins.includes(adminId)) {
        const member = conversation.members.find(member => member.userId.toString() === memberId.toString());
        if (member) {
            member.role = newRole;
            await conversation.save();
            return conversation;
        }
        throw new Error("Thành viên không tồn tại trong nhóm");
    }
    throw new Error("Bạn không có quyền thay đổi quyền của thành viên");
};

// Chặn thành viên khỏi nhóm
exports.blockMemberInGroup = async (conversationId, adminId, memberId) => {
    const conversation = await Conversation.findById(conversationId);
    if (conversation.admins.includes(adminId)) {
        if (conversation.members.includes(memberId)) {
            conversation.blockedMembers.push(memberId);
            await conversation.save();
            return conversation;
        }
        throw new Error("Thành viên không tồn tại trong nhóm");
    }
    throw new Error("Bạn không có quyền chặn thành viên");
};

// Hàm ghi nhận hoạt động nhóm
exports.logGroupActivity = async (conversationId, activityType, performedBy, affectedUser, additionalInfo = '') => {
    const activity = new GroupActivity({
        conversationId,
        activityType,
        performedBy,
        affectedUser,
        additionalInfo,
    });
    await activity.save();
};

// Thêm thành viên vào nhóm và ghi nhận hoạt động
exports.addMemberToGroup = async (conversationId, adminId, newMemberId) => {
    const conversation = await Conversation.findById(conversationId);
    if (conversation.admins.includes(adminId)) {
        if (!conversation.members.includes(newMemberId)) {
            conversation.members.push(newMemberId);
            await conversation.save();

            // Ghi nhận hoạt động thêm thành viên
            await exports.logGroupActivity(conversationId, 'add_member', adminId, newMemberId, 'Thêm thành viên vào nhóm');

            return conversation;
        }
        throw new Error("Thành viên đã có trong nhóm");
    }
    throw new Error("Bạn không có quyền thêm thành viên vào nhóm");
};

// Lấy lịch sử hoạt động nhóm
exports.getGroupActivityHistory = async (conversationId) => {
    const activities = await GroupActivity.find({ conversationId }).sort({ timestamp: -1 }); // Sắp xếp theo thời gian giảm dần
    return activities;
};

// Kiểm tra quyền quản trị viên
exports.isAdmin = (userId, conversationId) => {
    const conversation = Conversation.findById(conversationId);
    return conversation.admins.includes(userId);
};


// Gửi lời mời vào nhóm
exports.sendGroupInvite = async (senderId, conversationId, recipientId) => {
    try {
        // Kiểm tra nếu người nhận đã là thành viên nhóm
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new Error("Nhóm không tồn tại");
        }
        if (conversation.members.includes(recipientId)) {
            throw new Error("Người dùng đã là thành viên nhóm");
        }

        // Tạo lời mời
        const invitation = await Invitation.create({
            conversationId,
            senderId,
            recipientId,
            status: 'pending',
        });

        // Phát thông báo lời mời qua Redis (nếu người nhận online)
        const status = await redisClient.get(`user:${recipientId}:status`);
        if (status === "online") {
            const inviteData = {
                type: 'group-invite',
                senderId,
                conversationId,
                invitationId: invitation._id,
            };
            redisClient.publish(`chatuser:${recipientId}`, JSON.stringify(inviteData));
        }

        return invitation;
    } catch (error) {
        console.error("Lỗi khi gửi lời mời:", error);
        throw error;
    }
};

// Xử lý lời mời vào nhóm
exports.handleGroupInvite = async (userId, invitationId, status) => {
    try {
        // Kiểm tra lời mời
        const invitation = await Invitation.findById(invitationId);
        if (!invitation) {
            throw new Error("Lời mời không tồn tại");
        }

        // Kiểm tra người nhận có phải là người được mời không
        if (invitation.recipientId.toString() !== userId.toString()) {
            throw new Error("Bạn không phải là người nhận lời mời này");
        }

        // Cập nhật trạng thái lời mời
        invitation.status = status;
        await invitation.save();

        if (status === "accepted") {
            // Thêm người dùng vào nhóm nếu chấp nhận
            const conversation = await Conversation.findById(invitation.conversationId);
            if (!conversation.members.includes(userId)) {
                conversation.members.push(userId);
                await conversation.save();

                // Phát thông báo cho nhóm nếu người dùng tham gia thành công
                redisClient.publish(`chatgroup:${conversation._id}`, JSON.stringify({
                    type: 'new-member',
                    userId,
                }));
            }
        }

        return invitation;
    } catch (error) {
        console.error("Lỗi khi xử lý lời mời:", error);
        throw error;
    }
};

// Thêm admin vào nhóm
exports.addAdminToGroup = async (conversationId, userId) => {
    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new Error("Nhóm không tồn tại");
        }

        // Kiểm tra nếu người dùng đã là admin
        if (!conversation.admins.includes(userId)) {
            conversation.admins.push(userId); // Thêm người dùng vào danh sách admin
            await conversation.save();
            console.log(`Đã thêm người dùng với ID ${userId} làm admin nhóm.`);
        } else {
            console.log("Người dùng này đã là admin của nhóm.");
        }
    } catch (error) {
        console.error("Lỗi khi thêm admin:", error);
    }
};

// Xóa admin khỏi nhóm
exports.removeAdminFromGroup = async (conversationId, userId) => {
    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new Error("Nhóm không tồn tại");
        }

        // Kiểm tra nếu người dùng là admin của nhóm
        if (conversation.admins.includes(userId)) {
            conversation.admins.pull(userId); // Xóa người dùng khỏi danh sách admin
            await conversation.save();
            console.log(`Đã xóa người dùng với ID ${userId} khỏi danh sách admin nhóm.`);
        } else {
            console.log("Người dùng này không phải là admin của nhóm.");
        }
    } catch (error) {
        console.error("Lỗi khi xóa admin:", error);
    }
};
