const Post = require('../models/postModel');

// Create a new post
exports.createPost = async (postData) => {
  const post = new Post(postData);
  return await post.save();
};

// Get all posts
exports.getAllPosts = async () => {
  return await Post.find();
};

// Update a post by ID
exports.updatePost = async (postId, updateData) => {
  return await Post.findByIdAndUpdate(postId, updateData, { new: true });
};

// Delete a post by ID
exports.deletePost = async (postId) => {
  return await Post.findByIdAndDelete(postId);
};
