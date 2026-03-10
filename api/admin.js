const { put, list, del } = require('@vercel/blob');
const express = require('express');
const app = express();

app.use(express.json({ limit: '5mb' }));

const ADMIN_PIN = process.env.ADMIN_PIN || 'rrm2026';
const BLOB_KEY = 'campaign-data.json';

// Simple PIN check
function checkPin(req, res, next) {
    const pin = req.headers['x-admin-pin'];
    if (pin !== ADMIN_PIN) {
        return res.status(401).json({ success: false, error: 'Invalid PIN' });
    }
    next();
}

// GET /api/admin/data — load campaign data from Vercel Blob
app.get('/admin/data', checkPin, async (req, res) => {
    try {
        const { blobs } = await list({ prefix: BLOB_KEY });
        if (blobs.length === 0) {
            return res.json({ success: true, data: null, source: 'none' });
        }
        const response = await fetch(blobs[0].url);
        const data = await response.json();
        res.json({ success: true, data, source: 'blob' });
    } catch (err) {
        console.error('Failed to load from blob:', err);
        res.json({ success: true, data: null, source: 'error', error: err.message });
    }
});

// POST /api/admin/data — save campaign data to Vercel Blob
app.post('/admin/data', checkPin, async (req, res) => {
    try {
        const data = req.body;
        if (!data || !data.clients || !data.campaigns) {
            return res.status(400).json({ success: false, error: 'Invalid data format. Need { clients, campaigns }' });
        }

        // Delete old blob if exists
        const { blobs } = await list({ prefix: BLOB_KEY });
        for (const blob of blobs) {
            await del(blob.url);
        }

        // Store new data
        const blob = await put(BLOB_KEY, JSON.stringify(data), {
            access: 'public',
            contentType: 'application/json',
        });

        res.json({ success: true, message: 'Data saved', url: blob.url });
    } catch (err) {
        console.error('Failed to save to blob:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = app;
