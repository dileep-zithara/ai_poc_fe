import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, ExternalLink, ImageOff, Megaphone, Tag, Target } from "lucide-react";
import { getAdCatalogEntry } from "../api.js";
import LoadingState from "./LoadingState.jsx";

const HIDDEN_FIELDS = new Set(["id", "createdAt", "updatedAt", "rawData"]);

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "Not available";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function MediaPanel({ raw }) {
  const mediaUrls = [raw?.image_url, raw?.imageUrl, raw?.thumbnail_url, raw?.thumbnailUrl, raw?.video_url, raw?.videoUrl].filter(Boolean);
  return (
    <section className="card ad-detail-media">
      <div className="ad-detail-section-title"><ImageOff size={16} /><h3>Creative media</h3></div>
      {mediaUrls.length > 0 ? (
        <div className="ad-media-grid">{mediaUrls.map((url) => <img key={url} src={url} alt="Ad creative" />)}</div>
      ) : (
        <div className="ad-media-empty"><ImageOff size={24} /><strong>No image, video, or carousel payload in this export</strong><span>This Meta export contains the creative ID, but not the actual creative assets. Sync the Meta Creative API or upload creative media to show it here.</span></div>
      )}
    </section>
  );
}

export default function AdDetailsView({ adId, onBack, onCreateMapping }) {
  const [ad, setAd] = useState(null);

  useEffect(() => { getAdCatalogEntry(adId).then(setAd); }, [adId]);

  if (!ad) return <LoadingState label="Loading ad details…" />;
  const raw = ad.rawData || {};
  const rawFields = Object.entries(raw).filter(([key]) => !HIDDEN_FIELDS.has(key));

  return (
    <div className="page ad-details-page">
      <button className="back-link" onClick={onBack}><ArrowLeft size={14} /> Ads</button>
      <div className="ad-detail-title-row">
        <div><h2>{ad.name || "Unnamed ad"}</h2><p className="page-lead">Meta Ad ID: {ad.adId}</p></div>
        <button className="btn btn-primary" onClick={() => onCreateMapping(ad)}>Create mapping</button>
      </div>

      <div className="ad-detail-summary-grid">
        <section className="card"><div className="ad-detail-section-title"><Megaphone size={16} /><h3>Ad identity</h3></div><Detail label="Ad ID" value={ad.adId} /><Detail label="Creative ID" value={ad.creativeId} /><Detail label="Status" value={ad.status} /></section>
        <section className="card"><div className="ad-detail-section-title"><Target size={16} /><h3>Campaign context</h3></div><Detail label="Campaign ID" value={ad.campaignId} /><Detail label="Ad set" value={ad.adsetName} /><Detail label="Preview" value={raw.preview_shareable_link} link /></section>
        <section className="card"><div className="ad-detail-section-title"><BarChart3 size={16} /><h3>Performance</h3></div><Detail label="Spend" value={ad.spend === null ? null : `₹${Number(ad.spend).toLocaleString()}`} /><Detail label="ROAS" value={ad.roas} /><Detail label="Impressions" value={raw.impressions} /><Detail label="Clicks" value={raw.clicks} /></section>
      </div>

      <MediaPanel raw={raw} />

      <section className="card ad-raw-record">
        <div className="ad-detail-section-title"><Tag size={16} /><h3>All imported ad details</h3></div>
        <p className="field-hint">Every field provided in the Meta export is preserved here.</p>
        <div className="raw-detail-grid">{rawFields.map(([key, value]) => <Detail key={key} label={key.replaceAll("_", " ")} value={formatValue(value)} />)}</div>
      </section>
    </div>
  );
}

function Detail({ label, value, link }) {
  const text = formatValue(value);
  return <div className="ad-detail"><span>{label}</span>{link && value && value !== "Not available" ? <a href={value} target="_blank" rel="noreferrer">Open preview <ExternalLink size={12} /></a> : <strong>{text}</strong>}</div>;
}
