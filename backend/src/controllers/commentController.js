const Comment = require('../models/Comment.Model');
const Deal = require('../models/Deal.Model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const NotificationService = require('../services/NotificationService');
const User = require('../models/User.Model');
const { body, validationResult } = require('express-validator');

const parseMentions = (content) => {
  const mentionRegex = /@([\w.@]+)/g;
  return (content.match(mentionRegex) || []).map(mention => mention.slice(1));
};

exports.validateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters'),
];

exports.createComment = [
  exports.validateComment,
  catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const { dealId } = req.params;
    const userId = req.user.id;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return next(new AppError('No deal found with that ID', 404));
    }

    const comment = new Comment({
      content,
      user: userId,
      deal: dealId
    });

    const newComment = await comment.save();

    await Deal.findByIdAndUpdate(dealId, { 
      $push: { comments: newComment._id },
      $inc: { commentCount: 1 }
    });

    const notificationService = new NotificationService(req.app.get('io'));

    if (deal.user.toString() !== userId) {
      await notificationService.createNotification({
        recipient: deal.user,
        type: 'NEW_COMMENT',
        content: `${req.user.username} commented on your deal: ${deal.title}`,
        relatedUser: userId,
        relatedDeal: dealId,
        relatedComment: newComment._id
      });
    }

    const mentionedUsernames = parseMentions(content);

    for (const username of mentionedUsernames) {
      const mentionedUser = await User.findOne({ username });
      if (mentionedUser && mentionedUser._id.toString() !== userId) {
        await notificationService.createNotification({
          recipient: mentionedUser._id,
          type: 'MENTION',
          content: `${req.user.username} mentioned you in a comment on a deal`,
          relatedUser: userId,
          relatedDeal: dealId,
          relatedComment: newComment._id
        });
      }
    }

    res.status(201).json({
      status: 'success',
      data: {
        comment: newComment
      }
    });
  })
];

exports.getComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id)
    .populate('user', 'username profilePicture');
  
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
  const { id } = req.params;

  if (!id) {
    return next(new AppError('Comment ID is required', 400));
  }

  const comment = await Comment.findById(id);

  if (!comment) {
    return next(new AppError('No comment found with that ID', 404));
  }

  // Check if the user is the comment owner or an admin
  if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this comment', 403));
  }

  await Comment.findByIdAndDelete(id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getComments = catchAsync(async (req, res, next) => {
  const { dealId } = req.params;
  const comments = await Comment.find({ deal: dealId })
    .populate('user', 'username profilePicture')
    .sort('-createdAt');

  console.log('Fetched comments:', JSON.stringify(comments, null, 2)); // More detailed logging

  res.status(200).json({
    status: 'success',
    results: comments.length,
    data: { comments }
  });
});

exports.getMentionableUsers = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.dealId);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  // Get users who commented on the deal
  const commenters = await Comment.find({ deal: deal._id }).distinct('user');

  // Get users who are following the deal
  const followers = await User.find({ followedDeals: deal._id });

  // Combine all user IDs, including the deal creator
  const userIds = new Set([
    ...commenters.map(id => id.toString()),
    ...followers.map(user => user._id.toString()),
    deal.user.toString()
  ]);

  // Fetch user details
  const users = await User.find({ _id: { $in: Array.from(userIds) } })
    .select('username profilePicture');

  res.status(200).json({
    status: 'success',
    data: { users }
  });
});
