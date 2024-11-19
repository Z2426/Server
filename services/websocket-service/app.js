const http = require("http");
const express = require("express");
const createSocketServer = require("./untils/createSocketServer");
const app = express();
const server = http.createServer(app);
// Khởi tạo và chạy Socket.IO
createSocketServer(server);
server.listen(process.env.WS_SERVICE_PORT || 3005, () => {
    console.log("WEBSOCKET RUNNING " + `http://localhost:${process.env.WS_SERVICE_PORT}`);
});
