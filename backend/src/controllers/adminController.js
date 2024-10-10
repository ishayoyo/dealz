// src/controllers/adminController.js
const User = require('../models/User.Model');
const Deal = require('../models/Deal.Model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const NotificationService = require('../services/NotificationService');

exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select('-password');
  res.status(200).json({
    status: 'success',
    data: { users }
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getDeals = catchAsync(async (req, res, next) => {
  const deals = await Deal.find()
    .populate('user', 'username')
    .sort('-createdAt');

  // Add the full image URL to each deal
  const dealsWithImageUrls = deals.map(deal => {
    const dealObj = deal.toObject();
    if (dealObj.image) {
      dealObj.image = `${process.env.BASE_URL}/images/${dealObj.image}`;
    }
    return dealObj;
  });

  res.status(200).json({
    status: 'success',
    data: { deals: dealsWithImageUrls }
  });
});

exports.deleteDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findByIdAndDelete(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.moderateDeal = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const deal = await Deal.findByIdAndUpdate(id, { status }, { new: true }).populate('user', 'username');

  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const io = req.app.get('io');
  if (status === 'approved') {
    io.emit('newDeal', { deal, status: 'approved' });
    
    // Create a notification for the deal owner
    const notificationService = new NotificationService(io);
    await notificationService.createDealApprovalNotification(deal.user._id, deal._id, deal.title);
  }

  res.status(200).json({
    status: 'success',
    data: { deal }
  });
});