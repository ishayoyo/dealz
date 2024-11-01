require('dotenv').config();
const mongoose = require('mongoose');
const AmazonDealBotService = require('../services/AmazonDealBotService');

async function testAmazonBot() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Initialize the bot
    console.log('\nInitializing Amazon Deal Bot...');
    const dealBot = new AmazonDealBotService();

    // Test API connection and fetch deals
    console.log('\n1. Testing API Connection...');
    const deals = await dealBot.fetchDeals();
    
    if (!deals || deals.length === 0) {
      throw new Error('No deals returned from API');
    }

    console.log(`✓ API Connection successful! Found ${deals.length} deals`);
    console.log('\nTest completed successfully!');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the test
console.log('Starting Amazon Deal Bot Test...');
console.log('================================');
console.log('Time:', new Date().toISOString());
console.log('Environment:', process.env.NODE_ENV);

testAmazonBot()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nTest failed with error:', error);
    process.exit(1);
  }); 