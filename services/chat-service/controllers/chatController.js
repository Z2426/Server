const chatService = require("../services/chatService");

exports.sendPersonalMessage = async (req, res) => {
    const { senderId, recipientId, content } = req.body;
    const message = await chatService.sendPersonalMessage(senderId, recipientId, content);
    res.status(200).json(message);
};

exports.sendGroupMessage = async (req, res) => {
    const { senderId, groupId, content } = req.body;
    const message = await chatService.sendGroupMessage(senderId, groupId, content);
    res.status(200).json(message);
};
