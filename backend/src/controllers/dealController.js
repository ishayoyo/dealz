// File: src/controllers/dealController.js

const Deal = require('../models/Deal.Model');
const User = require('../models/User.Model');
const Comment = require('../models/Comment.Model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ImageFetcherService = require('../services/imageFetcherService');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const NotificationService = require('../services/NotificationService');
const validator = require('validator');
const ImageUpload = require('../models/ImageUpload.Model'); // You'll need to create this model
const NodeCache = require('node-cache');
const dealCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

exports.getDeals = catchAsync(async (req, res, next) => {
  console.time('getDeals');
  
  const cacheKey = JSON.stringify(req.query);
  const cachedDeals = dealCache.get(cacheKey);

  if (cachedDeals) {
    console.log('Cache hit');
    console.timeEnd('getDeals');
    return res.status(200).json({
      status: 'success',
      results: cachedDeals.length,
      data: { deals: cachedDeals }
    });
  }

  console.log('Cache miss');

  // Build query
  const queryObj = { ...req.query, status: 'approved' };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);

  // Validate query parameters
  const allowedFields = ['title', 'price', 'category', 'store'];
  Object.keys(queryObj).forEach(key => {
    if (!allowedFields.includes(key)) {
      delete queryObj[key];
    }
  });

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

  let query = Deal.find(JSON.parse(queryStr));

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    const allowedSortFields = ['createdAt', 'price', 'title'];
    const sanitizedSortBy = sortBy.split(' ').filter(field => allowedSortFields.includes(field.replace('-', ''))).join(' ');
    query = query.sort(sanitizedSortBy || '-createdAt');
  } else {
    query = query.sort('-createdAt');
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    const allowedFields = ['title', 'description', 'price', 'imageUrl', 'store', 'category', 'createdAt'];
    const sanitizedFields = fields.split(' ').filter(field => allowedFields.includes(field)).join(' ');
    query = query.select(sanitizedFields);
  } else {
    query = query.select('-__v');
  }

  // Pagination
  const page = Math.max(1, parseInt(req.query.page, 10)) || 1;
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10))) || 100;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  // Execute query
  const deals = await query.populate('user', 'username profilePicture');

  const dealsData = deals.map(deal => ({
    ...deal.toObject(),
    commentCount: deal.commentCount || 0
  }));

  dealCache.set(cacheKey, dealsData);

  console.timeEnd('getDeals');
  console.log(`Fetched ${deals.length} deals`);

  res.status(200).json({
    status: 'success',
    results: deals.length,
    data: { deals: dealsData }
  });
});

exports.createDeal = catchAsync(async (req, res, next) => {
  // Destructure and provide default values for all fields
  const {
    title = '',
    description = '',
    price,
    listPrice,
    category = '',
    shipping = 'FREE',
    imageUrl = '',
    url = ''
  } = req.body;

  // Validate required fields
  if (!title || !description || !price || !listPrice || !category || !url || !imageUrl) {
    return next(new AppError('Please provide all required fields', 400));
  }

  // Trim string fields
  const trimmedTitle = validator.trim(title);
  const trimmedDescription = validator.trim(description);
  const trimmedCategory = validator.trim(category);
  const trimmedUrl = validator.trim(url);

  // Create the deal object
  const dealData = {
    title: trimmedTitle,
    description: trimmedDescription,
    price: parseFloat(price),
    listPrice: parseFloat(listPrice),
    category: trimmedCategory,
    shipping: shipping === 'FREE' ? 'FREE' : parseFloat(shipping),
    imageUrl,
    url: trimmedUrl,
    user: req.user._id
  };

  const newDeal = await Deal.create(dealData);

  // Clear the entire deals cache
  dealCache.flushAll();
  console.log('Deals cache cleared after new deal creation');

  res.status(201).json({
    status: 'success',
    data: {
      deal: newDeal
    }
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

  // Check if the deal is approved or if the user is an admin or the deal creator
  const isAuthorized = deal.status === 'approved' || 
    (req.user && (req.user.role === 'admin' || req.user.id === deal.user.id.toString()));

  if (!isAuthorized) {
    return next(new AppError('This deal is not available', 403));
  }

  let isFollowing = false;
  if (req.user) {
    const user = await User.findById(req.user.id);
    isFollowing = user.followedDeals.includes(deal._id);
  }

  // Remove sensitive information for non-authenticated users
  const sanitizedDeal = {
    ...deal.toObject(),
    user: {
      _id: deal.user._id,
      username: deal.user.username,
      profilePicture: deal.user.profilePicture
    },
    comments: deal.status === 'approved' ? deal.comments : []
  };

  res.status(200).json({
    status: 'success',
    data: { 
      deal: sanitizedDeal,
      isFollowing
    }
  });
});

exports.checkDealStatus = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  let isFollowing = false;
  if (req.user) {
    const user = await User.findById(req.user.id);
    isFollowing = user.followedDeals.includes(deal._id);
  }

  res.status(200).json({
    status: 'success',
    data: { 
      status: deal.status,
      isFollowing,
      followCount: deal.followCount
    }
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
  console.log('Search query received:', req.query);
  
  const { q: query, category, store, minPrice, maxPrice, sortBy } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  let filter = { status: { $in: ['active', 'approved'] } };
  
  if (query && query.trim() !== '') {
    filter.$and = [
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { 'user.username': { $regex: query, $options: 'i' } }
        ]
      }
    ];
  }

  if (category) filter.category = category;
  if (store) filter.store = store;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  console.log('Final filter:', JSON.stringify(filter, null, 2));

  let sort = {};
  if (sortBy === 'price_asc') sort.price = 1;
  else if (sortBy === 'price_desc') sort.price = -1;
  else sort.createdAt = -1;

  const deals = await Deal.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('user', 'username profilePicture');

  console.log(`Deals found: ${deals.length}`);

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
  const allCategories = [
    "Electronics",
    "Home",
    "Fashion",
    "Beauty",
    "Sports",
    "Books",
    "Toys",
    "Travel",
    "Food",
    "Auto",
    "DIY",
    "Pets",
    "Other"
  ];

  // Get categories that have been used in deals
  let usedCategories = await Deal.distinct('category');
  
  // Filter out null or empty categories from used categories
  usedCategories = usedCategories.filter(category => category != null && category !== '');

  // Combine all categories with used categories, removing duplicates
  const categories = [...new Set([...allCategories, ...usedCategories])];

  console.log('Categories being sent:', categories);

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

exports.followDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const user = await User.findById(req.user.id);
  if (!user.followedDeals.includes(deal._id)) {
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { followedDeals: deal._id } });
    await Deal.findByIdAndUpdate(req.params.id, { $inc: { followCount: 1 } });

    // Create notification
    if (deal.user.toString() !== req.user.id) {
      const notificationService = new NotificationService(req.app.get('io'));
      await notificationService.createDealFollowNotification(
        req.user.id, 
        deal.user, 
        deal._id,
        `${user.username} followed your deal: ${deal.title}`
      );
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Deal followed successfully',
    data: {
      isFollowing: true,
      followCount: deal.followCount + 1
    }
  });
});

exports.unfollowDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  await User.findByIdAndUpdate(req.user.id, { $pull: { followedDeals: deal._id } });
  await Deal.findByIdAndUpdate(req.params.id, { $inc: { followCount: -1 } });

  res.status(200).json({
    status: 'success',
    message: 'Deal unfollowed successfully',
    data: {
      isFollowing: false,
      followCount: Math.max(0, deal.followCount - 1)
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

  // Create an ImageUpload document
  const imageUpload = await ImageUpload.create({
    user: req.user.id,
    filename: path.basename(imageUrl),
    imageUrl: imageUrl,
    uploadedAt: new Date()
  });

  console.log('Created ImageUpload document:', imageUpload);

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

  // Create an ImageUpload document
  const imageUpload = await ImageUpload.create({
    user: req.user.id,
    filename: filename,
    imageUrl: imageUrl,
    uploadedAt: new Date()
  });

  console.log('Created ImageUpload document:', imageUpload);

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

// Add a new method for admins to approve or reject deals
exports.moderateDeal = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const deal = await Deal.findByIdAndUpdate(id, { status }, { new: true });

  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { deal }
  });
});

const cleanupUnusedImages = async () => {
  console.log('Starting cleanup process at:', new Date().toISOString());
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 60 minutes * 60 seconds * 1000 milliseconds
  console.log('Searching for images older than:', oneHourAgo.toISOString());
  
  const unusedImages = await ImageUpload.find({
    uploadedAt: { $lt: oneHourAgo },
    used: false
  });
  console.log(`Found ${unusedImages.length} unused images`);

  for (const image of unusedImages) {
    const filepath = path.join(__dirname, '..', '..', 'public', image.imageUrl);
    console.log('Attempting to delete file:', filepath);
    try {
      await fs.unlink(filepath);
      await ImageUpload.findByIdAndDelete(image._id);
      console.log(`Deleted unused image: ${image.filename}`);
    } catch (error) {
      console.error(`Error deleting image ${image.filename}:`, error);
    }
  }
};

exports.cleanupUnusedImages = cleanupUnusedImages;

exports.checkUnusedImages = catchAsync(async (req, res) => {
  const allImages = await ImageUpload.find();
  const unusedImages = allImages.filter(img => !img.used);
  res.json({
    totalImages: allImages.length,
    unusedImages: unusedImages.length,
    unusedImageDetails: unusedImages
  });
});

exports.checkImageUploads = catchAsync(async (req, res) => {
  const imageUploads = await ImageUpload.find();
  res.json({
    totalUploads: imageUploads.length,
    uploads: imageUploads
  });
});

// Add a method to clear the cache
exports.clearDealsCache = catchAsync(async (req, res, next) => {
  dealCache.flushAll();
  console.log('Deals cache cleared');
  res.status(200).json({ message: 'Deals cache cleared' });
});

exports.deleteUnusedImages = catchAsync(async (req, res, next) => {
  console.log('Starting deleteUnusedImages operation');

  // Get all deals
  const deals = await Deal.find({}, 'imageUrl');
  console.log(`Found ${deals.length} deals`);

  // Create a Set of used image filenames
  const usedImageFilenames = new Set(deals.map(deal => {
    // Extract filename from imageUrl
    return deal.imageUrl.split('/').pop();
  }));
  console.log(`${usedImageFilenames.size} unique image filenames in use`);

  // Get all files in the deals image directory
  const imageDirectory = path.join(__dirname, '..', '..', 'public', 'images', 'deals');
  const files = await fs.readdir(imageDirectory);
  console.log(`Found ${files.length} files in the image directory`);

  let deletedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const file of files) {
    if (!usedImageFilenames.has(file)) {
      try {
        // Delete the file
        const filepath = path.join(imageDirectory, file);
        console.log(`Attempting to delete file: ${filepath}`);
        await fs.unlink(filepath);

        deletedCount++;
        console.log(`Deleted unused image: ${file}`);
      } catch (error) {
        errorCount++;
        console.error(`Error deleting image ${file}:`, error);
      }
    } else {
      skippedCount++;
      console.log(`Image in use, not deleting: ${file}`);
    }
  }

  console.log(`Operation complete. Deleted: ${deletedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);

  res.status(200).json({
    status: 'success',
    message: `Deleted ${deletedCount} unused images. Skipped ${skippedCount} files in use. Encountered ${errorCount} errors.`,
    details: { deletedCount, skippedCount, errorCount }
  });
});

exports.getUnusedImagesCount = catchAsync(async (req, res, next) => {
  // Fetch all deals, but only select the imageUrl field
  const deals = await Deal.find({}, 'imageUrl').lean();

  // Create a Set of used image filenames, handling potential undefined or invalid imageUrls
  const usedImageFilenames = new Set(
    deals
      .map(deal => deal.imageUrl)
      .filter(url => url && typeof url === 'string')
      .map(url => url.split('/').pop())
  );

  console.log('Used image filenames:', usedImageFilenames);

  // Get all files in the deals image directory
  const imageDirectory = path.join(__dirname, '..', '..', 'public', 'images', 'deals');
  const files = await fs.readdir(imageDirectory);

  console.log('All files in directory:', files);

  // Count unused files
  const unusedCount = files.filter(file => !usedImageFilenames.has(file)).length;

  console.log('Unused count:', unusedCount);

  res.status(200).json({
    status: 'success',
    data: { unusedCount }
  });
});

module.exports = exports;
