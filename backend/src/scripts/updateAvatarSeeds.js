require('dotenv').config({ path: '../../.env' });

const mongoose = require('mongoose');
const User = require('../models/User.Model');

console.log('Environment variables:', process.env);

async function updateAvatarSeeds() {
  try {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    // Connect to the database
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to the database');

    // Find all users without an avatarSeed
    const usersToUpdate = await User.find({ avatarSeed: { $exists: false } });

    console.log(`Found ${usersToUpdate.length} users to update`);

    // Update each user with a new avatarSeed
    for (const user of usersToUpdate) {
      user.avatarSeed = Math.random().toString(36).substring(2, 15);
      await user.save();
      console.log(`Updated user: ${user._id}`);
    }

    console.log('Finished updating users');
  } catch (error) {
    console.error('Error updating avatar seeds:', error);
  } finally {
    // Close the database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
  }
}

updateAvatarSeeds();
