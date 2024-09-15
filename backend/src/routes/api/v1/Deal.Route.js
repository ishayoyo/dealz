const express = require('express');
const router = express.Router();
const dealController = require('../../../controllers/dealController');
const auth = require('../../../middleware/auth');

router.get('/', dealController.getDeals);
router.post('/', auth, dealController.createDeal);
router.get('/search', dealController.searchDeals);
router.get('/categories', dealController.getCategories);
router.get('/stores', dealController.getStores);
router.get('/trending', dealController.getTrendingDeals);
router.get('/expiring-soon', dealController.getExpiringSoonDeals);

// Move these routes to the bottom
router.get('/:id', dealController.getDeal);
router.put('/:id', auth, dealController.updateDeal);
router.delete('/:id', auth, dealController.deleteDeal);
router.post('/:id/vote', auth, dealController.voteDeal);
router.get('/:id/comments', dealController.getDealComments);

module.exports = router;