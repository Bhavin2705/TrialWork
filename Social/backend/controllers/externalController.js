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
