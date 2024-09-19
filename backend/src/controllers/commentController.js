const Comment = require('../models/Comment.Model');
const Deal = require('../models/Deal.Model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.createComment = catchAsync(async (req, res, next) => {
  const { content } = req.body;
  const { dealId } = req.params;
  const userId = req.user.id;

  const comment = await Comment.create({
    content,
    user: userId,
    deal: dealId
  });

  res.status(201).json({
    status: 'success',
    data: { comment }
  });
});

exports.getComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id)
    .populate('user', 'username profilePicture')
    .populate('replies');
  
  if (!comment) {
    return next(new AppError('No comment found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { comment }
  });
});

exports.updateComment = catchAsync(async (req, res, next) => {
  const { content } = req.body;
  const comment = await Comment.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { content },
    { new: true, runValidators: true }
  );

  if (!comment) {
    return next(new AppError('No comment found with that ID or you are not authorized', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { comment }
  });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { status: 'deleted' },
    { new: true }
  );

  if (!comment) {
    return next(new AppError('No comment found with that ID or you are not authorized', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.voteComment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { value } = req.body;

  if (value !== 1 && value !== -1) {
    return next(new AppError('Invalid vote value. Must be 1 or -1', 400));
  }

  const comment = await Comment.findById(id);

  if (!comment) {
    return next(new AppError('No comment found with that ID', 404));
  }

  comment.voteScore += value;
  comment.voteCount += 1;
  await comment.save();

  res.status(200).json({
    status: 'success',
    data: { 
      voteScore: comment.voteScore,
      voteCount: comment.voteCount
    }
  });
});

exports.getComments = catchAsync(async (req, res, next) => {
  const { dealId } = req.params;
  const comments = await Comment.find({ deal: dealId, status: 'active', parentComment: null })
    .populate('user', 'username profilePicture')
    .populate({
      path: 'replies',
      populate: { path: 'user', select: 'username profilePicture' }
    })
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: comments.length,
    data: { comments }
  });
});

exports.createReply = catchAsync(async (req, res, next) => {
  const { content } = req.body;
  const { commentId } = req.params;
  const userId = req.user.id;

  const parentComment = await Comment.findById(commentId);

  if (!parentComment) {
    return next(new AppError('No parent comment found with that ID', 404));
  }

  const reply = await Comment.create({
    content,
    user: userId,
    deal: parentComment.deal,
    parentComment: commentId
  });

  res.status(201).json({
    status: 'success',
    data: { reply }
  });
});