const express = require('express');
let blob;
try { blob = require('@vercel/blob'); } catch (e) { blob = null; }

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

// GET /admin/data — load campaign data
app.get('/admin/data', checkPin, async (req, res) => {
    try {
        // Try Vercel Blob first
        if (blob && process.env.BLOB_READ_WRITE_TOKEN) {
            const { blobs } = await blob.list({ prefix: BLOB_KEY });
            if (blobs.length > 0) {
                const response = await fetch(blobs[0].url);
                const data = await response.json();
                return res.json({ success: true, data, source: 'blob' });
            }
        }
        // No blob data — return null so frontend loads from campaigns API
        res.json({ success: true, data: null, source: 'none' });
    } catch (err) {
        console.error('Failed to load from blob:', err.message);
        res.json({ success: true, data: null, source: 'fallback', error: err.message });
    }
});

// POST /admin/data — save campaign data
app.post('/admin/data', checkPin, async (req, res) => {
    try {
        const data = req.body;
        if (!data || !data.clients || !data.campaigns) {
            return res.status(400).json({ success: false, error: 'Invalid data format. Need { clients, campaigns }' });
        }

        // Try Vercel Blob
        if (blob && process.env.BLOB_READ_WRITE_TOKEN) {
            const { blobs } = await blob.list({ prefix: BLOB_KEY });
            for (const b of blobs) {
                await blob.del(b.url);
            }
            const result = await blob.put(BLOB_KEY, JSON.stringify(data), {
                access: 'public',
                contentType: 'application/json',
            });
            return res.json({ success: true, message: 'Data saved to blob', url: result.url });
        }

        // No blob available — data won't persist but CSV import still works in-session
        res.json({ success: true, message: 'Data accepted (no persistent storage configured — add BLOB_READ_WRITE_TOKEN to enable)', warning: 'no-blob' });
    } catch (err) {
        console.error('Failed to save:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = app;
