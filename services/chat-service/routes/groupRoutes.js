const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");

// Nhóm các API quản lý nhóm
router.post("/", groupController.createGroup);
router.delete("/remove-member", groupController.removeMemberFromGroup);
router.put("/change-role", groupController.changeMemberRole);
router.put("/block-member", groupController.blockMemberInGroup);
router.get("/activity/:conversationId", groupController.getGroupActivityHistory);
router.post("/add-member", groupController.addMemberToGroup);
router.get("/admin/:userId/:conversationId", groupController.isAdmin);
router.get("/messages/search/:conversationId", groupController.searchMessagesInGroup);
router.post("/invite", groupController.sendGroupInvite);
router.post("/invite/response", groupController.handleGroupInvite);
// router.post("/add-admin", groupController.addAdminToGroup);
// router.post("/remove-admin", groupController.removeAdminFromGroup);
//  gửi Tin nhắn nhóm
router.post("/message/group", groupController.sendGroupMessage);
module.exports = router;
