require('dotenv').config();

module.exports = {
  port: process.env.PORT,
  mongoUri: process.env.MONGO_URI,
  // Add other configuration variables as needed
};