const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Live data loader — reads from Vercel Blob if available
// Falls back to hardcoded demo data below
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

// ─────────────────────────────────────────────────────────────
// Fallback demo data (used when no live data exists in blob)
// ─────────────────────────────────────────────────────────────

// Client definitions (fallback)
const defaultClients = [
    { id: 'montage', name: 'Montage', color: '#6C63FF' },
    { id: 'institugen', name: 'Institugen', color: '#00C9A7' },
];

const campaignData = {
    campaigns: [
        {
            id: 'ist021',
            client: 'institugen',
            name: 'IST021: Vet Clinics > Education',
            status: 'ACTIVE',
            linkedAutomation: 'IST021: Vet Clinics > Education (E1&2) | Active',
            emails: [
                {
                    id: 'ist021-e1',
                    subject: 'Where guidelines become individualised care | NeuterReady',
                    sender: 'Matthew Bull | NeuterReady (matthew.bull@insitugen.com)',
                    sent: 662,
                    delivered: 554,
                    bounced: 108,
                    unsubscribed: 7,
                    spam: 0,
                    notSent: 51,
                    uniqueOpens: 407,
                    totalOpens: 440,
                    uniqueClicks: 11,
                    totalClicks: 29,
                    replied: 0,
                    openRate: 61.48,
                    clickRate: 1.66,
                    clickThroughRate: 2.70,
                    replyRate: 0,
                    sendDate: '2026-03-05',
                    links: [
                        {
                            url: 'https://neuterready.vet/?utm_source=email&utm_medium=edm&utm_campaign=educational_campaign',
                            uniqueClicks: 11,
                            percentOfClicks: 100.0,
                        },
                    ],
                    locations: [
                        { country: 'Australia', code: 'AU', uniqueOpens: 302, percentOfOpens: 74.20 },
                        { country: 'New Zealand', code: 'NZ', uniqueOpens: 58, percentOfOpens: 14.25 },
                        { country: 'Singapore', code: 'SG', uniqueOpens: 33, percentOfOpens: 8.11 },
                        { country: 'United States', code: 'US', uniqueOpens: 14, percentOfOpens: 3.44 },
                    ],
                    performanceOverTime: [
                        { date: '2026-03-05', campaignsSent: 1, uniqueClicks: 4, uniqueOpens: 3 },
                        { date: '2026-03-06', campaignsSent: 0, uniqueClicks: 2, uniqueOpens: 2 },
                        { date: '2026-03-07', campaignsSent: 0, uniqueClicks: 1, uniqueOpens: 1 },
                        { date: '2026-03-08', campaignsSent: 0, uniqueClicks: 1, uniqueOpens: 1 },
                        { date: '2026-03-09', campaignsSent: 0, uniqueClicks: 0, uniqueOpens: 0 },
                        { date: '2026-03-10', campaignsSent: 0, uniqueClicks: 1, uniqueOpens: 1 },
                        { date: '2026-03-11', campaignsSent: 0, uniqueClicks: 0, uniqueOpens: 0 },
                    ],
                },
            ],
        },
        {
            id: 'mtg005',
            client: 'montage',
            name: 'MTG005 - Campaign Emails',
            status: 'ACTIVE',
            linkedAutomation: 'MTG005: Montage Campaign Series',
            emails: [
                {
                    id: 'mtg005-e1',
                    subject: 'When reports multiply, insights vanish | Montage',
                    sender: 'Duncan Turner | Montage',
                    sent: 474,
                    delivered: 451,
                    bounced: 23,
                    unsubscribed: 3,
                    spam: 0,
                    notSent: 11,
                    uniqueOpens: 295,
                    totalOpens: 365,
                    uniqueClicks: 41,
                    totalClicks: 71,
                    replied: 5,
                    openRate: 62.24,
                    clickRate: 8.65,
                    clickThroughRate: 13.90,
                    replyRate: 1.05,
                    sendDate: '2026-01-13',
                    links: [],
                    locations: [
                        { country: 'New Zealand', code: 'NZ', uniqueOpens: 245, percentOfOpens: 78.53 },
                        { country: 'Australia', code: 'AU', uniqueOpens: 48, percentOfOpens: 15.38 },
                        { country: 'United States', code: 'US', uniqueOpens: 19, percentOfOpens: 6.09 },
                    ],
                    performanceOverTime: [
                        { date: '2026-03-10', campaignsSent: 1, uniqueClicks: 18, uniqueOpens: 156 },
                        { date: '2026-03-11', campaignsSent: 0, uniqueClicks: 12, uniqueOpens: 89 },
                        { date: '2026-03-12', campaignsSent: 0, uniqueClicks: 8, uniqueOpens: 42 },
                        { date: '2026-03-13', campaignsSent: 0, uniqueClicks: 5, uniqueOpens: 18 },
                        { date: '2026-03-14', campaignsSent: 0, uniqueClicks: 2, uniqueOpens: 7 },
                    ],
                },
                {
                    id: 'mtg005-e2',
                    subject: 'How NZ businesses are modernising data and analytics with an eye on ROI | Montage',
                    sender: 'Duncan Turner | Montage',
                    sent: 372,
                    delivered: 355,
                    bounced: 17,
                    unsubscribed: 4,
                    spam: 0,
                    notSent: 6,
                    uniqueOpens: 257,
                    totalOpens: 318,
                    uniqueClicks: 28,
                    totalClicks: 46,
                    replied: 3,
                    openRate: 69.09,
                    clickRate: 7.53,
                    clickThroughRate: 10.89,
                    replyRate: 0.81,
                    sendDate: '2026-01-20',
                    links: [],
                    locations: [
                        { country: 'New Zealand', code: 'NZ', uniqueOpens: 231, percentOfOpens: 79.93 },
                        { country: 'Australia', code: 'AU', uniqueOpens: 41, percentOfOpens: 14.19 },
                        { country: 'United States', code: 'US', uniqueOpens: 17, percentOfOpens: 5.88 },
                    ],
                    performanceOverTime: [
                        { date: '2026-03-12', campaignsSent: 1, uniqueClicks: 15, uniqueOpens: 142 },
                        { date: '2026-03-13', campaignsSent: 0, uniqueClicks: 10, uniqueOpens: 78 },
                        { date: '2026-03-14', campaignsSent: 0, uniqueClicks: 8, uniqueOpens: 45 },
                        { date: '2026-03-15', campaignsSent: 0, uniqueClicks: 3, uniqueOpens: 16 },
                        { date: '2026-03-16', campaignsSent: 0, uniqueClicks: 2, uniqueOpens: 8 },
                    ],
                },
                {
                    id: 'mtg005-e3',
                    subject: 'Turn your data into a decision-making advantage | Montage',
                    sender: 'Duncan Turner | Montage',
                    sent: 318,
                    delivered: 305,
                    bounced: 13,
                    unsubscribed: 3,
                    spam: 0,
                    notSent: 4,
                    uniqueOpens: 184,
                    totalOpens: 228,
                    uniqueClicks: 28,
                    totalClicks: 45,
                    replied: 5,
                    openRate: 57.86,
                    clickRate: 8.81,
                    clickThroughRate: 15.22,
                    replyRate: 1.57,
                    sendDate: '2026-01-27',
                    links: [],
                    locations: [
                        { country: 'New Zealand', code: 'NZ', uniqueOpens: 210, percentOfOpens: 78.65 },
                        { country: 'Australia', code: 'AU', uniqueOpens: 39, percentOfOpens: 14.61 },
                        { country: 'United States', code: 'US', uniqueOpens: 18, percentOfOpens: 6.74 },
                    ],
                    performanceOverTime: [
                        { date: '2026-03-14', campaignsSent: 1, uniqueClicks: 20, uniqueOpens: 130 },
                        { date: '2026-03-15', campaignsSent: 0, uniqueClicks: 11, uniqueOpens: 72 },
                        { date: '2026-03-16', campaignsSent: 0, uniqueClicks: 6, uniqueOpens: 38 },
                        { date: '2026-03-17', campaignsSent: 0, uniqueClicks: 3, uniqueOpens: 19 },
                        { date: '2026-03-18', campaignsSent: 0, uniqueClicks: 2, uniqueOpens: 8 },
                    ],
                },
            ],
        },
        {
            id: 'mtg008',
            client: 'montage',
            name: 'MTG008 - Campaign Emails',
            status: 'ACTIVE',
            linkedAutomation: 'MTG008: Montage Campaign Series',
            emails: [
                {
                    id: 'mtg008-e1a',
                    subject: 'Month-end reporting shouldn\'t take this long',
                    sender: 'Paul Proctor | Montage',
                    sent: 120,
                    delivered: 115,
                    bounced: 5,
                    unsubscribed: 1,
                    spam: 0,
                    notSent: 2,
                    uniqueOpens: 79,
                    totalOpens: 98,
                    uniqueClicks: 7,
                    totalClicks: 11,
                    replied: 3,
                    openRate: 65.83,
                    clickRate: 5.83,
                    clickThroughRate: 12.96,
                    replyRate: 2.50,
                    sendDate: '2026-03-04',
                    links: [],
                    locations: [
                        { country: 'New Zealand', code: 'NZ', uniqueOpens: 43, percentOfOpens: 79.63 },
                        { country: 'Australia', code: 'AU', uniqueOpens: 8, percentOfOpens: 14.81 },
                        { country: 'United States', code: 'US', uniqueOpens: 3, percentOfOpens: 5.56 },
                    ],
                    performanceOverTime: [
                        { date: '2026-03-04', campaignsSent: 20, uniqueClicks: 3, uniqueOpens: 18 },
                        { date: '2026-03-05', campaignsSent: 20, uniqueClicks: 2, uniqueOpens: 12 },
                        { date: '2026-03-06', campaignsSent: 20, uniqueClicks: 1, uniqueOpens: 9 },
                        { date: '2026-03-07', campaignsSent: 20, uniqueClicks: 1, uniqueOpens: 7 },
                        { date: '2026-03-10', campaignsSent: 20, uniqueClicks: 0, uniqueOpens: 5 },
                        { date: '2026-03-11', campaignsSent: 20, uniqueClicks: 0, uniqueOpens: 3 },
                    ],
                },
                {
                    id: 'mtg008-e1b',
                    subject: 'Accelerate Month-end reporting. Trusted numbers. Better Decisions.',
                    sender: 'Paul Proctor | Montage',
                    sent: 121,
                    delivered: 116,
                    bounced: 5,
                    unsubscribed: 1,
                    spam: 0,
                    notSent: 2,
                    uniqueOpens: 88,
                    totalOpens: 109,
                    uniqueClicks: 6,
                    totalClicks: 10,
                    replied: 2,
                    openRate: 72.73,
                    clickRate: 4.96,
                    clickThroughRate: 11.54,
                    replyRate: 1.65,
                    sendDate: '2026-03-04',
                    links: [],
                    locations: [
                        { country: 'New Zealand', code: 'NZ', uniqueOpens: 41, percentOfOpens: 78.85 },
                        { country: 'Australia', code: 'AU', uniqueOpens: 8, percentOfOpens: 15.38 },
                        { country: 'United States', code: 'US', uniqueOpens: 3, percentOfOpens: 5.77 },
                    ],
                    performanceOverTime: [
                        { date: '2026-03-04', campaignsSent: 20, uniqueClicks: 2, uniqueOpens: 16 },
                        { date: '2026-03-05', campaignsSent: 20, uniqueClicks: 2, uniqueOpens: 12 },
                        { date: '2026-03-06', campaignsSent: 20, uniqueClicks: 1, uniqueOpens: 9 },
                        { date: '2026-03-07', campaignsSent: 21, uniqueClicks: 1, uniqueOpens: 7 },
                        { date: '2026-03-10', campaignsSent: 20, uniqueClicks: 0, uniqueOpens: 5 },
                        { date: '2026-03-11', campaignsSent: 20, uniqueClicks: 0, uniqueOpens: 3 },
                    ],
                },
                {
                    id: 'mtg008-e2a',
                    subject: 'When different teams report different numbers',
                    sender: 'Paul Proctor | Montage',
                    sent: 55,
                    delivered: 53,
                    bounced: 2,
                    unsubscribed: 0,
                    spam: 0,
                    notSent: 1,
                    uniqueOpens: 42,
                    totalOpens: 52,
                    uniqueClicks: 3,
                    totalClicks: 5,
                    replied: 1,
                    openRate: 76.36,
                    clickRate: 5.45,
                    clickThroughRate: 12.00,
                    replyRate: 1.82,
                    sendDate: '2026-03-06',
                    links: [],
                    locations: [
                        { country: 'New Zealand', code: 'NZ', uniqueOpens: 20, percentOfOpens: 80.00 },
                        { country: 'Australia', code: 'AU', uniqueOpens: 4, percentOfOpens: 16.00 },
                        { country: 'United States', code: 'US', uniqueOpens: 1, percentOfOpens: 4.00 },
                    ],
                    performanceOverTime: [
                        { date: '2026-03-06', campaignsSent: 20, uniqueClicks: 1, uniqueOpens: 10 },
                        { date: '2026-03-07', campaignsSent: 20, uniqueClicks: 1, uniqueOpens: 8 },
                        { date: '2026-03-10', campaignsSent: 15, uniqueClicks: 1, uniqueOpens: 5 },
                        { date: '2026-03-11', campaignsSent: 0, uniqueClicks: 0, uniqueOpens: 2 },
                    ],
                },
                {
                    id: 'mtg008-e2b',
                    subject: 'One version of the truth across Finance',
                    sender: 'Paul Proctor | Montage',
                    sent: 56,
                    delivered: 54,
                    bounced: 2,
                    unsubscribed: 0,
                    spam: 0,
                    notSent: 1,
                    uniqueOpens: 42,
                    totalOpens: 52,
                    uniqueClicks: 3,
                    totalClicks: 5,
                    replied: 1,
                    openRate: 75.00,
                    clickRate: 5.36,
                    clickThroughRate: 12.50,
                    replyRate: 1.79,
                    sendDate: '2026-03-06',
                    links: [],
                    locations: [
                        { country: 'New Zealand', code: 'NZ', uniqueOpens: 19, percentOfOpens: 79.17 },
                        { country: 'Australia', code: 'AU', uniqueOpens: 4, percentOfOpens: 16.67 },
                        { country: 'United States', code: 'US', uniqueOpens: 1, percentOfOpens: 4.17 },
                    ],
                    performanceOverTime: [
                        { date: '2026-03-06', campaignsSent: 20, uniqueClicks: 1, uniqueOpens: 9 },
                        { date: '2026-03-07', campaignsSent: 20, uniqueClicks: 1, uniqueOpens: 8 },
                        { date: '2026-03-10', campaignsSent: 16, uniqueClicks: 1, uniqueOpens: 5 },
                        { date: '2026-03-11', campaignsSent: 0, uniqueClicks: 0, uniqueOpens: 2 },
                    ],
                },
                {
                    id: 'mtg008-e3a',
                    subject: 'A quick thought on financial consolidation',
                    sender: 'Paul Proctor | Montage',
                    sent: 1,
                    delivered: 1,
                    bounced: 0,
                    unsubscribed: 0,
                    spam: 0,
                    notSent: 0,
                    uniqueOpens: 1,
                    totalOpens: 1,
                    uniqueClicks: 0,
                    totalClicks: 0,
                    replied: 0,
                    openRate: 100.00,
                    clickRate: 0,
                    clickThroughRate: 0,
                    replyRate: 0,
                    sendDate: '2026-03-10',
                    links: [],
                    locations: [
                        { country: 'New Zealand', code: 'NZ', uniqueOpens: 1, percentOfOpens: 100.00 },
                    ],
                    performanceOverTime: [
                        { date: '2026-03-10', campaignsSent: 1, uniqueClicks: 0, uniqueOpens: 1 },
                    ],
                },
                {
                    id: 'mtg008-e3b',
                    subject: 'Simplifying group reporting',
                    sender: 'Paul Proctor | Montage',
                    sent: 0,
                    delivered: 0,
                    bounced: 0,
                    unsubscribed: 0,
                    spam: 0,
                    notSent: 0,
                    uniqueOpens: 0,
                    totalOpens: 0,
                    uniqueClicks: 0,
                    totalClicks: 0,
                    replied: 0,
                    openRate: 0,
                    clickRate: 0,
                    clickThroughRate: 0,
                    replyRate: 0,
                    sendDate: '2026-03-11',
                    links: [],
                    locations: [],
                    performanceOverTime: [],
                },
            ],
        },
    ],
};

// GET /api/clients — list available clients
router.get('/clients', async (req, res) => {
    const liveData = await getLiveData();
    const clientList = liveData ? liveData.clients : defaultClients;
    res.json({ success: true, data: clientList });
});

// GET /api/campaigns — list all campaigns (optionally filtered by ?client=)
router.get('/campaigns', async (req, res) => {
    const liveData = await getLiveData();
    const allCampaigns = liveData ? liveData.campaigns : campaignData.campaigns;

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
    const allCampaigns = liveData ? liveData.campaigns : campaignData.campaigns;
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

// POST /api/campaigns/import — import JSON data (Option B)
router.post('/campaigns/import', (req, res) => {
    try {
        const importedData = req.body;
        if (importedData && importedData.campaigns) {
            campaignData.campaigns = importedData.campaigns;
            res.json({ success: true, message: `Imported ${importedData.campaigns.length} campaigns` });
        } else {
            res.status(400).json({ success: false, error: 'Invalid data format' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
