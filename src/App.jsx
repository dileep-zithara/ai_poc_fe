import { useEffect, useState } from "react";
import BusinessProfileTab from "./components/BusinessProfileTab.jsx";
import DocumentsTab from "./components/DocumentsTab.jsx";
import AdContextTab from "./components/AdContextTab.jsx";
import WebSourcesTab from "./components/WebSourcesTab.jsx";
import PlaygroundTab from "./components/PlaygroundTab.jsx";
import ModelSettingsTab from "./components/ModelSettingsTab.jsx";
import CustomizeTab from "./components/CustomizeTab.jsx";
import { listDocuments, listAdContexts, listWebSources, listModelProviders, getModelConfig, getCatalogStatus } from "./api.js";
import {
  Building2,
  FileText,
  Globe2,
  Menu,
  MessageSquareText,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

const TAB_STORAGE_KEY = "zithara.activeTab";
const LEGACY_TABS = { setup: "business-profile" };

const TABS = [
  { id: "business-profile", label: "Business Profile", hint: "Brand and stores", icon: Building2, component: BusinessProfileTab },
  { id: "documents", label: "Documents", hint: "Upload files", icon: FileText, component: DocumentsTab },
  { id: "ad-context", label: "Ad Source Context", hint: "Link ads to products", icon: Sparkles, component: AdContextTab },
  { id: "web-sources", label: "Web Sources", hint: "Website pages", icon: Globe2, component: WebSourcesTab },
  { id: "playground", label: "Playground", hint: "Test chat", icon: MessageSquareText, component: PlaygroundTab },
  { id: "model-settings", label: "Model Settings", hint: "API keys", icon: SlidersHorizontal, component: ModelSettingsTab },
  { id: "customize", label: "Customize", hint: "Reply options", icon: Settings2, component: CustomizeTab },
];

function resolveTabId(id) {
  return LEGACY_TABS[id] || id;
}

function isTabId(id) {
  return TABS.some((tab) => tab.id === id);
}

function readSavedTab() {
  const fromHash = resolveTabId(window.location.hash.replace(/^#/, ""));
  if (isTabId(fromHash)) return fromHash;
  try {
    const saved = resolveTabId(localStorage.getItem(TAB_STORAGE_KEY));
    if (isTabId(saved)) return saved;
  } catch {
    /* ignore */
  }
  return "playground";
}

export default function App() {
  const [active, setActive] = useState(readSavedTab);
  const [navOpen, setNavOpen] = useState(false);
  const [overview, setOverview] = useState({ sources: 0, providersReady: 0, providersTotal: 4, catalog: null });
  const activeTab = TABS.find((t) => t.id === active) || TABS.find((t) => t.id === "playground");
  const ActiveComponent = activeTab.component;

  useEffect(() => {
    try { localStorage.setItem(TAB_STORAGE_KEY, active); } catch { /* ignore */ }
    const hash = `#${active}`;
    if (window.location.hash !== hash) history.replaceState(null, "", hash);
  }, [active]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listDocuments().catch(() => []),
      listAdContexts().catch(() => []),
      listWebSources().catch(() => []),
      listModelProviders().catch(() => []),
      getModelConfig().catch(() => ({ providers: [] })),
      getCatalogStatus().catch(() => null),
    ]).then(([docs, ads, webs, providers, cfg, catalog]) => {
      if (cancelled) return;
      const sourceCount = [docs, ads, webs].reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
      const ready = Array.isArray(cfg.providers) ? cfg.providers.filter((p) => p.hasApiKey).length : 0;
      setOverview({
        sources: sourceCount,
        providersReady: ready,
        providersTotal: Array.isArray(providers) && providers.length ? providers.length : 4,
        catalog,
      });
    });
    return () => { cancelled = true; };
  }, [active]);

  useEffect(() => {
    function onHashChange() {
      const id = resolveTabId(window.location.hash.replace(/^#/, ""));
      if (isTabId(id)) setActive(id);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className={`app-shell${active === "playground" ? " is-playground" : ""}`}>
      <header className="app-header">
        <div className="app-brand">
          <span className="app-brand-mark">Z</span>
          <div className="app-brand-copy">
            <span>Zithara AI Layer</span>
            <small>Tyaani Agent</small>
          </div>
        </div>
        <div className="header-page-meta">
          <span>{activeTab.label}</span>
        </div>
        <div className="header-actions">
          <button className="mobile-menu-button" type="button" onClick={() => setNavOpen(true)} aria-label="Open navigation">
            <Menu size={18} strokeWidth={1.8} />
          </button>
          <button className="header-ghost-button" type="button" onClick={() => { setActive("playground"); setNavOpen(false); }}>
            <MessageSquareText size={14} strokeWidth={1.8} />
            <span>Playground</span>
          </button>
        </div>
      </header>
      <div className="app-workspace">
        {navOpen && <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={() => setNavOpen(false)} />}
        <aside className={`app-sidebar${navOpen ? " mobile-open" : ""}`} aria-label="Knowledge base navigation">
          <div className="sidebar-mobile-heading">
            <span>Navigation</span>
            <button type="button" onClick={() => setNavOpen(false)} aria-label="Close navigation"><X size={18} /></button>
          </div>
          <div className="sidebar-label">Configuration</div>
          <nav className="sidebar-nav">
            {TABS.map((t) => (
              <SidebarLink key={t.id} tab={t} active={active === t.id} onClick={() => { setActive(t.id); setNavOpen(false); }} />
            ))}
          </nav>
          <div className="sidebar-overview">
            <div className="sidebar-label">Quick overview</div>
            <div className="overview-card">
              <div className="overview-title">Knowledge base</div>
              <div className="overview-value">{overview.sources}</div>
              <div className="overview-caption">sources configured</div>
              <div className="overview-progress">
                <span style={{ width: `${Math.min(100, overview.sources * 12)}%` }} />
              </div>
              <div className="overview-row">
                <div>
                  <div className="overview-title">Tyaani catalog</div>
                  <div className="overview-ready">
                    {overview.catalog?.ok ? overview.catalog.productCount.toLocaleString() : "—"}
                  </div>
                  <div className="overview-caption">
                    {overview.catalog?.ok ? "products live" : overview.catalog?.configured ? "not reachable" : "set ZITHARA_PROD_DATABASE_URL"}
                  </div>
                </div>
                <span className={`overview-check${overview.catalog?.ok ? " is-ready" : ""}`}>
                  {overview.catalog?.ok ? "✓" : "–"}
                </span>
              </div>
            </div>
          </div>
        </aside>
        <main className={`app-content${active === "playground" ? " is-fill" : ""}`}>
          <ActiveComponent onNavigate={setActive} />
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ tab, active, onClick }) {
  const Icon = tab.icon;
  return (
    <button onClick={onClick} className={`sidebar-link${active ? " active" : ""}`}>
      <Icon className="sidebar-icon" size={16} strokeWidth={1.8} aria-hidden="true" />
      <span className="sidebar-link-copy">
        <span>{tab.label}</span>
        <small>{tab.hint}</small>
      </span>
    </button>
  );
}
