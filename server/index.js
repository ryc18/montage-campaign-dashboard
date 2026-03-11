const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const campaignRoutes = require('./routes/campaigns');

let adminRoutes;
try { adminRoutes = require('../api/admin'); } catch (e) { adminRoutes = null; }

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// API routes
app.use('/api', campaignRoutes);
if (adminRoutes) app.use('/api', adminRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Dashboard server running at http://localhost:${PORT}`);
});
