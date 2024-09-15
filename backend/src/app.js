const express = require('express');
const cors = require('cors');
const routes = require('./routes/api/v1');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/v1', routes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;