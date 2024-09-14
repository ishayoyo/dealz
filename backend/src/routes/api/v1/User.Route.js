const express = require('express');
const router = express.Router();
const path = require('path');
const userController = require(path.join(__dirname, '../../../controllers/userController'));
const auth = require('../../../middleware/auth');
const rateLimit = require('../../../middleware/rateLimit');

router.post('/register', rateLimit.register, userController.register);
router.post('/login', rateLimit.login, userController.login);
router.post('/logout', auth, userController.logout);
router.get('/me', auth, userController.getCurrentUser);
router.put('/me', auth, userController.updateCurrentUser);
router.get('/:id', userController.getUser);
router.get('/:id/deals', userController.getUserDeals);
router.get('/:id/followers', userController.getUserFollowers);
router.get('/:id/following', userController.getUserFollowing);
router.post('/:id/follow', auth, userController.followUser);
router.delete('/:id/follow', auth, userController.unfollowUser);
router.post('/forgot-password', rateLimit.forgotPassword, userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.post('/verify-email', userController.verifyEmail);

module.exports = router;