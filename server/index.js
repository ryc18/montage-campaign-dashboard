const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const campaignRoutes = require('./routes/campaigns');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', campaignRoutes);

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
