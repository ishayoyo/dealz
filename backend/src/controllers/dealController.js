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
  const { title, description, price, originalPrice, url, store, category, tags, imageUrl, link } = req.body;

  if (!imageUrl) {
    return next(new AppError('Image URL is required', 400));
  }

  const dealUrl = url || link;

  if (!dealUrl) {
    return next(new AppError('URL is required', 400));
  }

  const deal = await Deal.create({
    title,
    description,
    price,
    originalPrice,
    url: dealUrl,
    imageUrl,
    store,
    category,
    tags,
    user: req.user.id
  });

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

exports.voteDeal = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { value } = req.body;
  const userId = req.user.id;

  if (value !== 1 && value !== -1) {
    return next(new AppError('Invalid vote value. Must be 1 or -1', 400));
  }

  const deal = await Deal.findById(id);

  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const existingVote = deal.votes.find(vote => vote.user.toString() === userId);

  if (existingVote) {
    // User has already voted, update their vote
    deal.voteScore += value - existingVote.value;
    existingVote.value = value;
  } else {
    // New vote
    deal.voteScore += value;
    deal.votes.push({ user: userId, value });
  }

  await deal.save();

  res.status(200).json({
    status: 'success',
    data: { 
      voteScore: deal.voteScore,
      voteCount: deal.votes.length
    }
  });
});

exports.checkDealStatus = catchAsync(async (req, res, next) => {
  const dealId = req.params.id;
  const userId = req.user.id;

  const user = await User.findById(userId);
  const deal = await Deal.findById(dealId);

  if (!user || !deal) {
    return next(new AppError('User or Deal not found', 404));
  }

  const isFollowing = user.followedDeals.includes(dealId);
  const hasBought = user.boughtDeals.includes(dealId);

  res.status(200).json({
    status: 'success',
    data: {
      isFollowing,
      hasBought
    }
  });
});

exports.addComment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { content } = req.body;

  const deal = await Deal.findById(id);

  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const comment = await Comment.create({
    content,
    user: req.user.id,
    deal: id
  });

  res.status(201).json({
    status: 'success',
    data: { comment }
  });
});

exports.getDealComments = catchAsync(async (req, res, next) => {
  const dealId = req.params.id;
  
  console.log('Fetching comments for dealId:', dealId);

  const comments = await Comment.find({ deal: dealId, status: 'active' })
    .populate('user', 'username profilePicture')
    .sort('-createdAt');

  console.log('Number of comments found:', comments.length);

  res.status(200).json({
    status: 'success',
    data: { comments }
  });
});

exports.searchDeals = catchAsync(async (req, res, next) => {
  const { query, category, store, minPrice, maxPrice } = req.query;

  const searchCriteria = { status: 'active' };

  if (query) {
    searchCriteria.$text = { $search: query };
  }

  if (category) {
    searchCriteria.category = category;
  }

  if (store) {
    searchCriteria.store = store;
  }

  if (minPrice || maxPrice) {
    searchCriteria.price = {};
    if (minPrice) searchCriteria.price.$gte = parseFloat(minPrice);
    if (maxPrice) searchCriteria.price.$lte = parseFloat(maxPrice);
  }

  const deals = await Deal.find(searchCriteria)
    .sort('-createdAt')
    .populate('user', 'username profilePicture');

  res.status(200).json({
    status: 'success',
    results: deals.length,
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
    .sort('-voteCount -createdAt')
    .limit(10)
    .populate('user', 'username profilePicture');

  res.status(200).json({
    status: 'success',
    results: deals.length,
    data: { deals }
  });
});

exports.getExpiringSoonDeals = catchAsync(async (req, res, next) => {
  const now = new Date();
  const deals = await Deal.find({
    status: 'active',
    expiresAt: { $gt: now, $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000) }
  })
    .sort('expiresAt')
    .limit(10)
    .populate('user', 'username profilePicture');

  res.status(200).json({
    status: 'success',
    results: deals.length,
    data: { deals }
  });
});

exports.markAsBought = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (!user.boughtDeals.includes(deal._id)) {
    user.boughtDeals.push(deal._id);
    await user.save();

    deal.boughtCount += 1;
    await deal.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'Deal marked as bought',
    data: {
      boughtCount: deal.boughtCount,
      hasBought: true
    }
  });
});

exports.followDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const user = await User.findById(req.user.id);
  if (user.followedDeals.includes(deal._id)) {
    return next(new AppError('You are already following this deal', 400));
  }

  user.followedDeals.push(deal._id);
  await user.save();

  deal.followCount += 1;
  await deal.save();

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
  if (!user.followedDeals.includes(deal._id)) {
    return next(new AppError('You are not following this deal', 400));
  }

  user.followedDeals = user.followedDeals.filter(id => id.toString() !== deal._id.toString());
  await user.save();

  deal.followCount = Math.max(0, deal.followCount - 1);
  await deal.save();

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

exports.getSavedDeals = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('savedDeals');
  res.status(200).json({
    status: 'success',
    data: { savedDeals: user.savedDeals }
  });
});

exports.saveDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const user = await User.findById(req.user.id);
  if (!user.savedDeals.includes(deal._id)) {
    user.savedDeals.push(deal._id);
    await user.save();
    deal.saveCount += 1;
    await deal.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'Deal saved successfully'
  });
});


exports.unsaveDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const user = await User.findById(req.user.id);
  if (user.savedDeals.includes(deal._id)) {
    user.savedDeals = user.savedDeals.filter(id => id.toString() !== deal._id.toString());
    await user.save();
    deal.saveCount = Math.max(0, deal.saveCount - 1);
    await deal.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'Deal unsaved successfully'
  });
});