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

    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 11.6; rv:92.0) Gecko/20100101 Firefox/92.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36 Edg/93.0.961.47',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15'
    ];

    this.lastRequestTime = {};
  }

  async fetchAndSaveImage(url) {
    try {
      console.log('Fetching image from URL:', url);
      
      // Implement rate limiting
      await this.rateLimit(url);

      const userAgent = this.getRandomUserAgent();
      
      // Add a delay to mimic human behavior
      await this.randomDelay(2000, 5000);
      
      const pageResponse = await this.makeRequest(url, {
        headers: this.getRandomHeaders(userAgent),
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

  async rateLimit(url) {
    const domain = new URL(url).hostname;
    const now = Date.now();
    if (this.lastRequestTime[domain]) {
      const timeSinceLastRequest = now - this.lastRequestTime[domain];
      const minDelay = 30000; // 30 seconds between requests to the same domain
      if (timeSinceLastRequest < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastRequest));
      }
    }
    this.lastRequestTime[domain] = now;
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  getRandomHeaders(userAgent) {
    return {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.google.com/',
      'DNT': Math.random() < 0.5 ? '1' : undefined,
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': Math.random() < 0.5 ? 'max-age=0' : undefined,
      'TE': Math.random() < 0.5 ? 'Trailers' : undefined,
      'Pragma': Math.random() < 0.5 ? 'no-cache' : undefined,
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-User': '?1'
    };
  }

  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async makeRequest(url, options, retries = 3) {
    try {
      return await axios.get(url, options);
    } catch (error) {
      if (retries > 0) {
        console.log(`Request failed, retrying... (${retries} attempts left)`);
        await this.randomDelay(5000, 10000); // Wait before retrying
        return this.makeRequest(url, options, retries - 1);
      } else {
        throw error;
      }
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
