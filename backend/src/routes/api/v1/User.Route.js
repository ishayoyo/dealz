const express = require('express');
const router = express.Router();
const userController = require('../../../controllers/userController');
const authController = require('../../../controllers/authController');
const socialController = require('../../../controllers/socialController');
const auth = require('../../../middleware/auth');
const rateLimit = require('../../../middleware/rateLimit');

// Auth routes
router.post('/register', rateLimit.register, authController.register);
router.post('/login', rateLimit.login, authController.login);
router.post('/logout', auth, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/check-auth', auth, authController.checkAuth);
router.post('/change-avatar', auth, userController.changeAvatar);
router.get('/:id/avatar', userController.getUserAvatar);

// Password reset routes
router.post('/forgot-password', rateLimit.forgotPassword, authController.forgotPassword);
router.patch('/reset-password/:token', rateLimit.resetPassword, authController.resetPassword);

// Current user routes
router.get('/me', auth, userController.getCurrentUser);
router.put('/me', auth, userController.updateCurrentUser);

// Profile routes
router.get('/profile/:id', userController.getUserProfile);

// Social routes
router.get('/me/following', auth, socialController.getCurrentUserFollowing);
router.get('/me/followers', auth, socialController.getCurrentUserFollowers);
router.get('/me/deals', auth, socialController.getCurrentUserDeals);
router.get('/me/followed-deals', auth, socialController.getCurrentUserFollowedDeals);
router.get('/notifications', auth, socialController.getUnreadNotifications);
router.patch('/notifications/:id/read', auth, socialController.markNotificationAsRead);

// User routes
router.get('/:id', userController.getUser);
router.get('/:id/deals', socialController.getUserDeals);
router.get('/:id/followers', socialController.getUserFollowers);
router.get('/:id/following', socialController.getUserFollowing);
router.post('/:id/follow', auth, socialController.followUser);
router.delete('/:id/follow', auth, socialController.unfollowUser);
router.get('/:id/status', auth, userController.checkUserStatus);
router.get('/:id/recent-deals', userController.getUserRecentDeals);

module.exports = router;
