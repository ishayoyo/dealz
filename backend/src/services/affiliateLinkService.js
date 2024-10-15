const axios = require('axios');
const AffiliateClick = require('../models/AffiliateClick.Model');
const AmazonLinkService = require('./AmazonLinkService');
const AliExpressLinkService = require('./AliExpressLinkService');

class AffiliateLinkService {
  constructor() {
    this.amazonService = new AmazonLinkService(process.env.AMAZON_TRACKING_ID);
    this.aliExpressService = new AliExpressLinkService(process.env.ALIEXPRESS_TRACKING_ID);
    console.log('AffiliateLinkService initialized');
  }

  async processLink(url, dealId, userId) {
    console.log(`Processing link: ${url}`);
    let affiliateUrl;
    let platform;

    if (url.includes('amazon.com') || url.includes('amzn.to')) {
      console.log('Detected Amazon URL');
      affiliateUrl = await this.amazonService.convertLink(url);
      platform = 'Amazon';
    } else if (url.includes('aliexpress.com')) {
      console.log('Detected AliExpress URL');
      affiliateUrl = await this.aliExpressService.convertLink(url);
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
}

module.exports = new AffiliateLinkService();
