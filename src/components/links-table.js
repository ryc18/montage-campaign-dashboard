// ═══════════════════════════════════════════════════════════
// Links Performance Table Component
// Shows link URL, unique clicks, % of all unique clicks
// ═══════════════════════════════════════════════════════════

export function renderLinksTable(container, data) {
  // Aggregate links across all emails
  const linkMap = new Map();
  let totalUniqueClicks = 0;

  data.emails.forEach((email) => {
    email.links.forEach((link) => {
      const existing = linkMap.get(link.url) || { url: link.url, uniqueClicks: 0 };
      existing.uniqueClicks += link.uniqueClicks;
      linkMap.set(link.url, existing);
    });
    totalUniqueClicks += email.uniqueClicks;
  });

  const links = [...linkMap.values()];

  if (links.length === 0) {
    container.insertAdjacentHTML('beforeend', `
      <div class="section" id="linksSection">
        <div class="section-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <span class="section-title">Links Performance</span>
        </div>
        <div class="table-container" style="padding: var(--space-xl); text-align: center; color: var(--text-muted);">
          No link tracking data available for this campaign
        </div>
      </div>
    `);
    return;
  }

  // Recalculate percentages
  links.forEach((link) => {
    link.percentOfClicks = totalUniqueClicks > 0
      ? ((link.uniqueClicks / totalUniqueClicks) * 100).toFixed(2)
      : 0;
  });

  const rows = links.map((link) => `
    <tr>
      <td class="link-cell"><a href="${link.url}" target="_blank" rel="noopener">${truncateUrl(link.url)}</a></td>
      <td class="number-cell">${link.uniqueClicks.toLocaleString()}</td>
      <td class="rate-cell high">${link.percentOfClicks}%</td>
    </tr>
  `).join('');

  container.insertAdjacentHTML('beforeend', `
    <div class="section" id="linksSection">
      <div class="section-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span class="section-title">Links Performance</span>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Link</th>
              <th>Unique Clicks</th>
              <th>% of All Unique Clicks</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `);
}

function truncateUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    return u.hostname + (path.length > 50 ? path.substring(0, 50) + '…' : path);
  } catch {
    return url.length > 80 ? url.substring(0, 80) + '…' : url;
  }
}
