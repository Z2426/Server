const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const GroupActivity = require("../models/GroupActivity");
const Invitation = require("../models/Invitation");


/** ================================================
 * Member Management
 * ================================================ */

exports.removeMemberFromGroup = async (conversationId, adminId, memberId, reason = '') => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        throw new Error("Group not found");
    }
    if (!conversation.admins.includes(adminId)) {
        throw new Error("No permission to remove member");
    }
    const memberIndex = conversation.members.indexOf(memberId);
    if (memberIndex !== -1) {
        conversation.members.splice(memberIndex, 1);
        await conversation.save();

        await GroupActivity.create({
            groupId: conversationId,
            activityType: 'remove_member',
            performedBy: adminId,
            affectedUser: memberId,
            timestamp: new Date(),
            additionalInfo: reason,
        });
        return conversation;
    }
    throw new Error("Member not found in the group");
};
exports.addMemberToGroup = async (userId, groupId, newMembers) => {
    try {
        const group = await Conversation.findById(groupId);
        if (!group) {
            throw new Error("Group does not exist");
        }
        group.members.push(...newMembers);
        await group.save();
        newMembers.forEach(async (newMemberId) => {
            const groupActivity = new GroupActivity({
                groupId,
                activityType: 'add_member',
                performedBy: userId,
                affectedUser: newMemberId,
                additionalInfo: "Added member to the group",
            });
            await groupActivity.save();
        });

        return { success: true, message: "Members added successfully" };
    } catch (error) {
        throw new Error(`Error adding members to the group: ${error.message}`);
    }
};
exports.changeMemberRole = async (conversationId, adminId, memberId) => {
    const isAdminResult = await exports.isAdmin(adminId, conversationId);
    if (!isAdminResult) {
        throw new Error('You do not have permission to change roles.');
    }
    const group = await Conversation.findById(conversationId);
    if (!group) {
        throw new Error('Group not found.');
    }
    if (!group.members.includes(memberId)) {
        throw new Error('Member not found in this group.');
    }
    const isAlreadyAdmin = group.admins.includes(memberId);
    if (isAlreadyAdmin) {
        group.admins = group.admins.filter(admin => admin.toString() !== memberId);
    } else {
        group.admins.push(memberId);
    }
    const updatedGroup = await group.save();
    return updatedGroup;
};
exports.blockMemberInGroup = async (conversationId, adminId, memberId) => {
    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new Error("Group does not exist.");
        }
        if (!conversation.admins.includes(adminId)) {
            throw new Error("You do not have permission to block members in this group.");
        }
        if (!conversation.members.includes(memberId)) {
            throw new Error("Member does not exist in the group.");
        }
        if (conversation.blockedUsers && conversation.blockedUsers.includes(memberId)) {
            throw new Error("The member has already been blocked.");
        }
        if (!conversation.blockedUsers) {
            conversation.blockedUsers = [];
        }
        if (!conversation.members) {
            conversation.members = [];
        }
        conversation.blockedUsers.push(memberId);
        conversation.members = conversation.members.filter(member => member !== memberId);
        const updatedConversation = await conversation.save();
        const groupActivity = new GroupActivity({
            groupId: conversationId,
            activityType: 'block_member',
            performedBy: adminId,
            affectedUser: memberId,
            additionalInfo: "Blocked member in the group",
        });
        await groupActivity.save();

        return updatedConversation;
    } catch (error) {
        console.error("Error in blockMemberInGroup:", error);
        throw new Error(`Error blocking member: ${error.message}`);
    }
};
exports.unblockMemberInGroup = async (conversationId, adminId, memberId) => {
    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new Error("Group does not exist.");
        }
        if (!conversation.admins.includes(adminId)) {
            throw new Error("You do not have permission to unblock members in this group.");
        }
        if (!conversation.blockedUsers.includes(memberId)) {
            throw new Error("This member is not blocked.");
        }
        conversation.blockedUsers = conversation.blockedUsers.filter(member => member.toString() !== memberId.toString());
        conversation.members.push(memberId);
        const updatedConversation = await conversation.save();
        const groupActivity = new GroupActivity({
            groupId: conversationId,
            activityType: 'unblock_member',
            performedBy: adminId,
            affectedUser: memberId,
            additionalInfo: "Unblocked member in the group",
        });
        await groupActivity.save();
        return updatedConversation;
    } catch (error) {
        console.error("Error in unblockMemberInGroup:", error);
        throw new Error(`Error unblocking member: ${error.message}`);
    }
};
/** ================================================
 * Group Management
 * ================================================ */
exports.getGroupActivityHistory = async (groupId) => {
    return await GroupActivity.find({ groupId }).sort({ timestamp: -1 });
};

exports.handleGroupInvite = async (invitationId, userId, status) => {
    try {
        const invitation = await Invitation.findById(invitationId);
        console.log(invitation)
        if (!invitation || invitation.recipientId.toString() !== userId.toString()) {
            throw new Error("Invalid invitation");
        }
        invitation.status = status;
        await invitation.save();
        if (status === "accepted") {
            const conversation = await Conversation.findById(invitation.groupId);
            if (!conversation) {
                throw new Error("Group does not exist");
            }
            if (!conversation.members.includes(userId)) {
                conversation.members.push(userId);
                await conversation.save();
            }
        }
        return invitation;
    } catch (error) {
        console.error("Error processing the invitation:", error);
        throw new Error(`Error processing the invitation: ${error.message}`);
    }
}
exports.sendGroupInvite = async (conversationId, senderId, recipientId) => {
    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new Error("Group does not exist.");
        }
        if (conversation.members.includes(recipientId)) {
            throw new Error("Recipient is already a member of the group.");
        }
        const existingInvitation = await Invitation.findOne({
            groupId: conversationId,
            recipientId: recipientId,
            status: 'pending',
        });
        if (existingInvitation) {
            throw new Error("There is a pending invitation.");
        }
        const invitation = await Invitation.create({
            groupId: conversationId,
            senderId: senderId,
            recipientId: recipientId,
            status: 'pending',
        });
        return invitation;
    } catch (error) {
        console.error("Error sending the group invitation:", error);
        throw new Error(`Error sending the group invitation: ${error.message}`);
    }
};

exports.createGroup = async (userId, groupName, groupDescription, members, isPrivate) => {
    if (!Array.isArray(members)) {
        throw new Error("Members must be an array.");
    }
    if (members.length + 1 < 3) {
        throw new Error("The group must have at least 3 members.");
    }
    const group = new Conversation({
        name: groupName,
        description: groupDescription,
        isPrivate,
        members: [userId, ...members],
        admins: [userId],
        createdBy: userId,
        isGroup: true,
        type: "group"
    });
    await group.save();
    const groupActivity = new GroupActivity({
        groupId: group._id,
        activityType: 'update_group',
        performedBy: userId,
        affectedUser: userId,
        timestamp: new Date(),
        additionalInfo: 'Group created successfully',
    });
    await groupActivity.save();
    return group;
};
/** ================================================
 * Admin Check
 * ================================================ */

exports.isAdmin = async (userId, conversationId) => {
    const conversation = await Conversation.findById(conversationId);
    return conversation && conversation.admins.includes(userId);
};















