require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const Deal = require('../models/Deal.Model');

async function updateExistingDeals() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const result = await Deal.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'approved' } }
    );

    console.log(`Updated ${result.modifiedCount} deals`);
  } catch (error) {
    console.error('Error updating deals:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateExistingDeals();