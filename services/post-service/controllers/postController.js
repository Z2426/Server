const postService = require('../services/postService');
/** ================================================
 *                 Post Management
 * ================================================ */

exports.createPost = async (req, res) => {
  try {
    const postData = {
      userId: req.body.user.userId,
      ...req.body
    };
    const newPost = await postService.createPost(postData);
    return res.status(200).json({
      message: "Post created successfully",
      newPost: newPost
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getPost = async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await postService.getPostById(postId);
    return res.status(200).json(post);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const updateData = req.body;
    const updatedPost = await postService.updatePost(postId, updateData);
    if (!updatedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    return res.status(200).json({
      message: "Update success",
      updatedPost: updatedPost
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const deletedPost = await postService.deletePost(postId);
    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    return res.status(200).json({
      message: "Post deleted successfully",
      deletedPost: deletedPost
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/** ================================================
 *                Post Reporting & Approval
 * ================================================ */

exports.reportPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    const { userId } = req.body.user;
    const report = await postService.createReport(postId, userId, reason);
    return res.status(201).json({ message: "Report created successfully", report });
  } catch (error) {
    console.error("Error creating report:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reportedPosts = await postService.getReportedPosts();
    return res.json(reportedPosts);
  } catch (error) {
    console.error("Error fetching reported posts:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.approvePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const result = await postService.approvePost(postId);
    return res.json(result);
  } catch (error) {
    console.error("Error approving post:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deletePostViolate = async (req, res) => {
  try {
    const { postId } = req.params;
    const result = await postService.deletePostIfViolating(postId);
    return res.json(result);
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/** ================================================
 *                Post Comments & Replies
 * ================================================ */
exports.likeComentOrLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const { commentId, replyId } = req.body
    const currentUserId = req.body.user.userId;
    const result = await postService.toggleLikeCommentOrReply(postId, currentUserId, commentId, replyId);
    res.status(200).json({ success: true, message: 'Like toggled successfully.', data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createCommentOrReply = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body.user;
  const { comment } = req.body;
  const { commentId } = req.query;
  try {
    const updatedPost = await postService.createCommentOrReply(postId, userId, comment, commentId);
    return res.status(201).json({ message: 'Comment or reply created successfully', updatedPost });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updateCommentOrReply = async (req, res) => {
  const { postId } = req.params;
  const { comment } = req.body;
  const { userId } = req.body.user;
  const { commentId, replyId } = req.params;
  try {
    const updatedPost = await postService.updateCommentOrReply(postId, userId, comment, commentId, replyId);
    return res.status(200).json({
      message: 'Updated successfully',
      post: updatedPost,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || 'Error updating comment or reply',
    });
  }
};

exports.deleteCommentOrReply = async (req, res) => {
  const { postId } = req.params;
  const { replyId, commentId } = req.query;
  try {
    const post = await postService.deleteCommentOrReply(postId, commentId, replyId);
    return res.status(200).json({ message: 'Successfully deleted', post });
  } catch (error) {
    console.error(error);
    if (error.message === 'Post not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Comment or reply not found') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCommentsByPostId = async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  try {
    const comments = await postService.getCommentsByPostId(postId, parseInt(page), parseInt(limit));
    return res.status(200).json(comments);
  } catch (error) {
    console.error(error);
    if (error.message === 'Post not found') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRepliesByCommentId = async (req, res) => {
  const { postId, commentId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  try {
    const replies = await postService.getRepliesByCommentId(postId, commentId, parseInt(page), parseInt(limit));
    return res.status(200).json(replies);
  } catch (error) {
    console.error(error);
    if (error.message === 'Post not found' || error.message === 'Comment not found') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/** ================================================
 *                Post Interactions
 * ================================================ */

exports.followPost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body.user;
  try {
    const updatedPost = await postService.followPost(postId, userId);
    return res.status(200).json({ message: 'Follow/Unfollow post', updatedPost });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.toggleLikePost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body.user;
  try {
    const updatedPost = await postService.toggleLikePost(postId, userId);
    return res.status(200).json({ message: 'Toggled like for post', updatedPost });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.markPostAsViewed = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body.user;
  try {
    const updatedPost = await postService.markPostAsViewed(postId, userId);
    return res.status(200).json({ message: 'Post marked as viewed', updatedPost });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

/** ================================================
 *                User Posts
 * ================================================ */

exports.getUserPosts = async (req, res) => {
  try {
    const guestId = req.params.userId;
    const { userId } = req.body.user;
    const { page = 1, limit = 10 } = req.query;
    const isOwnPost = userId === guestId;
    const posts = await postService.getUserPosts(guestId, parseInt(page), parseInt(limit), isOwnPost);
    return res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
exports.searchPosts = async (req, res) => {
  const { keyword, page, limit, startDate, endDate, categories } = req.query;
  const { userId } = req.body.user;
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const filters = {};
  if (startDate && endDate) {
    filters.startDate = startDate;
    filters.endDate = endDate;
  }
  if (categories) {
    if (typeof categories === 'string') {
      filters.categories = categories.split(',').map((item) => item.trim());
    }
  }
  try {
    const result = await postService.searchPosts(userId, keyword, pageNum, limitNum, filters);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};