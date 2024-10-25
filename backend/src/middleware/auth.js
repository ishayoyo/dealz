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
  // Check if the route is public
  if (publicRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }

  // Get token from cookie or Authorization header
  let token = req.cookies.accessToken;
  
  // Check Authorization header if no cookie
  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
});

module.exports = auth;
