const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");

/** ================================================
 * Group Membership Management Routes
 * ================================================ */

// Add a new member to the group
router.post("/add-member", groupController.addMemberToGroup);

// Remove a member from the group
router.delete("/remove-member", groupController.removeMemberFromGroup);

// Block a member in the group
router.put("/block-member", groupController.blockMemberInGroup);

// Unblock a member in the group
router.put('/unblock-member', groupController.unblockMember);

// Change a member's role in the group
router.put("/change-role", groupController.changeMemberRole);


/** ================================================
 * Group Activity Routes
 * ================================================ */

// Get group activity history by conversation ID
router.get("/activity/:conversationId", groupController.getGroupActivityHistory);


/** ================================================
 * Group Invitation Routes
 * ================================================ */

// Send an invitation to join the group
router.post("/invite", groupController.sendGroupInvite);

// Handle group invite responses
router.post("/invite/response", groupController.handleGroupInvite);


/** ================================================
 * Admin Management Routes
 * ================================================ */

// Check if a user is an admin of the group
router.get("/admin/:userId/:conversationId", groupController.isAdmin);


/** ================================================
 * Group Creation Routes
 * ================================================ */

// Create a new group
router.post("/", groupController.createGroup);

module.exports = router;
