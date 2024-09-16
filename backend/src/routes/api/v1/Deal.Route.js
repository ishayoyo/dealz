// File: src/routes/api/v1/Deal.Route.js

const express = require('express');
const router = express.Router();
const dealController = require('../../../controllers/dealController');
const auth = require('../../../middleware/auth');
const multer = require('multer');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // limit file size to 5MB
  }
});

router.get('/', dealController.getDeals);
router.post('/', auth, dealController.createDeal);
router.get('/search', dealController.searchDeals);
router.get('/categories', dealController.getCategories);
router.get('/stores', dealController.getStores);
router.get('/trending', dealController.getTrendingDeals);
router.get('/expiring-soon', dealController.getExpiringSoonDeals);

// Add the new route for fetching image
router.post('/fetch-image', dealController.fetchImage);

// Updated route for uploading image
router.post('/upload-image', auth, upload.single('image'), dealController.uploadImage);

// Move these routes to the bottom
router.get('/:id', dealController.getDeal);
router.put('/:id', auth, dealController.updateDeal);
router.delete('/:id', auth, dealController.deleteDeal);
router.post('/:id/vote', auth, dealController.voteDeal);
router.get('/:id/comments', dealController.getDealComments);

module.exports = router;