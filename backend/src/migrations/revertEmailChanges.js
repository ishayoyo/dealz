const mongoose = require('mongoose');
const User = require('../models/User.Model');
require('dotenv').config();

const revertEmails = async () => {
  try {
    console.log('Starting email reversion migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to revert`);

    let updated = 0;
    let errors = 0;
    let skipped = 0;

    // Update each user
    for (const user of users) {
      try {
        // Store original state for logging
        const originalEmail = user.email;
        const hadNormalizedEmail = !!user.normalizedEmail;

        // Remove normalizedEmail field
        if (user.normalizedEmail) {
          user.normalizedEmail = undefined;
          await User.updateOne(
            { _id: user._id },
            { 
              $unset: { normalizedEmail: "" }
            }
          );
          updated++;
          console.log(`Updated user: ${originalEmail} (removed normalizedEmail)`);
        } else {
          skipped++;
          console.log(`Skipped user: ${originalEmail} (no normalizedEmail field)`);
        }
      } catch (error) {
        errors++;
        console.error(`Error updating user ${user.email}:`, error.message);
      }
    }

    // Remove the normalizedEmail index if it exists
    try {
      await User.collection.dropIndex('normalizedEmail_1');
      console.log('Dropped normalizedEmail index');
    } catch (error) {
      console.log('No normalizedEmail index to drop or error dropping index:', error.message);
    }

    console.log('\nMigration completed:');
    console.log(`- Total users: ${users.length}`);
    console.log(`- Updated: ${updated}`);
    console.log(`- Skipped: ${skipped}`);
    console.log(`- Errors: ${errors}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Add safety prompt before running
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('This will revert all email changes. Are you sure? (yes/no) ', async (answer) => {
  if (answer.toLowerCase() === 'yes') {
    await revertEmails();
    console.log('Reversion completed');
  } else {
    console.log('Operation cancelled');
  }
  readline.close();
  process.exit(0);
}); 