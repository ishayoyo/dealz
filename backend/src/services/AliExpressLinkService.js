const axios = require('axios');

class AliExpressLinkService {
  constructor(trackingId) {
    this.trackingId = trackingId;
    if (!this.trackingId) {
      console.error('ALIEXPRESS_TRACKING_ID is not set in the environment variables');
    }
  }

  async convertLink(url) {
    if (!this.trackingId) {
      console.log('No tracking ID set, returning original URL');
      return url;
    }

    // Handle short URLs
    if (url.includes('s.click.aliexpress.com')) {
      try {
        const response = await axios.get(url, { maxRedirects: 0, validateStatus: null });
        if (response.headers.location) {
          url = response.headers.location;
          console.log(`Redirected to: ${url}`);
        }
      } catch (error) {
        console.error('Error following redirect:', error);
      }
    }

    // Handle share links
    if (url.startsWith('https://star.aliexpress.com/share/share.htm')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const redirectUrl = urlParams.get('redirectUrl');
      if (redirectUrl) {
        url = decodeURIComponent(redirectUrl);
        console.log(`Extracted redirect URL: ${url}`);
      }
    }

    const productId = this.extractProductId(url);
    if (!productId) {
      console.log('Could not extract product ID, returning original URL');
      return url;
    }

    const affiliateUrl = `https://aliexpress.com/item/${productId}.html?aff_fcid=${this.trackingId}`;
    console.log(`Generated affiliate URL: ${affiliateUrl}`);
    return affiliateUrl;
  }

  extractProductId(url) {
    try {
      const urlObj = new URL(url);
      let pathParts = urlObj.pathname.split('/');
      
      // Handle different URL formats
      if (pathParts.includes('item')) {
        const productId = pathParts[pathParts.indexOf('item') + 1].split('.')[0];
        console.log(`Extracted product ID: ${productId}`);
        return productId;
      } else if (urlObj.searchParams.has('productId')) {
        const productId = urlObj.searchParams.get('productId');
        console.log(`Extracted product ID from query params: ${productId}`);
        return productId;
      }
      
      console.log('Could not extract product ID');
      return null;
    } catch (error) {
      console.error('Error extracting product ID:', error);
      return null;
    }
  }
}

module.exports = AliExpressLinkService;
