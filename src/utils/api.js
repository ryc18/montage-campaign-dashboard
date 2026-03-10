// ═══════════════════════════════════════════════════════════
// API Client — fetches data from Express backend
// ═══════════════════════════════════════════════════════════

const API_BASE = '/api';

export async function fetchClients() {
    const res = await fetch(`${API_BASE}/clients`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch clients');
    return json.data;
}

export async function fetchCampaigns(client) {
    const params = client ? `?client=${encodeURIComponent(client)}` : '';
    const res = await fetch(`${API_BASE}/campaigns${params}`);
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
