// ═══════════════════════════════════════════════════════════
// CampaignHub — Main Application Controller
// Handles campaign navigation, data fetching, and rendering
// ═══════════════════════════════════════════════════════════

import { fetchCampaigns, fetchCampaignDetail } from './utils/api.js';
import { renderEngagement } from './components/engagement.js';
import { renderEmailTable } from './components/email-table.js';
import { renderDelivery } from './components/delivery.js';
import { renderPerformanceChart } from './components/chart.js';
import { renderLinksTable } from './components/links-table.js';
import { renderLocations } from './components/locations.js';
import { renderInsights } from './components/insights.js';
import { exportToCSV, exportToPDF } from './components/export.js';

// ── State ─────────────────────────────────────────────────
let campaigns = [];
let activeCampaignId = null;
let refreshInterval = null;
let currentData = null; // Keep for export

// ── DOM Refs ──────────────────────────────────────────────
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
        campaigns = await fetchCampaigns();
        renderCampaignList();

        if (campaigns.length > 0) {
            selectCampaign(campaigns[0].id);
        }

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
        currentData = data;

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

        // Render all sections in order
        renderEngagement(contentDiv, data);
        renderInsights(contentDiv, data);       // ← AI Insights (unique differentiator)
        renderEmailTable(contentDiv, data);     // ← Now sortable
        renderDelivery(contentDiv, data);       // ← Now donut chart
        renderPerformanceChart(contentDiv, data);
        renderLinksTable(contentDiv, data);
        renderLocations(contentDiv, data);

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
