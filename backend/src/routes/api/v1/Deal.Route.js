// File: src/routes/api/v1/Deal.Route.js

const express = require('express');
const router = express.Router();
const dealController = require('../../../controllers/dealController');
const userController = require('../../../controllers/userController'); // Add this line if not already present
const auth = require('../../../middleware/auth');
const multer = require('multer');

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
router.get('/:id', dealController.getDeal);
router.get('/:id/comments', dealController.getDealComments);
router.get('/:id/status', auth, dealController.checkDealStatus);

// Routes that require authentication
router.use(auth);

router.post('/', dealController.createDeal);
router.put('/:id', dealController.updateDeal);
router.delete('/:id', dealController.deleteDeal);
router.post('/:id/vote', auth, dealController.voteDeal);
router.post('/:id/buy', dealController.markAsBought);
router.post('/:id/follow', dealController.followDeal);
router.delete('/:id/follow', dealController.unfollowDeal);
router.post('/:id/comments', dealController.addComment);

// Image-related routes
router.post('/fetch-image', dealController.fetchImage);
router.post('/upload-image', upload.single('image'), dealController.uploadImage);

// Add these new routes
router.get('/saved', auth, dealController.getSavedDeals);
router.post('/:id/save', auth, dealController.saveDeal);
router.delete('/:id/save', auth, dealController.unsaveDeal);

module.exports = router;