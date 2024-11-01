const mongoose = require('mongoose');
const User = require('../models/User.Model');
require('dotenv').config();

const verifyEmails = async () => {
  try {
    console.log('Starting email verification...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all users
    const allUsers = await User.find({});
    const usersWithNormalizedEmail = await User.find({ normalizedEmail: { $exists: true } });
    
    console.log('\nVerification Results:');
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Users with normalizedEmail: ${usersWithNormalizedEmail.length}`);
    
    console.log('\nDetailed user email status:');
    for (const user of allUsers) {
      console.log(`User ID: ${user._id}`);
      console.log(`Email: ${user.email}`);
      console.log(`NormalizedEmail: ${user.normalizedEmail || 'NOT SET'}`);
      console.log('---');
    }

    // Check for any Gmail addresses that might need fixing
    const gmailUsers = allUsers.filter(user => user.email.includes('@gmail.com'));
    console.log('\nGmail Users Check:');
    for (const user of gmailUsers) {
      const currentNormalized = user.normalizedEmail;
      const shouldBeNormalized = user.email.toLowerCase()
        .split('@')[0].replace(/\./g, '') + '@gmail.com';
      
      console.log(`\nEmail: ${user.email}`);
      console.log(`Current normalized: ${currentNormalized}`);
      console.log(`Should be: ${shouldBeNormalized}`);
      if (currentNormalized !== shouldBeNormalized) {
        console.log('*** Needs fixing ***');
      }
    }

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run verification
verifyEmails(); 