const express = require('express');
const router = express.Router();
const userController = require('../../../controllers/userController');
const auth = require('../../../middleware/auth');

// Auth routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', auth, userController.logout);

// Token validation route (place this before ID routes)
router.get('/validate-token', auth, userController.validateToken);

// Current user routes
router.get('/me', auth, userController.getCurrentUser);
router.put('/me', auth, userController.updateCurrentUser);

// Password reset routes
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.post('/verify-email', userController.verifyEmail);

// User ID routes (place these last)
router.get('/:id', userController.getUser);
router.get('/:id/deals', userController.getUserDeals);
router.get('/:id/followers', userController.getUserFollowers);
router.get('/:id/following', userController.getUserFollowing);
router.post('/:id/follow', auth, userController.followUser);
router.delete('/:id/follow', auth, userController.unfollowUser);

// Add these new routes
router.get('/me/collections', auth, userController.getCurrentUserCollections);
router.post('/me/collections', auth, userController.createCollection);
router.put('/me/collections/:id', auth, userController.updateCollection);
router.delete('/me/collections/:id', auth, userController.deleteCollection);

router.get('/me/activity', auth, userController.getCurrentUserActivity);
router.get('/:id/activity', userController.getUserActivity);

module.exports = router;