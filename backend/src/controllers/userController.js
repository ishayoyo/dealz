const User = require('../models/User.Model');
const Deal = require('../models/Deal.Model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const Follow = require('../models/Follow.Model');

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
  const user = await User.findById(req.params.id).select('username profilePicture bio');
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  const followerCount = await Follow.countDocuments({ followed: req.params.id });
  const followingCount = await Follow.countDocuments({ follower: req.params.id });

  const deals = await Deal.find({ user: req.params.id, status: 'approved' })
    .sort('-createdAt')
    .limit(10);

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        ...user.toObject(),
        followerCount,
        followingCount
      },
      deals
    }
  });
});

exports.changeAvatar = async (req, res) => {
  try {
    const user = req.user;
    // Generate a new random seed
    user.avatarSeed = Math.random().toString(36).substring(2, 15);
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        avatarSeed: user.avatarSeed
      },
      message: 'Avatar changed successfully'
    });
  } catch (error) {
    console.error('Error changing avatar:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to change avatar'
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

module.exports = exports;
