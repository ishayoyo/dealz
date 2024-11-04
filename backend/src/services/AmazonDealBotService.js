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
    this.categories = this.initializeCategoryRotation();
    this.dealTypes = [
      'BEST_DEAL',
      'LIGHTNING_DEAL',
      'DEAL_OF_THE_DAY',
      'REGULAR'
    ];
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.defaultImagePath = path.join(process.cwd(), 'public', 'images', 'deals', 'default.webp');
    this.rateLimit = {
      requests: 0,
      lastReset: Date.now(),
      limit: 50, // requests per minute
      resetInterval: 60000 // 1 minute
    };
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
        minDiscount: 25,
        weight: 2  // Reduced from 3
      },
      {
        name: 'home',
        keywords: [
          'vacuum', 'kitchen', 'furniture', 'bed', 'chair', 'table', 
          'heater', 'light', 'coffee', 'blender', 'mixer', 'air fryer', 
          'instant pot', 'sheets', 'pillow', 'curtain', 'rug', 'storage'
        ],
        minDiscount: 30,
        weight: 2
      },
      {
        name: 'fashion',
        keywords: [
          'shoe', 'boot', 'clothing', 'wear', 'dress', 'jacket', 'sneaker',
          'jeans', 'shirt', 'hoodie', 'sweater', 'watch', 'handbag', 'wallet'
        ],
        minDiscount: 40,
        weight: 2
      },
      {
        name: 'beauty',
        keywords: [
          'beauty', 'makeup', 'skin', 'hair', 'fragrance', 'shampoo',
          'cream', 'serum', 'moisturizer', 'perfume', 'brush', 'facial'
        ],
        minDiscount: 35,
        weight: 2
      },
      {
        name: 'tech_accessories',
        keywords: [
          'charger', 'case', 'screen protector', 'keyboard', 'mouse',
          'webcam', 'microphone', 'hub', 'storage', 'ssd', 'hard drive'
        ],
        minDiscount: 30,
        weight: 2
      }
    ];
  }

  getRandomCategory() {
    // Track last used categories to avoid repetition
    if (!this.lastUsedCategories) {
      this.lastUsedCategories = new Set();
    }

    // Create weighted pool excluding recently used categories
    let availableCategories = this.categories.filter(cat => 
      !this.lastUsedCategories.has(cat.name)
    );

    // If all categories were recently used, reset the tracking
    if (availableCategories.length === 0) {
      this.lastUsedCategories.clear();
      availableCategories = this.categories;
    }

    // Create weighted array
    const weightedPool = availableCategories.flatMap(category => 
      Array(category.weight).fill(category)
    );

    // Simple time-based boost without separate function
    const hour = new Date().getHours();
    
    // Add time-based boosts directly
    if (hour >= 6 && hour <= 11) {
      // Morning: Boost Home & Beauty
      weightedPool.push(...availableCategories.filter(c => 
        ['home', 'beauty'].includes(c.name)
      ));
    } else if (hour >= 12 && hour <= 17) {
      // Afternoon: Boost Fashion & Tech
      weightedPool.push(...availableCategories.filter(c => 
        ['fashion', 'tech_accessories'].includes(c.name)
      ));
    } else if (hour >= 18 && hour <= 23) {
      // Evening: Boost Electronics & Home
      weightedPool.push(...availableCategories.filter(c => 
        ['electronics', 'home'].includes(c.name)
      ));
    }

    // Select random category
    const selectedCategory = weightedPool[Math.floor(Math.random() * weightedPool.length)];
    
    // Track this category
    this.lastUsedCategories.add(selectedCategory.name);
    
    // Keep only last 3 categories in tracking
    if (this.lastUsedCategories.size > 3) {
      const [firstItem] = this.lastUsedCategories;
      this.lastUsedCategories.delete(firstItem);
    }

    console.log('Available categories:', availableCategories.map(c => c.name));
    console.log('Selected category:', selectedCategory.name);
    
    return selectedCategory;
  }

  async fetchDeals() {
    try {
      await this.checkRateLimit();
      
      const currentCategory = this.getRandomCategory();
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

      const response = await axios.request(options);
      
      if (response.data.status === 'OK' && response.data.data?.deals) {
        // Get deals from last 24 hours to avoid duplicates
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const existingDeals = await Deal.find({
          createdAt: { $gte: twentyFourHoursAgo }
        }).select('url');

        const existingUrls = new Set(existingDeals.map(d => d.url));

        // Filter out existing deals and by category
        const newDeals = response.data.data.deals.filter(deal => {
          // Existing filters
          const isNew = !existingUrls.has(deal.deal_url);
          const matchesCategory = currentCategory.keywords.some(keyword => 
            deal.deal_title.toLowerCase().includes(keyword)
          );
          
          // Additional quality filters
          const hasValidPrice = deal.deal_price?.amount > 0 && deal.list_price?.amount > 0;
          const hasValidDiscount = (deal.list_price?.amount - deal.deal_price?.amount) / deal.list_price?.amount >= 0.2;
          const hasValidTitle = deal.deal_title?.length >= 10;
          const hasValidImage = deal.deal_photo?.startsWith('http');
          
          return isNew && matchesCategory && hasValidPrice && hasValidDiscount && hasValidTitle && hasValidImage;
        });

        // Sort by preliminary score before processing
        const scoredDeals = newDeals.map(deal => ({
          ...deal,
          preliminaryScore: this.calculatePreliminaryScore(deal)
        })).sort((a, b) => b.preliminaryScore - a.preliminaryScore);

        return this.processDeals(scoredDeals.slice(0, 5));
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
      await fs.mkdir(this.imageDir, { recursive: true });
      
      const response = await this.retryOperation(async () => {
        return await axios.get(imageUrl, { 
          responseType: 'arraybuffer',
          timeout: 5000,
          validateStatus: status => status === 200
        });
      });

      const buffer = Buffer.from(response.data);
      const filename = `${dealId}.webp`;
      const filepath = path.join(this.imageDir, filename);
      
      // Enhanced image processing
      await sharp(buffer)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ 
          quality: 80,
          effort: 4,
          lossless: false
        })
        .toFile(filepath);

      return `/images/deals/${filename}`;
    } catch (error) {
      console.error('Error processing image:', error);
      return '/images/deals/default.webp';
    }
  }

  mapAmazonCategory(title) {
    const titleLower = title.toLowerCase();
    
    // Find matching category based on keywords
    const matchedCategory = this.categories.find(category =>
      category.keywords.some(keyword => titleLower.includes(keyword))
    );

    return matchedCategory ? 
      matchedCategory.name.charAt(0).toUpperCase() + matchedCategory.name.slice(1) : 
      'Other';
  }

  async optimizeDealContent(dealData) {
    try {
      await this.checkRateLimit();
      
      const prompt = `
      You are an expert deal hunter who knows how to create viral, high-converting deal posts.
      Transform this Amazon deal into an irresistible social post:

      Title: ${dealData.title || ''}
      Price: ${dealData.current_price || '0'}
      List Price: ${dealData.list_price || '0'}
      Category: ${dealData.category || 'Other'}

      Respond with ONLY a valid JSON object. Create unique, compelling titles that drive action!
      Use varied intros, strong value props, and urgency. Examples:
      - "STEAL ALERT 🚨 AirPods Pro at Historic Low!"
      - "Run! 60% OFF Nike Runners Today Only"
      - "LOWEST EVER: MacBook Air $400 OFF 🔥"
      - "Quick! Dyson V15 with RARE $200 Discount"
      - "Insane Deal: 75" Samsung TV Under $800 🏃"
      - "HOT DROP: AirFryer XL at Black Friday Price"
      
      Format:
      {
        "title": "(60 chars max, use varied attention-grabbing formats above)",
        "description": "(150 chars max, focus on value, urgency, and benefits: 'Incredible value! Includes [features]. Selling fast at this price - lowest in [X] months! Worth every penny 🎯')",
        "category": "(one of: Electronics, Home, Fashion, Beauty, Sports, Books, Toys, Travel, Food, Auto, DIY, Pets, Other)",
        "price": (number only),
        "listPrice": (number only)
      }

      Focus on the specific product, price drop, and creating urgency. Vary the format for each deal. No repetitive patterns!`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        temperature: 1.0, // Maximum creativity for variety
        messages: [{ role: 'user', content: prompt }]
      });

      // Enhanced error handling and validation
      const result = JSON.parse(response.content[0].text.trim());
      
      // Validate response format
      if (!this.validateOptimizedContent(result)) {
        throw new Error('Invalid content format from Claude');
      }

      return result;
    } catch (error) {
      console.error('Error optimizing deal content:', error);
      return this.createFallbackContent(dealData);
    }
  }

  async retryOperation(operation, retries = this.maxRetries) {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
      }
    }
  }

  async checkRateLimit() {
    const now = Date.now();
    if (now - this.rateLimit.lastReset > this.rateLimit.resetInterval) {
      this.rateLimit.requests = 0;
      this.rateLimit.lastReset = now;
    }
    if (this.rateLimit.requests >= this.rateLimit.limit) {
      throw new Error('Rate limit exceeded');
    }
    this.rateLimit.requests++;
  }

  calculateDealScore(deal) {
    let score = 0;
    
    // Price discount score (0-40 points)
    const discountPercent = ((deal.listPrice - deal.price) / deal.listPrice) * 100;
    score += Math.min(40, discountPercent);
    
    // Deal type bonus (0-20 points)
    const dealTypeScores = {
      'LIGHTNING_DEAL': 20,
      'DEAL_OF_THE_DAY': 15,
      'BEST_DEAL': 10,
      'REGULAR': 5
    };
    score += dealTypeScores[deal.metadata.dealType] || 0;
    
    // Time sensitivity (0-20 points)
    if (deal.metadata.dealEndsAt) {
      const hoursRemaining = (new Date(deal.metadata.dealEndsAt) - new Date()) / (1000 * 60 * 60);
      score += hoursRemaining < 24 ? 20 : hoursRemaining < 48 ? 10 : 0;
    }

    // Category weight (0-10 points)
    const categoryWeights = {
      'electronics': 10,
      'home': 8,
      'tech_accessories': 7,
      'fashion': 6,
      'beauty': 5
    };
    score += categoryWeights[deal.category.toLowerCase()] || 0;
    
    return score;
  }

  calculatePreliminaryScore(deal) {
    let score = 0;
    
    // Basic discount score
    score += deal.savings_percentage || 0;
    
    // Deal type bonus
    if (deal.deal_type === 'LIGHTNING_DEAL') score += 20;
    if (deal.deal_type === 'DEAL_OF_THE_DAY') score += 15;
    
    // Title quality score
    const titleLength = deal.deal_title?.length || 0;
    score += Math.min(10, titleLength / 10);
    
    return score;
  }

  validateOptimizedContent(content) {
    return (
      content.title?.length <= 60 &&
      content.description?.length <= 150 &&
      typeof content.price === 'number' &&
      typeof content.listPrice === 'number' &&
      content.category
    );
  }

  createFallbackContent(dealData) {
    const discount = ((dealData.list_price - dealData.current_price) / dealData.list_price * 100).toFixed(0);
    return {
      title: `SAVE ${discount}% on ${dealData.title?.slice(0, 40)}`,
      description: `Great deal! Save ${discount}% on this ${dealData.category.toLowerCase()} item. Limited time offer!`,
      category: dealData.category || 'Other',
      price: parseFloat(dealData.current_price?.replace(/[^0-9.]/g, '')) || 0,
      listPrice: parseFloat(dealData.list_price?.replace(/[^0-9.]/g, '')) || 0
    };
  }
}

module.exports = AmazonDealBotService; 