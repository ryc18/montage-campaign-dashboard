// ═══════════════════════════════════════════════════════════
// AI Insights Panel — Smart observations from campaign data
// This is a UNIQUE feature that Pipedrive doesn't have
// ═══════════════════════════════════════════════════════════

const INSIGHTS = {
    // Insight generators — each returns { icon, color, title, body } or null
    generators: [
        // Best performing email
        function bestEmail(emails) {
            if (emails.length < 2) return null;
            const best = [...emails].sort((a, b) => b.openRate - a.openRate)[0];
            const avg = emails.reduce((s, e) => s + e.openRate, 0) / emails.length;
            const aboveAvg = (best.openRate - avg).toFixed(1);
            if (aboveAvg <= 0) return null;
            return {
                icon: '🏆', color: 'var(--accent-emerald)',
                title: 'Top Performer',
                body: `"${truncate(best.subject, 50)}" leads with <strong>${best.openRate}%</strong> open rate — <strong>${aboveAvg}pp</strong> above your campaign average.`,
            };
        },

        // A/B test winner
        function abTest(emails) {
            // Find pairs with very similar subjects (A/B variants)
            for (let i = 0; i < emails.length; i++) {
                for (let j = i + 1; j < emails.length; j++) {
                    if (similarity(emails[i].subject, emails[j].subject) > 0.5) {
                        const winner = emails[i].openRate >= emails[j].openRate ? emails[i] : emails[j];
                        const loser = winner === emails[i] ? emails[j] : emails[i];
                        const diff = (winner.openRate - loser.openRate).toFixed(1);
                        if (diff < 1) return null;
                        return {
                            icon: '⚡', color: 'var(--accent-violet)',
                            title: 'A/B Test Insight',
                            body: `Variant "<strong>${truncate(winner.subject, 40)}</strong>" outperformed by <strong>${diff}pp</strong> open rate. Consider using similar messaging in future sends.`,
                        };
                    }
                }
            }
            return null;
        },

        // Click engagement quality
        function clickQuality(emails, agg) {
            const ctr = parseFloat(agg.clickThroughRate);
            if (ctr >= 12) {
                return {
                    icon: '🎯', color: 'var(--accent-blue)',
                    title: 'Strong Click Engagement',
                    body: `<strong>${ctr}%</strong> of openers clicked through — this is excellent. Your content is resonating well with engaged readers.`,
                };
            } else if (ctr < 8) {
                return {
                    icon: '💡', color: 'var(--accent-amber)',
                    title: 'Click Opportunity',
                    body: `Only <strong>${ctr}%</strong> of openers are clicking. Consider stronger CTAs or more relevant link placement to improve click-through.`,
                };
            }
            return null;
        },

        // Bounce rate alert
        function bounceRate(emails, agg) {
            const rate = agg.sent > 0 ? (agg.bounced / agg.sent * 100) : 0;
            if (rate > 5) {
                return {
                    icon: '⚠️', color: 'var(--accent-rose)',
                    title: 'High Bounce Rate',
                    body: `<strong>${rate.toFixed(1)}%</strong> bounce rate detected. Consider cleaning your mailing list to improve deliverability and sender reputation.`,
                };
            } else if (rate < 2) {
                return {
                    icon: '✅', color: 'var(--accent-emerald)',
                    title: 'Clean List',
                    body: `Bounce rate is only <strong>${rate.toFixed(1)}%</strong> — your contact list is well-maintained and deliverability is healthy.`,
                };
            }
            return null;
        },

        // Reply engagement
        function replyInsight(emails, agg) {
            const rate = parseFloat(agg.replyRate);
            if (rate > 1) {
                return {
                    icon: '💬', color: 'var(--accent-cyan)',
                    title: 'Active Conversations',
                    body: `<strong>${rate}%</strong> reply rate means your emails are sparking real conversations. This level of two-way engagement is above average.`,
                };
            }
            return null;
        },

        // Volume trend
        function volumeTrend(emails) {
            if (emails.length < 3) return null;
            const sorted = [...emails].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate));
            const first = sorted[0].sent;
            const last = sorted[sorted.length - 1].sent;
            const change = ((last - first) / first * 100).toFixed(0);
            if (Math.abs(change) < 5) return null;
            return {
                icon: change > 0 ? '📈' : '📉', color: change > 0 ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                title: change > 0 ? 'Growing Audience' : 'Audience Contraction',
                body: `Send volume ${change > 0 ? 'increased' : 'decreased'} by <strong>${Math.abs(change)}%</strong> from first to latest email — ${change > 0 ? 'your list is growing.' : 'monitor for unsubscribes or list fatigue.'}`,
            };
        },

        // Best day analysis
        function bestSendDay(emails) {
            if (emails.length < 2) return null;
            const dayPerf = {};
            emails.forEach(e => {
                const day = new Date(e.sendDate).toLocaleDateString('en-US', { weekday: 'long' });
                if (!dayPerf[day]) dayPerf[day] = { opens: 0, count: 0 };
                dayPerf[day].opens += e.openRate;
                dayPerf[day].count++;
            });
            let bestDay = null, bestAvg = 0;
            for (const [day, data] of Object.entries(dayPerf)) {
                const avg = data.opens / data.count;
                if (avg > bestAvg) { bestAvg = avg; bestDay = day; }
            }
            if (!bestDay || Object.keys(dayPerf).length < 2) return null;
            return {
                icon: '📅', color: 'var(--accent-pink)',
                title: 'Optimal Send Day',
                body: `Emails sent on <strong>${bestDay}</strong> average <strong>${bestAvg.toFixed(1)}%</strong> open rate — consider scheduling more sends on this day.`,
            };
        },
    ],
};

export function renderInsights(container, data) {
    const { emails, aggregated } = data;

    // Generate insights
    const insights = INSIGHTS.generators
        .map(gen => gen(emails, aggregated))
        .filter(Boolean)
        .slice(0, 4); // Max 4 insights

    if (insights.length === 0) return;

    container.insertAdjacentHTML('beforeend', `
    <div class="section" id="insightsSection">
      <div class="section-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" stroke-width="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
        <span class="section-title">AI Insights</span>
        <span class="insight-badge">Powered by analysis</span>
      </div>
      <div class="insights-grid">
        ${insights.map(insight => `
          <div class="insight-card" style="--card-accent: ${insight.color}">
            <div class="insight-header">
              <span class="insight-icon">${insight.icon}</span>
              <span class="insight-title">${insight.title}</span>
            </div>
            <p class="insight-body">${insight.body}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `);
}

function truncate(str, max) {
    return str.length > max ? str.substring(0, max) + '…' : str;
}

function similarity(s1, s2) {
    // Simple word overlap ratio for detecting A/B variants
    const w1 = s1.toLowerCase().split(/\s+/);
    const w2 = s2.toLowerCase().split(/\s+/);
    const shared = w1.filter(w => w2.includes(w)).length;
    return shared / Math.max(w1.length, w2.length);
}
