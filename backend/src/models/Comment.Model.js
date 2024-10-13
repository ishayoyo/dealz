const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  content: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', required: true, index: true },
  status: { type: String, enum: ['active', 'deleted'], default: 'active' },
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

module.exports = mongoose.model('Comment', commentSchema);
