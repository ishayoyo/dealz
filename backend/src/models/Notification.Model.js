const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['follow', 'comment', 'deal_alert', 'vote'], required: true },
    content: String,
    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedDeal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
    relatedComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, index: true }
  });
  
  notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;