const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', required: true },
  value: { type: Number, enum: [-1, 1], required: true }
}, { 
  timestamps: true 
});

voteSchema.index({ user: 1, deal: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);