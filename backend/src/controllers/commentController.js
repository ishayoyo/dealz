const Comment = require('../models/Comment.Model');
const Deal = require('../models/Deal.Model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const NotificationService = require('../services/NotificationService');
const User = require('../models/User.Model');

exports.createComment = catchAsync(async (req, res, next) => {
  const { content } = req.body;
  const { dealId } = req.params;
  const userId = req.user.id;

  const deal = await Deal.findById(dealId);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const comment = await Comment.create({
    content,
    user: userId,
    deal: dealId
  });

  const populatedComment = await Comment.findById(comment._id).populate('user', 'username profilePicture');

  // Create notification for deal owner
  const notificationService = new NotificationService(req.app.get('io'));
  if (deal.user.toString() !== userId) {
    await notificationService.createNotification({
      recipient: deal.user,
      type: 'comment',
      content: `${req.user.username} commented on your deal: ${deal.title}`,
      relatedUser: userId,
      relatedDeal: dealId,
      relatedComment: comment._id
    });
  }

  // Handle @mentions
  const mentionRegex = /@(\w+)/g;
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    const username = match[1];
    const mentionedUser = await User.findOne({ username });
    if (mentionedUser && mentionedUser._id.toString() !== userId) {
      await notificationService.createNotification({
        recipient: mentionedUser._id,
        type: 'mention',
        content: `${req.user.username} mentioned you in a comment on a deal`,
        relatedUser: userId,
        relatedDeal: dealId,
        relatedComment: comment._id
      });
    }
  }

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

  const populatedReply = await Comment.findById(reply._id).populate('user', 'username profilePicture');

  // Create notification for parent comment owner
  const notificationService = new NotificationService(req.app.get('io'));
  if (parentComment.user.toString() !== userId) {
    await notificationService.createNotification({
      recipient: parentComment.user,
      type: 'reply',
      content: `${req.user.username} replied to your comment`,
      relatedUser: userId,
      relatedDeal: parentComment.deal,
      relatedComment: reply._id
    });
  }

  // Handle @mentions
  const mentionRegex = /@(\w+)/g;
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    const username = match[1];
    const mentionedUser = await User.findOne({ username });
    if (mentionedUser && mentionedUser._id.toString() !== userId) {
      await notificationService.createNotification({
        recipient: mentionedUser._id,
        type: 'mention',
        content: `${req.user.username} mentioned you in a reply to a comment`,
        relatedUser: userId,
        relatedDeal: parentComment.deal,
        relatedComment: reply._id
      });
    }
  }

  res.status(201).json({
    status: 'success',
    data: { reply: populatedReply }
  });
});