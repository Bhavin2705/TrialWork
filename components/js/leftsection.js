// User data structure
const userData = {
    name: ' ',
    handle: ' ',
    topics: [
        { id: 1, name: 'Technology', icon: 'fa-laptop-code', posts: 125 },
        { id: 2, name: 'News', icon: 'fa-newspaper', posts: 89 },
        { id: 3, name: 'Fitness', icon: 'fa-dumbbell', posts: 45 },
        { id: 4, name: 'Sports', icon: 'fa-trophy', posts: 67 },
        { id: 5, name: 'Movies', icon: 'fa-film', posts: 93 }
    ]
};

// Subreddit mappings
const topicToSubreddit = {
    technology: ['technology', 'gadgets', 'technews'],
    news: ['worldnews', 'news', 'uknews'],
    fitness: ['fitness', 'nutrition', 'yoga', 'bodybuilding', 'crossfit', 'running'],
    sports: ['sports', 'soccer', 'basketball'],
    movies: ['movies', 'film', 'moviecritic'],
};

// Global state
let isLoading = false;
let posts = [];
let currentTopic = 'technology';
let after = '';

// Utility Functions

/**
 * Format timestamp to a human-readable format
 * @param {number} timestamp - Unix timestamp
 * @returns {string} - Formatted time (e.g., "2 hours ago")
 */
function formatTimestamp(timestamp) {
    const now = Date.now();
    const secondsAgo = Math.floor((now - timestamp) / 1000);

    if (secondsAgo < 60) return `${secondsAgo} seconds ago`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} minutes ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)} hours ago`;
    return `${Math.floor(secondsAgo / 86400)} days ago`;
}

/**
 * Debounce function for scroll handling
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Sidebar Initialization

/**
 * Initialize the sidebar with user data and topic list
 */
function initializeSidebar() {
    let loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    // Check if loggedInUser is null or undefined
    if (!loggedInUser) {
        loggedInUser = { name: 'Guest' }; // Provide a default name
    }

    if (loggedInUser.name) {
        document.getElementById('userName').textContent = loggedInUser.name;
        document.getElementById('userHandle').textContent = `@${loggedInUser.name.toLowerCase().replace(/\s+/g, '_')}`;
    } else {
        console.error('loggedInUser.name is undefined or null');
    }

    const msgDot = document.getElementById('msgCount');
    if (userData.messages > 0) {
        msgDot.classList.remove('hidden');
    }

    document.getElementById('msgNav').addEventListener('click', () => msgDot.classList.add('hidden'));

    const topicsList = document.getElementById('topics-list');
    userData.topics.forEach(topic => {
        const topicEl = document.createElement('div');
        topicEl.className = 'topic-item flex items-center space-x-3 cursor-pointer';
        topicEl.innerHTML = `
            <i class="fa ${topic.icon}"></i>
            <span>${topic.name}</span>
            <span class="ml-auto text-xs text-gray-500">(${topic.posts} Posts)</span>
        `;

        topicEl.addEventListener('click', () => {
            const selectedTopic = document.querySelector('.topic-item.selected');
            if (selectedTopic) selectedTopic.classList.remove('selected');
            topicEl.classList.add('selected');
            currentTopic = topic.name.toLowerCase();
            loadPostsByTopic(currentTopic);
        });

        topicsList.appendChild(topicEl);
    });

    document.getElementById('topics-toggle').addEventListener('click', () => {
        document.getElementById('topics-list').classList.toggle('expanded');
        const icon = document.querySelector('#topics-toggle i');
        icon.classList.toggle('rotate-180');
    });
}

// Reddit API Functions

/**
 * Fetch Reddit posts using the proxy route with error handling and retries
 * @param {string} subreddit - The subreddit to fetch posts from
 * @returns {Promise<Array>} - Array of posts
 */
async function fetchRedditPosts(subreddit) {
    try {
        // Add a small delay to prevent rate limiting issues
        await new Promise(resolve => setTimeout(resolve, 300));

        const response = await fetch(`/reddit-posts?subreddit=${subreddit}&after=${after}`);
        if (!response.ok) throw new Error(`Failed to fetch data from subreddit: ${subreddit}`);

        const data = await response.json();
        if (!data.data || !data.data.children) return [];

        after = data.data.after;

        return data.data.children
            .map(post => {
                if (!post.data) return null;
                if (post.data.is_self || post.data.thumbnail === 'self') return null;

                // Only return posts with a valid image URL
                const imageUrl = post.data.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&');
                if (!imageUrl || !imageUrl.startsWith('http')) return null;

                return {
                    title: post.data.title,
                    url: post.data.url,
                    thumbnail: imageUrl,
                    id: post.data.id,
                    author: post.data.author,
                    subreddit: post.data.subreddit,
                    permalink: `https://reddit.com${post.data.permalink}`,
                    created: post.data.created_utc * 1000, // Convert to milliseconds
                };
            })
            .filter(post => post !== null);
    } catch (error) {
        console.error('Error fetching Reddit posts:', error);
        return [];
    }
}
function isUserLoggedIn() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    return loggedInUser && loggedInUser.name !== 'Guest';
}

// Post Creation and Interaction

/**
 * Create a post element with improved styling and functionality
 * @param {Object} post - Post data
 * @returns {HTMLElement} - Post element
 */
function createPost(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post mb-6 rounded-lg overflow-hidden shadow-lg bg-white hover:shadow-xl transition-shadow duration-300';

    // Load comments from local storage
    const comments = loadCommentsFromLocalStorage(post.id);

    postElement.innerHTML = `
        <div class="relative">
            <img src="${post.thumbnail}" alt="${post.title}" class="w-full h-64 object-cover cursor-pointer" onerror="this.style.display='none'">
            <div class="p-4">
                <h3 class="text-xl font-semibold mb-2">${post.title}</h3>
                <p class="text-gray-600 text-sm mb-4">
                    Posted by <span class="font-medium">${post.author}</span>
                </p>
                <div class="flex items-center justify-between text-gray-500">
                    <button class="like-btn flex items-center space-x-1 hover:text-red-500">
                        <i class="far fa-heart"></i>
                    </button>
                    <button class="comment-btn flex items-center space-x-1 hover:text-blue-500">
                        <i class="far fa-comment"></i>
                        <span class="comment-count">${comments.length}</span>
                    </button>
                    <button class="share-btn flex items-center space-x-1 hover:text-green-500">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="bookmark-btn flex items-center space-x-1 hover:text-yellow-500">
                        <i class="far fa-bookmark"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="comment-section hidden p-4 border-t">
            <textarea class="w-full p-2 border rounded mb-2" placeholder="Write a comment..."></textarea>
            <button class="w-full px-4 py-2 bg-blue-500 text-white rounded post-comment-btn">Post Comment</button>
            <div class="comments-container mt-4">
                ${comments.map(comment => `
                    <div class="comment mb-2 p-2 bg-gray-100 rounded flex justify-between items-start">
                        <div class="comment-content">
                            <span class="font-medium">${comment.author}</span>
                            <p class="mt-1">${comment.text}</p>
                        </div>
                        <span class="text-gray-500 text-sm">${formatTimestamp(comment.timestamp)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Add event listeners for post interaction
    addPostEventListeners(postElement, post, comments);

    return postElement;
}

/**
 * Add event listeners to post elements
 * @param {HTMLElement} postElement - The post element
 * @param {Object} post - Post data
 * @param {Array} comments - Array of comments
 */
function addPostEventListeners(postElement, post, comments) {
    const postImage = postElement.querySelector('img');
    postImage.addEventListener('click', () => {
        window.open(post.permalink, '_blank');
    });

    const likeBtn = postElement.querySelector('.like-btn');
    const commentBtn = postElement.querySelector('.comment-btn');
    const shareBtn = postElement.querySelector('.share-btn');
    const bookmarkBtn = postElement.querySelector('.bookmark-btn');
    const commentSection = postElement.querySelector('.comment-section');
    const postCommentBtn = postElement.querySelector('.post-comment-btn');
    const commentsContainer = postElement.querySelector('.comments-container');
    const commentCount = postElement.querySelector('.comment-count');

    likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isUserLoggedIn()) {
            alert('Kindly log in before liking a post.');
            return;
        }
        likeBtn.querySelector('i').classList.toggle('fas');
        likeBtn.querySelector('i').classList.toggle('far');
    });

    commentBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isUserLoggedIn()) {
            alert('Kindly log in before commenting.');
            return;
        }
        commentSection.classList.toggle('hidden');
    });

    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({
                title: post.title,
                url: post.permalink
            }).then(() => {
                console.log('Thanks for sharing!');
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(post.permalink).then(() => {
                alert('Link copied to clipboard!');
            });
        }
    });

    bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isUserLoggedIn()) {
            alert('Kindly log in before bookmarking a post.');
            return;
        }
        bookmarkBtn.querySelector('i').classList.toggle('fas');
        bookmarkBtn.querySelector('i').classList.toggle('far');
    });

    postCommentBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isUserLoggedIn()) {
            alert('Kindly log in before commenting.');
            return;
        }
        const commentText = postElement.querySelector('textarea').value;
        if (commentText.trim() === '') return;

        let loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!loggedInUser) {
            loggedInUser = { name: 'Guest' }; // Provide a default name
        }

        const timestamp = Date.now();

        const comment = {
            author: loggedInUser.name,
            text: commentText,
            timestamp: timestamp,
        };

        comments.push(comment);
        saveCommentsToLocalStorage(post.id, comments);

        commentCount.textContent = comments.length;

        const commentElement = document.createElement('div');
        commentElement.className = 'comment mb-2 p-2 bg-gray-100 rounded flex justify-between items-start';
        commentElement.innerHTML = `
            <div class="comment-content">
                <span class="font-medium">${comment.author}</span>
                <p class="mt-1">${comment.text}</p>
            </div>
            <span class="text-gray-500 text-sm">${formatTimestamp(comment.timestamp)}</span>
        `;
        commentsContainer.appendChild(commentElement);

        postElement.querySelector('textarea').value = '';
    });
}
// Local Storage Functions

/**
 * Save comments to local storage
 * @param {string} postId - The ID of the post
 * @param {Array} comments - Array of comments
 */
function saveCommentsToLocalStorage(postId, comments) {
    localStorage.setItem(`comments_${postId}`, JSON.stringify(comments));
}

/**
 * Load comments from local storage
 * @param {string} postId - The ID of the post
 * @returns {Array} - Array of comments
 */
function loadCommentsFromLocalStorage(postId) {
    const comments = localStorage.getItem(`comments_${postId}`);
    return comments ? JSON.parse(comments) : [];
}

// Main Functionality

/**
 * Load posts by topic with improved error handling
 * @param {string} topic - The topic to load posts for
 * @param {boolean} isInfiniteScroll - Whether this is an infinite scroll request
 */
async function loadPostsByTopic(topic, isInfiniteScroll = false) {
    const subreddits = topicToSubreddit[topic];
    if (!subreddits || subreddits.length === 0) return;

    const postFeed = document.getElementById('post-feed');
    const loadingIndicator = document.getElementById('loading-indicator');

    if (isLoading) return;
    isLoading = true;

    loadingIndicator?.classList.remove('hidden');

    if (!isInfiniteScroll) {
        postFeed.innerHTML = '';
        posts = [];
        after = '';
    }

    try {
        let allPosts = [];
        let attempts = 0;
        const maxAttempts = 3;
        const seenUrls = new Set(posts.map(p => p.url));

        while (allPosts.length < 10 && attempts < maxAttempts) {
            for (const subreddit of subreddits) {
                try {
                    const fetchedPosts = await fetchRedditPosts(subreddit);
                    const uniquePosts = fetchedPosts.filter(post => !seenUrls.has(post.url));
                    uniquePosts.forEach(post => seenUrls.add(post.url));
                    allPosts = [...allPosts, ...uniquePosts];
                } catch (subError) {
                    console.warn(`Failed to fetch from subreddit ${subreddit}:`, subError);
                    continue;
                }
            }
            attempts++;
            if (allPosts.length >= 10) break;
            if (attempts < maxAttempts) await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const shuffledPosts = allPosts.sort(() => Math.random() - 0.5);

        if (shuffledPosts.length > 0) {
            shuffledPosts.forEach(post => {
                const postElement = createPost(post);
                postFeed.appendChild(postElement);
                posts.push(post);
            });
        } else if (!isInfiniteScroll) {
            const noImageMessage = document.createElement('div');
            noImageMessage.className = 'p-4 text-center text-gray-500';
            noImageMessage.textContent = 'No posts with images available at the moment. Please try again later.';
            postFeed.appendChild(noImageMessage);
        }
    } catch (error) {
        console.error("Error fetching posts:", error);
        if (!isInfiniteScroll) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'p-4 text-center text-red-500';
            errorMessage.textContent = 'An error occurred while loading posts. Please try again later.';
            postFeed.appendChild(errorMessage);
        }
    } finally {
        isLoading = false;
        loadingIndicator?.classList.add('hidden');
    }
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeSidebar();

    const firstTopic = document.querySelector('.topic-item');
    if (firstTopic) {
        firstTopic.classList.add('selected');
        currentTopic = userData.topics[0].name.toLowerCase();
        loadPostsByTopic(currentTopic);
    }

    // Use debounced scroll handler to prevent too many API calls
    window.addEventListener('scroll', debounce(() => {
        if (isLoading) return;

        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPosition = window.scrollY;

        if (scrollPosition >= scrollableHeight - 100) {
            loadPostsByTopic(currentTopic, true);
        }
    }, 200));
});
