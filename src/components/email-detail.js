// ═══════════════════════════════════════════════════════════
// Email Detail Modal Component  v2.1 – clickable funnel bars
// Shows detailed view when clicking on an email row
// Includes recipient-level tracking like Pipedrive's drill-down
// ═══════════════════════════════════════════════════════════

let activeModal = null;

export function showEmailDetail(email) {
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

    const recipients = generateRecipients(email);

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
        <div class="recipients-header">
          <div class="recipients-summary">
            <span class="recipients-count">${recipients.length} emails</span>
            <div class="recipients-filter-group">
              <button class="filter-btn active" data-filter="all">All</button>
              <button class="filter-btn" data-filter="opened">
                <span class="filter-dot" style="background: var(--accent-emerald)"></span> Opened
              </button>
              <button class="filter-btn" data-filter="not-opened">
                <span class="filter-dot" style="background: var(--text-muted)"></span> Not opened
              </button>
              <button class="filter-btn" data-filter="clicked">
                <span class="filter-dot" style="background: var(--accent-blue)"></span> Clicked
              </button>
              <button class="filter-btn" data-filter="replied">
                <span class="filter-dot" style="background: var(--accent-amber)"></span> Replied
              </button>
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
                    <span>${escapeHtml(r.name)}</span>
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
      const visible = container.querySelectorAll('.recipient-row:not([style*="display: none"])').length;
      container.querySelector('.recipients-count').textContent = `${visible} emails`;
    }

    // Close handlers
    overlay.querySelector('#modalCloseBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', handleEscape);
  } catch (err) {
    console.error('[EmailDetail] Error opening modal:', err);
  }
}

// ── Generate Demo Recipients ──────────────────────────────
function generateRecipients(email) {
  const names = [
    'Duncan Turner', 'Sarah Mitchell', 'James Peterson', 'Emma Williams',
    'Michael Chen', 'Olivia Brown', 'David Wilson', 'Sophie Taylor',
    'Chris Anderson', 'Kate Johnson', 'Ryan Thomas', 'Lisa Martin',
    'Andrew Jackson', 'Megan White', 'Daniel Harris', 'Rachel Lee',
    'Ben Thompson', 'Amy Robinson', 'Sam Clark', 'Natalie Walker',
    'Tom Lewis', 'Hannah Young', 'Jack King', 'Emily Scott',
    'Luke Adams', 'Grace Baker', 'Harry Nelson', 'Chloe Hill',
    'Josh Campbell', 'Zoe Mitchell', 'Max Allen', 'Ruby Wright',
  ];

  const colors = [
    'var(--accent-indigo)', 'var(--accent-violet)', 'var(--accent-blue)',
    'var(--accent-cyan)', 'var(--accent-emerald)', 'var(--accent-amber)',
    'var(--accent-rose)', 'var(--accent-pink)',
  ];

  const recipients = [];
  const count = Math.min(email.sent, 40);
  const baseDate = new Date(email.sendDate);

  for (let i = 0; i < count; i++) {
    const name = names[i % names.length];
    const initials = name.split(' ').map(n => n[0]).join('');

    let status;
    const rand = Math.random() * 100;
    const replyPct = email.replied && email.sent > 0 ? (email.replied / email.sent * 100) : 0;
    const clickPct = email.uniqueClicks && email.sent > 0 ? (email.uniqueClicks / email.sent * 100) : 0;
    const openPct = email.uniqueOpens && email.sent > 0 ? (email.uniqueOpens / email.sent * 100) : 0;
    if (rand < replyPct) {
      status = 'replied';
    } else if (rand < clickPct) {
      status = 'clicked';
    } else if (rand < openPct) {
      status = 'opened';
    } else {
      status = 'not-opened';
    }

    const sendTime = new Date(baseDate);
    sendTime.setHours(sendTime.getHours() + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60));

    recipients.push({
      id: email.sent - i,
      name, initials,
      avatarColor: colors[i % colors.length],
      status,
      time: sendTime.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' ' + sendTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false }),
    });
  }
  return recipients;
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
