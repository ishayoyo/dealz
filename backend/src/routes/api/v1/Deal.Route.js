const express = require('express');
const router = express.Router();
const dealController = require('../../../controllers/dealController');
const userController = require('../../../controllers/userController');
const auth = require('../../../middleware/auth');
const multer = require('multer');
const commentController = require('../../../controllers/commentController');
const authController = require('../../../controllers/authController');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // limit file size to 5MB
  }
});

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// Public routes
router.get('/', dealController.getDeals);
router.get('/search', dealController.searchDeals);
router.get('/categories', dealController.getCategories);
router.get('/stores', dealController.getStores);
router.get('/trending', dealController.getTrendingDeals);
router.get('/expiring-soon', dealController.getExpiringSoonDeals);

// Routes that require authentication
router.use(auth);

// Add these new routes BEFORE any routes with :id parameters
router.get('/unused-images-count', isAdmin, dealController.getUnusedImagesCount);
router.delete('/delete-unused-images', isAdmin, dealController.deleteUnusedImages);

router.get('/followed', dealController.getFollowedDeals);
router.post('/', dealController.createDeal);
router.post('/fetch-image', dealController.fetchImage);
router.post('/upload-image', upload.single('image'), dealController.uploadImage);
router.get('/check-image-uploads', dealController.checkImageUploads);

// Add the clear cache route here as well
router.post('/clear-cache', isAdmin, dealController.clearDealsCache);

// Routes with :id parameter should come after specific routes
router.get('/:id', dealController.getDeal);
router.get('/:id/status', dealController.checkDealStatus);
router.delete('/:id', dealController.deleteDeal);
router.post('/:id/buy', dealController.markAsBought);
router.post('/:id/follow', dealController.followDeal);
router.delete('/:id/follow', dealController.unfollowDeal);
router.post('/:id/comments', commentController.createComment);

// Uncomment if you implement these routes in the future
// router.put('/:id', dealController.updateDeal);
// router.get('/:id/mentionable-users', dealController.getMentionableUsers);

module.exports = router;
