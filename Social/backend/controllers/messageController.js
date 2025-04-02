const fileService = require('../services/fileService');

exports.createMessage = async (req, res) => {
    try {
        const { message, userId } = req.body;
        const data = await fileService.readMessages();
        const newMessage = {
            id: data.length + 1,
            userId: userId || 'test-user',
            message,
            timestamp: new Date().toISOString()
        };
        data.push(newMessage);
        await fileService.writeMessages(data);
        res.json({ message: 'Message sent', chat: newMessage });
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ message: 'Error sending message', error: err.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const data = await fileService.readMessages();
        res.json(data);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ message: 'Error fetching messages', error: err.message });
    }
};
