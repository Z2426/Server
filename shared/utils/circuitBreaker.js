const CircuitBreaker = require('opossum');
const axios = require('axios');
const options = {
  timeout: 50000, // Thời gian chờ (50 giây)
  errorThresholdPercentage: 50, // Ngưỡng lỗi 50%
  resetTimeout: 1000 // Thời gian phục hồi sau khi ngắt (30 giây)
};
const requestWithCircuitBreaker = (url, method = 'GET', data = null, headers = {}) => {
  const requestFunction = async () => {
    switch (method) {
      case 'GET':
        return (await axios.get(url, { headers })).data;
      case 'POST':
        return (await axios.post(url, data, { headers })).data;
      case 'PUT':
        return (await axios.put(url, data, { headers })).data;
      case 'DELETE':
        return (await axios.delete(url, { headers })).data;
      default:
        throw new Error('Method not supported');
    }
  };

  const breaker = new CircuitBreaker(requestFunction, options);
  return breaker.fire();
};
global.requestWithCircuitBreaker = requestWithCircuitBreaker;
module.exports = requestWithCircuitBreaker; 