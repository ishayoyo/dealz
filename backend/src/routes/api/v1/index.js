const express = require('express');
const router = express.Router();

const userRoutes = require('./User.Route');
const dealRoutes = require('./Deal.Route');
const commentRoutes = require('./Comment.Route');
const adminRoutes = require('./Admin.Route');
const notificationRoutes = require('./Notification.Route');
const linkRoutes = require('./Link.Route');

router.use('/users', userRoutes);
router.use('/deals', dealRoutes);
router.use('/comments', commentRoutes);
router.use('/admin', adminRoutes);
router.use('/users/notifications', notificationRoutes);
router.use('/link', linkRoutes);

module.exports = router;
