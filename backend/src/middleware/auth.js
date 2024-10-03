const jwt = require('jsonwebtoken');
const User = require('../models/User.Model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const publicRoutes = [
  '/api/v1/deals',
  '/api/v1/users/login',
  '/api/v1/users/signup',
  '/api/v1/users/refresh-token'
  // Add other public routes here
];

const auth = catchAsync(async (req, res, next) => {
  console.log('Request path:', req.path);
  
  // Check if the route is public
  if (publicRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }

  console.log('Cookies:', req.cookies);
  const token = req.cookies.accessToken;

  if (!token) {
    console.log('No access token found in cookies');
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    console.log('Current user:', currentUser);
    req.user = currentUser;
    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
});

module.exports = auth;