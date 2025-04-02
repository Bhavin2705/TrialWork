const fs = require('fs').promises;
const { FILES } = require('../config/constants');

async function readFileData(filePath) {
    try {
        await fs.access(filePath);
    } catch {
        await fs.writeFile(filePath, JSON.stringify([]));
    }
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data || '[]');
}

async function writeFileData(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
    readUsers: () => readFileData(FILES.users),
    writeUsers: (data) => writeFileData(FILES.users, data),
    readMessages: () => readFileData(FILES.messages),
    writeMessages: (data) => writeFileData(FILES.messages, data),
    readPosts: () => readFileData(FILES.posts),
    writePosts: (data) => writeFileData(FILES.posts, data),
    readFriendRequests: () => readFileData(FILES.friendRequests),
    writeFriendRequests: (data) => writeFileData(FILES.friendRequests, data)
};
