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

    // Check existing status values
    const statusCounts = await Deal.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log("Status distribution before update:", statusCounts);

    // Count deals that match the update criteria
    const dealsToUpdate = await Deal.countDocuments({ $or: [{ status: { $exists: false } }, { status: "" }] });
    console.log(`Deals matching update criteria: ${dealsToUpdate}`);

    const result = await Deal.updateMany(
      { $or: [{ status: { $exists: false } }, { status: "" }] },
      { $set: { status: 'approved' } }
    );

    console.log(`UpdateMany result:`, result);

    // Check status distribution after update
    const updatedStatusCounts = await Deal.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log("Status distribution after update:", updatedStatusCounts);

    // Check for remaining deals without a status
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