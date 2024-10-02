// scripts/createAdminUser.js
require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const readline = require('readline');
const path = require('path');

// Adjust the path to the User model
const User = require(path.join(__dirname, '..', 'models', 'User.Model'));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createAdminUser() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const username = await promptUser('Enter admin username: ');
    const email = await promptUser('Enter admin email: ');
    const password = await promptUser('Enter admin password: ');

    const adminUser = new User({
      username,
      email,
      password,
      role: 'admin'
    });

    await adminUser.save();

    console.log('Admin user created successfully!');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

createAdminUser();