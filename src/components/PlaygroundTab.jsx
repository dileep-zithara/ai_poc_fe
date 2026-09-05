import { useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  MessageSquareText,
  Paperclip,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { sendChat, resetChat, listAdContexts, searchAdCatalog, listLiveAdSets, searchLiveAds, getSavedAdSets, saveAdSets } from "../api.js";
import { WEBHOOK_SAMPLES, prettySample } from "../webhookSamples.js";

function newSessionId() {
  return "playground-" + Math.random().toString(36).slice(2);
}

const CHANNELS = [
  { id: "web", label: "Web Widget" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
];

function attachmentTypeFor(file) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
}

function shortName(name) {
  const s = String(name || "");
  if (s.length > 28) return `${s.slice(0, 26)}…`;
  return s;
}

function formatPrice(price) {
  if (price == null || price === "") return "";
  const n = Number(price);
  return Number.isFinite(n) ? `₹${n.toLocaleString("en-IN")}` : String(price);
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function ChatText({ text }) {
  const source = String(text || "");
  if (!source) return null;
  const pattern = /(\*\*(.+?)\*\*)|(\[(.+?)\]\((https?:\/\/[^)\s]+)\))|(https?:\/\/[^\s<>)\]]+)/g;
  return (
    <>
      {source.split("\n").map((line, lineIndex) => {
        const nodes = [];
        let last = 0;
        let match;
        let part = 0;
        const re = new RegExp(pattern.source, "g");
        while ((match = re.exec(line))) {
          if (match.index > last) nodes.push(line.slice(last, match.index));
          if (match[1]) {
            nodes.push(<strong key={`${lineIndex}-${part++}`}>{match[2]}</strong>);
          } else if (match[3]) {
            const href = safeHttpUrl(match[5]);
            nodes.push(href
              ? <a key={`${lineIndex}-${part++}`} href={href} target="_blank" rel="noreferrer">{match[4]}</a>
              : match[0]);
          } else {
            const href = safeHttpUrl(match[6]);
            nodes.push(href
              ? <a key={`${lineIndex}-${part++}`} href={href} target="_blank" rel="noreferrer">{match[6]}</a>
              : match[0]);
          }
          last = match.index + match[0].length;
        }
        if (last < line.length) nodes.push(line.slice(last));
        return (
          <span key={lineIndex}>
            {lineIndex > 0 && "\n"}
            {nodes}
          </span>
        );
      })}
    </>
  );
}

function ProductCarousel({ products }) {
  if (!products?.length) return null;
  return (
    <div className="product-carousel" role="list">
      {products.map((product, index) => (
        <article key={`${product.name}-${index}`} className="product-card" role="listitem">
          <div className="product-card-media">
            {product.imageUrl
              ? <img src={product.imageUrl} alt="" />
              : <div className="product-card-fallback"><Sparkles size={18} /></div>}
          </div>
          <div className="product-card-body">
            <strong>{product.name}</strong>
            {product.category && <small>{product.category}</small>}
            {product.price != null && product.price !== "" && (
              <span className="product-card-price">{formatPrice(product.price)}</span>
            )}
            {product.url && (
              <a className="product-card-link" href={product.url} target="_blank" rel="noreferrer">
                View details <ExternalLink size={11} />
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export default function PlaygroundTab() {
  const [sessionId, setSessionId] = useState(newSessionId());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [adContexts, setAdContexts] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);
  const [adSearch, setAdSearch] = useState("");
  const [adResults, setAdResults] = useState([]);
  const [showAdPicker, setShowAdPicker] = useState(false);
  const [adSets, setAdSets] = useState([]);
  const [adSetQuery, setAdSetQuery] = useState("");
  const [selectedAdSets, setSelectedAdSets] = useState(() => getSavedAdSets());
  const [liveAds, setLiveAds] = useState(true);
  const [channel, setChannel] = useState("web");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [session, setSession] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [mobilePane, setMobilePane] = useState("chat");
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState(() => prettySample(WEBHOOK_SAMPLES[0]));
  const [jsonSampleId, setJsonSampleId] = useState(WEBHOOK_SAMPLES[0].id);
  const [jsonError, setJsonError] = useState("");
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const adSearchTimer = useRef(null);

  useEffect(() => { listAdContexts().then(setAdContexts); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    listLiveAdSets(adSetQuery).then((result) => setAdSets(result.items || [])).catch(() => setAdSets([]));
  }, [adSetQuery]);

  function selectedAdSetIds() {
    return selectedAdSets.map((row) => row.adSetId);
  }

  function loadAds(query) {
    searchLiveAds(query, selectedAdSetIds()).then((result) => {
      if (Array.isArray(result.items)) {
        setAdResults(result.items);
        setLiveAds(true);
        return;
      }
      return searchAdCatalog(query).then((fallback) => {
        setAdResults(fallback.items || []);
        setLiveAds(false);
      });
    }).catch(() => {
      searchAdCatalog(query).then((fallback) => {
        setAdResults(fallback.items || []);
        setLiveAds(false);
      });
    });
  }

  function openAdPicker() {
    setShowAdPicker(true);
    loadAds(adSearch.trim());
  }

  function updateAdSearch(value) {
    setAdSearch(value);
    clearTimeout(adSearchTimer.current);
    adSearchTimer.current = setTimeout(() => loadAds(value.trim()), 200);
  }

  function toggleAdSet(set) {
    setSelectedAdSets((current) => {
      const exists = current.some((row) => row.adSetId === set.adSetId);
      const next = exists
        ? current.filter((row) => row.adSetId !== set.adSetId)
        : [...current, { adSetId: set.adSetId, name: set.name || set.adSetId }];
      return saveAdSets(next);
    });
    setAdSetQuery("");
  }

  function clearAdSets() {
    setSelectedAdSets(saveAdSets([]));
  }

  function selectAd(entry) {
    const mapping = adContexts.find((item) => item.adId === entry.adId);
    setSelectedAd({ ...entry, mapping });
    setShowAdPicker(false);
    setAdSearch("");
  }

  function onAttach(e) {
    const file = e.target.files[0];
    if (!file) return;
    const type = attachmentTypeFor(file);
    if (!type) {
      alert("Only image, video, or audio files are supported.");
    } else {
      setAttachment({ type, name: file.name });
    }
    e.target.value = "";
  }

  function loadSample(id) {
    const sample = WEBHOOK_SAMPLES.find((row) => row.id === id) || WEBHOOK_SAMPLES[0];
    setJsonSampleId(sample.id);
    setJsonInput(prettySample(sample));
    setJsonError("");
  }

  function applyParsedWebhook(parsed) {
    if (!parsed) return;
    if (parsed.channel) setChannel(parsed.channel);
    if (parsed.phone) setCustomerPhone(parsed.phone);
    if (parsed.customerName) setCustomerName(parsed.customerName);
    if (parsed.referral?.adId) {
      setSelectedAd({
        adId: parsed.referral.adId,
        name: parsed.referral.headline || parsed.referral.adId,
        adsetName: parsed.referral.sourceType || "Webhook referral",
        fromWebhook: true,
      });
    }
  }

  function assistantMessage(data) {
    if (data.skipped) return null;
    const content = data.aiPaused
      ? "Replies are paused right now. Please try again in a bit."
      : data.handoff?.alreadyActive
      ? "Someone from the store will continue this chat with you."
      : data.reply || data.error || "";
    if (!content) return null;
    return {
      role: "assistant",
      content,
      usedCatalogProducts: data.usedCatalogProducts,
    };
  }

  async function send() {
    if (!input.trim() && !attachment) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { role: "user", content: userMsg, channel, attachment }]);
    setInput("");
    setLoading(true);
    const data = await sendChat(sessionId, userMsg, selectedAd?.adId, selectedAd?.mapping?.cardId, channel, attachment, undefined, customerPhone.trim() || undefined, undefined, customerName.trim() || undefined);
    if (data.session) setSession(data.session);
    setAttachment(null);
    const reply = assistantMessage(data);
    setMessages((m) => (reply ? [...m, reply] : m));
    setLoading(false);
  }

  async function sendJson() {
    let webhook;
    try {
      webhook = JSON.parse(jsonInput);
    } catch {
      setJsonError("JSON is invalid — fix the payload, then send again.");
      return;
    }
    if (!webhook || typeof webhook !== "object" || Array.isArray(webhook)) {
      setJsonError("Webhook must be a JSON object.");
      return;
    }
    setJsonError("");
    setLoading(true);
    try {
      const data = await sendChat(sessionId, "", undefined, undefined, channel, undefined, undefined, undefined, webhook);
      const parsed = data.parsedWebhook || null;
      applyParsedWebhook(parsed);
      if (data.session) setSession(data.session);
      const extracted = parsed?.message || "";
      const reply = assistantMessage(data);
      const next = [];
      if (extracted) next.push({ role: "user", content: extracted, attachment: parsed?.attachment || null });
      if (data.error && !parsed) setJsonError(data.error);
      if (reply) next.push(reply);
      setMessages((m) => [...m, ...next]);
      if (!data.error) setShowJsonModal(false);
    } catch (err) {
      setJsonError(err.message || "Could not send webhook.");
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    await resetChat(sessionId);
    setSessionId(newSessionId());
    setMessages([]);
    setAttachment(null);
    setSession(null);
    setJsonError("");
  }

  return (
    <div className="playground-page">
      <header className="playground-top">
        <div>
          <h2>Playground</h2>
          <p>Test a chat, or send a webhook with Send JSON.</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={reset}>
          <RotateCcw size={13} /> Reset chat
        </button>
      </header>

      <div className="playground-mobile-nav" role="tablist" aria-label="Playground views">
        <button type="button" role="tab" aria-selected={mobilePane === "chat"} className={mobilePane === "chat" ? "active" : ""} onClick={() => setMobilePane("chat")}>
          Chat
        </button>
        <button type="button" role="tab" aria-selected={mobilePane === "context"} className={mobilePane === "context" ? "active" : ""} onClick={() => setMobilePane("context")}>
          Ad context
        </button>
      </div>

      <div className={`playground-layout is-${mobilePane}`}>
        <section className="playground-col card">
          <div className="playground-col-head">
            <span className="surface-icon"><MessageSquareText size={16} /></span>
            <div>
              <h3>Customer conversation</h3>
              <p>Customer chat</p>
            </div>
          </div>
          <div className="channel-tabs" role="group" aria-label="Conversation channel">
            {CHANNELS.map((c) => (
              <button key={c.id} className={`channel-tab${channel === c.id ? " active" : ""}`} onClick={() => setChannel(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="chat-box">
            {messages.length === 0 && (
              <div className="chat-empty">
                <MessageSquareText size={24} />
                <strong>Start a conversation</strong>
                <span>Pick an ad, type a message, or switch to JSON and load an Instagram / Facebook / WhatsApp sample.</span>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "chat-user" : "chat-assistant"}>
                {m.role === "user" ? (
                  <>
                    {m.attachment && <div className="chat-attachment">{m.attachment.type === "image" ? "Photo" : m.attachment.type}</div>}
                    {m.content && <div className="bubble-user"><ChatText text={m.content} /></div>}
                  </>
                ) : (
                  <div className="chat-assistant-body">
                    {m.content && <div className="bubble-assistant"><ChatText text={m.content} /></div>}
                    <ProductCarousel products={m.usedCatalogProducts} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-assistant">
                <div className="bubble-assistant typing-bubble" aria-live="polite">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          {attachment && (
            <div className="playground-attachment-chip">
              <Paperclip size={13} /> {attachment.type}: {attachment.name}
              <button onClick={() => setAttachment(null)} className="remove-attachment" type="button">×</button>
            </div>
          )}
          <div className="chat-composer">
            <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary icon-button" aria-label="Attach media">
              <Paperclip size={17} />
            </button>
            <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*,video/*,audio/*" onChange={onAttach} />
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a customer message..." className="input" />
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setJsonError(""); setShowJsonModal(true); }}>
              Send JSON
            </button>
            <button onClick={send} disabled={loading} className="btn btn-primary send-circle" aria-label="Send"><Send size={15} /></button>
          </div>
        </section>

        <aside className="playground-col card playground-context">
          <div className="playground-col-head">
            <span className="surface-icon"><Sparkles size={16} /></span>
            <div>
              <h3>Ad context</h3>
              <p>Ad and phone</p>
            </div>
          </div>

          <div className="context-block">
            <div className="context-label">
              <span>Add ad set</span>
            </div>
            <div className="adset-search">
              <Search size={14} />
              <input className="input" placeholder="Search by name" value={adSetQuery} onChange={(e) => setAdSetQuery(e.target.value)} />
            </div>
            {adSetQuery.trim() && (
              <div className="adset-pick-list compact">
                {adSets.slice(0, 8).map((set) => (
                  <button
                    key={set.adSetId}
                    type="button"
                    className={`adset-option${selectedAdSets.some((row) => row.adSetId === set.adSetId) ? " selected" : ""}`}
                    onClick={() => toggleAdSet(set)}
                  >
                    <strong>{set.name || set.adSetId}</strong>
                    <small>{set.effectiveStatus || set.status || "ad set"}</small>
                  </button>
                ))}
                {adSets.length === 0 && <span className="field-hint">No ad sets match.</span>}
              </div>
            )}
          </div>

          <div className="context-block context-block-grow">
            <div className="context-label">
              <span>{selectedAdSets.length ? `${selectedAdSets.length} selected` : "Selected ad sets"}</span>
              {selectedAdSets.length > 0 && (
                <button type="button" className="text-link" onClick={clearAdSets}>Clear all</button>
              )}
            </div>
            <div className="adset-selected-list">
              {selectedAdSets.length === 0 && (
                <p className="context-empty">None selected — all live ads are in play.</p>
              )}
              {selectedAdSets.map((set) => (
                <div key={set.adSetId} className="adset-selected-row" title={set.name}>
                  <div>
                    <strong>{shortName(set.name)}</strong>
                    <small>{set.adSetId}</small>
                  </div>
                  <button type="button" className="header-icon-button" onClick={() => toggleAdSet(set)} aria-label={`Remove ${set.name}`}>
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="context-block">
            <div className="context-label">
              <span>Clicked ad</span>
              {selectedAd && <button type="button" className="text-link" onClick={() => setSelectedAd(null)}>Change</button>}
            </div>
            <div className="playground-ad-picker">
              {!selectedAd ? (
                <>
                  <button type="button" className="ad-selector" onClick={openAdPicker} aria-expanded={showAdPicker}>
                    <span className="ad-selector-placeholder">Select the ad they clicked</span>
                    <Search size={15} />
                  </button>
                  {showAdPicker && (
                    <div className="playground-ad-result-menu">
                      <input autoFocus className="input" placeholder="Search ad name or Meta Ad ID" value={adSearch} onChange={(event) => updateAdSearch(event.target.value)} />
                      <div className="playground-ad-result-list">
                        {adResults.map((entry) => (
                          <button type="button" key={entry.adId} onClick={() => selectAd(entry)}>
                            <strong>{entry.name || "Unnamed ad"}</strong>
                            <small>{entry.adsetName || "No ad set name"}</small>
                          </button>
                        ))}
                        {adResults.length === 0 && <span>{liveAds ? "No live ads match." : "No imported ads match."}</span>}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="selected-ad-body">
                  <strong>{selectedAd.name || selectedAd.adId}</strong>
                  <small>{selectedAd.adsetName || selectedAd.name || "Clicked ad"}</small>
                  <span className="selected-ad-id">Ad ID {selectedAd.adId}</span>
                </div>
              )}
            </div>
          </div>

          <div className="context-block">
            <label className="field-label">Customer name</label>
            <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Riya" />
          </div>
          <div className="context-block">
            <label className="field-label">{channel === "whatsapp" ? "WhatsApp number" : "Phone on file"}</label>
            <input className="input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Optional" />
          </div>
        </aside>
      </div>

      {showJsonModal && (
        <div className="modal-backdrop" onClick={() => setShowJsonModal(false)} role="presentation">
          <div className="help-modal json-modal" role="dialog" aria-labelledby="json-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="help-modal-header">
              <div>
                <h2 id="json-modal-title">Send JSON</h2>
                <p>Pick a sample or paste a WhatsApp, Instagram, or Facebook webhook.</p>
              </div>
              <button type="button" className="header-icon-button" onClick={() => setShowJsonModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="json-sample-chips">
              {WEBHOOK_SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  className={`json-sample-chip${jsonSampleId === sample.id ? " selected" : ""}`}
                  onClick={() => loadSample(sample.id)}
                >
                  {sample.label}
                </button>
              ))}
            </div>
            <textarea
              className="input json-composer-input"
              value={jsonInput}
              onChange={(e) => { setJsonInput(e.target.value); setJsonError(""); }}
              spellCheck={false}
              aria-label="Webhook JSON"
            />
            {jsonError && <div className="chat-tag handoff">{jsonError}</div>}
            <div className="help-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowJsonModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={sendJson} disabled={loading}>
                {loading ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
