// ═══════════════════════════════════════════════════════════
// Export Utility — CSV and PDF export
// ═══════════════════════════════════════════════════════════

export function exportToCSV(data) {
    const { emails, aggregated, name } = data;

    const headers = [
        'Email Subject', 'Sent', 'Delivered', 'Bounced', 'Opened',
        'Open Rate (%)', 'Clicked', 'Click Rate (%)', 'CTR (%)',
        'Replied', 'Reply Rate (%)', 'Unsubscribed', 'Not Sent'
    ];

    const rows = emails.map(e => [
        `"${e.subject.replace(/"/g, '""')}"`,
        e.sent, e.delivered, e.bounced, e.uniqueOpens,
        e.openRate, e.uniqueClicks, e.clickRate, e.clickThroughRate,
        e.replied, e.replyRate, e.unsubscribed, e.notSent,
    ].join(','));

    const totalRow = [
        '"TOTALS"',
        aggregated.sent, aggregated.delivered, aggregated.bounced, aggregated.uniqueOpens,
        aggregated.openRate, aggregated.uniqueClicks, aggregated.clickRate, aggregated.clickThroughRate,
        aggregated.replied, aggregated.replyRate, aggregated.unsubscribed || 0, aggregated.notSent || 0,
    ].join(',');

    const csv = [headers.join(','), ...rows, totalRow].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    link.href = URL.createObjectURL(blob);
    link.download = `${safeName}_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

export function exportToPDF(data) {
    const { emails, aggregated, name, status } = data;
    const date = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

    // Build a print-friendly HTML document
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${name} — Campaign Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; font-size: 12px; }
    .header { border-bottom: 3px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 22px; color: #1e293b; margin-bottom: 4px; }
    .header-meta { font-size: 11px; color: #64748b; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .badge-active { background: #dcfce7; color: #16a34a; }
    h2 { font-size: 14px; color: #6366f1; margin: 20px 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .metrics-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .metric-box { flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center; }
    .metric-value { font-size: 20px; font-weight: 800; color: #6366f1; }
    .metric-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
    th { background: #f1f5f9; padding: 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
    .totals td { font-weight: 700; background: #f8fafc; border-top: 2px solid #6366f1; color: #6366f1; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .rate-high { color: #16a34a; font-weight: 600; }
    .rate-mid { color: #d97706; font-weight: 600; }
    .rate-low { color: #dc2626; font-weight: 600; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
    @media print { body { padding: 20px; } @page { size: landscape; margin: 15mm; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(name)} <span class="badge badge-active">${status}</span></h1>
    <div class="header-meta">Campaign Report — Generated ${date} — RRM Campaign Dashboard</div>
  </div>

  <h2>Campaign Engagement</h2>
  <div class="metrics-row">
    <div class="metric-box"><div class="metric-value">${aggregated.uniqueOpens.toLocaleString()}</div><div class="metric-label">Unique Opens</div></div>
    <div class="metric-box"><div class="metric-value">${aggregated.uniqueClicks.toLocaleString()}</div><div class="metric-label">Unique Clicks</div></div>
    <div class="metric-box"><div class="metric-value">${aggregated.replied}</div><div class="metric-label">Replied</div></div>
    <div class="metric-box"><div class="metric-value">${aggregated.sent.toLocaleString()}</div><div class="metric-label">Total Sent</div></div>
  </div>
  <div class="metrics-row">
    <div class="metric-box"><div class="metric-value">${aggregated.openRate}%</div><div class="metric-label">Open Rate</div></div>
    <div class="metric-box"><div class="metric-value">${aggregated.clickRate}%</div><div class="metric-label">Click Rate</div></div>
    <div class="metric-box"><div class="metric-value">${aggregated.clickThroughRate}%</div><div class="metric-label">Click-Through Rate</div></div>
    <div class="metric-box"><div class="metric-value">${aggregated.replyRate}%</div><div class="metric-label">Reply Rate</div></div>
  </div>

  <h2>Performance by Email Subject</h2>
  <table>
    <thead>
      <tr><th>Email Subject</th><th class="num">Sent</th><th class="num">Opened</th><th class="num">Open Rate</th><th class="num">Clicked</th><th class="num">Click Rate</th><th class="num">CTR</th><th class="num">Replied</th><th class="num">Reply Rate</th></tr>
    </thead>
    <tbody>
      ${emails.map(e => `
        <tr>
          <td>${escapeHtml(e.subject)}</td>
          <td class="num">${e.sent.toLocaleString()}</td>
          <td class="num">${e.uniqueOpens.toLocaleString()}</td>
          <td class="num ${e.openRate >= 50 ? 'rate-high' : e.openRate >= 30 ? 'rate-mid' : 'rate-low'}">${e.openRate}%</td>
          <td class="num">${e.uniqueClicks.toLocaleString()}</td>
          <td class="num ${e.clickRate >= 5 ? 'rate-high' : e.clickRate >= 2 ? 'rate-mid' : 'rate-low'}">${e.clickRate}%</td>
          <td class="num">${e.clickThroughRate}%</td>
          <td class="num">${e.replied}</td>
          <td class="num">${e.replyRate}%</td>
        </tr>
      `).join('')}
      <tr class="totals">
        <td>TOTALS</td>
        <td class="num">${aggregated.sent.toLocaleString()}</td>
        <td class="num">${aggregated.uniqueOpens.toLocaleString()}</td>
        <td class="num">${aggregated.openRate}%</td>
        <td class="num">${aggregated.uniqueClicks.toLocaleString()}</td>
        <td class="num">${aggregated.clickRate}%</td>
        <td class="num">${aggregated.clickThroughRate}%</td>
        <td class="num">${aggregated.replied}</td>
        <td class="num">${aggregated.replyRate}%</td>
      </tr>
    </tbody>
  </table>

  <h2>Delivery Summary</h2>
  <div class="metrics-row">
    <div class="metric-box"><div class="metric-value" style="color:#16a34a">${aggregated.delivered.toLocaleString()}</div><div class="metric-label">Delivered</div></div>
    <div class="metric-box"><div class="metric-value" style="color:#d97706">${aggregated.bounced.toLocaleString()}</div><div class="metric-label">Bounced</div></div>
    <div class="metric-box"><div class="metric-value" style="color:#dc2626">${(aggregated.unsubscribed || 0).toLocaleString()}</div><div class="metric-label">Unsubscribed</div></div>
    <div class="metric-box"><div class="metric-value" style="color:#64748b">${aggregated.spam || 0}</div><div class="metric-label">Spam Reports</div></div>
    <div class="metric-box"><div class="metric-value" style="color:#dc2626">${(aggregated.notSent || 0).toLocaleString()}</div><div class="metric-label">Not Sent</div></div>
  </div>

  <div class="footer">RRM × CampaignHub — Confidential Report</div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400);
}

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
