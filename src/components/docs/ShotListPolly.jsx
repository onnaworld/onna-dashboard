import React, { useState, useEffect, useRef, useCallback, useImperativeHandle } from "react";
import { validateImg } from "../ui/DocHelpers";

const F = "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
const LS = 0.5;
const YELLOW = "#FFF9C4";

const Hl = ({ text, style = {} }) => {
  if (!text) return null;
  const parts = String(text).split(/(\[.*?\])/g);
  return <span style={style}>{parts.map((p, i) => p.startsWith("[") && p.endsWith("]")
    ? <span key={i} style={{ background: YELLOW, borderRadius: 2, padding: "0 2px" }}>{p}</span>
    : <span key={i}>{p}</span>)}</span>;
};

const Cell = ({ value, onChange, style = {}, align = "left", placeholder = "", multiline = false }) => {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);
  const inputRef = useRef(null);
  useEffect(() => { setTemp(value); }, [value]);
  const commit = () => { setEditing(false); onChange(temp); };
  const isP = (v) => v && v.startsWith("[") && v.endsWith("]");
  const startEdit = () => { setTemp(isP(value) ? "" : value); setEditing(true); };
  useEffect(() => { if (editing && inputRef.current) inputRef.current.select(); }, [editing]);
  if (editing && multiline) {
    return <input ref={inputRef} autoFocus value={temp} onChange={e => setTemp(e.target.value)}
      onBlur={commit} onKeyDown={e => e.key === "Enter" && commit()}
      placeholder={placeholder || (isP(value) ? value.slice(1, -1) : "")}
      style={{ fontFamily: F, fontSize: 9, letterSpacing: LS, border: "1px solid #f0f0f0", outline: "none",
        background: "#FFFDE7", width: "100%", boxSizing: "border-box", padding: "4px 8px", height: 24,
        textAlign: align, borderRadius: 2, ...style }} />;
  }
  if (editing) {
    return <input ref={inputRef} autoFocus value={temp} onChange={e => setTemp(e.target.value)}
      onBlur={commit} onKeyDown={e => e.key === "Enter" && commit()}
      placeholder={placeholder || (isP(value) ? value.slice(1, -1) : "")}
      style={{ fontFamily: F, fontSize: 9, letterSpacing: LS, border: "none", outline: "none",
        background: "#FFFDE7", width: "100%", boxSizing: "border-box", padding: "3px 6px",
        textAlign: align, ...style }} />;
  }
  return (
    <div onClick={startEdit}
      style={{ fontFamily: F, fontSize: 9, letterSpacing: LS, cursor: "text", padding: multiline ? "4px 8px" : "3px 6px",
        minHeight: multiline ? 24 : 18, textAlign: align, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        lineHeight: multiline ? "16px" : "normal",
        border: multiline ? "1px solid #f0f0f0" : "none", borderRadius: multiline ? 2 : 0, ...style }}
      onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
      onMouseLeave={e => e.currentTarget.style.background = multiline ? "#fff" : "transparent"}>
      {value ? <Hl text={value} /> : <span style={{ color: "#ddd" }}>{placeholder || "\u2014"}</span>}
    </div>
  );
};


/* ======= BADGES ======= */
const STATUSES = ["Planned", "In Progress", "Shot", "Approved"];
const STATUS_ROW = {
  "Planned": { bg: "transparent", border: "#f0f0f0", dot: "#ccc" },
  "In Progress": { bg: "#FFF8E1", border: "#FFD54F", dot: "#E65100" },
  "Shot": { bg: "#E3F2FD40", border: "#90CAF9", dot: "#1565C0" },
  "Approved": { bg: "#E8F5E920", border: "#A5D6A7", dot: "#2E7D32" },
};
const TypeBadge = ({ value, onChange }) => {
  const types = ["STILLS", "MOTION", "BOTH"];
  const colors = { "STILLS": { bg: "#E8F5E9", text: "#2E7D32" }, "MOTION": { bg: "#E3F2FD", text: "#0D47A1" }, "BOTH": { bg: "#F3E5F5", text: "#6A1B9A" } };
  const cycle = () => { const i = types.indexOf(value); onChange(types[(i + 1) % types.length]); };
  const c = colors[value] || colors["STILLS"];
  return <div onClick={cycle} style={{ fontFamily: F, fontSize: 7, fontWeight: 700, letterSpacing: LS, background: c.bg, color: c.text, padding: "3px 6px", borderRadius: 2, cursor: "pointer", textAlign: "center", userSelect: "none" }}>{value}</div>;
};

/* ======= DROPDOWNS ======= */
const FRAMES = ["ECU", "CU", "MCU", "MS", "MWS", "WS", "EWS", "OTS", "POV", "AERIAL", "OTHER"];
const MOVEMENTS = ["STATIC", "PAN", "TILT", "DOLLY", "TRACK", "CRANE", "HANDHELD", "STEADICAM", "GIMBAL", "DRONE", "ZOOM", "RACK FOCUS", "OTHER"];
const DropSelect = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, padding: "3px 6px", cursor: "pointer", color: value ? "#1a1a1a" : "#ddd", fontWeight: value ? 600 : 400 }}>{value || "\u2014"}</div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, background: "#fff", border: "1px solid #ddd", zIndex: 20, minWidth: 70, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: 200, overflowY: "auto" }}>
          {options.map(f => (
            <div key={f} onClick={() => { onChange(f); setOpen(false); }}
              style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, padding: "4px 8px", cursor: "pointer", borderBottom: "1px solid #f5f5f5", fontWeight: value === f ? 700 : 400 }}
              onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>{f}</div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ======= IMAGE GRID WITH DRAG & DROP ======= */
const ImageGrid = ({ images, onChange, label, maxImages = 7 }) => {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFiles = (files) => {
    const newImgs = [...(images || [])];
    Array.from(files).slice(0, maxImages - newImgs.length).forEach(file => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newImgs.push({ url: e.target.result, caption: "" });
          onChange([...newImgs]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); };
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const removeImg = (i) => { const n = [...(images || [])]; n.splice(i, 1); onChange(n); };
  const updateCaption = (i, cap) => { const n = [...(images || [])]; n[i] = { ...n[i], caption: cap }; onChange(n); };
  const imgs = images || [];

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontFamily: F, fontSize: 7, fontWeight: 700, letterSpacing: LS, color: "#999", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}
        onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
        {imgs.map((img, i) => (
          <div key={i} style={{ width: 110 }}>
            <div style={{ position: "relative", width: 110, height: 90, background: "#eee", borderRadius: 2, overflow: "hidden", border: "1px solid #ddd" }}>
              <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
              <div data-export-hide="1" onClick={() => removeImg(i)} style={{ position: "absolute", top: 3, right: 3, fontSize: 10, color: "#fff", cursor: "pointer", background: "rgba(0,0,0,0.5)", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                onMouseEnter={e => e.currentTarget.style.background = "#e53935"} onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.5)"}>{"\u00d7"}</div>
            </div>
            <input value={img.caption || ""} onChange={e => updateCaption(i, e.target.value)} placeholder="Caption..."
              style={{ fontFamily: F, fontSize: 7, letterSpacing: LS, width: 110, boxSizing: "border-box", border: "none", borderBottom: "1px solid #eee", outline: "none", padding: "3px 2px", color: "#666", marginTop: 2 }} />
          </div>
        ))}
        {imgs.length < maxImages && (
          <div data-export-hide="1" onClick={() => fileRef.current && fileRef.current.click()}
            style={{ width: 110, height: 90, border: dragOver ? "2px solid #000" : "1px dashed #ccc", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexDirection: "column", gap: 2, background: dragOver ? "#FFFDE7" : "transparent", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#999"; }} onMouseLeave={e => { if (!dragOver) e.currentTarget.style.borderColor = "#ccc"; }}>
            <span style={{ fontSize: 20, lineHeight: 1, color: dragOver ? "#000" : "#ccc" }}>+</span>
            <span style={{ fontFamily: F, fontSize: 7, color: dragOver ? "#000" : "#ccc", letterSpacing: LS }}>Drop or Click</span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
          onChange={e => { handleFiles(e.target.files); e.target.value = ""; }} />
      </div>
    </div>
  );
};

/* ======= DEFAULT SHOT ======= */
const newShot = (id, scene) => ({
  id: id || Date.now(), scene: scene || "", type: "STILLS", description: "", timing: "", frame: "", movement: "",
  camera: "", lighting: "", talent: "", wardrobe: "", props: "", location: "",
  notes: "", status: "Planned",
  refImages: [], wardrobeImages: [], propImages: [],
});

/* ======= MAIN COMPONENT ======= */
const ShotListPolly = React.forwardRef(function ShotListPollyInner({ initialProject, initialScenes, onChangeProject, onChangeScenes, onShareUrl }, fwdRef) {
  const _fitMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const [project, setProjectRaw] = useState(() => initialProject || {
    name: "[Project Name]", client: "[Client Name]", date: "[Date]", director: "[Director]", dop: "[DOP]"
  });
  const [view, setView] = useState("all");
  const [scenes, setScenesRaw] = useState(() => initialScenes || [
    { id: 1, name: "SCENE 1", collapsed: false, shots: [newShot(101, "1A"), newShot(102, "1B")] },
    { id: 2, name: "SCENE 2", collapsed: false, shots: [newShot(201, "2A")] },
  ]);
  const [tab, setTab] = useState("list");
  const [expanded, setExpanded] = useState({});

  const [dragState, setDragState] = useState(null); /* { type: "shot"|"scene", si, ri?, data } */
  const [dropTarget, setDropTarget] = useState(null);
  const printRef = useRef(null);

  /* Undo */
  const historyRef = useRef([]);
  const pushHistory = () => {
    historyRef.current.push({ project: JSON.parse(JSON.stringify(project)), scenes: JSON.parse(JSON.stringify(scenes)) });
    if (historyRef.current.length > 50) historyRef.current.shift();
  };
  const undo = () => { if (historyRef.current.length === 0) return; const p = historyRef.current.pop(); setProjectRaw(p.project); setScenesRaw(p.scenes); if (onChangeProject) onChangeProject(p.project); if (onChangeScenes) onChangeScenes(p.scenes); };
  const setProject = (u) => { pushHistory(); setProjectRaw(prev => { const next = typeof u === "function" ? u(prev) : u; if (onChangeProject) onChangeProject(next); return next; }); };
  const setScenes = (u) => { pushHistory(); setScenesRaw(prev => { const next = typeof u === "function" ? u(prev) : u; if (onChangeScenes) onChangeScenes(next); return next; }); };
  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  });

  /* Drag & Drop handlers */
  const startDragScene = (si, e) => { e.dataTransfer.effectAllowed = "move"; setDragState({ type: "scene", si }); };
  const startDragShot = (si, ri, e) => { e.dataTransfer.effectAllowed = "move"; e.stopPropagation(); setDragState({ type: "shot", si, ri }); };

  const onDragOverScene = (si, e) => { e.preventDefault(); if (dragState) setDropTarget({ type: "scene", si }); };
  const onDragOverShot = (si, ri, e) => { e.preventDefault(); e.stopPropagation(); if (dragState) setDropTarget({ type: "shot", si, ri }); };

  /* Auto-renumber all shots based on scene position */
  const renumber = (sceneList) => {
    return sceneList.map((scene, si) => {
      const prefix = scene.name.replace(/[^0-9]/g, "") || (si + 1);
      return { ...scene, shots: scene.shots.map((shot, ri) => ({
        ...shot, scene: `${prefix}${String.fromCharCode(65 + ri)}`
      }))};
    });
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (!dragState || !dropTarget) { setDragState(null); setDropTarget(null); return; }
    pushHistory();
    if (dragState.type === "scene" && dropTarget.type === "scene") {
      setScenesRaw(prev => {
        const n = [...prev]; const [moved] = n.splice(dragState.si, 1); n.splice(dropTarget.si, 0, moved); return renumber(n);
      });
    } else if (dragState.type === "shot") {
      setScenesRaw(prev => {
        const n = JSON.parse(JSON.stringify(prev));
        const shot = n[dragState.si].shots[dragState.ri];
        n[dragState.si].shots.splice(dragState.ri, 1);
        const targetSi = dropTarget.si;
        const targetRi = dropTarget.type === "shot" ? dropTarget.ri : n[targetSi].shots.length;
        n[targetSi].shots.splice(targetRi, 0, shot);
        return renumber(n);
      });
    }
    setDragState(null); setDropTarget(null);
  };

  const onDragEnd = () => { setDragState(null); setDropTarget(null); };

  const toggleExpand = (si, ri) => { const k = `${si}-${ri}`; setExpanded(p => ({ ...p, [k]: !p[k] })); };
  const updateShot = (si, ri, key, val) => setScenes(prev => prev.map((s, i) => i === si ? { ...s, shots: s.shots.map((r, j) => j === ri ? { ...r, [key]: val } : r) } : s));
  const addShot = (si) => {
    setScenes(prev => {
      const n = prev.map((s, i) => i === si ? { ...s, shots: [...s.shots, newShot(Date.now(), "")] } : s);
      return renumber(n);
    });
  };
  const deleteShot = (si, ri) => {
    setScenes(prev => {
      const n = prev.map((s, i) => i === si ? { ...s, shots: s.shots.filter((_, j) => j !== ri) } : s);
      return renumber(n);
    });
  };
  const toggleCollapse = (si) => setScenesRaw(prev => prev.map((s, i) => i === si ? { ...s, collapsed: !s.collapsed } : s));
  const deleteScene = (si) => setScenes(prev => renumber(prev.filter((_, i) => i !== si)));
  const editSceneName = async (si) => {
    const v = await showPrompt("Scene name:", scenes[si].name);
    if (v) setScenes(prev => renumber(prev.map((s, i) => i === si ? { ...s, name: v.toUpperCase() } : s)));
  };
  const addScene = async () => {
    const name = await showPrompt("Scene name:", `SCENE ${scenes.length + 1}`);
    if (!name) return;
    setScenes(prev => renumber([...prev, { id: Date.now(), name: name.toUpperCase(), collapsed: false, shots: [newShot(Date.now() + 1, "")] }]));
  };
  const hideDetailField = (si, ri, field) => {
    updateShot(si, ri, "hiddenFields", { ...(scenes[si].shots[ri].hiddenFields || {}), [field]: true });
  };


  const slCleanClone = (el) => {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"],[class*="extension"]').forEach(n=>n.remove());
    clone.querySelectorAll('iframe,object,embed').forEach(n=>n.remove());
    clone.querySelectorAll("[data-export-hide]").forEach(n => n.remove());
    clone.querySelectorAll("span").forEach(span => {
      if (span.textContent === "\u2014" && span.style.color === "rgb(221, 221, 221)") span.textContent = "";
    });
    clone.querySelectorAll("input").forEach(inp => {
      if (!inp.value || !inp.value.trim()) { inp.style.display = "none"; }
      else { const span = document.createElement("span"); span.textContent = inp.value; span.style.cssText = inp.style.cssText; span.style.border = "none"; span.style.background = "none"; inp.replaceWith(span); }
    });
    return clone;
  };
  const slPrintViaIframe = (clone) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:1200px;height:100%;border:none;z-index:-9999;opacity:0;";
    document.body.appendChild(iframe);
    const idoc = iframe.contentDocument;
    idoc.open();
    idoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><base href="${window.location.origin}/"><title>\u200B</title><style>
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;font-size:10px;color:#1a1a1a;padding:12mm;padding-bottom:18mm}
@media print{@page{size:landscape;margin:0}}
${PRINT_CLEANUP_CSS}
</style></head><body></body></html>`);
    idoc.close();
    idoc.body.appendChild(idoc.adoptNode(clone));
    const _imgs=[...idoc.querySelectorAll('img')];const _imgReady=_imgs.map(im=>im.complete?Promise.resolve():new Promise(r=>{im.onload=r;im.onerror=r;}));
    Promise.all(_imgReady).then(()=>{setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 300);});
  };
  const exportPDF = () => {
    const el = printRef.current; if (!el) return;
    slPrintViaIframe(slCleanClone(el));
  };
  const generateSharePage = async (modes, existingToken, existingResourceId) => {
    const el = printRef.current; if (!el) return;
    const clone = slCleanClone(el);
    clone.querySelectorAll('img').forEach(im => { if(im.src && !im.src.startsWith('data:') && !im.src.startsWith('http')) im.src = window.location.origin + im.getAttribute('src'); });
    const html = clone.innerHTML;
    if (!html) return;
    try {
      const body = { html, projectName: project.name || "", clientName: project.client || "", mode: "shotlist" };
      if (existingToken) body.token = existingToken;
      if (existingResourceId) body.resourceId = existingResourceId;
      const resp = await fetch("/api/shotlist-share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!resp.ok) { const txt = await resp.text().catch(() => ""); showAlert("Failed to generate link: " + (resp.status === 413 ? "Content too large — remove some images" : resp.statusText + " " + txt.slice(0, 100))); return; }
      const data = await resp.json();
      if (data.url) {
        if (onShareUrl) onShareUrl(data.url, data.token, data.id);
        else { await navigator.clipboard.writeText(data.url).catch(() => {}); showAlert("Link copied to clipboard!\n\n" + data.url); }
      } else { showAlert("Failed to generate link: " + (data.error || "Unknown error")); }
    } catch (err) { showAlert("Error generating link: " + err.message); }
  };
  useImperativeHandle(fwdRef, () => ({ share: generateSharePage }));

  const allShots = scenes.flatMap(s => s.shots);
  const filtered = view === "all" ? allShots : allShots.filter(s => s.type === view.toUpperCase() || s.type === "BOTH");
  const totalShots = filtered.length;
  const shotCount = filtered.filter(s => s.status === "Shot" || s.status === "Approved").length;
  const approvedCount = filtered.filter(s => s.status === "Approved").length;

  return (
    <div style={{ width: _fitMobile ? "100%" : 1123, minWidth: _fitMobile ? 0 : 1123, margin: "0 auto", background: "#fff", fontFamily: F, color: "#1a1a1a" }} onDragEnd={onDragEnd}>
      {/* Top bar */}
      <div style={{ display: "flex", borderBottom: "2px solid #000", overflowX: "auto" }}>
        {[{ id: "list", label: "SHOT LIST" }, { id: "board", label: "BOARD VIEW" }].map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{ fontFamily: F, fontSize: 9, fontWeight: tab === t.id ? 700 : 400, letterSpacing: LS, padding: _fitMobile ? "8px 10px" : "10px 16px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, background: tab === t.id ? "#000" : "#f5f5f5", color: tab === t.id ? "#fff" : "#666", textTransform: "uppercase", borderRight: "1px solid #ddd" }}>{t.label}</div>
        ))}
        <div style={{ flex: 1 }} />
        {["all", "stills", "motion"].map(v => (
          <div key={v} onClick={() => setView(v)} style={{ fontFamily: F, fontSize: 8, fontWeight: view === v ? 700 : 400, letterSpacing: LS, padding: "10px 12px", cursor: "pointer", background: view === v ? "#eee" : "#f5f5f5", color: view === v ? "#000" : "#999", textTransform: "uppercase", borderLeft: "1px solid #ddd" }}>{v}</div>
        ))}
        <div onClick={exportPDF} style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, padding: "10px 16px", cursor: "pointer", background: "#000", color: "#fff", textTransform: "uppercase", borderLeft: "1px solid #333" }}
          onMouseEnter={e => e.target.style.background = "#333"} onMouseLeave={e => e.target.style.background = "#000"}>EXPORT PDF</div>
      </div>

      <div ref={printRef} style={{ padding: "20px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, flexWrap: _fitMobile ? "wrap" : "nowrap", gap: _fitMobile ? 8 : 0 }}><img src="/onna-default-logo.png" alt="ONNA" style={{ maxHeight: 30, maxWidth: 120, objectFit: "contain" }} /></div>
        <div style={{ borderBottom: "2.5px solid #000", marginBottom: 16 }} />
        <div style={{ textAlign: "center", fontFamily: F, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>SHOT LIST</div>

        <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
          {[["PROJECT:", project.name, "name"], ["CLIENT:", project.client, "client"], ["DATE:", project.date, "date"], ["DIRECTOR:", project.director, "director"], ["DOP:", project.dop, "dop"]].map(([lbl, val, key]) => (
            <div key={key} style={{ display: "flex", gap: 4, alignItems: "baseline", flex: 1, minWidth: _fitMobile ? "45%" : "auto", marginRight: 14 }}>
              <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS }}>{lbl}</span>
              <Cell value={val} onChange={v => setProject(p => ({ ...p, [key]: v }))} />
            </div>
          ))}
        </div>

        {/* Stats + Legend */}
        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          {[{ l: "TOTAL", v: totalShots, bg: "#f4f4f4", c: "#666" }, { l: "SHOT", v: shotCount, bg: "#E3F2FD", c: "#1565C0" }, { l: "APPROVED", v: approvedCount, bg: "#000", c: "#fff" },
            { l: "STILLS", v: allShots.filter(s => s.type === "STILLS" || s.type === "BOTH").length, bg: "#E8F5E9", c: "#2E7D32" },
            { l: "MOTION", v: allShots.filter(s => s.type === "MOTION" || s.type === "BOTH").length, bg: "#E3F2FD", c: "#0D47A1" }].map(s => (
            <div key={s.l} style={{ fontFamily: F, fontSize: 8, fontWeight: 700, letterSpacing: LS, background: s.bg, padding: "4px 10px", borderRadius: 2, color: s.c }}>{s.l}: {s.v}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: _fitMobile ? 8 : 12, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: F, fontSize: 7, fontWeight: 700, letterSpacing: LS, color: "#999" }}>STATUS:</span>
          {STATUSES.map(s => { const sr = STATUS_ROW[s]; return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ fontFamily: F, fontSize: 7, fontWeight: 700, background: sr.dot, color: s === "Planned" ? "#666" : "#fff", padding: "1px 4px", borderRadius: 2, letterSpacing: LS }}>1A</div>
              <span style={{ fontFamily: F, fontSize: 7, letterSpacing: LS, color: "#666" }}>{s}</span>
            </div>
          ); })}
          <span style={{ fontFamily: F, fontSize: 7, letterSpacing: LS, color: "#ccc" }}>Click shot # to cycle | Drag {"\u2261"} to reorder</span>
        </div>

        {/* ======= LIST VIEW ======= */}
        {tab === "list" && <>
          {scenes.map((scene, si) => {
            const shots = view === "all" ? scene.shots : scene.shots.filter(s => s.type === view.toUpperCase() || s.type === "BOTH");
            if (shots.length === 0 && view !== "all") return null;
            const isSceneDrop = dropTarget && dropTarget.type === "scene" && dropTarget.si === si && dragState && dragState.type === "scene";

            return (
              <div key={scene.id} style={{ marginBottom: 10 }}
                onDragOver={e => onDragOverScene(si, e)} onDrop={onDrop}>
                {/* Scene header - draggable */}
                <div draggable onDragStart={e => startDragScene(si, e)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: isSceneDrop ? "#333" : "#000", padding: "4px 8px", cursor: "grab", borderTop: isSceneDrop ? "2px solid #FFD54F" : "none", transition: "border .1s" }}
                  onClick={() => toggleCollapse(si)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span data-export-hide="1" style={{ fontFamily: F, fontSize: 10, color: "rgba(255,255,255,0.3)", cursor: "grab", letterSpacing: 2 }}>{"\u2261"}</span>
                    <span style={{ fontFamily: F, fontSize: 8, color: "rgba(255,255,255,0.6)", transform: scene.collapsed ? "rotate(0deg)" : "rotate(90deg)", transition: "transform .15s", display: "inline-block" }}>{"\u25B6"}</span>
                    <span onClick={e => { e.stopPropagation(); editSceneName(si); }} style={{ fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: LS, color: "#fff", textTransform: "uppercase", cursor: "pointer" }}>{scene.name}</span>
                    <span style={{ fontFamily: F, fontSize: 8, color: "rgba(255,255,255,0.5)" }}>{shots.length} shots</span>
                  </div>
                  <div data-export-hide="1" style={{ display: "flex", gap: 10 }} onClick={e => e.stopPropagation()}>
                    <span onClick={() => addShot(si)} style={{ fontFamily: F, fontSize: 8, color: "rgba(255,255,255,0.55)", cursor: "pointer", letterSpacing: LS }}
                      onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.55)"}>+ ADD SHOT</span>
                    <span onClick={() => deleteScene(si)} style={{ fontFamily: F, fontSize: 10, color: "rgba(255,255,255,0.3)", cursor: "pointer" }}
                      onMouseEnter={e => e.target.style.color = "#e53935"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.3)"}>{"\u00d7"}</span>
                  </div>
                </div>

                {!scene.collapsed && <div style={{ overflowX: "auto" }}>
                  {/* Column headers */}
                  <div style={{ display: "flex", background: "#f4f4f4", borderBottom: "1px solid #ddd", minWidth: _fitMobile ? 700 : 0 }}>
                    <div style={{ width: 14 }} />
                    <div style={{ width: 18 }} />
                    <div style={{ width: 42, fontFamily: F, fontSize: 7, fontWeight: 700, letterSpacing: LS, color: "#999", padding: "4px 4px" }}>SHOT #</div>
                    <div style={{ width: 50, fontFamily: F, fontSize: 7, fontWeight: 700, letterSpacing: LS, color: "#999", padding: "4px 4px" }}>TYPE</div>
                    <div style={{ width: 55, fontFamily: F, fontSize: 7, fontWeight: 700, letterSpacing: LS, color: "#999", padding: "4px 4px" }}>TIMING</div>
                    <div style={{ flex: 2, fontFamily: F, fontSize: 7, fontWeight: 700, letterSpacing: LS, color: "#999", padding: "4px 4px" }}>DESCRIPTION / ACTION</div>
                    <div style={{ width: 50, fontFamily: F, fontSize: 7, fontWeight: 700, letterSpacing: LS, color: "#999", padding: "4px 4px" }}>FRAME</div>
                    <div style={{ width: 65, fontFamily: F, fontSize: 7, fontWeight: 700, letterSpacing: LS, color: "#999", padding: "4px 4px" }}>MOVEMENT</div>
                    <div style={{ flex: 1, fontFamily: F, fontSize: 7, fontWeight: 700, letterSpacing: LS, color: "#999", padding: "4px 4px" }}>LOCATION</div>
                    <div style={{ width: 20 }} />
                  </div>

                  {/* Shots */}
                  {shots.map((shot) => {
                    const ri = scene.shots.findIndex(s => s.id === shot.id);
                    const isOpen = expanded[`${si}-${ri}`];
                    const sr = STATUS_ROW[shot.status] || STATUS_ROW["Planned"];
                    const isApproved = shot.status === "Approved";
                    const isShotDrop = dropTarget && dropTarget.type === "shot" && dropTarget.si === si && dropTarget.ri === ri && dragState && dragState.type === "shot";
                    const hasDetails = shot.camera || shot.lighting || shot.talent || shot.wardrobe || shot.props || shot.notes || (shot.refImages && shot.refImages.length > 0) || (shot.wardrobeImages && shot.wardrobeImages.length > 0) || (shot.propImages && shot.propImages.length > 0);

                    return (
                      <div key={shot.id} onDragOver={e => onDragOverShot(si, ri, e)} onDrop={onDrop}>
                        <div draggable onDragStart={e => startDragShot(si, ri, e)}
                          style={{ display: "flex", borderBottom: isOpen ? "none" : `1px solid ${sr.border}`, borderLeft: `3px solid ${sr.dot}`, borderTop: isShotDrop ? "2px solid #FFD54F" : "none", alignItems: "center", minHeight: 28, minWidth: _fitMobile ? 700 : 0, cursor: "pointer", background: sr.bg, transition: "all .15s" }}
                          onClick={() => toggleExpand(si, ri)}>
                          {/* Drag handle */}
                          <div data-export-hide="1" style={{ width: 14, fontFamily: F, fontSize: 10, color: "#ddd", textAlign: "center", cursor: "grab", letterSpacing: 2 }}
                            onMouseDown={e => e.stopPropagation()}>{"\u2261"}</div>
                          <div data-export-hide="1" style={{ width: 18, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => e.stopPropagation()}>
                            <span onClick={() => deleteShot(si, ri)} style={{ cursor: "pointer", fontSize: 10, color: "#ddd" }}
                              onMouseEnter={e => e.target.style.color = "#e53935"} onMouseLeave={e => e.target.style.color = "#ddd"}>{"\u00d7"}</span>
                          </div>
                          <div style={{ width: 42, padding: "2px 2px" }} onClick={e => { e.stopPropagation(); const i = STATUSES.indexOf(shot.status); updateShot(si, ri, "status", STATUSES[(i + 1) % STATUSES.length]); }}>
                            <div style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, padding: "3px 6px", textAlign: "center", cursor: "pointer", borderRadius: 2, userSelect: "none", transition: "all .15s",
                              background: sr.dot, color: shot.status === "Planned" ? "#666" : "#fff",
                              textDecoration: isApproved ? "line-through" : "none",
                            }} title={`${shot.status} \u2014 click to change`}>{shot.scene}</div>
                          </div>
                          <div style={{ width: 50, padding: "2px 2px" }} onClick={e => e.stopPropagation()}><TypeBadge value={shot.type} onChange={v => updateShot(si, ri, "type", v)} /></div>
                          <div style={{ width: 55 }} onClick={e => e.stopPropagation()}><Cell value={shot.timing} onChange={v => updateShot(si, ri, "timing", v)} style={{ fontSize: 9, fontWeight: 600 }} placeholder="00:00" /></div>
                          <div style={{ flex: 2 }}><Cell value={shot.description} onChange={v => updateShot(si, ri, "description", v)} style={{ fontSize: 9, color: isApproved ? "#999" : "#000" }} placeholder="Description / action" /></div>
                          <div style={{ width: 50, padding: "2px 2px" }} onClick={e => e.stopPropagation()}><DropSelect value={shot.frame} onChange={v => updateShot(si, ri, "frame", v)} options={FRAMES} /></div>
                          <div style={{ width: 65, padding: "2px 2px" }} onClick={e => e.stopPropagation()}><DropSelect value={shot.movement} onChange={v => updateShot(si, ri, "movement", v)} options={MOVEMENTS} /></div>
                          <div style={{ flex: 1 }}><Cell value={shot.location} onChange={v => updateShot(si, ri, "location", v)} style={{ fontSize: 8 }} placeholder="Location" /></div>
                          <div data-export-hide="1" style={{ width: 20, fontFamily: F, fontSize: 8, color: hasDetails ? "#000" : "#ddd", textAlign: "center", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .15s" }}>{"\u25B6"}</div>
                        </div>

                        {/* Expanded detail card */}
                        {isOpen && (
                          <div style={{ background: "#fafafa", borderLeft: `3px solid ${sr.dot}`, borderBottom: `1px solid ${sr.border}`, padding: "8px 14px 10px 18px", marginBottom: 2 }}>
                            {/* Condensed text fields - each with × delete */}
                            {[
                              { key: "notes", label: "NOTES", ph: "General notes..." },
                              { key: "camera", label: "CAMERA", ph: "Camera, lens, settings..." },
                              { key: "lighting", label: "LIGHTING", ph: "Lighting setup, mood..." },
                              { key: "talent", label: "TALENT / MODELS", ph: "Who, direction, positioning..." },
                            ].map(f => {
                              if (shot.hiddenFields && shot.hiddenFields[f.key]) return null;
                              return (
                                <div key={f.key} style={{ display: "flex", alignItems: "flex-start", gap: 4, marginBottom: 4 }}>
                                  <div style={{ width: 90, flexShrink: 0, display: "flex", alignItems: "center", gap: 2, paddingTop: 4 }}>
                                    <span data-export-hide="1" onClick={() => hideDetailField(si, ri, f.key)} style={{ fontSize: 8, color: "#ddd", cursor: "pointer", flexShrink: 0 }}
                                      onMouseEnter={e => e.target.style.color = "#e53935"} onMouseLeave={e => e.target.style.color = "#ddd"}>{"\u00d7"}</span>
                                    <span style={{ fontFamily: F, fontSize: 7, fontWeight: 700, letterSpacing: LS, color: "#999", textTransform: "uppercase" }}>{f.label}</span>
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <Cell value={shot[f.key]} onChange={v => updateShot(si, ri, f.key, v)} multiline placeholder={f.ph} style={{ color: "#666", minHeight: 24, fontSize: 8 }} />
                                  </div>
                                </div>
                              );
                            })}

                            {/* Reference images */}
                            {!(shot.hiddenFields && shot.hiddenFields.refImages) && (
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginBottom: 4 }}>
                                <div style={{ width: 90, flexShrink: 0, display: "flex", alignItems: "center", gap: 2, paddingTop: 4 }}>
                                  <span data-export-hide="1" onClick={() => hideDetailField(si, ri, "refImages")} style={{ fontSize: 8, color: "#ddd", cursor: "pointer" }}
                                    onMouseEnter={e => e.target.style.color = "#e53935"} onMouseLeave={e => e.target.style.color = "#ddd"}>{"\u00d7"}</span>
                                  <span style={{ fontFamily: F, fontSize: 7, fontWeight: 700, letterSpacing: LS, color: "#999" }}>REFERENCES</span>
                                </div>
                                <div style={{ flex: 1 }}><ImageGrid images={shot.refImages} onChange={v => updateShot(si, ri, "refImages", v)} label="" /></div>
                              </div>
                            )}

                            {/* Wardrobe text + images */}
                            {!(shot.hiddenFields && shot.hiddenFields.wardrobe) && (
                              <>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginBottom: 2 }}>
                                  <div style={{ width: 90, flexShrink: 0, display: "flex", alignItems: "center", gap: 2, paddingTop: 4 }}>
                                    <span data-export-hide="1" onClick={() => hideDetailField(si, ri, "wardrobe")} style={{ fontSize: 8, color: "#ddd", cursor: "pointer" }}
                                      onMouseEnter={e => e.target.style.color = "#e53935"} onMouseLeave={e => e.target.style.color = "#ddd"}>{"\u00d7"}</span>
                                    <span style={{ fontFamily: F, fontSize: 7, fontWeight: 700, letterSpacing: LS, color: "#999" }}>WARDROBE</span>
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <Cell value={shot.wardrobe} onChange={v => updateShot(si, ri, "wardrobe", v)} multiline placeholder="Wardrobe notes..." style={{ color: "#666", minHeight: 24, fontSize: 8 }} />
                                  </div>
                                </div>
                                <div style={{ marginLeft: 94, marginBottom: 4 }}><ImageGrid images={shot.wardrobeImages} onChange={v => updateShot(si, ri, "wardrobeImages", v)} label="" /></div>
                              </>
                            )}

                            {/* Props text + images */}
                            {!(shot.hiddenFields && shot.hiddenFields.props) && (
                              <>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginBottom: 2 }}>
                                  <div style={{ width: 90, flexShrink: 0, display: "flex", alignItems: "center", gap: 2, paddingTop: 4 }}>
                                    <span data-export-hide="1" onClick={() => hideDetailField(si, ri, "props")} style={{ fontSize: 8, color: "#ddd", cursor: "pointer" }}
                                      onMouseEnter={e => e.target.style.color = "#e53935"} onMouseLeave={e => e.target.style.color = "#ddd"}>{"\u00d7"}</span>
                                    <span style={{ fontFamily: F, fontSize: 7, fontWeight: 700, letterSpacing: LS, color: "#999" }}>PROPS</span>
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <Cell value={shot.props} onChange={v => updateShot(si, ri, "props", v)} multiline placeholder="Props needed..." style={{ color: "#666", minHeight: 24, fontSize: 8 }} />
                                  </div>
                                </div>
                                <div style={{ marginLeft: 94, marginBottom: 4 }}><ImageGrid images={shot.propImages} onChange={v => updateShot(si, ri, "propImages", v)} label="" /></div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {shots.length === 0 && (
                    <div style={{ fontFamily: F, fontSize: 9, color: "#ccc", letterSpacing: LS, padding: "10px 26px", fontStyle: "italic" }}>No shots {view !== "all" ? `(${view})` : ""} {"\u2014"} click + ADD SHOT</div>
                  )}
                </div>}
              </div>
            );
          })}

          <div data-export-hide="1" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", background: "#f4f4f4", padding: "6px 8px", cursor: "pointer", borderRadius: 1 }}
              onClick={addScene} onMouseEnter={e => e.currentTarget.style.background = "#eee"} onMouseLeave={e => e.currentTarget.style.background = "#f4f4f4"}>
              <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, color: "#999", textTransform: "uppercase" }}>+ ADD SCENE</span>
            </div>
          </div>
        </>}

        {/* ======= BOARD VIEW (Client Storyboard) ======= */}
        {tab === "board" && (
          <div>
            {scenes.map((scene, si) => {
              const shots = view === "all" ? scene.shots : scene.shots.filter(s => s.type === view.toUpperCase() || s.type === "BOTH");
              if (shots.length === 0 && view !== "all") return null;
              return (
                <div key={scene.id} style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, borderBottom: "2px solid #000", paddingBottom: 4 }}>{scene.name}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                    {shots.map(shot => {
                      const ri = scene.shots.findIndex(s => s.id === shot.id);
                      const sr = STATUS_ROW[shot.status] || STATUS_ROW["Planned"];
                      const hasRef = shot.refImages && shot.refImages.length > 0;
                      const isApproved = shot.status === "Approved";
                      return (
                        <div key={shot.id} style={{ borderRadius: 2, overflow: "hidden", border: `1px solid ${sr.border}`, borderLeft: `3px solid ${sr.dot}`, background: isApproved ? "#fafafa" : "#fff", opacity: isApproved ? 0.7 : 1 }}>
                          {/* Image area */}
                          <div style={{ width: "100%", height: 140, background: "#f4f4f4", overflow: "hidden", position: "relative" }}>
                            {hasRef
                              ? <img src={shot.refImages[0].url || shot.refImages[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 8, color: "#ccc", letterSpacing: LS }}>NO REFERENCE</div>
                            }
                            {/* Shot # badge overlaid */}
                            <div style={{ position: "absolute", top: 6, left: 6, fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: LS, padding: "3px 8px", borderRadius: 2, background: sr.dot, color: shot.status === "Planned" ? "#666" : "#fff", textDecoration: isApproved ? "line-through" : "none" }}>
                              {shot.scene}
                            </div>
                            {/* Type badge overlaid */}
                            <div style={{ position: "absolute", top: 6, right: 6 }}>
                              <TypeBadge value={shot.type} onChange={v => updateShot(si, ri, "type", v)} />
                            </div>
                            {/* Timing overlaid bottom-right */}
                            {shot.timing && (
                              <div style={{ position: "absolute", bottom: 6, right: 6, fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, color: "#fff", background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 2 }}>
                                {shot.timing}
                              </div>
                            )}
                            {hasRef && shot.refImages.length > 1 && (
                              <div style={{ position: "absolute", bottom: 6, left: 6, fontFamily: F, fontSize: 7, letterSpacing: LS, color: "#fff", background: "rgba(0,0,0,0.5)", padding: "2px 5px", borderRadius: 2 }}>
                                +{shot.refImages.length - 1} refs
                              </div>
                            )}
                          </div>
                          {/* Info */}
                          <div style={{ padding: "8px 10px" }}>
                            <div style={{ fontFamily: F, fontSize: 9, letterSpacing: LS, color: isApproved ? "#999" : "#1a1a1a", marginBottom: 4, minHeight: 18, lineHeight: 1.4, textDecoration: isApproved ? "line-through" : "none" }}>
                              {shot.description || <span style={{ color: "#ddd" }}>No description</span>}
                            </div>
                            {/* Tags row */}
                            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 4 }}>
                              {shot.frame && <span style={{ fontFamily: F, fontSize: 6, fontWeight: 700, letterSpacing: LS, background: "#f4f4f4", padding: "2px 5px", borderRadius: 1 }}>{shot.frame}</span>}
                              {shot.movement && <span style={{ fontFamily: F, fontSize: 6, fontWeight: 700, letterSpacing: LS, background: "#f4f4f4", padding: "2px 5px", borderRadius: 1 }}>{shot.movement}</span>}
                              {shot.camera && <span style={{ fontFamily: F, fontSize: 6, letterSpacing: LS, background: "#f4f4f4", padding: "2px 5px", borderRadius: 1 }}>{shot.camera}</span>}
                            </div>
                            {/* Key details - only show if filled */}
                            {shot.talent && <div style={{ fontFamily: F, fontSize: 7, letterSpacing: LS, color: "#666", marginBottom: 1 }}><span style={{ fontWeight: 700, color: "#999" }}>TALENT </span>{shot.talent}</div>}
                            {shot.location && <div style={{ fontFamily: F, fontSize: 7, letterSpacing: LS, color: "#666", marginBottom: 1 }}><span style={{ fontWeight: 700, color: "#999" }}>LOC </span>{shot.location}</div>}
                            {shot.wardrobe && <div style={{ fontFamily: F, fontSize: 7, letterSpacing: LS, color: "#666", marginBottom: 1 }}><span style={{ fontWeight: 700, color: "#999" }}>WARDROBE </span>{shot.wardrobe}</div>}
                            {shot.lighting && <div style={{ fontFamily: F, fontSize: 7, letterSpacing: LS, color: "#666", marginBottom: 1 }}><span style={{ fontWeight: 700, color: "#999" }}>LIGHT </span>{shot.lighting}</div>}
                            {shot.notes && <div style={{ fontFamily: F, fontSize: 7, letterSpacing: LS, color: "#999", fontStyle: "italic", marginTop: 3 }}>{shot.notes}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        
      </div>
    </div>
  );
});


/* ======= LOCATIONS CONNIE ======= */
let _locId = 0;

export default ShotListPolly;
