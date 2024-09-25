const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['NEW_DEAL', 'NEW_COMMENT', 'DEAL_FOLLOW', 'USER_FOLLOW', 'SYSTEM', 'FOLLOW'], // Add 'FOLLOW' here
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

module.exports = mongoose.model('Notification', notificationSchema);