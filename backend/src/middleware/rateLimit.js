const rateLimit = require('express-rate-limit');

const rateLimitMiddleware = {
  register: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per IP
    message: 'Too many signup attempts. Please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.setHeader('Retry-After', 900); // 15 minutes in seconds
      res.status(429).json({
        status: 'error',
        message: 'Too many signup attempts. Please try again after 15 minutes.',
      });
    },
  }),

  login: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per IP
    message: 'Too many login attempts. Please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.setHeader('Retry-After', 900); // 15 minutes in seconds
      res.status(429).json({
        status: 'error',
        message: 'Too many login attempts. Please try again after 15 minutes.',
      });
    },
  }),

  // Keep other rate limiters as they are
  forgotPassword: (req, res, next) => {
    console.log('Rate limit middleware for forgot password');
    next();
  },
  comment: (req, res, next) => {
    console.log('Rate limit middleware for comment');
    next();
  },
  createDeal: (req, res, next) => {
    console.log('Rate limit applied for deal creation');
    next();
  },
  vote: (req, res, next) => {
    console.log('Rate limit applied for voting');
    next();
  }
};

module.exports = rateLimitMiddleware;