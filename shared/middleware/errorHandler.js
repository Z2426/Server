// middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
    console.error(err.stack); // Log lỗi cho server
  
    // Phản hồi cho client
    res.status(err.status || 500).json({
      status: err.status,
      success: false,
      message: err.message || 'Something went wrong!',
      // Bạn có thể thêm thông tin chi tiết hơn nếu cần
    });
  }
  module.exports = errorHandler;
  