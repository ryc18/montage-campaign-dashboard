const express = require('express');
const cors = require('cors');
const campaignRoutes = require('../server/routes/campaigns');
const adminRoutes = require('./admin');
const syncRoutes = require('./sync');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Admin routes
app.use('/api', adminRoutes);

// Pipedrive sync routes
app.use('/api', syncRoutes);

// Campaign API routes
app.use('/api', campaignRoutes);

module.exports = app;
