import React, { useState, useRef, useImperativeHandle } from "react";
import { PRINT_CLEANUP_CSS } from "../../utils/helpers";
import { validateImg } from "../ui/DocHelpers";

const CTB_F = "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
const CTB_LS = 0.5;
const CTB_YEL = "#FFFDE7";
let _ctId = 0;
const ctMkRole = () => ({ id: "cr" + (++_ctId), role: "", models: [ctMkModel(), ctMkModel(), ctMkModel()] });
const ctMkModel = () => ({ id: "cm" + (++_ctId), agency: "", name: "", email: "", option: "First Option", notes: "", image: null, synced: false });
const CTB_OPTIONS = ["First Option", "Second Option", "Third Option", "Shortlist", "Confirmed", "Declined", "Unavailable"];
const CTB_OPT_C = {
  "First Option": { bg: "#E8F5E9", text: "#2E7D32" },
  "Second Option": { bg: "#FFF3E0", text: "#E65100" },
  "Third Option": { bg: "#FCE4EC", text: "#C62828" },
  "Shortlist": { bg: "#E3F2FD", text: "#1565C0" },
  "Confirmed": { bg: "#000", text: "#fff" },
  "Declined": { bg: "#f4f4f4", text: "#999" },
  "Unavailable": { bg: "#f4f4f4", text: "#ccc" },
};

const PRINT_CLEANUP_CSS_CTB = `[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"],[class*="extension"]{display:none!important}`;

const CastingTableConnie = React.forwardRef(function CastingTableConnieInner({ initialProject, initialRoles, onChangeProject, onChangeRoles, onShareUrl }, fwdRef) {
  const [project, setProjectRaw] = useState(() => initialProject || { name: "", client: "", date: "", casting: "" });
  const [roles, setRolesRaw] = useState(() => initialRoles || [ctMkRole(), ctMkRole()]);
  const printRef = useRef(null);

  const setProject = (v) => { const nv = typeof v === "function" ? v(project) : v; setProjectRaw(nv); if (onChangeProject) onChangeProject(nv); };
  const setRoles = (v) => { const nv = typeof v === "function" ? v(roles) : v; setRolesRaw(nv); if (onChangeRoles) onChangeRoles(nv); };

  const updateRole = (id, k, v) => setRoles(p => p.map(r => r.id === id ? { ...r, [k]: v } : r));
  const addRole = () => setRoles(p => [...p, ctMkRole()]);
  const deleteRole = (id) => setRoles(p => p.filter(r => r.id !== id));
  const updateModel = (rid, mid, k, v) => setRoles(p => p.map(r => r.id === rid ? { ...r, models: r.models.map(m => m.id === mid ? { ...m, [k]: v } : m) } : r));
  const addModel = (rid) => setRoles(p => p.map(r => r.id === rid ? { ...r, models: [...r.models, ctMkModel()] } : r));
  const deleteModel = (rid, mid) => setRoles(p => p.map(r => r.id === rid ? { ...r, models: r.models.filter(m => m.id !== mid) } : r));

  const addModelImage = (rid, mid, fileList) => {
    const file = Array.from(fileList).find(f => f.type.startsWith("image/"));
    if (!file) return;
    const r = new FileReader();
    r.onload = (e) => setRoles(p => p.map(ro => ro.id === rid ? { ...ro, models: ro.models.map(m => m.id === mid ? { ...m, image: e.target.result } : m) } : ro));
    r.readAsDataURL(file);
  };

  const collectFontRules = () => { try { return [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch { return []; } }).filter(r => r.type === CSSRule.FONT_FACE_RULE).map(r => r.cssText).join("\n"); } catch { return ""; } };

  const ctCleanClone = (el) => { const clone = el.cloneNode(true); clone.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"],[class*="extension"]').forEach(n=>n.remove()); clone.querySelectorAll('iframe,object,embed').forEach(n=>n.remove()); return clone; };

  const ctPrintViaIframe = (clone) => { const fontRules = collectFontRules(); const iframe = document.createElement("iframe"); iframe.style.cssText = "position:fixed;top:0;left:0;width:1200px;height:100%;border:none;z-index:-9999;opacity:0;"; document.body.appendChild(iframe); const idoc = iframe.contentDocument; idoc.open(); idoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><base href="${window.location.origin}/"><title>\u200B</title><style>@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;700&display=swap');${fontRules}*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;font-size:10px;color:#1a1a1a;padding:12mm;padding-bottom:18mm}@media print{@page{size:landscape;margin:0}}${PRINT_CLEANUP_CSS_CTB}</style></head><body></body></html>`); idoc.close(); idoc.body.appendChild(idoc.adoptNode(clone)); const _imgs=[...idoc.querySelectorAll('img')];const _imgReady=_imgs.map(im=>im.complete?Promise.resolve():new Promise(r=>{im.onload=r;im.onerror=r;})); Promise.all(_imgReady).then(()=>{setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 300);}); };

  const exportPDF = () => { const el = printRef.current; if (!el) return; ctPrintViaIframe(ctCleanClone(el)); };

  const generateSharePage = async (modes, existingToken, existingResourceId) => { const captureHtml = () => { const el = printRef.current; if (!el) return null; const clone = ctCleanClone(el); clone.querySelectorAll('input').forEach(n => { const sp = document.createElement('span'); sp.textContent = n.value; sp.style.cssText = n.style.cssText; n.replaceWith(sp); }); clone.querySelectorAll('select').forEach(n => { const sp = document.createElement('span'); sp.textContent = n.value || ""; sp.style.fontFamily = CTB_F; sp.style.fontSize = "8px"; sp.style.fontWeight = "700"; n.replaceWith(sp); }); clone.querySelectorAll('textarea').forEach(n => { const sp = document.createElement('span'); sp.textContent = n.value || ""; sp.style.cssText = n.style.cssText; sp.style.whiteSpace = "pre-wrap"; n.replaceWith(sp); }); clone.querySelectorAll('[data-hide]').forEach(n => n.remove()); clone.querySelectorAll('img').forEach(im => { if(im.src && !im.src.startsWith('data:') && !im.src.startsWith('http')) im.src = window.location.origin + im.getAttribute('src'); }); return clone.innerHTML; }; const html = captureHtml(); if (!html) return; try { const body = { html, projectName: project.name || "Casting Table", mode: "casting-table" }; if (existingToken) body.token = existingToken; if (existingResourceId) body.resourceId = existingResourceId; const resp = await fetch("/api/casting-share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const data = await resp.json(); if (data.url) { if (onShareUrl) onShareUrl(data.url, data.token, data.id); else { await navigator.clipboard.writeText(data.url).catch(() => {}); showAlert("Link copied to clipboard!\n\n" + data.url); } } else { showAlert("Failed to generate link: " + (data.error || "Unknown error")); } } catch (err) { showAlert("Error generating link: " + err.message); } };
  useImperativeHandle(fwdRef, () => ({ share: generateSharePage }));

  const allModels = roles.flatMap(r => r.models);
  const confirmed = allModels.filter(m => m.option === "Confirmed").length;
  const shortlisted = allModels.filter(m => m.option === "Shortlist").length;
  const synced = allModels.filter(m => m.synced).length;

  return (
    <div style={{ maxWidth: 1123, margin: "0 auto", background: "#fff", fontFamily: CTB_F, color: "#1a1a1a" }}>
      <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
        <div style={{ fontFamily: CTB_F, fontSize: 9, fontWeight: 700, letterSpacing: CTB_LS, padding: "10px 16px", background: "#000", color: "#fff", textTransform: "uppercase" }}>CASTING</div>
        <div style={{ flex: 1 }} />
        <div data-hide="1" onClick={exportPDF} style={{ fontFamily: CTB_F, fontSize: 9, fontWeight: 700, letterSpacing: CTB_LS, padding: "10px 16px", cursor: "pointer", background: "#000", color: "#fff", textTransform: "uppercase", borderLeft: "1px solid #333" }}>EXPORT PDF</div>
      </div>

      <div ref={printRef} style={{ padding: "16px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}><img src="/onna-default-logo.png" alt="ONNA" style={{ maxHeight: 30, maxWidth: 120, objectFit: "contain" }} /></div>
        <div style={{ borderBottom: "2.5px solid #000", marginBottom: 16 }} />
        <div style={{ textAlign: "center", fontFamily: CTB_F, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>CASTING</div>

        <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          {[["PROJECT", "name", "Project Name"], ["CLIENT", "client", "Client"], ["DATE", "date", "Date"], ["CASTING", "casting", "Casting Director"]].map(([lbl, key, ph]) => (
            <div key={key} style={{ display: "flex", gap: 4, alignItems: "baseline" }}>
              <span style={{ fontFamily: CTB_F, fontSize: 9, fontWeight: 700, letterSpacing: CTB_LS }}>{lbl}:</span>
              <input value={project[key]} onChange={e => setProject(p => ({ ...p, [key]: e.target.value }))} placeholder={ph}
                style={{ fontFamily: CTB_F, fontSize: 9, letterSpacing: CTB_LS, border: "none", borderBottom: "1px solid #eee", outline: "none", padding: "2px 6px", width: 110, background: project[key] ? "transparent" : CTB_YEL, color: project[key] ? "#1a1a1a" : "#999" }} />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <div style={{ fontFamily: CTB_F, fontSize: 8, fontWeight: 700, letterSpacing: CTB_LS, background: "#f4f4f4", padding: "3px 10px", borderRadius: 2, color: "#666" }}>TOTAL: {allModels.length}</div>
          <div style={{ fontFamily: CTB_F, fontSize: 8, fontWeight: 700, letterSpacing: CTB_LS, background: "#E3F2FD", padding: "3px 10px", borderRadius: 2, color: "#1565C0" }}>SHORTLISTED: {shortlisted}</div>
          <div style={{ fontFamily: CTB_F, fontSize: 8, fontWeight: 700, letterSpacing: CTB_LS, background: "#000", padding: "3px 10px", borderRadius: 2, color: "#fff" }}>CONFIRMED: {confirmed}</div>
          <div style={{ fontFamily: CTB_F, fontSize: 8, fontWeight: 700, letterSpacing: CTB_LS, background: synced > 0 ? "#E8F5E9" : "#f4f4f4", padding: "3px 10px", borderRadius: 2, color: synced > 0 ? "#2E7D32" : "#999" }}>SYNCED TO DECK: {synced}</div>
        </div>

        {roles.map((role, ri) => (
          <div key={role.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", background: "#000", padding: "5px 8px", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input value={role.role} onChange={e => updateRole(role.id, "role", e.target.value)} placeholder="Role Name"
                  style={{ fontFamily: CTB_F, fontSize: 10, fontWeight: 700, letterSpacing: CTB_LS, color: "#fff", background: "transparent", border: "none", outline: "none", width: 200, padding: "2px 4px" }} />
                <span style={{ fontFamily: CTB_F, fontSize: 8, color: "rgba(255,255,255,0.4)", letterSpacing: CTB_LS }}>{role.models.length} talent</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span data-hide="1" onClick={() => addModel(role.id)} style={{ fontFamily: CTB_F, fontSize: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", letterSpacing: CTB_LS }}>+ ADD MODEL</span>
                <span data-hide="1" onClick={() => deleteRole(role.id)} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", cursor: "pointer" }}
                  onMouseEnter={e => e.target.style.color = "#e53935"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.3)"}>{"\u00d7"}</span>
              </div>
            </div>

            <div style={{ display: "flex", background: "#f4f4f4", padding: "3px 8px", gap: 4, borderBottom: "1px solid #eee" }}>
              <div style={{ width: 14 }} />
              <div style={{ width: 36, fontFamily: CTB_F, fontSize: 7, fontWeight: 700, letterSpacing: CTB_LS, color: "#999" }}></div>
              <div style={{ flex: 1, fontFamily: CTB_F, fontSize: 7, fontWeight: 700, letterSpacing: CTB_LS, color: "#999" }}>AGENCY</div>
              <div style={{ flex: 1.2, fontFamily: CTB_F, fontSize: 7, fontWeight: 700, letterSpacing: CTB_LS, color: "#999" }}>NAME</div>
              <div style={{ flex: 1, fontFamily: CTB_F, fontSize: 7, fontWeight: 700, letterSpacing: CTB_LS, color: "#999" }}>EMAIL</div>
              <div style={{ width: 100, fontFamily: CTB_F, fontSize: 7, fontWeight: 700, letterSpacing: CTB_LS, color: "#999" }}>OPTION</div>
              <div style={{ flex: 1, fontFamily: CTB_F, fontSize: 7, fontWeight: 700, letterSpacing: CTB_LS, color: "#999" }}>NOTES</div>
              <div style={{ width: 30, fontFamily: CTB_F, fontSize: 7, fontWeight: 700, letterSpacing: CTB_LS, color: "#999", textAlign: "center" }}>DECK</div>
            </div>

            {role.models.map((model, mi) => {
              const oc = CTB_OPT_C[model.option] || CTB_OPT_C["Declined"];
              const isConfirmed = model.option === "Confirmed";
              const isDeclined = model.option === "Declined" || model.option === "Unavailable";
              return (
                <div key={model.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderBottom: "1px solid #f0f0f0",
                  background: isConfirmed ? "#f0faf0" : isDeclined ? "#fafafa" : "#fff", opacity: isDeclined ? 0.5 : 1 }}>
                  <div style={{ width: 14 }}>
                    <button data-hide="1" onClick={() => deleteModel(role.id, model.id)}
                      style={{ background: "none", border: "none", color: "#ddd", fontSize: 10, cursor: "pointer", padding: 0, lineHeight: 1 }}>{"\u00d7"}</button>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 2, overflow: "hidden", background: "#f4f4f4", flexShrink: 0 }}>
                    {model.image ? (
                      <img src={model.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <label style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <span style={{ fontSize: 12, color: "#ddd" }}>+</span>
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { addModelImage(role.id, model.id, e.target.files); e.target.value = ""; }} />
                      </label>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input value={model.agency} onChange={e => updateModel(role.id, model.id, "agency", e.target.value)} placeholder="Agency"
                      style={{ fontFamily: CTB_F, fontSize: 9, letterSpacing: CTB_LS, border: "none", outline: "none", width: "100%", padding: "3px 6px", boxSizing: "border-box",
                        background: model.agency ? "transparent" : CTB_YEL, color: model.agency ? "#1a1a1a" : "#999" }} />
                  </div>
                  <div style={{ flex: 1.2 }}>
                    <input value={model.name} onChange={e => updateModel(role.id, model.id, "name", e.target.value)} placeholder="Name"
                      style={{ fontFamily: CTB_F, fontSize: 9, fontWeight: 700, letterSpacing: CTB_LS, border: "none", outline: "none", width: "100%", padding: "3px 6px", boxSizing: "border-box",
                        textDecoration: isConfirmed ? "none" : isDeclined ? "line-through" : "none",
                        background: model.name ? "transparent" : CTB_YEL, color: model.name ? "#1a1a1a" : "#999" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input value={model.email} onChange={e => updateModel(role.id, model.id, "email", e.target.value)} placeholder="Email"
                      style={{ fontFamily: CTB_F, fontSize: 9, letterSpacing: CTB_LS, border: "none", outline: "none", width: "100%", padding: "3px 6px", boxSizing: "border-box",
                        background: model.email ? "transparent" : CTB_YEL, color: model.email ? "#666" : "#999" }} />
                  </div>
                  <div style={{ width: 100 }}>
                    <select value={model.option} onChange={e => updateModel(role.id, model.id, "option", e.target.value)}
                      style={{ fontFamily: CTB_F, fontSize: 7, fontWeight: 700, letterSpacing: CTB_LS, border: "none", outline: "none", padding: "3px 4px", borderRadius: 2, cursor: "pointer", width: "100%",
                        background: oc.bg, color: oc.text }}>
                      {CTB_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <input value={model.notes} onChange={e => updateModel(role.id, model.id, "notes", e.target.value)} placeholder="Notes..."
                      style={{ fontFamily: CTB_F, fontSize: 9, letterSpacing: CTB_LS, border: "none", outline: "none", width: "100%", padding: "3px 6px", boxSizing: "border-box",
                        background: model.notes ? "transparent" : CTB_YEL, color: model.notes ? "#666" : "#999" }} />
                  </div>
                  <div style={{ width: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div onClick={() => updateModel(role.id, model.id, "synced", !model.synced)}
                      style={{ width: 16, height: 16, borderRadius: 2, border: model.synced ? "2px solid #2E7D32" : "2px solid #ddd", background: model.synced ? "#2E7D32" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                      {model.synced && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>{"\u2713"}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div data-hide="1" style={{ marginBottom: 16 }}>
          <div onClick={addRole} style={{ display: "flex", alignItems: "center", background: "#f4f4f4", padding: "6px 8px", cursor: "pointer", borderRadius: 1 }}
            onMouseEnter={e => e.currentTarget.style.background = "#eee"} onMouseLeave={e => e.currentTarget.style.background = "#f4f4f4"}>
            <span style={{ fontFamily: CTB_F, fontSize: 9, fontWeight: 700, letterSpacing: CTB_LS, color: "#999", textTransform: "uppercase" }}>+ ADD ROLE</span>
          </div>
        </div>

        <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", fontFamily: CTB_F, fontSize: 9, letterSpacing: CTB_LS, color: "#000", borderTop: "2px solid #000", paddingTop: 10 }}>
          <div><div style={{ fontWeight: 700 }}>@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700 }}>WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div>
        </div>
      </div>
    </div>
  );
});

/* ======= FITTING CONNIE ======= */
let _fitId = 0;

export default CastingTableConnie;
