// routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController'); // Ensure this path is correct
const suggestPost = require('../controllers/suggestPost');
const authMiddleware = require('../middleware/authMiddleware'); // Authentication middleware
/** ================================================
 *              REPORT AND VIOLATION MANAGEMENT
 * ================================================ */
// Report a post
router.post("/:postId/report", authMiddleware.verifyTokenMiddleware, postController.reportPost);
// Get all reported posts
router.get("/reported", postController.getReports);
// Delete a post if it violates rules
router.delete('/:postId/delete-violate', postController.deletePostViolate);
// Approve a post and remove its report
router.post('/:postId/approve', postController.approvePost);
/** ================================================
 *               SEARCH AND POST MANAGEMENT
 * ================================================ */
// Search posts
router.get('/search', authMiddleware.verifyTokenMiddleware, postController.searchPosts);
// Get newsfeed (personalized content)
router.get('/newsfeed', authMiddleware.verifyTokenMiddleware, suggestPost.getNewsfeed);
/** ================================================
 *                   COMMENT MANAGEMENT
 * ================================================ */
// Create a comment or a reply on a post
router.post('/:postId/comment', authMiddleware.verifyTokenMiddleware, postController.createCommentOrReply); // query: ?commentId
// Update a comment or reply
router.put('/:postId/comment/:commentId?', authMiddleware.verifyTokenMiddleware, postController.updateCommentOrReply); // query: ?replytId
// Delete a comment or reply
router.delete('/:postId/comment', authMiddleware.verifyTokenMiddleware, postController.deleteCommentOrReply); // query: commentId?/:replyId?
// Get replies for a specific comment
router.get('/:postId/comment/:commentId/replies', authMiddleware.verifyTokenMiddleware, postController.getRepliesByCommentId);
// Get all comments for a post
router.get('/:postId/comments', authMiddleware.verifyTokenMiddleware, postController.getCommentsByPostId);
/** ================================================
 *              FOLLOW, LIKE, AND VIEW POST
 * ================================================ */

// Follow a post
router.put('/:postId/follow', authMiddleware.verifyTokenMiddleware, postController.followPost);
// Toggle like for a post
router.put('/:postId/like', authMiddleware.verifyTokenMiddleware, postController.toggleLikePost);
//TOGLE LIKE COMMENT
router.put('/:postId/likecomment', authMiddleware.verifyTokenMiddleware, postController.likeComentOrLike);
// Mark a post as viewed
router.put('/:postId/viewed', authMiddleware.verifyTokenMiddleware, postController.markPostAsViewed);
/** ================================================
 *               USER'S POSTS MANAGEMENT
 * ================================================ */
// Get all posts by a specific user
router.get('/user/:userId', authMiddleware.verifyTokenMiddleware, postController.getUserPosts);
/** ================================================
 *               POST DETAILS MANAGEMENT
 * ================================================ */
// Get details of a post by its ID
router.get('/:postId', authMiddleware.verifyTokenMiddleware, postController.getPost);
// Update a post
router.put('/:postId', authMiddleware.verifyTokenMiddleware, postController.updatePost);
// Delete a post
router.delete('/:postId', authMiddleware.verifyTokenMiddleware, postController.deletePost);
// Create a new post
router.post('/', authMiddleware.verifyTokenMiddleware, postController.createPost);


// Export the router
module.exports = router;
