import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { searchAdCatalog } from "../api.js";

async function searchAds(query) {
  try {
    const result = await searchAdCatalog(query.trim());
    return Array.isArray(result?.items) ? result.items : [];
  } catch {
    return [];
  }
}

export default function AdIdPicker({ value, label, onPick, emptyHint }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function load(q = "") {
    setLoading(true);
    const next = await searchAds(q);
    setItems(next);
    setLoading(false);
  }

  async function openMenu() {
    setOpen(true);
    setQuery("");
    await load("");
    requestAnimationFrame(() => searchRef.current?.focus());
  }

  function onSearch(q) {
    setQuery(q);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => load(q), 160);
  }

  function choose(entry) {
    onPick(entry);
    setOpen(false);
  }

  const shown = label || value || "";

  return (
    <div className="ad-id-picker" ref={rootRef}>
      <button
        type="button"
        className={`ad-id-picker-trigger${open ? " open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
      >
        <span className={shown ? "" : "placeholder"}>{shown || "Select an ad…"}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="ad-id-picker-panel">
          <div className="ad-id-picker-search">
            <Search size={14} />
            <input
              ref={searchRef}
              className="input"
              placeholder="Search by ad name or ID…"
              value={query}
              onChange={(e) => onSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            />
          </div>
          <div className="ad-id-picker-list" role="listbox">
            {loading && items.length === 0 && <div className="ad-id-picker-empty">Searching ads…</div>}
            {!loading && items.length === 0 && (
              <div className="ad-id-picker-empty">{emptyHint || "No ads match that search."}</div>
            )}
            {items.map((entry) => (
              <button
                type="button"
                role="option"
                key={entry.adId}
                className={entry.adId === value ? "selected" : ""}
                onClick={() => choose(entry)}
              >
                <strong>{entry.name || "Unnamed ad"}</strong>
                <small>{entry.adsetName || "No ad set"}</small>
                <em>Ad ID {entry.adId}{entry.status ? ` · ${entry.status}` : ""}</em>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
