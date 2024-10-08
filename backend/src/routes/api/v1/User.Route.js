const express = require('express');
const router = express.Router();
const userController = require('../../../controllers/userController');
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
router.post('/register', rateLimit.register, userController.register);
router.post('/login', rateLimit.login, userController.login);
router.post('/logout', auth, userController.logout);
router.post('/refresh-token', userController.refreshToken);
router.get('/check-auth', auth, userController.checkAuth);

// Token validation route (place this before ID routes)
router.get('/validate-token', auth, userController.validateToken);

// Current user routes
router.get('/me', auth, userController.getCurrentUser);
router.put('/me', auth, userController.updateCurrentUser);

// Password reset routes
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-email', userController.verifyEmail);
router.post('/change-password', auth, userController.changePassword);

// Move these routes before the /:id routes
router.get('/profile/:id', userController.getUserProfile);
router.get('/me/following', auth, userController.getCurrentUserFollowing);
router.get('/me/followers', auth, userController.getCurrentUserFollowers);
router.get('/me/deals', auth, userController.getCurrentUserDeals);
router.get('/me/followed-deals', auth, userController.getCurrentUserFollowedDeals);
router.get('/me/collections', auth, userController.getCurrentUserCollections);
router.post('/me/collections', auth, userController.createCollection);
router.put('/me/collections/:id', auth, userController.updateCollection);
router.delete('/me/collections/:id', auth, userController.deleteCollection);
router.get('/me/activity', auth, userController.getCurrentUserActivity);

// New notification routes
router.get('/notifications', auth, userController.getUnreadNotifications);
router.patch('/notifications/:id/read', auth, userController.markNotificationAsRead);

// Then keep the /:id routes
router.get('/:id', userController.getUser);
router.get('/:id/deals', userController.getUserDeals);
router.get('/:id/followers', userController.getUserFollowers);
router.get('/:id/following', userController.getUserFollowing);
router.post('/:id/follow', auth, userController.followUser);
router.delete('/:id/follow', auth, userController.unfollowUser);
router.get('/:id/activity', userController.getUserActivity);
router.get('/:id/status', auth, userController.checkUserStatus);

// Add this new route
router.post('/upload-profile-picture', auth, upload.single('image'), userController.uploadProfilePicture);

// Add this new route
router.get('/:id/recent-deals', userController.getUserRecentDeals);

module.exports = router;