const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const GroupActivity = require("../models/GroupActivity");
const Invitation = require("../models/Invitation");
const { redisClient, connectToRedis } = require("../shared/redis/redisClient");
connectToRedis();
exports.unblockMemberInGroup = async (conversationId, adminId, memberId) => {
    try {
        // Tìm cuộc trò chuyện (nhóm) theo conversationId
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new Error("Nhóm không tồn tại.");
        }

        // Kiểm tra xem adminId có phải là quản trị viên của nhóm không
        if (!conversation.admins.includes(adminId)) {
            throw new Error("Bạn không có quyền gỡ chặn thành viên trong nhóm này.");
        }

        // Kiểm tra xem memberId có phải là thành viên đã bị chặn không
        if (!conversation.blockedUsers.includes(memberId)) {
            throw new Error("Thành viên này chưa bị chặn.");
        }

        // Loại bỏ memberId khỏi blockedUsers và thêm lại vào members
        conversation.blockedUsers = conversation.blockedUsers.filter(member => member.toString() !== memberId.toString());
        conversation.members.push(memberId);

        // Lưu cập nhật nhóm
        const updatedConversation = await conversation.save();

        // Ghi lại hoạt động gỡ chặn thành viên vào GroupActivity
        const groupActivity = new GroupActivity({
            groupId: conversationId,
            activityType: 'unblock_member', // Đã thêm 'unblock_member' vào enum
            performedBy: adminId, // Người thực hiện hành động (admin)
            affectedUser: memberId, // Thành viên bị gỡ chặn
            additionalInfo: "Gỡ chặn thành viên trong nhóm",
        });
        await groupActivity.save();

        // Trả về nhóm đã được cập nhật
        return updatedConversation;
    } catch (error) {
        console.error("Lỗi trong unblockMemberInGroup:", error);
        throw new Error(`Lỗi khi gỡ chặn thành viên: ${error.message}`);
    }
};

exports.blockMemberInGroup = async (conversationId, adminId, memberId) => {
    try {
        // Tìm cuộc trò chuyện (nhóm) theo conversationId
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new Error("Nhóm không tồn tại.");
        }

        // Kiểm tra xem adminId có phải là quản trị viên của nhóm không
        if (!conversation.admins.includes(adminId)) {
            throw new Error("Bạn không có quyền chặn thành viên trong nhóm này.");
        }

        // Kiểm tra xem memberId có phải là thành viên trong nhóm không
        if (!conversation.members.includes(memberId)) {
            throw new Error("Thành viên không tồn tại trong nhóm.");
        }

        // Kiểm tra nếu danh sách blockedUsers tồn tại và thành viên đã bị chặn
        if (conversation.blockedUsers && conversation.blockedUsers.includes(memberId)) {
            throw new Error("Thành viên đã bị chặn trước đó.");
        }

        // Khởi tạo blockedUsers nếu chưa tồn tại
        if (!conversation.blockedUsers) {
            conversation.blockedUsers = [];
        }

        // Khởi tạo members nếu chưa tồn tại
        if (!conversation.members) {
            conversation.members = [];
        }

        // Thêm memberId vào blockedUsers và loại bỏ khỏi members
        conversation.blockedUsers.push(memberId);
        conversation.members = conversation.members.filter(member => member !== memberId);

        // Lưu cập nhật nhóm
        const updatedConversation = await conversation.save();

        // Ghi lại hoạt động chặn thành viên vào GroupActivity
        const groupActivity = new GroupActivity({
            groupId: conversationId,
            activityType: 'block_member',
            performedBy: adminId, // Người thực hiện hành động (admin)
            affectedUser: memberId, // Thành viên bị chặn
            additionalInfo: "Chặn thành viên trong nhóm",
        });
        await groupActivity.save();

        return updatedConversation;
    } catch (error) {
        console.error("Lỗi trong blockMemberInGroup:", error);
        throw new Error(`Lỗi khi chặn thành viên: ${error.message}`);
    }
};

exports.createGroup = async (userId, groupName, groupDescription, members, isPrivate) => {
    // Kiểm tra kiểu dữ liệu của members
    console.log("Kiểu dữ liệu của members trong service:", typeof members);
    console.log("Dữ liệu members trong service:", members);

    // Kiểm tra xem members có phải là mảng không
    if (!Array.isArray(members)) {
        throw new Error("Members phải là một mảng.");
    }

    // Kiểm tra nếu số lượng thành viên không đủ ít nhất 3 (bao gồm người tạo nhóm)
    if (members.length + 1 < 3) {
        throw new Error("Nhóm phải có ít nhất 3 thành viên.");
    }

    // Tạo nhóm mới
    const group = new Conversation({
        name: groupName,
        description: groupDescription,
        isPrivate,
        members: [userId, ...members],  // Bao gồm người tạo nhóm và các thành viên
        admins: [userId],
        createdBy: userId,
        isGroup: true,
        type: "group"
    });

    // Lưu nhóm vào cơ sở dữ liệu
    await group.save();

    // Ghi lại hoạt động tạo nhóm
    const groupActivity = new GroupActivity({
        groupId: group._id,           // ID nhóm vừa tạo
        activityType: 'update_group', // Loại hoạt động (tạo nhóm)
        performedBy: userId,          // Người tạo nhóm
        affectedUser: userId,         // Người bị ảnh hưởng (thường là chính người tạo nhóm)
        timestamp: new Date(),        // Thời gian hoạt động
        additionalInfo: 'Group created successfully', // Thông tin bổ sung (nếu cần)
    });
    await groupActivity.save()
    // Trả về thông tin nhóm mới
    return group;
};


// Gửi tin nhắn vào nhóm
exports.sendGroupMessage = async (conversationId, senderId, content, fileUrl) => {
    try {
        // Kiểm tra nếu nhóm tồn tại
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new Error("Cuộc trò chuyện không tồn tại.");
        }

        // Kiểm tra nếu cuộc trò chuyện là nhóm
        if (conversation.type !== 'group') {
            throw new Error("Đây không phải là cuộc trò chuyện nhóm.");
        }

        // Tạo một đối tượng tin nhắn
        const newMessage = new Message({
            conversationId,
            senderId,
            text: content,
            file_url: fileUrl, // Lưu URL ảnh
            timestamp: new Date(),
        });

        // Lưu tin nhắn vào cơ sở dữ liệu
        await newMessage.save();

        // Cập nhật thông tin tin nhắn cuối cùng trong nhóm
        conversation.lastMessage = {
            content,
            senderId,
            timestamp: new Date(),
            file_url: fileUrl, // Cập nhật URL ảnh trong tin nhắn cuối cùng
        };
        await conversation.save();

        // Cập nhật số lượng tin nhắn chưa đọc cho các thành viên khác
        for (const memberId of conversation.members) {
            if (memberId.toString() !== senderId.toString()) {
                // Kiểm tra nếu `unreadCounts` là một mảng hợp lệ
                if (!Array.isArray(conversation.unreadCounts)) {
                    conversation.unreadCounts = [];
                }

                const unreadCount = conversation.unreadCounts.find(
                    (entry) => entry.userId.toString() === memberId.toString()
                );

                if (unreadCount) {
                    unreadCount.count += 1; // Tăng số lượng tin nhắn chưa đọc
                } else {
                    conversation.unreadCounts.push({ userId: memberId, count: 1 });
                }
            }
        }

        await conversation.save();

        // Lưu hoạt động nhóm (nếu có thể dùng để theo dõi hoạt động gửi tin nhắn)
        const groupActivity = new GroupActivity({
            groupId: conversationId,
            activityType: 'send_message',
            performedBy: senderId,
            affectedUser: senderId, // Tin nhắn gửi bởi người dùng
            additionalInfo: content,
        });
        await groupActivity.save();

        // Trả về kết quả với thông tin tin nhắn đã gửi
        return { success: true, message: "Tin nhắn đã được gửi thành công." };
    } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
        throw new Error(`Lỗi khi gửi tin nhắn: ${error.message}`);
    }
};

// Thêm thành viên vào nhóm
exports.addMemberToGroup = async (userId, groupId, newMembers) => {
    try {
        // Lấy thông tin nhóm từ cơ sở dữ liệu
        const group = await Conversation.findById(groupId);
        if (!group) {
            throw new Error("Nhóm không tồn tại");
        }

        // Thêm các thành viên mới vào nhóm
        group.members.push(...newMembers);

        // Lưu lại thông tin nhóm
        await group.save();

        // Lưu hoạt động nhóm (GroupActivity)
        newMembers.forEach(async (newMemberId) => {
            const groupActivity = new GroupActivity({
                groupId,
                activityType: 'add_member',
                performedBy: userId, // Người thực hiện hành động (admin)
                affectedUser: newMemberId, // Thành viên bị ảnh hưởng (thành viên mới được thêm)
                additionalInfo: "Thêm thành viên vào nhóm",
            });
            await groupActivity.save();
        });

        return { success: true, message: "Thêm thành viên thành công" };
    } catch (error) {
        throw new Error(`Lỗi khi thêm thành viên vào nhóm: ${error.message}`);
    }
};
// Xóa thành viên khỏi nhóm
exports.removeMemberFromGroup = async (conversationId, adminId, memberId, reason = '') => {
    // Tìm nhóm theo conversationId
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        throw new Error("Không tìm thấy nhóm");
    }

    // Kiểm tra xem adminId có quyền quản trị trong nhóm không
    if (!conversation.admins.includes(adminId)) {
        throw new Error("Không có quyền xóa thành viên");
    }

    // Kiểm tra xem memberId có phải là thành viên của nhóm không
    const memberIndex = conversation.members.indexOf(memberId);
    if (memberIndex !== -1) {
        // Xóa thành viên khỏi nhóm
        conversation.members.splice(memberIndex, 1);
        await conversation.save();

        // Ghi lại hoạt động xóa thành viên vào GroupActivity
        await GroupActivity.create({
            groupId: conversationId, // ID của nhóm
            activityType: 'remove_member', // Loại hoạt động: xóa thành viên
            performedBy: adminId, // Người thực hiện hành động (Admin)
            affectedUser: memberId, // Thành viên bị xóa
            timestamp: new Date(), // Thời gian hành động
            additionalInfo: reason, // Lý do xóa (nếu có)
        });

        return conversation; // Trả về nhóm sau khi cập nhật
    }

    throw new Error("Không tìm thấy thành viên trong nhóm");
};

exports.sendGroupInvite = async (conversationId, senderId, recipientId) => {
    try {
        // Tìm cuộc trò chuyện (nhóm) theo conversationId
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new Error("Nhóm không tồn tại.");
        }

        // Kiểm tra xem recipientId đã là thành viên của nhóm chưa
        if (conversation.members.includes(recipientId)) {
            throw new Error("Người nhận đã là thành viên của nhóm.");
        }

        // Kiểm tra nếu đã có lời mời đang chờ
        const existingInvitation = await Invitation.findOne({
            groupId: conversationId,
            recipientId: recipientId,
            status: 'pending',
        });
        if (existingInvitation) {
            throw new Error("Lời mời đang chờ xử lý.");
        }

        // Tạo lời mời tham gia nhóm
        const invitation = await Invitation.create({
            groupId: conversationId,
            senderId: senderId,
            recipientId: recipientId,
            status: 'pending',
        });

        // Trả về lời mời đã được gửi
        return invitation;

    } catch (error) {
        console.error("Lỗi khi gửi lời mời tham gia nhóm:", error);
        throw new Error(`Lỗi khi gửi lời mời tham gia nhóm: ${error.message}`);
    }
};
exports.handleGroupInvite = async (invitationId, userId, status) => {
    try {
        // Tìm lời mời theo ID
        const invitation = await Invitation.findById(invitationId);
        console.log(invitation)
        if (!invitation || invitation.recipientId.toString() !== userId.toString()) {
            throw new Error("Lời mời không hợp lệ");
        }

        // Cập nhật trạng thái lời mời
        invitation.status = status;
        await invitation.save();

        // Nếu lời mời được chấp nhận, thêm người dùng vào nhóm
        if (status === "accepted") {
            const conversation = await Conversation.findById(invitation.groupId);
            if (!conversation) {
                throw new Error("Nhóm không tồn tại");
            }

            // Kiểm tra nếu người dùng chưa là thành viên của nhóm
            if (!conversation.members.includes(userId)) {
                conversation.members.push(userId);
                await conversation.save();
            }
        }

        // Trả về lời mời đã cập nhật
        return invitation;
    } catch (error) {
        console.error("Lỗi khi xử lý lời mời:", error);
        throw new Error(`Lỗi khi xử lý lời mời: ${error.message}`);
    }
};

// Lấy lịch sử hoạt động nhóm
exports.getGroupActivityHistory = async (groupId) => {
    return await GroupActivity.find({ groupId }).sort({ timestamp: -1 });
};
// Kiểm tra quyền quản trị viên
exports.isAdmin = async (userId, conversationId) => {
    const conversation = await Conversation.findById(conversationId);
    return conversation && conversation.admins.includes(userId);
};
//change quyen 
// Service để thay đổi quyền thành viên
exports.changeMemberRole = async (conversationId, adminId, memberId) => {
    // Kiểm tra xem adminId có phải là admin của nhóm không
    const isAdminResult = await exports.isAdmin(adminId, conversationId);
    if (!isAdminResult) {
        throw new Error('You do not have permission to change roles.');
    }

    // Tìm nhóm theo conversationId
    const group = await Conversation.findById(conversationId);
    if (!group) {
        throw new Error('Group not found.');
    }

    // Kiểm tra nếu memberId có trong nhóm
    if (!group.members.includes(memberId)) {
        throw new Error('Member not found in this group.');
    }

    // Kiểm tra nếu memberId đã là admin hay chưa
    const isAlreadyAdmin = group.admins.includes(memberId);

    // Nếu là admin, xóa khỏi danh sách admin; nếu không có, thêm vào danh sách admin
    if (isAlreadyAdmin) {
        // Xóa khỏi danh sách admins
        group.admins = group.admins.filter(admin => admin.toString() !== memberId);
    } else {
        // Thêm vào danh sách admins
        group.admins.push(memberId);
    }

    // Lưu lại nhóm đã cập nhật
    const updatedGroup = await group.save();
    return updatedGroup;
};


