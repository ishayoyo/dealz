const express = require('express');
const router = express.Router();
const userController = require('../../../controllers/userController');
const auth = require('../../../middleware/auth');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', auth, userController.logout);
router.get('/me', auth, userController.getCurrentUser);
router.put('/me', auth, userController.updateCurrentUser);
router.get('/:id', userController.getUser);
router.get('/:id/deals', userController.getUserDeals);
router.get('/:id/followers', userController.getUserFollowers);
router.get('/:id/following', userController.getUserFollowing);
router.post('/:id/follow', auth, userController.followUser);
router.delete('/:id/follow', auth, userController.unfollowUser);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.post('/verify-email', userController.verifyEmail);

module.exports = router;    