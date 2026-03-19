import React, { useState, useEffect, useRef, useCallback, useImperativeHandle } from "react";
import { PRINT_CLEANUP_CSS } from "../../utils/helpers";
import { showAlert } from "../../utils/modal";
import { validateImg } from "../ui/DocHelpers";

let _sbId = 0;
export const mkFrame = () => ({
  id: "f" + (++_sbId),
  image: null,
  caption: "",
  action: "",
  dialogue: "",
  camera: "",
  sfx: "",
  duration: "",
});

const SB_FIELDS = [
  { key: "action", label: "ACTION", ph: "What happens..." },
  { key: "dialogue", label: "DIALOGUE", ph: "What is said..." },
  { key: "camera", label: "CAMERA", ph: "Camera notes..." },
  { key: "sfx", label: "SFX / AUDIO", ph: "Sound effects..." },
];

const StoryboardPolly = React.forwardRef(function StoryboardPollyInner({ initialProject, initialFrames, onChangeProject, onChangeFrames, onShareUrl }, fwdRef) {
  const _fitMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const [frames, setFramesRaw] = useState(() => initialFrames || [
    mkFrame(), mkFrame(), mkFrame(), mkFrame(),
    mkFrame(), mkFrame(), mkFrame(), mkFrame(),
  ]);
  const [project, setProjectRaw] = useState(() => initialProject || {
    name: "[Project Name]", client: "[Client Name]", date: "[Date]", director: "[Director]", dop: "[DOP]"
  });

  const printRef = useRef(null);
  const dragFrom = useRef(null);
  const [dropAt, setDropAt] = useState(null);

  /* Undo */
  const historyRef = useRef([]);
  const pushHistory = () => {
    historyRef.current.push(JSON.parse(JSON.stringify(frames)));
    if (historyRef.current.length > 50) historyRef.current.shift();
  };
  const undo = () => { if (historyRef.current.length === 0) return; const prev = historyRef.current.pop(); setFramesRaw(prev); if (onChangeFrames) onChangeFrames(prev); };
  const setFrames = (u) => {
    pushHistory();
    setFramesRaw(prev => {
      const next = typeof u === "function" ? u(prev) : u;
      if (onChangeFrames) onChangeFrames(next);
      return next;
    });
  };
  const setProject = (u) => {
    setProjectRaw(prev => {
      const next = typeof u === "function" ? u(prev) : u;
      if (onChangeProject) onChangeProject(next);
      return next;
    });
  };

  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  });

  const sbCleanClone = (el) => {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"],[class*="extension"]').forEach(n=>n.remove());
    clone.querySelectorAll('iframe,object,embed').forEach(n=>n.remove());
    clone.querySelectorAll("[data-hide]").forEach(n => n.remove());
    clone.querySelectorAll("input").forEach(inp => {
      if (!inp.value || !inp.value.trim()) {
        const w = inp.closest("[data-field]");
        if (w) w.remove();
        else inp.style.display = "none";
      } else {
        const s = document.createElement("span");
        s.textContent = inp.value;
        s.style.fontFamily = "'" + "Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
        s.style.fontSize = "8px";
        inp.replaceWith(s);
      }
    });
    return clone;
  };
  const sbPrintViaIframe = (clone) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:1200px;height:100%;border:none;z-index:-9999;opacity:0;";
    document.body.appendChild(iframe);
    const idoc = iframe.contentDocument;
    idoc.open();
    idoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Storyboard | ${project?.name||""}</title><style>
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;font-size:10px;color:#1a1a1a;padding:10mm 12mm;}
@media print{@page{size:landscape;margin:0}}
${PRINT_CLEANUP_CSS}
</style></head><body></body></html>`);
    idoc.close();
    idoc.body.appendChild(idoc.adoptNode(clone));
    setTimeout(() => { const _t=document.title;document.title=`Storyboard | ${project?.name||""}`; iframe.contentWindow.focus(); iframe.contentWindow.print(); window.addEventListener("afterprint",function _r(){document.title=_t;window.removeEventListener("afterprint",_r);},{ once:true }); setTimeout(()=>{document.title=_t;},5000); }, 400);
  };
  const exportPDF = () => {
    const el = printRef.current; if (!el) return;
    sbPrintViaIframe(sbCleanClone(el));
  };
  const generateSharePage = async (modes, existingToken, existingResourceId) => {
    const el = printRef.current; if (!el) return;
    const clone = sbCleanClone(el);
    clone.querySelectorAll('img').forEach(im => { if(im.src && !im.src.startsWith('data:') && !im.src.startsWith('http')) im.src = window.location.origin + im.getAttribute('src'); });
    const html = clone.innerHTML;
    if (!html) return;
    try {
      const body = { html, projectName: project.name || "", clientName: project.client || "", mode: "storyboard" };
      if (existingToken) body.token = existingToken;
      if (existingResourceId) body.resourceId = existingResourceId;
      const resp = await fetch("/api/storyboard-share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!resp.ok) { const txt = await resp.text().catch(() => ""); showAlert("Failed to generate link: " + (resp.status === 413 ? "Content too large — remove some images" : resp.statusText + " " + txt.slice(0, 100))); return; }
      const data = await resp.json();
      if (data.url) {
        if (onShareUrl) onShareUrl(data.url, data.token, data.id);
        else { await navigator.clipboard.writeText(data.url).catch(() => {}); showAlert("Link copied to clipboard!\n\n" + data.url); }
      } else { showAlert("Failed to generate link: " + (data.error || "Unknown error")); }
    } catch (err) { showAlert("Error generating link: " + err.message); }
  };
  useImperativeHandle(fwdRef, () => ({ share: generateSharePage }));

  const F = "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
  const LS = 0.5;

  return (
    <div style={{ width: _fitMobile ? "100%" : 1123, minWidth: _fitMobile ? 0 : 1123, margin: "0 auto", background: "#fff", fontFamily: F, color: "#1a1a1a" }}>
      <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
        <div style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, padding: "10px 16px", background: "#000", color: "#fff", textTransform: "uppercase" }}>STORYBOARD</div>
        <div style={{ flex: 1 }} />
        <div onClick={exportPDF} style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, padding: "10px 16px", cursor: "pointer", background: "#000", color: "#fff", textTransform: "uppercase", borderLeft: "1px solid #333" }}
          onMouseEnter={e => e.target.style.background = "#333"} onMouseLeave={e => e.target.style.background = "#000"}>EXPORT PDF</div>
      </div>

      <div ref={printRef} style={{ padding: "20px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, flexWrap: _fitMobile ? "wrap" : "nowrap", gap: _fitMobile ? 8 : 0 }}><img src="/onna-default-logo.png" alt="ONNA" style={{ maxHeight: 30, maxWidth: 120, objectFit: "contain" }} /></div>
        <div style={{ borderBottom: "2.5px solid #000", marginBottom: 16 }} />
        <div style={{ textAlign: "center", fontFamily: F, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>STORYBOARD</div>

        <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
          {[["PROJECT:", project.name, "name"], ["CLIENT:", project.client, "client"], ["DATE:", project.date, "date"], ["DIRECTOR:", project.director, "director"], ["DOP:", project.dop, "dop"]].map(([lbl, val, key]) => (
            <div key={key} style={{ display: "flex", gap: 4, alignItems: "baseline", flex: 1, minWidth: _fitMobile ? "45%" : "auto", marginRight: 14 }}>
              <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS }}>{lbl}</span>
              <input value={val||""} onChange={e => setProject(p => ({ ...p, [key]: e.target.value }))}
                placeholder={lbl.replace(":","").toLowerCase()}
                style={{ fontFamily: F, fontSize: 9, letterSpacing: LS, border: "none", borderBottom: "1px solid #eee", outline: "none", padding: "2px 4px", background: "transparent", color: "#1a1a1a", minWidth: 80 }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: _fitMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: _fitMobile ? 6 : 10 }}>
          {frames.map((frame, idx) => {
            const isDropTarget = dropAt === idx;
            return (
              <div
                key={frame.id}
                draggable
                onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("application/x-sb-frame", String(idx)); }}
                onDragEnd={() => setDropAt(null)}
                onDragOver={(e) => { if (e.dataTransfer.types.includes("application/x-sb-frame")) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDropAt(idx); } }}
                onDrop={(e) => {
                  if (!e.dataTransfer.types.includes("application/x-sb-frame")) return;
                  e.preventDefault();
                  const from = parseInt(e.dataTransfer.getData("application/x-sb-frame"), 10);
                  if (isNaN(from) || from === idx) { setDropAt(null); return; }
                  setFrames((prev) => { const n = [...prev]; const [m] = n.splice(from, 1); n.splice(idx, 0, m); return n; });
                  setDropAt(null);
                }}
                onDragLeave={() => setDropAt(null)}
                style={{ border: isDropTarget ? "2px solid #FFD54F" : "1px solid #ddd", borderRadius: 2, background: "#fff", overflow: "hidden", cursor: "grab" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 6px", background: "#000" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <span style={{ fontFamily: F, fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{"\u2261"}</span>
                    <span style={{ fontFamily: F, fontSize: 8, fontWeight: 700, letterSpacing: LS, color: "#fff" }}>FRAME {idx + 1}</span>
                  </div>
                  <button
                    data-hide="1"
                    onClick={() => setFrames((prev) => prev.filter((f) => f.id !== frame.id))}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 14, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
                  >{"\u00d7"}</button>
                </div>

                <div
                    onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.background = "#FFFDE7"; } }}
                    onDragLeave={(e) => { e.currentTarget.style.background = "#f8f8f8"; }}
                    onDrop={(e) => {
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        e.preventDefault(); e.stopPropagation(); e.currentTarget.style.background = "#f8f8f8";
                        const file = e.dataTransfer.files[0];
                        if (file && file.type.startsWith("image/")) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setFrames((prev) => prev.map((f) => f.id === frame.id ? { ...f, image: ev.target.result } : f));
                          reader.readAsDataURL(file);
                        }
                      }
                    }}
                    style={{ width: "100%", height: 150, background: "#f8f8f8", position: "relative" }}>
                  {frame.image ? (
                    <>
                      <img src={frame.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", background: "#f0f0f0" }} />
                      <button
                        data-hide="1"
                        onClick={() => setFrames((prev) => prev.map((f) => f.id === frame.id ? { ...f, image: null } : f))}
                        style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", fontSize: 10, cursor: "pointer", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                      >{"\u00d7"}</button>
                    </>
                  ) : (
                    <label style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 2 }}>
                      <span style={{ fontSize: 20, color: "#ddd" }}>+</span>
                      <span style={{ fontFamily: F, fontSize: 7, color: "#ccc", letterSpacing: LS }}>Click to upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file || !file.type.startsWith("image/")) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => setFrames((prev) => prev.map((f) => f.id === frame.id ? { ...f, image: ev.target.result } : f));
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  )}
                </div>

                <div style={{ padding: "4px 6px" }}>
                  <input
                    value={frame.caption}
                    onChange={(e) => setFrames((prev) => prev.map((f) => f.id === frame.id ? { ...f, caption: e.target.value } : f))}
                    placeholder="Caption / description"
                    style={{ fontFamily: F, fontSize: 8, fontWeight: 600, letterSpacing: LS, border: "none", borderBottom: "1px solid #eee", outline: "none", width: "100%", padding: "3px 0", marginBottom: 3, boxSizing: "border-box" }}
                  />
                  {SB_FIELDS.map((fld) => (
                    <div key={fld.key} data-field="1" style={{ marginBottom: 2 }}>
                      <div style={{ fontFamily: F, fontSize: 6, fontWeight: 700, letterSpacing: LS, color: "#999", textTransform: "uppercase" }}>{fld.label}</div>
                      <input
                        value={frame[fld.key]}
                        onChange={(e) => setFrames((prev) => prev.map((f) => f.id === frame.id ? { ...f, [fld.key]: e.target.value } : f))}
                        placeholder={fld.ph}
                        style={{ fontFamily: F, fontSize: 7, letterSpacing: LS, border: "1px solid #f0f0f0", outline: "none", width: "100%", padding: "2px 4px", boxSizing: "border-box", borderRadius: 1, color: "#666" }}
                      />
                    </div>
                  ))}
                  <div data-field="1" style={{ marginBottom: 2 }}>
                    <div style={{ fontFamily: F, fontSize: 6, fontWeight: 700, letterSpacing: LS, color: "#999" }}>DURATION</div>
                    <input
                      value={frame.duration}
                      onChange={(e) => setFrames((prev) => prev.map((f) => f.id === frame.id ? { ...f, duration: e.target.value } : f))}
                      placeholder="e.g. 3s"
                      style={{ fontFamily: F, fontSize: 7, letterSpacing: LS, border: "1px solid #f0f0f0", outline: "none", width: "100%", padding: "2px 4px", boxSizing: "border-box", borderRadius: 1, color: "#666" }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div data-hide="1" style={{ marginTop: 10 }}>
          <div
            onClick={() => setFrames((prev) => [...prev, mkFrame()])}
            style={{ display: "flex", alignItems: "center", background: "#f4f4f4", padding: "6px 8px", cursor: "pointer", borderRadius: 1 }}
          >
            <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, color: "#999", textTransform: "uppercase" }}>+ ADD FRAME</span>
          </div>
        </div>
      </div>
    </div>
  );
});




/* ======= POST-PRODUCTION CONNIE ======= */

export default StoryboardPolly;
