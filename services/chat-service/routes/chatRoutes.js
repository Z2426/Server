const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

router.post("/personal", chatController.sendPersonalMessage);
router.post("/group", chatController.sendGroupMessage);

module.exports = router;
