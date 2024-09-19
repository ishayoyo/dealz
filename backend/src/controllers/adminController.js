const User = require('../models/User.Model');
const Deal = require('../models/Deal.Model');
const Comment = require('../models/Comment.Model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select('-password');

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users }
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user }
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
    results: deals.length,
    data: { deals }
  });
});

exports.updateDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { deal }
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

exports.getStats = catchAsync(async (req, res, next) => {
  const userCount = await User.countDocuments();
  const dealCount = await Deal.countDocuments();
  const commentCount = await Comment.countDocuments();

  res.status(200).json({
    status: 'success',
    data: {
      userCount,
      dealCount,
      commentCount
    }
  });
});

// More admin methods as needed

exports.getCollections = catchAsync(async (req, res, next) => {
  const users = await User.find().populate('collections');
  const collections = users.flatMap(user => user.collections);
  res.status(200).json({
    status: 'success',
    data: { collections }
  });
});

exports.updateCollection = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  const user = await User.findOne({ 'collections._id': req.params.id });
  if (!user) {
    return next(new AppError('No collection found with that ID', 404));
  }
  const collection = user.collections.id(req.params.id);
  collection.name = name;
  collection.description = description;
  await user.save();
  res.status(200).json({
    status: 'success',
    data: { collection }
  });
});

exports.deleteCollection = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ 'collections._id': req.params.id });
  if (!user) {
    return next(new AppError('No collection found with that ID', 404));
  }
  user.collections.id(req.params.id).remove();
  await user.save();
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getActivity = catchAsync(async (req, res, next) => {
  // Implement this based on your Activity model
  res.status(200).json({
    status: 'success',
    message: 'Not implemented yet'
  });
});