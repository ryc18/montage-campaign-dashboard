const express = require('express');
const cors = require('cors');
const campaignRoutes = require('../server/routes/campaigns');

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', campaignRoutes);

module.exports = app;
