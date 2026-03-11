const express = require('express');
const router = express.Router();

// ─────────────────────────────────────────────────────────────
// Live data loader — reads parsed campaign data from Vercel Blob
// Returns null when no data is available (no fallback/demo data)
// ─────────────────────────────────────────────────────────────
let cachedLiveData = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds

async function getLiveData() {
    // Only attempt blob fetch in production (when BLOB_READ_WRITE_TOKEN exists)
    if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

    const now = Date.now();
    if (cachedLiveData && (now - lastFetchTime) < CACHE_TTL) {
        return cachedLiveData;
    }

    try {
        const { list } = require('@vercel/blob');
        const { blobs } = await list({ prefix: 'campaign-data.json' });
        if (blobs.length === 0) return null;

        const response = await fetch(blobs[0].url);
        cachedLiveData = await response.json();
        lastFetchTime = now;
        return cachedLiveData;
    } catch (err) {
        console.error('Failed to load live data from blob:', err.message);
        return null;
    }
}

// GET /api/clients — list available clients
router.get('/clients', async (req, res) => {
    const liveData = await getLiveData();
    const clientList = liveData ? liveData.clients : [];
    res.json({ success: true, data: clientList });
});

// GET /api/campaigns — list all campaigns (optionally filtered by ?client=)
router.get('/campaigns', async (req, res) => {
    const liveData = await getLiveData();
    const allCampaigns = liveData ? liveData.campaigns : [];

    let filtered = allCampaigns;
    if (req.query.client) {
        filtered = filtered.filter((c) => c.client === req.query.client);
    }
    const summary = filtered.map((c) => ({
        id: c.id,
        client: c.client,
        name: c.name,
        status: c.status,
        emailCount: c.emails.length,
        linkedAutomation: c.linkedAutomation,
    }));
    res.json({ success: true, data: summary });
});

// GET /api/campaigns/:id — full campaign detail with email stats
router.get('/campaigns/:id', async (req, res) => {
    const liveData = await getLiveData();
    const allCampaigns = liveData ? liveData.campaigns : [];
    const campaign = allCampaigns.find((c) => c.id === req.params.id);
    if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    // Calculate aggregate engagement for the campaign
    const totals = campaign.emails.reduce(
        (acc, e) => {
            acc.sent += e.sent;
            acc.delivered += e.delivered;
            acc.bounced += e.bounced;
            acc.unsubscribed += e.unsubscribed;
            acc.spam += e.spam;
            acc.notSent += e.notSent;
            acc.uniqueOpens += e.uniqueOpens;
            acc.totalOpens += e.totalOpens;
            acc.uniqueClicks += e.uniqueClicks;
            acc.totalClicks += e.totalClicks;
            acc.replied += e.replied;
            return acc;
        },
        {
            sent: 0, delivered: 0, bounced: 0, unsubscribed: 0, spam: 0, notSent: 0,
            uniqueOpens: 0, totalOpens: 0, uniqueClicks: 0, totalClicks: 0, replied: 0,
        }
    );

    totals.openRate = totals.sent > 0 ? ((totals.uniqueOpens / totals.sent) * 100).toFixed(2) : 0;
    totals.clickRate = totals.sent > 0 ? ((totals.uniqueClicks / totals.sent) * 100).toFixed(2) : 0;
    totals.clickThroughRate = totals.uniqueOpens > 0 ? ((totals.uniqueClicks / totals.uniqueOpens) * 100).toFixed(2) : 0;
    totals.replyRate = totals.uniqueOpens > 0 ? ((totals.replied / totals.uniqueOpens) * 100).toFixed(2) : 0;

    res.json({
        success: true,
        data: {
            ...campaign,
            aggregated: totals,
        },
    });
});

module.exports = router;
