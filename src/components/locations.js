// ═══════════════════════════════════════════════════════════
// Top Locations Component
// Country table with flags + interactive Leaflet map
// ═══════════════════════════════════════════════════════════

import L from 'leaflet';

let mapInstance = null;

// Country coordinates for map markers
const COUNTRY_COORDS = {
  AU: { lat: -25.2744, lng: 133.7751, name: 'Australia' },
  NZ: { lat: -40.9006, lng: 174.886, name: 'New Zealand' },
  SG: { lat: 1.3521, lng: 103.8198, name: 'Singapore' },
  US: { lat: 37.0902, lng: -95.7129, name: 'United States' },
  GB: { lat: 55.3781, lng: -3.436, name: 'United Kingdom' },
  CA: { lat: 56.1304, lng: -106.3468, name: 'Canada' },
  IN: { lat: 20.5937, lng: 78.9629, name: 'India' },
  DE: { lat: 51.1657, lng: 10.4515, name: 'Germany' },
  JP: { lat: 36.2048, lng: 138.2529, name: 'Japan' },
  FR: { lat: 46.2276, lng: 2.2137, name: 'France' },
};

// Country code to flag emoji
function countryFlag(code) {
  const flags = {
    AU: '🇦🇺', NZ: '🇳🇿', SG: '🇸🇬', US: '🇺🇸', GB: '🇬🇧',
    CA: '🇨🇦', IN: '🇮🇳', DE: '🇩🇪', JP: '🇯🇵', FR: '🇫🇷',
  };
  return flags[code] || '🌍';
}

export function renderLocations(container, data) {
  // Aggregate locations across all emails
  const locationMap = new Map();
  let totalOpens = 0;

  data.emails.forEach((email) => {
    email.locations.forEach((loc) => {
      const existing = locationMap.get(loc.code) || {
        country: loc.country,
        code: loc.code,
        uniqueOpens: 0,
      };
      existing.uniqueOpens += loc.uniqueOpens;
      locationMap.set(loc.code, existing);
    });
    totalOpens += email.uniqueOpens;
  });

  const locations = [...locationMap.values()]
    .sort((a, b) => b.uniqueOpens - a.uniqueOpens)
    .map((loc) => ({
      ...loc,
      percentOfOpens: totalOpens > 0 ? ((loc.uniqueOpens / totalOpens) * 100).toFixed(2) : 0,
    }));

  const rows = locations.map((loc) => `
    <tr>
      <td class="country-flag">
        <span class="flag-emoji">${countryFlag(loc.code)}</span>
        ${loc.country}
      </td>
      <td class="number-cell">${loc.uniqueOpens.toLocaleString()}</td>
      <td class="rate-cell high">${loc.percentOfOpens}%</td>
    </tr>
  `).join('');

  container.insertAdjacentHTML('beforeend', `
    <div class="section" id="locationsSection">
      <div class="section-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-pink)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <span class="section-title">Top Locations Performance</span>
      </div>
      <div class="locations-grid">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Unique Opens</th>
                <th>% of Opens</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
        <div class="map-container" id="mapContainer"></div>
      </div>
    </div>
  `);

  // Initialize map after DOM update
  requestAnimationFrame(() => {
    initMap(locations);
  });
}

function initMap(locations) {
  const mapEl = document.getElementById('mapContainer');
  if (!mapEl) return;

  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  mapInstance = L.map(mapEl, {
    center: [-10, 140],
    zoom: 2,
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 6,
    minZoom: 1,
  }).addTo(mapInstance);

  // Add markers for each location
  locations.forEach((loc) => {
    const coords = COUNTRY_COORDS[loc.code];
    if (!coords) return;

    const size = Math.max(12, Math.min(40, loc.uniqueOpens / 10));

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: ${size}px;
        height: ${size}px;
        background: rgba(99, 102, 241, 0.6);
        border: 2px solid rgba(99, 102, 241, 0.9);
        border-radius: 50%;
        box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 9px;
        font-weight: 700;
        font-family: Inter, sans-serif;
      ">${loc.uniqueOpens}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });

    L.marker([coords.lat, coords.lng], { icon })
      .bindPopup(`
        <div style="font-family: Inter, sans-serif; font-size: 12px; color: #1f2937;">
          <strong>${countryFlag(loc.code)} ${loc.country}</strong><br/>
          Opens: <strong>${loc.uniqueOpens.toLocaleString()}</strong><br/>
          Share: <strong>${loc.percentOfOpens}%</strong>
        </div>
      `)
      .addTo(mapInstance);
  });

  // Force resize on next frame
  setTimeout(() => {
    mapInstance.invalidateSize();
  }, 200);
}
