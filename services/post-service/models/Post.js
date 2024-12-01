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
    }, // Nội dung bài viết
    image: {
        type: String
    }, // Đường dẫn ảnh
    urlVideo: {
        type: String
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users' // Hoặc 'User' nếu bạn thay đổi tên mô hình 
    }], // Người dùng đã thích bài viết
    comments: [CommentSchema],  // Danh sách bình luận cho bài viết
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
    tags: [{
        type: String
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users' // Hoặc 'User' nếu bạn thay đổi tên mô hình 
    }], // Người dùng theo dõi bài viết
    categories: [{
        type: String
    }], // Loại hoặc danh mục của bài viết
    // Trạng thái kiểm duyệt
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'], // Các trạng thái
        default: 'pending'                        // Trạng thái mặc định là "pending" (Chờ duyệt)
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
// Tạo chỉ mục đơn (Single Indexes)
PostSchema.index({ userId: 1 });
PostSchema.index({ categories: 1 });
PostSchema.index({ status: 1 });
PostSchema.index({ createdAt: -1 });

// Tạo chỉ mục kết hợp (Compound Indexes)
PostSchema.index({ userId: 1, status: 1 });
PostSchema.index({ categories: 1, createdAt: -1 });
PostSchema.index({ followers: 1, visibility: 1, createdAt: -1 })
const Post = mongoose.model("Post", PostSchema);
module.exports = Post;


