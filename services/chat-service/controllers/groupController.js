const GroupService = require("../services/groupService"); // Lấy dịch vụ từ service

// Gửi tin nhắn nhóm
exports.sendGroupMessage = async (req, res) => {
    const { senderId, groupId, content, file } = req.body;

    try {
        const newMessage = await GroupService.sendGroupMessage(senderId, groupId, content, file);
        if (!newMessage) {
            return res.status(400).json({ message: "Không thể gửi tin nhắn." });
        }
        res.status(200).json({ message: "Tin nhắn đã được gửi thành công.", data: newMessage });
    } catch (error) {
        console.error("Lỗi khi gửi tin nhắn nhóm:", error);
        res.status(500).json({ message: "Đã có lỗi xảy ra khi gửi tin nhắn." });
    }
};

// Tạo nhóm
exports.createGroup = async (req, res) => {
    const { userId, groupName, groupDescription, isPrivate } = req.body;

    try {
        const group = await GroupService.createGroup(userId, groupName, groupDescription, isPrivate);
        res.status(201).json({ message: "Nhóm đã được tạo thành công.", data: group });
    } catch (error) {
        console.error("Lỗi khi tạo nhóm:", error);
        res.status(500).json({ message: "Đã có lỗi xảy ra khi tạo nhóm." });
    }
};

// Xóa thành viên khỏi nhóm
exports.removeMemberFromGroup = async (req, res) => {
    const { conversationId, adminId, memberId } = req.body;

    try {
        const updatedGroup = await GroupService.removeMemberFromGroup(conversationId, adminId, memberId);
        res.status(200).json({ message: "Đã xóa thành viên khỏi nhóm.", data: updatedGroup });
    } catch (error) {
        console.error("Lỗi khi xóa thành viên khỏi nhóm:", error);
        res.status(500).json({ message: error.message });
    }
};

// Thay đổi quyền thành viên
exports.changeMemberRole = async (req, res) => {
    const { conversationId, adminId, memberId, newRole } = req.body;

    try {
        const updatedGroup = await GroupService.changeMemberRole(conversationId, adminId, memberId, newRole);
        res.status(200).json({ message: "Đã thay đổi quyền thành viên.", data: updatedGroup });
    } catch (error) {
        console.error("Lỗi khi thay đổi quyền thành viên:", error);
        res.status(500).json({ message: error.message });
    }
};

// Chặn thành viên khỏi nhóm
exports.blockMemberInGroup = async (req, res) => {
    const { conversationId, adminId, memberId } = req.body;

    try {
        const updatedGroup = await GroupService.blockMemberInGroup(conversationId, adminId, memberId);
        res.status(200).json({ message: "Đã chặn thành viên khỏi nhóm.", data: updatedGroup });
    } catch (error) {
        console.error("Lỗi khi chặn thành viên khỏi nhóm:", error);
        res.status(500).json({ message: error.message });
    }
};

// Lấy lịch sử hoạt động nhóm
exports.getGroupActivityHistory = async (req, res) => {
    const { conversationId } = req.params;

    try {
        const activities = await GroupService.getGroupActivityHistory(conversationId);
        res.status(200).json({ message: "Lịch sử hoạt động nhóm", data: activities });
    } catch (error) {
        console.error("Lỗi khi lấy lịch sử hoạt động nhóm:", error);
        res.status(500).json({ message: "Đã có lỗi xảy ra khi lấy lịch sử hoạt động nhóm." });
    }
};

// Thêm thành viên vào nhóm
exports.addMemberToGroup = async (req, res) => {
    const { conversationId, adminId, newMemberId } = req.body;

    try {
        const updatedGroup = await GroupService.addMemberToGroup(conversationId, adminId, newMemberId);
        res.status(200).json({ message: "Đã thêm thành viên vào nhóm.", data: updatedGroup });
    } catch (error) {
        console.error("Lỗi khi thêm thành viên vào nhóm:", error);
        res.status(500).json({ message: error.message });
    }
};

// Kiểm tra quyền quản trị viên
exports.isAdmin = async (req, res) => {
    const { userId, conversationId } = req.params;

    try {
        const isAdmin = await GroupService.isAdmin(userId, conversationId);
        res.status(200).json({ message: `User is ${isAdmin ? '' : 'not '}an admin.`, data: isAdmin });
    } catch (error) {
        console.error("Lỗi khi kiểm tra quyền quản trị viên:", error);
        res.status(500).json({ message: "Đã có lỗi xảy ra khi kiểm tra quyền quản trị viên." });
    }
};

// Tìm kiếm tin nhắn trong nhóm
exports.searchMessagesInGroup = async (req, res) => {
    const { conversationId } = req.params;
    const { searchTerm, limit, page } = req.query;

    try {
        const messages = await GroupService.searchMessagesInGroup(conversationId, searchTerm, limit, page);
        res.status(200).json({ message: "Tìm kiếm tin nhắn thành công.", data: messages });
    } catch (error) {
        console.error("Lỗi khi tìm kiếm tin nhắn trong nhóm:", error);
        res.status(500).json({ message: "Đã có lỗi xảy ra khi tìm kiếm tin nhắn." });
    }
};

// Gửi lời mời vào nhóm
exports.sendGroupInvite = async (req, res) => {
    const { senderId, conversationId, recipientId } = req.body;

    try {
        const invitation = await GroupService.sendGroupInvite(senderId, conversationId, recipientId);
        res.status(200).json({ message: "Lời mời đã được gửi.", data: invitation });
    } catch (error) {
        console.error("Lỗi khi gửi lời mời vào nhóm:", error);
        res.status(500).json({ message: error.message });
    }
};

// Xử lý lời mời vào nhóm
exports.handleGroupInvite = async (req, res) => {
    const { userId, invitationId, status } = req.body;

    try {
        const invitation = await GroupService.handleGroupInvite(userId, invitationId, status);
        res.status(200).json({ message: "Lời mời đã được xử lý.", data: invitation });
    } catch (error) {
        console.error("Lỗi khi xử lý lời mời vào nhóm:", error);
        res.status(500).json({ message: error.message });
    }
};

// Thêm admin vào nhóm
exports.addAdminToGroup = async (req, res) => {
    const { conversationId, userId } = req.body;

    try {
        await GroupService.addAdminToGroup(conversationId, userId);
        res.status(200).json({ message: "Đã thêm admin vào nhóm." });
    } catch (error) {
        console.error("Lỗi khi thêm admin vào nhóm:", error);
        res.status(500).json({ message: error.message });
    }
};

// Xóa admin khỏi nhóm
exports.removeAdminFromGroup = async (req, res) => {
    const { conversationId, userId } = req.body;

    try {
        await GroupService.removeAdminFromGroup(conversationId, userId);
        res.status(200).json({ message: "Đã xóa admin khỏi nhóm." });
    } catch (error) {
        console.error("Lỗi khi xóa admin khỏi nhóm:", error);
        res.status(500).json({ message: error.message });
    }
};
