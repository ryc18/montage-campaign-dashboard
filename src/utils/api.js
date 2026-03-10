// ═══════════════════════════════════════════════════════════
// API Client — fetches data from Express backend
// ═══════════════════════════════════════════════════════════

const API_BASE = '/api';

export async function fetchCampaigns() {
    const res = await fetch(`${API_BASE}/campaigns`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch campaigns');
    return json.data;
}

export async function fetchCampaignDetail(id) {
    const res = await fetch(`${API_BASE}/campaigns/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch campaign');
    return json.data;
}
