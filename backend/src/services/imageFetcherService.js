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
      
      // Fetch the page content
      const pageResponse = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000 // 10 seconds timeout
      });
      
      const $ = cheerio.load(pageResponse.data);
      
      // Try to find the main image URL
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
    // Check if it's an Amazon URL
    if (pageUrl.includes('amazon.com')) {
      return this.getAmazonImageUrl($);
    }

    // Generic image finding logic
    return $('meta[property="og:image"]').attr('content') ||
           $('meta[name="twitter:image"]').attr('content') ||
           $('link[rel="image_src"]').attr('href') ||
           $('img[itemprop="image"]').attr('src') ||
           $('img').first().attr('src');
  }

  getAmazonImageUrl($) {
    return $('#landingImage').attr('data-old-hires') ||
           $('#imgBlkFront').attr('src') ||
           $('#ebooksImgBlkFront').attr('src') ||
           $('img[data-old-hires]').attr('data-old-hires') ||
           $('img[data-a-dynamic-image]').attr('src');
  }
}

module.exports = ImageFetcherService;