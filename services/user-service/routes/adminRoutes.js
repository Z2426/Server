// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require('../middleware/authMiddleware')
/** ================================================
 *                REPORT MANAGEMENT
 * ================================================ */
router.get('/reported/posts', authMiddleware.verifyTokenMiddleware, authMiddleware.isAdmin, adminController.getReports); // Get reported posts
router.delete('/:postId/delete-violate', authMiddleware.verifyTokenMiddleware, authMiddleware.isAdmin, adminController.deletePostViolate); // Delete violating post
router.post('/:postId/approve', authMiddleware.verifyTokenMiddleware, authMiddleware.isAdmin, adminController.approvePost); // Approve reported post

/** ================================================
 *                USER MANAGEMENT
 * ================================================ */
router.put('/users/:id/toggle-status', authMiddleware.verifyTokenMiddleware, authMiddleware.isAdmin, adminController.toggleUserStatus); // Toggle user status
router.get('/users', authMiddleware.verifyTokenMiddleware, authMiddleware.isAdmin, adminController.getUsers); // Get all users
router.get('/users/:id', authMiddleware.verifyTokenMiddleware, authMiddleware.isAdmin, adminController.getUserById); // Get user by ID
router.put('/users/:id', authMiddleware.verifyTokenMiddleware, authMiddleware.isAdmin, adminController.updateUser); // Update user by ID
router.delete('/users/:id', authMiddleware.verifyTokenMiddleware, authMiddleware.isAdmin, adminController.deleteUser); // Delete user by ID


module.exports = router;
