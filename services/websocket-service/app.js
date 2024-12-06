const http = require("http");
const express = require("express");
const createSocketServer = require("./untils/createSocketServer");
const app = express();
const server = http.createServer(app);
createSocketServer(server);
server.listen(process.env.WS_SERVICE_PORT || 3005, () => {
    console.log("Websocket running " + `http://localhost:${process.env.WS_SERVICE_PORT}`);
});
