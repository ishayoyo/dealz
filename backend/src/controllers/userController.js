const User = require('../models/User.Model');
const Deal = require('../models/Deal.Model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const NodeCache = require('node-cache');

// Initialize cache with 1 hour TTL (time to live)
const avatarCache = new NodeCache({ stdTTL: 3600 });

exports.getCurrentUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ status: 'success', data: { user } });
});

exports.updateCurrentUser = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true
  });
  res.status(200).json({ status: 'success', data: { user: updatedUser } });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }
  res.status(200).json({ status: 'success', data: { user } });
});

exports.getUserProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('username profilePicture bio followers following avatarSeed')
    .populate('followers', 'username avatarSeed')
    .populate('following', 'username avatarSeed');

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  const deals = await Deal.find({ user: req.params.id, status: 'approved' })
    .sort('-createdAt')
    .limit(10)
    .populate('category', 'name');

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        ...user.toObject(),
        followersCount: user.followers.length,
        followingCount: user.following.length
      },
      deals
    }
  });
});

exports.changeAvatar = async (req, res) => {
  try {
    const newSeed = Math.random().toString(36).substring(2, 15);
    const user = await User.findByIdAndUpdate(req.user.id, { avatarSeed: newSeed }, { new: true });
    
    // Invalidate cache for this user
    avatarCache.del(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        avatarSeed: user.avatarSeed
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while changing the avatar'
    });
  }
};

exports.checkUserStatus = catchAsync(async (req, res, next) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user.id;

  const currentUser = await User.findById(currentUserId);
  
  if (!currentUser) {
    return next(new AppError('Current user not found', 404));
  }

  const isFollowing = currentUser.following.includes(targetUserId);

  res.status(200).json({
    status: 'success',
    data: {
      isFollowing
    }
  });
});

exports.getUserRecentDeals = async (req, res) => {
  try {
    const userId = req.params.id;
    const limit = req.query.limit || 5; // Default to 5 recent deals, but allow it to be configurable

    const recentDeals = await Deal.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('category', 'name')
      .lean();

    res.json(recentDeals);
  } catch (error) {
    console.error('Error fetching user recent deals:', error);
    res.status(500).json({ message: 'Error fetching recent deals' });
  }
};

exports.getUserAvatar = catchAsync(async (req, res, next) => {
  const userId = req.params.id;
  
  // Check cache first
  const cachedAvatar = avatarCache.get(userId);
  if (cachedAvatar) {
    return res.status(200).json({
      status: 'success',
      data: {
        avatarUrl: cachedAvatar
      }
    });
  }

  // If not in cache, generate new URL
  const user = await User.findById(userId).select('avatarSeed');
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }
  
  const avatarUrl = `https://api.dicebear.com/6.x/avataaars/svg?seed=${user.avatarSeed}`;
  
  // Store in cache
  avatarCache.set(userId, avatarUrl);
  
  res.status(200).json({
    status: 'success',
    data: {
      avatarUrl
    }
  });
});

module.exports = exports;
