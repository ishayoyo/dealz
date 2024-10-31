const jwt = require('jsonwebtoken');
const User = require('../models/User.Model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const publicRoutes = [
  '/api/v1/deals',
  '/api/v1/users/login',
  '/api/v1/users/signup',
  '/api/v1/users/refresh-token',
  '/api/v1/users/auth/google',           // Add this
  '/api/v1/users/auth/google/callback',  // Add this
  '/api/v1/users/check-email',          // Add this if you have it
  '/api/v1/users/verify-email',         // Add this if you have it
  '/api/v1/users/resend-verification'   // Add this if you have it
];

const protect = catchAsync(async (req, res, next) => {
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
  if (isPublicRoute) {
    return next();
  }

  let token = req.cookies.accessToken;

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
    // If token verification fails, try to refresh
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return next(new AppError('Session expired. Please log in again.', 401));
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new AppError('User not found. Please log in again.', 401));
      }

      // Generate new tokens
      const newAccessToken = signToken(user._id);
      const newRefreshToken = signRefreshToken(user._id);

      // Set new cookies
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      req.user = user;
      next();
    } catch (refreshError) {
      return next(new AppError('Session expired. Please log in again.', 401));
    }
  }
});

module.exports = protect;
