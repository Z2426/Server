const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI;

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  poolSize: 10, // Số lượng kết nối tối đa trong pool
  minPoolSize: 5, // Số lượng kết nối tối thiểu trong pool
  maxIdleTimeMS: 30000, // Thời gian tối đa mà một kết nối có thể nằm idle trước khi bị đóng
};

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, options);
    console.log('MongoDB connected!');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Thoát nếu không thể kết nối
  }
};

module.exports = connectDB;
