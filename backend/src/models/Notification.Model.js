const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['NEW_DEAL', 'NEW_COMMENT', 'DEAL_FOLLOW', 'USER_FOLLOW', 'SYSTEM', 'FOLLOW', 'MENTION', 'NEW_FOLLOWER', 'DEAL_APPROVED'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedDeal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },
  relatedComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ 
  recipient: 1, 
  type: 1, 
  relatedUser: 1, 
  relatedDeal: 1, 
  createdAt: -1 
});

module.exports = mongoose.model('Notification', notificationSchema);