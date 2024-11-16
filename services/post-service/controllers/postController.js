const postService = require('../services/postService');
// Xóa bài post nếu vi phạm nguyên tắc
exports.DeletePostViolate = async (req, res) => {
  try {
    const { postId } = req.params; // Lấy postId từ params
    console.log(postId)
    const result = await postService.deletePostIfViolating(postId);

    res.json(result);
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Gỡ bỏ báo cáo và giữ lại bài post
exports.approvePost = async (req, res) => {
  try {
    const { postId } = req.params; // Lấy postId từ params
    const result = await postService.removeReportFromPost(postId);

    res.json(result);
  } catch (error) {
    console.error("Error approving post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.reportPost = async (req, res) => {
  try {
    const { postId } = req.params
    const { reason } = req.body;
    const { userId } = req.body.user; // Giả sử bạn đã xác thực người dùng
    console.log(reason)
    // Tạo báo cáo
    const report = await postService.createReport(postId, userId, reason);
    res.status(201).json({ message: "Report created successfully", report });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reportedPosts = await postService.getReportedPosts();
    res.json(reportedPosts);
  } catch (error) {
    console.error("Error fetching reported posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }

};
// API Controller để tìm kiếm bài viết
exports.searchPosts = async (req, res) => {
  const { keyword, page, limit } = req.query;
  const { userId } = req.body.user; // Giả sử bạn đã lưu thông tin người dùng trong req.user

  try {
    const result = await postService.searchPosts(userId, keyword, parseInt(page), parseInt(limit));
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
exports.getCommentsByPostId = async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 10 } = req.query; // Lấy thông tin phân trang từ query
  console.log("PARRAMETER ", postId)
  try {
    const comments = await postService.getCommentsByPostId(postId, parseInt(page), parseInt(limit));
    return res.status(200).json(comments);
  } catch (error) {
    console.error(error);
    if (error.message === 'Bài viết không tìm thấy') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
exports.getRepliesByCommentId = async (req, res) => {
  const { postId, commentId } = req.params;
  const { page = 1, limit = 10 } = req.query; // Lấy thông tin phân trang từ query

  try {
    const replies = await postService.getRepliesByCommentId(postId, commentId, parseInt(page), parseInt(limit));
    return res.status(200).json(replies);
  } catch (error) {
    console.error(error);
    if (error.message === 'Bài viết không tìm thấy' || error.message === 'Bình luận không tìm thấy') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
exports.deleteCommentOrReply = async (req, res) => {
  const { postId } = req.params;
  const { replyId, commentId } = req.query; // Sử dụng query để lấy replyId

  try {
    const post = await postService.deleteCommentOrReply(postId, commentId, replyId);
    return res.status(200).json({ message: 'Xóa thành công', post });
  } catch (error) {
    console.error(error);
    if (error.message === 'Bài viết không tìm thấy') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Bình luận không tìm thấy' || error.message === 'Phản hồi không tìm thấy') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
exports.updateCommentOrReply = async (req, res) => {
  const { postId } = req.params;
  const { comment } = req.body;
  const { userId } = req.body.user
  const { commentId, replyId } = req.params


  try {
    const updatedPost = await postService.updateCommentOrReply(postId, userId, comment, commentId, replyId);
    res.status(200).json({
      message: 'Cập nhật thành công',
      post: updatedPost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || 'Có lỗi xảy ra khi cập nhật bình luận hoặc phản hồi',
    });
  }
};

exports.createCommentOrReply = async (req, res) => {
  const { postId } = req.params; // ID bài viết
  const { userId } = req.body.user; // Lấy userId từ middleware xác thực
  const { comment } = req.body; // Nội dung bình luận
  const { commentId } = req.query; // ID bình luận nếu có
  try {
    const updatedPost = await postService.createCommentOrReply(postId, userId, comment, commentId);
    res.status(201).json({ message: 'Tạo bình luận hoặc phản hồi thành công', updatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
exports.followPost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body.user; // Giả sử bạn đã lưu userId trong req.user sau khi xác thực

  try {
    const updatedPost = await postService.followPost(postId, userId);
    res.status(200).json({ message: 'Đã follow/unfollow bài post', updatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
exports.toggleLikePost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body.user; // Giả sử bạn đã lưu userId trong req.user sau khi xác thực
  try {
    const updatedPost = await postService.toggleLikePost(postId, userId);
    res.status(200).json({ message: 'Đã toggle like bài post', updatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
//danh sau da xem bai post
exports.markPostAsViewed = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body.user; // Giả sử bạn đã lưu userId trong req.user sau khi xác thực

  try {
    const updatedPost = await postService.markPostAsViewed(postId, userId);
    res.status(200).json({ message: 'Đã đánh dấu bài post là đã xem', updatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
// Controller lấy danh sách bài post của người dùng
exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId
    console.log(userId)
    const { page = 1, limit = 10 } = req.query; // Dùng query params để phân trang
    const posts = await postService.getUserPosts(userId, parseInt(page), parseInt(limit));
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}
exports.getPost = async (req, res) => {
  const { postId } = req.params;
  console.log(postId)
  try {
    const post = await postService.getPostById(postId);
    return res.status(200).json(post);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
// Cập nhật danh sách specifiedUsers
exports.updateSpecifiedUsers = async (req, res) => {
  const { postId } = req.params;
  const { userIds } = req.body; // Mảng userIds để cập nhật

  try {
    const updatedPost = await specifiedUsersService.updateSpecifiedUsers(postId, userIds);
    return res.status(200).json({ message: 'Specified users updated successfully', post: updatedPost });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating specified users: ' + error.message });
  }
};
// Tạo bài post
exports.createPost = async (req, res) => {
  try {
    const postData = {
      userId: req.body.user.userId, // Giả sử user đã được xác thực
      ...req.body // Các thuộc tính khác từ request body
    };
    const newPost = await postService.createPost(postData);
    return res.status(200).json({
      message: "created success",
      newPost: newPost
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Cập nhật bài post
exports.updatePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const updateData = req.body; // Dữ liệu cần cập nhật
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



// Xóa bài post
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const deletedPost = await postService.deletePost(postId);
    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    return res.status(200).json({
      message: "delete success",
      deletePost: deletedPost
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};
