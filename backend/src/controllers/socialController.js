const User = require('../models/User.Model');
const Deal = require('../models/Deal.Model');
const Follow = require('../models/Follow.Model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const NotificationService = require('../services/NotificationService');

exports.followUser = catchAsync(async (req, res, next) => {
  const userToFollow = await User.findById(req.params.id);
  if (!userToFollow) {
    return next(new AppError('No user found with that ID', 404));
  }

  if (userToFollow._id.toString() === req.user.id) {
    return next(new AppError('You cannot follow yourself', 400));
  }

  const currentUser = await User.findById(req.user.id);

  if (currentUser.following.includes(userToFollow._id)) {
    return next(new AppError('You are already following this user', 400));
  }

  await Follow.create({ follower: currentUser._id, followed: userToFollow._id });

  currentUser.following.push(userToFollow._id);
  await currentUser.save();

  userToFollow.followers.push(currentUser._id);
  await userToFollow.save();

  const notificationService = new NotificationService(req.app.get('io'));
  await notificationService.createFollowNotification(
    req.user.id,
    userToFollow._id,
    `${currentUser.username} started following you`
  );

  const followerCount = await Follow.countDocuments({ followed: userToFollow._id });
  
  // Emit the follower count update
  req.app.get('io').to(userToFollow._id.toString()).emit('followerCountUpdate', {
    userId: userToFollow._id,
    count: followerCount
  });

  res.status(200).json({
    status: 'success',
    message: 'User followed successfully',
    data: { followerCount }
  });
});

exports.unfollowUser = catchAsync(async (req, res, next) => {
  const userToUnfollow = await User.findById(req.params.id);
  if (!userToUnfollow) {
    return next(new AppError('User not found', 404));
  }

  const existingFollow = await Follow.findOneAndDelete({ 
    follower: req.user._id, 
    followed: userToUnfollow._id 
  });

  if (!existingFollow) {
    return next(new AppError('You are not following this user', 400));
  }

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { following: userToUnfollow._id }
  });

  await User.findByIdAndUpdate(userToUnfollow._id, {
    $pull: { followers: req.user._id }
  });

  const followerCount = await Follow.countDocuments({ followed: userToUnfollow._id });
  
  // Emit the follower count update
  req.app.get('io').to(userToUnfollow._id.toString()).emit('followerCountUpdate', {
    userId: userToUnfollow._id,
    count: followerCount
  });

  res.status(200).json({
    status: 'success',
    message: 'User unfollowed successfully',
    data: { followerCount }
  });
});

exports.getUserFollowers = catchAsync(async (req, res, next) => {
  const followers = await Follow.find({ followed: req.params.id }).populate('follower', 'username profilePicture');
  res.status(200).json({
    status: 'success',
    data: { followers: followers.map(f => f.follower) }
  });
});

exports.getUserFollowing = catchAsync(async (req, res, next) => {
  const following = await Follow.find({ follower: req.params.id }).populate('followed', 'username profilePicture');
  res.status(200).json({
    status: 'success',
    data: { following: following.map(f => f.followed) }
  });
});

exports.getCurrentUserFollowing = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('following', 'username profilePicture');
  res.status(200).json({
    status: 'success',
    data: { following: user.following }
  });
});

exports.getCurrentUserFollowers = catchAsync(async (req, res, next) => {
  const followers = await Follow.find({ followed: req.user._id })
    .populate('follower', 'username profilePicture');
  
  res.status(200).json({
    status: 'success',
    data: { 
      followers: followers.map(f => f.follower),
      count: followers.length
    }
  });
});

exports.getUserDeals = catchAsync(async (req, res, next) => {
  const deals = await Deal.find({ user: req.params.id, status: 'approved' })
    .sort('-createdAt')
    .populate('user', 'username profilePicture');
  res.status(200).json({
    status: 'success',
    data: { deals }
  });
});

exports.getCurrentUserDeals = catchAsync(async (req, res, next) => {
  const deals = await Deal.find({ user: req.user._id }).sort('-createdAt');
  res.status(200).json({
    status: 'success',
    data: { deals }
  });
});

exports.getCurrentUserFollowedDeals = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate({
    path: 'followedDeals',
    select: 'title description price imageUrl store category createdAt',
    populate: {
      path: 'user',
      select: 'username profilePicture'
    }
  });
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const safeFollowedDeals = user.followedDeals.map(deal => ({
    _id: deal._id,
    title: deal.title,
    description: deal.description,
    price: deal.price,
    imageUrl: deal.imageUrl,
    store: deal.store,
    category: deal.category,
    createdAt: deal.createdAt,
    user: deal.user ? {
      _id: deal.user._id,
      username: deal.user.username,
      profilePicture: deal.user.profilePicture
    } : null
  })).filter(deal => deal !== null);

  res.status(200).json({
    status: 'success',
    data: { followedDeals: safeFollowedDeals }
  });
});

exports.getUnreadNotifications = catchAsync(async (req, res, next) => {
  const notificationService = new NotificationService(req.app.get('io'));
  const notifications = await notificationService.getUnreadNotifications(req.user.id);

  res.status(200).json({
    status: 'success',
    data: { notifications }
  });
});

exports.markNotificationAsRead = catchAsync(async (req, res, next) => {
  const notificationService = new NotificationService(req.app.get('io'));
  const notification = await notificationService.markAsRead(req.params.id);

  if (!notification) {
    return next(new AppError('No notification found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { notification }
  });
});

module.exports = exports;
