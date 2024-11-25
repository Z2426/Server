// models/Post.js
const mongoose = require('mongoose');
const CommentSchema = require('./Comment').schema;

// Định nghĩa Post Schema
const PostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users', // Hoặc 'User' nếu bạn thay đổi tên mô hình 
        required: true
    }, // Người dùng đăng bài
    description: {
        type: String,
        required: true
    }, // Nội dung bài viết
    image: {
        type: String
    }, // Đường dẫn ảnh
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users' // Hoặc 'User' nếu bạn thay đổi tên mô hình 
    }], // Người dùng đã thích bài viết
    comments: [CommentSchema],  // Danh sách bình luận cho bài viết
    urlVideo: {
        type: String
    },
    visibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public'
    }, // Quyền xem bài viết
    specifiedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users' // Hoặc 'User' nếu bạn thay đổi tên mô hình 
    }], // Người dùng được chỉ định có thể xem
    viewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users' // Hoặc 'User' nếu bạn thay đổi tên mô hình 
    }], // Người dùng đã xem bài viết
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users' // Hoặc 'User' nếu bạn thay đổi tên mô hình 
    }], // Người dùng theo dõi bài viết
    categories: [{
        type: String
    }], // Loại hoặc danh mục của bài viết
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Post = mongoose.model("Post", PostSchema);
module.exports = Post;


