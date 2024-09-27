const express = require('express');
const router = express.Router();
const notificationController = require('../../../controllers/notificationController');
const auth = require('../../../middleware/auth');

router.use(auth);

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;