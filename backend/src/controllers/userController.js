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
const validator = require('validator');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m'  // Access token expires in 15 minutes
  });
};

const signRefreshToken = id => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'  // Refresh token expires in 7 days
  });
};

exports.register = catchAsync(async (req, res, next) => {
  let { username, email, password } = req.body;

  // Sanitize inputs
  username = validator.trim(username);
  email = validator.normalizeEmail(email);
  // Note: We don't typically sanitize passwords, as it might interfere with the user's chosen password

  console.log('Registration attempt:', { username, email, password: password ? '[REDACTED]' : undefined });

  if (!username || !email || !password) {
    console.log('Missing required fields');
    return next(new AppError('Please provide username, email and password', 400));
  }

  // Validate inputs
  if (!validator.isAlphanumeric(username)) {
    return next(new AppError('Username must contain only letters and numbers', 400));
  }

  if (!validator.isEmail(email)) {
    return next(new AppError('Invalid email address', 400));
  }

  if (!validator.isLength(password, { min: 8 })) {
    return next(new AppError('Password must be at least 8 characters long', 400));
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('User already exists:', { email, username });
      return next(new AppError('User with this email or username already exists', 400));
    }

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password
    });

    console.log('New user created:', newUser._id);

    const accessToken = signToken(newUser._id);
    const refreshToken = signRefreshToken(newUser._id);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Remove password from output
    newUser.password = undefined;

    res.status(201).json({
      status: 'success',
      data: { user: newUser }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return next(new AppError('Error during registration', 500));
  }
});

exports.login = catchAsync(async (req, res, next) => {
  let { email, password } = req.body;

  // Sanitize inputs
  email = validator.normalizeEmail(email);

  console.log('Login attempt:', { email, password: password ? '[REDACTED]' : undefined });

  if (!email || !password) {
    console.log('Missing email or password');
    return next(new AppError('Please provide email and password', 400));
  }

  // Validate inputs
  if (!validator.isEmail(email)) {
    return next(new AppError('Invalid email address', 400));
  }

  try {
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      console.log('Incorrect email or password');
      // Clear any existing tokens
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return next(new AppError('Incorrect email or password', 401));
    }

    console.log('Login successful:', user._id);

    const accessToken = signToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Set cookies only on successful login
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Remove password from output
    user.password = undefined;

    res.status(200).json({ 
      status: 'success', 
      data: { user }
    });
  } catch (error) {
    console.error('Login error:', error);
    return next(new AppError('Error during login', 500));
  }
});

exports.logout = catchAsync(async (req, res) => {
  res.cookie('accessToken', 'logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.cookie('refreshToken', 'logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.status(200).json({ status: 'success' });
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

  // Prevent users from following themselves
  if (userToFollow._id.toString() === req.user.id) {
    return next(new AppError('You cannot follow yourself', 400));
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
  await notificationService.createFollowNotification(
    req.user.id,
    userToFollow._id,
    `${currentUser.username} started following you`
  );

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

exports.getCurrentUserFollowers = catchAsync(async (req, res, next) => {
  console.log('User ID:', req.user._id);
  try {
    const followers = await Follow.find({ followed: req.user._id })
      .populate('follower', 'username profilePicture');
    
    res.status(200).json({
      status: 'success',
      data: { 
        followers: followers.map(f => f.follower),
        count: followers.length
      }
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
  console.log('Change password function called');
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

exports.getUserProfile = catchAsync(async (req, res, next) => {
  const userId = req.params.id;

  // Fetch user details
  const user = await User.findById(userId).select('username profilePicture');

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  // Fetch user's deals
  const deals = await Deal.find({ user: userId, status: 'approved' })
    .sort('-createdAt')
    .limit(10)  // Limit to the most recent 10 deals, adjust as needed
    .select('title description price imageUrl createdAt');

  // Fetch follower count
  const followerCount = await Follow.countDocuments({ followed: userId });

  // Fetch following count
  const followingCount = await Follow.countDocuments({ follower: userId });

  // Check if the current user is following this profile
  let isFollowing = false;
  if (req.user) {
    isFollowing = await Follow.exists({ follower: req.user.id, followed: userId });
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        followerCount,
        followingCount,
        isFollowing
      },
      deals
    }
  });
});

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

exports.getUnreadNotifications = catchAsync(async (req, res, next) => {
  try {
    const notificationService = new NotificationService(req.app.get('io'));
    console.log('Fetching unread notifications for user:', req.user.id);
    const notifications = await notificationService.getUnreadNotifications(req.user.id);
    console.log('Fetched notifications:', notifications);

    res.status(200).json({
      status: 'success',
      data: { notifications }
    });
  } catch (error) {
    console.error('Error in getUnreadNotifications:', error);
    next(new AppError('Error fetching notifications', 500));
  }
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

exports.refreshToken = catchAsync(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    // Clear any existing tokens
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return next(new AppError('No refresh token found', 401));
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = signToken(decoded.id);

    res.cookie('accessToken', newAccessToken, {
      expires: new Date(Date.now() + 15 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({ status: 'success' });
  } catch (error) {
    // Clear any existing tokens
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return next(new AppError('Invalid refresh token', 401));
  }
});

exports.checkAuth = catchAsync(async (req, res, next) => {
  // If this middleware is reached, it means the user is authenticated
  res.status(200).json({
    status: 'success',
    data: { user: req.user }
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