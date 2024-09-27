// File: src/controllers/dealController.js

const Deal = require('../models/Deal.Model');
const User = require('../models/User.Model');
const Comment = require('../models/Comment.Model');
const Vote = require('../models/Vote.Model');
const Follow = require('../models/Follow.Model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ImageFetcherService = require('../services/imageFetcherService');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const NotificationService = require('../services/NotificationService');

exports.getDeals = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const deals = await Deal.find({ status: 'active' })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .populate('user', 'username profilePicture');

  const total = await Deal.countDocuments({ status: 'active' });

  res.status(200).json({
    status: 'success',
    results: deals.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { deals }
  });
});

exports.createDeal = catchAsync(async (req, res, next) => {
  const { title, description, price, imageUrl, link } = req.body;

  if (!imageUrl) {
    return next(new AppError('Image URL is required', 400));
  }

  if (!link) {
    return next(new AppError('Deal link is required', 400));
  }

  const deal = await Deal.create({
    title,
    description,
    price,
    imageUrl,
    url: link,
    user: req.user.id
  });

  // Automatically follow the deal
  await User.findByIdAndUpdate(req.user.id, { $addToSet: { followedDeals: deal._id } });
  deal.followCount = 1;
  await deal.save();

  // Get the user's followers
  const user = await User.findById(req.user.id);
  const followers = await User.find({ _id: { $in: user.followers } });

  // Create notifications for followers
  const notificationService = new NotificationService(req.app.get('io'));
  for (let follower of followers) {
    await notificationService.createNotification({
      recipient: follower._id,
      type: 'NEW_DEAL',
      content: `${user.username} posted a new deal: ${deal.title}`,
      relatedUser: user._id,
      relatedDeal: deal._id
    });
  }

  // Populate the user field
  await deal.populate('user', 'username profilePicture');

  // Emit socket event for new deal
  const io = req.app.get('io');
  io.emit('newDeal', { deal });

  res.status(201).json({
    status: 'success',
    data: { deal }
  });
});

exports.getDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id)
    .populate('user', 'username profilePicture')
    .populate({
      path: 'comments',
      populate: { path: 'user', select: 'username profilePicture' }
    });

  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { deal }
  });
});

exports.updateDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);

  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  if (deal.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to perform this action', 403));
  }

  Object.assign(deal, req.body);
  await deal.save();

  res.status(200).json({
    status: 'success',
    data: { deal }
  });
});

exports.deleteDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);

  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  if (deal.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to perform this action', 403));
  }

  await deal.deleteOne();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

const parseMentions = (content) => {
  const mentionRegex = /@(\w+)/g;
  return (content.match(mentionRegex) || []).map(mention => mention.slice(1));
};

exports.addComment = catchAsync(async (req, res, next) => {
  console.log('Adding comment:', req.body);
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const comment = await Comment.create({
    content: req.body.content,
    user: req.user.id,
    deal: deal.id
  });

  console.log('Comment created:', comment);

  // Handle mentions
  console.log('Parsing mentions from:', req.body.content);
  const mentionedUsernames = parseMentions(req.body.content);
  console.log('Mentioned usernames:', mentionedUsernames);

  try {
    for (const username of mentionedUsernames) {
      console.log('Looking up user:', username);
      const mentionedUser = await User.findOne({ username });
      console.log('Found user:', mentionedUser);
      if (mentionedUser) {
        console.log('Creating mention notification for:', mentionedUser.username);
        await req.app.get('notificationService').createMentionNotification(
          req.user.id,
          mentionedUser.id,
          deal.id,
          comment.id
        );
      }
    }
  } catch (error) {
    console.error('Error handling mentions:', error);
  }

  // Create notification for deal owner
  if (deal.user.toString() !== req.user.id) {
    console.log('Creating comment notification for deal owner');
    await req.app.get('notificationService').createCommentNotification(
      req.user.id,
      deal.user,
      deal.id
    );
  }

  res.status(201).json({
    status: 'success',
    data: { comment }
  });
});

exports.getDealComments = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const comments = await Comment.find({ deal: deal._id })
    .populate('user', 'username profilePicture')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    data: { comments }
  });
});

exports.markAsBought = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  deal.boughtCount += 1;
  await deal.save();

  res.status(200).json({
    status: 'success',
    data: { boughtCount: deal.boughtCount }
  });
});

exports.searchDeals = catchAsync(async (req, res, next) => {
  const { query, category, store, minPrice, maxPrice, sortBy } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  let filter = { status: 'active' };
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { 'user.username': { $regex: query, $options: 'i' } }
    ];
  }
  if (category) filter.category = category;
  if (store) filter.store = store;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  let sort = {};
  if (sortBy === 'price_asc') sort.price = 1;
  else if (sortBy === 'price_desc') sort.price = -1;
  else sort.createdAt = -1;

  const deals = await Deal.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('user', 'username profilePicture');

  const total = await Deal.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: deals.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { deals }
  });
});

exports.getCategories = catchAsync(async (req, res, next) => {
  const categories = await Deal.distinct('category');
  res.status(200).json({
    status: 'success',
    data: { categories }
  });
});

exports.getStores = catchAsync(async (req, res, next) => {
  const stores = await Deal.distinct('store');
  res.status(200).json({
    status: 'success',
    data: { stores }
  });
});

exports.getTrendingDeals = catchAsync(async (req, res, next) => {
  const deals = await Deal.find({ status: 'active' })
    .sort('-upvotes -commentCount -createdAt')
    .limit(10)
    .populate('user', 'username profilePicture');

  res.status(200).json({
    status: 'success',
    data: { deals }
  });
});

exports.getExpiringSoonDeals = catchAsync(async (req, res, next) => {
  const now = new Date();
  const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const deals = await Deal.find({
    status: 'active',
    expirationDate: { $gte: now, $lte: twentyFourHoursLater }
  })
    .sort('expirationDate')
    .limit(10)
    .populate('user', 'username profilePicture');

  res.status(200).json({
    status: 'success',
    data: { deals }
  });
});

exports.checkDealStatus = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { status: deal.status }
  });
});

exports.followDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const user = await User.findById(req.user.id);
  if (!user.followedDeals.includes(deal._id)) {
    user.followedDeals.push(deal._id);
    await user.save();
    deal.followCount += 1;
    await deal.save();

    // Add this code to create a notification
    if (deal.user.toString() !== req.user.id) {
      const notificationService = new NotificationService(req.app.get('io'));
      await notificationService.createDealFollowNotification(req.user.id, deal.user, deal._id);
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Deal followed successfully',
    data: {
      isFollowing: true,
      followCount: deal.followCount
    }
  });
});

exports.unfollowDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const user = await User.findById(req.user.id);
  if (user.followedDeals.includes(deal._id)) {
    user.followedDeals = user.followedDeals.filter(id => id.toString() !== deal._id.toString());
    await user.save();
    deal.followCount = Math.max(0, deal.followCount - 1);
    await deal.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'Deal unfollowed successfully',
    data: {
      isFollowing: false,
      followCount: deal.followCount
    }
  });
});

exports.fetchImage = catchAsync(async (req, res, next) => {
  const { url } = req.body;
    
  if (!url) {
    return next(new AppError('URL is required', 400));
  }

  const imageFetcher = new ImageFetcherService();
  const imageUrl = await imageFetcher.fetchAndSaveImage(url);

  if (!imageUrl) {
    return next(new AppError('Unable to fetch image for the provided URL', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { imageUrl }
  });
});

exports.uploadImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }

  const filename = `deal-${req.user.id}-${Date.now()}.jpeg`;
  const filepath = path.join(__dirname, '..', '..', 'public', 'images', 'deals', filename);

  await sharp(req.file.buffer)
    .resize(800, 600)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(filepath);

  const imageUrl = `/images/deals/${filename}`;

  res.status(200).json({
    status: 'success',
    data: { imageUrl }
  });
});

exports.getFollowedDeals = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('followedDeals');
  res.status(200).json({
    status: 'success',
    data: { followedDeals: user.followedDeals }
  });
});

exports.getMentionableUsers = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);
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

module.exports = exports;