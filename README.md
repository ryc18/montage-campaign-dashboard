# 📊 Montage Campaign Dashboard

> **Premium Pipedrive Campaign Analytics Dashboard** built for [Roger Roger Marketing](https://rogerroger.marketing)

🔗 **Live Demo:** [montage-campaign-dashboard.vercel.app](https://montage-campaign-dashboard.vercel.app/)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **Campaign Overview** | Real-time engagement metrics — opens, clicks, replies, bounce rates |
| 📧 **Email Detail Modal** | Click any email row to drill down into per-email stats, engagement funnels, delivery breakdown, geographic performance, and recipient-level tracking |
| 🤖 **AI Insights Panel** | Automatically generated smart observations — top performers, A/B test winners, click engagement quality, bounce alerts, and optimal send day analysis |
| 🍩 **Delivery Donut Chart** | Interactive Chart.js visualization showing delivery rate, bounces, unsubscribes, spam, and not-sent |
| 📈 **Performance Over Time** | Line chart tracking campaigns sent, unique clicks, and unique opens over time |
| 🔀 **Sortable Tables** | Click any column header to sort ascending/descending with visual indicators |
| 📤 **CSV & PDF Export** | One-click export of campaign data to CSV or print-friendly PDF report |
| 🌍 **Geographic Map** | Leaflet-powered interactive map showing email open locations by country |
| 🔗 **Link Performance** | Aggregated link click tracking with percentage breakdowns |

## 🎨 Design

- **Dark mode** glassmorphism aesthetic with smooth gradients
- **Animated RRM branding** — Roger Roger Marketing logo cycles through coral, mustard, sky, and aqua brand colors
- **Responsive** sidebar navigation with campaign switching
- **Micro-animations** for enhanced user engagement
- Premium typography via [Google Fonts (Inter)](https://fonts.google.com/specimen/Inter)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla JS + Vite |
| **Charts** | Chart.js 4.x |
| **Maps** | Leaflet.js |
| **Backend** | Express.js (Vercel Serverless Functions) |
| **Deployment** | Vercel |
| **Styling** | Custom CSS with design tokens |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install & Run

```bash
# Install dependencies
npm install

# Start the API server
npm run server

# Start the dev server (in another terminal)
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npx vercel --prod
```

## 📁 Project Structure

```
├── api/                    # Vercel serverless functions
│   └── index.js            # Express API wrapper
├── server/
│   ├── index.js            # Express server (local dev)
│   └── routes/
│       └── campaigns.js    # Campaign data & aggregation
├── src/
│   ├── index.html          # Main HTML entry
│   ├── main.js             # App controller & routing
│   ├── style.css           # Design system & styles
│   ├── utils/
│   │   └── api.js          # API client
│   └── components/
│       ├── engagement.js   # Engagement metric cards
│       ├── email-table.js  # Sortable email table
│       ├── email-detail.js # Email detail modal
│       ├── delivery.js     # Donut chart delivery
│       ├── chart.js        # Performance line chart
│       ├── insights.js     # AI Insights panel
│       ├── export.js       # CSV & PDF export
│       ├── links-table.js  # Link performance table
│       └── locations.js    # Geographic map & table
├── vercel.json             # Vercel config
├── vite.config.js          # Vite config
└── package.json
```

## 🔑 What Makes This Different from Pipedrive

1. **AI-Powered Insights** — Automatic analysis that surfaces actionable observations from campaign data
2. **Engagement Funnels** — Visual funnel from Sent → Delivered → Opened → Clicked → Replied
3. **One-Click Export** — Download campaign reports as CSV or PDF instantly
4. **Geographic Visualization** — Interactive map showing email engagement by country
5. **Cross-Campaign Analytics** — Aggregated metrics across multiple emails per campaign

## 📝 License

ISC © [Roger Roger Marketing](https://rogerroger.marketing)
