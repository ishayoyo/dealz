const AppError = require('../utils/appError');

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    next(new AppError('Access denied. Admin only.', 403));
  }
};

module.exports = isAdmin;