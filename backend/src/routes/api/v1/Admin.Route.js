const express = require('express');
const router = express.Router();
const adminController = require('../../../controllers/adminController');
const auth = require('../../../middleware/auth');
const isAdmin = require('../../../middleware/isAdmin');

router.use(auth, isAdmin);

// Existing routes
router.get('/analytics', adminController.getAnalytics);
router.get('/deals-chart-data', adminController.getDealsChartData);
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);
router.get('/deals', adminController.getDeals);
router.delete('/deals/:id', adminController.deleteDeal);
router.patch('/deals/:id/moderate', adminController.moderateDeal);

// New routes to add
router.get('/users-chart-data', adminController.getUsersChartData);
router.get('/recent-activities', adminController.getRecentActivities);
router.get('/pending-deals', adminController.getPendingDeals);

// Add this line with the other routes
router.patch('/deals/:id', adminController.editDeal);

router.get('/affiliate-stats', auth, isAdmin, adminController.getAffiliateStats);

router.patch('/users/:id/verify', adminController.verifyUser);

// Add these new routes
router.get('/unused-images-count', adminController.getUnusedImagesCount);
router.delete('/delete-unused-images', adminController.deleteUnusedImages);

module.exports = router;
