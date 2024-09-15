const Comment = require('../models/Comment.Model');
const Deal = require('../models/Deal.Model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.createComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.create({
    content: req.body.content,
    user: req.user.id,
    deal: req.params.dealId
  });

  res.status(201).json({ status: 'success', data: { comment } });
});

exports.getComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id).populate('user', 'username profilePicture');
  
  if (!comment) {
    return next(new AppError('No comment found with that ID', 404));
  }

  res.status(200).json({ status: 'success', data: { comment } });
});

exports.updateComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { content: req.body.content },
    { new: true, runValidators: true }
  );

  if (!comment) {
    return next(new AppError('No comment found with that ID or you are not authorized', 404));
  }

  res.status(200).json({ status: 'success', data: { comment } });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findOneAndDelete({ _id: req.params.id, user: req.user.id });

  if (!comment) {
    return next(new AppError('No comment found with that ID or you are not authorized', 404));
  }

  res.status(204).json({ status: 'success', data: null });
});