const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

router.post("/sendPersonalMessage", chatController.sendPersonalMessage);
router.post("/sendGroupMessage", chatController.sendGroupMessage);
router.get("/getUnreadMessages/:userId", chatController.getUnreadMessages);
router.post("/markMessageAsRead", chatController.markMessageAsRead);

module.exports = router;
