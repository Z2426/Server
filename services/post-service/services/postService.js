const Post = require('../models/Post');
const Report = require('../models/reportModel.js')
const mongoose = require('mongoose');
const requestWithCircuitBreaker = require('../shared/utils/circuitBreaker.js');
const { sendToQueue, } = require("../shared/redis/redisClient");
/** ================================================
 *                Post Management
 * ================================================ */
exports.getPostById = async (postId) => {
  try {
    // Tìm bài post theo id
    const post = await Post.findById(postId)
    if (!post) {
      throw new Error('Post not found');
    }
    return post;
  } catch (error) {
    throw error; // Ném lỗi ra ngoài để controller xử lý
  }
};
exports.searchPosts = async (userId, keyword, page = 1, limit = 10, filters = {}) => {
  try {
    const regex = new RegExp(keyword, 'i');
    const query = {
      $or: [
        { visibility: 'public', description: regex },
        { visibility: 'friends', description: regex, specifiedUsers: userId },
        { visibility: 'private', userId: userId, description: regex }
      ]
    };
    if (filters.categories && Array.isArray(filters.categories)) {
      query.categories = { $in: filters.categories };
    }
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const totalPosts = await Post.countDocuments(query);
    return {
      posts,
      totalPosts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit)
    };
  } catch (error) {
    console.error('Error searching posts:', error.message);
    throw new Error('Error searching posts:', error.message);
  }
};
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
exports.updatePost = async (postId, updateData) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(postId, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedPost) {
      throw new Error('Post not found');
    }

    var data = {
      'user_id': updatedPost.userId,
      'post_id': updatedPost._id,
      'text': updatedPost.description,
      'image_url': updatedPost.image
    };
    sendToQueue('task_queue_suggest_service', 'suggest_friend_by_image', data);
    sendToQueue('content_processing_queue', 'checkContentSensitivity', data);

    return updatedPost;
  } catch (error) {
    throw new Error('Error updating post: ' + error.message);
  }
};
exports.createPost = async (postData) => {
  try {
    const post = new Post(postData); // Tạo bài post trực tiếp từ postData
    const newPost = await post.save();

    var data = {
      'user_id': newPost.userId,
      'post_id': newPost._id,
      'text': newPost.description,
      'image_url': newPost.image
    };
    sendToQueue('task_queue_suggest_service', 'suggest_friend_by_image', data);
    sendToQueue('content_processing_queue', 'checkContentSensitivity', data);

    return newPost;
  } catch (error) {
    throw new Error('Error creating post: ' + error.message);
  }
};
exports.getUserPosts = async (userId, page = 1, limit = 10, isOwnPost = false) => {
  try {
    const skip = (page - 1) * limit;
    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    if (posts.length === 0) {
      return [];
    }
    const filteredPosts = posts.filter(post => {
      if (!isOwnPost && post.status === 'rejected') {
        return false;
      }
      return true;
    });
    if (filteredPosts.length === 0) {
      return [];
    }
    const userInfo = await requestWithCircuitBreaker(
      `${process.env.URL_USER_SERVICE}/getUsersBulk?userIds=${userId}`,
      'GET'
    );
    const postsWithUserInfo = filteredPosts.map(post => ({
      ...post.toObject(),
      userDetails: userInfo || null,
    }));
    return postsWithUserInfo;
  } catch (error) {
    console.error(error);
    throw new Error('Error fetching the user\'s post list');
  }
};
exports.getPostWithUserDetails = async (postId) => {
  try {
    const post = await Post.findById(postId).lean();
    if (!post) throw new Error('Post not found');
    console.log(post.userId)
    const userDetails = await requestWithCircuitBreaker(
      `${process.env.URL_USER_SERVICE}/getUsersBulk?userIds=${post.userId}`,
      'GET'
    );
    post.userDetails = userDetails;
    console.log("User Details:", post.userDetails);
    console.log("Complete Post with User Details:", post);
    return post;
  } catch (error) {
    console.error("Error fetching post with user details:", error);
    throw new Error("Could not fetch post with user details");
  }
}

/** ================================================
 *                Comment and Reply Management
 * ================================================ */
exports.getCommentsByPostId = async (postId, page = 1, limit = 10) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new Error('Post not found');
  }
  const comments = post.comments.slice((page - 1) * limit, page * limit);
  const userIds = [...new Set(comments.map(comment => comment.userId.toString()))];
  const userInfo = await requestWithCircuitBreaker(
    `${process.env.URL_USER_SERVICE}/getUsersBulk?userIds=${userIds.join(',')}`,
    'GET'
  );
  const userMap = userInfo.reduce((map, user) => {
    map[user._id] = user;
    return map;
  }, {});
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
    throw new Error('Post not found');
  }
  const comment = post.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  const replies = comment.replies.slice((page - 1) * limit, page * limit);
  const userIds = [...new Set(replies.map(reply => reply.userId.toString()))];
  const userInfo = await requestWithCircuitBreaker(
    `${process.env.URL_USER_SERVICE}/getUsersBulk?userIds=${userIds.join(',')}`,
    'GET'
  );
  const userMap = userInfo.reduce((map, user) => {
    map[user._id] = user;
    return map;
  }, {});
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
    throw new Error('Post not found');
  }
  if (replyId) {
    const commentToUpdate = post.comments.find(comment =>
      comment.replies.some(reply => reply._id.toString() === replyId)
    );
    if (!commentToUpdate) {
      throw new Error('Comment not found');
    }
    const replyIndex = commentToUpdate.replies.findIndex(reply => reply._id.toString() === replyId);
    if (replyIndex === -1) {
      throw new Error('Rely not found');
    }
    commentToUpdate.replies.splice(replyIndex, 1);
  }
  else if (commentId) {
    const commentIndex = post.comments.findIndex(comment => comment._id.toString() === commentId);
    if (commentIndex === -1) {
      throw new Error('Comment not found');
    }
    post.comments.splice(commentIndex, 1);
  } else {
    throw new Error('please provide id for delete');
  }
  await post.save();

  return post;
};
exports.updateCommentOrReply = async (postId, userId, comment, commentId = null, replyId = null) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new Error('Post not found');
  }
  if (replyId) {
    console.log("Update reply");
    const commentToUpdate = post.comments.find(comment =>
      comment.replies.some(reply => reply._id.toString() === replyId)
    );
    if (!commentToUpdate) {
      throw new Error('Comment not found');
    }
    const replyToUpdate = commentToUpdate.replies.find(reply => reply._id.toString() === replyId);
    console.log("Rely to update", replyToUpdate);
    if (!replyToUpdate) {
      throw new Error('reply not found');
    }
    if (replyToUpdate.userId.toString() !== userId) {
      throw new Error('You do not have permission to update this response');
    }
    replyToUpdate.comment = comment;
  }
  else if (commentId) {
    const commentToUpdate = post.comments.id(commentId);
    if (!commentToUpdate) {
      throw new Error('comment not  found');
    }
    if (commentToUpdate.userId.toString() !== userId) {
      throw new Error('You do not have permission to update this response');
    }
    commentToUpdate.comment = comment;
  } else {
    throw new Error('Need to provide commentId or replyId to update');
  }
  await post.save();
  return post;
};
exports.createCommentOrReply = async (postId, userId, commentText, commentId = null) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new Error('Post not found');
  }
  if (commentId) {
    const comment = post.comments.id(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }
    comment.replies.push({ userId, comment: commentText });
  } else {
    post.comments.push({ userId, comment: commentText });
  }
  await post.save();
  return post;
};
exports.toggleLikeCommentOrReply = async (postId, userId, commentId, replyId = null) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new Error('Post not found');
  }
  const comment = post.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  if (replyId) {
    const reply = comment.replies.id(replyId);
    if (!reply) {
      throw new Error('Reply not found');
    }
    const likeIndex = reply.likes.indexOf(userId);
    if (likeIndex > -1) {
      reply.likes.splice(likeIndex, 1);
    } else {
      reply.likes.push(userId);
    }
  } else {
    const likeIndex = comment.likes.indexOf(userId);
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(userId);
    }
  }
  await post.save();
  return post;
};
exports.followPost = async (postId, userId) => {
  try {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }
    const hasFollowed = post.followers.includes(userId);
    if (hasFollowed) {
      post.followers = post.followers.filter(id => id.toString() !== userId.toString());
    } else {
      post.followers.push(userId);
    }
    await post.save();
    return post;
  } catch (error) {
    throw new Error('ERROR by follow/unfollow post: ' + error.message);
  }
};
exports.toggleLikePost = async (postId, userId) => {
  try {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }
    await post.save();
    return post;
  } catch (error) {
    throw new Error('An error occurred while toggling like for the post: ' + error.message);
  }
};

/** ================================================
 *                Report Management
 * ================================================ */
exports.approvePost = async (postId) => {
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return { message: "Post not found" };
    }
    post.status = 'approved';
    await post.save();
    await Report.deleteMany({ postId: postId });
    return {
      message: "Post has been approved and reports have been removed."
    };
  } catch (error) {
    console.error('Error while approving post:', error);
    return { message: "An error occurred while processing the request." };
  }
};
exports.deletePostIfViolating = async (postId) => {
  const deletedPost = await Post.findByIdAndDelete(postId);
  if (!deletedPost) {
    throw new Error('Post not found');
  }
  await Report.deleteMany({ postId: postId });

  return { message: "Post has been deleted due to violation of guidelines.", post: deletedPost };
};
exports.getReportedPosts = async () => {
  return await Report.aggregate([
    {
      $group: {
        _id: '$postId',
        count: { $sum: 1 },
        userIds: { $addToSet: '$userId' },
        reasons: { $push: '$reason' },
        createdAt: { $first: '$createdAt' }
      }
    },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: '_id',
        as: 'post'
      }
    },
    {
      $unwind: { path: '$post', preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        _id: 0,
        postId: '$_id',
        postDescription: '$post.description',
        postImage: '$post.image',
        reportCount: '$count',
        userIds: '$userIds',
        reasons: '$reasons',
        createdAt: '$createdAt'
      }
    }
  ]);
};
exports.createReport = async (postId, userId, reason, isSensitive = false) => {
  try {
    const postExists = await Post.findById(postId);
    if (!postExists) {
      throw new Error('Post does not exist');
    }
    const report = new Report({ postId, userId, reason });
    await report.save();
    console.log(`Report for post ${postId} by user ${userId} has been saved.`);
    const reportCount = await Report.countDocuments({ postId: postId });
    console.log(`Total reports for post ${postId}: ${reportCount}`);
    if (reportCount > 10) {
      await Post.updateOne(
        { _id: postId },
        { $set: { status: 'rejected', visibility: false } }
      );
      console.log(`Post ${postId} has been rejected and hidden from the system.`);
    }
    if (isSensitive) {
      await Post.updateOne(
        { _id: postId },
        { $set: { status: 'rejected' } }
      );
      console.log(`Post ${postId} has violated sensitive content guidelines and has been handled.`);
    }
    return report;
  } catch (error) {
    console.error('Error creating the report:', error);
    throw error;
  }
};
/** ================================================
 *                OTHER INTERACT
 * ================================================ */
exports.markPostAsViewed = async (postId, userId) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $addToSet: { viewers: userId } },
      { new: true }
    );

    if (!updatedPost) {
      throw new Error('Post not found');
    }
    console.log("Update successful");
    return updatedPost;
  } catch (error) {
    throw new Error('An error occurred while marking the post as viewed: ' + error.message);
  }
};
// Cập nhật danh sách specifiedUsers
exports.updateSpecifiedUsers = async (postId, userIds) => {
  try {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }
    post.specifiedUsers = userIds;
    await post.save();
    return post;
  } catch (error) {
    throw new Error('Error updating specified users: ' + error.message);
  }
};




















