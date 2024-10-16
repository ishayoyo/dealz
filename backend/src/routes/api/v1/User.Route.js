const express = require('express');
const router = express.Router();
const userController = require('../../../controllers/userController');
const authController = require('../../../controllers/authController');
const socialController = require('../../../controllers/socialController');
const auth = require('../../../middleware/auth');
const rateLimit = require('../../../middleware/rateLimit');
const multer = require('multer');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // limit file size to 5MB
  }
});

// Auth routes
router.post('/register', rateLimit.register, authController.register);
router.post('/login', rateLimit.login, authController.login);
router.post('/logout', auth, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/check-auth', auth, authController.checkAuth);

// Password reset routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/change-password', auth, authController.changePassword);

// Current user routes
router.get('/me', auth, userController.getCurrentUser);
router.put('/me', auth, userController.updateCurrentUser);

// Profile routes
router.get('/profile/:id', userController.getUserProfile);
router.post('/upload-profile-picture', auth, upload.single('image'), userController.uploadProfilePicture);

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
