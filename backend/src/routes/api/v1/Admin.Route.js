const express = require('express');
const router = express.Router();
const adminController = require('../../../controllers/adminController');
const auth = require('../../../middleware/auth');
const isAdmin = require('../../../middleware/isAdmin');

router.use(auth, isAdmin);

router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);
router.get('/deals', adminController.getDeals);
router.delete('/deals/:id', adminController.deleteDeal);

module.exports = router;