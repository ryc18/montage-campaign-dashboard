// ═══════════════════════════════════════════════════════════
// Performance Over Time Chart Component
// Line chart: Campaigns Sent, Unique Clicks, Unique Opens
// ═══════════════════════════════════════════════════════════

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

let chartInstance = null;

export function renderPerformanceChart(container, data) {
    // Merge performance data from all emails
    const dateMap = new Map();
    data.emails.forEach((email) => {
        email.performanceOverTime.forEach((point) => {
            const existing = dateMap.get(point.date) || { campaignsSent: 0, uniqueClicks: 0, uniqueOpens: 0 };
            existing.campaignsSent += point.campaignsSent;
            existing.uniqueClicks += point.uniqueClicks;
            existing.uniqueOpens += point.uniqueOpens;
            dateMap.set(point.date, existing);
        });
    });

    const sorted = [...dateMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const labels = sorted.map(([d]) => formatDate(d));
    const campaignsSent = sorted.map(([, v]) => v.campaignsSent);
    const uniqueClicks = sorted.map(([, v]) => v.uniqueClicks);
    const uniqueOpens = sorted.map(([, v]) => v.uniqueOpens);

    container.insertAdjacentHTML('beforeend', `
    <div class="section" id="chartSection">
      <div class="section-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
        <span class="section-title">Performance over Time</span>
      </div>
      <div class="chart-container">
        <div class="chart-canvas-wrapper">
          <canvas id="performanceChart"></canvas>
        </div>
      </div>
    </div>
  `);

    // Render chart after DOM is updated
    requestAnimationFrame(() => {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;

        if (chartInstance) {
            chartInstance.destroy();
        }

        const ctx = canvas.getContext('2d');

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Campaigns Sent',
                        data: campaignsSent,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderWidth: 2,
                        pointRadius: 5,
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: '#1f2937',
                        pointBorderWidth: 2,
                        tension: 0.3,
                        fill: false,
                    },
                    {
                        label: 'Unique Clicks',
                        data: uniqueClicks,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        pointRadius: 5,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#1f2937',
                        pointBorderWidth: 2,
                        tension: 0.3,
                        fill: false,
                    },
                    {
                        label: 'Unique Opens',
                        data: uniqueOpens,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        pointRadius: 5,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#1f2937',
                        pointBorderWidth: 2,
                        tension: 0.3,
                        fill: true,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Inter', size: 11 },
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 16,
                        },
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        titleFont: { family: 'Inter', weight: '600' },
                        bodyFont: { family: 'Inter' },
                    },
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255,255,255,0.04)',
                            drawBorder: false,
                        },
                        ticks: {
                            color: '#64748b',
                            font: { family: 'Inter', size: 10 },
                        },
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255,255,255,0.04)',
                            drawBorder: false,
                        },
                        ticks: {
                            color: '#64748b',
                            font: { family: 'Inter', size: 10 },
                            stepSize: 1,
                        },
                    },
                },
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart',
                },
            },
        });
    });
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
