const express = require('express');
const router = express.Router();
const linkController = require('../../../controllers/linkController');

router.get('/out', linkController.handleOutgoingLink);

module.exports = router;