const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4200/api";

export async function uploadDocument(file, label) {
  const form = new FormData();
  form.append("file", file);
  if (label) form.append("label", label);
  const res = await fetch(`${API_BASE}/documents/upload`, { method: "POST", body: form });
  return res.json();
}

export async function listDocuments() {
  const res = await fetch(`${API_BASE}/documents`);
  return res.json();
}

export async function listAdContexts() {
  const res = await fetch(`${API_BASE}/ad-context`);
  return res.json();
}

export async function createAdContext(payload) {
  const res = await fetch(`${API_BASE}/ad-context`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteAdContext(id) {
  await fetch(`${API_BASE}/ad-context/${id}`, { method: "DELETE" });
}

export async function importAdCatalog(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/ad-catalog/import`, { method: "POST", body: form });
  return res.json();
}

export async function searchAdCatalog(query, offset = 0) {
  const res = await fetch(`${API_BASE}/ad-catalog?q=${encodeURIComponent(query)}&offset=${offset}&limit=25`);
  return res.json();
}

export async function getAdCatalogCount() {
  const res = await fetch(`${API_BASE}/ad-catalog/count`);
  return res.json();
}

export async function getAdCatalogEntry(adId) {
  const res = await fetch(`${API_BASE}/ad-catalog/${encodeURIComponent(adId)}`);
  return res.json();
}

export async function sendChat(sessionId, message, adId, cardId, channel, attachment, referral, customerPhone, webhook) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message, adId, cardId, channel, attachment, referral, customerPhone, webhook }),
  });
  return res.json();
}

export async function resetChat(sessionId) {
  await fetch(`${API_BASE}/chat/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
}

export async function listModelProviders() {
  const res = await fetch(`${API_BASE}/model-config/providers`);
  return res.json();
}

export async function getModelConfig() {
  const res = await fetch(`${API_BASE}/model-config`);
  return res.json();
}

export async function saveProviderCredential(provider, payload) {
  const res = await fetch(`${API_BASE}/model-config/credentials/${provider}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function setActiveModel(payload) {
  const res = await fetch(`${API_BASE}/model-config/active`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function listWebSources() {
  const res = await fetch(`${API_BASE}/web-sources`);
  return res.json();
}

export async function addWebSource(url, pageLimit) {
  const res = await fetch(`${API_BASE}/web-sources`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, pageLimit }),
  });
  return res.json();
}

export async function deleteWebSource(id) {
  await fetch(`${API_BASE}/web-sources/${id}`, { method: "DELETE" });
}

export async function getBusinessProfile() {
  const res = await fetch(`${API_BASE}/business-profile`);
  return res.json();
}

export async function saveBusinessProfile(payload) {
  const res = await fetch(`${API_BASE}/business-profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function importBusinessProfileFromWebsite(url, pageLimit) {
  const res = await fetch(`${API_BASE}/business-profile/import-from-website`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, pageLimit }),
  });
  return res.json();
}

export async function getAgentSettings() {
  const res = await fetch(`${API_BASE}/agent-settings`);
  return res.json();
}

export async function saveAgentSettings(payload) {
  const res = await fetch(`${API_BASE}/agent-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function listHandoffs() {
  const res = await fetch(`${API_BASE}/agent-settings/handoffs`);
  return res.json();
}

export async function resumeHandoff(sessionId) {
  await fetch(`${API_BASE}/agent-settings/handoffs/${sessionId}/resume`, { method: "POST" });
}

export async function resumeAllHandoffs() {
  await fetch(`${API_BASE}/agent-settings/handoffs/resume-all`, { method: "POST" });
}

export async function getCatalogStatus() {
  const res = await fetch(`${API_BASE}/catalog/status`);
  return res.json();
}

export async function searchCatalog(query) {
  const res = await fetch(`${API_BASE}/catalog/search?q=${encodeURIComponent(query)}`);
  return res.json();
}

export async function listLiveAdSets(query = "") {
  const res = await fetch(`${API_BASE}/catalog/adsets?q=${encodeURIComponent(query)}`);
  return res.json();
}

export async function searchLiveAds(query = "", adSetIds = []) {
  const params = new URLSearchParams({ q: query });
  if (adSetIds.length) params.set("adSetIds", adSetIds.join(","));
  const res = await fetch(`${API_BASE}/catalog/ads?${params}`);
  return res.json();
}

export function getSavedAdSets() {
  try {
    const named = JSON.parse(localStorage.getItem("tyaani.adSets") || "null");
    if (Array.isArray(named) && named.length) {
      return named.filter((row) => row?.adSetId).map((row) => ({
        adSetId: String(row.adSetId),
        name: row.name || String(row.adSetId),
      }));
    }
    const ids = JSON.parse(localStorage.getItem("tyaani.adSetIds") || "[]");
    return (Array.isArray(ids) ? ids : []).map((adSetId) => ({ adSetId: String(adSetId), name: String(adSetId) }));
  } catch {
    return [];
  }
}

export function saveAdSets(sets) {
  const next = (Array.isArray(sets) ? sets : [])
    .filter((row) => row?.adSetId)
    .map((row) => ({ adSetId: String(row.adSetId), name: row.name || String(row.adSetId) }));
  localStorage.setItem("tyaani.adSets", JSON.stringify(next));
  localStorage.setItem("tyaani.adSetIds", JSON.stringify(next.map((row) => row.adSetId)));
  return next;
}

