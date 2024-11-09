const SurveyResponse = require('../models/Survey.Model');
const User = require('../models/User.Model');

const surveyController = {
  async submitSurvey(req, res) {
    try {
      const { responses, additionalFeedback, platform } = req.body;
      
      // Format responses to match schema
      const formattedResponses = responses.map(response => ({
        questionId: response.question,
        questionText: response.question, // You might want to map this to actual questions
        responseValue: response.answer,
        questionType: response.type
      }));

      // Check for existing response
      const existingResponse = await SurveyResponse.findOne({ user: req.user.id });
      if (existingResponse) {
        return res.status(400).json({
          status: 'error',
          message: 'You have already submitted a survey response'
        });
      }

      // Create new survey response
      const surveyResponse = new SurveyResponse({
        user: req.user.id,
        responses: formattedResponses,
        additionalFeedback,
        platform
      });

      await surveyResponse.save();

      res.status(201).json({
        status: 'success',
        message: 'Survey response submitted successfully'
      });
    } catch (error) {
      console.error('Survey submission error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to submit survey response'
      });
    }
  },

  async getMyResponse(req, res) {
    try {
      const response = await SurveyResponse.findOne({ user: req.user.id });
      res.json({
        status: 'success',
        data: response
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch survey response'
      });
    }
  },

  async getAllResponses(req, res) {
    try {
      const responses = await SurveyResponse.find().populate('user', 'name email');
      res.json({
        status: 'success',
        data: responses
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch survey responses'
      });
    }
  },

  async getSurveyAnalytics(req, res) {
    try {
      const responses = await SurveyResponse.find().sort('-createdAt');
      
      // Process analytics data
      const ratingAnalytics = {};
      const featureUsage = {};
      const recentFeedback = [];

      responses.forEach(response => {
        // Process ratings
        response.responses.forEach(r => {
          if (r.questionType === 'rating') {
            if (!ratingAnalytics[r.questionId]) {
              ratingAnalytics[r.questionId] = {
                ratings: {},
                total: 0,
                sum: 0
              };
            }
            const analytics = ratingAnalytics[r.questionId];
            analytics.ratings[r.responseValue] = (analytics.ratings[r.responseValue] || 0) + 1;
            analytics.total++;
            analytics.sum += r.responseValue;
            analytics.average = analytics.sum / analytics.total;
          }
          
          // Process feature usage
          if (r.questionId === 'features') {
            r.responseValue.forEach(feature => {
              featureUsage[feature] = (featureUsage[feature] || 0) + 1;
            });
          }
        });

        // Process feedback
        if (response.additionalFeedback) {
          recentFeedback.push({
            _id: response._id,
            additionalFeedback: response.additionalFeedback,
            createdAt: response.createdAt
          });
        }
      });

      res.json({
        status: 'success',
        ratingAnalytics,
        featureUsage,
        recentFeedback: recentFeedback.slice(0, 5), // Only send the 5 most recent
        totalResponses: responses.length
      });
    } catch (error) {
      console.error('Error getting survey analytics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch survey analytics'
      });
    }
  },

  async getSurveyMetrics(req, res) {
    try {
      const totalResponses = await SurveyResponse.countDocuments();
      
      // Calculate average rating
      const responses = await SurveyResponse.find();
      let totalRating = 0;
      let ratingCount = 0;
      
      responses.forEach(response => {
        response.responses.forEach(r => {
          if (r.questionType === 'rating') {
            totalRating += r.responseValue;
            ratingCount++;
          }
        });
      });

      const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
      
      // Calculate response rate (assuming total users from your user collection)
      const User = require('../models/User.Model');
      const totalUsers = await User.countDocuments();
      const responseRate = totalUsers > 0 ? (totalResponses / totalUsers) * 100 : 0;

      res.json({
        status: 'success',
        totalResponses,
        averageRating,
        responseRate: Math.round(responseRate)
      });
    } catch (error) {
      console.error('Error getting survey metrics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch survey metrics'
      });
    }
  },

  async getSurveyCount(req, res) {
    try {
      const count = await SurveyResponse.countDocuments();
      res.json({
        status: 'success',
        count
      });
    } catch (error) {
      console.error('Error getting survey count:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch survey count'
      });
    }
  },

  async getSurveyStatus(req, res) {
    try {
      const user = await User.findById(req.user._id);
      res.status(200).json({
        status: 'success',
        survey: {
          completed: user.survey?.completed || false,
          completedAt: user.survey?.completedAt
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error checking survey status'
      });
    }
  },

  async markSurveyComplete(req, res) {
    try {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          'survey.completed': true,
          'survey.completedAt': new Date()
        },
        { new: true }
      );

      res.status(200).json({
        status: 'success',
        survey: user.survey
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error updating survey status'
      });
    }
  }
};

module.exports = surveyController; 