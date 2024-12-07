const GroupService = require("../services/groupService");

/** ================================================
 * Member Management
 * ================================================ */

exports.addMemberToGroup = async (req, res) => {
    const { userId, groupId, newMembers } = req.body;
    try {
        const result = await GroupService.addMemberToGroup(userId, groupId, newMembers);
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error adding member:", error);
        return res.status(500).json({ message: "An error occurred while adding the member.", error: error.message });
    }
};

exports.removeMemberFromGroup = async (req, res) => {
    const { conversationId, adminId, memberId } = req.body;
    try {
        const updatedGroup = await GroupService.removeMemberFromGroup(conversationId, adminId, memberId);
        return res.status(200).json({ message: "Member removed from the group.", data: updatedGroup });
    } catch (error) {
        console.error("Error removing member from the group:", error);
        return res.status(500).json({ message: "An error occurred while removing the member." });
    }
};

exports.changeMemberRole = async (req, res) => {
    const { conversationId, adminId, memberId, newRole } = req.body;
    try {
        const updatedGroup = await GroupService.changeMemberRole(conversationId, adminId, memberId, newRole);
        return res.status(200).json({ message: "Member role changed.", data: updatedGroup });
    } catch (error) {
        console.error("Error changing member role:", error);
        return res.status(500).json({ message: "An error occurred while changing the role." });
    }
};

exports.blockMemberInGroup = async (req, res) => {
    const { conversationId, adminId, memberId } = req.body;
    try {
        const updatedGroup = await GroupService.blockMemberInGroup(conversationId, adminId, memberId);
        return res.status(200).json({ message: "Member has been blocked in the group.", data: updatedGroup });
    } catch (error) {
        console.error("Error blocking member:", error);
        return res.status(500).json({ message: "An error occurred while blocking the member." });
    }
};

exports.unblockMember = async (req, res) => {
    const { conversationId, adminId, memberId } = req.body;
    try {
        const updatedGroup = await GroupService.unblockMemberInGroup(conversationId, adminId, memberId);
        return res.status(200).json({ message: "Member has been unblocked.", data: updatedGroup });
    } catch (error) {
        console.error("Error unblocking member:", error);
        return res.status(500).json({ message: "An error occurred while unblocking the member." });
    }
};
/** ================================================
 * Group Management
 * ================================================ */


exports.createGroup = async (req, res) => {
    const { userId, groupName, groupDescription, members, isPrivate } = req.body;
    if (!Array.isArray(members)) {
        return res.status(400).json({ message: "Members must be an array." });
    }
    if (members.length + 1 < 3) {
        return res.status(400).json({ message: "The group must have at least 3 members." });
    }
    try {
        const group = await GroupService.createGroup(userId, groupName, groupDescription, members, isPrivate);
        return res.status(201).json({ message: "Group created successfully.", data: group });
    } catch (error) {
        console.error("Error creating group:", error);
        return res.status(500).json({ message: "An error occurred while creating the group.", error: error.message });
    }
};
exports.getGroupActivityHistory = async (req, res) => {
    const { conversationId } = req.params;
    try {
        const activityHistory = await GroupService.getGroupActivityHistory(conversationId);
        return res.status(200).json({ message: "Group activity history retrieved successfully.", data: activityHistory });
    } catch (error) {
        console.error("Error retrieving group activity history:", error);
        return res.status(500).json({ message: "An error occurred while retrieving group activity history." });
    }
};
exports.isAdmin = async (req, res) => {
    const { userId, conversationId } = req.params;
    try {
        const isAdmin = await GroupService.isAdmin(userId, conversationId);
        return res.status(200).json({ message: "Admin status check successful.", data: isAdmin });
    } catch (error) {
        console.error("Error checking admin status:", error);
        return res.status(500).json({ message: "An error occurred while checking admin status." });
    }
};
exports.sendGroupInvite = async (req, res) => {
    const { conversationId, senderId, recipientId } = req.body;
    try {
        const invitation = await GroupService.sendGroupInvite(conversationId, senderId, recipientId);
        return res.status(200).json({ message: "Group invitation sent successfully.", data: invitation });
    } catch (error) {
        console.error("Error sending group invite:", error);
        return res.status(500).json({ message: "An error occurred while sending the group invitation." });
    }
};
exports.handleGroupInvite = async (req, res) => {
    const { invitationId, userId, status } = req.body;
    try {
        const result = await GroupService.handleGroupInvite(invitationId, userId, status);
        return res.status(200).json({ message: "Group invitation processed.", data: result });
    } catch (error) {
        console.error("Error processing group invite:", error);
        return res.status(500).json({ message: "An error occurred while processing the group invitation." });
    }
};



