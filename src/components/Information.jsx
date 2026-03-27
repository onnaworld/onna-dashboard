import React, { useState, useRef, useEffect, useCallback } from "react";
import { defaultSections } from "../utils/helpers";
import { ESTIMATE_INIT } from "./ui/DocHelpers";
import EstimateView from "./agents/EstimateView";
import CVView, { DEFAULT_CV } from "./agents/CVView";
import { TEMPLATE_DOCS, downloadAoaXlsx, genEstimate, genBudgetTracker, genCallSheet, genRiskAssessment, genCastingTable, genLocationDeck, genTravelItinerary, genCV } from "../utils/templateExport";

export default function Information({ T, api, isMobile, notes, setNotes, notesLoading, setNotesLoading, archiveItem, BtnPrimary, BtnSecondary, hydrated, templateFiles, setTemplateFiles, tplProject, projectEstimates, setProjectEstimates, projectActuals, setProjectActuals, callSheetStore, setCallSheetStore, riskAssessmentStore, setRiskAssessmentStore, castingTableStore, locDeckStore, travelItineraryStore, allProjects, showAlert }) {
  const [noteAddOpen, setNoteAddOpen] = useState(false);
  const [noteEditId, setNoteEditId] = useState(null);
  const [noteDraft, setNoteDraft] = useState({ title: "", content: "" });
  const [noteSaving, setNoteSaving] = useState(false);
  const [notesErr, setNotesErr] = useState("");
  const notesFetchedRef = useRef(false);
  const [infoTab, setInfoTab] = useState("folder");
  const [openDoc, setOpenDoc] = useState(null);
  const [resetKey, setResetKey] = useState(0); // force remount on reset
  const [showSaveTo, setShowSaveTo] = useState(false); // project picker

  // Native document data for templates (stored in original format, not aoa)
  const [templateDocData, setTemplateDocData] = useState(() => { try { const d = JSON.parse(localStorage.getItem("onna_template_doc_data") || "{}"); delete d.cv; return d; } catch { return {}; } });
  useEffect(() => { try { localStorage.setItem("onna_template_doc_data", JSON.stringify(templateDocData)); } catch {} }, [templateDocData]);

  useEffect(() => {
    if (notesFetchedRef.current || notes.length > 0) return;
    notesFetchedRef.current = true;
    setNotesLoading(true);
    api.get("/api/notes").then(data => { if (Array.isArray(data) && data.length) setNotes(data); setNotesLoading(false); }).catch(() => setNotesLoading(false));
  }, []); // eslint-disable-line

  // File helpers
  const fileInputRef = useRef(null);
  const handleFileUpload = async (fileList) => {
    const newEntries = [];
    for (const f of Array.from(fileList)) {
      if (f.size > 40 * 1024 * 1024) { alert(`"${f.name}" is over 40 MB.`); continue; }
      const data = await new Promise(r => { const fr = new FileReader(); fr.onload = e => r(e.target.result); fr.readAsDataURL(f); });
      newEntries.push({ id: Date.now() + Math.random(), name: f.name, size: f.size, type: f.type, data, createdAt: Date.now() });
    }
    if (newEntries.length > 0) setTemplateFiles(prev => [...prev, ...newEntries]);
  };
  const deleteFile = (fileId) => { if (confirm("Delete this file?")) setTemplateFiles(prev => prev.filter(f => f.id !== fileId)); };
  const downloadFile = (file) => { const a = document.createElement("a"); a.href = file.data; a.download = file.name; a.click(); };
  const getIcon = (type) => type?.includes("pdf") ? "📄" : type?.includes("image") ? "🖼" : type?.includes("word") || type?.includes("doc") ? "📝" : type?.includes("sheet") || type?.includes("excel") || type?.includes("csv") ? "📊" : "📎";
  const fmtSize = (bytes) => bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;

  // Template project ID
  const tplId = tplProject?.id;

  // Get fresh native data from template project
  const getFreshNative = useCallback((key) => {
    switch (key) {
      case "estimate": {
        const ests = tplId ? projectEstimates?.[tplId] : null;
        return ests?.length > 0 ? JSON.parse(JSON.stringify(ests[ests.length - 1])) : { ...ESTIMATE_INIT, sections: defaultSections() };
      }
      case "budget": {
        const ests = tplId ? projectEstimates?.[tplId] : null;
        const acts = tplId ? projectActuals?.[tplId] : null;
        return { estimate: ests?.length > 0 ? JSON.parse(JSON.stringify(ests[ests.length - 1])) : null, actuals: acts ? JSON.parse(JSON.stringify(acts)) : null };
      }
      case "callsheet": {
        const css = tplId ? callSheetStore?.[tplId] : null;
        return css?.length > 0 ? JSON.parse(JSON.stringify(css[css.length - 1])) : null;
      }
      case "risk": {
        const ras = tplId ? riskAssessmentStore?.[tplId] : null;
        return ras?.length > 0 ? JSON.parse(JSON.stringify(ras[ras.length - 1])) : null;
      }
      case "casting": return tplId ? JSON.parse(JSON.stringify(castingTableStore?.[tplId] || [])) : [];
      case "locations": return tplId ? JSON.parse(JSON.stringify(locDeckStore?.[tplId] || [])) : [];
      case "travel": {
        const tis = tplId ? travelItineraryStore?.[tplId] : null;
        return tis?.length > 0 ? JSON.parse(JSON.stringify(tis[tis.length - 1])) : null;
      }
      default: return null;
    }
  }, [tplId, projectEstimates, projectActuals, callSheetStore, riskAssessmentStore, castingTableStore, locDeckStore, travelItineraryStore]);

  // Get aoa generator for xlsx download
  const getAoaGen = useCallback((key) => {
    switch (key) {
      case "estimate": { const ests = tplId ? projectEstimates?.[tplId] : null; return genEstimate(ests?.length > 0 ? ests[ests.length - 1] : null); }
      case "budget": { const ests = tplId ? projectEstimates?.[tplId] : null; const acts = tplId ? projectActuals?.[tplId] : null; return genBudgetTracker(ests?.length > 0 ? ests[ests.length - 1] : null, acts); }
      case "callsheet": { const css = tplId ? callSheetStore?.[tplId] : null; return genCallSheet(css?.length > 0 ? css[css.length - 1] : null); }
      case "risk": { const ras = tplId ? riskAssessmentStore?.[tplId] : null; return genRiskAssessment(ras?.length > 0 ? ras[ras.length - 1] : null); }
      case "casting": return genCastingTable(tplId ? castingTableStore?.[tplId] : null);
      case "locations": return genLocationDeck(tplId ? locDeckStore?.[tplId] : null);
      case "travel": { const tis = tplId ? travelItineraryStore?.[tplId] : null; return genTravelItinerary(tis?.length > 0 ? tis[tis.length - 1] : null); }
      default: return null;
    }
  }, [tplId, projectEstimates, projectActuals, callSheetStore, riskAssessmentStore, castingTableStore, locDeckStore, travelItineraryStore]);

  // Get current doc data (saved or fresh)
  const getDocData = (key) => templateDocData[key]?.data || getFreshNative(key);

  const openTemplate = (key) => setOpenDoc(key);
  const resetToTemplate = (key) => {
    setTemplateDocData(prev => { const n = { ...prev }; delete n[key]; return n; });
    setResetKey(k => k + 1);
  };
  const saveDoc = (key, data) => {
    setTemplateDocData(prev => ({ ...prev, [key]: { data, savedAt: Date.now() } }));
  };
  const downloadDoc = (key) => {
    if (key === "estimate") {
      const data = getDocData(key);
      const gen = genEstimate(data);
      downloadAoaXlsx(gen.sheets, gen.filename);
    } else if (key === "cv") {
      const data = getDocData(key);
      const gen = genCV(data);
      downloadAoaXlsx(gen.sheets, gen.filename);
    } else {
      const gen = getAoaGen(key);
      if (gen) downloadAoaXlsx(gen.sheets, gen.filename);
    }
  };

  // Save current template into a specific project's store
  const saveToProject = (projectId, projectName) => {
    const key = openDoc;
    if (!key) return;
    const data = getDocData(key);
    switch (key) {
      case "estimate": {
        const est = data || { ...ESTIMATE_INIT, sections: defaultSections() };
        setProjectEstimates(prev => ({ ...prev, [projectId]: [...(prev[projectId] || []), JSON.parse(JSON.stringify(est))] }));
        break;
      }
      case "budget": {
        const bd = data || {};
        if (bd.estimate) setProjectEstimates(prev => ({ ...prev, [projectId]: [...(prev[projectId] || []), JSON.parse(JSON.stringify(bd.estimate))] }));
        if (bd.actuals) setProjectActuals(prev => ({ ...prev, [projectId]: JSON.parse(JSON.stringify(bd.actuals)) }));
        break;
      }
      case "callsheet": {
        const cs = data || {};
        setCallSheetStore(prev => ({ ...prev, [projectId]: [...(prev[projectId] || []), JSON.parse(JSON.stringify(cs))] }));
        break;
      }
      case "risk": {
        const ra = data || {};
        setRiskAssessmentStore(prev => ({ ...prev, [projectId]: [...(prev[projectId] || []), JSON.parse(JSON.stringify(ra))] }));
        break;
      }
      default: break;
    }
    setShowSaveTo(null);
    if (showAlert) showAlert(`Saved to ${projectName}`);
  };

  const docMeta = openDoc ? TEMPLATE_DOCS.find(d => d.key === openDoc) : null;
  const isSaved = openDoc && templateDocData[openDoc];

  // Toolbar for open doc
  const DocToolbar = ({ docKey }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 24 }}>{docMeta?.icon}</span>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{docMeta?.label} Template</div>
          <div style={{ fontSize: 11, color: T.muted }}>{isSaved ? `Saved ${new Date(templateDocData[docKey].savedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Template project"}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => resetToTemplate(docKey)} style={{ background: "#fff", border: `1px solid ${T.border}`, color: T.muted, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Reset to Template</button>
        <button onClick={() => setShowSaveTo(docKey)} style={{ background: "#fff", border: `1px solid ${T.border}`, color: T.text, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Save to Project</button>
        <button onClick={() => downloadDoc(docKey)} style={{ background: "#1d1d1f", border: "none", color: "#fff", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Download .xlsx</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: T.text }}>Information</div>
        {infoTab === "notes" && !openDoc && (
          <button onClick={() => { setNoteAddOpen(true); setNoteEditId(null); setNoteDraft({ title: "", content: "" }); }} style={{ padding: "9px 18px", borderRadius: 10, background: "#1d1d1f", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ New</button>
        )}
      </div>

      {/* Tab bar */}
      {!openDoc && (
        <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: `2px solid ${T.border}` }}>
          {[["folder", "Project Folder"], ["notes", "Notes"]].map(([key, label]) => (
            <button key={key} onClick={() => setInfoTab(key)} style={{ padding: "10px 20px", fontSize: 13, fontWeight: infoTab === key ? 600 : 400, color: infoTab === key ? T.text : T.muted, background: "none", border: "none", borderBottom: infoTab === key ? "2px solid #1d1d1f" : "2px solid transparent", marginBottom: -2, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
          ))}
        </div>
      )}

      {/* ── Template Doc View ── */}
      {openDoc && docMeta && (
        <div>
          <button onClick={() => setOpenDoc(null)} style={{ background: "none", border: "none", color: T.link || T.accent, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>&#8249; Back to Project Folder</button>
          <DocToolbar docKey={openDoc} />

          {/* Save to Project picker */}
          {showSaveTo && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowSaveTo(null)}>
              <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", width: 380, maxHeight: "70vh", display: "flex", flexDirection: "column", boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>Save to Project</div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Select a project to save this {docMeta?.label || "template"} into.</div>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                  {(allProjects || []).length === 0 && <div style={{ padding: 20, textAlign: "center", color: T.muted, fontSize: 13 }}>No projects found.</div>}
                  {(allProjects || []).sort((a, b) => (a.name || "").localeCompare(b.name || "")).map(p => (
                    <button key={p.id} onClick={() => saveToProject(p.id, p.name)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fafafa", cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%" }} onMouseOver={e => { e.currentTarget.style.background = "#f0f0f5"; e.currentTarget.style.borderColor = "#1976D2"; }} onMouseOut={e => { e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.borderColor = T.border; }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>{p.client || ""}{p.status === "archived" ? " · Archived" : ""}</div>
                      </div>
                      <span style={{ color: T.muted, fontSize: 14, flexShrink: 0 }}>›</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowSaveTo(null)} style={{ marginTop: 14, padding: "9px 18px", borderRadius: 10, background: "#f5f5f7", border: `1px solid ${T.border}`, color: T.sub, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Estimate — render using actual EstimateView */}
          {openDoc === "estimate" && (() => {
            const data = getDocData("estimate");
            return (
              <EstimateView
                key={resetKey}
                estData={data || { ...ESTIMATE_INIT, sections: defaultSections() }}
                onSet={(updater) => {
                  const current = getDocData("estimate") || { ...ESTIMATE_INIT, sections: defaultSections() };
                  const next = typeof updater === "function" ? updater(current) : updater;
                  saveDoc("estimate", next);
                }}
                projectName="Template"
              />
            );
          })()}

          {/* Budget Tracker — render using actual EstimateView in estimates tab mode */}
          {openDoc === "budget" && (() => {
            const bd = getDocData("budget");
            const estData = bd?.estimate || { ...ESTIMATE_INIT, sections: defaultSections() };
            return (
              <EstimateView
                key={resetKey}
                estData={estData}
                onSet={(updater) => {
                  const current = getDocData("budget");
                  const curEst = current?.estimate || { ...ESTIMATE_INIT, sections: defaultSections() };
                  const next = typeof updater === "function" ? updater(curEst) : updater;
                  saveDoc("budget", { ...current, estimate: next });
                }}
                projectName="Template"
              />
            );
          })()}

          {/* CV — render using CVView */}
          {openDoc === "cv" && (() => {
            const data = getDocData("cv");
            return (
              <CVView
                key={resetKey}
                cvData={data || DEFAULT_CV}
                onSet={(updater) => {
                  const current = getDocData("cv") || DEFAULT_CV;
                  const next = typeof updater === "function" ? updater(current) : updater;
                  saveDoc("cv", next);
                }}
                projectName="Template"
              />
            );
          })()}

          {/* Other doc types — styled table view */}
          {!["estimate", "budget", "cv"].includes(openDoc) && (() => {
            const gen = getAoaGen(openDoc);
            if (!gen) return <div style={{ padding: 40, textAlign: "center", color: T.muted }}>No template data available.</div>;
            return gen.sheets.map((sheet, si) => (
              <div key={si} style={{ marginBottom: 24 }}>
                {gen.sheets.length > 1 && <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{sheet.name}</div>}
                <div style={{ overflowX: "auto", border: `1px solid ${T.border}`, borderRadius: 12, background: "#fff" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Avenir','Nunito Sans',sans-serif", fontSize: 11 }}>
                    <tbody>
                      {sheet.data.map((row, ri) => {
                        const empty = row.every(c => !c && c !== 0);
                        if (empty) return <tr key={ri}><td colSpan={999} style={{ height: 6, background: "#fafafa", borderBottom: `1px solid #eee` }}></td></tr>;
                        const isHdr = ri === 0 || (row[0] && !String(row[0]).includes("A") && String(row[0]).length <= 3 && !row[0].toString().includes("."));
                        const isSubtotal = row.some(c => String(c).includes("SUBTOTAL") || String(c).includes("GRAND TOTAL"));
                        return (
                          <tr key={ri} style={{ background: isHdr ? "#1a1a1a" : isSubtotal ? "#f5f5f5" : "#fff" }}>
                            {row.map((cell, ci) => (
                              <td key={ci} style={{
                                padding: "8px 10px",
                                borderBottom: `1px solid ${isHdr ? "#333" : "#eee"}`,
                                fontSize: isHdr ? 9 : 11,
                                fontWeight: isHdr || isSubtotal ? 700 : 400,
                                color: isHdr ? "#fff" : T.text,
                                letterSpacing: isHdr ? "0.08em" : "0.02em",
                                textTransform: isHdr ? "uppercase" : "none",
                                textAlign: (typeof cell === "number" || (ci >= 3 && !isHdr)) ? "right" : "left",
                                whiteSpace: "nowrap",
                                minWidth: sheet.cols?.[ci]?.wch ? sheet.cols[ci].wch * 5 : 40,
                              }}>
                                {typeof cell === "number" ? cell.toLocaleString() : cell}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* ── Project Folder ── */}
      {!openDoc && infoTab === "folder" && (
        <div>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>Document Templates</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Click to view & edit. Download as Excel or export to PDF.</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
              {TEMPLATE_DOCS.map(doc => (
                <div key={doc.key} onClick={() => openTemplate(doc.key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 14, background: T.surface, border: `1px solid ${templateDocData[doc.key] ? "#1976D2" : T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", cursor: "pointer", transition: "border-color 0.15s" }} onMouseOver={e => { e.currentTarget.style.borderColor = "#1976D2"; }} onMouseOut={e => { e.currentTarget.style.borderColor = templateDocData[doc.key] ? "#1976D2" : T.border; }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{doc.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, color: T.text, fontWeight: 600 }}>{doc.label}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{templateDocData[doc.key] ? `Edited · ${new Date(templateDocData[doc.key].savedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : doc.desc}</div>
                  </div>
                  <span style={{ color: T.muted, fontSize: 16, flexShrink: 0 }}>›</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>Uploaded Documents</div>
            <label onDrop={e => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }} onDragOver={e => e.preventDefault()} style={{ display: "block", border: `1.5px dashed ${T.border}`, borderRadius: 14, padding: 28, textAlign: "center", cursor: "pointer", background: "#fafafa", marginBottom: 14 }}>
              <div style={{ fontSize: 22, marginBottom: 6, opacity: 0.35 }}>⬆</div>
              <div style={{ fontSize: 12, color: T.sub, fontWeight: 500 }}>Upload additional documents</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Drag & drop or click</div>
              <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={e => { handleFileUpload(e.target.files); e.target.value = ""; }} />
            </label>
            {templateFiles.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {templateFiles.sort((a, b) => b.createdAt - a.createdAt).map(f => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{getIcon(f.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, color: T.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{fmtSize(f.size)} · {new Date(f.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                    </div>
                    <button onClick={() => downloadFile(f)} style={{ background: "#f5f5f7", border: `1px solid ${T.border}`, color: T.sub, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>Download</button>
                    <button onClick={() => deleteFile(f.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 17, padding: "0 4px", lineHeight: 1, flexShrink: 0 }} onMouseOver={e => e.currentTarget.style.color = "#c0392b"} onMouseOut={e => e.currentTarget.style.color = T.muted}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Notes ── */}
      {!openDoc && infoTab === "notes" && (
        <div>
          {noteAddOpen && (
            <div style={{ borderRadius: 16, background: T.surface, border: `1px solid ${T.border}`, padding: "22px 24px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <input value={noteDraft.title} onChange={e => setNoteDraft(p => ({ ...p, title: e.target.value }))} placeholder="Title" autoFocus style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 15, fontWeight: 600, fontFamily: "inherit", color: T.text, background: "#fafafa", boxSizing: "border-box", marginBottom: 10 }} />
              <textarea value={noteDraft.content} onChange={e => setNoteDraft(p => ({ ...p, content: e.target.value }))} placeholder="Write…" rows={6} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: "inherit", color: T.text, background: "#fafafa", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }} />
              {notesErr && <div style={{ fontSize: 12, color: "#c0392b", marginTop: 8, fontWeight: 500 }}>{notesErr}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <BtnPrimary disabled={noteSaving || !noteDraft.content.trim()} onClick={async () => {
                  setNoteSaving(true); setNotesErr("");
                  try {
                    if (noteEditId) {
                      const updated = await api.put(`/api/notes/${noteEditId}`, { title: noteDraft.title, content: noteDraft.content, updated_at: new Date().toISOString() });
                      if (updated.error) { setNotesErr(updated.error); setNoteSaving(false); return; }
                      setNotes(prev => prev.map(n => n.id === noteEditId ? updated : n));
                    } else {
                      const saved = await api.post("/api/notes", { title: noteDraft.title, content: noteDraft.content });
                      if (saved.error) { setNotesErr(saved.error); setNoteSaving(false); return; }
                      setNotes(prev => [saved, ...prev]);
                    }
                    setNoteSaving(false); setNoteAddOpen(false); setNoteEditId(null); setNoteDraft({ title: "", content: "" });
                  } catch (e) { setNotesErr(e.message || "Failed to save."); setNoteSaving(false); }
                }}>{noteSaving ? "Saving…" : noteEditId ? "Save Changes" : "Save"}</BtnPrimary>
                <BtnSecondary onClick={() => { setNoteAddOpen(false); setNoteEditId(null); setNoteDraft({ title: "", content: "" }); setNotesErr(""); }}>Cancel</BtnSecondary>
              </div>
            </div>
          )}
          {notesLoading ? (
            <div style={{ textAlign: "center", padding: 60, color: T.muted, fontSize: 13 }}>Loading…</div>
          ) : notes.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: T.muted, fontSize: 13 }}>No information yet. Hit + New to start.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
              {notes.map(n => (
                <div key={n.id} style={{ borderRadius: 16, padding: "20px 22px", background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
                  {n.title && <div style={{ fontSize: 14, fontWeight: 700, color: T.text, letterSpacing: "-0.01em" }}>{n.title}</div>}
                  <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.65, whiteSpace: "pre-wrap", flexGrow: 1 }}>{n.content}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, paddingTop: 10, borderTop: `1px solid ${T.borderSub}` }}>
                    <span style={{ fontSize: 11, color: T.muted }}>{n.updated_at ? new Date(n.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setNoteEditId(n.id); setNoteDraft({ title: n.title || "", content: n.content || "" }); setNoteAddOpen(true); }} style={{ background: "none", border: "none", fontSize: 12, color: T.muted, cursor: "pointer", fontFamily: "inherit", padding: "2px 6px", borderRadius: 6 }} onMouseOver={ev => ev.currentTarget.style.color = T.text} onMouseOut={ev => ev.currentTarget.style.color = T.muted}>Edit</button>
                      <button onClick={async () => { if (!confirm("Delete this item?")) return; archiveItem("notes", n); await api.delete(`/api/notes/${n.id}`); setNotes(prev => prev.filter(x => x.id !== n.id)); }} style={{ background: "none", border: "none", fontSize: 12, color: T.muted, cursor: "pointer", fontFamily: "inherit", padding: "2px 6px", borderRadius: 6 }} onMouseOver={ev => ev.currentTarget.style.color = "#c0392b"} onMouseOut={ev => ev.currentTarget.style.color = T.muted}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
