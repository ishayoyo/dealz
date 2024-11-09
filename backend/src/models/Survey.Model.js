const mongoose = require('mongoose');

const surveyResponseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  responses: [{
    questionId: {
      type: String,
      required: true
    },
    questionText: {
      type: String,
      required: true
    },
    responseValue: mongoose.Schema.Types.Mixed,
    questionType: {
      type: String,
      enum: ['rating', 'multiSelect', 'text'],
      required: true
    }
  }],
  additionalFeedback: {
    type: String,
    trim: true,
    default: ''
  },
  platform: {
    type: String,
    enum: ['web', 'mobile'],
    default: 'web'
  }
}, {
  timestamps: true
});

// Ensure one response per user
surveyResponseSchema.index({ user: 1 }, { unique: true });

const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema);

module.exports = SurveyResponse; 