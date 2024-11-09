const express = require('express');
const router = express.Router();
const surveyController = require('../../../controllers/surveyController');
const auth = require('../../../middleware/auth');
const rateLimit = require('../../../middleware/rateLimit');
const isAdmin = require('../../../middleware/isAdmin');

// User routes
router.post('/submit', auth, rateLimit.survey, surveyController.submitSurvey);
router.get('/my-response', auth, surveyController.getMyResponse);
router.get('/status', auth, surveyController.getSurveyStatus);
router.post('/complete', auth, surveyController.markSurveyComplete);

// Admin routes
router.get('/metrics', auth, isAdmin, surveyController.getSurveyMetrics);
router.get('/responses', auth, isAdmin, surveyController.getAllResponses);
router.get('/analytics', auth, isAdmin, surveyController.getSurveyAnalytics);
router.get('/count', auth, isAdmin, surveyController.getSurveyCount);

module.exports = router;