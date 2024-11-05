const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const routes = require('./routes/api/v1');
const passport = require('passport');

const app = express();

// Add this line before other middleware
app.set('trust proxy', 1);

app.use(cors({
  origin: ["https://saversonic.com", "http://localhost:3000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize passport
app.use(passport.initialize());

// Serve static files from the 'public' directory
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Add this middleware before your routes
app.use((req, res, next) => {
  req.socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  next();
});

// Mount all routes including user routes
app.use('/api/v1', routes);

// Global error handler
app.use((err, req, res, next) => {
  if (err.code === 'ECONNRESET') {
    console.log('Connection reset by peer');
    // Don't crash the server
    return;
  }
  console.error('Error details:', err);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Something went wrong on the server',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;
