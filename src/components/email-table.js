// ═══════════════════════════════════════════════════════════
// Email Subject Table Component — ⭐ KEY FEATURE
// Sortable table with clickable rows for detail modal
// ═══════════════════════════════════════════════════════════

import { showEmailDetail } from './email-detail.js';

let currentSort = { key: null, direction: 'desc' };

const COLUMNS = [
  { key: 'subject', label: 'Email Subject', numeric: false },
  { key: 'sent', label: 'Sent', numeric: true },
  { key: 'uniqueOpens', label: 'Opened', numeric: true },
  { key: 'openRate', label: 'Open Rate', numeric: true, suffix: '%' },
  { key: 'uniqueClicks', label: 'Clicked', numeric: true },
  { key: 'clickRate', label: 'Click Rate', numeric: true, suffix: '%' },
  { key: 'clickThroughRate', label: 'CTR', numeric: true, suffix: '%' },
  { key: 'replied', label: 'Replied', numeric: true },
  { key: 'replyRate', label: 'Reply Rate', numeric: true, suffix: '%' },
];

export function renderEmailTable(container, data) {
  const { emails, aggregated } = data;

  // Reset sort when switching campaigns
  currentSort = { key: null, direction: 'desc' };

  const headerCells = COLUMNS.map(col => `
        <th class="sortable-th" data-sort-key="${col.key}" id="th-${col.key}">
          <span class="th-content">
            ${col.label}
            <span class="sort-icon">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path class="sort-up" d="M5 1L9 5H1z" opacity="0.3"/>
                <path class="sort-down" d="M5 9L1 5h8z" opacity="0.3"/>
              </svg>
            </span>
          </span>
        </th>
    `).join('');

  container.insertAdjacentHTML('beforeend', `
    <div class="section" id="emailTableSection">
      <div class="section-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-violet)" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        <span class="section-title">Performance by Email Subject</span>
        <span class="section-subtitle">— ${emails.length} email${emails.length !== 1 ? 's' : ''} · Click a row for details · Click headers to sort</span>
      </div>

      <div class="table-container">
        <table class="data-table" id="emailTable">
          <thead>
            <tr>${headerCells}</tr>
          </thead>
          <tbody id="emailTableBody">
          </tbody>
          <tfoot>
            <tr class="totals-row">
              <td><strong>TOTALS</strong></td>
              <td class="number-cell">${aggregated.sent.toLocaleString()}</td>
              <td class="number-cell">${aggregated.uniqueOpens.toLocaleString()}</td>
              <td class="rate-cell">${aggregated.openRate}%</td>
              <td class="number-cell">${aggregated.uniqueClicks.toLocaleString()}</td>
              <td class="rate-cell">${aggregated.clickRate}%</td>
              <td class="rate-cell">${aggregated.clickThroughRate}%</td>
              <td class="number-cell">${aggregated.replied}</td>
              <td class="rate-cell">${aggregated.replyRate}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `);

  // Render sorted rows
  renderRows(emails);

  // Attach sort handlers
  requestAnimationFrame(() => {
    document.querySelectorAll('.sortable-th').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sortKey;
        if (currentSort.key === key) {
          currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
          currentSort.key = key;
          currentSort.direction = 'desc';
        }

        // Update header visual
        document.querySelectorAll('.sortable-th').forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
        th.classList.add(`sorted-${currentSort.direction}`);

        // Re-sort and render
        const sorted = sortEmails(emails, currentSort.key, currentSort.direction);
        renderRows(sorted);
      });
    });
  });
}

function renderRows(emails) {
  const tbody = document.getElementById('emailTableBody');
  if (!tbody) return;

  tbody.innerHTML = emails.map((email, idx) => `
    <tr class="email-row clickable" data-email-idx="${idx}">
      <td class="subject-cell" title="${escapeHtml(email.subject)}">
        <span class="row-expand-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1"/></svg>
        </span>
        ${escapeHtml(email.subject)}
      </td>
      <td class="number-cell">${email.sent.toLocaleString()}</td>
      <td class="number-cell">${email.uniqueOpens.toLocaleString()}</td>
      <td class="rate-cell ${rateClass(email.openRate, 50, 30)}">${email.openRate}%</td>
      <td class="number-cell">${email.uniqueClicks.toLocaleString()}</td>
      <td class="rate-cell ${rateClass(email.clickRate, 5, 2)}">${email.clickRate}%</td>
      <td class="rate-cell ${rateClass(email.clickThroughRate, 10, 5)}">${email.clickThroughRate}%</td>
      <td class="number-cell">${email.replied}</td>
      <td class="rate-cell ${rateClass(email.replyRate, 2, 0.5)}">${email.replyRate}%</td>
    </tr>
  `).join('');

  // Re-bind click handlers for detail modal
  tbody.querySelectorAll('.email-row').forEach((row, i) => {
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('[EmailTable] Row clicked:', emails[i]?.subject);
      showEmailDetail(emails[i]);
    });
  });
}

function sortEmails(emails, key, direction) {
  const sorted = [...emails].sort((a, b) => {
    let valA = a[key];
    let valB = b[key];
    if (typeof valA === 'string') {
      return direction === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    return direction === 'asc' ? valA - valB : valB - valA;
  });
  return sorted;
}

function rateClass(value, highThreshold, midThreshold) {
  if (value >= highThreshold) return 'high';
  if (value >= midThreshold) return 'mid';
  return 'low';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
