const mongoose = require('mongoose');

const imageUploadSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  }
});

const ImageUpload = mongoose.model('ImageUpload', imageUploadSchema);

module.exports = ImageUpload;