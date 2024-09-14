const express = require('express');
const { scrapeProduct } = require('../controllers/productController');

const router = express.Router();

router.post('/scrape', scrapeProduct);

module.exports = router;