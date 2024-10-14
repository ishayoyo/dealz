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
    // First, check if this is our own redirection URL
    if (url.includes('deals.ishay.me/api/v1/link/out')) {
      // Extract the actual URL from the 'url' parameter
      const urlParams = new URLSearchParams(url.split('?')[1]);
      url = decodeURIComponent(urlParams.get('url'));
    }

    let originalUrl = url;
    
    // Always try to extract the original URL, even if it's not an affiliate link
    try {
      originalUrl = await this.extractOriginalUrl(url);
    } catch (error) {
      console.error('Error extracting original URL:', error);
      // If extraction fails, use the original URL
    }

    let affiliateUrl;
    try {
      // Always attempt to convert the link, even if it was already an affiliate link
      affiliateUrl = await this.convertAliExpressLink(originalUrl);
    } catch (error) {
      console.error('Error converting link:', error);
      affiliateUrl = url; // Use original link if conversion fails
    }
    
    if (affiliateUrl !== url) {
      await this.logClick(originalUrl, affiliateUrl, dealId, userId);
    }
    
    return affiliateUrl;
  }

  isAffiliateLink(url) {
    return url.includes('aff_') || url.includes('_aff') || url.includes('affiliate');
  }

  async extractOriginalUrl(affiliateUrl) {
    try {
      const response = await axios.get(affiliateUrl, {
        maxRedirects: 5,
        timeout: 10000,
        validateStatus: function (status) {
          return status >= 200 && status < 300 || status === 302;
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      return response.request.res.responseUrl || affiliateUrl;
    } catch (error) {
      console.error('Error extracting original URL:', error);
      return affiliateUrl;
    }
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
      return url; // Return original URL if conversion fails
    }
  }

  async extractProductId(url) {
    // First, follow any redirects to get the final URL
    try {
      const response = await axios.get(url, { 
        maxRedirects: 5,
        timeout: 10000,
        validateStatus: function (status) {
          return status >= 200 && status < 300 || status === 302;
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      url = response.request.res.responseUrl || url;
    } catch (error) {
      console.error('Error following redirect:', error);
      // If we can't follow the redirect, return null
      return null;
    }

    // Now extract the product ID from the final URL
    url = url.replace(/^https?:\/\/([a-z]{2})\.aliexpress\.com/, 'https://aliexpress.com')
             .split('?')[0]; // Remove all query parameters

    const patterns = [
      /\/(\d+)\.html/,
      /\/item\/(\d+)/,
      /\_(\d+)\.html/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    console.error('Could not extract product ID from URL:', url);
    return null;
  }
}

module.exports = new AffiliateLinkService();
