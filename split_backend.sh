#!/bin/bash

# Create the directory structure
mkdir -p backend/{config,controllers,models,routes,services,utils}

# Create app.js with the main setup and routing
cat > backend/app.js << 'EOL'
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 7000;

// Import routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const messageRoutes = require('./routes/messageRoutes');
const friendRequestRoutes = require('./routes/friendRequestRoutes');
const externalRoutes = require('./routes/externalRoutes');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Routes
app.get(['/', '/messages', '/explore', '/register', '/login'], (req, res) => {
    const page = req.path === '/' ? 'homePage' : req.path.slice(1);
    res.sendFile(path.join(__dirname, 'public', `${page}.html`));
});

// API Routes
app.use('/api', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friend-requests', friendRequestRoutes);
app.use('/', externalRoutes);

// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
EOL

# Create config/constants.js
cat > backend/config/constants.js << 'EOL'
const path = require('path');

module.exports = {
    FILES: {
        users: path.join(__dirname, '../users.json'),
        messages: path.join(__dirname, '../messages.json'),
        posts: path.join(__dirname, '../posts.json'),
        friendRequests: path.join(__dirname, '../friendRequests.json')
    }
};
EOL

# Create services/fileService.js
cat > backend/services/fileService.js << 'EOL'
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
EOL

# Create controllers/authController.js
cat > backend/controllers/authController.js << 'EOL'
const fileService = require('../services/fileService');

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const data = await fileService.readUsers();
        const newUser = { id: data.length + 1, name, email, password };
        data.push(newUser);
        await fileService.writeUsers(data);
        res.json({ message: 'User registered', user: newUser });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ message: 'Error registering user', error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await fileService.readUsers();
        const user = data.find(u => u.email === email && u.password === password);
        if (user) {
            res.json({ message: 'Login successful', user });
        } else {
            res.status(401).json({ message: 'Login failed' });
        }
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ message: 'Error logging in', error: err.message });
    }
};

exports.profile = async (req, res) => {
    try {
        const data = await fileService.readUsers();
        res.render('profile.ejs', { user: data[0] || {} });
    } catch (err) {
        console.error('Error fetching profile:', err);  
        res.status(500).json({ message: 'Error fetching profile', error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const data = await fileService.readUsers();
        if (data[0]) {
            data[0] = { ...data[0], name, email };
            await fileService.writeUsers(data);
            res.json({ message: 'Profile updated', user: data[0] });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Error updating profile', error: err.message });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const data = await fileService.readUsers();
        if (data[0]) {
            data[0].password = newPassword;
            await fileService.writeUsers(data);
            res.json({ message: 'Password updated' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ message: 'Error updating password', error: err.message });
    }
};
EOL

# Create routes/authRoutes.js
cat > backend/routes/authRoutes.js << 'EOL'
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authController.profile);
router.post('/api/profile/update', authController.updateProfile);
router.post('/api/profile/password', authController.updatePassword);

module.exports = router;
EOL

# Create controllers/postController.js
cat > backend/controllers/postController.js << 'EOL'
const fileService = require('../services/fileService');

exports.createPost = async (req, res) => {
    try {
        const { content, userId } = req.body;
        const data = await fileService.readPosts();
        const newPost = {
            id: data.length + 1,
            userId: userId || 'test-user',
            content,
            timestamp: new Date().toISOString(),
            likes: [],
            shares: [],
            comments: [],
            bookmarks: []
        };
        data.push(newPost);
        await fileService.writePosts(data);
        res.json({ message: 'Post created', post: newPost });
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ message: 'Error creating post', error: err.message });
    }
};

exports.getPosts = async (req, res) => {
    try {
        const data = await fileService.readPosts();
        res.json(data);
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).json({ message: 'Error fetching posts', error: err.message });
    }
};

exports.updatePost = async (req, res) => {
    try {
        const { id, content } = req.body;
        const data = await fileService.readPosts();
        const postIndex = data.findIndex(p => p.id === id);
        if (postIndex !== -1) {
            data[postIndex].content = content;
            await fileService.writePosts(data);
            res.json({ message: 'Post updated', post: data[postIndex] });
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (err) {
        console.error('Error updating post:', err);
        res.status(500).json({ message: 'Error updating post', error: err.message });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const { id } = req.query;
        let data = await fileService.readPosts();
        data = data.filter(p => p.id !== Number(id));
        await fileService.writePosts(data);
        res.json({ message: 'Post deleted' });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ message: 'Error deleting post', error: err.message });
    }
};

exports.likePost = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await fileService.readPosts();
        const postIndex = data.findIndex(p => p.id === Number(id));
        if (postIndex !== -1 && !data[postIndex].likes.includes('test-user')) {
            data[postIndex].likes.push('test-user');
            await fileService.writePosts(data);
        }
        res.json({ message: 'Post liked', likes: data[postIndex]?.likes });
    } catch (err) {
        console.error('Error liking post:', err);
        res.status(500).json({ message: 'Error liking post', error: err.message });
    }
};

exports.unlikePost = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await fileService.readPosts();
        const postIndex = data.findIndex(p => p.id === Number(id));
        if (postIndex !== -1) {
            data[postIndex].likes = data[postIndex].likes.filter(user => user !== 'test-user');
            await fileService.writePosts(data);
        }
        res.json({ message: 'Post unliked', likes: data[postIndex]?.likes });
    } catch (err) {
        console.error('Error unliking post:', err);
        res.status(500).json({ message: 'Error unliking post', error: err.message });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const data = await fileService.readPosts();
        const postIndex = data.findIndex(p => p.id === Number(id));
        if (postIndex !== -1) {
            const comment = { 
                id: data[postIndex].comments.length + 1, 
                userId: 'test-user', 
                content, 
                timestamp: new Date().toISOString() 
            };
            data[postIndex].comments.push(comment);
            await fileService.writePosts(data);
            res.json({ message: 'Comment added', comment });
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (err) {
        console.error('Error commenting on post:', err);
        res.status(500).json({ message: 'Error commenting on post', error: err.message });
    }
};

exports.updateComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const { content } = req.body;
        const data = await fileService.readPosts();
        const postIndex = data.findIndex(p => p.id === Number(id));
        if (postIndex !== -1) {
            const commentIndex = data[postIndex].comments.findIndex(c => c.id === Number(commentId));
            if (commentIndex !== -1) {
                data[postIndex].comments[commentIndex].content = content;
                await fileService.writePosts(data);
                res.json({ message: 'Comment updated', comment: data[postIndex].comments[commentIndex] });
            } else {
                res.status(404).json({ message: 'Comment not found' });
            }
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (err) {
        console.error('Error updating comment:', err);
        res.status(500).json({ message: 'Error updating comment', error: err.message });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const data = await fileService.readPosts();
        const postIndex = data.findIndex(p => p.id === Number(id));
        if (postIndex !== -1) {
            data[postIndex].comments = data[postIndex].comments.filter(c => c.id !== Number(commentId));
            await fileService.writePosts(data);
            res.json({ message: 'Comment deleted' });
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ message: 'Error deleting comment', error: err.message });
    }
};

exports.bookmarkPost = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await fileService.readPosts();
        const postIndex = data.findIndex(p => p.id === Number(id));
        if (postIndex !== -1 && !data[postIndex].bookmarks.includes('test-user')) {
            data[postIndex].bookmarks.push('test-user');
            await fileService.writePosts(data);
        }
        res.json({ message: 'Post bookmarked', bookmarks: data[postIndex]?.bookmarks });
    } catch (err) {
        console.error('Error bookmarking post:', err);
        res.status(500).json({ message: 'Error bookmarking post', error: err.message });
    }
};

exports.unbookmarkPost = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await fileService.readPosts();
        const postIndex = data.findIndex(p => p.id === Number(id));
        if (postIndex !== -1) {
            data[postIndex].bookmarks = data[postIndex].bookmarks.filter(user => user !== 'test-user');
            await fileService.writePosts(data);
        }
        res.json({ message: 'Post unbookmarked', bookmarks: data[postIndex]?.bookmarks });
    } catch (err) {
        console.error('Error unbookmarking post:', err);
        res.status(500).json({ message: 'Error unbookmarking post', error: err.message });
    }
};

exports.getMyPosts = async (req, res) => {
    try {
        const data = await fileService.readPosts();
        res.json(data);
    } catch (err) {
        console.error('Error fetching my posts:', err);
        res.status(500).json({ message: 'Error fetching my posts', error: err.message });
    }
};
EOL

# Create routes/postRoutes.js
cat > backend/routes/postRoutes.js << 'EOL'
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

router.post('/', postController.createPost);
router.get('/', postController.getPosts);
router.put('/', postController.updatePost);
router.delete('/', postController.deletePost);
router.post('/:id/like', postController.likePost);
router.post('/:id/unlike', postController.unlikePost);
router.post('/:id/comment', postController.addComment);
router.put('/:id/comment/:commentId', postController.updateComment);
router.delete('/:id/comment/:commentId', postController.deleteComment);
router.post('/:id/bookmark', postController.bookmarkPost);
router.post('/:id/unbookmark', postController.unbookmarkPost);
router.get('/my-posts', postController.getMyPosts);

module.exports = router;
EOL

# Create controllers/messageController.js
cat > backend/controllers/messageController.js << 'EOL'
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
EOL

# Create routes/messageRoutes.js
cat > backend/routes/messageRoutes.js << 'EOL'
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.post('/', messageController.createMessage);
router.get('/', messageController.getMessages);

module.exports = router;
EOL

# Create controllers/friendRequestController.js
cat > backend/controllers/friendRequestController.js << 'EOL'
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
EOL

# Create routes/friendRequestRoutes.js
cat > backend/routes/friendRequestRoutes.js << 'EOL'
const express = require('express');
const router = express.Router();
const friendRequestController = require('../controllers/friendRequestController');

router.post('/', friendRequestController.sendFriendRequest);
router.get('/', friendRequestController.getFriendRequests);
router.put('/:id', friendRequestController.updateFriendRequest);
router.delete('/:id', friendRequestController.deleteFriendRequest);

module.exports = router;
EOL

# Create controllers/externalController.js
cat > backend/controllers/externalController.js << 'EOL'
const axios = require('axios');

exports.getRedditPosts = async (req, res) => {
    const subreddit = req.query.subreddit || 'technology';
    const after = req.query.after || '';
    if (!/^[a-zA-Z0-9_]+$/.test(subreddit)) {
        return res.status(400).json({ error: 'Invalid subreddit name' });
    }
    try {
        const response = await axios.get(`https://www.reddit.com/r/${subreddit}/new.json?after=${after}`, {
            headers: {
                'User-Agent': 'SocialApp/1.0'
            }
        });
        if (response.status !== 200) {
            throw new Error(`Reddit API returned status: ${response.status}`);
        }
        res.json(response.data);
    } catch (err) {
        console.error('Error fetching Reddit posts:', err);
        res.status(500).json({ message: 'Error fetching Reddit posts', error: err.message });
    }
};
EOL

# Create routes/externalRoutes.js
cat > backend/routes/externalRoutes.js << 'EOL'
const express = require('express');
const router = express.Router();
const externalController = require('../controllers/externalController');

router.get('/reddit-posts', externalController.getRedditPosts);

module.exports = router;
EOL

echo "Backend structure created successfully!"