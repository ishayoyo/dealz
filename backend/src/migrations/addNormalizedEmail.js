const mongoose = require('mongoose');
const User = require('../models/User.Model');
require('dotenv').config();

const normalizeEmail = (email) => {
  if (!email) return email;
  
  email = email.toLowerCase().trim();
  
  // Handle Gmail addresses
  if (email.endsWith('@gmail.com')) {
    const [localPart, domain] = email.split('@');
    // Remove dots and everything after + in the local part
    const normalizedLocal = localPart
      .replace(/\./g, '')  // Remove all dots
      .split('+')[0];     // Remove everything after +
    return `${normalizedLocal}@${domain}`;
  }
  
  return email;
};

const migrateUsers = async () => {
  try {
    console.log('Starting email normalization migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // First, ensure the index exists
    await User.collection.createIndex(
      { normalizedEmail: 1 }, 
      { unique: true, sparse: true }
    );
    console.log('Created normalizedEmail index');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);

    let updated = 0;
    let errors = 0;

    // Update each user using updateOne to ensure the field is added
    for (const user of users) {
      try {
        const normalizedEmail = normalizeEmail(user.email);
        
        await User.updateOne(
          { _id: user._id },
          { 
            $set: { 
              normalizedEmail: normalizedEmail
            }
          }
        );
        
        updated++;
        console.log(`Updated user: ${user.email} -> ${normalizedEmail}`);
      } catch (error) {
        errors++;
        console.error(`Error updating user ${user.email}:`, error.message);
      }
    }

    // Verify the updates
    const updatedUsers = await User.find({ normalizedEmail: { $exists: true } });
    console.log(`\nVerification: ${updatedUsers.length} users now have normalizedEmail`);

    console.log('\nMigration completed:');
    console.log(`- Total users: ${users.length}`);
    console.log(`- Updated: ${updated}`);
    console.log(`- Errors: ${errors}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Add safety prompt
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('This will add normalizedEmail to all users. Continue? (yes/no) ', async (answer) => {
  if (answer.toLowerCase() === 'yes') {
    await migrateUsers();
    console.log('Migration completed');
  } else {
    console.log('Operation cancelled');
  }
  readline.close();
  process.exit(0);
}); 