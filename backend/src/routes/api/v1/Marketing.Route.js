// backend/src/routes/api/v1/Marketing.Route.js

const express = require('express');
const router = express.Router();
const marketingController = require('../../../controllers/marketingController');
const auth = require('../../../middleware/auth');
const isAdmin = require('../../../middleware/isAdmin');

// Protected routes (require authentication and admin privileges)
router.use(auth, isAdmin);

router.get('/stats/overall', marketingController.getOverallStats);
router.get('/stats/network-comparison', marketingController.getNetworkComparison);
router.get('/stats/network-performance', marketingController.getNetworkPerformance);
router.get('/s2s-pixels', marketingController.getS2SPixels);
router.post('/s2s-pixel', marketingController.addS2SPixel);
router.put('/s2s-pixel/:id', marketingController.updateS2SPixel);
router.delete('/s2s-pixel/:id', marketingController.deleteS2SPixel);
router.get('/stats/pixel-performance', marketingController.getPixelPerformance);

module.exports = router;
