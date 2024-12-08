const mongoose = require('mongoose');
const CommentSchema = require('./Comment').schema;
const PostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    description: {
        type: String,
    },
    image: {
        type: String
    },
    urlVideo: {
        type: String
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId
    }],
    comments: [CommentSchema],
    visibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public'
    },
    specifiedUsers: [{
        type: mongoose.Schema.Types.ObjectId

    }],
    viewers: [{
        type: mongoose.Schema.Types.ObjectId
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId
    }],
    categories: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
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
PostSchema.index({ userId: 1 });
PostSchema.index({ categories: 1 });
PostSchema.index({ visibility: 1 });
PostSchema.index({ viewers: 1 });
const Post = mongoose.model("Post", PostSchema);
module.exports = Post;


