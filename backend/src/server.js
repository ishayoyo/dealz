require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const app = require('./app');

const PORT = process.env.PORT || 5000;

console.log('MONGODB_URI:', process.env.MONGODB_URI);

// Serve static files
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => console.error('Could not connect to MongoDB', err));