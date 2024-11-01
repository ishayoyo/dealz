const mongoose = require('mongoose');
const User = require('../models/User.Model');
require('dotenv').config();

const mergeAccounts = async (sourceId, targetId) => {
  try {
    console.log('Starting account merge...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const sourceUser = await User.findById(sourceId);
    const targetUser = await User.findById(targetId);

    if (!sourceUser || !targetUser) {
      throw new Error('One or both users not found');
    }

    console.log(`Merging user ${sourceUser.email} into ${targetUser.email}`);

    // Merge relevant data (customize based on your needs)
    targetUser.followedDeals = [...new Set([...targetUser.followedDeals, ...sourceUser.followedDeals])];
    targetUser.savedDeals = [...new Set([...targetUser.savedDeals, ...sourceUser.savedDeals])];
    targetUser.followers = [...new Set([...targetUser.followers, ...sourceUser.followers])];
    targetUser.following = [...new Set([...targetUser.following, ...sourceUser.following])];

    // Save the target user
    await targetUser.save();

    // Delete the source user
    await User.findByIdAndDelete(sourceId);

    console.log('Merge completed successfully');

  } catch (error) {
    console.error('Merge failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Get command line arguments
const [,, sourceId, targetId] = process.argv;

if (!sourceId || !targetId) {
  console.log('Usage: node mergeAccounts.js <sourceId> <targetId>');
  process.exit(1);
}

mergeAccounts(sourceId, targetId); 