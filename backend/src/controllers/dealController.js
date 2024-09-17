// File: src/controllers/dealController.js

const Deal = require('../models/Deal.Model');
const User = require('../models/User.Model');
const Comment = require('../models/Comment.Model');
const Vote = require('../models/Vote.Model');
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

  // Validate vote value
  if (value !== 1 && value !== -1) {
    return next(new AppError('Invalid vote value. Must be 1 or -1', 400));
  }

  const deal = await Deal.findById(id);

  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  let vote = await Vote.findOne({ user: req.user.id, deal: id });

  if (vote) {
    vote.value = value;
    await vote.save();
  } else {
    vote = await Vote.create({ user: req.user.id, deal: id, value });
  }

  const voteCount = await Vote.aggregate([
    { $match: { deal: deal._id } },
    { $group: { _id: null, total: { $sum: '$value' } } }
  ]);

  deal.voteCount = voteCount.length > 0 ? voteCount[0].total : 0;
  await deal.save();

  res.status(200).json({
    status: 'success',
    data: { 
      voteCount: deal.voteCount,
      userVote: value
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
  const deal = await Deal.findById(req.params.id).populate({
    path: 'comments',
    populate: { path: 'user', select: 'username profilePicture' }
  });

  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { comments: deal.comments }
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

  if (!user.boughtDeals) {
    user.boughtDeals = [];
  }

  if (!user.boughtDeals.includes(deal._id)) {
    user.boughtDeals.push(deal._id);
    await user.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'Deal marked as bought'
  });
});

exports.followDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (!user.followedDeals) {
    user.followedDeals = [];
  }

  if (!user.followedDeals.includes(deal._id)) {
    user.followedDeals.push(deal._id);
    await user.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'Deal followed successfully'
  });
});

exports.unfollowDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (!user.followedDeals) {
    user.followedDeals = [];
  }

  user.followedDeals = user.followedDeals.filter(id => id.toString() !== deal._id.toString());
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Deal unfollowed successfully'
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