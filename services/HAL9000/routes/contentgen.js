const express = require("express");
const handllerAI = require('../controllers/botcontroller')
const router = express.Router();
router.get("/ai-process", handllerAI.AIGenerationAndSearchController);
module.exports = router;
