const axios = require('axios');
const AffiliateClick = require('../models/AffiliateClick.Model');

class AffiliateLinkService {
  constructor() {
    this.aliExpressTrackingId = process.env.ALIEXPRESS_TRACKING_ID;
    this.amazonTrackingId = process.env.AMAZON_TRACKING_ID;
    if (!this.aliExpressTrackingId) {
      console.error('ALIEXPRESS_TRACKING_ID is not set in the environment variables');
    }
    if (!this.amazonTrackingId) {
      console.error('AMAZON_TRACKING_ID is not set in the environment variables');
    }
    console.log('AffiliateLinkService initialized');
  }

  async processLink(url, dealId, userId) {
    console.log(`Processing link: ${url}`);

    let affiliateUrl;
    let platform;

    if (url.includes('amazon.com') || url.includes('amzn.to')) {
      console.log('Detected Amazon URL');
      affiliateUrl = await this.convertAmazonLink(url);
      platform = 'Amazon';
    } else if (url.includes('aliexpress.com')) {
      console.log('Detected AliExpress URL');
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

      // Check if it's a share link
      if (url.startsWith('https://star.aliexpress.com/share/share.htm')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const redirectUrl = urlParams.get('redirectUrl');
        if (redirectUrl) {
          url = decodeURIComponent(redirectUrl);
          console.log(`Extracted redirect URL: ${url}`);
        }
      }

      affiliateUrl = await this.convertAliExpressLink(url);
      platform = 'AliExpress';
    } else {
      console.log('Unsupported URL, returning original');
      return { processedUrl: url, platform: 'Other' };
    }

    if (affiliateUrl !== url) {
      console.log(`Converted to affiliate URL: ${affiliateUrl}`);
      this.logClick(url, affiliateUrl, dealId, userId, platform).catch(error => {
        console.error('Error logging click:', error);
      });
    } else {
      console.log('URL was not converted (possibly already an affiliate link)');
    }
    
    console.log(`Returning URL: ${affiliateUrl}`);
    return { processedUrl: affiliateUrl, platform };
  }

  async convertAliExpressLink(url) {
    if (!this.aliExpressTrackingId) {
      console.log('No tracking ID set, returning original URL');
      return url;
    }

    const productId = this.extractProductId(url);
    if (!productId) {
      console.log('Could not extract product ID, returning original URL');
      return url;
    }

    const affiliateUrl = `https://aliexpress.com/item/${productId}.html?aff_fcid=${this.aliExpressTrackingId}`;
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

  async logClick(originalUrl, affiliateUrl, dealId, userId, platform) {
    console.log(`Logging ${platform} click - Original: ${originalUrl}, Affiliate: ${affiliateUrl}, Deal ID: ${dealId}, User ID: ${userId}`);
    try {
      const click = await AffiliateClick.create({
        originalUrl,
        affiliateUrl,
        dealId,
        userId,
        platform
      });
      console.log(`${platform} click logged successfully:`, click);
    } catch (error) {
      console.error(`Error logging ${platform} click:`, error);
    }
  }

  async convertAmazonLink(url) {
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
      
      // Remove any existing 'tag' parameter
      urlObj.searchParams.delete('tag');
      
      // Add our tracking ID
      if (this.amazonTrackingId) {
        urlObj.searchParams.set('tag', this.amazonTrackingId);
      } else {
        console.warn('Amazon tracking ID is not set. Affiliate link may not work correctly.');
      }
      
      // Ensure we're not adding 'undefined' as a tag
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

module.exports = new AffiliateLinkService();
