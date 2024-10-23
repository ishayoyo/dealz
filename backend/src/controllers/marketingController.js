// backend/src/controllers/marketingController.js

const TrackingEvent = require('../models/TrackingEvent.Model');
const TrackingParameter = require('../models/TrackingParameter.Model');
const TrackingLog = require('../models/TrackingLog.Model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const axios = require('axios');

exports.logTrackingEvent = catchAsync(async (req, res, next) => {
  const { eventName, parameters } = req.body;
  const userId = req.user ? req.user._id : null;

  console.log('Logging tracking event:', { eventName, parameters, userId });

  const log = await TrackingLog.create({
    eventName,
    parameters,
    userId,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  console.log('Tracking event logged:', log);

  // Fire pixel if exists
  const event = await TrackingEvent.findOne({ name: eventName });
  console.log('Found event:', event);
  if (event && event.pixelUrl) {
    try {
      console.log('Attempting to fire pixel:', event.pixelUrl);
      const pixelResponse = await axios.get(event.pixelUrl, { params: parameters });
      console.log('Pixel response:', pixelResponse.status);
      log.pixelFired = true;
      log.pixelResponse = pixelResponse.status.toString();
      await log.save();
      console.log('Updated log after pixel fire:', log);
    } catch (error) {
      console.error('Error firing pixel:', error);
    }
  } else {
    console.log('No pixel URL found for event:', eventName);
  }

  res.status(201).json({
    status: 'success',
    data: { log }
  });
});

exports.getTrackingStats = catchAsync(async (req, res, next) => {
  console.log('Fetching tracking stats');
  
  const { startDate, endDate } = req.query;
  const query = {};
  if (startDate && endDate) {
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const stats = await TrackingLog.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$eventName',
        totalCount: { $sum: 1 },
        pixelFiredCount: {
          $sum: { $cond: ['$pixelFired', 1, 0] }
        }
      }
    }
  ]);

  console.log('Raw aggregation result:', stats);

  const formattedStats = stats.reduce((acc, stat) => {
    acc[stat._id] = {
      totalCount: stat.totalCount,
      pixelFiredCount: stat.pixelFiredCount
    };
    return acc;
  }, {});

  console.log('Formatted stats:', formattedStats);

  res.status(200).json({
    status: 'success',
    data: { stats: formattedStats }
  });
});

exports.addTrackingEvent = catchAsync(async (req, res, next) => {
  const { name, description, pixelUrl } = req.body;
  const event = await TrackingEvent.create({ name, description, pixelUrl });
  res.status(201).json({
    status: 'success',
    data: { event }
  });
});

exports.getTrackingEvents = catchAsync(async (req, res, next) => {
  const events = await TrackingEvent.find();
  res.status(200).json({
    status: 'success',
    data: { events }
  });
});

exports.updateTrackingEvent = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, pixelUrl } = req.body;
  const event = await TrackingEvent.findByIdAndUpdate(id, { name, description, pixelUrl }, { new: true });
  if (!event) {
    return next(new AppError('No event found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { event }
  });
});

exports.deleteTrackingEvent = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const event = await TrackingEvent.findByIdAndDelete(id);
  if (!event) {
    return next(new AppError('No event found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.addTrackingParameter = catchAsync(async (req, res, next) => {
  const { name, description, type } = req.body;
  const parameter = await TrackingParameter.create({ name, description, type });
  res.status(201).json({
    status: 'success',
    data: { parameter }
  });
});

exports.getTrackingParameters = catchAsync(async (req, res, next) => {
  const parameters = await TrackingParameter.find();
  res.status(200).json({
    status: 'success',
    data: { parameters }
  });
});

exports.updateTrackingParameter = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, type } = req.body;
  const parameter = await TrackingParameter.findByIdAndUpdate(id, { name, description, type }, { new: true });
  if (!parameter) {
    return next(new AppError('No parameter found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { parameter }
  });
});

exports.deleteTrackingParameter = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const parameter = await TrackingParameter.findByIdAndDelete(id);
  if (!parameter) {
    return next(new AppError('No parameter found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getSubidStats = catchAsync(async (req, res, next) => {
  const stats = await TrackingLog.aggregate([
    {
      $group: {
        _id: '$parameters.subid',
        totalClicks: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        conversions: {
          $sum: {
            $cond: [{ $eq: ['$eventName', 'purchase'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        subid: '$_id',
        totalClicks: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        conversionRate: {
          $cond: [
            { $eq: ['$totalClicks', 0] },
            0,
            { $divide: ['$conversions', '$totalClicks'] }
          ]
        }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats }
  });
});

exports.testPixel = catchAsync(async (req, res, next) => {
  console.log('Test pixel fired with params:', req.query);
  res.status(200).send('Pixel fired successfully');
});
