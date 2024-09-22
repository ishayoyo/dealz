const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', required: true, index: true },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  status: { type: String, enum: ['active', 'deleted'], default: 'active' },
  voteScore: { type: Number, default: 0 },
  votes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    value: { type: Number, enum: [-1, 1] }
  }]
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      ret.createdAt = ret.createdAt.toISOString();
      ret.updatedAt = ret.updatedAt.toISOString();
      return ret;
    }
  },
  toObject: { virtuals: true }
});

commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment'
});

commentSchema.virtual('voteCount').get(function() {
  return this.votes.length;
});

module.exports = mongoose.model('Comment', commentSchema);