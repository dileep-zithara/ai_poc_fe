import { useEffect, useState } from "react";
import { Globe2, Link2, Radar } from "lucide-react";
import { listWebSources, addWebSource, deleteWebSource, getWebSource } from "../api.js";
import PageHeader from "./PageHeader.jsx";

const SUGGESTED = [
  { label: "Tyaani homepage", url: "https://tyaani.com" },
  { label: "www.tyaani.com", url: "https://www.tyaani.com" },
];

export default function WebSourcesTab() {
  const [sources, setSources] = useState([]);
  const [url, setUrl] = useState("https://tyaani.com");
  const [pageLimit, setPageLimit] = useState(25);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [help, setHelp] = useState("");

  useEffect(() => { refresh(); }, []);
  function refresh() { listWebSources().then(setSources); }

  async function fetchSite() {
    if (!url.trim()) return;
    const already = sources.find((s) => s.url.replace(/\/$/, "") === url.trim().replace(/\/$/, "") && s.status === "done");
    if (already) {
      setHelp(`This site is already indexed (${already.pagesFetched} pages). You do not need to fetch it again.`);
      return;
    }
    setFetching(true);
    setError("");
    setHelp("Started fetch — pages are indexed in the background…");
    const result = await addWebSource(url.trim(), pageLimit);
    if (result.error && !result.id) {
      setError(result.error);
      setHelp("");
      setFetching(false);
      refresh();
      return;
    }
    refresh();
    const id = result.id;
    for (let i = 0; i < 90; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const row = id ? await getWebSource(id).catch(() => null) : null;
      refresh();
      if (row?.status === "done") {
        setHelp(`Added ${row.pagesFetched} page(s).`);
        setUrl("");
        setFetching(false);
        return;
      }
      if (row?.status === "failed") {
        setError(row.error || "Fetch failed.");
        setHelp("");
        setFetching(false);
        return;
      }
      setHelp(`Fetching pages… ${row?.pagesFetched ? `${row.pagesFetched} so far` : "this can take a minute"}`);
    }
    setHelp("Still fetching on the server. You can leave this page — refresh later to see the result.");
    setFetching(false);
  }

  async function remove(id) {
    await deleteWebSource(id);
    refresh();
  }

  return (
    <div className="page web-sources-page">
      <PageHeader
        icon={Globe2}
        title="Web Sources"
      />

      <section className="card setup-card">
        <h3>Add a website</h3>
        <label className="field-label">Website URL</label>
        <input
          className="input"
          placeholder="https://tyaani.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchSite()}
        />
        <div className="suggested-url-row">
          {SUGGESTED.map((item) => (
            <button key={item.url} type="button" className="adset-chip" onClick={() => setUrl(item.url)}>
              {item.label}
            </button>
          ))}
        </div>
        <label className="field-label">Pages</label>
        <select className="input web-page-limit" value={pageLimit} onChange={(e) => setPageLimit(Number(e.target.value))}>
          <option value={5}>5 pages</option>
          <option value={10}>10 pages</option>
          <option value={25}>25 pages</option>
          <option value={40}>40 pages</option>
        </select>
        <div className="setup-actions">
          <button className="btn btn-primary" onClick={fetchSite} disabled={fetching}>
            <Radar size={14} /> {fetching ? "Fetching…" : "Fetch pages"}
          </button>
        </div>
        {help && <div className="status-banner info">{help}</div>}
      </section>
      {error && <div className="status-banner err">{error}</div>}

      <div className="list-heading">
        <div className="section-title">Active web sources</div>
        <span className="badge badge-muted">{sources.length}</span>
      </div>
      {sources.length === 0 && (
        <div className="web-sources-empty">
          <Link2 size={24} />
          <strong>No web sources yet</strong>
          <span>Add a website URL above.</span>
        </div>
      )}
      {sources.map((s) => (
        <div key={s.id} className="web-source-row">
          <button className="btn-ghost-danger row-action" onClick={() => remove(s.id)}>Remove</button>
          <span className="document-file-icon"><Globe2 size={17} /></span>
          <div className="document-row-content">
            <div className="document-row-title">{s.url}</div>
            <div className="field-hint">
              {s.status === "done" && <span className="badge badge-ok">{s.pagesFetched} page(s) indexed</span>}
              {s.status === "pending" && <span className="badge badge-muted">fetching pages…</span>}
              {s.status === "failed" && <span className="badge badge-danger">failed — {s.error}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
