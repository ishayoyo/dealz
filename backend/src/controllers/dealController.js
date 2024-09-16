const Deal = require('../models/Deal.Model');
const User = require('../models/User.Model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Comment = require('../models/Comment.Model');
const ImageFetcherService = require('../services/imageFetcherService');

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
  const { title, description, price, originalPrice, url, store, category, tags, imageUrl } = req.body;

  if (!imageUrl) {
    return next(new AppError('Image URL is required', 400));
  }

  const deal = await Deal.create({
    title,
    description,
    price,
    originalPrice,
    url,
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

  const deal = await Deal.findById(id);

  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const existingVote = deal.votes.find(vote => vote.user.toString() === req.user.id);

  if (existingVote) {
    existingVote.vote = value;
  } else {
    deal.votes.push({ user: req.user.id, vote: value });
  }

  await deal.save();

  res.status(200).json({
    status: 'success',
    data: { voteCount: deal.voteCount }
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

  deal.comments.push(comment._id);
  await deal.save();

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
  // TODO: Implement search logic
  res.status(501).json({ message: 'searchDeals not implemented yet' });
});

exports.getCategories = catchAsync(async (req, res, next) => {
  // TODO: Implement get categories logic
  res.status(501).json({ message: 'getCategories not implemented yet' });
});

exports.getStores = catchAsync(async (req, res, next) => {
  // TODO: Implement get stores logic
  res.status(501).json({ message: 'getStores not implemented yet' });
});

exports.getTrendingDeals = catchAsync(async (req, res, next) => {
  // TODO: Implement get trending deals logic
  res.status(501).json({ message: 'getTrendingDeals not implemented yet' });
});

exports.getExpiringSoonDeals = catchAsync(async (req, res, next) => {
  // TODO: Implement get expiring soon deals logic
  res.status(501).json({ message: 'getExpiringSoonDeals not implemented yet' });
});

exports.fetchImage = catchAsync(async (req, res, next) => {
  try {
    console.log('Received request to fetch image:', req.body);
    const { url } = req.body;
    
    if (!url) {
      console.log('URL is missing from request body');
      return next(new AppError('URL is required', 400));
    }

    console.log(`Fetching image for URL: ${url}`);

    const imageFetcher = new ImageFetcherService();
    console.log('ImageFetcherService instance created');
    
    const imageUrl = await imageFetcher.fetchAndSaveImage(url);
    console.log('fetchAndSaveImage completed, result:', imageUrl);

    if (!imageUrl) {
      console.log('No image URL returned from ImageFetcherService');
      return next(new AppError('Unable to fetch image for the provided URL', 404));
    }

    console.log(`Image URL fetched and saved: ${imageUrl}`);

    res.status(200).json({
      status: 'success',
      data: { imageUrl }
    });
  } catch (error) {
    console.error('Detailed error in fetchImage:', error);
    return next(new AppError(`An error occurred while fetching the image: ${error.message}`, 500));
  }
});