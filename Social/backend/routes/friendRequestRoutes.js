const express = require('express');
const router = express.Router();
const friendRequestController = require('../controllers/friendRequestController');

router.post('/', friendRequestController.sendFriendRequest);
router.get('/', friendRequestController.getFriendRequests);
router.put('/:id', friendRequestController.updateFriendRequest);
router.delete('/:id', friendRequestController.deleteFriendRequest);

module.exports = router;
