// backend/src/routes/api/v1/Marketing.Route.js

const express = require('express');
const router = express.Router();
const marketingController = require('../../../controllers/marketingController');
const auth = require('../../../middleware/auth');
const isAdmin = require('../../../middleware/isAdmin');

// Public routes (no authentication required)
router.post('/tracking/log', (req, res, next) => {
  console.log('Tracking log route hit');
  marketingController.logTrackingEvent(req, res, next);
});

// Protected routes (require authentication and admin privileges)
router.use(auth, isAdmin);

router.post('/tracking/add-event', marketingController.addTrackingEvent);
router.get('/tracking/events', marketingController.getTrackingEvents);
router.put('/tracking/event/:id', marketingController.updateTrackingEvent);
router.delete('/tracking/event/:id', marketingController.deleteTrackingEvent);

router.post('/tracking/add-parameter', marketingController.addTrackingParameter);
router.get('/tracking/parameters', marketingController.getTrackingParameters);
router.put('/tracking/parameter/:id', marketingController.updateTrackingParameter);
router.delete('/tracking/parameter/:id', marketingController.deleteTrackingParameter);

router.get('/tracking/stats', (req, res, next) => {
  console.log('Tracking stats route hit');
  marketingController.getTrackingStats(req, res, next);
});

router.get('/tracking/subid-stats', marketingController.getSubidStats);

router.get('/test-pixel', marketingController.testPixel);

module.exports = router;
