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

const protect = catchAsync(async (req, res, next) => {
  let token;
  
  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check for token in cookies
  else if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
});

module.exports = protect;
