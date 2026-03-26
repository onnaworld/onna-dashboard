import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

const MAX_RECENT = 5;
const LS_KEY = "onna_recent_searches";

function getRecent() {
  try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
}
function saveRecent(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, MAX_RECENT))); } catch {}
}

export function SearchModal({ T, isMobile, showSearch, setShowSearch, vendors, localLeads, outreach, localClients, allProjectsMerged, notes, onNavigate }) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recentSearches, setRecentSearches] = useState(getRecent);
  const inputRef = useRef(null);

  useEffect(() => {
    if (showSearch) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showSearch]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const out = [];

    // Projects
    (allProjectsMerged || []).forEach(p => {
      if (p.client === "TEMPLATE") return;
      const haystack = [p.name, p.client, p.status].filter(Boolean).join(" ").toLowerCase();
      if (haystack.includes(q)) out.push({ type: "Project", item: p, label: p.name, sub: p.client });
    });

    // Vendors
    (vendors || []).forEach(v => {
      const haystack = [v.name, v.company, v.category, v.email, v.location].filter(Boolean).join(" ").toLowerCase();
      if (haystack.includes(q)) out.push({ type: "Vendor", item: v, label: v.name || v.company, sub: v.category });
    });

    // Leads
    (localLeads || []).forEach(l => {
      const haystack = [l.company, l.contact, l.email, l.category, l.location].filter(Boolean).join(" ").toLowerCase();
      if (haystack.includes(q)) out.push({ type: "Lead", item: l, label: l.company, sub: l.contact });
    });

    // Clients
    (localClients || []).forEach(c => {
      const haystack = [c.company, c.name, c.email, c.country].filter(Boolean).join(" ").toLowerCase();
      if (haystack.includes(q)) out.push({ type: "Client", item: c, label: c.company, sub: c.name });
    });

    // Outreach
    (outreach || []).forEach(o => {
      const haystack = [o.company, o.clientName, o.email, o.category].filter(Boolean).join(" ").toLowerCase();
      if (haystack.includes(q)) out.push({ type: "Outreach", item: o, label: o.company, sub: o.clientName });
    });

    // Notes
    (notes || []).forEach(n => {
      const haystack = [n.title, n.content].filter(Boolean).join(" ").toLowerCase();
      if (haystack.includes(q)) out.push({ type: "Note", item: n, label: n.title || "Untitled note", sub: "" });
    });

    return out.slice(0, 30);
  }, [query, allProjectsMerged, vendors, localLeads, localClients, outreach, notes]);

  const handleSelect = useCallback((result) => {
    // Save to recent
    const updated = [query.trim(), ...recentSearches.filter(s => s !== query.trim())].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    saveRecent(updated);
    setShowSearch(false);
    if (onNavigate) onNavigate(result.type, result.item);
  }, [query, recentSearches, setShowSearch, onNavigate]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") { setShowSearch(false); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && results[selectedIdx]) { e.preventDefault(); handleSelect(results[selectedIdx]); }
    };
    if (showSearch) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSearch, results, selectedIdx, handleSelect, setShowSearch]);

  useEffect(() => { setSelectedIdx(0); }, [query]);

  if (!showSearch) return null;

  const typeIcons = { Project: "\u{1F4C1}", Vendor: "\u{1F465}", Lead: "\u{1F4C8}", Client: "\u{1F91D}", Outreach: "\u{1F4E7}", Note: "\u{1F4DD}" };

  // Group results by type
  const grouped = {};
  results.forEach(r => {
    if (!grouped[r.type]) grouped[r.type] = [];
    grouped[r.type].push(r);
  });
  let flatIdx = 0;

  return (
    <div onClick={() => setShowSearch(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: isMobile ? 20 : 80 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 580, background: T.surface, borderRadius: 18, boxShadow: "0 24px 80px rgba(0,0,0,0.25)", border: `1px solid ${T.border}`, overflow: "hidden" }}>
        {/* Search input */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, color: T.muted, flexShrink: 0 }}>{"\u{1F50D}"}</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search projects, vendors, leads, notes..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 15, color: T.text, background: "transparent", fontFamily: "inherit" }}
          />
          <kbd style={{ fontSize: 10, color: T.muted, background: "#f0f0f0", padding: "2px 6px", borderRadius: 4, border: "1px solid #ddd" }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 420, overflowY: "auto", padding: "8px 0" }}>
          {query.trim() === "" && recentSearches.length > 0 && (
            <div>
              <div style={{ padding: "8px 20px 4px", fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Recent Searches</div>
              {recentSearches.map((s, i) => (
                <div key={i} onClick={() => setQuery(s)} style={{ padding: "8px 20px", cursor: "pointer", fontSize: 13, color: T.sub, display: "flex", alignItems: "center", gap: 8 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f5f5f7"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ color: T.muted }}>{"\u{1F552}"}</span> {s}
                </div>
              ))}
            </div>
          )}

          {query.trim() !== "" && results.length === 0 && (
            <div style={{ padding: "32px 20px", textAlign: "center", color: T.muted, fontSize: 13 }}>No results found</div>
          )}

          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <div style={{ padding: "10px 20px 4px", fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {typeIcons[type] || ""} {type}s
              </div>
              {items.map((r) => {
                const idx = flatIdx++;
                const isSelected = idx === selectedIdx;
                return (
                  <div
                    key={`${type}-${r.item.id}`}
                    onClick={() => handleSelect(r)}
                    style={{
                      padding: "9px 20px",
                      cursor: "pointer",
                      background: isSelected ? "#f0f0f5" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f5f7"; setSelectedIdx(idx); }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</div>
                      {r.sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{r.sub}</div>}
                    </div>
                    {isSelected && <span style={{ fontSize: 10, color: T.muted, flexShrink: 0 }}>{"\u23CE"} Enter</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
