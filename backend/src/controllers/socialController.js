const User = require('../models/User.Model');
const Deal = require('../models/Deal.Model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const NotificationService = require('../services/NotificationService');

exports.followUser = catchAsync(async (req, res, next) => {
  try {
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

    currentUser.following.push(userToFollow._id);
    await currentUser.save();

    userToFollow.followers.push(currentUser._id);
    await userToFollow.save();

    // Wrap socket.io and notification operations in try-catch
    try {
      const io = req.app.get('io');
      if (io) {
        const notificationService = new NotificationService(io);
        await notificationService.createFollowNotification(
          req.user.id,
          userToFollow._id,
          `${currentUser.username} started following you`
        );

        io.to(userToFollow._id.toString()).emit('followerCountUpdate', {
          userId: userToFollow._id,
          count: userToFollow.followers.length
        });
      }
    } catch (error) {
      console.error('Notification error:', error);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      status: 'success',
      message: 'User followed successfully',
      data: { 
        followerCount: userToFollow.followers.length,
        isFollowing: true,
        followedUser: {
          _id: userToFollow._id,
          username: userToFollow.username,
          avatarSeed: userToFollow.avatarSeed
        }
      }
    });
  } catch (error) {
    console.error('Follow error:', error);
    return next(new AppError('Error following user', 500));
  }
});

exports.unfollowUser = catchAsync(async (req, res, next) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    if (!userToUnfollow) {
      return next(new AppError('User not found', 404));
    }

    const currentUser = await User.findById(req.user.id);
    
    // Check if actually following
    if (!currentUser.following.includes(userToUnfollow._id)) {
      return next(new AppError('You are not following this user', 400));
    }

    // Use $pull operator for atomic update
    await User.findByIdAndUpdate(currentUser._id, {
      $pull: { following: userToUnfollow._id }
    });

    await User.findByIdAndUpdate(userToUnfollow._id, {
      $pull: { followers: currentUser._id }
    });

    // Wrap socket.io operations in try-catch
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(userToUnfollow._id.toString()).emit('followerCountUpdate', {
          userId: userToUnfollow._id,
          count: userToUnfollow.followers.length - 1 // Subtract 1 since we just removed a follower
        });
      }
    } catch (error) {
      console.error('Socket error:', error);
      // Don't fail the request if socket fails
    }

    res.status(200).json({
      status: 'success',
      message: 'User unfollowed successfully',
      data: { 
        followerCount: userToUnfollow.followers.length - 1,
        isFollowing: false
      }
    });
  } catch (error) {
    console.error('Unfollow error:', error);
    return next(new AppError('Error unfollowing user', 500));
  }
});

exports.getUserFollowers = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate('followers', 'username profilePicture avatarSeed');
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { followers: user.followers }
  });
});

exports.getUserFollowing = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate('following', 'username profilePicture avatarSeed');
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { following: user.following }
  });
});

exports.getCurrentUserFollowing = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('following', 'username profilePicture avatarSeed');
  res.status(200).json({
    status: 'success',
    data: { following: user.following }
  });
});

exports.getCurrentUserFollowers = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('followers', 'username profilePicture avatarSeed');
  res.status(200).json({
    status: 'success',
    data: { 
      followers: user.followers,
      count: user.followers.length
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
  const deals = await Deal.find({ user: req.user._id })
    .populate('user', '_id username avatarSeed')
    .sort({ createdAt: -1 });

  res.json({
    status: 'success',
    data: {
      deals
    }
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
