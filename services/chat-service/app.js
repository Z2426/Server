const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const chatRoutes = require("./routes/chatRoutes");

app.use(cors());
app.use(bodyParser.json());
app.use("/api/chat", chatRoutes);

module.exports = app;
