// routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController'); // Đảm bảo đường dẫn này chính xác
const suggestPost = require('../controllers/suggestPost')
const authMiddleware = require('../middleware/authMiddleware'); // Middleware xác thực
//REPORT
// Route báo cáo bài post
router.post("/:postId/report", authMiddleware.verifyTokenMiddleware, postController.reportPost);
router.get("/reported", postController.getReports)
// Route để xóa bài post nếu vi phạm nguyên tắc
router.delete('/:postId/delete-violate', postController.DeletePostViolate);
// Route để gỡ bỏ báo cáo và giữ lại bài post
router.post('/:postId/approve', postController.approvePost);
// Route lấy danh sách bài post bị báo cáo (chỉ dành cho admin)
//router.get("/reported", authMiddleware.verifyTokenMiddleware, postController.getReportedPosts);
//SEARCH POST
router.get('/search', authMiddleware.verifyTokenMiddleware, postController.searchPosts);
//NEWSFEDS
router.get('/newsfeed', authMiddleware.verifyTokenMiddleware, suggestPost.getNewsfeed);
//HANDLE COMMENT
// Tạo bình luận hoặc phản hồi cho bài viết
router.post('/:postId/comment', authMiddleware.verifyTokenMiddleware, postController.createCommentOrReply);// query : ?commentId 
router.put('/:postId/comment/:commentId?', authMiddleware.verifyTokenMiddleware, postController.updateCommentOrReply);// query : ?replytId 
router.delete('/:postId/comment', authMiddleware.verifyTokenMiddleware, postController.deleteCommentOrReply);//querry ::commentId?/:replyId?
router.get('/:postId/comment/:commentId/replies', authMiddleware.verifyTokenMiddleware, postController.getRepliesByCommentId); // get reply cua comment
router.get('/:postId/comments', authMiddleware.verifyTokenMiddleware, postController.getCommentsByPostId);
//
//follow /unfollow post
router.put('/:postId/follow', authMiddleware.verifyTokenMiddleware, postController.followPost);
// Toggle like bài post
router.put('/:postId/like', authMiddleware.verifyTokenMiddleware, postController.toggleLikePost);
// danh sau bai viet da xem
router.put('/:postId/viewed', authMiddleware.verifyTokenMiddleware, postController.markPostAsViewed);
// Lay cac bai viet cua user
router.get('/user', authMiddleware.verifyTokenMiddleware, postController.getUserPosts);
// // // Lấy chi tiết bài viết theo ID
//router.get('/:postId', authMiddleware.verifyTokenMiddleware, postController.getPost);
// // // Cập nhật bài viết
router.put('/:postId', authMiddleware.verifyTokenMiddleware, postController.updatePost);
// // // Xóa bài viết
router.delete('/:postId', authMiddleware.verifyTokenMiddleware, postController.deletePost);
// // Tạo bài viết mới
router.post('/', authMiddleware.verifyTokenMiddleware, postController.createPost);
// // Xuất router
module.exports = router;

