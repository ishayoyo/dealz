const Comment = require('../models/Comment.Model');
const Deal = require('../models/Deal.Model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.addComment = catchAsync(async (req, res, next) => {
  const { dealId } = req.params;
  const { content } = req.body;

  const deal = await Deal.findById(dealId);

  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const comment = await Comment.create({
    content,
    user: req.user.id,
    deal: dealId
  });

  res.status(201).json({
    status: 'success',
    data: { comment }
  });
});

exports.updateComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(new AppError('No comment found with that ID', 404));
  }

  if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to perform this action', 403));
  }

  comment.content = req.body.content;
  await comment.save();

  res.status(200).json({
    status: 'success',
    data: { comment }
  });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(new AppError('No comment found with that ID', 404));
  }

  if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to perform this action', 403));
  }

  await comment.remove();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// More methods as needed