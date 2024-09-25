// File: services/NotificationService.js

const Notification = require('../models/Notification.Model');

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  async createNotification(data) {
    try {
      const notification = new Notification({
        recipient: data.recipient,
        type: data.type,
        content: data.content,
        relatedUser: data.relatedUser,
        relatedDeal: data.relatedDeal,
        relatedComment: data.relatedComment // Make sure this is set for comment notifications
      });
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

  async createFollowNotification(followerId, followedId) {
    return this.createNotification({
      recipient: followedId,
      type: 'USER_FOLLOW', // Change this from 'FOLLOW' to 'USER_FOLLOW'
      content: 'You have a new follower!',
      relatedUser: followerId
    });
  }

  async createCommentNotification(commenterId, dealOwnerId, dealId) {
    return this.createNotification({
      recipient: dealOwnerId,
      type: 'COMMENT',
      content: 'Someone commented on your deal!',
      relatedUser: commenterId,
      relatedDeal: dealId
    });
  }

  async createDealFollowNotification(followerId, dealOwnerId, dealId) {
    return this.createNotification({
      recipient: dealOwnerId,
      type: 'DEAL_FOLLOW',
      content: 'Someone followed your deal!',
      relatedUser: followerId,
      relatedDeal: dealId
    });
  }

  async getUnreadNotifications(userId) {
    try {
      console.log('Fetching unread notifications for user:', userId);
      
      // Log the query
      console.log('Query:', { recipient: userId, read: false });
      
      // Execute the find operation separately
      const query = Notification.find({ recipient: userId, read: false })
        .sort({ createdAt: -1 });
      console.log('Query object:', query);
      
      // Execute population separately
      const populatedQuery = query
        .populate('relatedUser', 'username profilePicture')
        .populate('relatedDeal', 'title')
        .populate('relatedComment', 'content');
      console.log('Populated query object:', populatedQuery);
      
      // Execute the query
      const notifications = await populatedQuery.lean();
      
      console.log('Fetched notifications:', JSON.stringify(notifications, null, 2));
      return notifications;
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
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

  async createMentionNotification(mentionedById, mentionedUserId, dealId, commentId) {
    console.log('Creating mention notification:', { mentionedById, mentionedUserId, dealId, commentId });
    return this.createNotification({
      recipient: mentionedUserId,
      type: 'MENTION',
      content: 'You were mentioned in a comment',
      relatedUser: mentionedById,
      relatedDeal: dealId,
      relatedComment: commentId
    });
  }
}

module.exports = NotificationService;