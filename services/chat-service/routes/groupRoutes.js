const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");

// Gửi tin nhắn nhóm
router.post("/message/group", groupController.sendGroupMessage);

// Tạo nhóm
router.post("/group", groupController.createGroup);

// Xóa thành viên khỏi nhóm
router.delete("/group/remove-member", groupController.removeMemberFromGroup);

// Thay đổi quyền thành viên
router.put("/group/change-role", groupController.changeMemberRole);

// Chặn thành viên khỏi nhóm
router.put("/group/block-member", groupController.blockMemberInGroup);

// Lấy lịch sử hoạt động nhóm
router.get("/group/activity/:conversationId", groupController.getGroupActivityHistory);

// Thêm thành viên vào nhóm
router.post("/group/add-member", groupController.addMemberToGroup);

// Kiểm tra quyền quản trị viên
router.get("/group/admin/:userId/:conversationId", groupController.isAdmin);

// Tìm kiếm tin nhắn trong nhóm
router.get("/group/messages/search/:conversationId", groupController.searchMessagesInGroup);

// Gửi lời mời vào nhóm
router.post("/group/invite", groupController.sendGroupInvite);

// Xử lý lời mời vào nhóm
router.post("/group/invite/response", groupController.handleGroupInvite);

// Thêm admin vào nhóm
router.post("/group/add-admin", groupController.addAdminToGroup);

// Xóa admin khỏi nhóm
router.post("/group/remove-admin", groupController.removeAdminFromGroup);

module.exports = router;
