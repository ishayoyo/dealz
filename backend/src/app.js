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

// Serve static files from the 'public' directory
app.use('/images', express.static(path.join(__dirname, '../public/images')));

app.use('/api/v1', routes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;