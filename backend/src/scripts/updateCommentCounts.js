const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '..', '..', '.env');
console.log('Loading .env file from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('.env file loaded successfully');
}

console.log('MONGODB_URI:', process.env.MONGODB_URI);

const mongoose = require('mongoose');

// Use __dirname to get the absolute path
const modelsPath = path.join(__dirname, '..', 'models');

// Log the path to help debug
console.log('Models path:', modelsPath);

const Deal = require(path.join(modelsPath, 'Deal.Model'));
const Comment = require(path.join(modelsPath, 'Comment.Model'));

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not defined in the environment variables');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to database'))
.catch(err => console.error('Database connection error:', err));

async function updateCommentCounts() {
  try {
    const deals = await Deal.find();
    console.log(`Found ${deals.length} deals`);
    for (const deal of deals) {
      const commentCount = await Comment.countDocuments({ deal: deal._id, status: 'active' });
      await Deal.findByIdAndUpdate(deal._id, { commentCount });
      console.log(`Updated deal ${deal._id} with comment count: ${commentCount}`);
    }
    console.log('Finished updating comment counts');
  } catch (error) {
    console.error('Error updating comment counts:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

updateCommentCounts();