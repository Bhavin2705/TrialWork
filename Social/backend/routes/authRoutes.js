const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authController.profile);
router.post('/api/profile/update', authController.updateProfile);
router.post('/api/profile/password', authController.updatePassword);

module.exports = router;
