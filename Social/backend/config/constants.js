const path = require('path');

module.exports = {
    FILES: {
        users: path.join(__dirname, '../users.json'),
        messages: path.join(__dirname, '../messages.json'),
        posts: path.join(__dirname, '../posts.json'),
        friendRequests: path.join(__dirname, '../friendRequests.json')
    }
};
