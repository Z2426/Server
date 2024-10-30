const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware')
const router = express.Router();
console.log(userController)
// Route để cập nhật thông tin đăng nhập (số lần đăng nhập thất bại và thời gian đăng nhập cuối)
router.put('/login-info', userController.updateLoginAttempts);
//get info by email
router.post('/find-email-user', userController.getUserByEmailWithPass);
// Verify account route
router.post('/verify', authMiddleware.verifyTokenMiddleware, userController.verifyAccount);
// mange password
router.put("/change-password", authMiddleware.verifyTokenMiddleware, userController.changePassword);
// Route to request a password reset
router.post('/request-password-reset', userController.requestPasswordReset);

// Route to reset the password
router.post('/reset-password', userController.resetPassword);
//follow
router.post('/follow-toggle/:followedId', authMiddleware.verifyTokenMiddleware, userController.toggleFollowUser);
// Get list of users this user is following
router.get("/following", authMiddleware.verifyTokenMiddleware, userController.getFollowing);
// Get list of followers for this user
router.get("/followers", authMiddleware.verifyTokenMiddleware, userController.getFollowers)
//mange friend
router.post("/friend-request/:userId", authMiddleware.verifyTokenMiddleware, userController.sendFriendRequest);
router.put("/friend-request", userController.updateFriendRequest);
router.get("/friend-requests", authMiddleware.verifyTokenMiddleware, userController.getFriendRequests);
// blocked
router.get('/toggle-block', authMiddleware.verifyTokenMiddleware, userController.getBlockedUsers)
router.post('/toggle-block/:userId', authMiddleware.verifyTokenMiddleware, userController.toggleBlockStatus)
// crud user
router.post('/', userController.createUser);
router.put('/', authMiddleware.verifyTokenMiddleware, userController.updateUser);
router.delete('/', authMiddleware.verifyTokenMiddleware, userController.deleteUser);
router.get('/:userId', userController.getUserById);
router.get('/', authMiddleware.verifyTokenMiddleware, userController.getAllUsers);
module.exports = router;
