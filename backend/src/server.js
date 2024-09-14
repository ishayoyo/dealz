const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');

const PORT = config.port || 5000;

mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => console.error('Could not connect to MongoDB', err));