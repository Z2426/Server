// middlewares/logMiddleware.js
function logRequest(req, res, next) {
    console.log("Request Body:", req.body);
    console.log("Request Params:", req.params);
    console.log("Request Query:", req.query);
    next(); // Chuyển tiếp đến middleware hoặc route tiếp theo
}

module.exports = logRequest;
