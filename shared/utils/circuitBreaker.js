// middlewares/circuitBreaker.js
const CircuitBreaker = require('opossum');
const axios = require('axios');

// Cấu hình cho Circuit Breaker
const options = {
  timeout: 3000, // Thời gian chờ (3 giây)
  errorThresholdPercentage: 50, // Ngưỡng lỗi 50%
  resetTimeout: 30000 // Thời gian phục hồi sau khi ngắt (30 giây)
};

// Hàm gửi yêu cầu với circuit breaker
const requestWithCircuitBreaker = (url, method = 'GET', data = null, headers = {}) => {
  const requestFunction = async () => {
    switch (method) {
      case 'GET':
        return (await axios.get(url, { headers })).data; // Gửi yêu cầu GET
      case 'POST':
        return (await axios.post(url, data, { headers })).data; // Gửi yêu cầu POST
      case 'PUT':
        return (await axios.put(url, data, { headers })).data; // Gửi yêu cầu PUT
      case 'DELETE':
        return (await axios.delete(url, { headers })).data; // Gửi yêu cầu DELETE
      default:
        throw new Error('Method not supported'); // Nếu phương thức không hợp lệ
    }
  };

  const breaker = new CircuitBreaker(requestFunction, options);
  return breaker.fire(); // Gọi hàm yêu cầu
};



global.requestWithCircuitBreaker = requestWithCircuitBreaker;

module.exports = requestWithCircuitBreaker; 