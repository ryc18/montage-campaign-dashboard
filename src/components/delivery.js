// ═══════════════════════════════════════════════════════════
// Delivery Section — Donut Chart + Stat Breakdown
// Replaces plain number cards with a visual donut chart
// ═══════════════════════════════════════════════════════════

import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

let donutChart = null;

export function renderDelivery(container, data) {
  const { aggregated } = data;

  const deliveryItems = [
    { label: 'Delivered', value: aggregated.delivered, color: '#10b981', icon: '✓' },
    { label: 'Bounced', value: aggregated.bounced, color: '#f59e0b', icon: '↩' },
    { label: 'Unsubscribed', value: aggregated.unsubscribed, color: '#ec4899', icon: '✕' },
    { label: 'Spam', value: aggregated.spam, color: '#64748b', icon: '⚠' },
    { label: 'Not Sent', value: aggregated.notSent, color: '#f43f5e', icon: '∅' },
  ];

  const totalAttempted = aggregated.sent + aggregated.notSent;
  const deliveryRate = aggregated.sent > 0
    ? ((aggregated.delivered / aggregated.sent) * 100).toFixed(1)
    : 0;

  container.insertAdjacentHTML('beforeend', `
    <div class="section" id="deliverySection">
      <div class="section-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        <span class="section-title">Delivery</span>
      </div>

      <div class="delivery-visual">
        <!-- Donut chart side -->
        <div class="donut-wrapper">
          <div class="donut-canvas-container">
            <canvas id="deliveryDonut"></canvas>
            <div class="donut-center-label">
              <div class="donut-center-value">${deliveryRate}%</div>
              <div class="donut-center-text">Delivery Rate</div>
            </div>
          </div>
        </div>

        <!-- Stats breakdown side -->
        <div class="delivery-breakdown-list">
          ${deliveryItems.map(item => {
    const pct = aggregated.sent > 0
      ? ((item.value / (aggregated.sent + aggregated.notSent)) * 100).toFixed(1)
      : 0;
    return `
              <div class="delivery-stat-row">
                <div class="delivery-stat-left">
                  <span class="delivery-dot" style="background: ${item.color}"></span>
                  <span class="delivery-stat-label">${item.label}</span>
                </div>
                <div class="delivery-stat-right">
                  <span class="delivery-stat-value">${item.value.toLocaleString()}</span>
                  <span class="delivery-stat-pct">${pct}%</span>
                </div>
              </div>`;
  }).join('')}
          <div class="delivery-stat-row delivery-stat-total">
            <div class="delivery-stat-left">
              <span class="delivery-dot" style="background: transparent"></span>
              <span class="delivery-stat-label">Total Attempted</span>
            </div>
            <div class="delivery-stat-right">
              <span class="delivery-stat-value">${totalAttempted.toLocaleString()}</span>
              <span class="delivery-stat-pct">100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  // Render donut chart
  requestAnimationFrame(() => {
    const canvas = document.getElementById('deliveryDonut');
    if (!canvas) return;

    if (donutChart) donutChart.destroy();

    donutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: deliveryItems.map(d => d.label),
        datasets: [{
          data: deliveryItems.map(d => d.value),
          backgroundColor: deliveryItems.map(d => d.color),
          borderColor: 'rgba(15, 23, 42, 0.8)',
          borderWidth: 3,
          hoverBorderColor: 'rgba(255, 255, 255, 0.2)',
          hoverBorderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            titleFont: { weight: 'bold', size: 13 },
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = ((ctx.raw / total) * 100).toFixed(1);
                return ` ${ctx.raw.toLocaleString()} (${pct}%)`;
              },
            },
          },
        },
        animation: {
          animateRotate: true,
          duration: 1000,
          easing: 'easeOutQuart',
        },
      },
    });
  });
}
