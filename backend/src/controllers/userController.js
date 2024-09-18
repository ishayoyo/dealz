const User = require('../models/User.Model');
const Deal = require('../models/Deal.Model');
const Follow = require('../models/Follow.Model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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
  const follow = await Follow.create({
    follower: req.user.id,
    followed: req.params.id
  });
  res.status(201).json({ status: 'success', data: { follow } });
});

exports.unfollowUser = catchAsync(async (req, res, next) => {
  await Follow.findOneAndDelete({
    follower: req.user.id,
    followed: req.params.id
  });
  res.status(204).json({ status: 'success', data: null });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Implement password reset logic here
  res.status(200).json({ status: 'success', message: 'Password reset email sent' });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Implement password reset logic here
  res.status(200).json({ status: 'success', message: 'Password reset successful' });
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