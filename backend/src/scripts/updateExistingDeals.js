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

    // Add this section to check existing status values
    const statusCounts = await Deal.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log("Status distribution:", statusCounts);

    const result = await Deal.updateMany(
      { $or: [{ status: { $exists: false } }, { status: "" }] },
      { $set: { status: 'approved' } }
    );

    console.log(`Updated ${result.modifiedCount} deals`);

    // Add a check for remaining deals without a status
    const remainingDeals = await Deal.countDocuments({ $or: [{ status: { $exists: false } }, { status: "" }] });
    console.log(`Remaining deals without a status: ${remainingDeals}`);

  } catch (error) {
    console.error('Error updating deals:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateExistingDeals();