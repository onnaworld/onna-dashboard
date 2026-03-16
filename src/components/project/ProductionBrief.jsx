import React, { useState, useRef, useCallback, useEffect } from "react";

const CS_FONT = "'Avenir','Avenir Next','Nunito Sans',sans-serif";

const makeBrief = (projectId) => ({
  id: Date.now() + Math.random(),
  projectId,
  title: "Local Production Brief",
  prodLogo: null,
  clientLogo: null,
  project: { name: "", client: "", date: "", producer: "", director: "" },
  overview: { description: "", objective: "", deliverables: "", budget: "", crewCount: "", totalCrew: "" },
  creative: { direction: "", references: "", tone: "", keyMessages: "" },
  schedule: {
    recceDays: "", recceDates: "",
    shootDays: "", shootDates: "",
    travelDays: "", travelDates: "",
    prePro: "", wrapDate: "", notes: "", structure: "", keyMoments: "",
  },
  crew: {
    client: [{ id: Date.now()+0.1, role: "", name: "" }],
    production: [{ id: Date.now()+0.2, role: "", name: "" }],
    video: [{ id: Date.now()+0.3, role: "", name: "" }],
    photo: [{ id: Date.now()+0.4, role: "", name: "" }],
    wardrobe: [{ id: Date.now()+0.5, role: "", name: "" }],
    hairMakeup: [{ id: Date.now()+0.6, role: "", name: "" }],
    casting: [{ id: Date.now()+0.7, role: "", name: "" }],
    miscellaneous: [{ id: Date.now()+0.8, role: "", name: "" }],
  },
  localCrewList: {
    fixers: [{ id: Date.now()+0.9, role: "", name: "" }],
    drivers: [{ id: Date.now()+0.11, role: "", name: "" }],
    security: [{ id: Date.now()+0.12, role: "", name: "" }],
    extras: [{ id: Date.now()+0.13, role: "", name: "" }],
    miscellaneous: [{ id: Date.now()+0.14, role: "", name: "" }],
  },
  accommodation: { hotel: "", address: "", checkIn: "", checkOut: "", notes: "" },
  localCrew: { fixers: "", drivers: "", security: "", extras: "", notes: "" },
  transport: { vehicles: "", pickupDetails: "", airportTransfers: "", notes: "" },
  catering: { headcount: "", dietary: "", vendor: "", mealTimes: "", notes: "" },
  location: { primary: "", address: "", gps: "", contact: "", backup: "", notes: "" },
  permits: { required: "", authority: "", status: "", deadline: "", notes: "" },
  quote: [
    { id: Date.now()+0.21, heading: "CREW", lines: [{ id: Date.now()+0.211, label: "", value: "" }] },
    { id: Date.now()+0.22, heading: "TRANSPORT", lines: [{ id: Date.now()+0.221, label: "", value: "" }] },
    { id: Date.now()+0.23, heading: "CATERING", lines: [{ id: Date.now()+0.231, label: "", value: "" }] },
    { id: Date.now()+0.24, heading: "ACCOMMODATION", lines: [{ id: Date.now()+0.241, label: "", value: "" }] },
    { id: Date.now()+0.25, heading: "LOCATION", lines: [{ id: Date.now()+0.251, label: "", value: "" }] },
    { id: Date.now()+0.26, heading: "PERMITS", lines: [{ id: Date.now()+0.261, label: "", value: "" }] },
    { id: Date.now()+0.27, heading: "MISC", lines: [{ id: Date.now()+0.271, label: "", value: "" }] },
  ],
  extraSections: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const PRINT_CLEANUP_CSS = '[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]{display:none!important;}';

// Reusable field components matching RecceField / RecceInp pattern
const PBInp = ({ value, onChange, placeholder, style: s = {} }) => {
  const ref = useRef(null);
  const autoGrow = (el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } };
  useEffect(() => { autoGrow(ref.current); }, [value]);
  return (
    <textarea ref={ref} value={value || ""} onChange={e => { onChange(e.target.value); autoGrow(e.target); }} placeholder={placeholder} rows={1}
      style={{ fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, border: "none", outline: "none", padding: "3px 6px",
        background: value ? "transparent" : "#FFFDE7", boxSizing: "border-box", width: "100%", color: "#000",
        resize: "none", overflow: "hidden", lineHeight: 1.5, minHeight: 20, ...s }} />
  );
};
const PBField = ({ label, value, onChange, placeholder, color = "#000", style: s = {} }) => (
  <div style={{ flex: 1, minWidth: 140, ...s }}>
    <div style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color, marginBottom: 2 }}>{label}</div>
    <PBInp value={value} onChange={onChange} placeholder={placeholder} />
  </div>
);
const PBTextarea = ({ label, value, onChange, placeholder, color = "#000", style: s = {} }) => {
  const ref = useRef(null);
  const autoGrow = (el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } };
  useEffect(() => { autoGrow(ref.current); }, [value]);
  return (
    <div style={{ flex: 1, minWidth: 140, ...s }}>
      <div style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color, marginBottom: 2 }}>{label}</div>
      <textarea ref={ref} value={value || ""} onChange={e => { onChange(e.target.value); autoGrow(e.target); }} placeholder={placeholder}
        style={{ fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, border: "1px solid #eee", outline: "none", width: "100%",
          padding: "6px 8px", color: "#000", minHeight: 40, resize: "none", boxSizing: "border-box", lineHeight: 1.5,
          borderRadius: 2, background: value ? "#fff" : "#FFFDE7", overflow: "hidden" }} />
    </div>
  );
};
const CREW_CATEGORIES = [
  ["client", "CLIENT"], ["production", "PRODUCTION"], ["video", "VIDEO"],
  ["photo", "PHOTO"], ["wardrobe", "WARDROBE"], ["hairMakeup", "HAIR & MAKEUP"],
  ["casting", "CASTING"], ["miscellaneous", "MISCELLANEOUS"],
];
const LOCAL_CREW_CATEGORIES = [
  ["fixers", "FIXERS"], ["drivers", "DRIVERS"], ["security", "SECURITY"],
  ["extras", "EXTRAS"], ["miscellaneous", "MISCELLANEOUS"],
];
const SectionTitle = ({ title, num }) => (
  <div style={{ fontFamily: CS_FONT, fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: "#000", marginBottom: 6, borderBottom: "1px solid #eee", paddingBottom: 3 }}>{num ? `${num}. ` : ""}{title}</div>
);
const Row = ({ children, isMobile }) => (
  <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: isMobile ? "wrap" : "nowrap" }}>{children}</div>
);

// Stable contentEditable that only sets innerHTML on mount (avoids cursor reset on re-render)
const ExtraEditor = ({ id, content, editorRefs, focusedSection, setFocusedSection, updateExtraContent }) => {
  const ref = useRef(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (ref.current && !mounted.current) {
      ref.current.innerHTML = content || "";
      mounted.current = true;
    }
  }, []);
  useEffect(() => { editorRefs.current[id] = ref.current; }, [id, editorRefs]);
  const focused = focusedSection === id;
  return (
    <div ref={ref} contentEditable suppressContentEditableWarning
      onFocus={() => setFocusedSection(id)} onBlur={() => setFocusedSection(null)}
      onInput={() => updateExtraContent(id)}
      onKeyDown={e => { if (e.key === "a" && (e.metaKey || e.ctrlKey)) { /* allow default select-all */ } }}
      style={{ fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, lineHeight: 1.6,
        border: `1px solid ${focused ? "#000" : "#eee"}`,
        outline: "none", width: "100%", padding: "6px 8px", color: "#333",
        minHeight: 40, boxSizing: "border-box", borderRadius: 2,
        background: (ref.current?.innerHTML) ? "#fff" : "#FFFDE7", transition: "border-color 0.15s" }} />
  );
};

export default function ProductionBrief({
  T, isMobile, p,
  productionBriefStore, setProductionBriefStore,
  setCreativeSubSection, pushNav, showAlert, buildPath,
  CSLogoSlot,
}) {
  const brief = productionBriefStore[p.id] || null;
  const editorRefs = useRef({});
  const [focusedSection, setFocusedSection] = useState(null);

  useEffect(() => {
    if (!brief) {
      const init = makeBrief(p.id);
      init.project.name = `${p.client || ""} | ${p.name}`.replace(/^TEMPLATE \| /, "");
      init.project.client = p.client || "";
      setProductionBriefStore(prev => ({ ...prev, [p.id]: init }));
    }
  }, [p.id, brief, setProductionBriefStore]);

  const update = useCallback((fn) => {
    setProductionBriefStore(prev => {
      const b = prev[p.id];
      if (!b) return prev;
      return { ...prev, [p.id]: { ...fn(b), updatedAt: Date.now() } };
    });
  }, [p.id, setProductionBriefStore]);

  // Nested field updater: u("schedule","shootDays", val)
  const u = useCallback((section, key, val) => {
    update(b => ({ ...b, [section]: { ...(b[section] || {}), [key]: val } }));
  }, [update]);

  // Crew member helpers
  const addCrewMember = useCallback((catKey) => {
    update(b => ({ ...b, crew: { ...b.crew, [catKey]: [...(b.crew[catKey] || []), { id: Date.now() + Math.random(), role: "", name: "" }] } }));
  }, [update]);
  const removeCrewMember = useCallback((catKey, memberId) => {
    update(b => ({ ...b, crew: { ...b.crew, [catKey]: (b.crew[catKey] || []).filter(m => m.id !== memberId) } }));
  }, [update]);
  const updateCrewMember = useCallback((catKey, memberId, field, val) => {
    update(b => ({ ...b, crew: { ...b.crew, [catKey]: (b.crew[catKey] || []).map(m => m.id === memberId ? { ...m, [field]: val } : m) } }));
  }, [update]);

  // Local crew list helpers
  const addLocalCrewMember = useCallback((catKey) => {
    update(b => ({ ...b, localCrewList: { ...(b.localCrewList || {}), [catKey]: [...((b.localCrewList || {})[catKey] || []), { id: Date.now() + Math.random(), role: "", name: "" }] } }));
  }, [update]);
  const removeLocalCrewMember = useCallback((catKey, memberId) => {
    update(b => ({ ...b, localCrewList: { ...(b.localCrewList || {}), [catKey]: ((b.localCrewList || {})[catKey] || []).filter(m => m.id !== memberId) } }));
  }, [update]);
  const updateLocalCrewMember = useCallback((catKey, memberId, field, val) => {
    update(b => ({ ...b, localCrewList: { ...(b.localCrewList || {}), [catKey]: ((b.localCrewList || {})[catKey] || []).map(m => m.id === memberId ? { ...m, [field]: val } : m) } }));
  }, [update]);

  // Quote section helpers
  const addQuoteSection = useCallback(() => {
    update(b => ({ ...b, quote: [...(b.quote || []), { id: Date.now() + Math.random(), heading: "", lines: [{ id: Date.now() + Math.random(), label: "", value: "" }] }] }));
  }, [update]);
  const removeQuoteSection = useCallback((id) => {
    update(b => ({ ...b, quote: (b.quote || []).filter(q => q.id !== id) }));
  }, [update]);
  const updateQuoteHeading = useCallback((id, heading) => {
    update(b => ({ ...b, quote: (b.quote || []).map(q => q.id === id ? { ...q, heading } : q) }));
  }, [update]);
  const addQuoteLine = useCallback((sectionId) => {
    update(b => ({ ...b, quote: (b.quote || []).map(q => q.id === sectionId ? { ...q, lines: [...(q.lines || []), { id: Date.now() + Math.random(), label: "", value: "" }] } : q) }));
  }, [update]);
  const removeQuoteLine = useCallback((sectionId, lineId) => {
    update(b => ({ ...b, quote: (b.quote || []).map(q => q.id === sectionId ? { ...q, lines: (q.lines || []).filter(l => l.id !== lineId) } : q) }));
  }, [update]);
  const updateQuoteLine = useCallback((sectionId, lineId, field, val) => {
    update(b => ({ ...b, quote: (b.quote || []).map(q => q.id === sectionId ? { ...q, lines: (q.lines || []).map(l => l.id === lineId ? { ...l, [field]: val } : l) } : q) }));
  }, [update]);

  const fmt = (cmd, val) => { document.execCommand(cmd, false, val || null); };

  // Extra freeform sections (for anything beyond the structured ones)
  const addExtra = useCallback(() => {
    update(b => ({ ...b, extraSections: [...(b.extraSections || []), { id: Date.now() + Math.random(), heading: "", content: "" }] }));
  }, [update]);
  const removeExtra = useCallback((id) => {
    update(b => ({ ...b, extraSections: (b.extraSections || []).filter(s => s.id !== id) }));
  }, [update]);
  const updateExtraHeading = useCallback((id, heading) => {
    update(b => ({ ...b, extraSections: (b.extraSections || []).map(s => s.id === id ? { ...s, heading } : s) }));
  }, [update]);
  const updateExtraContent = useCallback((id) => {
    const el = editorRefs.current[id];
    if (!el) return;
    update(b => ({ ...b, extraSections: (b.extraSections || []).map(s => s.id === id ? { ...s, content: el.innerHTML } : s) }));
  }, [update]);

  // PDF export
  const exportPDF = useCallback(() => {
    const el = document.getElementById("onna-prodbr-print");
    if (!el) return;
    const clone = el.cloneNode(true);
    clone.querySelectorAll("[data-hide]").forEach(n => n.remove());
    clone.querySelectorAll("input, textarea").forEach(inp => {
      if (!inp.value || !inp.value.trim()) inp.style.display = "none";
      else { const s = document.createElement("span"); s.textContent = inp.value; s.style.cssText = inp.style.cssText; s.style.border = "none"; s.style.background = "none"; inp.replaceWith(s); }
    });
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>\u200B</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;font-size:10px;color:#1a1a1a}@media print{@page{margin:12mm;size:portrait}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);
    doc.close();
    doc.body.appendChild(doc.adoptNode(clone));
    setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 300);
  }, []);

  if (!brief) return null;

  const ov = brief.overview || {};
  const cr = brief.creative || {};
  const sc = brief.schedule || {};
  const cw = brief.crew || {};
  const extras = brief.extraSections || [];

  const TBtnStyle = { height: 22, minWidth: 22, borderRadius: 2, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 11, fontFamily: CS_FONT, padding: "0 4px", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" };

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={() => { setCreativeSubSection(null); window.history.back(); }} style={{ background: "none", border: "none", color: T.link, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>‹ Back to Creative</button>
        <div style={{ flex: 1 }} />
        <button onClick={exportPDF} style={{ padding: "6px 16px", borderRadius: 8, background: "#1d1d1f", color: "#fff", border: "none", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Export PDF</button>
      </div>

      {/* Formatting toolbar */}
      <div data-hide="1" style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 3, background: "#fafafa", flexWrap: "wrap", marginBottom: 0, borderRadius: "8px 8px 0 0", border: "1px solid #eee", borderBottom: "none" }}>
        <button onMouseDown={e => { e.preventDefault(); fmt("bold"); }} style={{ ...TBtnStyle, fontWeight: 700 }}>B</button>
        <button onMouseDown={e => { e.preventDefault(); fmt("italic"); }} style={{ ...TBtnStyle, fontStyle: "italic" }}>I</button>
        <button onMouseDown={e => { e.preventDefault(); fmt("underline"); }} style={{ ...TBtnStyle, textDecoration: "underline" }}>U</button>
        <button onMouseDown={e => { e.preventDefault(); fmt("strikeThrough"); }} style={{ ...TBtnStyle, textDecoration: "line-through" }}>S</button>
        <button onMouseDown={e => { e.preventDefault(); fmt("insertUnorderedList"); }} title="Bullet list" style={{ ...TBtnStyle, fontSize: 12 }}>•≡</button>
        <button onMouseDown={e => { e.preventDefault(); fmt("insertOrderedList"); }} title="Numbered list" style={{ ...TBtnStyle, fontSize: 10 }}>1≡</button>
        <button onMouseDown={e => { e.preventDefault(); fmt("indent"); }} title="Indent" style={TBtnStyle}>→</button>
        <button onMouseDown={e => { e.preventDefault(); fmt("outdent"); }} title="Outdent" style={TBtnStyle}>←</button>
        <div style={{ width: 1, height: 16, background: "#ddd", margin: "0 2px" }} />
        <select onMouseDown={e => e.stopPropagation()} onChange={e => { fmt("fontName", e.target.value); }} defaultValue="" style={{ ...TBtnStyle, minWidth: 80, padding: "0 4px", fontSize: 10 }}>
          <option value="">Font</option>
          <option value="Arial, sans-serif">Sans-serif</option>
          <option value="Georgia, serif">Serif</option>
          <option value="monospace">Mono</option>
          <option value="'Trebuchet MS'">Trebuchet</option>
          <option value="'Courier New'">Courier</option>
        </select>
        <select onMouseDown={e => e.stopPropagation()} onChange={e => { fmt("fontSize", e.target.value); }} defaultValue="" style={{ ...TBtnStyle, width: 44, padding: "0 4px", fontSize: 10 }}>
          <option value="">Size</option>
          <option value="1">XS</option>
          <option value="2">S</option>
          <option value="3">M</option>
          <option value="4">L</option>
          <option value="5">XL</option>
          <option value="6">XXL</option>
        </select>
        <div style={{ width: 1, height: 16, background: "#ddd", margin: "0 2px" }} />
        {["#1d1d1f", "#c0392b", "#1a56db", "#147d50", "#8e24aa", "#e67e22"].map(c => (
          <button key={c} onMouseDown={e => { e.preventDefault(); fmt("foreColor", c); }} title={c} style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: "1.5px solid rgba(0,0,0,0.18)", cursor: "pointer", padding: 0, flexShrink: 0 }} />
        ))}
        <div style={{ width: 1, height: 16, background: "#ddd", margin: "0 2px" }} />
        {[["#fff176", "Yellow"], ["#b3f0d4", "Green"], ["#b3d4f5", "Blue"], ["#ffd6d6", "Red"]].map(([bg, lbl]) => (
          <button key={bg} onMouseDown={e => { e.preventDefault(); fmt("hiliteColor", bg); }} title={`Highlight ${lbl}`} style={{ width: 14, height: 14, borderRadius: 2, background: bg, border: "1.5px solid rgba(0,0,0,0.12)", cursor: "pointer", padding: 0, flexShrink: 0 }} />
        ))}
        <button onMouseDown={e => { e.preventDefault(); fmt("hiliteColor", "transparent"); }} title="Clear highlight" style={{ ...TBtnStyle, fontSize: 9, color: "#999", minWidth: 14, width: 14, padding: 0 }}>✕</button>
      </div>

      {/* ── Print container ── */}
      <div id="onna-prodbr-print" style={{ background: "#fff", padding: 0, fontFamily: CS_FONT, borderRadius: 0 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", background: "#fff" }}>

          {/* Logo header */}
          <div style={{ padding: "20px 16px 0" }}>
            <img src="/onna-default-logo.png" alt="ONNA" style={{ maxHeight: 30, maxWidth: 120, objectFit: "contain" }} />
            <div style={{ borderBottom: "2.5px solid #000", marginBottom: 12, marginTop: 4 }} />
            <div style={{ fontFamily: CS_FONT, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>LOCAL PRODUCTION BRIEF</div>
          </div>

          {/* ── 1. PROJECT OVERVIEW ── */}
          <div style={{ padding: "0 16px" }}><SectionTitle title="PROJECT OVERVIEW" num={1} /></div>
          <div style={{ padding: "0 16px", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 16, flexWrap: isMobile ? "wrap" : "nowrap" }}>
              {/* Left column — project metadata */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 200 }}>
                {[
                  ["PROJECT", "name", "Project Name"],
                  ["CLIENT", "client", "Client"],
                  ["PRODUCER", "producer", "Producer"],
                  ["DIRECTOR", "director", "Director"],
                  ["DATE", "date", "Date"],
                ].map(([lbl, key, ph]) => (
                  <div key={key} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000", whiteSpace: "nowrap", minWidth: 60 }}>{lbl}</span>
                    <PBInp value={(brief.project || {})[key]} onChange={v => u("project", key, v)} placeholder={ph} style={{ flex: 1, borderBottom: "1px solid #eee" }} />
                  </div>
                ))}
              </div>
              {/* Right column — shoot info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 280, flex: 0 }}>
                {[
                  ["NUMBER OF TRAVEL DAYS", "schedule", "travelDays", "e.g. 2"],
                  ["NUMBER OF RECCE DAYS", "schedule", "recceDays", "e.g. 1"],
                  ["NUMBER OF SHOOT DAYS", "schedule", "shootDays", "e.g. 4"],
                  ["NUMBER OF INTERNATIONAL CREW", "overview", "crewCount", "e.g. 15"],
                  ["TOTAL CREW", "overview", "totalCrew", "e.g. 25"],
                ].map(([lbl, sec, key, ph]) => (
                  <div key={lbl} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000", whiteSpace: "nowrap", minWidth: 160 }}>{lbl}</span>
                    <PBInp value={(brief[sec] || {})[key]} onChange={v => u(sec, key, v)} placeholder={ph} style={{ flex: 1, borderBottom: "1px solid #eee", minWidth: 100 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: "0 16px" }}>

            {/* ── 2. CREATIVE DIRECTION ── */}
            <SectionTitle title="CREATIVE DIRECTION" num={2} />
            <Row isMobile={isMobile}>
              <PBTextarea label="DESCRIPTION" value={cr.direction} onChange={v => u("creative", "direction", v)} placeholder="Look, feel, visual language, scope, objectives..." style={{ minWidth: isMobile ? "100%" : "auto" }} />
            </Row>
            <Row isMobile={isMobile}>
              <PBField label="REFERENCES" value={cr.references} onChange={v => u("creative", "references", v)} placeholder="Mood refs, links..." style={{ minWidth: isMobile ? "100%" : "auto" }} />
            </Row>
            <Row isMobile={isMobile}>
              <PBField label="TONE / MOOD" value={cr.tone} onChange={v => u("creative", "tone", v)} placeholder="e.g. cinematic, warm, aspirational..." style={{ minWidth: isMobile ? "100%" : "auto" }} />
            </Row>

            {/* ── 3. CREW ── */}
            <SectionTitle title="CREW" num={3} />

            {/* International Crew sub-section */}
            <div style={{ fontFamily: CS_FONT, fontSize: 7.5, fontWeight: 700, letterSpacing: 0.5, color: "#000", marginBottom: 8, marginTop: 4 }}>INTERNATIONAL CREW</div>
            {(() => {
              let globalIdx = 0;
              return CREW_CATEGORIES.map(([catKey, catLabel]) => {
                const members = (cw[catKey] || []);
                return (
                  <div key={catKey} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <div style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000" }}>{catLabel}</div>
                      <div data-hide="1" onClick={() => addCrewMember(catKey)} style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, color: "#000", cursor: "pointer", padding: "1px 6px", border: "1px dashed #ccc", borderRadius: 2, letterSpacing: 0.5 }}>+</div>
                    </div>
                    {members.map((m) => {
                      globalIdx++;
                      return (
                        <div key={m.id} style={{ display: "flex", gap: 6, marginBottom: 3, alignItems: "center" }}>
                          <span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, color: "#000", minWidth: 16, textAlign: "right", flexShrink: 0 }}>{globalIdx}.</span>
                          <span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000", whiteSpace: "nowrap", minWidth: 60, flexShrink: 0 }}>
                            <input value={m.role || ""} onChange={e => updateCrewMember(catKey, m.id, "role", e.target.value)} placeholder="ROLE"
                              style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000", border: "none", outline: "none", background: "transparent", width: 60, padding: 0, textTransform: "uppercase" }} />
                          </span>
                          <PBInp value={m.name} onChange={v => updateCrewMember(catKey, m.id, "name", v)} placeholder="Name" style={{ flex: 1, borderBottom: "1px solid #eee" }} />
                          <button data-hide="1" onClick={() => removeCrewMember(catKey, m.id)}
                            style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 11, fontFamily: CS_FONT, padding: "0 4px", lineHeight: 1, flexShrink: 0 }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}

            {/* Local Crew sub-section */}
            <div style={{ fontFamily: CS_FONT, fontSize: 7.5, fontWeight: 700, letterSpacing: 0.5, color: "#000", marginBottom: 8, marginTop: 14, borderTop: "1px solid #eee", paddingTop: 8 }}>LOCAL CREW</div>
            {(() => {
              let localIdx = 0;
              return LOCAL_CREW_CATEGORIES.map(([catKey, catLabel]) => {
                const members = ((brief.localCrewList || {})[catKey] || []);
                return (
                  <div key={catKey} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <div style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000" }}>{catLabel}</div>
                      <div data-hide="1" onClick={() => addLocalCrewMember(catKey)} style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, color: "#000", cursor: "pointer", padding: "1px 6px", border: "1px dashed #ccc", borderRadius: 2, letterSpacing: 0.5 }}>+</div>
                    </div>
                    {members.map((m) => {
                      localIdx++;
                      return (
                        <div key={m.id} style={{ display: "flex", gap: 6, marginBottom: 3, alignItems: "center" }}>
                          <span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, color: "#000", minWidth: 16, textAlign: "right", flexShrink: 0 }}>{localIdx}.</span>
                          <span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000", whiteSpace: "nowrap", minWidth: 60, flexShrink: 0 }}>
                            <input value={m.role || ""} onChange={e => updateLocalCrewMember(catKey, m.id, "role", e.target.value)} placeholder="ROLE"
                              style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000", border: "none", outline: "none", background: "transparent", width: 60, padding: 0, textTransform: "uppercase" }} />
                          </span>
                          <PBInp value={m.name} onChange={v => updateLocalCrewMember(catKey, m.id, "name", v)} placeholder="Name" style={{ flex: 1, borderBottom: "1px solid #eee" }} />
                          <button data-hide="1" onClick={() => removeLocalCrewMember(catKey, m.id)}
                            style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 11, fontFamily: CS_FONT, padding: "0 4px", lineHeight: 1, flexShrink: 0 }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}

            {/* ── 4. SCHEDULE ── */}
            <SectionTitle title="SCHEDULE" num={4} />
            <Row isMobile={isMobile}>
              <PBTextarea label="STRUCTURE" value={sc.structure} onChange={v => u("schedule", "structure", v)} placeholder="Arrival day, recce days, shoot days, wrap day, departure..." style={{ flex: 1, minWidth: isMobile ? "100%" : "auto" }} />
              <PBTextarea label="KEY MOMENTS" value={sc.keyMoments} onChange={v => u("schedule", "keyMoments", v)} placeholder="Sunrise, golden hour, underwater, evening scenes..." style={{ flex: 1, minWidth: isMobile ? "100%" : "auto" }} />
            </Row>

            {/* ── 5. QUOTE ── */}
            <SectionTitle title="QUOTE" num={5} />
            {(brief.quote || []).map((q, qi) => (
              <div key={q.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, color: "#000", minWidth: 16, flexShrink: 0 }}>{qi + 1}.</span>
                  <input value={q.heading || ""} onChange={e => updateQuoteHeading(q.id, e.target.value)} placeholder="SECTION TITLE"
                    style={{ flex: 1, fontFamily: CS_FONT, fontSize: 7.5, fontWeight: 700, letterSpacing: 0.5, color: "#000", border: "none", outline: "none", background: "transparent", padding: 0, textTransform: "uppercase" }} />
                  <button data-hide="1" onClick={() => { if (confirm(`Delete "${q.heading || "Untitled"}"?`)) removeQuoteSection(q.id); }}
                    style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 11, fontFamily: CS_FONT, padding: "0 4px", lineHeight: 1, flexShrink: 0 }}>×</button>
                </div>
                {(q.lines || []).map((line, li) => (
                  <div key={line.id} style={{ display: "flex", gap: 6, marginBottom: 3, alignItems: "center", paddingLeft: 22 }}>
                    <span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, color: "#000", minWidth: 20, textAlign: "right", flexShrink: 0 }}>{qi + 1}.{li + 1}</span>
                    <input value={line.label || ""} onChange={e => updateQuoteLine(q.id, line.id, "label", e.target.value)} placeholder="LABEL"
                      style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000", border: "none", outline: "none", background: "transparent", width: 80, padding: 0, textTransform: "uppercase", flexShrink: 0 }} />
                    <PBInp value={line.value} onChange={v => updateQuoteLine(q.id, line.id, "value", v)} placeholder="Details..." style={{ flex: 1, borderBottom: "1px solid #eee" }} />
                    <button data-hide="1" onClick={() => removeQuoteLine(q.id, line.id)}
                      style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 11, fontFamily: CS_FONT, padding: "0 4px", lineHeight: 1, flexShrink: 0 }}>×</button>
                  </div>
                ))}
                <div data-hide="1" onClick={() => addQuoteLine(q.id)} style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, color: "#000", cursor: "pointer", padding: "2px 8px", border: "1px dashed #ccc", borderRadius: 2, letterSpacing: 0.5, display: "inline-block", marginLeft: 22, marginTop: 2 }}>+ LINE</div>
              </div>
            ))}
            <div data-hide="1" onClick={addQuoteSection} style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, color: "#000", cursor: "pointer", padding: "3px 10px", border: "1px dashed #ccc", borderRadius: 2, letterSpacing: 0.5, display: "inline-block", marginTop: 4 }}>+ SECTION</div>

            {/* ── EXTRA FREEFORM SECTIONS ── */}
            {extras.map((s) => (
              <div key={s.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: 3, marginBottom: 6 }}>
                  <input value={s.heading} onChange={e => updateExtraHeading(s.id, e.target.value)} placeholder="SECTION TITLE"
                    style={{ flex: 1, fontFamily: CS_FONT, fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: "#000", border: "none", outline: "none", background: "transparent", padding: 0, textTransform: "uppercase" }} />
                  <button data-hide="1" onClick={() => { if (confirm(`Delete section "${s.heading || "Untitled"}"?`)) removeExtra(s.id); }}
                    style={{ ...TBtnStyle, color: "#c0392b", fontSize: 11, height: 18, minWidth: 18 }}>×</button>
                </div>
                <ExtraEditor id={s.id} content={s.content} editorRefs={editorRefs}
                  focusedSection={focusedSection} setFocusedSection={setFocusedSection}
                  updateExtraContent={updateExtraContent} />
              </div>
            ))}

            {/* Add section */}
            <div data-hide="1" style={{ marginBottom: 16 }}>
              <div onClick={addExtra} style={{ fontFamily: CS_FONT, fontSize: 8, fontWeight: 700, letterSpacing: 0.5, padding: "5px 12px", cursor: "pointer", borderRadius: 2, border: "1px dashed #ccc", color: "#999", display: "inline-block" }}>+ ADD SECTION</div>
            </div>

          </div>

          {/* ONNA footer */}
          <div style={{ padding: "0 16px 16px" }}>
            <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, color: "#000", borderTop: "2px solid #000", paddingTop: 10 }}>
              <div><div style={{ fontWeight: 700 }}>@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700 }}>WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
