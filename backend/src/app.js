const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes/api/v1');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000', // or whatever port your frontend is running on
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use('/images', express.static(path.join(__dirname, '../public/images')));

app.use('/api/v1', routes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error details:', err);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Something went wrong on the server',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;