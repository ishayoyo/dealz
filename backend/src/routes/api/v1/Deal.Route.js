const express = require('express');
const router = express.Router();
const dealController = require('../../../controllers/dealController');
const userController = require('../../../controllers/userController');
const auth = require('../../../middleware/auth');
const multer = require('multer');
const commentController = require('../../../controllers/commentController');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // limit file size to 5MB
  }
});

// Public routes
router.get('/', dealController.getDeals);
router.get('/search', dealController.searchDeals);
router.get('/categories', dealController.getCategories);
router.get('/stores', dealController.getStores);
router.get('/trending', dealController.getTrendingDeals);
router.get('/expiring-soon', dealController.getExpiringSoonDeals);

// Routes that require authentication
router.use(auth);

router.get('/followed', dealController.getFollowedDeals);
router.post('/', dealController.createDeal);
router.post('/fetch-image', dealController.fetchImage);
router.post('/upload-image', upload.single('image'), dealController.uploadImage);
router.get('/check-image-uploads', dealController.checkImageUploads);

// Routes with :id parameter
router.get('/:id', dealController.getDeal);
router.get('/:id/comments', commentController.getComments);
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
