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

  const populatedComment = await Comment.findById(comment._id).populate('user', 'username profilePicture');

  res.status(201).json({
    status: 'success',
    data: { comment: populatedComment }
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
  const userId = req.user.id;

  if (value !== 1 && value !== -1) {
    return next(new AppError('Invalid vote value. Must be 1 or -1', 400));
  }

  const comment = await Comment.findById(id);

  if (!comment) {
    return next(new AppError('No comment found with that ID', 404));
  }

  const existingVote = comment.votes.find(vote => vote.user.toString() === userId);

  if (existingVote) {
    // User has already voted, update their vote
    comment.voteScore += value - existingVote.value;
    existingVote.value = value;
  } else {
    // New vote
    comment.voteScore += value;
    comment.votes.push({ user: userId, value });
  }

  await comment.save();

  res.status(200).json({
    status: 'success',
    data: { 
      voteScore: comment.voteScore,
      voteCount: comment.votes.length
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

  console.log('Fetched comments:', JSON.stringify(comments, null, 2)); // More detailed logging

  res.status(200).json({
    status: 'success',
    results: comments.length,
    data: { comments }
  });
});

exports.createReply = catchAsync(async (req, res, next) => {
  console.log('Received request to create reply:', { body: req.body, params: req.params, user: req.user });
  
  const { content } = req.body;
  const { commentId } = req.params;
  const userId = req.user.id;

  if (!commentId || commentId === 'undefined') {
    return next(new AppError('Valid Comment ID is required', 400));
  }

  console.log('Attempting to find parent comment with ID:', commentId);

  const parentComment = await Comment.findById(commentId);

  if (!parentComment) {
    return next(new AppError('No parent comment found with that ID', 404));
  }

  console.log('Parent comment found:', parentComment);

  const reply = await Comment.create({
    content,
    user: userId,
    deal: parentComment.deal,
    parentComment: commentId
  });

  console.log('Reply created:', reply);

  const populatedReply = await Comment.findById(reply._id).populate('user', 'username profilePicture');

  res.status(201).json({
    status: 'success',
    data: { reply: populatedReply }
  });
});