const activitySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actionType: { type: String, enum: ['post_deal', 'comment', 'follow', 'vote', 'save_deal'], required: true },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now, index: true }
  });
  
  activitySchema.index({ user: 1, createdAt: -1 });