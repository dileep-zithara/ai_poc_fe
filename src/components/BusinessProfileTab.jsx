import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Clock3,
  Globe2,
  MapPin,
  Phone,
  Radar,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getBusinessProfile, saveBusinessProfile, importBusinessProfileFromWebsite } from "../api.js";
import PageHeader from "./PageHeader.jsx";
import LoadingState from "./LoadingState.jsx";

function lines(value) {
  return String(value || "").split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

function fuzzyGet(map, city) {
  const key = city.split(",")[0].trim().toLowerCase();
  if (map[key]) return map[key];
  const aliases = {
    bandra: ["bandra", "mumbai"],
    mehrauli: ["delhi", "new delhi"],
    "jubilee hills": ["hyderabad"],
    "dickenson road": ["bangalore", "bengaluru"],
    hazratganj: ["lucknow"],
    "kalyani nagar": ["pune"],
    "sector 17c": ["chandigarh"],
  };
  for (const [from, to] of Object.entries(aliases)) {
    if (key.includes(from)) {
      for (const name of to) if (map[name]) return map[name];
    }
  }
  const hit = Object.keys(map).find((name) => key.includes(name) || name.includes(key));
  return hit ? map[hit] : "";
}

function parseHours(profile) {
  const map = {};
  for (const line of lines(profile.supportHours)) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) map[match[1].trim().toLowerCase()] = match[2].trim();
  }
  return map;
}

function parseWhatsapp(profile) {
  const map = {};
  let central = "";
  let email = "";
  for (const line of lines(profile.contactInfo)) {
    const centralMatch = line.match(/Central WhatsApp:\s*(.+)/i);
    if (centralMatch) central = centralMatch[1].trim();
    const emailMatch = line.match(/Email:\s*(.+)/i);
    if (emailMatch) email = emailMatch[1].trim();
    const wa = line.match(/(\+91[\d\s]+)\s*\(([^)]+)\)/);
    if (wa && !/chat|click|book|assist/i.test(wa[2])) {
      map[wa[2].trim().toLowerCase()] = wa[1].replace(/\s+/g, " ").trim();
    }
  }
  return { map, central, email };
}

function parseStores(profile) {
  const hours = parseHours(profile);
  const { map: whatsapp } = parseWhatsapp(profile);
  return lines(profile.location).map((line) => {
    const idx = line.indexOf(":");
    const city = (idx === -1 ? line : line.slice(0, idx)).trim();
    const address = (idx === -1 ? "" : line.slice(idx + 1)).trim();
    return {
      city,
      address,
      hours: fuzzyGet(hours, city),
      whatsapp: fuzzyGet(whatsapp, city),
    };
  }).filter((row) => row.city);
}

function policyCards(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  const sentences = raw.split(/(?<=\.)\s+/).filter(Boolean);
  const buckets = [
    { title: "Shipping", test: /ship|deliver|insured/i },
    { title: "Returns & exchange", test: /return|exchange|cashback|damaged/i },
    { title: "Buyback", test: /buyback/i },
    { title: "Certification", test: /certif|authenticity/i },
  ];
  const cards = buckets
    .map((bucket) => ({ title: bucket.title, body: sentences.filter((s) => bucket.test.test(s)).join(" ") }))
    .filter((card) => card.body);
  return cards.length ? cards : [{ title: "Policies", body: raw }];
}

function socialItems(value) {
  return String(value || "").split(/\s+/).map((s) => s.trim()).filter((s) => /https?:|@|info@/i.test(s));
}

function socialHref(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[^\s/@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return `mailto:${raw}`;
  if (/^(www\.|facebook\.com|instagram\.com|youtube\.com|linkedin\.com|x\.com|twitter\.com)/i.test(raw)) {
    return `https://${raw}`;
  }
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(raw)) return `https://${raw}`;
  if (raw.startsWith("@")) return `https://www.instagram.com/${raw.slice(1)}`;
  return "";
}

export default function BusinessProfileTab() {
  const [profile, setProfile] = useState(null);
  const [website, setWebsite] = useState("https://tyaani.com");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [pages, setPages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    getBusinessProfile().then((row) => {
      setProfile(row);
      if (row?.website) setWebsite(row.website);
      if (row?.importJob?.pages) setPages(row.importJob.pages);
      if (row?.importJob?.status === "running") {
        setImporting(true);
        setImportMsg("Import still running…");
        pollImport();
      }
    });
  }, []);

  const stores = useMemo(() => (profile ? parseStores(profile) : []), [profile]);
  const contact = useMemo(() => (profile ? parseWhatsapp(profile) : { map: {}, central: "", email: "" }), [profile]);
  const policies = useMemo(() => (profile ? policyCards(profile.policies) : []), [profile]);
  const socials = useMemo(() => (profile ? socialItems(profile.socialLinks) : []), [profile]);

  async function pollImport() {
    const deadline = Date.now() + 6 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const row = await getBusinessProfile();
        const job = row.importJob || {};
        if (job.pagesFetched) {
          setImportMsg(`Read ${job.pagesFetched} page${job.pagesFetched === 1 ? "" : "s"} so far…`);
        }
        if (job.status === "done") {
          setProfile(row);
          setPages(job.pages || []);
          setImportMsg(`Fetched ${job.pagesFetched} pages. Check the store cards below.`);
          setImporting(false);
          return;
        }
        if (job.status === "failed") {
          setImportMsg(`Could not fetch the site: ${job.error || "import failed"}`);
          setImporting(false);
          return;
        }
      } catch {
        // Transient poll failures should not abort a running import.
      }
    }
    setImportMsg("Import is still running in the background. Refresh in a minute to see the result.");
    setImporting(false);
  }

  async function fetchEverything() {
    const url = website.trim() || "https://tyaani.com";
    setImporting(true);
    setImportMsg("Starting website import…");
    try {
      const start = await importBusinessProfileFromWebsite(url, 25);
      if (start.error && start.status !== "running") {
        setImportMsg(`Could not fetch the site: ${start.error}`);
        setImporting(false);
        return;
      }
      if (start.profile) setProfile(start.profile);
      setImportMsg("Reading stores, hours, WhatsApp, and policies from the site…");
      await pollImport();
    } catch (err) {
      setImportMsg(`Could not reach the API: ${err.message}`);
      setImporting(false);
    }
  }

  async function saveField(key, value) {
    const saved = await saveBusinessProfile({ ...(profile || {}), [key]: value });
    setProfile(saved);
    setEditing(null);
    setSaveMsg("Saved");
  }

  function startEdit(key) {
    setEditing(key);
    setDraft(profile?.[key] || "");
    setSaveMsg("");
  }

  if (!profile) return <LoadingState label="Loading business profile…" />;

  const ready = profile.filledCount || 0;

  return (
    <div className="page profile-page">
      <PageHeader
        icon={BriefcaseBusiness}
        title="Business Profile"
      />

      <section className="brand-hero card">
        <div className="brand-hero-mark">{(profile.businessName || "T").slice(0, 1)}</div>
        <div className="brand-hero-copy">
          <p className="guide-kicker">Brand</p>
          <h3>{profile.businessName || "Add the brand name"}</h3>
          <p>
            {profile.website ? <a href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a> : "No website saved yet"}
            {contact.email ? <> · <a href={`mailto:${contact.email}`}>{contact.email}</a></> : ""}
          </p>
          {contact.central && <p className="brand-hero-wa">Central WhatsApp {contact.central}</p>}
          <div className="chip-row">
            {socials.map((link) => {
              const href = socialHref(link);
              const label = link.replace(/^https?:\/\//, "");
              return href ? (
                <a key={link} className="info-chip" href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel={href.startsWith("mailto:") ? undefined : "noreferrer"}>
                  {label}
                </a>
              ) : (
                <span key={link} className="info-chip">{label}</span>
              );
            })}
          </div>
        </div>
        <div className="brand-hero-actions">
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => startEdit("businessName")}>Edit name</button>
        </div>
      </section>

      <div className="stat-row">
        <div className="stat-card"><strong>{ready}/{profile.totalFields}</strong><span>answers filled</span></div>
        <div className="stat-card"><strong>{stores.length}</strong><span>stores found</span></div>
        <div className="stat-card"><strong>{contact.central ? "Yes" : "—"}</strong><span>central WhatsApp</span></div>
        <div className="stat-card"><strong>{profile.policies ? "Yes" : "—"}</strong><span>policies ready</span></div>
      </div>

      <section className="card fetch-bar">
        <div>
          <h3>Fetch from the website</h3>
        </div>
        <div className="fetch-bar-actions">
          <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://tyaani.com" />
          <button className="btn btn-primary" type="button" onClick={fetchEverything} disabled={importing}>
            <Radar size={15} /> {importing ? "Fetching…" : "Fetch everything"}
          </button>
        </div>
        {importMsg && <div className="status-banner info">{importMsg}</div>}
        {pages.length > 0 && (
          <p className="field-hint">Read {pages.length} pages, including {pages.slice(0, 4).map((p) => p.title?.split("–")[0]?.trim() || p.url).join(", ")}.</p>
        )}
      </section>

      {editing === "businessName" && (
        <EditBox label="Brand name" value={draft} onChange={setDraft} onSave={() => saveField("businessName", draft)} onCancel={() => setEditing(null)} />
      )}

      <section className="profile-section">
        <div className="section-head">
          <div>
            <h3><MapPin size={16} /> Stores</h3>
          </div>
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => startEdit("location")}>Edit list</button>
        </div>
        {editing === "location" ? (
          <EditBox multiline label="One store per line: City: address" value={draft} onChange={setDraft} onSave={() => saveField("location", draft)} onCancel={() => setEditing(null)} />
        ) : stores.length > 0 ? (
          <div className="store-grid">
            {stores.map((store) => (
              <article key={store.city} className="store-card card">
                <h4>{store.city.split(",")[0]}</h4>
                {store.address && <p>{store.address}</p>}
                <ul>
                  {store.hours && <li><Clock3 size={13} /> {store.hours}</li>}
                  {store.whatsapp && <li><Phone size={13} /> {store.whatsapp}</li>}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <Empty hint="Fetch the website to load store addresses, or add them with Edit list." />
        )}
      </section>

      <section className="profile-section">
        <div className="section-head">
          <div>
            <h3><Sparkles size={16} /> What they sell</h3>
          </div>
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => startEdit("productsServices")}>Edit</button>
        </div>
        {editing === "productsServices" ? (
          <EditBox multiline label="Products and collections" value={draft} onChange={setDraft} onSave={() => saveField("productsServices", draft)} onCancel={() => setEditing(null)} />
        ) : (
          <div className="card readable-card">{profile.productsServices || "Not filled yet."}</div>
        )}
      </section>

      <section className="profile-section">
        <div className="section-head">
          <div>
            <h3><ShieldCheck size={16} /> Policies</h3>
          </div>
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => startEdit("policies")}>Edit</button>
        </div>
        {editing === "policies" ? (
          <EditBox multiline label="Policies" value={draft} onChange={setDraft} onSave={() => saveField("policies", draft)} onCancel={() => setEditing(null)} />
        ) : policies.length > 0 ? (
          <div className="policy-grid">
            {policies.map((item) => (
              <article key={item.title} className="card policy-card">
                <h4>{item.title}</h4>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <Empty hint="Fetch the website to pull shipping and return rules." />
        )}
      </section>

      <section className="profile-section">
        <div className="section-head">
          <div>
            <h3><Globe2 size={16} /> Agent rules</h3>
          </div>
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => startEdit("aiInstructions")}>Edit</button>
        </div>
        {editing === "aiInstructions" ? (
          <EditBox multiline label="Agent rules" value={draft} onChange={setDraft} onSave={() => saveField("aiInstructions", draft)} onCancel={() => setEditing(null)} />
        ) : (
          <div className="card readable-card">{profile.aiInstructions || "Not filled yet."}</div>
        )}
      </section>

      {saveMsg && <div className="status-banner info">{saveMsg}</div>}
    </div>
  );
}

function EditBox({ label, value, onChange, onSave, onCancel, multiline }) {
  return (
    <div className="card edit-box">
      <label className="field-label">{label}</label>
      {multiline
        ? <textarea className="input guide-answer" rows={8} value={value} onChange={(e) => onChange(e.target.value)} />
        : <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />}
      <div className="setup-actions">
        <button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" type="button" onClick={onSave}>Save</button>
      </div>
    </div>
  );
}

function Empty({ hint }) {
  return <div className="card empty-card">{hint}</div>;
}
