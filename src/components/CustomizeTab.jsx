import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { getAgentSettings, saveAgentSettings, listHandoffs, resumeHandoff, resumeAllHandoffs } from "../api.js";
import PageHeader from "./PageHeader.jsx";
import LoadingState from "./LoadingState.jsx";

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track"><span className="toggle-thumb" /></span>
    </label>
  );
}

function ToggleRow({ label, hint, checked, onChange, disabled }) {
  return (
    <div className={`toggle-row${disabled ? " is-disabled" : ""}`}>
      <div className="toggle-copy">
        <strong>{label}</strong>
        {hint && <div className="field-hint">{hint}</div>}
      </div>
      <Toggle checked={checked} onChange={disabled ? () => {} : onChange} />
    </div>
  );
}

export default function CustomizeTab() {
  const [settings, setSettings] = useState(null);
  const [saveMsg, setSaveMsg] = useState("");
  const [handoffs, setHandoffs] = useState([]);

  useEffect(() => { refresh(); refreshHandoffs(); }, []);
  function refresh() {
    getAgentSettings().then((row) => {
      const next = {
        ...row,
        shadowMode: false,
        productCatalogSearch: true,
        aiNudgeEnabled: true,
      };
      setSettings(next);
      saveAgentSettings(next);
    });
  }
  function refreshHandoffs() { listHandoffs().then(setHandoffs); }

  function set(key, value) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function save() {
    setSaveMsg("Saving…");
    const result = await saveAgentSettings({
      ...settings,
      shadowMode: false,
      productCatalogSearch: true,
    });
    setSettings(result);
    setSaveMsg("Saved ✓");
  }

  async function resume(sessionId) {
    await resumeHandoff(sessionId);
    refreshHandoffs();
  }

  async function resumeAll() {
    await resumeAllHandoffs();
    refreshHandoffs();
  }

  if (!settings) return <LoadingState label="Loading agent settings…" />;

  return (
    <div className="page customize-page">
      <PageHeader
        icon={Settings2}
        title="Customize"
      />

      <div className="card customize-card">
        <h3>Agent</h3>
        <label className="field-label">Name</label>
        <input className="input" value={settings.agentName || ""} onChange={(e) => set("agentName", e.target.value)} placeholder="Tyaani" />
        <label className="field-label">Gender for speech</label>
        <select className="input" value={settings.agentGender || "female"} onChange={(e) => set("agentGender", e.target.value)}>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="neutral">Neutral</option>
        </select>
        <p className="field-hint">Used in any language the customer writes — Hindi, Telugu, Kannada, Tamil, French, and others — so first-person forms match the agent.</p>
      </div>

      <div className="card customize-card">
        <h3>Replies</h3>
        <ToggleRow
          label="AI replies"
          checked={settings.aiEnabled}
          onChange={(v) => set("aiEnabled", v)}
        />
        <ToggleRow
          label="Hand off to a person"
          checked={settings.humanHandoffEnabled}
          onChange={(v) => set("humanHandoffEnabled", v)}
        />
        <ToggleRow
          label="AI nudge"
          checked={settings.aiNudgeEnabled}
          onChange={(v) => set("aiNudgeEnabled", v)}
        />
      </div>

      <div className="page-actions">
        <button className="btn btn-primary" onClick={save}>Save</button>
        {saveMsg && <span className="field-hint">{saveMsg}</span>}
      </div>

      <div className="card handoff-card">
        <div className="handoff-header">
          <h3>AI Handoffed conversations</h3>
          <div className="handoff-actions">
            <button className="btn btn-secondary btn-sm" onClick={refreshHandoffs}>Refresh</button>
            <button className="btn btn-primary btn-sm" onClick={resumeAll} disabled={handoffs.length === 0}>
              Enable AI for all ({handoffs.length})
            </button>
          </div>
        </div>
        <p className="field-hint">Chats waiting for a person.</p>
        {handoffs.length === 0 ? (
          <div className="status-banner ok">No conversations paused right now.</div>
        ) : (
          handoffs.map((h) => (
            <div key={h.sessionId} className="list-card">
              <button className="btn btn-secondary btn-sm row-action" onClick={() => resume(h.sessionId)}>
                Resume AI
              </button>
              <div className="list-card-title">{h.sessionId}</div>
              <div className="field-hint">{h.handoffReason || "handed off"}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
