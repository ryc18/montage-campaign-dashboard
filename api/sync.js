const express = require('express');
let blob;
try { blob = require('@vercel/blob'); } catch (e) { blob = null; }

const app = express();
app.use(express.json());

const ADMIN_PIN = process.env.ADMIN_PIN || 'rrm2026';
const BLOB_KEY = 'campaign-data.json';
const SYNC_STATUS_KEY = 'sync-status.json';
const PIPEDRIVE_BASE = 'https://api.pipedrive.com/v1';

// ── Auth ──────────────────────────────────────────────────
function checkAuth(req, res, next) {
    // Allow Vercel Cron (uses CRON_SECRET header)
    const cronSecret = req.headers['authorization'];
    if (cronSecret === `Bearer ${process.env.CRON_SECRET}`) return next();
    // Allow PIN auth
    const pin = req.headers['x-admin-pin'];
    if (pin === ADMIN_PIN) return next();
    return res.status(401).json({ success: false, error: 'Unauthorized' });
}

// ── Pipedrive API helpers ─────────────────────────────────
async function pipedriveFetch(endpoint, params = {}) {
    const token = process.env.PIPEDRIVE_API_TOKEN;
    if (!token) throw new Error('PIPEDRIVE_API_TOKEN not configured');
    const url = new URL(`${PIPEDRIVE_BASE}${endpoint}`);
    url.searchParams.set('api_token', token);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Pipedrive API error: ${res.status}`);
    return res.json();
}

async function fetchAllSentThreads() {
    const threads = [];
    let start = 0;
    const limit = 100;
    const maxPages = 20;
    for (let page = 0; page < maxPages; page++) {
        const result = await pipedriveFetch('/mailbox/mailThreads', { folder: 'sent', start, limit });
        if (!result.success || !result.data || result.data.length === 0) break;
        threads.push(...result.data);
        if (!result.additional_data?.pagination?.more_items_in_collection) break;
        start = result.additional_data.pagination.next_start;
    }
    return threads;
}

async function fetchThreadMessages(threadId) {
    const result = await pipedriveFetch(`/mailbox/mailThreads/${threadId}/mailMessages`);
    return result.success ? result.data || [] : [];
}

async function fetchAllPersons() {
    const persons = [];
    let start = 0;
    const limit = 500;
    const maxPages = 10; // up to 5000 contacts
    for (let page = 0; page < maxPages; page++) {
        const result = await pipedriveFetch('/persons', { start, limit });
        if (!result.success || !result.data || result.data.length === 0) break;
        for (const p of result.data) {
            const email = p.email?.find(e => e.value)?.value || '';
            if (p.name && email) {
                persons.push({ name: p.name, email: email.toLowerCase() });
            }
        }
        if (!result.additional_data?.pagination?.more_items_in_collection) break;
        start = result.additional_data.pagination.next_start;
    }
    return persons;
}

// ── Subject parsing ───────────────────────────────────────
function isReplyOrForward(subject) {
    const s = (subject || '').trim();
    return s.startsWith('Re:') || s.startsWith('RE:') || s.startsWith('Fwd:') || s.startsWith('FW:');
}

function detectClientFromSubject(subject) {
    // Pattern: "Subject text | ClientName"
    const pipeMatch = (subject || '').match(/\|\s*([^|]+?)\s*$/);
    if (pipeMatch) {
        const clientName = pipeMatch[1].trim();
        return {
            id: clientName.toLowerCase().replace(/[^a-z0-9]/g, ''),
            name: clientName,
        };
    }
    return null;
}

// ── Subject normalization (strip "| ClientName" suffix for comparison) ──
function normalizeSubject(subject) {
    return (subject || '').replace(/\s*\|[^|]+$/, '').trim().toLowerCase();
}

// ── Merge logic ───────────────────────────────────────────
function mergeWithExisting(existingData, syncedData, recipientsBySubject = {}) {
    const merged = {
        clients: [...(existingData?.clients || [])],
        campaigns: [...(existingData?.campaigns || [])],
    };

    // Add new clients that don't exist yet
    for (const client of syncedData.clients) {
        if (!merged.clients.find(c => c.id === client.id)) {
            merged.clients.push(client);
        }
    }

    // Build a set of ALL existing subjects (normalized) across ALL campaigns for each client
    const existingSubjectsByClient = {};
    for (const campaign of merged.campaigns) {
        if (!existingSubjectsByClient[campaign.client]) {
            existingSubjectsByClient[campaign.client] = new Set();
        }
        for (const email of campaign.emails) {
            existingSubjectsByClient[campaign.client].add(normalizeSubject(email.subject));
        }
    }

    // Merge campaigns
    for (const syncCampaign of syncedData.campaigns) {
        const existingIdx = merged.campaigns.findIndex(c => c.id === syncCampaign.id);
        const clientSubjects = existingSubjectsByClient[syncCampaign.client] || new Set();

        if (existingIdx === -1) {
            // New sync campaign — only add emails with subjects not in ANY existing campaign
            const newEmails = syncCampaign.emails.filter(
                e => !clientSubjects.has(normalizeSubject(e.subject))
            );
            if (newEmails.length > 0) {
                merged.campaigns.push({ ...syncCampaign, emails: newEmails });
            }
        } else {
            // Existing sync campaign — merge emails
            const existing = merged.campaigns[existingIdx];
            for (const syncEmail of syncCampaign.emails) {
                const normalized = normalizeSubject(syncEmail.subject);
                // Skip if this subject exists in ANY campaign for this client
                if (clientSubjects.has(normalized)) {
                    // Check if it's in THIS campaign and API has more data
                    const existingEmailIdx = existing.emails.findIndex(
                        e => normalizeSubject(e.subject) === normalized
                    );
                    if (existingEmailIdx !== -1 && syncEmail.sent > existing.emails[existingEmailIdx].sent) {
                        existing.emails[existingEmailIdx] = syncEmail;
                    }
                    continue;
                }
                // New subject — add it
                existing.emails.push(syncEmail);
                clientSubjects.add(normalized);
            }
        }
    }

    // Enrich ALL campaigns with recipient data from API (matches by normalized subject)
    for (const campaign of merged.campaigns) {
        for (const email of campaign.emails) {
            const norm = normalizeSubject(email.subject);
            const apiRecipients = recipientsBySubject[norm];
            if (apiRecipients && apiRecipients.length > 0) {
                // Merge: keep existing recipients, add new ones by email
                const existing = email.recipients || [];
                const existingEmails = new Set(existing.map(r => r.email.toLowerCase()));
                const newRecipients = apiRecipients.filter(r => !existingEmails.has(r.email.toLowerCase()));
                email.recipients = [...existing, ...newRecipients];
            }
        }
    }

    return merged;
}

// ── Blob helpers ──────────────────────────────────────────
async function loadBlobData(key) {
    if (!blob || !process.env.BLOB_READ_WRITE_TOKEN) return null;
    try {
        const { blobs } = await blob.list({ prefix: key });
        if (blobs.length === 0) return null;
        const response = await fetch(blobs[0].url);
        return await response.json();
    } catch (e) {
        return null;
    }
}

async function saveBlobData(key, data) {
    if (!blob || !process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error('Blob storage not configured');
    }
    const { blobs } = await blob.list({ prefix: key });
    for (const b of blobs) await blob.del(b.url);
    return blob.put(key, JSON.stringify(data), {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true,
    });
}

// ── Sync endpoint ─────────────────────────────────────────
app.post('/sync/run', checkAuth, async (req, res) => {
    const startTime = Date.now();
    try {
        // 1. Fetch all sent threads from Pipedrive
        const threads = await fetchAllSentThreads();

        // 2. For each thread, get message details with tracking status + recipient names
        const emailsBySubject = {};
        let processed = 0;
        let skipped = 0;

        for (const thread of threads) {
            const subject = (thread.subject || '').trim();
            if (!subject || isReplyOrForward(subject)) { skipped++; continue; }

            const messages = await fetchThreadMessages(thread.id);
            for (const msg of messages) {
                if (!msg.sent_flag) continue;

                const s = (msg.subject || subject).trim();
                if (isReplyOrForward(s)) { skipped++; continue; }

                if (!emailsBySubject[s]) {
                    emailsBySubject[s] = {
                        sent: 0, opened: 0, notOpened: 0,
                        sender: msg.from?.[0]?.name || '',
                        firstDate: msg.message_time,
                        lastDate: msg.message_time,
                        recipients: [],
                    };
                }
                const entry = emailsBySubject[s];
                entry.sent++;
                const trackingStatus = msg.mail_tracking_status === 'opened' ? 'opened' : 'not-opened';
                if (trackingStatus === 'opened') entry.opened++;
                else entry.notOpened++;
                if (msg.message_time < entry.firstDate) entry.firstDate = msg.message_time;
                if (msg.message_time > entry.lastDate) entry.lastDate = msg.message_time;

                // Collect recipient data
                const recipient = msg.to?.[0];
                if (recipient) {
                    entry.recipients.push({
                        name: recipient.linked_person_name || recipient.name || recipient.email_address || 'Unknown',
                        email: recipient.email_address || '',
                        status: trackingStatus,
                        time: msg.message_time || '',
                    });
                }
                processed++;
            }
        }

        // 3. Group by client (detect from subject pattern)
        const clientColors = ['#6C63FF', '#00C9A7', '#FF6B6B', '#FFD93D', '#6BCB77'];
        const campaignsByClient = {};

        for (const [subject, stats] of Object.entries(emailsBySubject)) {
            const detected = detectClientFromSubject(subject);
            const clientId = detected?.id || 'unknown';
            const clientName = detected?.name || 'Unknown';

            if (!campaignsByClient[clientId]) {
                campaignsByClient[clientId] = {
                    client: { id: clientId, name: clientName },
                    subjects: [],
                };
            }
            campaignsByClient[clientId].subjects.push({ subject, ...stats });
        }

        // 4. Build campaign data structure
        const syncedData = { clients: [], campaigns: [] };

        let colorIdx = 0;
        for (const [clientId, group] of Object.entries(campaignsByClient)) {
            syncedData.clients.push({
                id: clientId,
                name: group.client.name,
                color: clientColors[colorIdx++ % clientColors.length],
            });

            // Group subjects into a single campaign per client (auto-named)
            const campaignId = `${clientId.substring(0, 3)}-sync`.toLowerCase();
            const emails = group.subjects.map((s, i) => ({
                id: `${campaignId}-e${i + 1}`,
                subject: s.subject,
                sender: s.sender,
                sent: s.sent,
                delivered: s.sent, // default: all sent = delivered
                bounced: 0,
                unsubscribed: 0,
                spam: 0,
                notSent: 0,
                uniqueOpens: s.opened,
                totalOpens: s.opened,
                uniqueClicks: 0,
                totalClicks: 0,
                replied: 0,
                openRate: s.sent > 0 ? +((s.opened / s.sent) * 100).toFixed(2) : 0,
                clickRate: 0,
                clickThroughRate: 0,
                replyRate: 0,
                sendDate: s.firstDate ? s.firstDate.split('T')[0] : new Date().toISOString().split('T')[0],
                links: [],
                locations: [],
                performanceOverTime: [],
                recipients: s.recipients || [],
            }));

            syncedData.campaigns.push({
                id: campaignId,
                client: clientId,
                name: `${group.client.name} - Synced Emails`,
                status: 'active',
                linkedAutomation: 'Pipedrive Auto-Sync',
                emails,
            });
        }

        // 5. Build recipients lookup by normalized subject (for enriching existing campaigns)
        const recipientsBySubject = {};
        for (const [subject, stats] of Object.entries(emailsBySubject)) {
            if (stats.recipients && stats.recipients.length > 0) {
                recipientsBySubject[normalizeSubject(subject)] = stats.recipients;
            }
        }

        // 6. Fetch all CRM contacts for real recipient names
        const allPersons = await fetchAllPersons();

        // 7. Load existing data and merge
        const existingData = await loadBlobData(BLOB_KEY);
        const mergedData = mergeWithExisting(existingData, syncedData, recipientsBySubject);

        // 8. Store CRM contacts alongside campaign data
        mergedData.contacts = allPersons;

        // 9. Save merged data
        await saveBlobData(BLOB_KEY, mergedData);

        // 10. Save sync status
        const totalRecipients = Object.values(emailsBySubject).reduce((sum, e) => sum + (e.recipients?.length || 0), 0);
        const recipientSubjects = Object.keys(recipientsBySubject).length;
        const status = {
            lastSync: new Date().toISOString(),
            duration: Date.now() - startTime,
            threadsFound: threads.length,
            emailsProcessed: processed,
            emailsSkipped: skipped,
            uniqueSubjects: Object.keys(emailsBySubject).length,
            clientsDetected: Object.keys(campaignsByClient).length,
            recipientsCollected: totalRecipients,
            recipientSubjects,
            contactsFetched: allPersons.length,
            newSubjects: Object.keys(emailsBySubject).filter(s => {
                const existing = existingData?.campaigns?.flatMap(c => c.emails.map(e => normalizeSubject(e.subject))) || [];
                return !existing.includes(normalizeSubject(s));
            }).length,
        };
        await saveBlobData(SYNC_STATUS_KEY, status);

        res.json({ success: true, ...status });
    } catch (err) {
        console.error('Sync failed:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /sync/status — last sync info
app.get('/sync/status', checkAuth, async (req, res) => {
    try {
        const status = await loadBlobData(SYNC_STATUS_KEY);
        res.json({ success: true, data: status });
    } catch (err) {
        res.json({ success: true, data: null });
    }
});

module.exports = app;
