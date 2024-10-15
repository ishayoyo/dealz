const axios = require('axios');

class AmazonLinkService {
  constructor(trackingId) {
    this.trackingId = trackingId;
    if (!this.trackingId) {
      console.error('AMAZON_TRACKING_ID is not set in the environment variables');
    }
  }

  async convertLink(url) {
    console.log(`Converting Amazon link: ${url}`);
    try {
      // Handle shortened URLs
      if (url.includes('amzn.to')) {
        const response = await axios.get(url, { maxRedirects: 0, validateStatus: null });
        if (response.headers.location) {
          url = response.headers.location;
          console.log(`Redirected to: ${url}`);
        }
      }

      const urlObj = new URL(url);
      urlObj.searchParams.delete('tag');
      if (this.trackingId) {
        urlObj.searchParams.set('tag', this.trackingId);
      } else {
        console.warn('Amazon tracking ID is not set. Affiliate link may not work correctly.');
      }
      if (urlObj.searchParams.get('tag') === 'undefined') {
        urlObj.searchParams.delete('tag');
      }
      const convertedUrl = urlObj.toString();
      console.log(`Converted Amazon URL: ${convertedUrl}`);
      return convertedUrl;
    } catch (error) {
      console.error('Error converting Amazon link:', error);
      return url;
    }
  }
}

module.exports = AmazonLinkService;