const mongoose = require('mongoose');
const User = require('../models/User.Model');
require('dotenv').config();

const findDuplicateNormalizedEmails = async () => {
  try {
    console.log('Starting email verification...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all Gmail users
    const gmailUsers = await User.find({ 
      email: { $regex: '@gmail.com$' } 
    });

    console.log(`Found ${gmailUsers.length} Gmail users`);

    // Group users by normalized email
    const emailGroups = {};
    gmailUsers.forEach(user => {
      const normalizedEmail = user.email.toLowerCase()
        .split('@')[0].replace(/\./g, '') + '@gmail.com';
      
      if (!emailGroups[normalizedEmail]) {
        emailGroups[normalizedEmail] = [];
      }
      emailGroups[normalizedEmail].push({
        id: user._id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt
      });
    });

    // Find duplicates
    const duplicates = Object.entries(emailGroups)
      .filter(([_, users]) => users.length > 1);

    if (duplicates.length > 0) {
      console.log('\nFound duplicate normalized emails:');
      duplicates.forEach(([normalizedEmail, users]) => {
        console.log(`\nNormalized email: ${normalizedEmail}`);
        users.forEach(user => {
          console.log(`- ID: ${user.id}`);
          console.log(`  Email: ${user.email}`);
          console.log(`  Username: ${user.username}`);
          console.log(`  Created: ${user.createdAt}`);
        });
      });

      // Provide instructions for manual review
      console.log('\nPlease review these duplicates and decide which accounts to keep.');
      console.log('You can use the following command to merge or delete accounts:');
      console.log('node src/migrations/mergeAccounts.js <sourceId> <targetId>');
    } else {
      console.log('No duplicate normalized emails found.');
    }

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run verification
findDuplicateNormalizedEmails(); 