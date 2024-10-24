// backend/src/controllers/marketingController.js

const TrackingEvent = require('../models/TrackingEvent.Model');
const TrackingParameter = require('../models/TrackingParameter.Model');
const TrackingLog = require('../models/TrackingLog.Model');
const S2SPixel = require('../models/S2SPixel.Model');
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
        uniqueUsers: { $addToSet: '$userId' },
        revenueTotal: { $sum: '$parameters.revenue' },  // Add revenue tracking
        conversionRate: {
          $avg: { $cond: ['$converted', 1, 0] }
        }
      }
    }
  ]);

  console.log('Raw aggregation result:', stats);

  const formattedStats = stats.reduce((acc, stat) => {
    acc[stat._id] = {
      totalCount: stat.totalCount,
      uniqueUsers: stat.uniqueUsers.length,
      revenueTotal: stat.revenueTotal,
      conversionRate: stat.conversionRate
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
  const { network, subid, eventName } = req.query;
  
  console.log('Test pixel fired with params:', {
    network,
    subid,
    eventName,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // You can add logic here to verify the pixel fire
  const response = {
    status: 'success',
    message: 'Pixel fired successfully',
    params: {
      network,
      subid,
      eventName,
      timestamp: new Date().toISOString()
    }
  };

  // Send response based on requested format
  if (req.query.format === 'image') {
    // Send a 1x1 transparent GIF
    const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': buffer.length
    });
    res.end(buffer);
  } else {
    res.status(200).json(response);
  }
});

const firePixel = async (url, retries = 3) => {
  try {
    const response = await axios.get(url);
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return firePixel(url, retries - 1);
    }
    throw error;
  }
};

exports.getOverallStats = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const query = {};
  if (startDate && endDate) {
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const stats = await TrackingLog.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalClicks: { $sum: 1 },
        totalConversions: { $sum: { $cond: [{ $eq: ['$eventName', 'purchase'] }, 1, 0] } },
        totalRevenue: { $sum: '$parameters.revenue' }
      }
    },
    {
      $project: {
        _id: 0,
        totalClicks: 1,
        totalConversions: 1,
        overallCR: { $multiply: [{ $divide: ['$totalConversions', '$totalClicks'] }, 100] },
        totalRevenue: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats: stats[0] || {} }
  });
});

exports.getNetworkComparison = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const query = {};
  if (startDate && endDate) {
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const networkComparison = await TrackingLog.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$parameters.network',
        clicks: { $sum: 1 },
        conversions: { $sum: { $cond: [{ $eq: ['$eventName', 'purchase'] }, 1, 0] } }
      }
    },
    {
      $project: {
        network: '$_id',
        clicks: 1,
        conversions: 1,
        _id: 0
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: { networkComparison }
  });
});

exports.getNetworkPerformance = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const query = {};
  if (startDate && endDate) {
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const networkPerformance = await TrackingLog.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$parameters.network',
        clicks: { $sum: 1 },
        conversions: { $sum: { $cond: [{ $eq: ['$eventName', 'purchase'] }, 1, 0] } },
        revenue: { $sum: '$parameters.revenue' }
      }
    },
    {
      $project: {
        network: '$_id',
        clicks: 1,
        conversions: 1,
        revenue: 1,
        cr: { $multiply: [{ $divide: ['$conversions', '$clicks'] }, 100] },
        epc: { $divide: ['$revenue', '$clicks'] },
        _id: 0
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: { networkPerformance }
  });
});

exports.getTopCampaigns = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const query = {};
  if (startDate && endDate) {
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const topCampaigns = await TrackingLog.aggregate([
    { $match: query },
    {
      $group: {
        _id: { campaign: '$parameters.campaign', network: '$parameters.network' },
        clicks: { $sum: 1 },
        conversions: { $sum: { $cond: [{ $eq: ['$eventName', 'purchase'] }, 1, 0] } },
        revenue: { $sum: '$parameters.revenue' }
      }
    },
    {
      $project: {
        campaign: '$_id.campaign',
        network: '$_id.network',
        clicks: 1,
        conversions: 1,
        revenue: 1,
        cr: { $multiply: [{ $divide: ['$conversions', '$clicks'] }, 100] },
        _id: 0
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    status: 'success',
    data: { topCampaigns }
  });
});

exports.getConversionFunnel = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const query = {};
  if (startDate && endDate) {
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const funnelStages = ['view', 'click', 'lead', 'purchase'];
  const conversionFunnel = await TrackingLog.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$eventName',
        users: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        stage: '$_id',
        users: { $size: '$users' },
        _id: 0
      }
    },
    { $sort: { users: -1 } }
  ]);

  // Ensure all funnel stages are present
  const fullFunnel = funnelStages.map(stage => {
    const found = conversionFunnel.find(item => item.stage === stage);
    return found || { stage, users: 0 };
  });

  res.status(200).json({
    status: 'success',
    data: { conversionFunnel: fullFunnel }
  });
});

exports.getS2SPixels = catchAsync(async (req, res, next) => {
  const pixels = await S2SPixel.find();
  res.status(200).json({
    status: 'success',
    data: { pixels }
  });
});

exports.addS2SPixel = catchAsync(async (req, res, next) => {
  console.log('Received request body:', req.body);
  const { network, event, url } = req.body;
  if (!network || !event || !url || network.trim() === '' || event.trim() === '' || url.trim() === '') {
    return next(new AppError('Network, event, and URL are required and cannot be empty', 400));
  }
  const pixel = await S2SPixel.create({ network, event, url });
  res.status(201).json({
    status: 'success',
    data: { pixel }
  });
});

exports.updateS2SPixel = catchAsync(async (req, res, next) => {
  console.log('Received request body:', req.body);
  const { id } = req.params;
  const { network, event, url } = req.body;
  if (!network || !event || !url || network.trim() === '' || event.trim() === '' || url.trim() === '') {
    return next(new AppError('Network, event, and URL are required and cannot be empty', 400));
  }
  const pixel = await S2SPixel.findByIdAndUpdate(id, { network, event, url }, { new: true, runValidators: true });
  if (!pixel) {
    return next(new AppError('No pixel found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { pixel }
  });
});

exports.deleteS2SPixel = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const pixel = await S2SPixel.findByIdAndDelete(id);
  if (!pixel) {
    return next(new AppError('No pixel found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

