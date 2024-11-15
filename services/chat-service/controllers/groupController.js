const GroupService = require("../services/groupService");
exports.unblockMember = async (req, res) => {
    const { conversationId, adminId, memberId } = req.body;
    try {
        const updatedGroup = await GroupService.unblockMemberInGroup(conversationId, adminId, memberId);
        res.status(200).json({ message: "Thành viên đã được gỡ chặn.", data: updatedGroup });
    } catch (error) {
        console.error("Lỗi khi gỡ chặn thành viên:", error);
        res.status(500).json({ message: "Đã có lỗi xảy ra khi gỡ chặn thành viên." });
    }
};

exports.createGroup = async (req, res) => {
    const { userId, groupName, groupDescription, members, isPrivate } = req.body;

    // Kiểm tra kiểu dữ liệu của members
    console.log("Kiểu dữ liệu của members:", typeof members);
    console.log("Dữ liệu members:", members);

    // Kiểm tra xem members có phải là mảng không
    if (!Array.isArray(members)) {
        return res.status(400).json({ message: "Members phải là một mảng." });
    }

    // Kiểm tra nếu số lượng thành viên không đủ ít nhất 3 (bao gồm người tạo nhóm)
    if (members.length + 1 < 3) {
        return res.status(400).json({ message: "Nhóm cần có ít nhất 3 thành viên." });
    }

    try {
        const group = await GroupService.createGroup(userId, groupName, groupDescription, members, isPrivate);
        res.status(201).json({ message: "Nhóm đã được tạo thành công.", data: group });
    } catch (error) {
        console.error("Lỗi khi tạo nhóm:", error);
        res.status(500).json({ message: "Đã có lỗi xảy ra khi tạo nhóm.", error: error.message });
    }
};



// Thêm thành viên vào nhóm
exports.addMemberToGroup = async (req, res) => {
    const { userId, groupId, newMembers } = req.body;
    try {
        const result = await GroupService.addMemberToGroup(userId, groupId, newMembers);
        return res.status(200).json(result);
    } catch (error) {
        console.error("Lỗi khi thêm thành viên:", error);
        return res.status(500).json({ message: "Đã có lỗi xảy ra khi thêm thành viên.", error: error.message });
    }
};

exports.removeMemberFromGroup = async (req, res) => {
    const { conversationId, adminId, memberId } = req.body;
    try {
        const updatedGroup = await GroupService.removeMemberFromGroup(conversationId, adminId, memberId);
        res.status(200).json({ message: "Thành viên đã được xóa khỏi nhóm.", data: updatedGroup });
    } catch (error) {
        console.error("Lỗi khi xóa thành viên khỏi nhóm:", error);
        res.status(500).json({ message: "Đã có lỗi xảy ra khi xóa thành viên." });
    }
};

exports.changeMemberRole = async (req, res) => {
    const { conversationId, adminId, memberId, newRole } = req.body;
    try {
        const updatedGroup = await GroupService.changeMemberRole(conversationId, adminId, memberId, newRole);
        res.status(200).json({ message: "Quyền thành viên đã được thay đổi.", data: updatedGroup });
    } catch (error) {
        console.error("Lỗi khi thay đổi quyền thành viên:", error);
        res.status(500).json({ message: "Đã có lỗi xảy ra khi thay đổi quyền." });
    }
};

exports.blockMemberInGroup = async (req, res) => {
    const { conversationId, adminId, memberId } = req.body;
    try {
        const updatedGroup = await GroupService.blockMemberInGroup(conversationId, adminId, memberId);
        res.status(200).json({ message: "Thành viên đã bị chặn trong nhóm.", data: updatedGroup });
    } catch (error) {
        console.error("Lỗi khi chặn thành viên:", error);
        res.status(500).json({ message: "Đã có lỗi xảy ra khi chặn thành viên." });
    }
};

exports.getGroupActivityHistory = async (req, res) => {
    const { conversationId } = req.params;
    try {
        const activityHistory = await GroupService.getGroupActivityHistory(conversationId);
        res.status(200).json({ message: "Lịch sử hoạt động của nhóm đã được truy xuất.", data: activityHistory });
    } catch (error) {
        console.error("Lỗi khi lấy lịch sử hoạt động của nhóm:", error);
        res.status(500).json({ message: "Đã có lỗi xảy ra khi lấy lịch sử hoạt động." });
    }
};

exports.isAdmin = async (req, res) => {
    const { userId, conversationId } = req.params;
    try {
        const isAdmin = await GroupService.isAdmin(userId, conversationId);
        res.status(200).json({ message: "Kiểm tra quyền quản trị thành công.", data: isAdmin });
    } catch (error) {
        console.error("Lỗi khi kiểm tra quyền quản trị:", error);
        res.status(500).json({ message: "Đã có lỗi xảy ra khi kiểm tra quyền quản trị." });
    }
};



exports.sendGroupInvite = async (req, res) => {
    const { conversationId, senderId, recipientId } = req.body;
    try {
        const invitation = await GroupService.sendGroupInvite(conversationId, senderId, recipientId);
        res.status(200).json({ message: "Lời mời tham gia nhóm đã được gửi thành công.", data: invitation });
    } catch (error) {
        console.error("Lỗi khi gửi lời mời tham gia nhóm:", error);
        res.status(500).json({ message: "Đã có lỗi xảy ra khi gửi lời mời tham gia nhóm." });
    }
};

exports.handleGroupInvite = async (req, res) => {
    const { invitationId, userId, status } = req.body;
    try {
        const result = await GroupService.handleGroupInvite(invitationId, userId, status);
        res.status(200).json({ message: "Đã xử lý lời mời tham gia nhóm.", data: result });
    } catch (error) {
        console.error("Lỗi khi xử lý lời mời:", error);
        res.status(500).json({ message: "Đã có lỗi xảy ra khi xử lý lời mời." });
    }
};


// Gửi tin nhắn trong nhóm
// Gửi tin nhắn trong nhóm
exports.sendGroupMessage = async (req, res) => {
    const { senderId, conversationId, content, file_url } = req.body;

    try {
        // Kiểm tra dữ liệu đầu vào
        if (!senderId || !conversationId || !content) {
            return res.status(400).json({
                message: "Thiếu thông tin cần thiết (senderId, conversationId, content).",
            });
        }

        // Gọi service để gửi tin nhắn trong nhóm
        const newMessage = await GroupService.sendGroupMessage(conversationId, senderId, content, file_url);

        return res.status(200).json({
            message: "Tin nhắn đã được gửi thành công",
            data: newMessage,
        });
    } catch (error) {
        console.error("Lỗi khi gửi tin nhắn nhóm:", error);

        // Trả về lỗi chi tiết hơn nếu có thể
        return res.status(500).json({
            message: "Đã có lỗi xảy ra khi gửi tin nhắn",
            error: error.message, // Trả về chi tiết lỗi cho client
        });
    }
};
