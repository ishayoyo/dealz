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
      
      // First, try to fetch the page content
      const pageResponse = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(pageResponse.data);
      
      // Try to find the main image URL
      let imageUrl = $('meta[property="og:image"]').attr('content') ||
                     $('meta[name="twitter:image"]').attr('content') ||
                     $('img[itemprop="image"]').attr('src') ||
                     $('img').first().attr('src');

      if (!imageUrl) {
        throw new Error('No image found on the page');
      }

      // If the image URL is relative, make it absolute
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      } else if (!imageUrl.startsWith('http')) {
        imageUrl = new URL(imageUrl, url).href;
      }

      console.log('Found image URL:', imageUrl);

      // Now fetch the actual image
      const imageResponse = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 10000
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
      return null;
    }
  }
}

module.exports = ImageFetcherService;