// File: services/NotificationService.js

const Notification = require('../models/Notification.Model');

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  async createNotification(data) {
    try {
      // Ensure 'content' is provided, use 'message' as content if available
      const notificationData = {
        ...data,
        content: data.content || data.message,
        // Use a valid type from your enum, e.g., 'SYSTEM' instead of 'TEST'
        type: 'SYSTEM'
      };

      const notification = new Notification(notificationData);
      await notification.save();
      console.log('New notification created:', notification);
      this.sendNotification(notification);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  sendNotification(notification) {
    console.log('Sending notification to user:', notification.recipient.toString());
    this.io.to(notification.recipient.toString()).emit('newNotification', notification);
  }

  async getUnreadNotifications(userId) {
    try {
      return await Notification.find({ recipient: userId, read: false })
        .sort('-createdAt')
        .populate('relatedUser', 'username profilePicture')
        .populate('relatedDeal', 'title')
        .populate('relatedComment', 'content');
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { read: true },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;