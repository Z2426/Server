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
  profileUrl: {
    type: String,
    default: "https://res.cloudinary.com/dr91wukb1/image/upload/v1732886370/gasrcm5diz1wr6lhafg3.png"
  },
  videoUrl: { type: String },
  cover_photo: { type: String },
  profession: { type: String },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
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
  interests: [{
    type: String
  }],
  suggestfriends: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
  friends: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
  followers: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
  following: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
  blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
  views: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
  verified: { type: Boolean, default: true },
  workplace: { type: String },
  province: { type: String },
  school: { type: String },
  address: { type: String },
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
},);

module.exports = mongoose.model("Users", userSchema);
