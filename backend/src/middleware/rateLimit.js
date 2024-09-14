const rateLimit = {
  register: (req, res, next) => {
    console.log('Rate limit middleware for registration');
    next();
  },
  login: (req, res, next) => {
    console.log('Rate limit middleware for login');
    next();
  },
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

module.exports = rateLimit;