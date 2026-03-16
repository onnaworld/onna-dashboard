import React, { useState, useRef, useCallback, useEffect } from "react";

const CS_FONT = "'Avenir','Avenir Next','Nunito Sans',sans-serif";
const CS_LS = "letter-spacing:1.5px;";

const DEFAULT_SECTIONS = [
  "PROJECT OVERVIEW","CREATIVE DIRECTION","CREW BREAKDOWN","SCHEDULE",
  "ACCOMMODATION","LOCAL CREW","TRANSPORT","CATERING","LOCATION","PERMITS REQUIRED"
];

const makeBrief = (projectId) => ({
  id: Date.now() + Math.random(),
  projectId,
  title: "Local Production Brief",
  prodLogo: null,
  clientLogo: null,
  project: { name: "", client: "", date: "", producer: "", director: "" },
  sections: DEFAULT_SECTIONS.map((h,i) => ({ id: Date.now()+i+Math.random(), heading: h, content: "" })),
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const PRINT_CLEANUP_CSS = '[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]{display:none!important;}';

export default function ProductionBrief({
  T, isMobile, p,
  productionBriefStore, setProductionBriefStore,
  setCreativeSubSection, pushNav, showAlert, buildPath,
  CSLogoSlot, BtnExport,
}) {
  const brief = productionBriefStore[p.id] || null;
  const editorRefs = useRef({});
  const [focusedSection, setFocusedSection] = useState(null);

  // Create default brief on first visit
  useEffect(() => {
    if (!brief) {
      const init = makeBrief(p.id);
      init.project.name = `${p.client||""} | ${p.name}`.replace(/^TEMPLATE \| /,"");
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

  const fmt = (cmd, val) => { document.execCommand(cmd, false, val || null); };

  const updateSectionContent = useCallback((sectionId) => {
    const el = editorRefs.current[sectionId];
    if (!el) return;
    update(b => ({
      ...b,
      sections: b.sections.map(s => s.id === sectionId ? { ...s, content: el.innerHTML } : s),
    }));
  }, [update]);

  const updateSectionHeading = useCallback((sectionId, heading) => {
    update(b => ({
      ...b,
      sections: b.sections.map(s => s.id === sectionId ? { ...s, heading } : s),
    }));
  }, [update]);

  const addSection = useCallback(() => {
    update(b => ({
      ...b,
      sections: [...b.sections, { id: Date.now() + Math.random(), heading: "", content: "" }],
    }));
  }, [update]);

  const removeSection = useCallback((sectionId) => {
    update(b => ({
      ...b,
      sections: b.sections.filter(s => s.id !== sectionId),
    }));
  }, [update]);

  const moveSection = useCallback((sectionId, dir) => {
    update(b => {
      const idx = b.sections.findIndex(s => s.id === sectionId);
      if (idx < 0) return b;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= b.sections.length) return b;
      const arr = [...b.sections];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...b, sections: arr };
    });
  }, [update]);

  // PDF export — clone the print container, replace inputs with spans
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

  const projU = (key, val) => update(b => ({ ...b, project: { ...b.project, [key]: val } }));

  const TBtnStyle = { height: 22, minWidth: 22, borderRadius: 2, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 11, fontFamily: CS_FONT, padding: "0 4px", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" };

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={() => { setCreativeSubSection(null); window.history.back(); }} style={{ background: "none", border: "none", color: T.link, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>‹ Back to Creative</button>
        <div style={{ flex: 1 }} />
        <button onClick={exportPDF} style={{ padding: "6px 16px", borderRadius: 8, background: "#1d1d1f", color: "#fff", border: "none", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Export PDF</button>
      </div>

      {/* Formatting toolbar — outside the print container */}
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

      {/* ── Print container (white document) ── */}
      <div id="onna-prodbr-print" style={{ background: "#fff", padding: 0, fontFamily: CS_FONT, borderRadius: 0 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", background: "#fff" }}>

          {/* Logo header */}
          <div style={{ padding: "20px 16px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                <img src="/onna-default-logo.png" alt="ONNA" style={{ maxHeight: 30, maxWidth: 120, objectFit: "contain" }} />
                <div style={{ fontFamily: CS_FONT, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>LOCAL PRODUCTION BRIEF</div>
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: -3 }}>
                <CSLogoSlot label="Production Logo" image={brief.prodLogo} onUpload={v => update(b => ({ ...b, prodLogo: v }))} onRemove={() => update(b => ({ ...b, prodLogo: null }))} />
                <CSLogoSlot label="Client Logo" image={brief.clientLogo} onUpload={v => update(b => ({ ...b, clientLogo: v }))} onRemove={() => update(b => ({ ...b, clientLogo: null }))} />
              </div>
            </div>
            <div style={{ borderBottom: "2.5px solid #000", marginBottom: 12 }} />
          </div>

          {/* Project metadata row */}
          <div style={{ padding: "0 16px", display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            {[["PROJECT", "name", "Project Name"], ["CLIENT", "client", "Client"], ["DATE", "date", "Date"], ["PRODUCER", "producer", "Producer"], ["DIRECTOR", "director", "Director"]].map(([lbl, key, ph]) => (
              <div key={key} style={{ display: "flex", gap: 4, alignItems: "baseline" }}>
                <span style={{ fontFamily: CS_FONT, fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>{lbl}:</span>
                <input value={(brief.project || {})[key] || ""} onChange={e => projU(key, e.target.value)} placeholder={ph}
                  style={{ fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, border: "none", outline: "none", padding: "3px 6px", background: (brief.project || {})[key] ? "transparent" : "#FFFDE7", boxSizing: "border-box", width: 100, borderBottom: "1px solid #eee" }} />
              </div>
            ))}
          </div>

          {/* Document title */}
          <div style={{ padding: "0 16px", marginBottom: 14 }}>
            <input
              value={brief.title}
              onChange={e => update(b => ({ ...b, title: e.target.value }))}
              placeholder="Document Title"
              style={{ fontFamily: CS_FONT, fontSize: 20, fontWeight: 700, border: "none", outline: "none", background: "transparent", width: "100%", boxSizing: "border-box", padding: 0, color: "#000" }}
            />
          </div>

          {/* Sections */}
          <div style={{ padding: "0 16px" }}>
            {brief.sections.map((s, idx) => (
              <div key={s.id} style={{ marginBottom: 16 }}>
                {/* Section heading */}
                <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: 3, marginBottom: 6 }}>
                  <input
                    value={s.heading}
                    onChange={e => updateSectionHeading(s.id, e.target.value)}
                    placeholder="SECTION TITLE"
                    style={{ flex: 1, fontFamily: CS_FONT, fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: "#999", border: "none", outline: "none", background: "transparent", padding: 0, textTransform: "uppercase" }}
                  />
                  <div data-hide="1" style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    <button onClick={() => moveSection(s.id, -1)} disabled={idx === 0} style={{ ...TBtnStyle, opacity: idx === 0 ? 0.3 : 1, fontSize: 9, height: 18, minWidth: 18 }}>↑</button>
                    <button onClick={() => moveSection(s.id, 1)} disabled={idx === brief.sections.length - 1} style={{ ...TBtnStyle, opacity: idx === brief.sections.length - 1 ? 0.3 : 1, fontSize: 9, height: 18, minWidth: 18 }}>↓</button>
                    <button onClick={() => { if (confirm(`Delete section "${s.heading || "Untitled"}"?`)) removeSection(s.id); }} style={{ ...TBtnStyle, color: "#c0392b", fontSize: 11, height: 18, minWidth: 18 }}>×</button>
                  </div>
                </div>
                {/* Content editable area */}
                <div
                  ref={el => { editorRefs.current[s.id] = el; }}
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={() => setFocusedSection(s.id)}
                  onBlur={() => setFocusedSection(null)}
                  onInput={() => updateSectionContent(s.id)}
                  dangerouslySetInnerHTML={{ __html: s.content }}
                  style={{
                    fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, lineHeight: 1.6,
                    border: `1px solid ${focusedSection === s.id ? "#000" : "#eee"}`,
                    outline: "none", width: "100%", padding: "6px 8px", color: "#333",
                    minHeight: 40, boxSizing: "border-box", borderRadius: 2,
                    background: s.content ? "#fff" : "#FFFDE7",
                    transition: "border-color 0.15s",
                  }}
                />
              </div>
            ))}

            {/* Add section button */}
            <div data-hide="1" style={{ marginBottom: 16 }}>
              <div onClick={addSection} style={{ fontFamily: CS_FONT, fontSize: 8, fontWeight: 700, letterSpacing: 0.5, padding: "5px 12px", cursor: "pointer", borderRadius: 2, border: "1px dashed #ccc", color: "#999", display: "inline-block" }}>+ ADD SECTION</div>
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
