const express = require('express');
const productRoutes = require('./productRoutes');

const router = express.Router();

router.use('/products', productRoutes);

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to DealFinder API' });
});

module.exports = router;