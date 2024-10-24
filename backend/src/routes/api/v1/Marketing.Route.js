// backend/src/routes/api/v1/Marketing.Route.js

const express = require('express');
const router = express.Router();
const marketingController = require('../../../controllers/marketingController');
const auth = require('../../../middleware/auth');
const isAdmin = require('../../../middleware/isAdmin');

// Public routes (no authentication required)
router.post('/tracking/log', marketingController.logTrackingEvent);

// Protected routes (require authentication and admin privileges)
router.use(auth, isAdmin);

router.get('/stats/overall', marketingController.getOverallStats);
router.get('/stats/network-comparison', marketingController.getNetworkComparison);
router.get('/stats/network-performance', marketingController.getNetworkPerformance);
router.get('/stats/top-campaigns', marketingController.getTopCampaigns);
router.get('/stats/conversion-funnel', marketingController.getConversionFunnel);

router.get('/s2s-pixels', marketingController.getS2SPixels);
router.post('/s2s-pixel', marketingController.addS2SPixel);
router.put('/s2s-pixel/:id', marketingController.updateS2SPixel);
router.delete('/s2s-pixel/:id', marketingController.deleteS2SPixel);

// Keep existing routes
router.post('/tracking/add-event', marketingController.addTrackingEvent);
router.get('/tracking/events', marketingController.getTrackingEvents);
router.put('/tracking/event/:id', marketingController.updateTrackingEvent);
router.delete('/tracking/event/:id', marketingController.deleteTrackingEvent);

router.post('/tracking/add-parameter', marketingController.addTrackingParameter);
router.get('/tracking/parameters', marketingController.getTrackingParameters);
router.put('/tracking/parameter/:id', marketingController.updateTrackingParameter);
router.delete('/tracking/parameter/:id', marketingController.deleteTrackingParameter);

router.get('/tracking/stats', marketingController.getTrackingStats);
router.get('/tracking/subid-stats', marketingController.getSubidStats);

router.get('/test-pixel', marketingController.testPixel);

module.exports = router;
