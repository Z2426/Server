
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First Name is required!"]
  },
  lastName: {
    type: String,
    required: [true, "Last Name is required"]
  },
  email: {
    type: String,
    required: [true, "Email is required!"],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password length should be greater than 6 characters"],
    select: false
  },
  location: { type: String },
  profileUrl: { type: String },
  cover_photo: { type: String },
  profession: { type: String },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'], // Phân loại giới tính
    default: 'prefer_not_to_say'
  },
  birthDate: {
    type: Date,
    validate: {
      validator: function (value) {
        return value < Date.now();
      },
      message: "Birth date cannot be in the future!"
    }
  },
  friends: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
  followers: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
  following: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
  blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
  views: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
  verified: { type: Boolean, default: true },
  workplace: { type: String },
  role: {
    type: String,
    enum: ['User', 'Admin'],
    default: 'User'
  },
  statusActive: {
    type: Boolean,
    default: true
  },
  friendRequests: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    },
  ],
  loginAttempts: { type: Number, default: 0 },
  lastLogin: { type: Date },
}, {
  timestamps: true
});

// const userSchema = new mongoose.Schema({
//   firstName: {
//     type: String,
//     required: [true, "First Name is required!"]
//   },
//   lastName: {
//     type: String,
//     required: [true, "Last Name is required"]
//   },
//   email: {
//     type: String,
//     required: [true, "Email is required!"],
//     unique: true,
//     lowercase: true,
//     match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
//   },
//   password: {
//     type: String,
//     required: [true, "Password is required"],
//     minlength: [6, "Password length should be greater than 6 characters"],
//     select: false
//   },
//   location: { type: String },
//   profileUrl: { type: String },
//   profession: { type: String },
//   friends: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
//   followers: [{ type: Schema.Types.ObjectId, ref: 'Users' }],  // Danh sách người theo dõi
//   following: [{ type: Schema.Types.ObjectId, ref: 'Users' }],  // Danh sách người mà người dùng đang theo dõi
//   blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'Users' }],  // Danh sách chặn người dùng
//   views: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
//   verified: { type: Boolean, default: true },//tinh năng xác thực email làm sau
//   birthDate: {
//     type: Date,
//     validate: {
//       validator: function (value) {
//         return value < Date.now();
//       },
//       message: "Birth date cannot be in the future!"
//     }
//   },
//   workplace: { type: String },
//   role: {
//     type: String,
//     enum: ['User', 'Admin'],
//     default: 'User'
//   },
//   statusActive: {
//     type: Boolean,
//     default: true
//   },
//   friendRequests: [
//     {
//       sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
//       status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
//     },
//   ],
//   loginAttempts: { type: Number, default: 0 },  // Quản lý số lần đăng nhập thất bại
//   lastLogin: { type: Date },  // Thời gian đăng nhập cuối
// }, {
//   timestamps: true
// });

// // Indexing
// userSchema.index({ email: 1 });
// userSchema.index({ statusActive: 1 });
// userSchema.index({ followers: 1 });
// userSchema.index({ following: 1 });

const Users = mongoose.model("Users", userSchema);
module.exports = Users;

