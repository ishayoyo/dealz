// File: src/models/Deal.Model.js

const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  title: { type: String, required: true, index: 'text' },
  description: { type: String, index: 'text' },
  price: { type: Number, required: true },
  originalPrice: Number,
  currency: { type: String, default: 'USD' },
  url: { type: String, required: true },
  imageUrl: { type: String, required: true },
  userUploadedImage: { type: Boolean, default: false },
  store: { type: String, index: true },
  category: { type: String, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['active', 'expired', 'deleted'], default: 'active', index: true },
  expiresAt: Date,
  tags: [{ type: String, index: true }],
  metadata: {
    source: String,
    affiliate: Boolean,
    affiliateCode: String
  },
  priceHistory: [{
    price: Number,
    date: { type: Date, default: Date.now }
  }],
  analytics: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 }
  },
  location: {
    country: String,
    city: String
  },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vote' }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

dealSchema.virtual('voteCount', {
  ref: 'Vote',
  localField: '_id',
  foreignField: 'deal',
  count: true
});

dealSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'deal',
  count: true
});

dealSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Deal', dealSchema);