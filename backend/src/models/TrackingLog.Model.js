const mongoose = require('mongoose');

const trackingLogSchema = new mongoose.Schema({
  eventName: String,
  parameters: {
    dealId: String,
    dealTitle: String,
    dealPrice: Number,
    subid: String
  },
  userId: String,
  ip: String,
  userAgent: String,
  pixelFired: { type: Boolean, default: false },
  pixelResponse: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TrackingLog', trackingLogSchema);
