const rateLimit = require('express-rate-limit');
const MemoryStore = require('express-rate-limit').MemoryStore;

const createRateLimiter = (options) => {
  const limiter = rateLimit({
    store: new MemoryStore(),
    ...options,
    keyGenerator: (req) => req.body.email || req.ip,
    handler: (req, res) => {
      console.log('Rate limit reached for:', req.body.email || req.ip);
      
      res.setHeader('Retry-After', options.windowMs / 1000);
      res.status(429).json({
        status: 'error',
        message: options.message || 'Too many attempts. Please try again later.',
        attemptsLeft: 0,
        waitTime: options.windowMs / 1000
      });
    }
  });

  return (req, res, next) => {
    limiter(req, res, (err) => {
      if (err) return next(err);
      req.rateLimit = {
        current: req.rateLimit.current,
        remaining: req.rateLimit.remaining,
        resetTime: req.rateLimit.resetTime
      };
      next();
    });
  };
};

const rateLimitMiddleware = {
  register: rateLimit({
    store: new MemoryStore(),
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

  login: createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts. Please try again after 5 minutes.',
    standardHeaders: true,
    legacyHeaders: false
  }),

  forgotPassword: rateLimit({
    store: new MemoryStore(),
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
    store: new MemoryStore(),
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
    store: new MemoryStore(),
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

  resetPassword: rateLimit({
    store: new MemoryStore(),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per IP
    message: 'Too many password reset attempts. Please try again after an hour.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        status: 'error',
        message: 'Too many password reset attempts. Please try again after an hour.',
        attemptsLeft: 0
      });
    },
  }),

  checkEmail: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // limit each IP to 10 requests per windowMs
  }),

  resendVerification: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5 // limit each IP to 5 requests per windowMs
  }),

  // Add these new rate limiters for Google auth
  googleAuth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per IP
    message: 'Too many Google auth attempts. Please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.setHeader('Retry-After', 900); // 15 minutes in seconds
      res.status(429).json({
        status: 'error',
        message: 'Too many Google auth attempts. Please try again after 15 minutes.',
        attemptsLeft: 0
      });
    },
  }),

  googleCallback: rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 3,
    handler: (req, res) => {
      res.setHeader('Retry-After', 300);
      // Change this to redirect to home with error param
      res.redirect(`${process.env.FRONTEND_URL}/?auth=error&message=too_many_attempts`);
    },
  }),

  fetchDealImage: rateLimit({
    store: new MemoryStore(),
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 15, // 15 attempts per IP
    message: 'Too many image fetch attempts. Please try again after 5 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        status: 'error',
        message: 'Too many image fetch attempts. Please try again after 5 minutes.',
        attemptsLeft: 0
      });
    },
  }),
};

module.exports = rateLimitMiddleware;
