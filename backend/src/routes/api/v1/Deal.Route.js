const express = require('express');
const router = express.Router();
const dealController = require('../../../controllers/dealController');
const auth = require('../../../middleware/auth');
const rateLimit = require('../../../middleware/rateLimit');

router.get('/', dealController.getDeals);
router.post('/', auth, rateLimit.createDeal, dealController.createDeal);
router.get('/:id', dealController.getDeal);
router.put('/:id', auth, dealController.updateDeal);
router.delete('/:id', auth, dealController.deleteDeal);
router.post('/:id/vote', auth, rateLimit.vote, dealController.voteDeal);
router.get('/:id/comments', dealController.getDealComments);
router.post('/:id/comments', auth, rateLimit.comment, dealController.addComment);

// These routes might not be implemented yet in your dealController
// Uncomment them when you've implemented the corresponding controller methods
// router.get('/search', dealController.searchDeals);
// router.get('/categories', dealController.getCategories);
// router.get('/stores', dealController.getStores);
// router.get('/trending', dealController.getTrendingDeals);
// router.get('/expiring-soon', dealController.getExpiringSoonDeals);

module.exports = router;