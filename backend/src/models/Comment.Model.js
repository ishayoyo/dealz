const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', required: true, index: true },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  status: { type: String, enum: ['active', 'deleted'], default: 'active' }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment'
});

module.exports = mongoose.model('Comment', commentSchema);