const express = require('express');
const router = express.Router();
const externalController = require('../controllers/externalController');

router.get('/reddit-posts', externalController.getRedditPosts);

module.exports = router;
