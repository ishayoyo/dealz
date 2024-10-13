const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

// Import all models
require('../models/User.Model');
const Deal = require('../models/Deal.Model');
const Comment = require('../models/Comment.Model');

async function connectDB() {
  try {
    const dbUrl = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!dbUrl) {
      throw new Error('Database URL is not defined in the environment variables');
    }
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
    });
    console.log('Connected to database');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

function analyzeStructure(obj, path = '') {
  const report = [];
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      report.push(`${currentPath}: Object`);
      report.push(...analyzeStructure(value, currentPath));
    } else if (Array.isArray(value)) {
      report.push(`${currentPath}: Array[${value.length}]`);
      if (value.length > 0) {
        report.push(...analyzeStructure(value[0], `${currentPath}[0]`));
      }
    } else {
      report.push(`${currentPath}: ${typeof value}`);
    }
  }
  return report;
}

async function checkDealStructure(dealId) {
  try {
    const deal = await Deal.findById(dealId)
      .populate('user', 'username profilePicture')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'username profilePicture' }
      });

    if (!deal) {
      console.log('No deal found with that ID');
      return;
    }

    console.log('Deal Structure:');
    console.log(analyzeStructure(deal.toObject()).join('\n'));

    if (deal.comments && deal.comments.length > 0) {
      console.log('\nComment Structure:');
      console.log(analyzeStructure(deal.comments[0].toObject()).join('\n'));
    } else {
      console.log('\nNo comments found in the deal');
    }
  } catch (error) {
    console.error('Error checking deal structure:', error);
  }
}

async function run() {
  await connectDB();
  
  // Replace with an actual deal ID from your database
  const dealId = '67095b268d8a039fcd8a9888';
  
  await checkDealStructure(dealId);
  
  mongoose.connection.close();
}

run();
