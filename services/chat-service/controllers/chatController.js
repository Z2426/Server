const chatService = require("../services/chatService");

module.exports = {
    async sendPersonalMessage(req, res) {
        const { senderId, recipientId, content } = req.body;
        try {
            const message = await chatService.sendPersonalMessage(senderId, recipientId, content);
            await chatService.saveUnreadPersonalMessage(recipientId, senderId, message);
            res.status(200).json({ message });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async sendGroupMessage(req, res) {
        const { senderId, groupId, content } = req.body;
        try {
            const message = await chatService.sendGroupMessage(senderId, groupId, content);
            await chatService.saveUnreadGroupMessage(senderId, groupId, message);
            res.status(200).json({ message });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getUnreadMessages(req, res) {
        const { userId } = req.params;
        try {
            const personalMessages = await chatService.getUnreadPersonalMessages(userId);
            const groupMessages = await chatService.getUnreadGroupMessages(userId);
            res.status(200).json({ personalMessages, groupMessages });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async markMessageAsRead(req, res) {
        const { userId, messageId } = req.body;
        try {
            await chatService.markMessageAsRead(userId, messageId);
            res.status(200).json({ message: "Message marked as read" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};
