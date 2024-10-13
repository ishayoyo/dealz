const mongoose = require('mongoose');

const affiliateClickSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  affiliateUrl: { type: String, required: true },
  clickedAt: { type: Date, default: Date.now },
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('AffiliateClick', affiliateClickSchema);