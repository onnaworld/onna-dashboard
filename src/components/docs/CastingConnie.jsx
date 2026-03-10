import React, { useState, useRef, useImperativeHandle } from "react";
import { validateImg } from "../ui/DocHelpers";

const mkCastRole = () => ({ id: "cr" + (++_castId), name: "", description: "" });
const mkCastEntry = () => ({ id: "ce" + (++_castId), name: "", agency: "", status: "none", image: null, notes: "", email: "", phone: "", portfolio: "", look: "", description: "" });
const mkCastOption = () => ({ id: "co" + (++_castId), role: "", talent: [mkCastEntry(), mkCastEntry()] });
const CAST_STATUSES = ["Scouted","Shortlisted","Approved","Booked"];
const CAST_STATUS_C = {
  "Scouted":{bg:"#f4f4f4",text:"#999",border:"#ddd"},
  "Shortlisted":{bg:"#FFF3E0",text:"#E65100",border:"#FFB74D"},
  "Approved":{bg:"#E8F5E9",text:"#2E7D32",border:"#A5D6A7"},
  "Booked":{bg:"#000",text:"#fff",border:"#000"}
};
export const CAST_INIT = () => ({
  project: { name: "", client: "", date: "", director: "", agencyLogo: null, clientLogo: null },
  confirmed: [{ id: "cr1", role: "Lead", talent: [mkCastEntry()] }],
  options: [mkCastOption()],
});

const CastInp = ({ value, onChange, placeholder, style = {} }) => (
  <input value={value} onChange={e => onChange(e.target.value)}
    onFocus={e => { if (e.target.value.startsWith("[")) e.target.select(); }} placeholder={placeholder}
    style={{ fontFamily: "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif", fontSize: 9, letterSpacing: 0.5, border: "none", outline: "none", padding: "3px 6px",
      background: value ? "transparent" : "#FFFDE7", boxSizing: "border-box", width: "100%", ...style }} />
);

const CastImgSlot = ({ src, h = "100%", onAdd, onRemove, style = {} }) => {
  const [over, setOver] = useState(false);
  if (src) return (
    <div style={{ width: "100%", height: h, position: "relative", ...style }}>
      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => { e.target.style.display = "none"; }} />
      <button data-hide="1" onClick={onRemove} style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", fontSize: 9, cursor: "pointer", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>{"×"}</button>
    </div>
  );
  return (
    <div onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); setOver(false); if (e.dataTransfer.files.length > 0) onAdd(e.dataTransfer.files); }}
      style={{ width: "100%", height: h, background: over ? "#FFFDE7" : "#f8f8f8", border: over ? "2px dashed #FFD54F" : "1px dashed #ddd", borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s", ...style }}>
      <label style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <span style={{ fontSize: 18, color: over ? "#E65100" : "#ddd" }}>+</span>
        <span style={{ fontFamily: "'Avenir','Avenir Next','Nunito Sans',sans-serif", fontSize: 6, color: over ? "#E65100" : "#ccc", letterSpacing: 0.5 }}>Drop or click</span>
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { onAdd(e.target.files); e.target.value = ""; }} />
      </label>
    </div>
  );
};

const generateSelphyImage = (entry, modelNum, roleName) => {
  return new Promise((resolve) => {
    const W = 1200, H = 1800;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    const drawText = (photoH) => {
      const textY = photoH || 0;
      const pad = 60;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, textY, W, H - textY);
      ctx.fillStyle = "#000";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pad, textY + 30); ctx.lineTo(W - pad, textY + 30); ctx.stroke();
      let y = textY + 80;
      ctx.font = "bold 52px 'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
      ctx.fillText("MODEL " + modelNum, pad, y);
      if (roleName) { ctx.font = "44px 'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif"; ctx.fillStyle = "#666"; ctx.fillText(roleName, pad + ctx.measureText("MODEL " + modelNum + "  ").width, y); ctx.fillStyle = "#000"; }
      y += 64;
      if (entry.name) { ctx.font = "bold 60px 'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif"; ctx.fillText(entry.name, pad, y); y += 70; }
      if (entry.look) { ctx.font = "42px 'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif"; ctx.fillStyle = "#444"; ctx.fillText("Look: " + entry.look, pad, y); y += 54; ctx.fillStyle = "#000"; }
      if (entry.description) { ctx.font = "38px 'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif"; ctx.fillStyle = "#555"; const words = entry.description.split(" "); let line = ""; for (const w of words) { const test = line + (line ? " " : "") + w; if (ctx.measureText(test).width > W - pad * 2 && line) { ctx.fillText(line, pad, y); y += 48; line = w; } else line = test; } if (line) { ctx.fillText(line, pad, y); y += 48; } ctx.fillStyle = "#000"; }
      if (entry.notes) { y += 10; ctx.font = "italic 36px 'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif"; ctx.fillStyle = "#888"; const words = entry.notes.split(" "); let line = ""; for (const w of words) { const test = line + (line ? " " : "") + w; if (ctx.measureText(test).width > W - pad * 2 && line) { ctx.fillText(line, pad, y); y += 44; line = w; } else line = test; } if (line) ctx.fillText(line, pad, y); }
      resolve(cv.toDataURL("image/png"));
    };
    if (entry.image) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const photoH = 1280;
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const scale = Math.max(W / iw, photoH / ih);
        const sw = W / scale, sh = photoH / scale;
        const sx = (iw - sw) / 2, sy = (ih - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, photoH);
        drawText(photoH);
      };
      img.onerror = () => drawText(0);
      img.src = entry.image;
    } else drawText(0);
  });
};

const downloadSelphyCard = (entry, modelNum, roleName) => {
  generateSelphyImage(entry, modelNum, roleName).then(dataUrl => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = (entry.name || "card").replace(/[^a-zA-Z0-9]/g, "_") + "_selphy.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
};

const CastCard = ({ entry, onChange, onRemove, modelNum, roleName, isConfirmed }) => {
  const status = entry.status || "none";
  const bc = status === "approved" ? "#2E7D32" : status === "shortlisted" ? "#E65100" : status === "rejected" ? "#C62828" : "#eee";
  const F = "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
  const LS = 0.5;
  const castImgAdd = (files) => { const f = Array.from(files).find(f => f.type.startsWith("image/")); if (!validateImg(f)) return; const r = new FileReader(); r.onload = (e) => onChange("image", e.target.result); r.readAsDataURL(f); };

  return (
    <div data-cast-card style={{ border: (status !== "none" ? 3 : 1) + "px solid " + bc, borderRadius: 2, overflow: "hidden", background: "#fff", position: "relative" }}>
      {onRemove && <button data-hide="1" onClick={onRemove} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", fontSize: 9, cursor: "pointer", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, zIndex: 2, lineHeight: 1 }}>{"\u00d7"}</button>}
      <div style={{ aspectRatio: "4/5", position: "relative" }}>
        <CastImgSlot src={entry.image} h="100%" onAdd={castImgAdd} onRemove={() => onChange("image", null)} />
      </div>
      <div style={{ padding: "2px 4px" }}>
        <CastInp value={entry.name} onChange={v => onChange("name", v)} placeholder="Talent Name" style={{ fontSize: 9, fontWeight: 700, padding: "0 0 2px 0", borderBottom: "1px solid #eee", marginBottom: 2 }} />
        <CastInp value={entry.agency} onChange={v => onChange("agency", v)} placeholder="Agency" style={{ fontSize: 8, color: "#999", padding: 0, marginBottom: 1 }} />
        {isConfirmed && <CastInp value={entry.look || ""} onChange={v => onChange("look", v)} placeholder="Look" style={{ fontSize: 8, color: "#666", padding: 0, marginBottom: 1 }} />}
        {isConfirmed && <CastInp value={entry.description || ""} onChange={v => onChange("description", v)} placeholder="Description" style={{ fontSize: 8, color: "#666", padding: 0, marginBottom: 1 }} />}
        <CastInp value={entry.portfolio || ""} onChange={v => onChange("portfolio", v)} placeholder="Portfolio link" style={{ fontSize: 8, color: "#1565C0", padding: 0 }} />
      </div>
      <div data-cast-card-actions style={{ display: "flex", borderTop: "1px solid #eee" }}>
        {[{ k: "approved", l: "APPROVE", c: "#2E7D32" }, { k: "shortlisted", l: "SHORTLIST", c: "#E65100" }, { k: "rejected", l: "REJECT", c: "#C62828" }].map(btn => (
          <div key={btn.k} data-cast-action={btn.k} onClick={() => onChange("status", status === btn.k ? "none" : btn.k)}
            style={{ flex: 1, fontFamily: F, fontSize: 6, fontWeight: 700, letterSpacing: LS, padding: "4px 0", textAlign: "center", cursor: "pointer", textTransform: "uppercase",
              background: status === btn.k ? btn.c : "#fff", color: status === btn.k ? "#fff" : btn.c,
              borderRight: btn.k !== "rejected" ? "1px solid #f0f0f0" : "none" }}>{btn.l}</div>
        ))}
      </div>
      {isConfirmed && entry.image && <div data-hide="1" onClick={() => downloadSelphyCard(entry, modelNum || 1, roleName || "")} style={{ fontFamily: F, fontSize: 6, fontWeight: 700, letterSpacing: LS, padding: "3px 0", textAlign: "center", cursor: "pointer", textTransform: "uppercase", color: "#1565C0", borderTop: "1px solid #f0f0f0", background: "#f8fbff" }}>SAVE CARD</div>}
      <input data-cast-note value={entry.notes || ""} onChange={e => onChange("notes", e.target.value)} placeholder="Notes..." style={{ width: "100%", fontFamily: F, fontSize: 7, padding: "3px 4px", border: "none", borderTop: "1px solid #f0f0f0", outline: "none", color: "#666", boxSizing: "border-box", background: entry.notes ? "#FFFDE7" : "transparent" }} />
    </div>
  );
};

const CastingConnie = React.forwardRef(function CastingConnie({ initialProject, initialConfirmed, initialOptions, onChangeProject, onChangeConfirmed, onChangeOptions, onShareUrl }, fwdRef) {
  const _fitMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const F = CS_FONT;
  const LS = 0.5;
  const [projectRaw, setProjectRaw] = useState(() => initialProject || CAST_INIT().project);
  const [confirmed, setConfirmedRaw] = useState(() => initialConfirmed || CAST_INIT().confirmed);
  const [options, setOptionsRaw] = useState(() => initialOptions || CAST_INIT().options);
  const [tab, setTab] = useState("confirmed");
  const [printTabs, setPrintTabs] = useState(null);
  const printRef = useRef(null);

  const setProject = (u) => { setProjectRaw(prev => { const next = typeof u === "function" ? u(prev) : u; if (onChangeProject) onChangeProject(next); return next; }); };
  const setConfirmed = (u) => { setConfirmedRaw(prev => { const next = typeof u === "function" ? u(prev) : u; if (onChangeConfirmed) onChangeConfirmed(next); return next; }); };
  const setOptions = (u) => { setOptionsRaw(prev => { const next = typeof u === "function" ? u(prev) : u; if (onChangeOptions) onChangeOptions(next); return next; }); };
  const project = projectRaw;

  const updateEntry = (listSetter, roleIdx, entryIdx, field, val) => {
    listSetter(prev => prev.map((r,ri) => ri===roleIdx ? {...r, talent: (r.talent||[]).map((e,ei) => ei===entryIdx ? {...e,[field]:val} : e)} : r));
  };
  const addEntryToRole = (listSetter, roleIdx) => {
    listSetter(prev => prev.map((r,ri) => ri===roleIdx ? {...r, talent: [...(r.talent||[]), mkCastEntry()]} : r));
  };
  const removeEntry = (listSetter, roleIdx, entryIdx) => {
    listSetter(prev => prev.map((r,ri) => ri===roleIdx ? {...r, talent: (r.talent||r.entries).filter((_,ei) => ei!==entryIdx)} : r));
  };
  const addRole = (listSetter) => {
    listSetter(prev => [...prev, { id: "cr"+(++_castId), role: "", name: "", talent: [mkCastEntry()] }]);
  };
  const removeRole = (listSetter, roleIdx) => {
    listSetter(prev => prev.filter((_,i)=>i!==roleIdx));
  };

  const castCleanClone = (el) => {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"],[class*="extension"]').forEach(n=>n.remove());
    clone.querySelectorAll('iframe,object,embed').forEach(n=>n.remove());
    clone.querySelectorAll("[data-hide]").forEach(n => n.remove());
    clone.querySelectorAll("[data-print-only]").forEach(n => { n.style.display = ""; });
    clone.querySelectorAll("input, textarea").forEach(inp => {
      if (!inp.value || !inp.value.trim()) { inp.style.display = "none"; }
      else { const s = document.createElement("span"); s.textContent = inp.value; s.style.cssText = inp.style.cssText; s.style.border = "none"; s.style.background = "none"; s.style.outline = "none"; inp.replaceWith(s); }
    });
    return clone;
  };

  const castPrintViaIframe = (clone) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:1123px;height:794px;border:none;z-index:-9999;opacity:0;";
    document.body.appendChild(iframe);
    const idoc = iframe.contentDocument;
    idoc.open();
    idoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>\u200B</title><style>
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;font-size:9px;color:#1a1a1a;padding:8mm 10mm;overflow:hidden}
#cast-wrap{transform-origin:top left}
@media print{@page{size:landscape;margin:0}}
${PRINT_CLEANUP_CSS}
</style></head><body><div id="cast-wrap"></div></body></html>`);
    idoc.close();
    const wrap = idoc.getElementById("cast-wrap");
    wrap.appendChild(idoc.adoptNode(clone));
    setTimeout(() => {
      const pageW = 1123, pageH = 794;
      const contentH = wrap.scrollHeight;
      const contentW = wrap.scrollWidth;
      const scaleX = Math.min(1, pageW / contentW);
      const scaleY = Math.min(1, pageH / contentH);
      const scale = Math.min(scaleX, scaleY);
      if (scale < 1) wrap.style.transform = `scale(${scale})`;
      iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 400);
  };
  const exportPDF = () => {
    const el = printRef.current; if (!el) return;
    castPrintViaIframe(castCleanClone(el));
  };
  const exportAllPDF = () => {
    setPrintTabs(new Set(["confirmed","options"]));
    setTimeout(() => {
      const el = printRef.current; if (!el) { setPrintTabs(null); return; }
      castPrintViaIframe(castCleanClone(el));
      setTimeout(() => setPrintTabs(null), 100);
    }, 200);
  };

  const generateSharePage = async (modes, existingToken, existingResourceId) => {
    const tabsArr = Array.isArray(modes) ? modes : (modes === "all" ? ["confirmed","options"] : modes ? [modes] : ["confirmed","options"]);
    setPrintTabs(new Set(tabsArr));
    await new Promise(r => setTimeout(r, 300));
    const el = printRef.current; if (!el) { setPrintTabs(null); return; }
    const clone = castCleanClone(el);
    clone.querySelectorAll('[data-print-only]').forEach(n => { n.style.display = ''; });
    clone.querySelectorAll('img').forEach(im => { if(im.src && !im.src.startsWith('data:') && !im.src.startsWith('http')) im.src = window.location.origin + im.getAttribute('src'); });
    const html = clone.innerHTML;
    setPrintTabs(null);
    if (!html) return;
    try {
      const body = { html, projectName: project.name || "", clientName: project.client || "", mode: tabsArr.join("+") };
      if (existingToken) body.token = existingToken;
      if (existingResourceId) body.resourceId = existingResourceId;
      const resp = await fetch("/api/casting-share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await resp.json();
      if (data.url) {
        if (onShareUrl) onShareUrl(data.url, data.token, data.id);
        else { await navigator.clipboard.writeText(data.url).catch(() => {}); showAlert("Link copied to clipboard!\n\n" + data.url); }
      } else { showAlert("Failed to generate link: " + (data.error || "Unknown error")); }
    } catch (err) { showAlert("Error generating link: " + err.message); }
  };

  useImperativeHandle(fwdRef, () => ({ share: generateSharePage }));

  const renderRoleSection = (roles, listSetter, sectionLabel, isConfirmed) => (
    <div>
      {roles.map((role, ri) => (
        <div key={role.id||ri} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", background: "#000", padding: "3px 6px", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, color: "#fff" }}>{sectionLabel.toUpperCase()} {ri + 1}</span>
              <CastInp value={role.role||role.name||""} onChange={v=>listSetter(prev=>prev.map((r,i)=>i===ri?{...r,role:v,name:v}:r))} placeholder="Role Name" style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "transparent", width: _fitMobile ? 100 : 180 }}/>
            </div>
            <div data-hide="1" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span onClick={()=>addEntryToRole(listSetter,ri)} style={{ fontFamily: F, fontSize: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", letterSpacing: LS }}>+ TALENT</span>
              <button onClick={()=>removeRole(listSetter,ri)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 14, cursor: "pointer", padding: 0, lineHeight: 1 }}>{"×"}</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: _fitMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: _fitMobile ? 6 : 4, padding: "6px 0" }}>
            {(role.talent||[]).map((entry, ei) => (
              <CastCard key={entry.id||ei} entry={entry}
                onChange={(field,val)=>updateEntry(listSetter,ri,ei,field,val)}
                onRemove={()=>removeEntry(listSetter,ri,ei)}
                modelNum={ei + 1} roleName={role.role || role.name || ""} isConfirmed={isConfirmed}
              />
            ))}
          </div>
        </div>
      ))}
      <div data-hide="1"><div onClick={()=>addRole(listSetter)} style={{ display: "flex", alignItems: "center", background: "#f4f4f4", padding: "6px 8px", cursor: "pointer", borderRadius: 1 }}
        onMouseEnter={e => e.currentTarget.style.background = "#eee"} onMouseLeave={e => e.currentTarget.style.background = "#f4f4f4"}>
        <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, color: "#999", textTransform: "uppercase" }}>+ ADD ROLE</span>
      </div></div>
    </div>
  );

  return (
    <div style={{ width: _fitMobile ? "100%" : 1123, minWidth: _fitMobile ? 0 : 1123, margin: "0 auto", background: "#fff", fontFamily: F, color: "#1a1a1a" }}>
      <div style={{ display: "flex", borderBottom: "2px solid #000", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {[{ id: "confirmed", label: "CONFIRMED CAST" }, { id: "options", label: "CASTING OPTIONS" }].map(t => (
          <div key={t.id} onClick={() => setTab(t.id)}
            style={{ fontFamily: F, fontSize: 9, fontWeight: tab === t.id ? 700 : 400, letterSpacing: LS, padding: _fitMobile ? "8px 10px" : "10px 16px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, background: tab === t.id ? "#000" : "#f5f5f5", color: tab === t.id ? "#fff" : "#666", textTransform: "uppercase", borderRight: "1px solid #ddd" }}>{t.label}</div>
        ))}
        <div style={{ flex: 1 }} />
        <div onClick={exportPDF} style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, padding: "10px 16px", cursor: "pointer", background: "#333", color: "#fff", textTransform: "uppercase", borderLeft: "1px solid #555" }}
          onMouseEnter={e => e.target.style.background = "#555"} onMouseLeave={e => e.target.style.background = "#333"}>EXPORT PAGE</div>
        <div onClick={exportAllPDF} style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, padding: "10px 16px", cursor: "pointer", background: "#000", color: "#fff", textTransform: "uppercase", borderLeft: "1px solid #333" }}
          onMouseEnter={e => e.target.style.background = "#333"} onMouseLeave={e => e.target.style.background = "#000"}>EXPORT ALL</div>
      </div>

      <div ref={printRef} data-cast-print="1" style={{ padding: "8px 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, flexWrap: _fitMobile ? "wrap" : "nowrap", gap: _fitMobile ? 8 : 0 }}>
          <img src="/onna-default-logo.png" alt="ONNA" style={{ maxHeight: 30, maxWidth: 120, objectFit: "contain" }} />
          <div style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>CASTING DECK</div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div data-hide="1"><CSLogoSlot label="Agency Logo" image={project.agencyLogo} onUpload={v => setProject(p => ({ ...p, agencyLogo: v }))} onRemove={() => setProject(p => ({ ...p, agencyLogo: null }))} /></div>
            <div data-hide="1"><CSLogoSlot label="Client Logo" image={project.clientLogo} onUpload={v => setProject(p => ({ ...p, clientLogo: v }))} onRemove={() => setProject(p => ({ ...p, clientLogo: null }))} /></div>
            {project.agencyLogo && <img data-print-only="1" src={project.agencyLogo} alt="" style={{ maxHeight: 30, maxWidth: 120, objectFit: "contain", display: "none" }} />}
            {project.clientLogo && <img data-print-only="1" src={project.clientLogo} alt="" style={{ maxHeight: 30, maxWidth: 120, objectFit: "contain", display: "none" }} />}
          </div>
        </div>
        <div style={{ borderBottom: "2.5px solid #000", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: _fitMobile ? 8 : 12, marginBottom: 6, flexWrap: "wrap", justifyContent: "space-between" }}>
          {[["PROJECT", "name", "Project Name"], ["CLIENT", "client", "Client Name"], ["DATE", "date", "Date"], ["DIRECTOR", "director", "Director"]].map(([lbl, key, ph]) => (
            <div key={key} style={{ display: "flex", gap: 4, alignItems: "baseline", flex: 1, minWidth: _fitMobile ? "45%" : "auto" }}>
              <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS }}>{lbl}:</span>
              <CastInp value={project[key]} onChange={v => setProject(p => ({ ...p, [key]: v }))} placeholder={ph} style={{ width: 110, borderBottom: "1px solid #eee" }} />
            </div>
          ))}
        </div>

        {(tab === "confirmed" || (printTabs && printTabs.has("confirmed"))) && (
          <div>
            {renderRoleSection(confirmed, setConfirmed, "Role", true)}
          </div>
        )}

        {printTabs && printTabs.has("options") && printTabs.has("confirmed") && <div className="page-break" style={{pageBreakBefore:"always",marginTop:32,paddingTop:16,borderTop:"2px solid #000"}}><span style={{fontFamily:F,fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>CASTING OPTIONS</span></div>}

        {(tab === "options" || (printTabs && printTabs.has("options"))) && (
          <div>
            {renderRoleSection(options, setOptions, "Option")}
          </div>
        )}

        <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", fontFamily: F, fontSize: 9, letterSpacing: LS, color: "#000", borderTop: "2px solid #000", paddingTop: 12 }}>
          <div><div style={{ fontWeight: 700 }}>@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700 }}>WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div>
        </div>
      </div>
    </div>
  );
});

/* ======= STORYBOARD CONNIE ======= */
let _sbId = 0;

export default CastingConnie;
