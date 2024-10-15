const mongoose = require('mongoose');

const affiliateClickSchema = new mongoose.Schema({
  originalUrl: String,
  affiliateUrl: String,
  dealId: String,
  userId: String,
  platform: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AffiliateClick', affiliateClickSchema);
