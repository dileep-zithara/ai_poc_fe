import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Settings2 } from "lucide-react";
import { listModelProviders, getModelConfig, saveProviderCredential, setActiveModel } from "../api.js";
import PageHeader from "./PageHeader.jsx";
import LoadingState from "./LoadingState.jsx";

export default function ModelSettingsTab() {
  const [providers, setProviders] = useState([]);
  const [status, setStatus] = useState([]);
  const [active, setActive] = useState({ provider: "", model: "" });
  const [activeModelChoice, setActiveModelChoice] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [keyDrafts, setKeyDrafts] = useState({});
  const [savingProvider, setSavingProvider] = useState("");
  const [activeMsg, setActiveMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [providerList, cfg] = await Promise.all([listModelProviders(), getModelConfig()]);
    setProviders(providerList);
    setStatus(cfg.providers);
    setActive({ provider: cfg.provider, model: cfg.model });
    const providerDef = providerList.find((p) => p.id === cfg.provider);
    const known = providerDef?.models.includes(cfg.model);
    setActiveModelChoice(known ? cfg.model : "__custom__");
    setCustomModel(known ? "" : cfg.model);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  function draftFor(providerId) {
    return keyDrafts[providerId] || { apiKey: "", baseURL: status.find((s) => s.id === providerId)?.baseURL || "" };
  }

  function updateDraft(providerId, patch) {
    setKeyDrafts((d) => ({ ...d, [providerId]: { ...draftFor(providerId), ...patch } }));
  }

  async function saveKey(providerId) {
    setSavingProvider(providerId);
    const draft = draftFor(providerId);
    await saveProviderCredential(providerId, { apiKey: draft.apiKey || undefined, baseURL: draft.baseURL || undefined });
    setKeyDrafts((d) => ({ ...d, [providerId]: { apiKey: "", baseURL: draft.baseURL } }));
    await refresh();
    setSavingProvider("");
  }

  function onActiveProviderChange(providerId) {
    const p = providers.find((x) => x.id === providerId);
    setActive({ provider: providerId, model: p?.models[0] || "" });
    setActiveModelChoice(p?.models[0] || "__custom__");
    setCustomModel("");
  }

  async function saveActive() {
    const finalModel = activeModelChoice === "__custom__" ? customModel.trim() : activeModelChoice;
    if (!finalModel) {
      setActiveMsg("Enter a model name first.");
      return;
    }
    setActiveMsg("Saving…");
    const result = await setActiveModel({ provider: active.provider, model: finalModel });
    if (result.error) {
      setActiveMsg(`Error: ${result.error}`);
      return;
    }
    setActiveMsg("Saved");
    await refresh();
  }

  if (loading) return <LoadingState label="Loading model settings…" />;

  const activeProviderDef = providers.find((p) => p.id === active.provider);
  const readyCount = status.filter((s) => s.hasApiKey).length;

  return (
    <div className="page model-settings-page">
      <PageHeader
        icon={Settings2}
        title="Model Settings"
      />

      <section className="card model-active-card">
        <div className="surface-heading">
          <span className="surface-icon"><Settings2 size={16} /></span>
          <div>
            <h3>Active model</h3>
          </div>
        </div>
        <div className="model-active-fields">
          <div>
            <label className="field-label">Provider</label>
            <select className="input" value={active.provider} onChange={(e) => onActiveProviderChange(e.target.value)}>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Model</label>
            <select className="input" value={activeModelChoice} onChange={(e) => setActiveModelChoice(e.target.value)}>
              {activeProviderDef?.models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              {activeProviderDef?.allowCustomModel && <option value="__custom__">Custom model name…</option>}
            </select>
          </div>
        </div>
        {activeModelChoice === "__custom__" && (
          <input
            value={customModel}
            onChange={(e) => setCustomModel(e.target.value)}
            placeholder="e.g. gpt-4o-2024-11-20, deepseek-chat, llama-3.1-70b…"
            className="input"
          />
        )}
        <button onClick={saveActive} className="btn btn-primary"><CheckCircle2 size={14} /> Save</button>
        {activeMsg && <span className="field-hint model-status">{activeMsg}</span>}
      </section>

      <div className="list-heading model-provider-title">
        <h3>API keys</h3>
        {readyCount > 0 && <span className="badge badge-ok"><CheckCircle2 size={12} /> {readyCount} ready</span>}
      </div>
      {providers.map((p) => {
        const s = status.find((x) => x.id === p.id);
        const draft = draftFor(p.id);
        return (
          <div key={p.id} className="card model-provider-row">
            <div className="model-provider-name">
              <span className="provider-key-icon"><KeyRound size={15} /></span>
              <strong>{p.label}</strong>
              <span className={`badge ${s?.hasApiKey ? "badge-ok" : "badge-muted"}`}>
                {s?.hasApiKey ? "✓ configured" : "not configured"}
              </span>
            </div>
            <input
              type="password"
              value={draft.apiKey}
              onChange={(e) => updateDraft(p.id, { apiKey: e.target.value })}
              placeholder={s?.hasApiKey ? "••••••••••••  (leave blank to keep)" : "Paste API key"}
              className="input"
            />
            {p.allowBaseURLOverride && (
              <input
                value={draft.baseURL}
                onChange={(e) => updateDraft(p.id, { baseURL: e.target.value })}
                placeholder={p.defaultBaseURL || "https://api.example.com/v1"}
                className="input"
              />
            )}
            <button onClick={() => saveKey(p.id)} disabled={savingProvider === p.id} className="btn btn-secondary btn-sm">
              {savingProvider === p.id ? "Saving…" : "Save key"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
