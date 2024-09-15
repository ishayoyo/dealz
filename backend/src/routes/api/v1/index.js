const express = require('express');
const router = express.Router();

const userRoutes = require('./User.Route');
const dealRoutes = require('./Deal.Route');
const commentRoutes = require('./Comment.Route');
const adminRoutes = require('./Admin.Route');

router.use('/users', userRoutes);
router.use('/deals', dealRoutes);
router.use('/comments', commentRoutes);
router.use('/admin', adminRoutes);

module.exports = router;