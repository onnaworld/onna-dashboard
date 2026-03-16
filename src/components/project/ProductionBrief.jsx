import React, { useState, useRef, useCallback, useEffect } from "react";

const DEFAULT_SECTIONS = [
  "PROJECT OVERVIEW","CREATIVE DIRECTION","CREW BREAKDOWN","SCHEDULE",
  "ACCOMMODATION","LOCAL CREW","TRANSPORT","CATERING","LOCATION","PERMITS REQUIRED"
];

const makeBrief = (projectId) => ({
  id: Date.now() + Math.random(),
  projectId,
  title: "Local Production Brief",
  prodLogo: null,
  sections: DEFAULT_SECTIONS.map((h,i) => ({ id: Date.now()+i+Math.random(), heading: h, content: "" })),
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export default function ProductionBrief({
  T, isMobile, p,
  productionBriefStore, setProductionBriefStore,
  setCreativeSubSection, pushNav, showAlert, buildPath,
  CSLogoSlot,
}) {
  const brief = productionBriefStore[p.id] || null;
  const editorRefs = useRef({});
  const [focusedSection, setFocusedSection] = useState(null);

  // Create default brief on first visit
  useEffect(() => {
    if (!brief) {
      setProductionBriefStore(prev => ({ ...prev, [p.id]: makeBrief(p.id) }));
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

  // PDF export
  const exportPDF = useCallback(() => {
    if (!brief) return;
    const e = s => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const logoHtml = brief.prodLogo
      ? `<img src="${brief.prodLogo}" style="max-height:30px;max-width:120px;object-fit:contain"/>`
      : "";
    const sectionsHtml = brief.sections.map(s =>
      `<h2 style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;border-bottom:2px solid #000;padding-bottom:5px;margin:24px 0 10px;">${e(s.heading || "Untitled Section")}</h2><div style="font-size:10pt;line-height:1.7;margin-bottom:8px;">${s.content || "<p style='color:#999;'>—</p>"}</div>`
    ).join("");
    const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${e(brief.title)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10.5pt;color:#111;background:#fff;padding:40px 40px;line-height:1.65;}
h2{page-break-after:avoid;}
ul,ol{margin-left:18px;margin-bottom:6px;}
li{margin-bottom:2px;}
.ftr{margin-top:36px;padding-top:10px;border-top:1px solid #e0e0e0;font-size:7.5pt;color:#aaa;display:flex;justify-content:space-between;}
@media print{body{padding:15mm 12mm;}@page{margin:0;size:A4;}}
</style>
</head><body>
<div style="margin-bottom:4px">${logoHtml}</div>
<div style="border-bottom:2.5px solid #000;margin-bottom:16px"></div>
<div style="font-size:20pt;font-weight:700;margin-bottom:18px;">${e(brief.title)}</div>
${sectionsHtml}
<div class="ftr"><span>ONNA FILM TV RADIO PRODUCTION SERVICES LLC · DUBAI &amp; LONDON</span><span>Generated ${date}</span></div>
</body></html>`;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    doc.open(); doc.write(html); doc.close();
    setTimeout(() => {
      doc.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(el => el.remove());
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  }, [brief]);

  if (!brief) return null;

  const TBtnStyle = { height: 26, minWidth: 26, borderRadius: 5, border: `1px solid ${T.border}`, background: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit", padding: "0 5px", display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <button onClick={() => { setCreativeSubSection(null); window.history.back(); }} style={{ background: "none", border: "none", color: T.link, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>‹ Back to Creative</button>
        <button onClick={exportPDF} style={{ padding: "8px 18px", borderRadius: 10, background: T.accent, color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit" }}>Export PDF</button>
      </div>

      {/* Document container */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: isMobile ? "20px 16px" : "32px 36px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        {/* Logo slot */}
        <CSLogoSlot
          label="Production Logo"
          image={brief.prodLogo}
          onUpload={(dataUrl) => update(b => ({ ...b, prodLogo: dataUrl }))}
          onRemove={() => update(b => ({ ...b, prodLogo: null }))}
        />
        {/* Divider */}
        <div style={{ borderBottom: "2.5px solid #000", marginBottom: 16, marginTop: 8 }} />

        {/* Document title */}
        <input
          value={brief.title}
          onChange={e => update(b => ({ ...b, title: e.target.value }))}
          placeholder="Document Title"
          style={{ border: "none", fontSize: 22, fontWeight: 700, color: T.text, outline: "none", background: "transparent", fontFamily: "inherit", width: "100%", boxSizing: "border-box", marginBottom: 16, padding: 0 }}
        />

        {/* Formatting toolbar */}
        <div style={{ padding: "6px 10px", borderBottom: `1px solid ${T.borderSub}`, borderTop: `1px solid ${T.borderSub}`, display: "flex", alignItems: "center", gap: 3, background: "#fafafa", flexWrap: "wrap", marginBottom: 20, borderRadius: 8, position: "sticky", top: 0, zIndex: 10 }}>
          <button onMouseDown={e => { e.preventDefault(); fmt("bold"); }} style={{ ...TBtnStyle, fontWeight: 700 }}>B</button>
          <button onMouseDown={e => { e.preventDefault(); fmt("italic"); }} style={{ ...TBtnStyle, fontStyle: "italic" }}>I</button>
          <button onMouseDown={e => { e.preventDefault(); fmt("underline"); }} style={{ ...TBtnStyle, textDecoration: "underline" }}>U</button>
          <button onMouseDown={e => { e.preventDefault(); fmt("strikeThrough"); }} style={{ ...TBtnStyle, textDecoration: "line-through" }}>S</button>
          <button onMouseDown={e => { e.preventDefault(); fmt("insertUnorderedList"); }} title="Bullet list" style={{ ...TBtnStyle, fontSize: 13 }}>•≡</button>
          <button onMouseDown={e => { e.preventDefault(); fmt("insertOrderedList"); }} title="Numbered list" style={{ ...TBtnStyle, fontSize: 11 }}>1≡</button>
          <button onMouseDown={e => { e.preventDefault(); fmt("indent"); }} title="Indent" style={TBtnStyle}>→</button>
          <button onMouseDown={e => { e.preventDefault(); fmt("outdent"); }} title="Outdent" style={TBtnStyle}>←</button>
          <div style={{ width: 1, height: 18, background: T.border, margin: "0 2px" }} />
          <select onMouseDown={e => e.stopPropagation()} onChange={e => { fmt("fontName", e.target.value); }} defaultValue="" style={{ ...TBtnStyle, minWidth: 90, padding: "0 4px", fontSize: 11 }}>
            <option value="">Font</option>
            <option value="Arial, sans-serif">Sans-serif</option>
            <option value="Georgia, serif">Serif</option>
            <option value="monospace">Mono</option>
            <option value="'Trebuchet MS'">Trebuchet</option>
            <option value="'Courier New'">Courier</option>
          </select>
          <select onMouseDown={e => e.stopPropagation()} onChange={e => { fmt("fontSize", e.target.value); }} defaultValue="" style={{ ...TBtnStyle, width: 50, padding: "0 4px", fontSize: 11 }}>
            <option value="">Size</option>
            <option value="1">XS</option>
            <option value="2">S</option>
            <option value="3">M</option>
            <option value="4">L</option>
            <option value="5">XL</option>
            <option value="6">XXL</option>
          </select>
          <div style={{ width: 1, height: 18, background: T.border, margin: "0 2px" }} />
          {["#1d1d1f", "#c0392b", "#1a56db", "#147d50", "#8e24aa", "#e67e22"].map(c => (
            <button key={c} onMouseDown={e => { e.preventDefault(); fmt("foreColor", c); }} title={c} style={{ width: 16, height: 16, borderRadius: "50%", background: c, border: "1.5px solid rgba(0,0,0,0.18)", cursor: "pointer", padding: 0, flexShrink: 0 }} />
          ))}
          <div style={{ width: 1, height: 18, background: T.border, margin: "0 2px" }} />
          {[["#fff176", "Yellow"], ["#b3f0d4", "Green"], ["#b3d4f5", "Blue"], ["#ffd6d6", "Red"]].map(([bg, lbl]) => (
            <button key={bg} onMouseDown={e => { e.preventDefault(); fmt("hiliteColor", bg); }} title={`Highlight ${lbl}`} style={{ width: 16, height: 16, borderRadius: 3, background: bg, border: "1.5px solid rgba(0,0,0,0.12)", cursor: "pointer", padding: 0, flexShrink: 0 }} />
          ))}
          <button onMouseDown={e => { e.preventDefault(); fmt("hiliteColor", "transparent"); }} title="Clear highlight" style={{ ...TBtnStyle, fontSize: 10, color: T.muted, minWidth: 16, width: 16, padding: 0 }}>✕</button>
        </div>

        {/* Sections */}
        {brief.sections.map((s, idx) => (
          <div key={s.id} style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <input
                value={s.heading}
                onChange={e => updateSectionHeading(s.id, e.target.value)}
                placeholder="Section Title"
                style={{ flex: 1, border: "none", borderBottom: `1.5px solid ${T.border}`, fontSize: 12, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: T.text, outline: "none", background: "transparent", fontFamily: "inherit", padding: "6px 0" }}
              />
              <button onClick={() => moveSection(s.id, -1)} disabled={idx === 0} title="Move up" style={{ ...TBtnStyle, fontSize: 11, opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
              <button onClick={() => moveSection(s.id, 1)} disabled={idx === brief.sections.length - 1} title="Move down" style={{ ...TBtnStyle, fontSize: 11, opacity: idx === brief.sections.length - 1 ? 0.3 : 1 }}>↓</button>
              <button onClick={() => { if (confirm(`Delete section "${s.heading || "Untitled"}"?`)) removeSection(s.id); }} title="Remove section" style={{ ...TBtnStyle, color: "#c0392b", fontSize: 14 }}>×</button>
            </div>
            <div
              ref={el => { editorRefs.current[s.id] = el; }}
              contentEditable
              suppressContentEditableWarning
              onFocus={() => setFocusedSection(s.id)}
              onInput={() => updateSectionContent(s.id)}
              dangerouslySetInnerHTML={{ __html: s.content }}
              style={{ minHeight: 60, padding: "10px 14px", border: `1px solid ${focusedSection === s.id ? T.accent : T.border}`, borderRadius: 8, outline: "none", fontSize: 13.5, fontFamily: "inherit", color: T.text, lineHeight: 1.75, background: "#fafafa", transition: "border-color 0.15s" }}
            />
          </div>
        ))}

        {/* Add section button */}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={addSection} style={{ padding: "8px 18px", borderRadius: 10, background: "#f5f5f7", border: `1px solid ${T.border}`, color: T.text, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>+ Add Section</button>
        </div>
      </div>
    </div>
  );
}
