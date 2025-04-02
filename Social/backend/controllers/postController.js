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
