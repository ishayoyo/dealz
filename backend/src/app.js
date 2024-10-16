const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const routes = require('./routes/api/v1');

const app = express();

// Set trust proxy before other middleware
app.set('trust proxy', 1);

app.use(cors({
  origin: ["https://saversonic.com", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
