import React, { useState, useEffect, useRef, useImperativeHandle } from "react";
import { PRINT_CLEANUP_CSS } from "../../utils/helpers";
import { showAlert } from "../../utils/modal";
import { validateImg, CSLogoSlot } from "../ui/DocHelpers";

let _fitId = 0;
export const mkFitTalent = () => ({ id: "t" + (++_fitId), name: "", role: "", looks: [mkFitLook(), mkFitLook(), mkFitLook(), mkFitLook()] });
const mkFitLook = () => ({ id: "lk" + (++_fitId), name: "", description: "", notes: "", status: "Pending", image: null });
export const mkFitFitting = () => { const fid = ++_fitId; return { id: "fit" + fid, modelId: "m" + fid, talentName: "", lookName: "", description: "", role: "", notes: "", images: [null,null,null,null], imageStatuses: {} }; };

const FIT_STATUSES = ["Pending", "Option", "Approved", "Pulled", "Returned"];
const FIT_STATUS_C = {
  "Pending": { bg: "#f4f4f4", text: "#999" }, "Option": { bg: "#FFF3E0", text: "#E65100" },
  "Approved": { bg: "#E8F5E9", text: "#2E7D32" }, "Pulled": { bg: "#E3F2FD", text: "#1565C0" }, "Returned": { bg: "#000", text: "#fff" },
};

const FitInp = ({ value, onChange, placeholder, style = {} }) => (
  <input value={value} onChange={e => onChange(e.target.value)}
    onFocus={e => { if (e.target.value.startsWith("[")) e.target.select(); }} placeholder={placeholder}
    style={{ fontFamily: "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif", fontSize: 9, letterSpacing: 0.5, border: "none", outline: "none", padding: "3px 6px",
      background: value ? "transparent" : "#FFFDE7", boxSizing: "border-box", width: "100%", ...style }} />
);

const FitImgSlot = ({ src, onAdd, onRemove, h = "100%", style = {} }) => {
  const [over, setOver] = useState(false);
  const F = "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
  const replaceRef = React.useRef(null);
  if (src) return (
    <div onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); setOver(false); if (e.dataTransfer.files.length > 0) { onRemove(); setTimeout(() => onAdd(e.dataTransfer.files), 50); } }}
      style={{ width: "100%", height: h, position: "relative", overflow: "hidden", borderRadius: 2, border: over ? "2px solid #FFD54F" : "none", cursor: "pointer", ...style }}>
      <img src={src} alt="" onClick={() => replaceRef.current && replaceRef.current.click()} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => { e.target.style.display = "none"; }} />
      <input ref={replaceRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files.length > 0) { onRemove(); setTimeout(() => onAdd(e.target.files), 50); } e.target.value = ""; }} />
      <button data-hide="1" onClick={onRemove} style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", fontSize: 9, cursor: "pointer", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>{"×"}</button>
    </div>
  );
  return (
    <div onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); setOver(false); if (e.dataTransfer.files.length > 0) onAdd(e.dataTransfer.files); }}
      style={{ width: "100%", height: h, background: over ? "#FFFDE7" : "#f8f8f8", border: over ? "2px dashed #FFD54F" : "1px dashed #ddd", borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s", ...style }}>
      <label style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <span style={{ fontSize: 18, color: over ? "#E65100" : "#ddd" }}>+</span>
        <span style={{ fontFamily: F, fontSize: 6, color: over ? "#E65100" : "#ccc", letterSpacing: 0.5 }}>Drop or click</span>
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { onAdd(e.target.files); e.target.value = ""; }} />
      </label>
    </div>
  );
};

const FitCard = ({ src, status, onAdd, onRemove, onStatus, note, onNote, onDelete }) => {
  const bc = status === "approved" ? "#2E7D32" : status === "shortlisted" ? "#E65100" : status === "rejected" ? "#C62828" : "#eee";
  const F = "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
  return (
    <div data-fit-card style={{ border: (status !== "none" ? 3 : 1) + "px solid " + bc, borderRadius: 2, overflow: "hidden", background: "#fff", position: "relative" }}>
      {onDelete && <button data-hide="1" onClick={onDelete} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", fontSize: 9, cursor: "pointer", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, zIndex: 2, lineHeight: 1 }}>{"×"}</button>}
      <div style={{ aspectRatio: "4/5", position: "relative" }}>
        <FitImgSlot src={src} h="100%" onAdd={onAdd} onRemove={onRemove} />
      </div>
      <div data-fit-card-actions style={{ display: "flex", borderTop: "1px solid #eee" }}>
        {[{ k: "approved", l: "APPROVE", c: "#2E7D32" }, { k: "shortlisted", l: "SHORTLIST", c: "#E65100" }, { k: "rejected", l: "REJECT", c: "#C62828" }].map(btn => (
          <div key={btn.k} data-fit-action={btn.k} onClick={() => onStatus(status === btn.k ? "none" : btn.k)}
            style={{ flex: 1, fontFamily: F, fontSize: 6, fontWeight: 700, letterSpacing: 0.5, padding: "4px 0", textAlign: "center", cursor: "pointer", textTransform: "uppercase",
              background: status === btn.k ? btn.c : "#fff", color: status === btn.k ? "#fff" : btn.c,
              borderRight: btn.k !== "rejected" ? "1px solid #f0f0f0" : "none" }}>{btn.l}</div>
        ))}
      </div>
      {onNote !== undefined && <input data-fit-note value={note || ""} onChange={e => onNote(e.target.value)} placeholder="Notes..." style={{ width: "100%", fontFamily: F, fontSize: 7, padding: "3px 4px", border: "none", borderTop: "1px solid #f0f0f0", outline: "none", color: "#666", boxSizing: "border-box", background: note ? "#FFFDE7" : "transparent" }} />}
    </div>
  );
};

const FittingConnie = React.forwardRef(function FittingConnieInner({ initialProject, initialTalent, initialFittings, onChangeProject, onChangeTalent, onChangeFittings, onShareUrl }, fwdRef) {
  const F = "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
  const LS = 0.5;
  const [project, setProjectRaw] = useState(() => initialProject || { name: "", client: "", date: "", stylist: "", agencyLogo: null, clientLogo: null });
  const [tab, setTab] = useState("confirmed");
  const [printTabs, setPrintTabs] = useState(null);
  const printRef = useRef(null);
  const _fitMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const [talent, setTalentRaw] = useState(() => initialTalent || [mkFitTalent(), mkFitTalent()]);
  const [fittings, setFittingsRaw] = useState(() => initialFittings || [mkFitFitting(), mkFitFitting()]);
  const [selFit, setSelFit] = useState(null);
  const fittingsRef = useRef(fittings);
  useEffect(() => { fittingsRef.current = fittings; }, [fittings]);

  const setProject = (u) => { setProjectRaw(prev => { const next = typeof u === "function" ? u(prev) : u; if (onChangeProject) onChangeProject(next); return next; }); };
  const setTalent = (u) => { setTalentRaw(prev => { const next = typeof u === "function" ? u(prev) : u; if (onChangeTalent) onChangeTalent(next); return next; }); };
  const setFittings = (u) => { setFittingsRaw(prev => { const next = typeof u === "function" ? u(prev) : u; if (onChangeFittings) onChangeFittings(next); return next; }); };

  const curFit = fittings.find(f => f.id === selFit) || (fittings.length > 0 ? fittings[0] : null);
  const updateTalent = (id, k, v) => setTalent(p => p.map(t => t.id === id ? { ...t, [k]: v } : t));
  const addTalent = () => setTalent(p => [...p, mkFitTalent()]);
  const deleteTalent = (id) => setTalent(p => p.filter(t => t.id !== id));
  const updateLook = (tid, lid, k, v) => setTalent(p => p.map(t => t.id === tid ? { ...t, looks: t.looks.map(l => l.id === lid ? { ...l, [k]: v } : l) } : t));
  const addLook = (tid) => setTalent(p => p.map(t => t.id === tid ? { ...t, looks: [...t.looks, mkFitLook()] } : t));
  const deleteLook = (tid, lid) => setTalent(p => p.map(t => t.id === tid ? { ...t, looks: t.looks.filter(l => l.id !== lid) } : t));
  const setLookImg = (tid, lid, fl) => { const f = Array.from(fl).find(f => f.type.startsWith("image/")); if (!validateImg(f)) return; const r = new FileReader(); r.onload = (e) => setTalent(p => p.map(t => t.id === tid ? { ...t, looks: t.looks.map(l => l.id === lid ? { ...l, image: e.target.result } : l) } : t)); r.readAsDataURL(f); };
  const rmLookImg = (tid, lid) => setTalent(p => p.map(t => t.id === tid ? { ...t, looks: t.looks.map(l => l.id === lid ? { ...l, image: null } : l) } : t));

  const updateFit = (id, k, v) => setFittings(p => p.map(f => f.id === id ? { ...f, [k]: v } : f));
  const addFitting = () => setFittings(p => [...p, mkFitFitting()]);
  const deleteFitting = (id) => { setFittings(p => p.filter(f => f.id !== id)); if (selFit === id) setSelFit(null); };
  const setFitImg = (fid, idx, fl) => { const f = Array.from(fl).find(f => f.type.startsWith("image/")); if (!validateImg(f)) return; const r = new FileReader(); r.onload = (e) => setFittings(p => p.map(ft => { if (ft.id !== fid) return ft; const imgs = [...ft.images]; while (imgs.length <= idx) imgs.push(null); imgs[idx] = e.target.result; return { ...ft, images: imgs }; })); r.readAsDataURL(f); };
  const rmFitImg = (fid, idx) => setFittings(p => p.map(f => f.id === fid ? { ...f, images: f.images.map((img, i) => i === idx ? null : img) } : f));
  const deleteFitSlot = (fid, idx) => setFittings(p => p.map(f => {
    if (f.id !== fid) return f;
    const imgs = f.images.filter((_, i) => i !== idx);
    const newStatuses = {}; const newNotes = {};
    Object.keys(f.imageStatuses || {}).forEach(k => { const ki = parseInt(k); if (ki < idx) newStatuses[ki] = f.imageStatuses[ki]; else if (ki > idx) newStatuses[ki - 1] = f.imageStatuses[ki]; });
    Object.keys(f.imageNotes || {}).forEach(k => { const ki = parseInt(k); if (ki < idx) newNotes[ki] = f.imageNotes[ki]; else if (ki > idx) newNotes[ki - 1] = f.imageNotes[ki]; });
    return { ...f, images: imgs.length < 1 ? [null] : imgs, imageStatuses: newStatuses, imageNotes: newNotes };
  }));

  const fitCleanClone = (el) => {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"],[class*="extension"]').forEach(n=>n.remove());
    clone.querySelectorAll('iframe,object,embed').forEach(n=>n.remove());
    clone.querySelectorAll("[data-hide]").forEach(n => n.remove());
    clone.querySelectorAll("input").forEach(inp => {
      if (inp.hasAttribute("data-fit-note")) return; // keep notes inputs interactive on shared page
      if (!inp.value || !inp.value.trim()) inp.style.display = "none";
      else { const s = document.createElement("span"); s.textContent = inp.value; s.style.cssText = inp.style.cssText; s.style.border = "none"; s.style.background = "none"; inp.replaceWith(s); }
    });
    return clone;
  };
  const fitPrintViaIframe = (clone) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:1123px;height:794px;border:none;z-index:-9999;opacity:0;";
    document.body.appendChild(iframe);
    const idoc = iframe.contentDocument;
    idoc.open();
    idoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>\u200B</title><style>
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;font-size:9px;color:#1a1a1a;padding:8mm 10mm;overflow:hidden}
#fit-wrap{transform-origin:top left}
@media print{@page{size:landscape;margin:0}}
${PRINT_CLEANUP_CSS}
</style></head><body><div id="fit-wrap"></div></body></html>`);
    idoc.close();
    const wrap = idoc.getElementById("fit-wrap");
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
    fitPrintViaIframe(fitCleanClone(el));
  };
  const exportAllPDF = () => {
    setPrintTabs(new Set(["confirmed","options"]));
    setTimeout(() => {
      const el = printRef.current; if (!el) { setPrintTabs(null); return; }
      fitPrintViaIframe(fitCleanClone(el));
      setTimeout(() => setPrintTabs(null), 100);
    }, 200);
  };

  /* Share: capture rendered HTML, POST to /api/fit-share, returns a live URL */
  const generateSharePage = async (modes, existingToken, existingResourceId) => {
    const tabsArr = Array.isArray(modes) ? modes : (modes === "all" ? ["confirmed","options"] : modes ? [modes] : ["confirmed","options"]);
    setPrintTabs(new Set(tabsArr));
    await new Promise(r => setTimeout(r, 300));
    const el = printRef.current; if (!el) { setPrintTabs(null); return; }
    const clone = fitCleanClone(el);
    clone.querySelectorAll('[data-print-only]').forEach(n => { n.style.display = ''; });
    clone.querySelectorAll('img').forEach(im => { if(im.src && !im.src.startsWith('data:') && !im.src.startsWith('http')) im.src = window.location.origin + im.getAttribute('src'); });
    // Compress base64 images for sharing
    const dataImgs = clone.querySelectorAll('img[src^="data:"]');
    for (const img of dataImgs) {
      try {
        const compressed = await new Promise((resolve, reject) => {
          const t = new Image(); t.onload = () => {
            const maxW = 600; const scale = Math.min(1, maxW / t.naturalWidth);
            const cv = document.createElement("canvas"); cv.width = t.naturalWidth * scale; cv.height = t.naturalHeight * scale;
            cv.getContext("2d").drawImage(t, 0, 0, cv.width, cv.height);
            resolve(cv.toDataURL("image/jpeg", 0.5));
          }; t.onerror = reject; t.src = img.src;
        });
        img.src = compressed;
      } catch {}
    }
    // If payload still too large, compress further
    let html = clone.innerHTML;
    if (html.length > 3_500_000) {
      for (const img of clone.querySelectorAll('img[src^="data:"]')) {
        try {
          const compressed = await new Promise((resolve, reject) => {
            const t = new Image(); t.onload = () => {
              const maxW = 400; const scale = Math.min(1, maxW / t.naturalWidth);
              const cv = document.createElement("canvas"); cv.width = t.naturalWidth * scale; cv.height = t.naturalHeight * scale;
              cv.getContext("2d").drawImage(t, 0, 0, cv.width, cv.height);
              resolve(cv.toDataURL("image/jpeg", 0.35));
            }; t.onerror = reject; t.src = img.src;
          });
          img.src = compressed;
        } catch {}
      }
      html = clone.innerHTML;
    }
    setPrintTabs(null);
    if (!html) return;

    // Build feedback from dashboard imageStatuses so portal reflects current approvals
    const dashFeedback = {};
    let cardIdx = 0;
    fittings.forEach(fit => {
      (fit.images || []).forEach((img, n) => {
        const st = (fit.imageStatuses || {})[n];
        if (st && st !== "none") {
          dashFeedback["c" + cardIdx] = { status: st, note: (fit.imageNotes || {})[n] || "" };
        }
        cardIdx++;
      });
    });

    try {
      const body = { html, projectName: project.name || "", clientName: project.client || "", mode: tabsArr.join("+") };
      if (Object.keys(dashFeedback).length > 0) body.feedback = dashFeedback;
      if (existingToken) body.token = existingToken;
      if (existingResourceId) body.resourceId = existingResourceId;
      const payload = JSON.stringify(body);
      const sizeMB = (payload.length / 1048576).toFixed(1);
      console.log("[fit-share] POST payload size:", sizeMB + "MB");
      if (payload.length > 4400000) {
        showAlert(`Content too large (${sizeMB}MB). Try reducing image count or quality.`);
        return;
      }
      const resp = await fetch("/api/fit-share", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        console.error("[fit-share] POST failed:", resp.status, txt.slice(0, 200));
        showAlert("Sync failed (" + resp.status + "): " + (resp.status === 413 ? "Content too large" : txt.slice(0, 100)));
        return;
      }
      const data = await resp.json();
      console.log("[fit-share] POST success:", data);
      if (data.url) {
        if (onShareUrl) {
          onShareUrl(data.url, data.token, data.id);
          showAlert(data.updated ? "Portal link updated! Refresh the client link to see changes." : "Share link created!");
        }
        else { await navigator.clipboard.writeText(data.url).catch(() => {}); showAlert("Link copied to clipboard!\n\n" + data.url); }
      } else { showAlert("Failed to generate link: " + (data.error || "Unknown error")); }
    } catch (err) {
      console.error("[fit-share] Error:", err);
      showAlert("Error generating link: " + err.message);
    }
  };

  useImperativeHandle(fwdRef, () => ({ share: generateSharePage }));

  const row2Has = curFit && curFit.images.slice(4, 8).some(Boolean);

  return (
    <div style={{ width: _fitMobile ? "100%" : 1123, minWidth: _fitMobile ? 0 : 1123, margin: "0 auto", background: "#fff", fontFamily: F, color: "#1a1a1a" }}>
      <div style={{ display: "flex", borderBottom: "2px solid #000", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {[{ id: "confirmed", label: "CONFIRMED LOOKS" }, { id: "options", label: "FITTING OPTIONS" }].map(t => (
          <div key={t.id} onClick={() => { setTab(t.id); if (t.id === "options" && !selFit && fittings.length > 0) setSelFit(fittings[0].id); }}
            style={{ fontFamily: F, fontSize: 9, fontWeight: tab === t.id ? 700 : 400, letterSpacing: LS, padding: "10px 16px", cursor: "pointer", background: tab === t.id ? "#000" : "#f5f5f5", color: tab === t.id ? "#fff" : "#666", textTransform: "uppercase", borderRight: "1px solid #ddd" }}>{t.label}</div>
        ))}
        <div style={{ flex: 1 }} />
        <div onClick={exportPDF} style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, padding: "10px 16px", cursor: "pointer", background: "#333", color: "#fff", textTransform: "uppercase", borderLeft: "1px solid #555" }}
          onMouseEnter={e => e.target.style.background = "#555"} onMouseLeave={e => e.target.style.background = "#333"}>EXPORT PAGE</div>
        <div onClick={exportAllPDF} style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, padding: "10px 16px", cursor: "pointer", background: "#000", color: "#fff", textTransform: "uppercase", borderLeft: "1px solid #333" }}
          onMouseEnter={e => e.target.style.background = "#333"} onMouseLeave={e => e.target.style.background = "#000"}>EXPORT ALL</div>
      </div>

      <div ref={printRef} data-fit-print="1" style={{ padding: "8px 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, flexWrap: _fitMobile ? "wrap" : "nowrap", gap: _fitMobile ? 8 : 0 }}>
          <img src="/onna-default-logo.png" alt="ONNA" style={{ maxHeight: 30, maxWidth: 120, objectFit: "contain" }} />
          <div style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>FITTING DECK</div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div data-hide="1"><CSLogoSlot label="Agency Logo" image={project.agencyLogo} onUpload={v => setProject(p => ({ ...p, agencyLogo: v }))} onRemove={() => setProject(p => ({ ...p, agencyLogo: null }))} /></div>
            <div data-hide="1"><CSLogoSlot label="Client Logo" image={project.clientLogo} onUpload={v => setProject(p => ({ ...p, clientLogo: v }))} onRemove={() => setProject(p => ({ ...p, clientLogo: null }))} /></div>
            {project.agencyLogo && <img data-print-only="1" src={project.agencyLogo} alt="" style={{ maxHeight: 30, maxWidth: 120, objectFit: "contain", display: "none" }} />}
            {project.clientLogo && <img data-print-only="1" src={project.clientLogo} alt="" style={{ maxHeight: 30, maxWidth: 120, objectFit: "contain", display: "none" }} />}
          </div>
        </div>
        <div style={{ borderBottom: "2.5px solid #000", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: _fitMobile ? 8 : 12, marginBottom: 6, flexWrap: "wrap", justifyContent: "space-between" }}>
          {[["PROJECT", "name", "Project Name"], ["CLIENT", "client", "Client Name"], ["DATE", "date", "Date"], ["STYLIST", "stylist", "Stylist"]].map(([lbl, key, ph]) => (
            <div key={key} style={{ display: "flex", gap: 4, alignItems: "baseline", flex: 1, minWidth: _fitMobile ? "45%" : "auto" }}>
              <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS }}>{lbl}:</span>
              <FitInp value={project[key]} onChange={v => setProject(p => ({ ...p, [key]: v }))} placeholder={ph} style={{ width: 110, borderBottom: "1px solid #eee" }} />
            </div>
          ))}
        </div>

        {(tab === "confirmed" || (printTabs && printTabs.has("confirmed"))) && (() => {
          const approved = [];
          fittings.forEach((fit, fi) => {
            fit.images.forEach((img, n) => {
              if (img && (fit.imageStatuses || {})[n] === "approved") {
                approved.push({ fitId: fit.id, imgIdx: n, img, talentName: fit.talentName || ("Model " + (fi + 1)), lookName: fit.lookName || "", description: fit.description || "", role: fit.role || "", note: (fit.imageNotes || {})[n] || "" });
              }
            });
          });
          return (
            <div>
              {approved.length === 0 && (
                <div style={{ padding: "32px 16px", textAlign: "center" }}>
                  <span style={{ fontFamily: F, fontSize: 10, color: "#bbb", letterSpacing: LS }}>Approved looks from the Options tab will appear here</span>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: _fitMobile ? "1fr" : "repeat(3, 1fr)", gap: 8 }}>
                {approved.map((a, ai) => {
                  const saveSelphy = async () => {
                    // Canon Selphy 4x6" at 300dpi = 1200x1800px
                    const W = 1200, H = 1800;
                    const cv = document.createElement("canvas");
                    cv.width = W; cv.height = H;
                    const ctx = cv.getContext("2d");
                    // White background
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(0, 0, W, H);
                    // Load image
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    await new Promise((resolve, reject) => {
                      img.onload = resolve; img.onerror = reject; img.src = a.img;
                    });
                    // Header bar
                    const headerH = 80;
                    ctx.fillStyle = "#f8f8f8";
                    ctx.fillRect(0, 0, W, headerH);
                    ctx.strokeStyle = "#eee"; ctx.lineWidth = 1;
                    ctx.strokeRect(0, 0, W, headerH);
                    // Approved badge
                    ctx.fillStyle = "#E8F5E9";
                    const badgeW = 160, badgeH = 34, badgeX = 24, badgeY = 23;
                    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
                    ctx.fillStyle = "#2E7D32";
                    ctx.font = "bold 18px 'Avenir', 'Avenir Next', sans-serif";
                    ctx.fillText("APPROVED", badgeX + 14, badgeY + 23);
                    // Talent name
                    ctx.fillStyle = "#1a1a1a";
                    ctx.font = "bold 26px 'Avenir', 'Avenir Next', sans-serif";
                    ctx.fillText(a.talentName, badgeX + badgeW + 16, badgeY + 24);
                    // Role
                    if (a.role) {
                      const nameW = ctx.measureText(a.talentName).width;
                      ctx.fillStyle = "#999";
                      ctx.font = "22px 'Avenir', 'Avenir Next', sans-serif";
                      ctx.fillText(a.role, badgeX + badgeW + 16 + nameW + 16, badgeY + 24);
                    }
                    // Image area — fill width, maintain aspect ratio
                    const imgAreaTop = headerH;
                    const footerH = 140;
                    const imgAreaH = H - headerH - footerH;
                    const imgAspect = img.naturalWidth / img.naturalHeight;
                    const areaAspect = W / imgAreaH;
                    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
                    if (imgAspect > areaAspect) { sw = img.naturalHeight * areaAspect; sx = (img.naturalWidth - sw) / 2; }
                    else { sh = img.naturalWidth / areaAspect; sy = (img.naturalHeight - sh) / 2; }
                    ctx.drawImage(img, sx, sy, sw, sh, 0, imgAreaTop, W, imgAreaH);
                    // Footer
                    const footerTop = H - footerH;
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(0, footerTop, W, footerH);
                    ctx.strokeStyle = "#eee";
                    ctx.beginPath(); ctx.moveTo(0, footerTop); ctx.lineTo(W, footerTop); ctx.stroke();
                    let textY = footerTop + 30;
                    if (a.lookName) {
                      ctx.fillStyle = "#1a1a1a";
                      ctx.font = "bold 24px 'Avenir', 'Avenir Next', sans-serif";
                      ctx.fillText(a.lookName, 24, textY);
                      textY += 30;
                    }
                    if (a.description) {
                      ctx.fillStyle = "#666";
                      ctx.font = "22px 'Avenir', 'Avenir Next', sans-serif";
                      // Word wrap
                      const words = a.description.split(" ");
                      let line = "";
                      for (const word of words) {
                        const test = line + (line ? " " : "") + word;
                        if (ctx.measureText(test).width > W - 48 && line) {
                          ctx.fillText(line, 24, textY); textY += 26; line = word;
                        } else { line = test; }
                      }
                      if (line) { ctx.fillText(line, 24, textY); textY += 26; }
                    }
                    if (a.note) {
                      ctx.fillStyle = "#999";
                      ctx.font = "italic 20px 'Avenir', 'Avenir Next', sans-serif";
                      ctx.fillText(a.note, 24, textY);
                    }
                    // Download
                    const link = document.createElement("a");
                    link.download = `${(a.talentName || "look").replace(/\s+/g, "_")}_${a.lookName || ai + 1}_selphy.jpg`;
                    link.href = cv.toDataURL("image/jpeg", 0.95);
                    link.click();
                  };
                  return (
                  <div key={a.fitId + "-" + a.imgIdx} style={{ border: "1px solid #eee", borderRadius: 2, overflow: "hidden", background: "#fff", position: "relative" }}>
                    <div data-hide="1" onClick={saveSelphy} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: 4, padding: "3px 8px", cursor: "pointer", zIndex: 2, fontFamily: F, fontSize: 7, fontWeight: 700, letterSpacing: LS, textTransform: "uppercase" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.85)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.6)"}>SAVE</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 6px", background: "#f8f8f8", borderBottom: "1px solid #eee" }}>
                      <div style={{ fontFamily: F, fontSize: 6, fontWeight: 700, letterSpacing: LS, background: "#E8F5E9", color: "#2E7D32", padding: "2px 6px", borderRadius: 2, textTransform: "uppercase", flexShrink: 0 }}>Approved</div>
                      <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, color: "#1a1a1a" }}>{a.talentName}</span>
                      {a.role && <span style={{ fontFamily: F, fontSize: 8, color: "#999", letterSpacing: LS }}>{a.role}</span>}
                    </div>
                    <div style={{ aspectRatio: "4/5", background: "#f0f0f0" }}>
                      <img src={a.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                    <div style={{ padding: "4px 6px", borderTop: "1px solid #eee" }}>
                      {a.lookName && <div style={{ fontFamily: F, fontSize: 8, fontWeight: 700, letterSpacing: LS, color: "#1a1a1a", marginBottom: 2 }}>{a.lookName}</div>}
                      {a.description && <div style={{ fontFamily: F, fontSize: 8, color: "#666", lineHeight: 1.3, marginBottom: 2 }}>{a.description}</div>}
                      {a.note && <div style={{ fontFamily: F, fontSize: 7, color: "#999", fontStyle: "italic" }}>{a.note}</div>}
                    </div>
                  </div>
                  );})}
              </div>
            </div>
          );
        })()}

        {printTabs && printTabs.has("options") && printTabs.has("confirmed") && <div className="page-break" style={{pageBreakBefore:"always",marginTop:32,paddingTop:16,borderTop:"2px solid #000"}}><span style={{fontFamily:F,fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>FITTING OPTIONS</span></div>}

        {(tab === "options" || (printTabs && printTabs.has("options"))) && (
          <div>
            {(() => {
              const groups = [];
              fittings.forEach((fit) => {
                const mid = fit.modelId || fit.id;
                const last = groups.length > 0 ? groups[groups.length - 1] : null;
                if (last && last.modelId === mid) { last.fits.push(fit); }
                else { groups.push({ modelId: mid, fits: [fit] }); }
              });
              return groups.map((group, gi) => (
                <div key={group.modelId} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", background: "#000", padding: "3px 6px", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, color: "#fff" }}>MODEL {gi + 1}</span>
                      <FitInp value={group.fits[0].talentName} onChange={v => group.fits.forEach(f => updateFit(f.id, "talentName", v))} placeholder="Talent Name" style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "transparent", width: _fitMobile ? 100 : 180 }} />
                    </div>
                    <div data-hide="1" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span onClick={() => { const newFit = mkFitFitting(); newFit.talentName = group.fits[0].talentName; newFit.modelId = group.modelId; setFittings(p => { const lastId = group.fits[group.fits.length - 1].id; const idx = p.findIndex(f => f.id === lastId); const n = [...p]; n.splice(idx + 1, 0, newFit); return n; }); }}
                        style={{ fontFamily: F, fontSize: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", letterSpacing: LS }}>+ LOOK</span>
                      <button onClick={() => { const ids = group.fits.map(f => f.id); setFittings(p => p.filter(f => !ids.includes(f.id))); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 14, cursor: "pointer", padding: 0, lineHeight: 1 }}>{"×"}</button>
                    </div>
                  </div>
                  {group.fits.map((fit, li) => (
                    <div key={fit.id} style={{ marginTop: li > 0 ? 4 : 0 }}>
                      {li > 0 && (
                        <div style={{ display: "flex", alignItems: "center", background: "#333", padding: "2px 6px", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: F, fontSize: 8, fontWeight: 700, letterSpacing: LS, color: "rgba(255,255,255,0.7)" }}>LOOK {li + 1}</span>
                            <FitInp value={fit.lookName} onChange={v => updateFit(fit.id, "lookName", v)} placeholder="Look Name" style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", background: "transparent", width: 100 }} />
                          </div>
                          <button data-hide="1" onClick={() => deleteFitting(fit.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", padding: 0, lineHeight: 1 }}>{"×"}</button>
                        </div>
                      )}
                      {li === 0 && (
                        <div style={{ display: "flex", gap: 8, padding: "2px 0 4px 0", alignItems: "center", flexWrap: "wrap" }}>
                          <FitInp value={fit.lookName} onChange={v => updateFit(fit.id, "lookName", v)} placeholder="Look" style={{ color: "#999", width: 80, borderBottom: "1px solid #eee", padding: "3px 4px" }} />
                          <FitInp value={fit.role || ""} onChange={v => updateFit(fit.id, "role", v)} placeholder="Role" style={{ color: "#999", width: 80, borderBottom: "1px solid #eee", padding: "3px 4px" }} />
                          <FitInp value={fit.description || ""} onChange={v => updateFit(fit.id, "description", v)} placeholder="Description" style={{ color: "#666", flex: 1, borderBottom: "1px solid #eee", padding: "3px 4px" }} />
                        </div>
                      )}
                      {li > 0 && (
                        <div style={{ display: "flex", gap: 8, padding: "2px 0 4px 0", alignItems: "center", flexWrap: "wrap" }}>
                          <FitInp value={fit.lookName} onChange={v => updateFit(fit.id, "lookName", v)} placeholder="Look" style={{ color: "#999", width: 80, borderBottom: "1px solid #eee", padding: "3px 4px" }} />
                          <FitInp value={fit.role || ""} onChange={v => updateFit(fit.id, "role", v)} placeholder="Role" style={{ color: "#999", width: 80, borderBottom: "1px solid #eee", padding: "3px 4px" }} />
                          <FitInp value={fit.description || ""} onChange={v => updateFit(fit.id, "description", v)} placeholder="Description" style={{ color: "#666", flex: 1, borderBottom: "1px solid #eee", padding: "3px 4px" }} />
                        </div>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: _fitMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: _fitMobile ? 6 : 8 }}>
                        {fit.images.map((img, n) => (
                          <FitCard key={n} src={img} status={(fit.imageStatuses||{})[n] || "none"}
                            onAdd={files => setFitImg(fit.id, n, files)} onRemove={() => rmFitImg(fit.id, n)}
                            onStatus={s => updateFit(fit.id, "imageStatuses", { ...(fit.imageStatuses||{}), [n]: s })}
                            note={(fit.imageNotes||{})[n] || ""}
                            onNote={v => updateFit(fit.id, "imageNotes", { ...(fit.imageNotes||{}), [n]: v })}
                            onDelete={() => deleteFitSlot(fit.id, n)} />
                        ))}
                      </div>
                      <div data-hide="1" style={{ display: "flex", justifyContent: "flex-end", padding: "2px 0" }}>
                        <span onClick={() => updateFit(fit.id, "images", [...fit.images, null])}
                          style={{ fontFamily: F, fontSize: 8, fontWeight: 700, letterSpacing: LS, color: "#999", cursor: "pointer", textTransform: "uppercase", padding: "2px 6px" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#666"} onMouseLeave={e => e.currentTarget.style.color = "#999"}>+ IMAGE</span>
                      </div>
                    </div>
                  ))}
                </div>
              ));
            })()}
            <div data-hide="1" style={{ display: "flex", gap: 8 }}>
              <div onClick={addFitting} style={{ display: "flex", alignItems: "center", background: "#f4f4f4", padding: "6px 12px", cursor: "pointer", borderRadius: 1, flex: 1 }}
                onMouseEnter={e => e.currentTarget.style.background = "#eee"} onMouseLeave={e => e.currentTarget.style.background = "#f4f4f4"}>
                <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, color: "#999", textTransform: "uppercase" }}>+ ADD MODEL</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});





// ─── FINN HELPERS ─────────────────────────────────────────────────────────

export default FittingConnie;
