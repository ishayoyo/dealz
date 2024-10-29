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

  async createFollowNotification(followerId, followedId, customMessage) {
    const notification = new Notification({
      recipient: followedId,
      type: 'USER_FOLLOW', // Change this from 'NEW_FOLLOWER' to 'USER_FOLLOW'
      content: customMessage,
      relatedUser: followerId
    });

    await notification.save();
    this.io.to(followedId.toString()).emit('notification', notification);
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

  async createDealFollowNotification(followerId, dealOwnerId, dealId, customMessage) {
    const notification = new Notification({
      recipient: dealOwnerId,
      type: 'DEAL_FOLLOW',
      content: customMessage, // Use the custom message
      relatedUser: followerId,
      relatedDeal: dealId
    });

    await notification.save();
    this.io.to(dealOwnerId.toString()).emit('notification', notification);
  }

  async createDealApprovalNotification(userId, dealId, dealTitle) {
    return this.createNotification({
      recipient: userId,
      type: 'DEAL_APPROVED',
      content: `Your deal "${dealTitle}" has been approved!`,
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

  async markAllAsRead(userId) {
    try {
      // First update all notifications to read
      await Notification.updateMany(
        { recipient: userId, read: false },
        { $set: { read: true } }
      );
      
      // Fetch updated notifications with populated data
      const updatedNotifications = await Notification.find({ recipient: userId })
        .populate('relatedUser', 'username profilePicture')
        .populate('relatedDeal', 'title')
        .populate('relatedComment', 'content')
        .lean();
      
      // Process each notification to preserve existing data
      const processedNotifications = updatedNotifications.map(notification => {
        // Create a deep copy to avoid reference issues
        const processed = JSON.parse(JSON.stringify(notification));

        // Handle relatedUser
        if (notification.relatedUser) {
          processed.relatedUser = {
            _id: notification.relatedUser._id,
            username: notification.relatedUser.username || null,
            profilePicture: notification.relatedUser.profilePicture || null
          };
        }

        // Handle relatedDeal
        if (notification.relatedDeal) {
          processed.relatedDeal = {
            _id: notification.relatedDeal._id,
            title: notification.relatedDeal.title || null
          };
        }

        // Handle relatedComment
        if (notification.relatedComment) {
          processed.relatedComment = {
            _id: notification.relatedComment._id,
            content: notification.relatedComment.content || null
          };
        }

        return processed;
      });

      // Emit socket events with processed notifications
      processedNotifications.forEach(notification => {
        this.io.to(userId.toString()).emit('updateNotification', notification);
      });

      return processedNotifications;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;