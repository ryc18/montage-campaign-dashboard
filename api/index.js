const express = require('express');
const cors = require('cors');
const campaignRoutes = require('../server/routes/campaigns');
const adminRoutes = require('./admin');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Admin routes
app.use('/api', adminRoutes);

// Campaign API routes
app.use('/api', campaignRoutes);

module.exports = app;
