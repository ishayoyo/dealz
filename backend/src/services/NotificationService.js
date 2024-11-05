// File: services/NotificationService.js

const Notification = require('../models/Notification.Model');

class NotificationService {
  constructor(io) {
    this.io = io;
    this.recentNotifications = new Map();
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
    try {
      console.log('Sending notification:', {
        recipient: notification.recipient.toString(),
        type: notification.type,
        content: notification.content
      });

      this.io.to(notification.recipient.toString()).emit('newNotification', notification);
    } catch (error) {
      console.error('Error in sendNotification:', error);
      throw error;
    }
  }

  async createFollowNotification(followerId, followedId, customMessage) {
    try {
      // Create a unique key for this follow action
      const notificationKey = `follow:${followerId}:${followedId}`;
      
      // Check for duplicate within time window (5 minutes)
      const isDuplicate = await this.isDuplicateNotification(notificationKey, 5 * 60 * 1000);
      
      if (isDuplicate) {
        console.log('Duplicate follow notification prevented within time window');
        return null;
      }

      // Check for existing unread notification
      const existingNotification = await Notification.findOne({
        recipient: followedId,
        relatedUser: followerId,
        type: 'USER_FOLLOW',
        read: false
      });

      if (existingNotification) {
        console.log('Unread follow notification already exists');
        return existingNotification;
      }

      // Create new notification if no duplicates found
      const notification = new Notification({
        recipient: followedId,
        type: 'USER_FOLLOW',
        content: customMessage,
        relatedUser: followerId
      });

      await notification.save();

      // Populate the notification
      const populatedNotification = await Notification.findById(notification._id)
        .populate('relatedUser', 'username profilePicture avatarSeed')
        .lean();

      // Emit the notification
      this.io.to(followedId.toString()).emit('newNotification', populatedNotification);
      
      return populatedNotification;
    } catch (error) {
      console.error('Error in createFollowNotification:', error);
      throw error;
    }
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
        .populate('relatedUser', 'username profilePicture avatarSeed')
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

  // Add this new method to check for duplicate notifications
  async isDuplicateNotification(key, timeWindowMs = 300000) { // 5 minutes default
    const now = Date.now();
    const lastNotification = this.recentNotifications.get(key);
    
    if (lastNotification && (now - lastNotification) < timeWindowMs) {
      return true;
    }
    
    // Set the timestamp for this notification
    this.recentNotifications.set(key, now);
    return false;
  }

  // Add cleanup method to prevent memory leaks
  cleanup() {
    const now = Date.now();
    for (const [key, timestamp] of this.recentNotifications.entries()) {
      if (now - timestamp > 300000) { // Clean up entries older than 5 minutes
        this.recentNotifications.delete(key);
      }
    }
  }

  // Add a static method to create and manage a singleton instance
  static getInstance(io) {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService(io);
    }
    return NotificationService.instance;
  }
}

// Add periodic cleanup
setInterval(() => {
  const instance = NotificationService.getInstance();
  instance.cleanup();
}, 300000); // Run cleanup every 5 minutes

module.exports = NotificationService;