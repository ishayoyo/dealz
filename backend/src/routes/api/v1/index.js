const express = require('express');
const router = express.Router();

router.use('/users', require('./User.Route'));
router.use('/deals', require('./Deal.Route'));
router.use('/comments', require('./Comment.Route'));
router.use('/admin', require('./Admin.Route'));

module.exports = router;