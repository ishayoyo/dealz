const axios = require('axios');
const Deal = require('../models/Deal.Model');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs').promises;

class AmazonDealBotService {
  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY;
    this.anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
    this.imageDir = path.join(process.cwd(), 'public', 'images', 'deals');
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://saversonic.com'
      : 'http://localhost:5000';
    console.log('AmazonDealBotService initialized');
  }

  async fetchDeals() {
    try {
      console.log('Starting deal fetch...');
      
      const options = {
        method: 'GET',
        url: 'https://real-time-amazon-data.p.rapidapi.com/deals-v2',
        params: {
          country: 'US',
          deal_type: 'BEST_DEAL',
          min_discount_percentage: 30,
          max_results: 5 // Start with just 5 deals for testing
        },
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
        }
      };

      console.log('Fetching deals with options:', JSON.stringify(options, null, 2));
      const response = await axios.request(options);
      
      if (response.data.status === 'OK' && response.data.data?.deals) {
        console.log(`Found ${response.data.data.deals.length} deals`);
        return this.processDeals(response.data.data.deals);
      }
      
      console.log('No deals found or invalid response format');
      return [];
    } catch (error) {
      console.error('Error fetching deals:', error);
      return [];
    }
  }

  async processDeals(deals = []) {
    const processedDeals = [];
    // Take only first 5 deals
    const limitedDeals = deals.slice(0, 5);
    console.log(`Processing ${limitedDeals.length} deals`);

    for (const deal of limitedDeals) {
      try {
        // Check if deal already exists
        const existingDeal = await Deal.findOne({ url: deal.deal_url });
        if (existingDeal) {
          console.log('Deal already exists, skipping:', deal.deal_title);
          continue;
        }

        // Process image
        const imageUrl = await this.processImage(deal.deal_photo, deal.deal_id);

        // Prepare deal data for optimization
        const dealData = {
          title: deal.deal_title,
          current_price: deal.deal_price.amount,
          list_price: deal.list_price.amount,
          category: this.mapAmazonCategory(deal.deal_title)
        };

        // Get optimized content from Claude
        const optimizedContent = await this.optimizeDealContent(dealData);

        const newDeal = {
          title: optimizedContent.title,
          description: optimizedContent.description,
          price: parseFloat(deal.deal_price.amount),
          listPrice: parseFloat(deal.list_price.amount),
          category: optimizedContent.category,
          imageUrl: imageUrl,
          url: deal.deal_url,
          store: 'Amazon',
          status: 'pending',
          user: process.env.BOT_USER_ID,
          currency: 'USD',
          metadata: {
            dealId: deal.deal_id,
            dealType: deal.deal_type,
            savingsPercentage: deal.savings_percentage,
            dealEndsAt: deal.deal_ends_at,
            productAsin: deal.product_asin
          }
        };

        console.log('Creating new deal:', newDeal.title);
        const createdDeal = await Deal.create(newDeal);
        processedDeals.push(createdDeal);
      } catch (error) {
        console.error('Error processing individual deal:', error);
      }
    }

    return processedDeals;
  }

  async processImage(imageUrl, dealId) {
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(this.imageDir, { recursive: true });

      // Download image
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      // Convert to WebP and save
      const filename = `${dealId}.webp`;
      const filepath = path.join(this.imageDir, filename);
      
      await sharp(buffer)
        .webp({ quality: 80 })
        .toFile(filepath);

      // Return relative path only, without base URL
      return `/images/deals/${filename}`;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  mapAmazonCategory(title) {
    const titleLower = title.toLowerCase();
    const categoryMap = {
      'electronics': ['headphone', 'monitor', 'computer', 'laptop', 'tablet', 'phone', 'camera', 'speaker', 'tv', 'echo'],
      'home': ['vacuum', 'kitchen', 'furniture', 'bed', 'chair', 'table', 'heater', 'light'],
      'fashion': ['shoe', 'boot', 'clothing', 'wear', 'dress', 'jacket'],
      'beauty': ['beauty', 'makeup', 'skin', 'hair', 'fragrance'],
      'sports': ['fitness', 'exercise', 'sport', 'workout', 'gym'],
      'toys': ['toy', 'game', 'play'],
      'auto': ['car', 'automotive', 'vehicle'],
      'pets': ['pet', 'dog', 'cat', 'bird']
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }

    return 'Other';
  }

  async optimizeDealContent(dealData) {
    try {
      const prompt = `
      You are a JSON-only response bot. Optimize this Amazon deal data:
      Title: ${dealData.title || ''}
      Price: ${dealData.current_price || '0'}
      List Price: ${dealData.list_price || '0'}
      Category: ${dealData.category || 'Other'}

      Respond with ONLY a valid JSON object in this exact format:
      {
        "title": "(60 chars max, catchy title)",
        "description": "(150 chars max, compelling description)",
        "category": "(one of: Electronics, Home, Fashion, Beauty, Sports, Books, Toys, Travel, Food, Auto, DIY, Pets, Other)",
        "price": (number only),
        "listPrice": (number only)
      }

      Do not include any other text or explanation.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      });

      try {
        return JSON.parse(response.content[0].text.trim());
      } catch (parseError) {
        console.error('Invalid JSON from Claude:', response.content[0].text);
        // Return fallback data
        return {
          title: dealData.title?.slice(0, 60) || 'Amazon Deal',
          description: `Save on ${dealData.title?.slice(0, 100) || 'this product'}`,
          category: dealData.category || 'Other',
          price: parseFloat(dealData.current_price?.replace(/[^0-9.]/g, '')) || 0,
          listPrice: parseFloat(dealData.list_price?.replace(/[^0-9.]/g, '')) || 0
        };
      }
    } catch (error) {
      console.error('Error optimizing deal content:', error);
      // Return fallback data
      return {
        title: dealData.title?.slice(0, 60) || 'Amazon Deal',
        description: `Save on ${dealData.title?.slice(0, 100) || 'this product'}`,
        category: dealData.category || 'Other',
        price: parseFloat(dealData.current_price?.replace(/[^0-9.]/g, '')) || 0,
        listPrice: parseFloat(dealData.list_price?.replace(/[^0-9.]/g, '')) || 0
      };
    }
  }
}

module.exports = AmazonDealBotService; 