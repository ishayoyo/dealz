const mongoose = require('mongoose');

const trackingParameterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Parameter name is required'],
    unique: true
  },
  description: String,
  type: {
    type: String,
    enum: ['string', 'number', 'boolean'],
    default: 'string'
  }
}, { timestamps: true });

module.exports = mongoose.model('TrackingParameter', trackingParameterSchema);
