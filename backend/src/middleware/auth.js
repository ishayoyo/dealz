const auth = (req, res, next) => {
    console.log('Auth middleware');
    next();
};

module.exports = auth;