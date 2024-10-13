const axios = require('axios');

class AffiliateLinkService {
  constructor() {
    this.affiliateNetworks = {
      aliexpress: {
        isApplicable: (url) => url.includes('aliexpress.com'),
        convert: this.convertAliExpressLink.bind(this)
      }
    };
  }

  async processLink(url) {
    for (const network of Object.values(this.affiliateNetworks)) {
      if (network.isApplicable(url)) {
        return await network.convert(url);
      }
    }
    return url;
  }

  async convertAliExpressLink(url) {
    const trackingId = process.env.ALIEXPRESS_TRACKING_ID;
    try {
      const productId = this.extractProductId(url);
      if (!productId) {
        console.error('Could not extract product ID from URL:', url);
        return url;
      }

      // Construct the affiliate link using a different format
      const affiliateLink = `https://aliexpress.com/item/${productId}.html?aff_fcid=${trackingId}`;
      
      console.log('Generated affiliate link:', affiliateLink);  // For debugging

      return affiliateLink;
    } catch (error) {
      console.error('Error converting AliExpress link:', error);
    }
    return url; // Return original URL if conversion fails
  }

  extractProductId(url) {
    const patterns = [
      /\/(\d+)\.html/,
      /\/item\/(\d+)/,
      /\_(\d+)\.html/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }
}

module.exports = new AffiliateLinkService();
