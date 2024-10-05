const rateLimit = require('express-rate-limit');

const rateLimitMiddleware = {
  register: rateLimit({
    windowMs: 3 * 60 * 1000, // 3 minutes
    max: 5, // 5 attempts per IP
    message: 'Too many signup attempts. Please try again after 3 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.setHeader('Retry-After', 180); // 3 minutes in seconds
      res.status(429).json({
        status: 'error',
        message: 'Too many signup attempts. Please try again after 3 minutes.',
        attemptsLeft: 0
      });
    },
  }),

  login: rateLimit({
    windowMs: 3 * 60 * 1000, // 3 minutes
    max: 5, // 5 attempts per IP
    message: 'Too many login attempts. Please try again after 3 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.setHeader('Retry-After', 180); // 3 minutes in seconds
      res.status(429).json({
        status: 'error',
        message: 'Too many login attempts. Please try again after 3 minutes.',
        attemptsLeft: 0
      });
    },
    onLimitReached: (req, res, options) => {
      res.status(429).json({
        status: 'error',
        message: 'Too many login attempts. Please try again after 3 minutes.',
        attemptsLeft: 0
      });
    },
    keyGenerator: (req) => req.ip,
    skip: (req, res) => false,
    handler: (req, res, next, options) => {
      const attemptsLeft = Math.max(options.max - req.rateLimit.current, 0);
      res.status(429).json({
        status: 'error',
        message: `Too many login attempts. You have ${attemptsLeft} attempts left.`,
        attemptsLeft: attemptsLeft
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