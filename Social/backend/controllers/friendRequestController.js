const fileService = require('../services/fileService');

exports.sendFriendRequest = async (req, res) => {
    try {
        const { userId, friendId } = req.body;
        const data = await fileService.readFriendRequests();
        const request = { id: data.length + 1, userId, friendId, status: 'pending' };
        data.push(request);
        await fileService.writeFriendRequests(data);
        res.json({ message: 'Friend request sent', request });
    } catch (err) {
        console.error('Error sending friend request:', err);
        res.status(500).json({ message: 'Error sending friend request', error: err.message });
    }
};

exports.getFriendRequests = async (req, res) => {
    try {
        const data = await fileService.readFriendRequests();
        res.json(data);
    } catch (err) {
        console.error('Error fetching friend requests:', err);
        res.status(500).json({ message: 'Error fetching friend requests', error: err.message });
    }
};

exports.updateFriendRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const data = await fileService.readFriendRequests();
        const requestIndex = data.findIndex(r => r.id === Number(id));
        if (requestIndex !== -1) {
            data[requestIndex].status = status;
            await fileService.writeFriendRequests(data);
            res.json({ message: 'Friend request updated', request: data[requestIndex] });
        } else {
            res.status(404).json({ message: 'Friend request not found' });
        }
    } catch (err) {
        console.error('Error updating friend request:', err);
        res.status(500).json({ message: 'Error updating friend request', error: err.message });
    }
};

exports.deleteFriendRequest = async (req, res) => {
    try {
        const { id } = req.params;
        let data = await fileService.readFriendRequests();
        data = data.filter(r => r.id !== Number(id));
        await fileService.writeFriendRequests(data);
        res.json({ message: 'Friend request deleted' });
    } catch (err) {
        console.error('Error deleting friend request:', err);
        res.status(500).json({ message: 'Error deleting friend request', error: err.message });
    }
};
