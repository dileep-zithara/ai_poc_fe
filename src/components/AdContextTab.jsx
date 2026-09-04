import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Link2, Megaphone, Plus, Search, X } from "lucide-react";
import { listAdContexts, createAdContext, deleteAdContext, importAdCatalog, searchAdCatalog, getAdCatalogCount, searchCatalog, searchLiveAds } from "../api.js";
import AdDetailsView from "./AdDetailsView.jsx";
import PageHeader from "./PageHeader.jsx";

const EMPTY = { adId: "", cardId: "", label: "", productName: "", productPrice: "", productWeight: "", productNotes: "", instructions: "" };

export default function AdContextTab() {
  const [list, setList] = useState([]);
  const [view, setView] = useState("ads");
  const [selectedDetailAd, setSelectedDetailAd] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [catalogCount, setCatalogCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [catalogPreview, setCatalogPreview] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogNextOffset, setCatalogNextOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const [adQuery, setAdQuery] = useState("");
  const [adResults, setAdResults] = useState([]);
  const [showAdResults, setShowAdResults] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [productSearching, setProductSearching] = useState(false);
  const searchTimer = useRef(null);
  const productTimer = useRef(null);

  useEffect(() => { refresh(); refreshCatalogCount(); loadCatalog(); }, []);
  function refresh() { listAdContexts().then(setList); }
  function refreshCatalogCount() { getAdCatalogCount().then((r) => setCatalogCount(r.count)); }
  async function loadCatalog(query = "") {
    const result = await searchAdCatalog(query);
    setCatalogPreview(result.items);
    setCatalogTotal(result.total);
    setCatalogNextOffset(result.nextOffset);
  }

  async function loadMoreCatalog() {
    if (loadingMore || catalogPreview.length >= catalogTotal) return;
    setLoadingMore(true);
    const result = await searchAdCatalog(catalogSearch, catalogNextOffset);
    setCatalogPreview((items) => [...items, ...result.items]);
    setCatalogNextOffset(result.nextOffset);
    setLoadingMore(false);
  }

  function onCatalogScroll(e) {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 60) loadMoreCatalog();
  }

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function findAds(query) {
    const q = String(query || "").trim();
    try {
      const live = await searchLiveAds(q, []);
      if (Array.isArray(live.items) && live.items.length) return live.items;
    } catch {
      /* fall through to imported ads */
    }
    const imported = await searchAdCatalog(q);
    return imported.items || [];
  }

  function onAdQueryChange(value) {
    setAdQuery(value);
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 12) set("adId", digits);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setAdResults(await findAds(value));
    }, 200);
  }

  async function openAdDropdown() {
    setShowAdResults(true);
    if (adResults.length === 0) setAdResults(await findAds(adQuery));
  }

  function pickAd(entry) {
    setForm((f) => ({ ...f, adId: entry.adId, label: f.label || entry.name || entry.adId }));
    setAdQuery(entry.name || entry.adId);
    setShowAdResults(false);
  }

  function onProductQueryChange(value) {
    setProductQuery(value);
    clearTimeout(productTimer.current);
    if (!value.trim()) {
      setProductResults([]);
      return;
    }
    productTimer.current = setTimeout(async () => {
      setProductSearching(true);
      try {
        const result = await searchCatalog(value.trim());
        setProductResults(result.items || []);
      } catch {
        setProductResults([]);
      } finally {
        setProductSearching(false);
      }
    }, 200);
  }

  function pickProduct(product) {
    const price = product.price != null && product.price !== ""
      ? `₹${Number(product.price).toLocaleString("en-IN")}`
      : "";
    setForm((f) => ({
      ...f,
      productName: product.name || "",
      productPrice: price,
      productNotes: product.url || f.productNotes,
      label: product.name || f.label,
    }));
    setProductQuery(product.name || "");
    setProductResults([]);
  }

  function clearProduct() {
    setForm((f) => ({ ...f, productName: "", productPrice: "", productNotes: "", label: f.adId }));
    setProductQuery("");
    setProductResults([]);
  }

  function createMappingForAd(entry) {
    pickAd(entry);
    setSelectedDetailAd(null);
    setView("new");
  }

  async function importCatalog(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportMsg("Importing…");
    const result = await importAdCatalog(file);
    setImportMsg(result.error ? `Error: ${result.error}` : `Imported ${result.imported} of ${result.total} ads.`);
    setImporting(false);
    refreshCatalogCount();
    loadCatalog();
    e.target.value = "";
  }

  async function save() {
    const adId = form.adId.trim() || adQuery.replace(/\D/g, "");
    if (!adId) {
      setError("Search or paste the Meta Ad ID.");
      return;
    }
    if (!form.productName.trim()) {
      setError("Search the catalog and pick the product this ad is selling.");
      return;
    }
    setError("");
    setSaving(true);
    const result = await createAdContext({
      ...form,
      adId,
      label: form.productName.trim() || form.label.trim() || adId,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setForm(EMPTY);
    setAdQuery("");
    setProductQuery("");
    setProductResults([]);
    refresh();
    setView("mappings");
  }

  async function remove(id) {
    await deleteAdContext(id);
    refresh();
  }

  if (view === "new") {
    return (
      <div className="page ad-context-page">
        <div className="mapping-page-header">
          <button className="back-link" onClick={() => setView("mappings")}>← Mappings</button>
          <PageHeader
            icon={Link2}
            title="Map an ad"
          />
        </div>
        <section className="card mapping-editor">
          <div className="field field-relative">
            <div className="field-label">1. Ad</div>
            <div className="adset-search">
              <Search size={14} />
              <input
                className="input"
                placeholder="Search ad name, or paste Meta Ad ID"
                value={adQuery}
                onFocus={openAdDropdown}
                onChange={(e) => { onAdQueryChange(e.target.value); setShowAdResults(true); }}
              />
            </div>
            {showAdResults && adResults.length > 0 && (
              <div className="ad-result-menu" role="listbox">
                {adResults.slice(0, 8).map((entry) => (
                  <button type="button" role="option" key={entry.adId} onMouseDown={() => pickAd(entry)}>
                    <strong>{entry.name || "Unnamed ad"}</strong>
                    <small>{entry.adsetName || "Ad"}</small>
                    <em>{entry.adId}</em>
                  </button>
                ))}
              </div>
            )}
            {form.adId && (
              <div className="selected-ad-summary">
                <CheckCircle2 size={15} />
                <span><strong>{adQuery || "Ad selected"}</strong><small>{form.adId}</small></span>
              </div>
            )}
          </div>

          <div className="field field-relative">
            <div className="field-label">2. Product</div>
            <div className="adset-search">
              <Search size={14} />
              <input
                className="input"
                placeholder="Search Tyaani catalog — Reha, Elisha, rings…"
                value={productQuery}
                onChange={(e) => onProductQueryChange(e.target.value)}
              />
            </div>
            {productSearching && <p className="field-hint">Searching catalog…</p>}
            {productResults.length > 0 && (
              <div className="product-pick-list" role="listbox">
                {productResults.map((product) => (
                  <button type="button" key={`${product.name}-${product.url}`} onMouseDown={() => pickProduct(product)}>
                    {product.image_url ? <img src={product.image_url} alt="" /> : <span className="product-pick-fallback" />}
                    <span>
                      <strong>{product.name}</strong>
                      <small>{[product.category, product.price != null ? `₹${Number(product.price).toLocaleString("en-IN")}` : ""].filter(Boolean).join(" · ")}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {form.productName && (
              <div className="selected-product-summary">
                <div>
                  <strong>{form.productName}</strong>
                  <small>{form.productPrice || "Price from catalog"}</small>
                </div>
                <button type="button" className="header-icon-button" onClick={clearProduct} aria-label="Clear product">
                  <X size={13} />
                </button>
              </div>
            )}
          </div>

          <div className="mapping-actions">
            <button onClick={() => setView("mappings")} className="btn btn-secondary">Cancel</button>
            <button onClick={save} disabled={saving} className="btn btn-primary">{saving ? "Saving…" : "Save"}</button>
          </div>
          {error && <div className="status-banner err">{error}</div>}
        </section>
      </div>
    );
  }

  if (view === "details" && selectedDetailAd) {
    return <AdDetailsView adId={selectedDetailAd} onBack={() => setView("ads")} onCreateMapping={createMappingForAd} />;
  }

  return (
    <div className="page ad-context-page">
      <PageHeader
        icon={Megaphone}
        title="Ad Source Context"
      />

      <div className="ad-workflow-card">
        <div><span className="ad-workflow-icon"><Megaphone size={17} /></span><strong>Imported ads</strong><small>{catalogCount} ads</small></div>
        <ArrowRight size={16} />
        <div><span className="ad-workflow-icon"><Link2 size={17} /></span><strong>Product mappings</strong><small>{list.length} mapped</small></div>
      </div>

      <div className="ad-subnav" role="tablist" aria-label="Ad source views">
        <button className={view === "ads" || view === "overview" ? "active" : ""} onClick={() => setView("ads")}>Ads</button>
        <button className={view === "mappings" ? "active" : ""} onClick={() => setView("mappings")}>Mappings <span>{list.length}</span></button>
      </div>

      {view === "ads" ? <>
      <div className="card ad-catalog-card">
        <div className="ad-import-copy">
          <div className="ad-catalog-title">Ad catalog</div>
          <div className="field-hint">
            {catalogCount > 0 ? `${catalogCount} ads imported — searchable below.` : "No ads imported yet — upload your Meta ad performance export (JSON) to search real ads instead of typing IDs blind."}
          </div>
        </div>
        <label className="btn btn-secondary btn-sm">
          {importing ? "Importing…" : "Import ads JSON"}
          <input className="visually-hidden" type="file" accept=".json" onChange={importCatalog} />
        </label>
      </div>
      {importMsg && <div className="status-banner info import-status">{importMsg}</div>}

      {catalogCount > 0 && (
        <section className="ad-catalog-browser card">
          <div className="list-heading">
            <div>
              <h3>Imported ads</h3>
              <p className="field-hint">Search, then map a product.</p>
            </div>
            <span className="badge badge-muted">{catalogPreview.length} of {catalogTotal || catalogCount}</span>
          </div>
          <input
            className="input"
            placeholder="Search ads by name or ID…"
            value={catalogSearch}
            onChange={(e) => { const query = e.target.value; setCatalogSearch(query); loadCatalog(query); }}
          />
          <div className="ad-catalog-list" onScroll={onCatalogScroll}>
            {catalogPreview.map((entry) => (
              <div key={entry.adId} className="ad-catalog-item-row">
                <button className="ad-catalog-item" onClick={() => { setSelectedDetailAd(entry.adId); setView("details"); }}>
                  <span className="document-file-icon">AD</span>
                  <span className="ad-catalog-item-main"><strong>{entry.name || entry.adId}</strong><small>Ad ID {entry.adId} · {entry.adsetName || "No ad set name"}</small></span>
                  <span className={`badge ${entry.status === "ACTIVE" ? "badge-ok" : "badge-muted"}`}>{entry.status || "Unknown"}</span>
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => createMappingForAd(entry)}>Map</button>
              </div>
            ))}
            {loadingMore && <div className="catalog-loading">Loading more ads…</div>}
            {!loadingMore && catalogPreview.length >= catalogTotal && catalogTotal > 0 && <div className="catalog-end">All matching ads are shown.</div>}
          </div>
        </section>
      )}
      </> : <>

      <div className="mappings-heading">
        <div>
          <h3>Product mappings</h3>
          <p className="field-hint">Mapped ads.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setView("new")}><Plus size={14} /> New mapping</button>
      </div>

      <div className="ad-context-layout ad-context-overview-layout">
        <div className="ad-context-saved">
          <div className="section-title">Saved mappings</div>
          {list.length === 0 && <div className="empty-state">No mappings yet. Create one to connect an ad with product context.</div>}
          {list.map((m) => (
            <div key={m.id} className="list-card">
              <button className="btn-ghost-danger row-action" onClick={() => remove(m.id)}>Remove</button>
              <div className="list-card-title">{m.label}</div>
              <div className="field-hint list-card-meta">Ad {m.adId}{m.cardId ? ` · card ${m.cardId}` : ""}</div>
              {(m.productName || m.productPrice) && (
                <div className="mapping-product">
                  {m.productName} {m.productPrice && <span>— {m.productPrice}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      </>}
    </div>
  );
}
