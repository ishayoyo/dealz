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
    this.categoryRotation = this.initializeCategoryRotation();
    this.currentCategoryIndex = 0;
    this.dealTypes = [
      'BEST_DEAL',
      'LIGHTNING_DEAL',
      'DEAL_OF_THE_DAY',
      'REGULAR'
    ];
    console.log('AmazonDealBotService initialized');
  }

  initializeCategoryRotation() {
    return [
      {
        name: 'electronics',
        keywords: [
          'headphone', 'monitor', 'computer', 'laptop', 'tablet', 'phone', 
          'camera', 'speaker', 'tv', 'echo', 'kindle', 'fire', 'router', 
          'gaming', 'console', 'smartwatch', 'earbuds', 'printer'
        ],
        minDiscount: 25
      },
      {
        name: 'home',
        keywords: [
          'vacuum', 'kitchen', 'furniture', 'bed', 'chair', 'table', 
          'heater', 'light', 'coffee', 'blender', 'mixer', 'air fryer', 
          'instant pot', 'sheets', 'pillow', 'curtain', 'rug', 'storage'
        ],
        minDiscount: 30
      },
      {
        name: 'fashion',
        keywords: [
          'shoe', 'boot', 'clothing', 'wear', 'dress', 'jacket', 'sneaker',
          'jeans', 'shirt', 'hoodie', 'sweater', 'watch', 'handbag', 'wallet'
        ],
        minDiscount: 40
      },
      {
        name: 'beauty',
        keywords: [
          'beauty', 'makeup', 'skin', 'hair', 'fragrance', 'shampoo',
          'cream', 'serum', 'moisturizer', 'perfume', 'brush', 'facial'
        ],
        minDiscount: 35
      },
      {
        name: 'tech_accessories',
        keywords: [
          'charger', 'case', 'screen protector', 'keyboard', 'mouse',
          'webcam', 'microphone', 'hub', 'storage', 'ssd', 'hard drive'
        ],
        minDiscount: 30
      }
    ];
  }

  async fetchDeals() {
    try {
      const currentCategory = this.categoryRotation[this.currentCategoryIndex];
      const randomDealType = this.dealTypes[Math.floor(Math.random() * this.dealTypes.length)];
      
      console.log(`Fetching ${randomDealType} deals for category: ${currentCategory.name}`);
      
      const options = {
        method: 'GET',
        url: 'https://real-time-amazon-data.p.rapidapi.com/deals-v2',
        params: {
          country: 'US',
          deal_type: randomDealType,
          min_discount_percentage: currentCategory.minDiscount,
          max_results: 15, // Fetch more to have room for filtering
          category: currentCategory.name
        },
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
        }
      };

      // Rotate to next category
      this.currentCategoryIndex = (this.currentCategoryIndex + 1) % this.categoryRotation.length;

      const response = await axios.request(options);
      
      if (response.data.status === 'OK' && response.data.data?.deals) {
        // Get deals from last 24 hours to avoid duplicates
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const existingDeals = await Deal.find({
          createdAt: { $gte: twentyFourHoursAgo }
        }).select('url');

        const existingUrls = new Set(existingDeals.map(d => d.url));

        // Filter out existing deals and by category
        const newDeals = response.data.data.deals.filter(deal => 
          !existingUrls.has(deal.deal_url) &&
          currentCategory.keywords.some(keyword => 
            deal.deal_title.toLowerCase().includes(keyword)
          )
        );

        // Shuffle the deals for randomness
        const shuffledDeals = newDeals.sort(() => Math.random() - 0.5);

        console.log(`Found ${shuffledDeals.length} new deals in ${currentCategory.name} category`);
        return this.processDeals(shuffledDeals.slice(0, 5));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching deals:', error);
      return [];
    }
  }

  async processDeals(deals = []) {
    const processedDeals = [];
    console.log(`Processing ${deals.length} deals`);

    for (const deal of deals) {
      try {
        // Check if deal URL already exists
        const existingDeal = await Deal.findOne({ 
          url: deal.deal_url,
          createdAt: { 
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
          }
        });

        if (existingDeal) {
          console.log('Recent deal already exists, skipping:', deal.deal_title);
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
    
    // Find matching category based on keywords
    const matchedCategory = this.categoryRotation.find(category =>
      category.keywords.some(keyword => titleLower.includes(keyword))
    );

    return matchedCategory ? 
      matchedCategory.name.charAt(0).toUpperCase() + matchedCategory.name.slice(1) : 
      'Other';
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