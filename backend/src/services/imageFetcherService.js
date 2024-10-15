const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const cheerio = require('cheerio');

class ImageFetcherService {
  constructor() {
    this.imageDir = path.join(__dirname, '..', '..', 'public', 'images', 'deals');
    fs.ensureDirSync(this.imageDir);
    console.log('ImageFetcherService initialized. Image directory:', this.imageDir);
  }

  async fetchAndSaveImage(url) {
    try {
      console.log('Fetching image from URL:', url);
      
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
      ];
      
      const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      
      // Add a delay to mimic human behavior
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      const pageResponse = await axios.get(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://www.walmart.com/',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(pageResponse.data);
      
      let imageUrl = this.findImageUrl($, url);

      if (!imageUrl) {
        console.log('No suitable image found on the page');
        return null;
      }

      console.log('Found image URL:', imageUrl);

      // Ensure the image URL is absolute
      imageUrl = new URL(imageUrl, url).href;

      console.log('Resolved image URL:', imageUrl);

      // Fetch the actual image
      const imageResponse = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      console.log('Image fetched successfully');

      const buffer = Buffer.from(imageResponse.data, 'binary');
      const filename = `${crypto.randomBytes(16).toString('hex')}.jpg`;
      const filepath = path.join(this.imageDir, filename);

      console.log('Writing image to file:', filepath);
      await fs.writeFile(filepath, buffer);
      
      console.log('Image saved successfully');
      const savedImageUrl = `/images/deals/${filename}`;
      console.log('Returning image URL:', savedImageUrl);
      return savedImageUrl;
    } catch (error) {
      console.error('Error in fetchAndSaveImage:', error.message);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.statusText);
      }
      return null;
    }
  }

  findImageUrl($, pageUrl) {
    if (pageUrl.includes('amazon.com')) {
      return this.getAmazonImageUrl($);
    } else if (pageUrl.includes('walmart.com')) {
      return this.getWalmartImageUrl($);
    } else if (pageUrl.includes('ebay.com')) {
      return this.getEbayImageUrl($);
    }

    // Enhanced generic image finding logic
    const possibleSelectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'link[rel="image_src"]',
      'img[itemprop="image"]',
      'img.product-image',
      'img.main-image',
      'img#main-product-image',
      'img[alt*="product"]',
      'img'
    ];

    for (let selector of possibleSelectors) {
      const imageUrl = $(selector).first().attr('src') || $(selector).first().attr('content');
      if (imageUrl) return imageUrl;
    }

    console.log('No image found using common selectors');
    return null;
  }

  getAmazonImageUrl($) {
    return $('#landingImage').attr('data-old-hires') ||
           $('#imgBlkFront').attr('src') ||
           $('#ebooksImgBlkFront').attr('src') ||
           $('img[data-old-hires]').attr('data-old-hires') ||
           $('img[data-a-dynamic-image]').attr('src');
  }

  getWalmartImageUrl($) {
    return $('meta[property="og:image"]').attr('content') ||
           $('img[data-testid="hero-image"]').attr('src') ||
           $('img[data-automation-id="image-preview"]').attr('src') ||
           $('img.prod-hero-image').attr('src');
  }

  getEbayImageUrl($) {
    // Try to get the image URL from the JSON-LD data
    const jsonLd = $('script[type="application/ld+json"]').html();
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd);
        if (data.image && data.image.length > 0) {
          return data.image[0];
        }
      } catch (e) {
        console.error('Error parsing JSON-LD:', e);
      }
    }

    // Fallback to other selectors
    return $('#icImg').attr('src') ||
           $('.img-wrapper img').attr('src') ||
           $('img[itemprop="image"]').attr('src') ||
           $('meta[property="og:image"]').attr('content') ||
           $('img[data-zoom-src]').attr('data-zoom-src');
  }
}

module.exports = ImageFetcherService;
