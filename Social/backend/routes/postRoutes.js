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
