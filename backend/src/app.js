const express = require('express');
const dealRoutes = require('./routes/api/v1/Deal.Route');

const app = express();

app.use(express.json());
app.use('/api/v1/deals', dealRoutes);

// ... other middleware and error handling

module.exports = app;
