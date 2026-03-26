import React, { useState, useRef, useEffect, useCallback } from "react";
import { TEMPLATE_DOCS, downloadAoaXlsx, genEstimate, genBudgetTracker, genCallSheet, genRiskAssessment, genCastingTable, genLocationDeck, genTravelItinerary } from "../utils/templateExport";

// ── Inline spreadsheet editor ──
function SheetEditor({ sheets, onChange, T }) {
  const [activeSheet, setActiveSheet] = useState(0);
  const sheet = sheets[activeSheet];
  if (!sheet) return null;
  const data = sheet.data;

  const updateCell = (ri, ci, val) => {
    const next = sheets.map((s, si) => {
      if (si !== activeSheet) return s;
      const newData = s.data.map((row, r) => r === ri ? row.map((c, col) => col === ci ? val : c) : row);
      return { ...s, data: newData };
    });
    onChange(next);
  };

  const addRow = () => {
    const next = sheets.map((s, si) => {
      if (si !== activeSheet) return s;
      const cols = Math.max(...s.data.map(r => r.length), 1);
      return { ...s, data: [...s.data, Array(cols).fill("")] };
    });
    onChange(next);
  };

  const deleteRow = (ri) => {
    const next = sheets.map((s, si) => {
      if (si !== activeSheet) return s;
      return { ...s, data: s.data.filter((_, r) => r !== ri) };
    });
    onChange(next);
  };

  // Detect header rows (first row, or rows where first cell is a section number)
  const isHeader = (row, ri) => ri === 0 || (row[0] && !String(row[0]).includes("A") && row.slice(2).every(c => !c || c === ""));

  return (
    <div>
      {/* Sheet tabs */}
      {sheets.length > 1 && (
        <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: `1px solid ${T.border}` }}>
          {sheets.map((s, i) => (
            <button key={i} onClick={() => setActiveSheet(i)} style={{ padding: "7px 16px", fontSize: 12, fontWeight: activeSheet === i ? 600 : 400, color: activeSheet === i ? T.text : T.muted, background: "none", border: "none", borderBottom: activeSheet === i ? "2px solid #1d1d1f" : "2px solid transparent", marginBottom: -1, cursor: "pointer", fontFamily: "inherit" }}>{s.name}</button>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto", border: `1px solid ${T.border}`, borderRadius: 10, background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "inherit" }}>
          <tbody>
            {data.map((row, ri) => {
              const hdr = isHeader(row, ri);
              const empty = row.every(c => !c && c !== 0);
              if (empty) return <tr key={ri}><td colSpan={row.length} style={{ height: 8, background: "#fafafa", borderBottom: `1px solid ${T.border}` }}></td><td style={{ width: 28, background: "#fafafa", borderBottom: `1px solid ${T.border}` }}></td></tr>;
              return (
                <tr key={ri} style={{ background: hdr ? "#f5f5f7" : "#fff" }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ borderBottom: `1px solid ${T.border}`, borderRight: `1px solid ${T.borderSub || "#f0f0f0"}`, padding: 0, minWidth: sheet.cols?.[ci]?.wch ? sheet.cols[ci].wch * 6 : 60 }}>
                      <input
                        value={cell ?? ""}
                        onChange={e => updateCell(ri, ci, e.target.value)}
                        style={{ width: "100%", border: "none", outline: "none", padding: "7px 8px", fontSize: 12, fontFamily: "inherit", background: "transparent", fontWeight: hdr ? 700 : 400, color: T.text, boxSizing: "border-box" }}
                      />
                    </td>
                  ))}
                  <td style={{ width: 28, borderBottom: `1px solid ${T.border}`, textAlign: "center", padding: 0 }}>
                    {ri > 0 && <button onClick={() => deleteRow(ri)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 13, padding: "4px", lineHeight: 1 }} onMouseOver={e => e.currentTarget.style.color = "#c0392b"} onMouseOut={e => e.currentTarget.style.color = T.muted} title="Delete row">×</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} style={{ marginTop: 8, background: "none", border: `1px dashed ${T.border}`, color: T.muted, padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>+ Add Row</button>
    </div>
  );
}

export default function Information({ T, api, isMobile, notes, setNotes, notesLoading, setNotesLoading, archiveItem, BtnPrimary, BtnSecondary, hydrated, templateFiles, setTemplateFiles, tplProject, projectEstimates, projectActuals, callSheetStore, riskAssessmentStore, castingTableStore, locDeckStore, travelItineraryStore }) {
  const [noteAddOpen, setNoteAddOpen] = useState(false);
  const [noteEditId, setNoteEditId] = useState(null);
  const [noteDraft, setNoteDraft] = useState({ title: "", content: "" });
  const [noteSaving, setNoteSaving] = useState(false);
  const [notesErr, setNotesErr] = useState("");
  const notesFetchedRef = useRef(false);
  const [infoTab, setInfoTab] = useState("folder");
  const [openDoc, setOpenDoc] = useState(null); // which template is open for editing
  const [docSheets, setDocSheets] = useState(null); // current editing data
  const [savedDocs, setSavedDocs] = useState(() => { try { return JSON.parse(localStorage.getItem("onna_template_docs") || "{}"); } catch { return {}; } });

  // Persist saved docs
  useEffect(() => { try { localStorage.setItem("onna_template_docs", JSON.stringify(savedDocs)); } catch {} }, [savedDocs]);

  useEffect(() => {
    if (notesFetchedRef.current || notes.length > 0) return;
    notesFetchedRef.current = true;
    setNotesLoading(true);
    api.get("/api/notes").then(data => { if (Array.isArray(data) && data.length) setNotes(data); setNotesLoading(false); }).catch(() => setNotesLoading(false));
  }, []); // eslint-disable-line

  // File upload helpers
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

  // Generate fresh template data from the TEMPLATE project
  const tplId = tplProject?.id;
  const genFresh = useCallback((key) => {
    switch (key) {
      case "estimate": { const ests = tplId ? projectEstimates?.[tplId] : null; return genEstimate(ests?.length > 0 ? ests[ests.length - 1] : null); }
      case "budget": { const ests = tplId ? projectEstimates?.[tplId] : null; const acts = tplId ? projectActuals?.[tplId] : null; return genBudgetTracker(ests?.length > 0 ? ests[ests.length - 1] : null, acts); }
      case "callsheet": { const css = tplId ? callSheetStore?.[tplId] : null; return genCallSheet(css?.length > 0 ? css[css.length - 1] : null); }
      case "risk": { const ras = tplId ? riskAssessmentStore?.[tplId] : null; return genRiskAssessment(ras?.length > 0 ? ras[ras.length - 1] : null); }
      case "casting": { return genCastingTable(tplId ? castingTableStore?.[tplId] : null); }
      case "locations": { return genLocationDeck(tplId ? locDeckStore?.[tplId] : null); }
      case "travel": { const tis = tplId ? travelItineraryStore?.[tplId] : null; return genTravelItinerary(tis?.length > 0 ? tis[tis.length - 1] : null); }
      default: return null;
    }
  }, [tplId, projectEstimates, projectActuals, callSheetStore, riskAssessmentStore, castingTableStore, locDeckStore, travelItineraryStore]);

  // Open a doc for viewing/editing
  const openTemplate = (key) => {
    if (savedDocs[key]) {
      setDocSheets(savedDocs[key].sheets);
    } else {
      const gen = genFresh(key);
      if (gen) setDocSheets(gen.sheets);
    }
    setOpenDoc(key);
  };

  const resetToTemplate = (key) => {
    if (!confirm("Reset to original template? Your edits will be lost.")) return;
    const gen = genFresh(key);
    if (gen) {
      setDocSheets(gen.sheets);
      setSavedDocs(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const saveDoc = (key) => {
    setSavedDocs(prev => ({ ...prev, [key]: { sheets: docSheets, savedAt: Date.now() } }));
  };

  const downloadDoc = (key) => {
    const doc = TEMPLATE_DOCS.find(d => d.key === key);
    const gen = genFresh(key);
    downloadAoaXlsx(docSheets || gen?.sheets || [], gen?.filename || `ONNA ${doc?.label || "Template"}.xlsx`);
  };

  const saveToProjectFolder = async (key) => {
    const { default: XLSX } = await import("xlsx");
    const doc = TEMPLATE_DOCS.find(d => d.key === key);
    const gen = genFresh(key);
    const sheets = docSheets || gen?.sheets || [];
    const wb = XLSX.utils.book_new();
    sheets.forEach(({ name, data, cols }) => {
      const ws = XLSX.utils.aoa_to_sheet(data);
      if (cols) ws["!cols"] = cols;
      XLSX.utils.book_append_sheet(wb, ws, name);
    });
    const out = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
    const filename = gen?.filename || `ONNA ${doc?.label || "Template"}.xlsx`;
    const entry = {
      id: Date.now() + Math.random(),
      name: filename,
      size: Math.round(out.length * 0.75),
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      data: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${out}`,
      createdAt: Date.now(),
    };
    setTemplateFiles(prev => [...prev, entry]);
    alert(`Saved "${filename}" to Uploaded Documents.`);
  };

  const docMeta = openDoc ? TEMPLATE_DOCS.find(d => d.key === openDoc) : null;
  const isSaved = openDoc && savedDocs[openDoc];

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
            <button key={key} onClick={() => setInfoTab(key)} style={{ padding: "10px 20px", fontSize: 13, fontWeight: infoTab === key ? 600 : 400, color: infoTab === key ? T.text : T.muted, background: "none", border: "none", borderBottom: infoTab === key ? "2px solid #1d1d1f" : "2px solid transparent", marginBottom: -2, cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em" }}>{label}</button>
          ))}
        </div>
      )}

      {/* ── Template Doc Editor ── */}
      {openDoc && docMeta && (
        <div>
          <button onClick={() => { setOpenDoc(null); setDocSheets(null); }} style={{ background: "none", border: "none", color: T.link || T.accent, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>&#8249; Back to Project Folder</button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>{docMeta.icon}</span>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{docMeta.label}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{isSaved ? `Saved ${new Date(savedDocs[openDoc].savedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Not saved — editing template"}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => resetToTemplate(openDoc)} style={{ background: "#fff", border: `1px solid ${T.border}`, color: T.muted, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }} onMouseOver={e => { e.currentTarget.style.borderColor = "#c0392b"; e.currentTarget.style.color = "#c0392b"; }} onMouseOut={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>Reset to Template</button>
              <button onClick={() => saveDoc(openDoc)} style={{ background: "#fff", border: `1px solid ${T.border}`, color: T.text, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
              <button onClick={() => saveToProjectFolder(openDoc)} style={{ background: "#fff", border: `1px solid ${T.border}`, color: T.text, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Save to Uploads</button>
              <button onClick={() => downloadDoc(openDoc)} style={{ background: "#1d1d1f", border: "none", color: "#fff", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Download .xlsx</button>
            </div>
          </div>

          {docSheets && <SheetEditor sheets={docSheets} onChange={setDocSheets} T={T} />}
        </div>
      )}

      {/* ── Project Folder ── */}
      {!openDoc && infoTab === "folder" && (
        <div>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>Document Templates</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Click to view & edit. Download as Excel or save to your uploads.</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
              {TEMPLATE_DOCS.map(doc => (
                <div key={doc.key} onClick={() => openTemplate(doc.key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 14, background: T.surface, border: `1px solid ${savedDocs[doc.key] ? "#1976D2" : T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", cursor: "pointer", transition: "border-color 0.15s" }} onMouseOver={e => { e.currentTarget.style.borderColor = "#1976D2"; }} onMouseOut={e => { e.currentTarget.style.borderColor = savedDocs[doc.key] ? "#1976D2" : T.border; }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{doc.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, color: T.text, fontWeight: 600 }}>{doc.label}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{savedDocs[doc.key] ? `Edited · ${new Date(savedDocs[doc.key].savedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : doc.desc}</div>
                  </div>
                  <span style={{ color: T.muted, fontSize: 16, flexShrink: 0 }}>›</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>Uploaded Documents</div>
            <label onDrop={e => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }} onDragOver={e => e.preventDefault()} style={{ display: "block", border: `1.5px dashed ${T.border}`, borderRadius: 14, padding: 28, textAlign: "center", cursor: "pointer", background: "#fafafa", transition: "border-color 0.15s", marginBottom: 14 }}>
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
                    <button onClick={() => deleteFile(f.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 17, padding: "0 4px", lineHeight: 1, flexShrink: 0 }} onMouseOver={e => e.currentTarget.style.color = "#c0392b"} onMouseOut={e => e.currentTarget.style.color = T.muted} title="Delete">×</button>
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
