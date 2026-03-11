// ═══════════════════════════════════════════════════════════
// CampaignHub — Main Application Controller
// Handles client switching, campaign navigation, data fetching
// ═══════════════════════════════════════════════════════════

import { fetchClients, fetchCampaigns, fetchCampaignDetail } from './utils/api.js';
import { renderEngagement } from './components/engagement.js';
import { renderEmailTable } from './components/email-table.js';
import { renderDelivery } from './components/delivery.js';
import { renderPerformanceChart } from './components/chart.js';
import { renderLinksTable } from './components/links-table.js';
import { renderLocations } from './components/locations.js';
import { renderInsights } from './components/insights.js';
import { exportToCSV, exportToPDF } from './components/export.js';

// ── State ─────────────────────────────────────────────────
let clients = [];
let campaigns = [];
let activeClient = null;
let activeCampaignId = null;
let refreshInterval = null;
let currentData = null; // Keep for export
let lockedClient = null; // URL-based access control
let activeDateRange = 'mtd'; // Date range filter

// ── DOM Refs ──────────────────────────────────────────────
const clientSwitcher = document.getElementById('clientSwitcher');
const dateRangeSelect = document.getElementById('dateRangeSelect');
const campaignList = document.getElementById('campaignList');
const dashboard = document.getElementById('dashboard');
const pageTitle = document.getElementById('pageTitle');
const statusBadge = document.getElementById('statusBadge');
const lastUpdated = document.getElementById('lastUpdated');
const refreshBtn = document.getElementById('refreshBtn');
const emptyState = document.getElementById('emptyState');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');

// ── Initialize ────────────────────────────────────────────
async function init() {
    try {
        // Check URL for client lock (access control)
        const urlParams = new URLSearchParams(window.location.search);
        const clientParam = urlParams.get('client');

        // Fetch available clients
        clients = await fetchClients();

        if (clientParam) {
            const validClient = clients.find((c) => c.id === clientParam);
            if (validClient) {
                lockedClient = clientParam;
                activeClient = clientParam;
            }
        }

        // Render client switcher (hidden if locked to one client)
        renderClientSwitcher();

        // Default to first client if none selected
        if (!activeClient && clients.length > 0) {
            activeClient = clients[0].id;
        }

        // Load campaigns for the active client
        await loadClientCampaigns(activeClient);

        // Auto-refresh every 60 seconds
        refreshInterval = setInterval(() => {
            if (activeCampaignId) {
                loadCampaignData(activeCampaignId, true);
            }
        }, 60000);
    } catch (err) {
        console.error('Failed to initialize:', err);
        showError('Failed to connect to server. Make sure the backend is running.');
    }
}

// ── Date Range Helpers ────────────────────────────────────
function getDateRange(rangeKey) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    switch (rangeKey) {
        case 'mtd':
            return {
                start: new Date(year, month, 1),
                end: now,
                label: now.toLocaleString('default', { month: 'long', year: 'numeric' }) + ' (MTD)',
            };
        case 'ytd':
            return {
                start: new Date(year, 0, 1),
                end: now,
                label: `Year to Date ${year}`,
            };
        default: {
            // Month format: '2026-01'
            const [y, m] = rangeKey.split('-').map(Number);
            const start = new Date(y, m - 1, 1);
            const end = new Date(y, m, 0, 23, 59, 59); // Last day of month
            const monthName = start.toLocaleString('default', { month: 'long' });
            return { start, end, label: `${monthName} ${y}` };
        }
    }
}

function filterEmailsByDate(emails, rangeKey) {
    const { start, end } = getDateRange(rangeKey);
    return emails.filter((e) => {
        const sendDate = new Date(e.sendDate);
        return sendDate >= start && sendDate <= end;
    });
}

// ── Client Switcher ───────────────────────────────────────
function renderClientSwitcher() {
    if (lockedClient || clients.length <= 1) {
        // Hide switcher when URL-locked or only one client
        clientSwitcher.style.display = 'none';
        return;
    }

    clientSwitcher.style.display = 'block';
    clientSwitcher.innerHTML = `
    <div class="client-toggle">
      ${clients.map((c) => `
        <button class="client-toggle-btn ${c.id === activeClient ? 'active' : ''}"
                data-client="${c.id}"
                id="client-btn-${c.id}">
          <span class="client-dot" style="background: ${c.color}"></span>
          ${c.name}
        </button>
      `).join('')}
      <div class="client-toggle-indicator" id="toggleIndicator"></div>
    </div>
  `;

    // Position the sliding indicator
    updateToggleIndicator();

    // Add click handlers
    clientSwitcher.querySelectorAll('.client-toggle-btn').forEach((btn) => {
        btn.addEventListener('click', () => switchClient(btn.dataset.client));
    });
}

function updateToggleIndicator() {
    const indicator = document.getElementById('toggleIndicator');
    const activeBtn = clientSwitcher.querySelector('.client-toggle-btn.active');
    if (indicator && activeBtn) {
        indicator.style.width = `${activeBtn.offsetWidth}px`;
        indicator.style.left = `${activeBtn.offsetLeft}px`;
    }
}

async function switchClient(clientId) {
    if (clientId === activeClient) return;

    activeClient = clientId;

    // Update toggle button states
    clientSwitcher.querySelectorAll('.client-toggle-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.client === clientId);
    });
    updateToggleIndicator();

    // Reload campaigns for the new client
    await loadClientCampaigns(clientId);
}

// ── Load Client Campaigns ─────────────────────────────────
async function loadClientCampaigns(clientId) {
    campaigns = await fetchCampaigns(clientId);
    renderCampaignList();

    if (campaigns.length > 0) {
        selectCampaign(campaigns[0].id);
    } else {
        activeCampaignId = null;
        pageTitle.textContent = 'No Campaigns';
        statusBadge.textContent = '';
        statusBadge.className = 'status-badge';
        if (emptyState) {
            emptyState.style.display = 'flex';
            emptyState.innerHTML = `
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 8V21H3V8" /><path d="M23 3H1v5h22V3z" /><path d="M10 12h4" />
          </svg>
        </div>
        <h2>No Campaigns Yet</h2>
        <p>This client has no campaigns to display</p>
      `;
        }
    }
}

// ── Campaign List ─────────────────────────────────────────
function renderCampaignList() {
    campaignList.innerHTML = campaigns.map((c) => `
    <div class="campaign-item ${c.id === activeCampaignId ? 'active' : ''}"
         data-id="${c.id}"
         id="campaign-${c.id}">
      <div class="campaign-item-icon">${getInitials(c.name)}</div>
      <div class="campaign-item-info">
        <div class="campaign-item-name">${c.name}</div>
        <div class="campaign-item-count">${c.emailCount} email${c.emailCount !== 1 ? 's' : ''}</div>
      </div>
    </div>
  `).join('');

    campaignList.querySelectorAll('.campaign-item').forEach((item) => {
        item.addEventListener('click', () => selectCampaign(item.dataset.id));
    });
}

function getInitials(name) {
    const match = name.match(/^([A-Z]{3}\d{3})/);
    if (match) return match[1].substring(0, 3);
    return name.substring(0, 2).toUpperCase();
}

// ── Select Campaign ───────────────────────────────────────
async function selectCampaign(id) {
    activeCampaignId = id;
    campaignList.querySelectorAll('.campaign-item').forEach((item) => {
        item.classList.toggle('active', item.dataset.id === id);
    });
    sidebar.classList.remove('open');
    await loadCampaignData(id);
}

// ── Load & Render Campaign Data ───────────────────────────
async function loadCampaignData(id, silent = false) {
    if (!silent) showLoading();

    try {
        const data = await fetchCampaignDetail(id);
        // Filter emails by date range; auto-expand to YTD if no results
        let filteredEmails = filterEmailsByDate(data.emails, activeDateRange);
        if (filteredEmails.length === 0 && data.emails.length > 0) {
            filteredEmails = filterEmailsByDate(data.emails, 'ytd');
            activeDateRange = 'ytd';
            dateRangeSelect.value = 'ytd';
        }
        const filteredData = { ...data, emails: filteredEmails };

        // Recalculate aggregated stats for filtered emails
        if (filteredEmails.length > 0) {
            const totals = filteredEmails.reduce(
                (acc, e) => {
                    acc.sent += e.sent; acc.delivered += e.delivered;
                    acc.bounced += e.bounced; acc.unsubscribed += e.unsubscribed;
                    acc.spam += e.spam; acc.notSent += e.notSent;
                    acc.uniqueOpens += e.uniqueOpens; acc.totalOpens += e.totalOpens;
                    acc.uniqueClicks += e.uniqueClicks; acc.totalClicks += e.totalClicks;
                    acc.replied += e.replied;
                    return acc;
                },
                { sent: 0, delivered: 0, bounced: 0, unsubscribed: 0, spam: 0, notSent: 0,
                  uniqueOpens: 0, totalOpens: 0, uniqueClicks: 0, totalClicks: 0, replied: 0 }
            );
            totals.openRate = totals.sent > 0 ? ((totals.uniqueOpens / totals.sent) * 100).toFixed(2) : 0;
            totals.clickRate = totals.sent > 0 ? ((totals.uniqueClicks / totals.sent) * 100).toFixed(2) : 0;
            totals.clickThroughRate = totals.uniqueOpens > 0 ? ((totals.uniqueClicks / totals.uniqueOpens) * 100).toFixed(2) : 0;
            totals.replyRate = totals.uniqueOpens > 0 ? ((totals.replied / totals.uniqueOpens) * 100).toFixed(2) : 0;
            filteredData.aggregated = totals;
        } else {
            filteredData.aggregated = {
                sent: 0, delivered: 0, bounced: 0, unsubscribed: 0, spam: 0, notSent: 0,
                uniqueOpens: 0, totalOpens: 0, uniqueClicks: 0, totalClicks: 0, replied: 0,
                openRate: 0, clickRate: 0, clickThroughRate: 0, replyRate: 0,
            };
        }

        currentData = filteredData;

        // Update header
        pageTitle.textContent = data.name;
        statusBadge.textContent = data.status;
        statusBadge.className = `status-badge ${data.status.toLowerCase()}`;
        lastUpdated.textContent = `Updated: ${new Date().toLocaleTimeString()}`;

        // Show export buttons
        renderExportButtons();

        // Clear and render dashboard
        if (emptyState) emptyState.style.display = 'none';

        const contentDiv = document.createElement('div');
        contentDiv.id = 'dashboardContent';

        const oldContent = document.getElementById('dashboardContent');
        if (oldContent) oldContent.remove();

        dashboard.appendChild(contentDiv);

        if (filteredEmails.length === 0) {
            contentDiv.innerHTML = `
              <div class="empty-state" style="height: 40vh;">
                <div class="empty-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <h2>No Data for This Period</h2>
                <p>No emails were sent during the selected date range</p>
              </div>
            `;
            return;
        }

        // Render all sections in order
        renderEngagement(contentDiv, filteredData);
        renderInsights(contentDiv, filteredData);
        renderEmailTable(contentDiv, filteredData);
        renderDelivery(contentDiv, filteredData);
        renderPerformanceChart(contentDiv, filteredData);
        renderLinksTable(contentDiv, filteredData);
        renderLocations(contentDiv, filteredData);

    } catch (err) {
        console.error('Failed to load campaign:', err);
        if (!silent) showError('Failed to load campaign data');
    }
}

// ── Export Buttons ─────────────────────────────────────────
function renderExportButtons() {
    let exportBar = document.getElementById('exportBar');
    if (!exportBar) {
        exportBar = document.createElement('div');
        exportBar.id = 'exportBar';
        exportBar.className = 'export-bar';
        const headerRight = document.querySelector('.main-header-right');
        if (headerRight) {
            headerRight.insertBefore(exportBar, headerRight.querySelector('.btn-refresh'));
        }
    }

    exportBar.innerHTML = `
    <button class="export-btn" id="exportCSV" title="Export as CSV">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      CSV
    </button>
    <button class="export-btn" id="exportPDF" title="Export as PDF report">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      PDF
    </button>
  `;

    exportBar.querySelector('#exportCSV').addEventListener('click', () => {
        if (currentData) exportToCSV(currentData);
    });
    exportBar.querySelector('#exportPDF').addEventListener('click', () => {
        if (currentData) exportToPDF(currentData);
    });
}

// ── Loading State ─────────────────────────────────────────
function showLoading() {
    const oldContent = document.getElementById('dashboardContent');
    if (oldContent) oldContent.remove();
    if (emptyState) emptyState.style.display = 'none';

    const loading = document.createElement('div');
    loading.id = 'dashboardContent';
    loading.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px; padding: 20px 0;">
      <div class="shimmer" style="height: 200px;"></div>
      <div class="shimmer" style="height: 150px;"></div>
      <div class="shimmer" style="height: 100px;"></div>
      <div class="shimmer" style="height: 300px;"></div>
    </div>
  `;
    dashboard.appendChild(loading);
}

// ── Error State ───────────────────────────────────────────
function showError(message) {
    if (emptyState) {
        emptyState.innerHTML = `
      <div class="empty-icon" style="color: var(--accent-rose);">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
        </svg>
      </div>
      <h2 style="color: var(--accent-rose);">Connection Error</h2>
      <p>${message}</p>
    `;
        emptyState.style.display = 'flex';
    }
}

// ── Event Listeners ───────────────────────────────────────
refreshBtn.addEventListener('click', () => {
    if (!activeCampaignId) return;
    refreshBtn.classList.add('spinning');
    loadCampaignData(activeCampaignId).then(() => {
        setTimeout(() => refreshBtn.classList.remove('spinning'), 600);
    });
});

sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

dateRangeSelect.addEventListener('change', () => {
    activeDateRange = dateRangeSelect.value;
    if (activeCampaignId) {
        loadCampaignData(activeCampaignId);
    }
});

document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        e.target !== sidebarToggle) {
        sidebar.classList.remove('open');
    }
});

// ── RRM Logo Color Animation ─────────────────────────────
const logoVariants = [
    'https://www.rogerroger.marketing/wp-content/uploads/2024/12/rrm-logo-coral.svg',
    'https://www.rogerroger.marketing/wp-content/uploads/2024/12/rrm-logo-mustard.svg',
    'https://www.rogerroger.marketing/wp-content/uploads/2024/12/rrm-logo-sky.svg',
    'https://www.rogerroger.marketing/wp-content/uploads/2024/12/rrm-logo-aqua.svg',
];
let logoIdx = 0;
const rrmLogo = document.getElementById('rrmLogo');
if (rrmLogo) {
    // Preload all variants
    logoVariants.forEach(src => { const img = new Image(); img.src = src; });
    setInterval(() => {
        logoIdx = (logoIdx + 1) % logoVariants.length;
        rrmLogo.style.opacity = '0';
        setTimeout(() => {
            rrmLogo.src = logoVariants[logoIdx];
            rrmLogo.style.opacity = '1';
        }, 300);
    }, 2500);
}

// ── Boot ──────────────────────────────────────────────────
init();
