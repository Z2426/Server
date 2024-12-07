const adminService = require("../services/adminService");
/** ================================================
 *                MAGE REPORT
 * ================================================ */

// Route to get a list of reported posts
exports.getReports = async (req, res) => {
    try {
        const reportedPosts = await adminService.getReportedPosts();
        return res.json(reportedPosts);
    } catch (error) {
        console.error("Error fetching reported posts:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Route to delete a post if it violates the rules
exports.deletePostViolate = async (req, res) => {
    try {
        const { postId } = req.params;
        const result = await adminService.deletePostIfViolating(postId);
        return res.json(result);
    } catch (error) {
        console.error("Error deleting post:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Route to approve a post by removing the report and keeping the post
exports.approvePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const result = await adminService.removeReportFromPost(postId);
        return res.json({ "status": "approve success", "result": result });
    } catch (error) {
        console.error("Error approving post:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/** ================================================
 *                MAGE USER
 * ================================================ */

// Route to get a list of users with optional filters
exports.getUsers = async (req, res) => {
    try {
        const { verified, statusActive } = req.query;
        const filters = {};
        if (verified) filters.verified = verified === 'true';
        if (statusActive) filters.statusActive = statusActive === 'true';
        const users = await adminService.getUsers(filters);
        return res.json(users);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching users.", error: error.message });
    }
};
// Route to get user details by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await adminService.getUserById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found." });
        return res.json(user);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching user.", error: error.message });
    }
};
// Route to update user information
exports.updateUser = async (req, res) => {
    try {
        const updates = req.body;
        const user = await adminService.updateUser(req.params.id, updates);
        if (!user) return res.status(404).json({ message: "User not found." });
        return res.json(user);
    } catch (error) {
        return res.status(500).json({ message: "Error updating user.", error: error.message });
    }
};
// Route to delete a user
exports.deleteUser = async (req, res) => {
    try {
        const user = await adminService.deleteUser(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found." });
        return res.json({ message: "User deleted successfully." });
    } catch (error) {
        return res.status(500).json({ message: "Error deleting user.", error: error.message });
    }
};
// Route to toggle user status (lock/unlock)
exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedUser = await adminService.toggleUserStatus(id);
        return res.json({
            message: `User has been ${updatedUser.statusActive ? 'unlocked' : 'locked'}`,
            user: updatedUser
        });
    } catch (error) {
        console.error("Error toggling user status:", error.message);
        return res.status(500).json({ message: error.message === "User not found" ? error.message : "Internal server error" });
    }
};
