// user-service/middlewares/requestWithCircuitBreaker.js
const CircuitBreaker = require('opossum'); // Thư viện Circuit Breaker
const axios = require('axios'); // Thư viện Axios để gửi yêu cầu HTTP

// Cấu hình cho Circuit Breaker
const options = {
  timeout: 3000, // Thời gian chờ (3 giây)
  errorThresholdPercentage: 50, // Ngưỡng lỗi 50%
  resetTimeout: 30000 // Thời gian phục hồi sau khi ngắt (30 giây)
};

// Hàm gửi yêu cầu với circuit breaker
const requestWithCircuitBreaker = (url, method = 'GET', data = null) => {
  const requestFunction = async () => {
    switch (method) {
      case 'GET':
        return (await axios.get(url)).data; // Gửi yêu cầu GET
      case 'POST':
        return (await axios.post(url, data)).data; // Gửi yêu cầu POST
      case 'PUT':
        return (await axios.put(url, data)).data; // Gửi yêu cầu PUT
      case 'DELETE':
        return (await axios.delete(url)).data; // Gửi yêu cầu DELETE
      default:
        throw new Error('Method not supported'); // Nếu phương thức không hợp lệ
    }
  };

  return new CircuitBreaker(requestFunction, options).fire(); // Tạo Circuit Breaker và gọi hàm yêu cầu
};

module.exports = requestWithCircuitBreaker; // Xuất hàm
