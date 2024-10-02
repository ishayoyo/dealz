// src/controllers/adminController.js
const User = require('../models/User.Model');
const Deal = require('../models/Deal.Model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

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
  const deals = await Deal.find().populate('user', 'username');
  res.status(200).json({
    status: 'success',
    data: { deals }
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