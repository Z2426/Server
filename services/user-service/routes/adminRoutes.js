// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require('../middleware/authMiddleware')
//MANGE REPORT
// Route để lấy danh sách bài post bị báo cáo
router.get('/reported/posts', authMiddleware.verifyTokenMiddleware, authMiddleware.isAdmin, adminController.getReports);
// Route để xóa bài post nếu vi phạm nguyên tắc
router.delete('/:postId/delete-violate', authMiddleware.verifyTokenMiddleware, authMiddleware.isAdmin, adminController.deletePostViolate);
// Route để gỡ bỏ báo cáo và giữ lại bài post
router.post('/:postId/approve', authMiddleware.verifyTokenMiddleware, authMiddleware.isAdmin, adminController.approvePost);
//MAGE USER
router.put("/users/:id/toggle-status", authMiddleware.verifyTokenMiddleware, authMiddleware.isAdmin, adminController.toggleUserStatus);
router.get("/users", authMiddleware.verifyTokenMiddleware, authMiddleware.isAdmin, adminController.getUsers);
router.get("/users/:id", authMiddleware.verifyTokenMiddleware, authMiddleware.isAdmin, adminController.getUserById);
router.put("/users/:id", authMiddleware.verifyTokenMiddleware, authMiddleware.isAdmin, adminController.updateUser);
router.delete("/users/:id", authMiddleware.verifyTokenMiddleware, authMiddleware.isAdmin, adminController.deleteUser);

module.exports = router;
