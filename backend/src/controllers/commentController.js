const Comment = require('../models/Comment.Model');
const Deal = require('../models/Deal.Model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const NotificationService = require('../services/NotificationService');
const User = require('../models/User.Model');

const parseMentions = (content) => {
  const mentionRegex = /@([\w.@]+)/g;
  return (content.match(mentionRegex) || []).map(mention => mention.slice(1));
};

exports.createComment = catchAsync(async (req, res, next) => {
  const { content } = req.body;
  const { dealId } = req.params;
  const userId = req.user.id;

  console.log('Creating comment:', { content, dealId, userId });

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
  console.log('New comment created:', newComment);

  // Update the deal with the new comment
  await Deal.findByIdAndUpdate(dealId, { $push: { comments: newComment._id } });

  const notificationService = new NotificationService(req.app.get('io'));

  // Create notification for deal owner
  if (deal.user.toString() !== userId) {
    console.log('Creating notification for deal owner');
    await notificationService.createNotification({
      recipient: deal.user,
      type: 'NEW_COMMENT',
      content: `${req.user.username} commented on your deal: ${deal.title}`,
      relatedUser: userId,
      relatedDeal: dealId,
      relatedComment: newComment._id
    });
  }

  // Handle @mentions
  console.log('Parsing mentions from:', content);
  const mentionedUsernames = parseMentions(content);
  console.log('Mentioned usernames:', mentionedUsernames);

  for (const username of mentionedUsernames) {
    console.log('Looking up user:', username);
    const mentionedUser = await User.findOne({ username });
    if (mentionedUser && mentionedUser._id.toString() !== userId) {
      console.log('Creating mention notification for:', mentionedUser.username);
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