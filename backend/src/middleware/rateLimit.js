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
    handler: (req, res, next, options) => {
      const attemptsLeft = Math.max(options.max - req.rateLimit.current, 0);
      res.status(429).json({
        status: 'error',
        message: `Too many login attempts. You have ${attemptsLeft} attempts left.`,
        attemptsLeft: attemptsLeft
      });
    },
  }),

  forgotPassword: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 attempts per IP
    message: 'Too many password reset attempts. Please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        status: 'error',
        message: 'Too many password reset attempts. Please try again after 15 minutes.',
        attemptsLeft: 0
      });
    },
  }),

  comment: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 comments per IP
    message: 'Too many comments. Please try again after 5 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        status: 'error',
        message: 'Too many comments. Please try again after 5 minutes.',
        attemptsLeft: 0
      });
    },
  }),

  createDeal: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 deals per IP per hour
    message: 'Too many deals created. Please try again after an hour.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        status: 'error',
        message: 'Too many deals created. Please try again after an hour.',
        attemptsLeft: 0
      });
    },
  }),

  vote: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 votes per IP
    message: 'Too many votes. Please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        status: 'error',
        message: 'Too many votes. Please try again after 15 minutes.',
        attemptsLeft: 0
      });
    },
  })
};

module.exports = rateLimitMiddleware;