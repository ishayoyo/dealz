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
      const prompt = `
        You are an expert deal hunter who knows how to create viral, high-converting deal posts.
        Transform this deal data into an irresistible social post:

        Title: ${dealData.title || ''}
        Price: ${dealData.current_price || '0'}
        List Price: ${dealData.list_price || '0'}
        Category: ${dealData.category || 'Other'}

        Create a JSON object with these exact fields:
        {
          "title": "60 chars max, attention-grabbing title",
          "description": "150 chars max, focus on value and urgency",
          "category": "one of: Electronics, Home, Fashion, Beauty, Sports, Other",
          "price": number,
          "listPrice": number
        }

        IMPORTANT: Respond with ONLY the JSON object, no additional text or formatting.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        temperature: 0.7, // Reduced for more consistent output
        messages: [{ 
          role: 'user', 
          content: prompt 
        }],
        system: "You are a deal optimization expert. Always respond with valid JSON only. No additional text or formatting."
      });

      let result;
      try {
        // Clean the response text before parsing
        const cleanedText = response.content[0].text
          .trim()
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
          .trim();
        
        result = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.log('Raw Response:', response.content[0].text);
        throw new Error('Failed to parse Claude response');
      }

      // Validate the content
      if (!this.validateOptimizedContent(result)) {
        console.error('Invalid content structure:', result);
        throw new Error('Invalid content format from Claude');
      }

      // Ensure numeric values
      result.price = parseFloat(result.price) || 0;
      result.listPrice = parseFloat(result.listPrice) || 0;

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
    const validCategories = ['Electronics', 'Home', 'Fashion', 'Beauty', 'Sports', 'Other'];
    
    const isValid = (
      typeof content === 'object' &&
      content !== null &&
      typeof content.title === 'string' &&
      content.title.length <= 60 &&
      typeof content.description === 'string' &&
      content.description.length <= 150 &&
      validCategories.includes(content.category) &&
      !isNaN(parseFloat(content.price)) &&
      !isNaN(parseFloat(content.listPrice))
    );

    if (!isValid) {
      console.error('Content validation failed:', {
        hasTitle: typeof content.title === 'string',
        titleLength: content.title?.length,
        hasDescription: typeof content.description === 'string',
        descriptionLength: content.description?.length,
        validCategory: validCategories.includes(content.category),
        validPrice: !isNaN(parseFloat(content.price)),
        validListPrice: !isNaN(parseFloat(content.listPrice))
      });
    }

    return isValid;
  }

  createFallbackContent(dealData) {
    try {
      const price = parseFloat(dealData.current_price?.toString().replace(/[^0-9.]/g, '')) || 0;
      const listPrice = parseFloat(dealData.list_price?.toString().replace(/[^0-9.]/g, '')) || 0;
      const discount = listPrice > 0 ? ((listPrice - price) / listPrice * 100).toFixed(0) : 0;
      
      const title = dealData.title?.slice(0, 40) || 'Great Deal';
      const category = dealData.category || 'Other';

      return {
        title: `SAVE ${discount}% on ${title}`,
        description: `Limited time offer! Save ${discount}% on this ${category.toLowerCase()} item. Was $${listPrice}, now only $${price}!`,
        category: category,
        price: price,
        listPrice: listPrice
      };
    } catch (error) {
      console.error('Error creating fallback content:', error);
      return {
        title: 'Special Deal Alert!',
        description: 'Limited time offer on this amazing product. Check it out before it\'s gone!',
        category: 'Other',
        price: 0,
        listPrice: 0
      };
    }
  }
}

module.exports = AmazonDealBotService; 