// ═══════════════════════════════════════════════════════════
// Engagement Component
// Renders unique opens, unique clicks, and rate metrics
// ═══════════════════════════════════════════════════════════

export function renderEngagement(container, data) {
    const { aggregated } = data;

    container.innerHTML = `
    <div class="section" id="engagementSection">
      <div class="section-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-indigo)" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        <span class="section-title">Campaign Engagement</span>
      </div>

      <div class="stat-grid">
        <div class="stat-card indigo">
          <div class="stat-value indigo">${animateNumber(aggregated.uniqueOpens)}</div>
          <div class="stat-label">Unique Opens</div>
          <div class="stat-sub">Total opens: ${aggregated.totalOpens.toLocaleString()}</div>
        </div>
        <div class="stat-card emerald">
          <div class="stat-value emerald">${animateNumber(aggregated.uniqueClicks)}</div>
          <div class="stat-label">Unique Clicks</div>
          <div class="stat-sub">Total clicks: ${aggregated.totalClicks.toLocaleString()}</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-value amber">${animateNumber(aggregated.replied)}</div>
          <div class="stat-label">Replied</div>
        </div>
        <div class="stat-card rose">
          <div class="stat-value blue">${aggregated.sent.toLocaleString()}</div>
          <div class="stat-label">Total Sent</div>
        </div>
      </div>

      <div class="rate-grid">
        <div class="rate-card">
          <div class="rate-value">${aggregated.openRate}%</div>
          <div class="rate-label">Open / Sent</div>
        </div>
        <div class="rate-card">
          <div class="rate-value">${aggregated.clickRate}%</div>
          <div class="rate-label">Click / Sent</div>
        </div>
        <div class="rate-card">
          <div class="rate-value">${aggregated.clickThroughRate}%</div>
          <div class="rate-label">Click / Opened</div>
        </div>
        <div class="rate-card">
          <div class="rate-value">${aggregated.replyRate}%</div>
          <div class="rate-label">Reply / Opened</div>
        </div>
      </div>
    </div>
  `;
}

function animateNumber(num) {
    return `<span class="counter-animate" data-target="${num}">${num.toLocaleString()}</span>`;
}
