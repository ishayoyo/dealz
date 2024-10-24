const mongoose = require('mongoose');

const s2sPixelSchema = new mongoose.Schema({
  network: {
    type: String,
    required: [true, 'Network is required']
  },
  event: {
    type: String,
    required: [true, 'Event is required']
  },
  url: {
    type: String,
    required: [true, 'Pixel URL is required']
  }
}, { timestamps: true });

const S2SPixel = mongoose.model('S2SPixel', s2sPixelSchema);

module.exports = S2SPixel;

