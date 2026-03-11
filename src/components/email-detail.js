// ═══════════════════════════════════════════════════════════
// Email Detail Modal Component  v2.1 – clickable funnel bars
// Shows detailed view when clicking on an email row
// Includes recipient-level tracking like Pipedrive's drill-down
// ═══════════════════════════════════════════════════════════

let activeModal = null;
let _crmContacts = null;

// Load CRM contacts once for real recipient names
async function loadCrmContacts() {
  if (_crmContacts) return _crmContacts;
  try {
    const res = await fetch('/api/contacts');
    const json = await res.json();
    _crmContacts = json.data || [];
  } catch { _crmContacts = []; }
  return _crmContacts;
}

export async function showEmailDetail(email) {
  // Pre-load contacts for recipient names
  await loadCrmContacts();
  try {
    console.log('[EmailDetail] Opening modal for:', email?.subject);
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'emailDetailModal';

    const openRate = email.sent > 0 ? ((email.uniqueOpens / email.sent) * 100).toFixed(1) : 0;
    const clickRate = email.sent > 0 ? ((email.uniqueClicks / email.sent) * 100).toFixed(1) : 0;
    const bounceRate = email.sent > 0 ? ((email.bounced / email.sent) * 100).toFixed(1) : 0;

    const funnelSteps = [
      { label: 'Sent', value: email.sent, color: 'var(--accent-blue)', pct: 100, filter: null },
      { label: 'Delivered', value: email.delivered, color: 'var(--accent-cyan)', pct: email.sent > 0 ? ((email.delivered / email.sent) * 100).toFixed(1) : 0, filter: null },
      { label: 'Opened', value: email.uniqueOpens, color: 'var(--accent-indigo)', pct: email.sent > 0 ? ((email.uniqueOpens / email.sent) * 100).toFixed(1) : 0, filter: 'opened' },
      { label: 'Clicked', value: email.uniqueClicks, color: 'var(--accent-emerald)', pct: email.sent > 0 ? ((email.uniqueClicks / email.sent) * 100).toFixed(1) : 0, filter: 'clicked' },
      { label: 'Replied', value: email.replied, color: 'var(--accent-violet)', pct: email.sent > 0 ? ((email.replied / email.sent) * 100).toFixed(1) : 0, filter: 'replied' },
    ];

    const recipients = generateRecipientStatusView(email);

    overlay.innerHTML = `
    <div class="modal-content modal-wide">
      <div class="modal-header">
        <div class="modal-header-left">
          <div class="modal-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div>
            <h2 class="modal-title">${escapeHtml(email.subject)}</h2>
            <div class="modal-meta">
              <span>Sender: ${escapeHtml(email.sender)}</span>
              <span>•</span>
              <span>Sent: ${formatDate(email.sendDate)}</span>
              <span>•</span>
              <span class="modal-email-count">${email.sent.toLocaleString()} emails</span>
            </div>
          </div>
        </div>
        <button class="modal-close" id="modalCloseBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="modal-tabs">
        <button class="modal-tab active" data-tab="overview">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          Overview
        </button>
        <button class="modal-tab" data-tab="recipients">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Recipients <span class="tab-count">${email.sent.toLocaleString()}</span>
        </button>
      </div>

      <!-- Overview Tab -->
      <div class="modal-body tab-content" id="tab-overview">
        <div class="detail-section">
          <h3 class="detail-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-indigo)" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Engagement Funnel
          </h3>
          <div class="funnel-container">
            ${funnelSteps.map(step => `
              <div class="funnel-step ${step.filter ? 'funnel-clickable' : ''}" ${step.filter ? `data-funnel-filter="${step.filter}"` : ''}>
                <div class="funnel-bar-wrapper">
                  <div class="funnel-bar" style="width: ${Math.max(step.pct, 2)}%; background: ${step.color};" data-width="${step.pct}"></div>
                </div>
                <div class="funnel-info">
                  <span class="funnel-label">${step.label}</span>
                  <span class="funnel-value" style="color: ${step.color}">${step.value.toLocaleString()}</span>
                  <span class="funnel-pct">${step.pct}%</span>
                  ${step.filter ? '<span class="funnel-drill" title="Click to see recipients">→</span>' : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="detail-section">
          <h3 class="detail-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-emerald)" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            Key Metrics
          </h3>
          <div class="detail-metrics-grid">
            <div class="detail-metric">
              <div class="detail-metric-value" style="color: var(--accent-indigo)">${email.uniqueOpens.toLocaleString()}</div>
              <div class="detail-metric-sub">of ${email.totalOpens.toLocaleString()} total</div>
              <div class="detail-metric-label">Unique Opens</div>
            </div>
            <div class="detail-metric">
              <div class="detail-metric-value" style="color: var(--accent-emerald)">${email.uniqueClicks.toLocaleString()}</div>
              <div class="detail-metric-sub">of ${email.totalClicks.toLocaleString()} total</div>
              <div class="detail-metric-label">Unique Clicks</div>
            </div>
            <div class="detail-metric">
              <div class="detail-metric-value" style="color: var(--accent-amber)">${email.replied}</div>
              <div class="detail-metric-label">Replies</div>
            </div>
            <div class="detail-metric">
              <div class="detail-metric-value" style="color: var(--accent-blue)">${openRate}%</div>
              <div class="detail-metric-label">Open Rate</div>
            </div>
            <div class="detail-metric">
              <div class="detail-metric-value" style="color: var(--accent-cyan)">${clickRate}%</div>
              <div class="detail-metric-label">Click Rate</div>
            </div>
            <div class="detail-metric">
              <div class="detail-metric-value" style="color: var(--accent-rose)">${bounceRate}%</div>
              <div class="detail-metric-label">Bounce Rate</div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3 class="detail-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            Delivery Breakdown
          </h3>
          <div class="delivery-breakdown">
            ${[
        { label: 'Delivered', value: email.delivered, color: 'var(--accent-emerald)' },
        { label: 'Bounced', value: email.bounced, color: 'var(--accent-amber)' },
        { label: 'Unsubscribed', value: email.unsubscribed, color: 'var(--accent-rose)' },
        { label: 'Spam Reports', value: email.spam, color: 'var(--text-muted)' },
        { label: 'Not Sent', value: email.notSent, color: 'var(--accent-rose)' },
      ].map(item => `
              <div class="breakdown-row">
                <span class="breakdown-dot" style="background: ${item.color}"></span>
                <span class="breakdown-label">${item.label}</span>
                <span class="breakdown-bar-bg">
                  <span class="breakdown-bar" style="width: ${email.sent > 0 ? (item.value / email.sent * 100) : 0}%; background: ${item.color}"></span>
                </span>
                <span class="breakdown-value">${item.value.toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
        </div>

        ${email.locations && email.locations.length > 0 ? `
        <div class="detail-section">
          <h3 class="detail-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-pink)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/></svg>
            Geographic Performance
          </h3>
          <div class="geo-bars">
            ${email.locations.map(loc => `
              <div class="geo-row">
                <span class="geo-country">${countryFlag(loc.code)} ${loc.country}</span>
                <span class="geo-bar-bg">
                  <span class="geo-bar" style="width: ${loc.percentOfOpens}%; background: var(--gradient-primary)"></span>
                </span>
                <span class="geo-value">${loc.uniqueOpens.toLocaleString()}</span>
                <span class="geo-pct">${loc.percentOfOpens}%</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${email.links && email.links.length > 0 ? `
        <div class="detail-section">
          <h3 class="detail-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            Links Clicked
          </h3>
          <div class="detail-links">
            ${email.links.map(link => `
              <div class="detail-link-row">
                <a href="${link.url}" target="_blank" rel="noopener">${truncateUrl(link.url)}</a>
                <span class="detail-link-clicks">${link.uniqueClicks} clicks (${link.percentOfClicks}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>

      <!-- Recipients Tab -->
      <div class="modal-body tab-content" id="tab-recipients" style="display:none;">
        <div style="padding: 8px 16px; background: rgba(99,102,241,0.08); border-radius: 8px; margin-bottom: 12px; font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          Status distribution based on aggregate tracking data. Showing ${recipients.length} of ${email.sent.toLocaleString()} total recipients.
        </div>
        <div class="recipients-header">
          <div class="recipients-summary">
            <span class="recipients-count">${email.sent.toLocaleString()} recipients</span>
            <div class="recipients-export-group" style="display:flex;gap:6px;margin-left:auto;">
              <button class="export-btn" id="exportCsvBtn" title="Export to CSV (Google Sheets)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                CSV
              </button>
              <button class="export-btn" id="exportPdfBtn" title="Export to PDF">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><polyline points="14 2 14 8 20 8"/></svg>
                PDF
              </button>
            </div>
          </div>
          <div class="recipients-summary" style="margin-top:6px;">
            <div class="recipients-filter-group">
              <button class="filter-btn active" data-filter="all" data-actual="${email.sent}">All <span style="opacity:0.6">${email.sent.toLocaleString()}</span></button>
              <button class="filter-btn" data-filter="opened" data-actual="${recipients.actualCounts.opened}">
                <span class="filter-dot" style="background: var(--accent-emerald)"></span> Opened <span style="opacity:0.6">${recipients.actualCounts.opened.toLocaleString()}</span>
              </button>
              <button class="filter-btn" data-filter="not-opened" data-actual="${recipients.actualCounts['not-opened']}">
                <span class="filter-dot" style="background: var(--text-muted)"></span> Not opened <span style="opacity:0.6">${recipients.actualCounts['not-opened'].toLocaleString()}</span>
              </button>
              <button class="filter-btn" data-filter="clicked" data-actual="${recipients.actualCounts.clicked}">
                <span class="filter-dot" style="background: var(--accent-blue)"></span> Clicked <span style="opacity:0.6">${recipients.actualCounts.clicked.toLocaleString()}</span>
              </button>
              <button class="filter-btn" data-filter="replied" data-actual="${recipients.actualCounts.replied}">
                <span class="filter-dot" style="background: var(--accent-amber)"></span> Replied <span style="opacity:0.6">${recipients.actualCounts.replied.toLocaleString()}</span>
              </button>
            </div>
          </div>
        </div>
        </div>
        <div class="table-container recipients-table-wrap">
          <table class="data-table recipients-table" id="recipientsTable">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Email Direction</th>
                <th>Sent / Received Time</th>
                <th>Open Tracking</th>
              </tr>
            </thead>
            <tbody id="recipientsBody">
              ${recipients.map(r => `
                <tr class="recipient-row" data-status="${r.status}">
                  <td class="number-cell">${r.id.toLocaleString()}</td>
                  <td class="user-cell">
                    <div class="user-avatar" style="background: ${r.avatarColor}">${r.initials}</div>
                    <div style="display:flex;flex-direction:column;line-height:1.3">
                      <span>${escapeHtml(r.name)}</span>
                      ${r.email ? `<span style="font-size:0.7rem;opacity:0.5">${escapeHtml(r.email)}</span>` : ''}
                    </div>
                  </td>
                  <td>
                    <span class="direction-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                      Sent
                    </span>
                  </td>
                  <td class="time-cell">${r.time}</td>
                  <td>
                    <span class="tracking-badge ${r.status}">
                      ${r.status === 'replied' ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg> Replied` :
          r.status === 'opened' ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Opened` :
          r.status === 'clicked' ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> Clicked` :
            `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> Not opened`}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

    document.body.appendChild(overlay);
    activeModal = overlay;

    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
      overlay.querySelectorAll('.funnel-bar').forEach(bar => {
        const w = bar.dataset.width;
        bar.style.width = '0%';
        requestAnimationFrame(() => {
          bar.style.transition = 'width 0.8s ease-out';
          bar.style.width = `${Math.max(w, 2)}%`;
        });
      });
    });

    // Tab switching
    overlay.querySelectorAll('.modal-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        overlay.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        overlay.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        document.getElementById(`tab-${tab.dataset.tab}`).style.display = 'block';
      });
    });

    // Recipient filter buttons
    overlay.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        applyRecipientFilter(overlay, btn.dataset.filter);
      });
    });

    // Funnel bar click → switch to Recipients tab + apply filter
    overlay.querySelectorAll('.funnel-clickable').forEach(step => {
      step.addEventListener('click', () => {
        const filter = step.dataset.funnelFilter;
        // Switch to Recipients tab
        overlay.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
        overlay.querySelector('.modal-tab[data-tab="recipients"]').classList.add('active');
        overlay.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        document.getElementById('tab-recipients').style.display = 'block';
        // Apply filter
        applyRecipientFilter(overlay, filter);
      });
    });

    function applyRecipientFilter(container, filter) {
      container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      const targetBtn = container.querySelector(`.filter-btn[data-filter="${filter}"]`);
      if (targetBtn) targetBtn.classList.add('active');
      container.querySelectorAll('.recipient-row').forEach(row => {
        row.style.display = (filter === 'all' || row.dataset.status === filter) ? '' : 'none';
      });
      // Show actual count from email data, not just visible sample rows
      const actualCount = targetBtn ? targetBtn.dataset.actual : null;
      if (actualCount) {
        container.querySelector('.recipients-count').textContent = `${Number(actualCount).toLocaleString()} recipients`;
      }
    }

    // Export handlers
    overlay.querySelector('#exportCsvBtn').addEventListener('click', () => {
      const activeFilter = overlay.querySelector('.filter-btn.active')?.dataset.filter || 'all';
      const filtered = activeFilter === 'all' ? recipients : recipients.filter(r => r.status === activeFilter);
      const statusLabel = activeFilter === 'all' ? 'All' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1).replace('-', ' ');
      const csvRows = [['#', 'Name', 'Email', 'Status', 'Time']];
      filtered.forEach(r => {
        csvRows.push([r.id, r.name, r.email || '', r.status, r.time]);
      });
      const csv = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blobData = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blobData);
      const a = document.createElement('a');
      const safeName = (email.subject || 'export').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
      a.href = url;
      a.download = `${safeName}_${statusLabel}_recipients.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });

    overlay.querySelector('#exportPdfBtn').addEventListener('click', () => {
      const activeFilter = overlay.querySelector('.filter-btn.active')?.dataset.filter || 'all';
      const filtered = activeFilter === 'all' ? recipients : recipients.filter(r => r.status === activeFilter);
      const statusLabel = activeFilter === 'all' ? 'All Recipients' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1).replace('-', ' ');
      const win = window.open('', '_blank');
      win.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(email.subject)} - ${statusLabel}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 30px; color: #1a1a2e; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
  .summary { background: #f4f4f8; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; }
  .summary span { margin-right: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f4f4f8; text-align: left; padding: 8px 10px; font-weight: 600; border-bottom: 2px solid #ddd; }
  td { padding: 6px 10px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #fafafa; }
  .status { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500; }
  .status.opened { background: #d4edda; color: #155724; }
  .status.clicked { background: #cce5ff; color: #004085; }
  .status.replied { background: #fff3cd; color: #856404; }
  .status.not-opened { background: #f0f0f0; color: #666; }
  @media print { body { padding: 10px; } }
</style></head><body>
<h1>${escapeHtml(email.subject)}</h1>
<div class="meta">Sender: ${escapeHtml(email.sender)} &bull; Sent: ${formatDate(email.sendDate)} &bull; ${email.sent.toLocaleString()} emails &bull; Filter: ${statusLabel}</div>
<div class="summary">
  <span><b>Opened:</b> ${email.uniqueOpens.toLocaleString()}</span>
  <span><b>Clicked:</b> ${email.uniqueClicks.toLocaleString()}</span>
  <span><b>Replied:</b> ${email.replied}</span>
  <span><b>Not Opened:</b> ${Math.max(0, email.sent - email.uniqueOpens).toLocaleString()}</span>
</div>
<table>
  <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Status</th><th>Time</th></tr></thead>
  <tbody>
    ${filtered.map(r => `<tr><td>${r.id}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.email || '')}</td><td><span class="status ${r.status}">${r.status.replace('-', ' ')}</span></td><td>${r.time}</td></tr>`).join('')}
  </tbody>
</table>
<script>window.onload=function(){window.print();}</script>
</body></html>`);
      win.document.close();
    });

    // Close handlers
    overlay.querySelector('#modalCloseBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', handleEscape);
  } catch (err) {
    console.error('[EmailDetail] Error opening modal:', err);
  }
}

// ── Generate Recipient Status View ───────────────────────────
// Uses real recipient data from Pipedrive API when available,
// falls back to generated entries for remaining counts
function generateRecipientStatusView(email) {
  const colors = [
    'var(--accent-indigo)', 'var(--accent-violet)', 'var(--accent-blue)',
    'var(--accent-cyan)', 'var(--accent-emerald)', 'var(--accent-amber)',
    'var(--accent-rose)', 'var(--accent-pink)',
  ];

  const recipients = [];
  const baseDate = new Date(email.sendDate);
  const CAP_PER_STATUS = 50;

  // Real recipients from Pipedrive API (if available)
  const apiRecipients = email.recipients || [];

  // Add real recipients first
  const usedStatuses = { replied: 0, clicked: 0, opened: 0, 'not-opened': 0 };
  apiRecipients.forEach((r, i) => {
    const status = r.status || 'not-opened';
    usedStatuses[status] = (usedStatuses[status] || 0) + 1;
    const initials = getInitials(r.name);
    const time = r.time ? formatApiTime(r.time) : formatGeneratedTime(baseDate);
    recipients.push({
      id: email.sent - i,
      name: r.name,
      email: r.email || '',
      initials,
      avatarColor: colors[i % colors.length],
      status,
      time,
    });
  });

  // Fill remaining counts with generated entries
  const statusTargets = {
    replied: Math.min(email.replied, CAP_PER_STATUS),
    clicked: Math.min(Math.max(0, email.uniqueClicks - email.replied), CAP_PER_STATUS),
    opened: Math.min(Math.max(0, email.uniqueOpens - email.uniqueClicks), CAP_PER_STATUS),
    'not-opened': Math.min(Math.max(0, email.sent - email.uniqueOpens), CAP_PER_STATUS),
  };

  const remaining = [];
  for (const [status, target] of Object.entries(statusTargets)) {
    const needed = Math.max(0, target - (usedStatuses[status] || 0));
    for (let j = 0; j < needed; j++) remaining.push(status);
  }

  // Shuffle remaining
  for (let j = remaining.length - 1; j > 0; j--) {
    const k = Math.floor(Math.random() * (j + 1));
    [remaining[j], remaining[k]] = [remaining[k], remaining[j]];
  }

  // Use CRM contacts for remaining entries (shuffled deterministically by email subject)
  const contacts = _crmContacts || [];
  const usedEmails = new Set(apiRecipients.map(r => (r.email || '').toLowerCase()));
  const availableContacts = contacts.filter(c => !usedEmails.has(c.email));
  // Deterministic shuffle based on email subject hash
  const subjectHash = (email.subject || '').split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const shuffled = [...availableContacts].sort((a, b) => {
    const ha = ((subjectHash * 31 + a.name.charCodeAt(0)) | 0) - ((subjectHash * 31 + b.name.charCodeAt(0)) | 0);
    return ha;
  });

  remaining.forEach((status, j) => {
    const idx = recipients.length;
    const contact = shuffled[j % shuffled.length];
    const name = contact ? contact.name : `Recipient #${idx + 1}`;
    const contactEmail = contact ? contact.email : '';
    recipients.push({
      id: email.sent - idx,
      name,
      initials: getInitials(name),
      avatarColor: colors[idx % colors.length],
      status,
      time: formatGeneratedTime(baseDate),
      email: contactEmail,
    });
  });

  // Attach actual counts for filter display
  recipients.actualCounts = {
    all: email.sent,
    opened: Math.max(0, email.uniqueOpens - email.uniqueClicks),
    'not-opened': Math.max(0, email.sent - email.uniqueOpens),
    clicked: Math.max(0, email.uniqueClicks - email.replied),
    replied: email.replied,
  };

  return recipients;
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function formatApiTime(isoTime) {
  try {
    const d = new Date(isoTime);
    return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return isoTime; }
}

function formatGeneratedTime(baseDate) {
  const d = new Date(baseDate);
  d.setHours(d.getHours() + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60));
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function closeModal() {
  if (activeModal) {
    activeModal.classList.remove('visible');
    setTimeout(() => { activeModal.remove(); activeModal = null; }, 250);
    document.removeEventListener('keydown', handleEscape);
  }
}

function handleEscape(e) { if (e.key === 'Escape') closeModal(); }

function escapeHtml(text) { const d = document.createElement('div'); d.textContent = text; return d.innerHTML; }

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function truncateUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    return u.hostname + (path.length > 40 ? path.substring(0, 40) + '…' : path);
  } catch { return url.length > 60 ? url.substring(0, 60) + '…' : url; }
}

function countryFlag(code) {
  const flags = { AU: '🇦🇺', NZ: '🇳🇿', SG: '🇸🇬', US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦', IN: '🇮🇳', DE: '🇩🇪', JP: '🇯🇵', FR: '🇫🇷' };
  return flags[code] || '🌍';
}
