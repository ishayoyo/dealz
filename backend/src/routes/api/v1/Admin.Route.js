const express = require('express');
const router = express.Router();
const adminController = require('../../../controllers/adminController');
const auth = require('../../../middleware/auth');
const isAdmin = require('../../../middleware/isAdmin');

router.use(auth, isAdmin);

router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/deals', adminController.getDeals);
router.put('/deals/:id', adminController.updateDeal);
router.delete('/deals/:id', adminController.deleteDeal);
router.get('/comments', adminController.getComments);
router.delete('/comments/:id', adminController.deleteComment);
router.get('/stats', adminController.getStats);

module.exports = router;