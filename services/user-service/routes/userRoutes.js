const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();
console.log(userController)
// Route để cập nhật thông tin đăng nhập (số lần đăng nhập thất bại và thời gian đăng nhập cuối)
router.put('/login-info', userController.updateLoginAttempts);
//get info by email
router.post('/find-email-user', userController.getUserByEmailWithPass);
// Verify account route
router.post('/verify', userController.verifyAccount);
// mange password
router.put("/change-password/:userId/", userController.changePassword);
// Route to request a password reset
router.post('/request-password-reset', userController.requestPasswordReset);

// Route to reset the password
router.post('/reset-password', userController.resetPassword);
//follow
router.post('/follow-toggle/:followedId', userController.toggleFollowUser);
// Get list of users this user is following
router.get("/following/:userId", userController.getFollowing);
// Get list of followers for this user
router.get("/followers/:userId", userController.getFollowers)
//mange friend
router.post("/:userId/friend-request", userController.sendFriendRequest);
router.put("/friend-request", userController.updateFriendRequest);
router.get("/friend-requests", userController.getFriendRequests);
// blocked
router.get('/toggle-block', userController.getBlockedUsers)
router.post('/toggle-block/:userId', userController.toggleBlockStatus)
// crud user
router.post('/', userController.createUser);
router.put('/:userId', userController.updateUser);
router.delete('/:userId', userController.deleteUser);
router.get('/:userId', userController.getUserById);
router.get('/', userController.getAllUsers);
module.exports = router;
