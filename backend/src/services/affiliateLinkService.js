const axios = require('axios');
const AffiliateClick = require('../models/AffiliateClick.Model');

class AffiliateLinkService {
  constructor() {
    this.affiliateNetworks = {
      aliexpress: {
        isApplicable: (url) => url.includes('aliexpress.com'),
        convert: this.convertAliExpressLink.bind(this)
      }
    };
  }

  async processLink(url, dealId, userId) {
    const affiliateUrl = await this.convertAliExpressLink(url);
    if (affiliateUrl !== url) {
      await this.logClick(url, affiliateUrl, dealId, userId);
    }
    return affiliateUrl;
  }

  async logClick(originalUrl, affiliateUrl, dealId, userId) {
    await AffiliateClick.create({
      originalUrl,
      affiliateUrl,
      dealId,
      userId
    });
  }

  async convertAliExpressLink(url) {
    const trackingId = process.env.ALIEXPRESS_TRACKING_ID;
    if (!trackingId) {
      console.error('ALIEXPRESS_TRACKING_ID is not set in the environment variables');
      return url;
    }

    try {
      const productId = await this.extractProductId(url);
      if (!productId) {
        console.error('Could not extract product ID from URL:', url);
        return url;
      }

      const affiliateLink = `https://aliexpress.com/item/${productId}.html?aff_fcid=${trackingId}`;
      console.log('Generated affiliate link:', affiliateLink);

      return affiliateLink;
    } catch (error) {
      console.error('Error converting AliExpress link:', error);
    }
    return url;
  }

  async extractProductId(url) {
    // Normalize URL to remove language-specific subdomains
    url = url.replace(/^https?:\/\/([a-z]{2})\.aliexpress\.com/, 'https://aliexpress.com');

    const patterns = [
      /\/(\d+)\.html/,
      /\/item\/(\d+)/,
      /\_(\d+)\.html/,
      /productId=(\d+)/  // Add this pattern to catch product IDs in query parameters
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // If no match found, try to resolve shortened URLs
    if (url.includes('aliexpress.com') && !url.includes('/item/')) {
      try {
        const response = await axios.get(url, { 
          maxRedirects: 5,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        const finalUrl = response.request.res.responseUrl;
        return this.extractProductId(finalUrl);
      } catch (error) {
        console.error('Error resolving URL:', error);
      }
    }

    return null;
  }
}

module.exports = new AffiliateLinkService();
