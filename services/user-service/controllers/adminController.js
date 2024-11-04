// controllers/adminController.js
const adminService = require("../services/adminService");
//MANGE REPORT
// Lấy danh sách bài post bị báo cáo
exports.getReports = async (req, res) => {
    try {
        const reportedPosts = await adminService.getReportedPosts();
        console.log(reportedPosts)
        res.json(reportedPosts);
    } catch (error) {
        console.error("Error fetching reported posts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
// Xóa bài post nếu vi phạm nguyên tắc
exports.deletePostViolate = async (req, res) => {
    try {
        const { postId } = req.params;
        const result = await adminService.deletePostIfViolating(postId);
        res.json(result);
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
// Gỡ bỏ báo cáo và giữ lại bài post
exports.approvePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const result = await adminService.removeReportFromPost(postId);
        res.json({ "status": "approve success" });
    } catch (error) {
        console.error("Error approving post:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
//MANGE USER
// Lấy danh sách người dùng
exports.getUsers = async (req, res) => {
    try {
        const { verified, statusActive } = req.query;
        const filters = {};
        console.log(req.body.user)
        if (verified) filters.verified = verified === 'true';
        if (statusActive) filters.statusActive = statusActive === 'true';

        const users = await adminService.getUsers(filters);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users.", error: error.message });
    }
};
// Lấy chi tiết người dùng theo ID
exports.getUserById = async (req, res) => {
    try {
        const user = await adminService.getUserById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found." });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user.", error: error.message });
    }
};
// Cập nhật thông tin người dùng
exports.updateUser = async (req, res) => {
    try {
        const updates = req.body;
        const user = await adminService.updateUser(req.params.id, updates);
        if (!user) return res.status(404).json({ message: "User not found." });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Error updating user.", error: error.message });
    }
};
// Xóa người dùng
exports.deleteUser = async (req, res) => {
    try {
        const user = await adminService.deleteUser(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found." });
        res.json({ message: "User deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user.", error: error.message });
    }
};
exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        // Gọi hàm toggleUserStatus từ userService
        const updatedUser = await adminService.toggleUserStatus(id);
        res.json({
            message: `User has been ${updatedUser.statusActive ? 'unlocked' : 'locked'}`,
            user: updatedUser
        });
    } catch (error) {
        console.error("Error toggling user status:", error.message);
        res.status(404).json({ message: error.message === "User not found" ? error.message : "Internal server error" });
    }
};