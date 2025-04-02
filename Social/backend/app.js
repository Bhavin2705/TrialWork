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

// Static files (now in frontend/public)
app.use(express.static(path.join(__dirname, '../frontend/public')));

// EJS Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

// Page Routes (converted to EJS)
const pages = ['homePage', 'messages', 'explore', 'register', 'login'];
pages.forEach(page => {
  const pathName = page === 'homePage' ? '/' : `/${page}`;
  app.get(pathName, (req, res) => res.render(page));
});

// API Routes (unchanged)
app.use('/api', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friend-requests', friendRequestRoutes);
app.use('/', externalRoutes);

// Error handling for undefined routes
app.use((req, res) => {
  res.status(404).render('404'); // Create 404.ejs in your views
});

// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));