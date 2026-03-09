import React, { useState, useRef, useImperativeHandle } from "react";
import { validateImg } from "../ui/DocHelpers";

const mkLoc = () => ({ id: "loc" + (++_locId), name: "", address: "", rate: "", notes: "", status: "Scouted", images: [] });
const mkDetail = () => ({ id: "det" + (++_locId), name: "", address: "", rate: "", notes: "", images: [null, null, null, null, null, null, null] });
const LOC_STATUSES = ["Scouted", "Shortlisted", "Approved", "Booked"];
const LOC_STATUS_C = {
  "Scouted": { bg: "#f4f4f4", text: "#999", border: "#ddd" },
  "Shortlisted": { bg: "#FFF3E0", text: "#E65100", border: "#FFB74D" },
  "Approved": { bg: "#E8F5E9", text: "#2E7D32", border: "#A5D6A7" },
  "Booked": { bg: "#000", text: "#fff", border: "#000" },
};
const LOCATIONS_INIT = { project: { name: "", client: "", date: "" }, locations: [], details: [] };

const LocInp = ({ value, onChange, placeholder, style = {} }) => (
  <input value={value} onChange={e => onChange(e.target.value)}
    onFocus={e => { if (e.target.value.startsWith("[")) e.target.select(); }}
    placeholder={placeholder}
    style={{ fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, border: "none", outline: "none", padding: "3px 6px",
      background: value ? "transparent" : "#FFFDE7", boxSizing: "border-box", width: "100%", ...style }} />
);

const LocImgSlot = ({ src, onAdd, onRemove, h = "100%", style = {} }) => {
  const [over, setOver] = useState(false);
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setOver(false); if (e.dataTransfer.files.length > 0) onAdd(e.dataTransfer.files); };
  if (src) {
    return (
      <div onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); e.stopPropagation(); setOver(false); if (e.dataTransfer.files.length > 0) { onRemove(); setTimeout(() => onAdd(e.dataTransfer.files), 50); } }}
        style={{ width: "100%", height: h, position: "relative", overflow: "hidden", borderRadius: 2, border: over ? "2px solid #FFD54F" : "none", ...style }}>
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => { e.target.style.display = "none"; }} />
        <button data-hide="1" onClick={onRemove}
          style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", fontSize: 10, cursor: "pointer", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>×</button>
      </div>
    );
  }
  return (
    <div onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={handleDrop}
      style={{ width: "100%", height: h, background: over ? "#FFFDE7" : "#f8f8f8", border: over ? "2px dashed #FFD54F" : "1px dashed #ddd", borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s", ...style }}>
      <label style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <span style={{ fontSize: 20, color: over ? "#E65100" : "#ddd" }}>+</span>
        <span style={{ fontFamily: CS_FONT, fontSize: 7, color: over ? "#E65100" : "#ccc", letterSpacing: 0.5 }}>Drop or click</span>
        <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => { onAdd(e.target.files); e.target.value = ""; }} />
      </label>
    </div>
  );
};

const LocationsConnie = React.forwardRef(function LocationsConnieInner({ initialProject, initialLocations, initialDetails, onChangeProject, onChangeLocations, onChangeDetails, onShareUrl }, fwdRef) {
  const _fitMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const [project, setProjectRaw] = useState(() => initialProject || { name: "", client: "", date: "" });
  const [tab, setTab] = useState("overview");
  const [printTabs, setPrintTabs] = useState(null); // null=normal, Set of tabs to force-render for share/export
  const printRef = useRef(null);

  const setProject = (updater) => {
    setProjectRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (onChangeProject) onChangeProject(next);
      return next;
    });
  };

  /* Overview: independent data */
  const [locations, setLocationsRaw] = useState(() => initialLocations && initialLocations.length > 0 ? initialLocations : [mkLoc(), mkLoc(), mkLoc()]);
  const setLocations = (updater) => {
    setLocationsRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (onChangeLocations) onChangeLocations(next);
      return next;
    });
  };
  const updateLoc = (id, key, val) => setLocations(prev => prev.map(l => l.id === id ? { ...l, [key]: val } : l));
  const addLoc = () => setLocations(prev => [...prev, mkLoc()]);
  const deleteLoc = (id) => setLocations(prev => prev.filter(l => l.id !== id));
  const addLocImage = (id, fileList) => {
    Array.from(fileList).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const r = new FileReader();
      r.onload = (e) => setLocations(prev => prev.map(l => l.id === id ? { ...l, images: [...(l.images || []), e.target.result] } : l));
      r.readAsDataURL(file);
    });
  };
  const removeLocImage = (id, idx) => setLocations(prev => prev.map(l => l.id === id ? { ...l, images: l.images.filter((_, i) => i !== idx) } : l));

  /* Detail: separate independent data */
  const [details, setDetailsRaw] = useState(() => initialDetails && initialDetails.length > 0 ? initialDetails : [mkDetail(), mkDetail(), mkDetail()]);
  const setDetails = (updater) => {
    setDetailsRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (onChangeDetails) onChangeDetails(next);
      return next;
    });
  };
  const [selDetail, setSelDetail] = useState(null);
  const updateDet = (id, key, val) => setDetails(prev => prev.map(d => d.id === id ? { ...d, [key]: val } : d));
  const addDetail = () => setDetails(prev => [...prev, mkDetail()]);
  const deleteDetail = (id) => { setDetails(prev => prev.filter(d => d.id !== id)); if (selDetail === id) setSelDetail(null); };
  const setDetImage = (detId, idx, fileList) => {
    const file = Array.from(fileList).find(f => f.type.startsWith("image/"));
    if (!file) return;
    const r = new FileReader();
    r.onload = (e) => setDetails(prev => prev.map(d => {
      if (d.id !== detId) return d;
      const imgs = [...(d.images || [])]; while (imgs.length <= idx) imgs.push(null);
      imgs[idx] = e.target.result; return { ...d, images: imgs };
    }));
    r.readAsDataURL(file);
  };
  const removeDetImage = (detId, idx) => setDetails(prev => prev.map(d => d.id === detId ? { ...d, images: d.images.map((img, i) => i === idx ? null : img) } : d));

  const curDetail = details.find(d => d.id === selDetail) || (details.length > 0 ? details[0] : null);

  /* Clone + sanitise */
  const cleanClone = (el) => {
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
  const collectFontRules = () => { let r=""; try{for(const s of document.styleSheets){try{for(const ru of s.cssRules){if(ru.cssText&&ru.cssText.startsWith("@font-face"))r+=ru.cssText+"\n";}}catch(e){}}}catch(e){} return r; };
  const printViaIframe = (clone) => {
    const fontRules = collectFontRules();
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:1200px;height:100%;border:none;z-index:-9999;opacity:0;";
    document.body.appendChild(iframe);
    const idoc = iframe.contentDocument;
    idoc.open();
    idoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><base href="${window.location.origin}/"><title>\u200B</title><style>
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;700&display=swap');
${fontRules}
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;font-size:10px;color:#1a1a1a;padding:12mm;padding-bottom:18mm}
@media print{@page{size:portrait;margin:0}}
${PRINT_CLEANUP_CSS}
</style></head><body></body></html>`);
    idoc.close();
    idoc.body.appendChild(idoc.adoptNode(clone));
    const _imgs=[...idoc.querySelectorAll('img')];const _imgReady=_imgs.map(im=>im.complete?Promise.resolve():new Promise(r=>{im.onload=r;im.onerror=r;}));
    Promise.all(_imgReady).then(()=>{setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 300);});
  };
  const exportPDF = () => {
    const el = printRef.current; if (!el) return;
    printViaIframe(cleanClone(el));
  };

  /* Share: capture rendered HTML, POST to /api/loc-share, returns a live URL */
  const generateSharePage = async (modes, existingToken, existingResourceId) => {
    const tabsArr = Array.isArray(modes) ? modes : (modes === "all" ? ["overview","detail"] : modes ? [modes] : ["overview","detail"]);
    setPrintTabs(new Set(tabsArr));
    await new Promise(r => setTimeout(r, 300));
    const el = printRef.current; if (!el) { setPrintTabs(null); return; }
    const clone = cleanClone(el);
    clone.querySelectorAll('img').forEach(im => { if(im.src && !im.src.startsWith('data:') && !im.src.startsWith('http')) im.src = window.location.origin + im.getAttribute('src'); });
    const html = clone.innerHTML;
    setPrintTabs(null);
    if (!html) return;
    try {
      const body = { html, projectName: project.name || "", clientName: project.client || "", mode: tabsArr.join("+") };
      if (existingToken) body.token = existingToken;
      if (existingResourceId) body.resourceId = existingResourceId;
      const resp = await fetch("/api/loc-share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await resp.json();
      if (data.url) {
        if (onShareUrl) onShareUrl(data.url, data.token, data.id);
        else { await navigator.clipboard.writeText(data.url).catch(() => {}); showAlert("Link copied to clipboard!\n\n" + data.url); }
      } else { showAlert("Failed to generate link: " + (data.error || "Unknown error")); }
    } catch (err) { showAlert("Error generating link: " + err.message); }
  };

  /* Export PDF with mode selection */
  const exportAllPDF = () => {
    setPrintTabs(new Set(["overview","detail"]));
    setTimeout(() => {
      const el = printRef.current; if (!el) { setPrintTabs(null); return; }
      printViaIframe(cleanClone(el));
      setTimeout(() => setPrintTabs(null), 100);
    }, 200);
  };

  useImperativeHandle(fwdRef, () => ({ share: generateSharePage }));

  return (
    <div style={{ maxWidth: 1123, margin: "0 auto", background: "#fff", fontFamily: CS_FONT, color: "#1a1a1a" }}>
      <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
        {[{ id: "overview", label: "OVERVIEW" }, { id: "detail", label: "LOCATION DETAIL" }].map(t => (
          <div key={t.id} onClick={() => { setTab(t.id); if (t.id === "detail" && !selDetail && details.length > 0) setSelDetail(details[0].id); }}
            style={{ fontFamily: CS_FONT, fontSize: 9, fontWeight: tab === t.id ? 700 : 400, letterSpacing: 0.5, padding: "10px 16px", cursor: "pointer", background: tab === t.id ? "#000" : "#f5f5f5", color: tab === t.id ? "#fff" : "#666", textTransform: "uppercase", borderRight: "1px solid #ddd" }}>{t.label}</div>
        ))}
        <div style={{ flex: 1 }} />
        <div onClick={exportPDF} style={{ fontFamily: CS_FONT, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, padding: "10px 16px", cursor: "pointer", background: "#333", color: "#fff", textTransform: "uppercase", borderLeft: "1px solid #555" }}
          onMouseEnter={e => e.target.style.background = "#555"} onMouseLeave={e => e.target.style.background = "#333"}>EXPORT PAGE</div>
        <div onClick={exportAllPDF} style={{ fontFamily: CS_FONT, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, padding: "10px 16px", cursor: "pointer", background: "#000", color: "#fff", textTransform: "uppercase", borderLeft: "1px solid #333" }}
          onMouseEnter={e => e.target.style.background = "#333"} onMouseLeave={e => e.target.style.background = "#000"}>EXPORT ALL</div>
      </div>

      <div ref={printRef} style={{ padding: "20px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, flexWrap: _fitMobile ? "wrap" : "nowrap", gap: _fitMobile ? 8 : 0 }}><img src="/onna-default-logo.png" alt="ONNA" style={{ maxHeight: 30, maxWidth: 120, objectFit: "contain" }} /></div>
        <div style={{ borderBottom: "2.5px solid #000", marginBottom: 16 }} />
        <div style={{ textAlign: "center", fontFamily: CS_FONT, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>LOCATIONS DECK</div>

        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          {[["PROJECT", "name", "Project Name"], ["CLIENT", "client", "Client Name"], ["DATE", "date", "Date"]].map(([lbl, key, ph]) => (
            <div key={key} style={{ display: "flex", gap: 4, alignItems: "baseline", flex: 1, minWidth: _fitMobile ? "45%" : "auto" }}>
              <span style={{ fontFamily: CS_FONT, fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>{lbl}:</span>
              <LocInp value={project[key]} onChange={v => setProject(p => ({ ...p, [key]: v }))} placeholder={ph}
                style={{ width: 130, borderBottom: "1px solid #eee" }} />
            </div>
          ))}
        </div>

        {/* ========= OVERVIEW ========= */}
        {(tab === "overview" || (printTabs && printTabs.has("overview"))) && (
          <div>
            {locations.map((loc, idx) => {
              const sr = LOC_STATUS_C[loc.status] || LOC_STATUS_C["Scouted"];
              const heroImg = loc.images && loc.images[0];
              return (
                <div key={loc.id} style={{ marginBottom: 14, border: "1px solid " + sr.border, borderLeft: "4px solid " + sr.border, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ display: "flex", minHeight: 200 }}>
                    <div style={{ width: "55%", position: "relative" }}>
                      <LocImgSlot src={heroImg} h="100%" style={{ minHeight: 200, borderRadius: 0 }}
                        onAdd={files => addLocImage(loc.id, files)} onRemove={() => removeLocImage(loc.id, 0)} />
                      {loc.images && loc.images.length > 1 && (
                        <div style={{ position: "absolute", bottom: 6, left: 6, fontFamily: CS_FONT, fontSize: 8, color: "#fff", background: "rgba(0,0,0,0.5)", padding: "3px 10px", borderRadius: 2, letterSpacing: 0.5 }}>
                          +{loc.images.length - 1} more
                        </div>
                      )}
                    </div>
                    <div style={{ width: "45%", padding: "14px 18px", display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ fontFamily: CS_FONT, fontSize: 9, fontWeight: 700, color: "#999", letterSpacing: 0.5 }}>LOCATION {idx + 1}</div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <div data-loc-status={loc.status} data-loc-idx={idx} onClick={() => { const i = LOC_STATUSES.indexOf(loc.status); updateLoc(loc.id, "status", LOC_STATUSES[(i + 1) % LOC_STATUSES.length]); }}
                            style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, background: sr.bg, color: sr.text, padding: "3px 8px", borderRadius: 2, cursor: "pointer", textTransform: "uppercase" }}>{loc.status}</div>
                          <button data-hide="1" onClick={() => deleteLoc(loc.id)}
                            style={{ background: "none", border: "none", color: "#ddd", fontSize: 14, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
                        </div>
                      </div>
                      <LocInp value={loc.name} onChange={v => updateLoc(loc.id, "name", v)} placeholder="Location Name"
                        style={{ fontSize: 16, fontWeight: 700, padding: "0 0 6px 0", borderBottom: "1px solid #eee", marginBottom: 8 }} />
                      <LocInp value={loc.address} onChange={v => updateLoc(loc.id, "address", v)} placeholder="Full address"
                        style={{ color: "#666", padding: "0 0 6px 0", marginBottom: 8 }} />
                      <LocInp value={loc.rate} onChange={v => updateLoc(loc.id, "rate", v)} placeholder="AED 0,000 / day"
                        style={{ fontSize: 10, fontWeight: 600, padding: "0 0 6px 0", marginBottom: 8 }} />
                      <textarea value={loc.notes} onChange={e => updateLoc(loc.id, "notes", e.target.value)} placeholder="Notes..."
                        style={{ fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, border: "1px solid #f0f0f0", outline: "none", width: "100%", padding: "6px 8px", color: "#666", flex: 1, minHeight: 50, resize: "none", boxSizing: "border-box", borderRadius: 2, lineHeight: 1.5, background: loc.notes ? "transparent" : "#FFFDE7" }} />
                    </div>
                  </div>
                </div>
              );
            })}
            <div data-hide="1" style={{ marginBottom: 16 }}>
              <div onClick={addLoc} style={{ display: "flex", alignItems: "center", background: "#f4f4f4", padding: "6px 8px", cursor: "pointer", borderRadius: 1 }}
                onMouseEnter={e => e.currentTarget.style.background = "#eee"} onMouseLeave={e => e.currentTarget.style.background = "#f4f4f4"}>
                <span style={{ fontFamily: CS_FONT, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: "#999", textTransform: "uppercase" }}>+ ADD LOCATION</span>
              </div>
            </div>
          </div>
        )}

        {/* ========= PAGE BREAK between overview and detail when printing both ========= */}
        {printTabs && printTabs.has("detail") && printTabs.has("overview") && <div className="page-break" style={{pageBreakBefore:"always",marginTop:32,paddingTop:16,borderTop:"2px solid #000"}}><span style={{fontFamily:CS_FONT,fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>LOCATION DETAILS</span></div>}

        {/* ========= DETAIL ========= */}
        {(tab === "detail" || (printTabs && printTabs.has("detail"))) && (
          <div>
            <div data-hide="1" style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
              {details.map((det, idx) => {
                const active = curDetail && curDetail.id === det.id;
                return (
                  <div key={det.id} style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 2, border: active ? "2px solid #000" : "1px solid #ddd", overflow: "hidden" }}>
                    <div onClick={() => setSelDetail(det.id)}
                      style={{ fontFamily: CS_FONT, fontSize: 8, fontWeight: active ? 700 : 400, letterSpacing: 0.5, padding: "5px 10px", cursor: "pointer", background: active ? "#000" : "#fff", color: active ? "#fff" : "#666" }}>
                      {idx + 1}. {det.name || "Untitled"}
                    </div>
                    <button onClick={() => deleteDetail(det.id)}
                      style={{ background: active ? "#333" : "#f5f5f5", border: "none", color: active ? "rgba(255,255,255,0.4)" : "#ccc", fontSize: 10, cursor: "pointer", padding: "5px 6px", lineHeight: 1 }}>×</button>
                  </div>
                );
              })}
              <div onClick={addDetail}
                style={{ fontFamily: CS_FONT, fontSize: 8, fontWeight: 700, letterSpacing: 0.5, padding: "5px 12px", cursor: "pointer", borderRadius: 2, border: "1px dashed #ccc", color: "#999" }}>+ ADD</div>
            </div>

            {/* Normal mode: show selected detail only */}
            {!printTabs && curDetail && (() => { const det = curDetail; const idx = details.findIndex(d => d.id === det.id); return (
              <div style={{ pageBreakInside: "avoid" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, borderBottom: "2px solid #000", paddingBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: CS_FONT, fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: "#999", marginBottom: 2 }}>LOCATION {idx + 1}</div>
                    <LocInp value={det.name} onChange={v => updateDet(det.id, "name", v)} placeholder="Location Name" style={{ fontSize: 20, fontWeight: 700, padding: 0 }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
                  <div style={{ flex: 1.5 }}><span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#999" }}>ADDRESS </span><LocInp value={det.address} onChange={v => updateDet(det.id, "address", v)} placeholder="Full address" style={{ color: "#666", display: "inline", width: "80%" }} /></div>
                  <div style={{ flex: 0.5 }}><span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#999" }}>RATE </span><LocInp value={det.rate} onChange={v => updateDet(det.id, "rate", v)} placeholder="AED 0,000 / day" style={{ fontWeight: 600, display: "inline", width: "70%" }} /></div>
                  <div style={{ flex: 2 }}><span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#999" }}>NOTES </span><LocInp value={det.notes} onChange={v => updateDet(det.id, "notes", v)} placeholder="Pros, cons, permits, parking, power..." style={{ color: "#666", display: "inline", width: "80%" }} /></div>
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 6, height: 240 }}>
                  <div style={{ flex: 2 }}><LocImgSlot src={det.images[0]} h="100%" onAdd={files => setDetImage(det.id, 0, files)} onRemove={() => removeDetImage(det.id, 0)} /></div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    {[1, 2].map(n => (<div key={n} style={{ flex: 1 }}><LocImgSlot src={det.images[n]} h="100%" onAdd={files => setDetImage(det.id, n, files)} onRemove={() => removeDetImage(det.id, n)} /></div>))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: _fitMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 6, height: _fitMobile ? 100 : 150 }}>
                  {[3, 4, 5, 6].map(n => (<div key={n}><LocImgSlot src={det.images[n]} h="100%" onAdd={files => setDetImage(det.id, n, files)} onRemove={() => removeDetImage(det.id, n)} /></div>))}
                </div>
              </div>
            ); })()}

            {/* Print/share mode: render ALL detail locations */}
            {printTabs && details.map((det, idx) => (
              <div key={det.id} style={{ pageBreakInside: "avoid", marginBottom: idx < details.length - 1 ? 24 : 0, pageBreakAfter: idx < details.length - 1 ? "always" : "auto" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, borderBottom: "2px solid #000", paddingBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: CS_FONT, fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: "#999", marginBottom: 2 }}>LOCATION {idx + 1}</div>
                    <span style={{ fontFamily: CS_FONT, fontSize: 20, fontWeight: 700 }}>{det.name || ""}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
                  <div style={{ flex: 1.5 }}><span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#999" }}>ADDRESS </span><span style={{ fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, color: "#666" }}>{det.address || ""}</span></div>
                  <div style={{ flex: 0.5 }}><span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#999" }}>RATE </span><span style={{ fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, fontWeight: 600 }}>{det.rate || ""}</span></div>
                  <div style={{ flex: 2 }}><span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#999" }}>NOTES </span><span style={{ fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, color: "#666" }}>{det.notes || ""}</span></div>
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 6, height: 240 }}>
                  <div style={{ flex: 2 }}>{det.images[0] && <img src={det.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 2 }} />}</div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    {[1, 2].map(n => (<div key={n} style={{ flex: 1 }}>{det.images[n] && <img src={det.images[n]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 2 }} />}</div>))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: _fitMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 6, height: _fitMobile ? 100 : 150 }}>
                  {[3, 4, 5, 6].map(n => (<div key={n}>{det.images[n] && <img src={det.images[n]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 2 }} />}</div>))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, color: "#000", borderTop: "2px solid #000", paddingTop: 12 }}>
          <div><div style={{ fontWeight: 700 }}>@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700 }}>WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div>
        </div>
      </div>
    </div>
  );
});

/* ======= CASTING CONNIE ======= */
let _castId = 0;

export default LocationsConnie;
