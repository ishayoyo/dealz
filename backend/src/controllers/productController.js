const { scrapeAliExpressProduct } = require('../services/imageFetcherService');

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

const scraperService = require('../services/imageFetcherService');

// ... other imports and code ...

exports.createProduct = async (req, res) => {
  try {
    const { title, description, url, category } = req.body;

    // Scrape the website for image and price
    const { imageUrl, price } = await scraperService.scrapeWebsite(url);

    // Create the product with scraped data
    const product = new Product({
      title,
      description,
      url,
      category,
      imageUrl,
      price,
      // Add other fields as necessary
    });

    await product.save();

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// ... other controller methods ...