const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");

// Nhóm các API quản lý nhóm
// Route để gỡ chặn thành viên trong nhóm
router.put('/unblock-member', groupController.unblockMember);
router.delete("/remove-member", groupController.removeMemberFromGroup);
router.put("/change-role", groupController.changeMemberRole);
router.put("/block-member", groupController.blockMemberInGroup);
router.get("/activity/:conversationId", groupController.getGroupActivityHistory);
router.post("/add-member", groupController.addMemberToGroup);
router.get("/admin/:userId/:conversationId", groupController.isAdmin);
router.post("/invite", groupController.sendGroupInvite);
router.post("/", groupController.createGroup);
router.post("/invite/response", groupController.handleGroupInvite);

module.exports = router;
