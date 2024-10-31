const Post = require('../models/Post');
const mongoose = require('mongoose');
const requestWithCircuitBreaker = require('../shared/utils/circuitBreaker.js');
const axios = require('axios'); // Import axios
// Hàm tìm kiếm bài viết theo từ khóa
exports.searchPosts = async (userId, keyword, page = 1, limit = 10) => {
  try {
    // Chuyển đổi từ khóa thành regex để tìm kiếm không phân biệt chữ hoa chữ thường
    const regex = new RegExp(keyword, 'i');

    // Tìm kiếm bài viết theo từ khóa và phân quyền
    const posts = await Post.find({
      $or: [
        { visibility: 'public', description: regex }, // Bài viết công khai
        { visibility: 'friends', description: regex, specifiedUsers: userId }, // Bài viết bạn bè có người dùng chỉ định
        { visibility: 'private', userId: userId, description: regex } // Bài viết riêng tư của chính người dùng
      ]
    })
      .sort({ createdAt: -1 }) // Sắp xếp bài viết theo thời gian tạo
      .skip((page - 1) * limit) // Phân trang
      .limit(limit); // Giới hạn số lượng bài viết trả về

    return {
      posts,
      totalPosts: posts.length,
      currentPage: page,
      totalPages: Math.ceil(posts.length / limit)
    };
  } catch (error) {
    console.error('Error searching posts:', error.message);
    throw new Error('Lỗi khi tìm kiếm bài viết');
  }
};
exports.getCommentsByPostId = async (postId, page = 1, limit = 10) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new Error('Bài viết không tìm thấy');
  }

  // Lấy bình luận với phân trang
  const comments = post.comments.slice((page - 1) * limit, page * limit);

  // Lấy danh sách userId từ các bình luận
  const userIds = [...new Set(comments.map(comment => comment.userId.toString()))];

  // Lấy thông tin người dùng một lần thông qua user service
  const userInfo = await requestWithCircuitBreaker(
    `${process.env.URL_USER_SERVICE}/getUsersBulk?userIds=${userIds.join(',')}`,
    'GET'
  );

  // Tạo bản đồ thông tin người dùng để dễ dàng truy xuất
  const userMap = userInfo.reduce((map, user) => {
    map[user._id] = user;
    return map;
  }, {});

  // Kết hợp thông tin người dùng với từng bình luận
  const commentsWithUserInfo = comments.map(comment => ({
    ...comment.toObject(),
    user: userMap[comment.userId.toString()],
  }));

  return {
    totalComments: post.comments.length,
    totalPages: Math.ceil(post.comments.length / limit),
    currentPage: page,
    comments: commentsWithUserInfo,
  };
};
exports.getRepliesByCommentId = async (postId, commentId, page = 1, limit = 5) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new Error('Bài viết không tìm thấy');
  }

  // Tìm bình luận theo commentId
  const comment = post.comments.id(commentId);
  if (!comment) {
    throw new Error('Bình luận không tìm thấy');
  }

  // Lấy phản hồi với phân trang
  const replies = comment.replies.slice((page - 1) * limit, page * limit);

  // Lấy danh sách userId từ các phản hồi
  const userIds = [...new Set(replies.map(reply => reply.userId.toString()))];

  // Gọi API user service để lấy thông tin người dùng một lần
  const userInfo = await requestWithCircuitBreaker(
    `${process.env.URL_USER_SERVICE}/getUsersBulk?userIds=${userIds.join(',')}`,
    'GET'
  );

  // Tạo bản đồ người dùng để dễ dàng truy xuất thông tin
  const userMap = userInfo.reduce((map, user) => {
    map[user._id] = user;
    return map;
  }, {});

  // Kết hợp thông tin người dùng vào từng phản hồi
  const repliesWithUserInfo = replies.map(reply => ({
    ...reply.toObject(),
    user: userMap[reply.userId.toString()],
  }));

  return {
    totalReplies: comment.replies.length,
    totalPages: Math.ceil(comment.replies.length / limit),
    currentPage: page,
    replies: repliesWithUserInfo,
  };
};
exports.deleteCommentOrReply = async (postId, commentId = null, replyId = null) => {
  const post = await Post.findById(postId);
  console.log(commentId, replyId)
  if (!post) {
    throw new Error('Bài viết không tìm thấy');
  }

  // Nếu có replyId, tìm bình luận và xóa phản hồi
  if (replyId) {
    const commentToUpdate = post.comments.find(comment =>
      comment.replies.some(reply => reply._id.toString() === replyId)
    );

    if (!commentToUpdate) {
      throw new Error('Bình luận không tìm thấy');
    }

    // Tìm phản hồi để xóa
    const replyIndex = commentToUpdate.replies.findIndex(reply => reply._id.toString() === replyId);
    if (replyIndex === -1) {
      throw new Error('Phản hồi không tìm thấy');
    }

    // Xóa phản hồi
    commentToUpdate.replies.splice(replyIndex, 1);
  }
  // Nếu không có replyId, xóa bình luận
  else if (commentId) {
    const commentIndex = post.comments.findIndex(comment => comment._id.toString() === commentId);
    if (commentIndex === -1) {
      throw new Error('Bình luận không tìm thấy');
    }

    // Xóa bình luận
    post.comments.splice(commentIndex, 1);
  } else {
    throw new Error('Cần cung cấp commentId hoặc replyId để xóa');
  }

  // Lưu bài viết sau khi xóa
  await post.save();

  return post; // Trả về bài viết đã được cập nhật
};
exports.updateCommentOrReply = async (postId, userId, comment, commentId = null, replyId = null) => {
  const post = await Post.findById(postId);
  console.log(commentId, replyId); // Kiểm tra commentId và replyId

  if (!post) {
    throw new Error('Bài viết không tìm thấy');
  }

  // Cập nhật phản hồi nếu có replyId
  if (replyId) {
    console.log("Cập nhật phản hồi");

    // Tìm bình luận chứa phản hồi
    const commentToUpdate = post.comments.find(comment =>
      comment.replies.some(reply => reply._id.toString() === replyId)
    );

    if (!commentToUpdate) {
      throw new Error('Bình luận không tìm thấy');
    }

    // Tìm phản hồi để cập nhật
    const replyToUpdate = commentToUpdate.replies.find(reply => reply._id.toString() === replyId);
    console.log("Phản hồi để cập nhật:", replyToUpdate);

    if (!replyToUpdate) {
      throw new Error('Phản hồi không tìm thấy');
    }

    // Kiểm tra xem userId có đúng với phản hồi không
    if (replyToUpdate.userId.toString() !== userId) {
      throw new Error('Bạn không có quyền cập nhật phản hồi này');
    }

    // Cập nhật nội dung phản hồi
    replyToUpdate.comment = comment; // Sử dụng biến comment đã được truyền vào hàm
    console.log("Nội dung phản hồi sau khi cập nhật:", replyToUpdate);
  }
  // Cập nhật bình luận nếu có commentId
  else if (commentId) {
    console.log("Cập nhật bình luận", commentId);

    const commentToUpdate = post.comments.id(commentId);

    if (!commentToUpdate) {
      throw new Error('Bình luận không tìm thấy');
    }

    // Kiểm tra xem userId có đúng với bình luận không
    if (commentToUpdate.userId.toString() !== userId) {
      throw new Error('Bạn không có quyền cập nhật bình luận này');
    }

    // Cập nhật nội dung bình luận
    commentToUpdate.comment = comment; // Sử dụng biến comment đã được truyền vào hàm
  } else {
    throw new Error('Cần cung cấp commentId hoặc replyId để cập nhật');
  }

  // Lưu bài viết sau khi cập nhật
  await post.save();

  return post; // Trả về bài viết đã cập nhật
};





exports.createCommentOrReply = async (postId, userId, commentText, commentId = null) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new Error('Bài viết không tìm thấy');
  }

  if (commentId) {
    // Nếu có commentId, tạo phản hồi
    const comment = post.comments.id(commentId);

    if (!comment) {
      throw new Error('Bình luận không tìm thấy');
    }

    comment.replies.push({ userId, comment: commentText });
  } else {
    // Nếu không có commentId, tạo bình luận mới
    post.comments.push({ userId, comment: commentText });
  }

  await post.save();

  return post;
};
exports.followPost = async (postId, userId) => {
  try {
    const post = await Post.findById(postId);

    if (!post) {
      throw new Error('Bài post không tìm thấy');
    }

    // Kiểm tra xem userId có trong mảng followers hay không
    const hasFollowed = post.followers.includes(userId);

    if (hasFollowed) {
      // Nếu đã follow, xóa userId khỏi mảng followers
      post.followers = post.followers.filter(id => id.toString() !== userId.toString());
    } else {
      // Nếu chưa follow, thêm userId vào mảng followers
      post.followers.push(userId);
    }

    // Lưu bài post đã cập nhật
    await post.save();
    return post;
  } catch (error) {
    throw new Error('Có lỗi xảy ra khi follow/unfollow bài post: ' + error.message);
  }
};
exports.toggleLikePost = async (postId, userId) => {
  try {
    const post = await Post.findById(postId);

    if (!post) {
      throw new Error('Bài post không tìm thấy');
    }

    // Kiểm tra xem userId có trong mảng likes hay không
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      // Nếu đã thích, xóa userId khỏi mảng likes
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Nếu chưa thích, thêm userId vào mảng likes
      post.likes.push(userId);
    }

    // Lưu bài post đã cập nhật
    await post.save();
    return post;
  } catch (error) {
    throw new Error('Có lỗi xảy ra khi toggle like bài post: ' + error.message);
  }
};
exports.markPostAsViewed = async (postId, userId) => {
  try {
    // Cập nhật bài post để thêm người đã xem
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $addToSet: { viewers: userId } }, // Sử dụng $addToSet để tránh trùng
      { new: true }
    );

    if (!updatedPost) {
      throw new Error('Bài post không tìm thấy');
    }

    return updatedPost;
  } catch (error) {
    throw new Error('Có lỗi xảy ra khi đánh dấu bài post là đã xem: ' + error.message);
  }
};
// Lấy danh sách bài post của người dùng với phân trang và thông tin chủ bài post
exports.getUserPosts = async (userId, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    // Lấy danh sách bài post với phân trang
    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    // Kiểm tra nếu không có bài post nào
    if (posts.length === 0) {
      return []; // Trả về mảng rỗng nếu không có bài post
    }
    // Lấy thông tin người dùng một lần
    const userInfo = await requestWithCircuitBreaker(
      `${process.env.URL_USER_SERVICE}/getUsersBulk?userIds=${userId}`,
      'GET'
    );
    // Gắn thông tin người dùng vào từng bài post
    const postsWithUserInfo = posts.map(post => ({
      ...post.toObject(),
      userDetails: userInfo || null, // Gán null nếu không tìm thấy thông tin người dùng
    }));
    console.log(postsWithUserInfo);
    return postsWithUserInfo;
  } catch (error) {
    console.error(error);
    throw new Error('Lỗi khi lấy danh sách bài post của người dùng');
  }
};

exports.getPostWithUserDetails = async (postId) => {
  try {
    // Retrieve the post from the database
    const post = await Post.findById(postId).lean();
    if (!post) throw new Error('Post not found');
    console.log(post.userId)
    // Gọi hàm circuit breaker để lấy thông tin người dùng
    const userDetails = await requestWithCircuitBreaker(
      `${process.env.URL_USER_SERVICE}/getUsersBulk?userIds=${post.userId}`, // Truyền userId trong URL
      'GET'
    );
    // Attach user details to the post
    post.userDetails = userDetails;
    console.log("User Details:", post.userDetails);
    console.log("Complete Post with User Details:", post);

    return post;
  } catch (error) {
    console.error("Error fetching post with user details:", error);
    throw new Error("Could not fetch post with user details");
  }
};


// Cập nhật danh sách specifiedUsers
exports.updateSpecifiedUsers = async (postId, userIds) => {
  try {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Cập nhật specifiedUsers với danh sách mới
    post.specifiedUsers = userIds; // Gán lại mảng specifiedUsers
    await post.save();

    return post; // Trả về bài post đã cập nhật
  } catch (error) {
    throw new Error('Error updating specified users: ' + error.message);
  }
};

// Tạo bài post với các trường cho phép
exports.createPost = async (postData) => {
  const allowedFields = ['userId', 'description', 'image', 'visibility']; // Các trường cho phép

  // Lọc dữ liệu để chỉ lấy các trường cho phép
  const filteredPostData = {};
  allowedFields.forEach(field => {
    if (postData[field] !== undefined) {
      filteredPostData[field] = postData[field];
    }
  });

  try {
    const post = new Post(filteredPostData);
    return await post.save();
  } catch (error) {
    throw new Error('Error creating post: ' + error.message);
  }
};


// Cập nhật bài post với các trường cho phép
exports.updatePost = async (postId, updateData) => {
  try {
    const allowedFields = ['description', 'image', 'visibility'];
    const filteredUpdateData = {};

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    });

    const updatedPost = await Post.findByIdAndUpdate(postId, filteredUpdateData, {
      new: true,
      runValidators: true
    });

    if (!updatedPost) {
      throw new Error('Post not found');
    }

    return updatedPost;
  } catch (error) {
    throw new Error('Error updating post: ' + error.message);
  }
};




// Xóa bài post
exports.deletePost = async (postId) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(postId);

    if (!deletedPost) {
      throw new Error('Post not found');
    }
    return deletedPost;
  } catch (error) {
    throw new Error('Error deleting post: ' + error.message);
  }
};
