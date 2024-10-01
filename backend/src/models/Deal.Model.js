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
    conversions: { type: Number, default: 0 },
    saves: { type: Number, default: 0 }
  },
  location: {
    country: String,
    city: String
  },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  saveCount: { type: Number, default: 0 },
  collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
  priceRange: { type: String, index: true },
  followCount: { type: Number, default: 0 },
  boughtCount: { type: Number, default: 0 },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  buyers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentCount: { type: Number, default: 0 },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add this before any virtual definitions
dealSchema.set('toObject', { getters: true });
dealSchema.set('toJSON', { getters: true });


dealSchema.index({ title: 'text', description: 'text', tags: 'text' });

dealSchema.index({ createdAt: -1, voteCount: -1, saveCount: -1 });

dealSchema.index({ followCount: -1, boughtCount: -1 });

const Deal = mongoose.model('Deal', dealSchema);
module.exports = Deal;