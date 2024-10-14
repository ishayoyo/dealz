const axios = require('axios');
const AffiliateClick = require('../models/AffiliateClick.Model');
const NodeCache = require('node-cache');

class AffiliateLinkService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
    this.trackingId = process.env.ALIEXPRESS_TRACKING_ID;
    if (!this.trackingId) {
      console.error('ALIEXPRESS_TRACKING_ID is not set in the environment variables');
    }
  }

  async processLink(url, dealId, userId) {
    const cachedUrl = this.cache.get(url);
    if (cachedUrl) return cachedUrl;

    if (url.includes('deals.ishay.me/api/v1/link/out')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      url = decodeURIComponent(urlParams.get('url'));
    }

    const affiliateUrl = await this.convertAliExpressLink(url);
    
    if (affiliateUrl !== url) {
      this.logClick(url, affiliateUrl, dealId, userId).catch(console.error);
    }
    
    this.cache.set(url, affiliateUrl);
    return affiliateUrl;
  }

  async convertAliExpressLink(url) {
    if (!this.trackingId) return url;

    const productId = this.extractProductId(url);
    if (!productId) return url;

    return `https://aliexpress.com/item/${productId}.html?aff_fcid=${this.trackingId}`;
  }

  extractProductId(url) {
    const cleanUrl = url.replace(/^https?:\/\/([a-z]{2}\.)?aliexpress\.com/, '')
                        .split('?')[0];
    
    const match = cleanUrl.match(/\/(?:item\/|_)?(\d+)\.html/);
    return match ? match[1] : null;
  }

  async logClick(originalUrl, affiliateUrl, dealId, userId) {
    await AffiliateClick.create({
      originalUrl,
      affiliateUrl,
      dealId,
      userId
    });
  }
}

module.exports = new AffiliateLinkService();
