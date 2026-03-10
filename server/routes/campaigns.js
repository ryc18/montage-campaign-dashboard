const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Demo campaign data based on Cory's screenshots
// This serves as fallback when Pipedrive Campaigns API is unavailable
// Replace with live API calls when/if Pipedrive exposes campaign endpoints
// ─────────────────────────────────────────────────────────────

// Client definitions
const clients = [
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
                    sender: 'Montage Team',
                    sent: 524,
                    delivered: 498,
                    bounced: 26,
                    unsubscribed: 3,
                    spam: 0,
                    notSent: 12,
                    uniqueOpens: 312,
                    totalOpens: 387,
                    uniqueClicks: 45,
                    totalClicks: 78,
                    replied: 5,
                    openRate: 59.54,
                    clickRate: 8.59,
                    clickThroughRate: 14.42,
                    replyRate: 0.95,
                    sendDate: '2026-03-10',
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
                    sender: 'Montage Team',
                    sent: 498,
                    delivered: 475,
                    bounced: 23,
                    unsubscribed: 5,
                    spam: 0,
                    notSent: 8,
                    uniqueOpens: 289,
                    totalOpens: 354,
                    uniqueClicks: 38,
                    totalClicks: 61,
                    replied: 3,
                    openRate: 58.03,
                    clickRate: 7.63,
                    clickThroughRate: 13.15,
                    replyRate: 0.60,
                    sendDate: '2026-03-12',
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
                    sender: 'Montage Team',
                    sent: 475,
                    delivered: 456,
                    bounced: 19,
                    unsubscribed: 4,
                    spam: 0,
                    notSent: 6,
                    uniqueOpens: 267,
                    totalOpens: 321,
                    uniqueClicks: 42,
                    totalClicks: 67,
                    replied: 7,
                    openRate: 56.21,
                    clickRate: 8.84,
                    clickThroughRate: 15.73,
                    replyRate: 1.47,
                    sendDate: '2026-03-14',
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
                    sender: 'Montage Team',
                    sent: 610,
                    delivered: 587,
                    bounced: 23,
                    unsubscribed: 2,
                    spam: 0,
                    notSent: 14,
                    uniqueOpens: 378,
                    totalOpens: 445,
                    uniqueClicks: 52,
                    totalClicks: 89,
                    replied: 8,
                    openRate: 61.97,
                    clickRate: 8.52,
                    clickThroughRate: 13.76,
                    replyRate: 1.31,
                    sendDate: '2026-03-08',
                    links: [],
                    locations: [
                        { country: 'New Zealand', code: 'NZ', uniqueOpens: 298, percentOfOpens: 78.84 },
                        { country: 'Australia', code: 'AU', uniqueOpens: 56, percentOfOpens: 14.81 },
                        { country: 'United States', code: 'US', uniqueOpens: 24, percentOfOpens: 6.35 },
                    ],
                    performanceOverTime: [
                        { date: '2026-03-08', campaignsSent: 1, uniqueClicks: 22, uniqueOpens: 189 },
                        { date: '2026-03-09', campaignsSent: 0, uniqueClicks: 14, uniqueOpens: 98 },
                        { date: '2026-03-10', campaignsSent: 0, uniqueClicks: 9, uniqueOpens: 52 },
                        { date: '2026-03-11', campaignsSent: 0, uniqueClicks: 4, uniqueOpens: 25 },
                        { date: '2026-03-12', campaignsSent: 0, uniqueClicks: 3, uniqueOpens: 14 },
                    ],
                },
                {
                    id: 'mtg008-e1b',
                    subject: 'Accelerate Month-end reporting. Trusted numbers. Better Decisions.',
                    sender: 'Montage Team',
                    sent: 608,
                    delivered: 584,
                    bounced: 24,
                    unsubscribed: 3,
                    spam: 0,
                    notSent: 11,
                    uniqueOpens: 365,
                    totalOpens: 428,
                    uniqueClicks: 48,
                    totalClicks: 82,
                    replied: 6,
                    openRate: 60.03,
                    clickRate: 7.89,
                    clickThroughRate: 13.15,
                    replyRate: 0.99,
                    sendDate: '2026-03-08',
                    links: [],
                    locations: [
                        { country: 'New Zealand', code: 'NZ', uniqueOpens: 285, percentOfOpens: 78.08 },
                        { country: 'Australia', code: 'AU', uniqueOpens: 55, percentOfOpens: 15.07 },
                        { country: 'United States', code: 'US', uniqueOpens: 25, percentOfOpens: 6.85 },
                    ],
                    performanceOverTime: [
                        { date: '2026-03-08', campaignsSent: 1, uniqueClicks: 20, uniqueOpens: 178 },
                        { date: '2026-03-09', campaignsSent: 0, uniqueClicks: 13, uniqueOpens: 94 },
                        { date: '2026-03-10', campaignsSent: 0, uniqueClicks: 8, uniqueOpens: 48 },
                        { date: '2026-03-11', campaignsSent: 0, uniqueClicks: 4, uniqueOpens: 28 },
                        { date: '2026-03-12', campaignsSent: 0, uniqueClicks: 3, uniqueOpens: 17 },
                    ],
                },
                {
                    id: 'mtg008-e2a',
                    subject: 'Stockouts are costing NZ businesses more than they realise | Montage',
                    sender: 'Montage Team',
                    sent: 585,
                    delivered: 562,
                    bounced: 23,
                    unsubscribed: 4,
                    spam: 1,
                    notSent: 9,
                    uniqueOpens: 341,
                    totalOpens: 402,
                    uniqueClicks: 39,
                    totalClicks: 64,
                    replied: 4,
                    openRate: 58.29,
                    clickRate: 6.67,
                    clickThroughRate: 11.44,
                    replyRate: 0.68,
                    sendDate: '2026-03-10',
                    links: [],
                    locations: [
                        { country: 'New Zealand', code: 'NZ', uniqueOpens: 268, percentOfOpens: 78.59 },
                        { country: 'Australia', code: 'AU', uniqueOpens: 51, percentOfOpens: 14.96 },
                        { country: 'United States', code: 'US', uniqueOpens: 22, percentOfOpens: 6.45 },
                    ],
                    performanceOverTime: [
                        { date: '2026-03-10', campaignsSent: 1, uniqueClicks: 16, uniqueOpens: 165 },
                        { date: '2026-03-11', campaignsSent: 0, uniqueClicks: 11, uniqueOpens: 89 },
                        { date: '2026-03-12', campaignsSent: 0, uniqueClicks: 7, uniqueOpens: 48 },
                        { date: '2026-03-13', campaignsSent: 0, uniqueClicks: 3, uniqueOpens: 25 },
                        { date: '2026-03-14', campaignsSent: 0, uniqueClicks: 2, uniqueOpens: 14 },
                    ],
                },
                {
                    id: 'mtg008-e2b',
                    subject: 'Visibility that prevents missed sales | Montage',
                    sender: 'Montage Team',
                    sent: 582,
                    delivered: 560,
                    bounced: 22,
                    unsubscribed: 3,
                    spam: 0,
                    notSent: 10,
                    uniqueOpens: 335,
                    totalOpens: 394,
                    uniqueClicks: 41,
                    totalClicks: 68,
                    replied: 5,
                    openRate: 57.56,
                    clickRate: 7.04,
                    clickThroughRate: 12.24,
                    replyRate: 0.86,
                    sendDate: '2026-03-10',
                    links: [],
                    locations: [
                        { country: 'New Zealand', code: 'NZ', uniqueOpens: 264, percentOfOpens: 78.81 },
                        { country: 'Australia', code: 'AU', uniqueOpens: 49, percentOfOpens: 14.63 },
                        { country: 'United States', code: 'US', uniqueOpens: 22, percentOfOpens: 6.57 },
                    ],
                    performanceOverTime: [
                        { date: '2026-03-10', campaignsSent: 1, uniqueClicks: 17, uniqueOpens: 160 },
                        { date: '2026-03-11', campaignsSent: 0, uniqueClicks: 10, uniqueOpens: 85 },
                        { date: '2026-03-12', campaignsSent: 0, uniqueClicks: 8, uniqueOpens: 50 },
                        { date: '2026-03-13', campaignsSent: 0, uniqueClicks: 4, uniqueOpens: 26 },
                        { date: '2026-03-14', campaignsSent: 0, uniqueClicks: 2, uniqueOpens: 14 },
                    ],
                },
                {
                    id: 'mtg008-e3a',
                    subject: 'The stock you forgot about is eroding your margin | Montage',
                    sender: 'Montage Team',
                    sent: 560,
                    delivered: 541,
                    bounced: 19,
                    unsubscribed: 2,
                    spam: 0,
                    notSent: 8,
                    uniqueOpens: 328,
                    totalOpens: 387,
                    uniqueClicks: 44,
                    totalClicks: 71,
                    replied: 6,
                    openRate: 58.57,
                    clickRate: 7.86,
                    clickThroughRate: 13.41,
                    replyRate: 1.07,
                    sendDate: '2026-03-12',
                    links: [],
                    locations: [
                        { country: 'New Zealand', code: 'NZ', uniqueOpens: 258, percentOfOpens: 78.66 },
                        { country: 'Australia', code: 'AU', uniqueOpens: 48, percentOfOpens: 14.63 },
                        { country: 'United States', code: 'US', uniqueOpens: 22, percentOfOpens: 6.71 },
                    ],
                    performanceOverTime: [
                        { date: '2026-03-12', campaignsSent: 1, uniqueClicks: 19, uniqueOpens: 158 },
                        { date: '2026-03-13', campaignsSent: 0, uniqueClicks: 12, uniqueOpens: 82 },
                        { date: '2026-03-14', campaignsSent: 0, uniqueClicks: 7, uniqueOpens: 48 },
                        { date: '2026-03-15', campaignsSent: 0, uniqueClicks: 4, uniqueOpens: 26 },
                        { date: '2026-03-16', campaignsSent: 0, uniqueClicks: 2, uniqueOpens: 14 },
                    ],
                },
                {
                    id: 'mtg008-e3b',
                    subject: 'Catching obsolete stock before it hurts | Montage',
                    sender: 'Montage Team',
                    sent: 558,
                    delivered: 538,
                    bounced: 20,
                    unsubscribed: 3,
                    spam: 0,
                    notSent: 7,
                    uniqueOpens: 319,
                    totalOpens: 375,
                    uniqueClicks: 37,
                    totalClicks: 59,
                    replied: 4,
                    openRate: 57.17,
                    clickRate: 6.63,
                    clickThroughRate: 11.60,
                    replyRate: 0.72,
                    sendDate: '2026-03-12',
                    links: [],
                    locations: [
                        { country: 'New Zealand', code: 'NZ', uniqueOpens: 251, percentOfOpens: 78.68 },
                        { country: 'Australia', code: 'AU', uniqueOpens: 46, percentOfOpens: 14.42 },
                        { country: 'United States', code: 'US', uniqueOpens: 22, percentOfOpens: 6.90 },
                    ],
                    performanceOverTime: [
                        { date: '2026-03-12', campaignsSent: 1, uniqueClicks: 15, uniqueOpens: 148 },
                        { date: '2026-03-13', campaignsSent: 0, uniqueClicks: 10, uniqueOpens: 80 },
                        { date: '2026-03-14', campaignsSent: 0, uniqueClicks: 6, uniqueOpens: 45 },
                        { date: '2026-03-15', campaignsSent: 0, uniqueClicks: 4, uniqueOpens: 28 },
                        { date: '2026-03-16', campaignsSent: 0, uniqueClicks: 2, uniqueOpens: 18 },
                    ],
                },
            ],
        },
    ],
};

// GET /api/clients — list available clients
router.get('/clients', (req, res) => {
    res.json({ success: true, data: clients });
});

// GET /api/campaigns — list all campaigns (optionally filtered by ?client=)
router.get('/campaigns', (req, res) => {
    let filtered = campaignData.campaigns;
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
router.get('/campaigns/:id', (req, res) => {
    const campaign = campaignData.campaigns.find((c) => c.id === req.params.id);
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
