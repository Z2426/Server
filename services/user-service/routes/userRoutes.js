const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();
console.log(userController)
router.post('/', userController.createUser);
router.put('/:userId', userController.updateUser);
router.delete('/:userId', userController.deleteUser);
router.get('/:userId', userController.getUserById);
router.get('/', userController.getAllUsers);
module.exports = router;
