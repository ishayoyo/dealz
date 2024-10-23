const mongoose = require('mongoose');

const trackingEventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    unique: true
  },
  description: String,
  pixelUrl: String
}, { timestamps: true });

module.exports = mongoose.model('TrackingEvent', trackingEventSchema);

