const User = require('../models/User.Model');
const Deal = require('../models/Deal.Model');
const Follow = require('../models/Follow.Model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const NotificationService = require('../services/NotificationService');


const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h' // This line is the fix
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    return next(new AppError('User with this email or username already exists', 400));
  }

  const newUser = await User.create({ username, email, password });

  // Remove password from output
  newUser.password = undefined;

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: { user: newUser }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  const token = signToken(user._id);
  res.status(200).json({ status: 'success', token });
});

exports.logout = catchAsync(async (req, res) => {
  // If you're keeping track of valid tokens, invalidate this token
  // For example, if you're using a blacklist of invalid tokens:
  // await BlacklistedToken.create({ token: req.token });

  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
});

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

exports.getUserDeals = catchAsync(async (req, res, next) => {
  const deals = await Deal.find({ user: req.params.id });
  res.status(200).json({ status: 'success', data: { deals } });
});

exports.getUserFollowers = catchAsync(async (req, res, next) => {
  const followers = await Follow.find({ followed: req.params.id }).populate('follower');
  res.status(200).json({ status: 'success', data: { followers } });
});

exports.getUserFollowing = catchAsync(async (req, res, next) => {
  const following = await Follow.find({ follower: req.params.id }).populate('followed');
  res.status(200).json({ status: 'success', data: { following } });
});

exports.followUser = catchAsync(async (req, res, next) => {
  const userToFollow = await User.findById(req.params.id);
  if (!userToFollow) {
    return next(new AppError('No user found with that ID', 404));
  }

  const currentUser = await User.findById(req.user.id);

  // Check if already following
  if (currentUser.following.includes(userToFollow._id)) {
    return next(new AppError('You are already following this user', 400));
  }

  // Create new follow relationship
  await Follow.create({ follower: currentUser._id, followed: userToFollow._id });

  // Update the current user's following array
  currentUser.following.push(userToFollow._id);
  await currentUser.save();

  // Update the followed user's followers array
  userToFollow.followers.push(currentUser._id);
  await userToFollow.save();

  // Create notification for new follower
  const notificationService = new NotificationService(req.app.get('io'));
  await notificationService.createNotification({
    recipient: userToFollow._id,
    type: 'new_follower',
    content: `${currentUser.username} started following you`,
    relatedUser: currentUser._id
  });

  res.status(200).json({
    status: 'success',
    message: 'User followed successfully'
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

  // Update the current user's following array
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { following: userToUnfollow._id }
  });

  // Update the unfollowed user's followers array
  await User.findByIdAndUpdate(userToUnfollow._id, {
    $pull: { followers: req.user._id }
  });

  res.status(200).json({
    status: 'success',
    message: 'User unfollowed successfully'
  });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Implement password reset logic here
  res.status(200).json({ status: 'success', message: 'Password reset email sent' });
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  // Implement email verification logic here
  res.status(200).json({ status: 'success', message: 'Email verified successfully' });
});

exports.validateToken = catchAsync(async (req, res, next) => {
  // The user ID should be available in req.user.id, set by the auth middleware
  const user = await User.findById(req.user.id).select('-password');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        // You can add more fields here as needed
      }
    }
  });
});

exports.getCurrentUserFollowing = catchAsync(async (req, res, next) => {
  console.log('getCurrentUserFollowing called');
  console.log('User ID:', req.user._id);
  try {
    const user = await User.findById(req.user._id).populate('following', 'username profilePicture');
    
    console.log('Following users found:', user.following.length);
    console.log('Following data:', user.following);
    
    res.status(200).json({
      status: 'success',
      data: { following: user.following }
    });
  } catch (error) {
    console.error('Error in getCurrentUserFollowing:', error);
    next(error);
  }
});

exports.createCollection = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  const user = await User.findById(req.user.id);
  const newCollection = { name, description, deals: [] };
  user.collections.push(newCollection);
  await user.save();
  res.status(201).json({
    status: 'success',
    data: { collection: newCollection }
  });
});

exports.updateCollection = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  const user = await User.findById(req.user.id);
  const collection = user.collections.id(req.params.id);
  if (!collection) {
    return next(new AppError('No collection found with that ID', 404));
  }
  collection.name = name;
  collection.description = description;
  await user.save();
  res.status(200).json({
    status: 'success',
    data: { collection }
  });
});

exports.deleteCollection = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  user.collections.id(req.params.id).remove();
  await user.save();
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getCurrentUserActivity = catchAsync(async (req, res, next) => {
  // Implement this based on your Activity model
  res.status(200).json({
    status: 'success',
    message: 'Not implemented yet'
  });
});

exports.getUserActivity = catchAsync(async (req, res, next) => {
  // Implement this based on your Activity model
  res.status(200).json({
    status: 'success',
    message: 'Not implemented yet'
  });
});

exports.uploadProfilePicture = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }

  const filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  const filepath = path.join(__dirname, '..', '..', 'public', 'images', 'users', filename);

  await sharp(req.file.buffer)
    .resize(200, 200)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(filepath);

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profilePicture: `/images/users/${filename}` },
    { new: true, runValidators: true }
  );

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      }
    }
  });
});

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

// Add these new functions to userController.js

exports.getCurrentUserFollowing = catchAsync(async (req, res, next) => {
  console.log('getCurrentUserFollowing called');
  console.log('User ID:', req.user._id);
  try {
    const user = await User.findById(req.user._id);
    console.log('User found:', user);
    console.log('User following array:', user.following);

    const populatedUser = await User.findById(req.user._id).populate('following', 'username profilePicture');
    console.log('Populated user:', populatedUser);
    console.log('Populated following:', populatedUser.following);
    
    res.status(200).json({
      status: 'success',
      data: { following: populatedUser.following }
    });
  } catch (error) {
    console.error('Error in getCurrentUserFollowing:', error);
    next(error);
  }
});

exports.getCurrentUserFollowers = catchAsync(async (req, res, next) => {
  console.log('User ID:', req.user._id);
  try {
    const followers = await Follow.find({ followed: req.user._id })
      .populate('follower', 'username profilePicture');
    
    res.status(200).json({
      status: 'success',
      data: { followers: followers.map(f => f.follower) }
    });
  } catch (error) {
    console.error('Error in getCurrentUserFollowers:', error);
    next(error);
  }
});

exports.getCurrentUserDeals = catchAsync(async (req, res, next) => {
  console.log('User ID:', req.user._id);
  try {
    const deals = await Deal.find({ user: req.user._id }).sort('-createdAt');
    res.status(200).json({
      status: 'success',
      data: { deals }
    });
  } catch (error) {
    console.error('Error in getCurrentUserDeals:', error);
    next(error);
  }
});

exports.changePassword = catchAsync(async (req, res, next) => {
  // Implementation here
  console.log('Change password function called'); // Add this log
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Check if new password and confirm password match
  if (newPassword !== confirmPassword) {
    return next(new AppError('New password and confirm password do not match', 400));
  }

  // Get user from database
  const user = await User.findById(req.user.id).select('+password');

  // Check if current password is correct
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Your current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Send response
  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully'
  });
});

// Add this new function at the end of the file

exports.getCurrentUserCollections = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('collections');
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { collections: user.collections }
  });
});

// Add this new function to userController.js

exports.getCurrentUserFollowedDeals = catchAsync(async (req, res, next) => {
  console.log('getCurrentUserFollowedDeals called');
  console.log('User ID:', req.user._id);
  try {
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

    console.log('User found:', user);

    const safeFollowedDeals = user.followedDeals.map(deal => {
      try {
        // Only include specific fields to avoid problematic virtuals
        return {
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
        };
      } catch (error) {
        console.error('Error processing deal:', error);
        return null;
      }
    }).filter(deal => deal !== null);

    console.log('Safe followed deals:', safeFollowedDeals);

    res.status(200).json({
      status: 'success',
      data: { followedDeals: safeFollowedDeals }
    });
  } catch (error) {
    console.error('Error in getCurrentUserFollowedDeals:', error);
    next(error);
  }
});