const { scrapeAliExpressProduct } = require('../services/scraperService');

exports.scrapeProduct = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const productData = await scrapeAliExpressProduct(url);
    res.json(productData);
  } catch (error) {
    next(error);
  }
};