// File: services/NotificationService.js

const Notification = require('../models/Notification.Model');

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  async createNotification(data) {
    try {
      const notification = new Notification(data);
      await notification.save();
      this.sendNotification(notification);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  sendNotification(notification) {
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