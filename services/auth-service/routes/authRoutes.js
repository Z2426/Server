const express = require('express');
const authController = require('../controllers/authController')
const router = express.Router();
router.post('/resgister', authController.register);
router.post('/login', authController.login);
router.post('/verifyToken', authController.verifyTokenController);
module.exports = router;

