import React, { useState, useRef, useCallback, useEffect } from "react";

const CS_FONT = "'Avenir','Avenir Next','Nunito Sans',sans-serif";

const makeBrief = (projectId) => ({
  id: Date.now() + Math.random(),
  projectId,
  title: "Local Production Brief",
  prodLogo: null,
  clientLogo: null,
  project: { name: "", client: "", date: "", producer: "", director: "" },
  overview: { description: "", objective: "", deliverables: "", budget: "", crewCount: "" },
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
  accommodation: { hotel: "", address: "", checkIn: "", checkOut: "", notes: "" },
  localCrew: { fixers: "", drivers: "", security: "", extras: "", notes: "" },
  transport: { vehicles: "", pickupDetails: "", airportTransfers: "", notes: "" },
  catering: { headcount: "", dietary: "", vendor: "", mealTimes: "", notes: "" },
  location: { primary: "", address: "", gps: "", contact: "", backup: "", notes: "" },
  permits: { required: "", authority: "", status: "", deadline: "", notes: "" },
  extraSections: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const PRINT_CLEANUP_CSS = '[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]{display:none!important;}';

// Reusable field components matching RecceField / RecceInp pattern
const PBInp = ({ value, onChange, placeholder, style: s = {} }) => (
  <input value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, border: "none", outline: "none", padding: "3px 6px",
      background: value ? "transparent" : "#FFFDE7", boxSizing: "border-box", width: "100%", color: "#000", ...s }} />
);
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
const SectionTitle = ({ title }) => (
  <div style={{ fontFamily: CS_FONT, fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: "#000", marginBottom: 6, borderBottom: "1px solid #eee", paddingBottom: 3 }}>{title}</div>
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
  const ac = brief.accommodation || {};
  const lc = brief.localCrew || {};
  const tr = brief.transport || {};
  const ct = brief.catering || {};
  const lo = brief.location || {};
  const pm = brief.permits || {};
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

          {/* ── PROJECT OVERVIEW ── */}
          <div style={{ padding: "0 16px" }}><SectionTitle title="PROJECT OVERVIEW" /></div>
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
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220, flex: 0 }}>
                {[
                  ["SHOOT DATES", "schedule", "shootDates", "e.g. 20-22 Mar 2026"],
                  ["NUMBER OF TRAVEL DAYS", "schedule", "travelDays", "e.g. 2"],
                  ["NUMBER OF RECCE DAYS", "schedule", "recceDays", "e.g. 1"],
                  ["NUMBER OF SHOOT DAYS", "schedule", "shootDays", "e.g. 4"],
                  ["NUMBER OF CREW", "overview", "crewCount", "e.g. 15"],
                ].map(([lbl, sec, key, ph]) => (
                  <div key={lbl} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000", whiteSpace: "nowrap", minWidth: 130 }}>{lbl}</span>
                    <PBInp value={(brief[sec] || {})[key]} onChange={v => u(sec, key, v)} placeholder={ph} style={{ flex: 1, borderBottom: "1px solid #eee", minWidth: 80 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Description — full width */}
          <div style={{ padding: "0 16px", marginBottom: 14 }}>
            <PBTextarea label="DESCRIPTION" value={ov.description} onChange={v => u("overview", "description", v)} placeholder="Brief project description, scope, objectives..." style={{ minWidth: "100%" }} />
          </div>

          <div style={{ padding: "0 16px" }}>

            {/* ── CREATIVE DIRECTION ── */}
            <SectionTitle title="CREATIVE DIRECTION" />
            <Row isMobile={isMobile}>
              <PBTextarea label="CREATIVE DIRECTION" value={cr.direction} onChange={v => u("creative", "direction", v)} placeholder="Look, feel, visual language..." style={{ minWidth: isMobile ? "100%" : "auto" }} />
            </Row>
            <Row isMobile={isMobile}>
              <PBField label="REFERENCES" value={cr.references} onChange={v => u("creative", "references", v)} placeholder="Mood refs, links..." style={{ minWidth: isMobile ? "100%" : "auto" }} />
            </Row>
            <Row isMobile={isMobile}>
              <PBField label="TONE / MOOD" value={cr.tone} onChange={v => u("creative", "tone", v)} placeholder="e.g. cinematic, warm, aspirational..." style={{ minWidth: isMobile ? "100%" : "auto" }} />
            </Row>

            {/* ── INTERNATIONAL CREW ── */}
            <SectionTitle title="INTERNATIONAL CREW" />
            {CREW_CATEGORIES.map(([catKey, catLabel]) => {
              const members = (cw[catKey] || []);
              return (
                <div key={catKey} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <div style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000" }}>{catLabel}</div>
                    <div data-hide="1" onClick={() => addCrewMember(catKey)} style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, color: "#000", cursor: "pointer", padding: "1px 6px", border: "1px dashed #ccc", borderRadius: 2, letterSpacing: 0.5 }}>+</div>
                  </div>
                  {members.map((m) => (
                    <div key={m.id} style={{ display: "flex", gap: 6, marginBottom: 3, alignItems: "center" }}>
                      <PBInp value={m.role} onChange={v => updateCrewMember(catKey, m.id, "role", v)} placeholder="Role" style={{ flex: 1, borderBottom: "1px solid #eee" }} />
                      <PBInp value={m.name} onChange={v => updateCrewMember(catKey, m.id, "name", v)} placeholder="Name" style={{ flex: 1, borderBottom: "1px solid #eee" }} />
                      <button data-hide="1" onClick={() => removeCrewMember(catKey, m.id)}
                        style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 11, fontFamily: CS_FONT, padding: "0 4px", lineHeight: 1, flexShrink: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* ── SCHEDULE ── */}
            <SectionTitle title="SCHEDULE" />
            <Row isMobile={isMobile}>
              <PBTextarea label="STRUCTURE" value={sc.structure} onChange={v => u("schedule", "structure", v)} placeholder="Arrival day, recce days, shoot days, wrap day, departure..." style={{ flex: 1, minWidth: isMobile ? "100%" : "auto" }} />
              <PBTextarea label="KEY MOMENTS" value={sc.keyMoments} onChange={v => u("schedule", "keyMoments", v)} placeholder="Sunrise, golden hour, underwater, evening scenes..." style={{ flex: 1, minWidth: isMobile ? "100%" : "auto" }} />
            </Row>

            {/* ── ACCOMMODATION ── */}
            <SectionTitle title="ACCOMMODATION" />
            <Row isMobile={isMobile}>
              <PBField label="HOTEL / PROPERTY" value={ac.hotel} onChange={v => u("accommodation", "hotel", v)} placeholder="Name" style={{ minWidth: isMobile ? "100%" : "auto" }} />
              <PBField label="ADDRESS" value={ac.address} onChange={v => u("accommodation", "address", v)} placeholder="Full address" style={{ flex: 2, minWidth: isMobile ? "100%" : "auto" }} />
            </Row>
            <Row isMobile={isMobile}>
              <PBField label="CHECK-IN" value={ac.checkIn} onChange={v => u("accommodation", "checkIn", v)} placeholder="Date" style={{ minWidth: isMobile ? "45%" : "auto" }} />
              <PBField label="CHECK-OUT" value={ac.checkOut} onChange={v => u("accommodation", "checkOut", v)} placeholder="Date" style={{ minWidth: isMobile ? "45%" : "auto" }} />
              <PBTextarea label="NOTES" value={ac.notes} onChange={v => u("accommodation", "notes", v)} placeholder="Room requirements, special requests..." style={{ flex: 2, minWidth: isMobile ? "100%" : "auto" }} />
            </Row>

            {/* ── LOCAL CREW ── */}
            <SectionTitle title="LOCAL CREW" />
            <Row isMobile={isMobile}>
              <PBField label="FIXERS" value={lc.fixers} onChange={v => u("localCrew", "fixers", v)} placeholder="Name / agency" style={{ minWidth: isMobile ? "45%" : "auto" }} />
              <PBField label="DRIVERS" value={lc.drivers} onChange={v => u("localCrew", "drivers", v)} placeholder="Name / agency" style={{ minWidth: isMobile ? "45%" : "auto" }} />
              <PBField label="SECURITY" value={lc.security} onChange={v => u("localCrew", "security", v)} placeholder="Name / agency" style={{ minWidth: isMobile ? "45%" : "auto" }} />
              <PBField label="EXTRAS" value={lc.extras} onChange={v => u("localCrew", "extras", v)} placeholder="Count / agency" style={{ minWidth: isMobile ? "45%" : "auto" }} />
            </Row>
            <Row isMobile={isMobile}>
              <PBTextarea label="NOTES" value={lc.notes} onChange={v => u("localCrew", "notes", v)} placeholder="Local crew details, contacts..." style={{ minWidth: isMobile ? "100%" : "auto" }} />
            </Row>

            {/* ── TRANSPORT ── */}
            <SectionTitle title="TRANSPORT" />
            <Row isMobile={isMobile}>
              <PBField label="VEHICLES" value={tr.vehicles} onChange={v => u("transport", "vehicles", v)} placeholder="Types, quantities..." style={{ minWidth: isMobile ? "100%" : "auto" }} />
              <PBField label="PICKUP DETAILS" value={tr.pickupDetails} onChange={v => u("transport", "pickupDetails", v)} placeholder="Times, locations..." style={{ minWidth: isMobile ? "100%" : "auto" }} />
              <PBField label="AIRPORT TRANSFERS" value={tr.airportTransfers} onChange={v => u("transport", "airportTransfers", v)} placeholder="Arrival / departure details..." style={{ minWidth: isMobile ? "100%" : "auto" }} />
            </Row>
            <Row isMobile={isMobile}>
              <PBTextarea label="NOTES" value={tr.notes} onChange={v => u("transport", "notes", v)} placeholder="Parking, access restrictions, unit base..." style={{ minWidth: isMobile ? "100%" : "auto" }} />
            </Row>

            {/* ── CATERING ── */}
            <SectionTitle title="CATERING" />
            <Row isMobile={isMobile}>
              <PBField label="HEADCOUNT" value={ct.headcount} onChange={v => u("catering", "headcount", v)} placeholder="No. of crew" style={{ flex: 0.5, minWidth: isMobile ? "45%" : "auto" }} />
              <PBField label="DIETARY REQUIREMENTS" value={ct.dietary} onChange={v => u("catering", "dietary", v)} placeholder="Vegan, halal, allergies..." style={{ flex: 1.5, minWidth: isMobile ? "100%" : "auto" }} />
              <PBField label="VENDOR" value={ct.vendor} onChange={v => u("catering", "vendor", v)} placeholder="Catering company" style={{ minWidth: isMobile ? "45%" : "auto" }} />
            </Row>
            <Row isMobile={isMobile}>
              <PBField label="MEAL TIMES" value={ct.mealTimes} onChange={v => u("catering", "mealTimes", v)} placeholder="Breakfast, lunch, snacks..." style={{ minWidth: isMobile ? "100%" : "auto" }} />
              <PBTextarea label="NOTES" value={ct.notes} onChange={v => u("catering", "notes", v)} placeholder="Special requests, hot/cold, setup..." style={{ flex: 1.5, minWidth: isMobile ? "100%" : "auto" }} />
            </Row>

            {/* ── LOCATION ── */}
            <SectionTitle title="LOCATION" />
            <Row isMobile={isMobile}>
              <PBField label="PRIMARY LOCATION" value={lo.primary} onChange={v => u("location", "primary", v)} placeholder="Location name" style={{ flex: 1.5, minWidth: isMobile ? "100%" : "auto" }} />
              <PBField label="ADDRESS" value={lo.address} onChange={v => u("location", "address", v)} placeholder="Full address" style={{ flex: 2, minWidth: isMobile ? "100%" : "auto" }} />
            </Row>
            <Row isMobile={isMobile}>
              <PBField label="GPS COORDINATES" value={lo.gps} onChange={v => u("location", "gps", v)} placeholder="25.2048, 55.2708" style={{ flex: 0.8, minWidth: isMobile ? "45%" : "auto" }} />
              <PBField label="CONTACT ON SITE" value={lo.contact} onChange={v => u("location", "contact", v)} placeholder="Name / phone" style={{ flex: 1, minWidth: isMobile ? "45%" : "auto" }} />
              <PBField label="BACKUP LOCATION" value={lo.backup} onChange={v => u("location", "backup", v)} placeholder="Alternative location..." style={{ flex: 1, minWidth: isMobile ? "100%" : "auto" }} />
            </Row>
            <Row isMobile={isMobile}>
              <PBTextarea label="NOTES" value={lo.notes} onChange={v => u("location", "notes", v)} placeholder="Access, power, parking, restrictions..." style={{ minWidth: isMobile ? "100%" : "auto" }} />
            </Row>

            {/* ── PERMITS REQUIRED ── */}
            <SectionTitle title="PERMITS REQUIRED" />
            <Row isMobile={isMobile}>
              <PBField label="PERMITS REQUIRED" value={pm.required} onChange={v => u("permits", "required", v)} placeholder="DFTC, council, community..." style={{ minWidth: isMobile ? "100%" : "auto" }} />
              <PBField label="ISSUING AUTHORITY" value={pm.authority} onChange={v => u("permits", "authority", v)} placeholder="Authority name" style={{ minWidth: isMobile ? "100%" : "auto" }} />
              <PBField label="STATUS" value={pm.status} onChange={v => u("permits", "status", v)} placeholder="Pending / Approved / N/A" style={{ minWidth: isMobile ? "45%" : "auto" }} />
            </Row>
            <Row isMobile={isMobile}>
              <PBField label="DEADLINE" value={pm.deadline} onChange={v => u("permits", "deadline", v)} placeholder="Submission deadline" style={{ flex: 0.6, minWidth: isMobile ? "45%" : "auto" }} />
              <PBTextarea label="NOTES" value={pm.notes} onChange={v => u("permits", "notes", v)} placeholder="Requirements, lead time, contacts..." style={{ flex: 2, minWidth: isMobile ? "100%" : "auto" }} />
            </Row>

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
