const express = require('express');
const router = express.Router();
const NotificationService = require('../services/NotificationService');

module.exports = function(io) {
  const notificationService = new NotificationService(io);

  router.post('/test-notification', async (req, res) => {
    console.log('Received request body:', req.body);
    try {
      const { recipientId, message } = req.body;
      if (!recipientId) {
        return res.status(400).json({ success: false, error: 'recipientId is required' });
      }
      const notification = await notificationService.createNotification({
        recipient: recipientId,
        content: message || 'This is a test notification',
        // The type will be set to 'SYSTEM' in the NotificationService
      });
      res.json({ success: true, notification });
    } catch (error) {
      console.error('Error in test notification route:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};