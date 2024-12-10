const express = require('express');
const userController = require('../controllers/userController');
const suggestFriends = require('../controllers/suggestFriends')
const authMiddleware = require('../middleware/authMiddleware')
const router = express.Router();
/** ================================================
 *                PASSWORD MANAGEMENT
 * ================================================ */
router.put('/change-password', authMiddleware.verifyTokenMiddleware, userController.changePassword); // Change password
router.post('/request-password-reset', userController.requestPasswordReset); // Request password reset
router.post('/reset-password', userController.resetPassword); // Reset password

/** ================================================
 *                ACCOUNT VERIFICATION
 * ================================================ */
router.post('/verify', authMiddleware.verifyTokenMiddleware, userController.verifyAccount); // Verify account

/** ================================================
 *                FRIEND MANAGEMENT
 * ================================================ */
router.post('/friend-request/:userId', authMiddleware.verifyTokenMiddleware, userController.sendFriendRequest); // Send friend request
router.put('/friend-request', authMiddleware.verifyTokenMiddleware, userController.updateFriendRequest); // Update friend request
router.get('/friend-requests', authMiddleware.verifyTokenMiddleware, userController.getFriendRequests); // Get friend requests
router.post('/friends', authMiddleware.verifyTokenMiddleware, userController.getFriends); // Get friends

/** ================================================
 *                INTERACT MANAGEMENT
 * ================================================ */

router.post('/follow-toggle/:followedId', authMiddleware.verifyTokenMiddleware, userController.toggleFollowUser); // Toggle follow
router.get('/following', authMiddleware.verifyTokenMiddleware, userController.getFollowing); // Get following
router.get('/followers', authMiddleware.verifyTokenMiddleware, userController.getFollowers); // Get followers

/** ================================================
 *                BLOCK MANAGEMENT
 * ================================================ */
router.get('/toggle-block', authMiddleware.verifyTokenMiddleware, userController.getBlockedUsers); // Get blocked users
router.post('/toggle-block/:userId', authMiddleware.verifyTokenMiddleware, userController.toggleBlockStatus); // Toggle block status

/** ================================================
 *                USER SEARCH & SUGGESTIONS
 * ================================================ */
router.get('/find-users', userController.finUserByInfo); // Find users by info
router.get('/search', userController.searchUsers); // Search users
router.post('/find-email-user', userController.getUserByEmailWithPass); // Find user by email
router.get('/suggested-friends', authMiddleware.verifyTokenMiddleware, suggestFriends.getSuggestedFriends); // Get suggested friends

/** ================================================
 *                BULK OPERATIONS
 * ================================================ */
router.get('/getUsersBulk', userController.getUsersBulk); // Get users in bulk
/** ================================================
 *                USER MANAGEMENT
 * ================================================ */
router.post('/', userController.createUser); // Create user
router.put('/', authMiddleware.verifyTokenMiddleware, userController.updateUser); // Update user
router.delete('/', authMiddleware.verifyTokenMiddleware, userController.deleteUser); // Delete user
router.get('/:userId', userController.getUserById); // Get user by ID
router.get('/', authMiddleware.verifyTokenMiddleware, userController.getAllUsers); // Get all users

router.put('/login-info', userController.updateLoginAttempts); // Update login attempts

module.exports = router;
