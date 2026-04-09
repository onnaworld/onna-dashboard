import React, { useState } from "react";
import { BillieRateCardInline } from "../modals/BillieRateCardModal";

// ── Folder structure definition ──
const FOLDER_TREE = [
  { key: "creative", label: "Creative", emoji: "🎨", children: [
    { key: "moodboards", label: "Moodboards", type: "fileStore" },
    { key: "briefs", label: "Briefs", type: "fileStore" },
    { key: "references", label: "References", type: "fileStore" },
  ]},
  { key: "budget", label: "Budget", emoji: "📊", children: [
    { key: "estimates", label: "Estimates", type: "versionStore", store: "projectEstimates" },
    { key: "quotations", label: "Quotations", type: "fileStore" },
    { key: "invoices", label: "Invoices", type: "fileStore" },
    { key: "receipts", label: "Receipts", type: "fileStore" },
    { key: "rate_card", label: "Rate Card", type: "rateCard" },
  ]},
  { key: "documents", label: "Documents", emoji: "📁", children: [
    { key: "callsheets", label: "Call Sheets", type: "versionStore", store: "callSheetStore" },
    { key: "risk_assessments", label: "Risk Assessments", type: "versionStore", store: "riskAssessmentStore" },
    { key: "contracts", label: "Contracts", type: "versionStore", store: "contractDocStore" },
  ]},
  { key: "casting", label: "Casting", emoji: "🎭", children: [
    { key: "casting_decks", label: "Casting Decks", type: "versionStore", store: "castingDeckStore" },
    { key: "casting_tables", label: "Casting Tables", type: "versionStore", store: "castingTableStore" },
    { key: "fittings", label: "Fittings", type: "versionStore", store: "fittingStore" },
    { key: "casting", label: "Casting Files", type: "fileStore" },
  ]},
  { key: "styling", label: "Styling", emoji: "👗", children: [
    { key: "styling_store", label: "Styling Files", type: "fileStore" },
  ]},
  { key: "locations", label: "Locations", emoji: "📍", children: [
    { key: "loc_decks", label: "Location Decks", type: "versionStore", store: "locDeckStore" },
    { key: "recce_reports", label: "Recce Reports", type: "versionStore", store: "recceReportStore" },
  ]},
  { key: "travel", label: "Travel", emoji: "✈️", children: [
    { key: "itineraries", label: "Itineraries", type: "versionStore", store: "travelItineraryStore" },
  ]},
  { key: "schedule", label: "Schedule", emoji: "📒", children: [
    { key: "cps", label: "CPS / Shot Lists / Storyboards", type: "versionStore", store: "cpsStore" },
    { key: "shot_lists", label: "Shot Lists", type: "versionStore", store: "shotListStore" },
    { key: "storyboards", label: "Storyboards", type: "versionStore", store: "storyboardStore" },
    { key: "post_production", label: "Post-Production", type: "versionStore", store: "postProdStore" },
  ]},
];

export default function Files({
  T, isMobile, p,
  filesSubSection, setFilesSubSection,
  projectFileStore, setProjectFileStore,
  projectEstimates,
  callSheetStore, riskAssessmentStore, contractDocStore,
  locDeckStore, recceReportStore,
  travelItineraryStore,
  cpsStore, shotListStore, storyboardStore, postProdStore,
  castingDeckStore, castingTableStore, fittingStore,
  billieRateCards, setBillieRateCards,
  pushNav, showAlert, buildPath,
  UploadZone,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // Resolve a version store by name
  const getVersionStore = (storeName) => {
    const stores = { projectEstimates, callSheetStore, riskAssessmentStore, contractDocStore, locDeckStore, recceReportStore, travelItineraryStore, cpsStore, shotListStore, storyboardStore, postProdStore, castingDeckStore, castingTableStore, fittingStore };
    const store = stores[storeName];
    if (!store) return [];
    return store[p.id] || [];
  };

  // File store helpers
  const getFileStoreFiles = (category) => (projectFileStore[p.id] || {})[category] || [];

  const addStoredFiles = async (category, fileList) => {
    const newEntries = [];
    for (const f of fileList) {
      if (f.size > 40 * 1024 * 1024) { showAlert(`"${f.name}" is over 40 MB.`); continue; }
      const data = await new Promise(r => { const fr = new FileReader(); fr.onload = e => r(e.target.result); fr.readAsDataURL(f); });
      newEntries.push({ id: Date.now() + Math.random(), name: f.name, size: f.size, type: f.type, data, createdAt: Date.now() });
    }
    if (newEntries.length === 0) return;
    setProjectFileStore(prev => ({ ...prev, [p.id]: { ...(prev[p.id] || {}), [category]: [...((prev[p.id] || {})[category] || []), ...newEntries] } }));
  };

  const deleteStoredFile = (category, fileId) => {
    setProjectFileStore(prev => ({ ...prev, [p.id]: { ...(prev[p.id] || {}), [category]: ((prev[p.id] || {})[category] || []).filter(f => f.id !== fileId) } }));
  };

  const downloadStoredFile = (file) => {
    const a = document.createElement("a"); a.href = file.data; a.download = file.name; a.click();
  };

  // Count items in a folder
  const getFolderCount = (folder) => {
    let total = 0;
    for (const child of folder.children) {
      if (child.type === "fileStore") total += getFileStoreFiles(child.key).length;
      else if (child.type === "versionStore") total += getVersionStore(child.store).length;
      else if (child.type === "rateCard") total += (billieRateCards && typeof billieRateCards === "object" && !Array.isArray(billieRateCards)) ? Object.values(billieRateCards).reduce((a, b) => a + (b?.length || 0), 0) : Array.isArray(billieRateCards) ? billieRateCards.length : 0;
    }
    return total;
  };

  // Parse navigation: "budget" → category, "budget/rate_card" → sub-folder
  const parts = filesSubSection ? filesSubSection.split("/") : [];
  const activeCategoryKey = parts[0] || null;
  const activeSubKey = parts[1] || null;
  const activeCategory = activeCategoryKey ? FOLDER_TREE.find(f => f.key === activeCategoryKey) : null;
  const activeChild = activeCategory && activeSubKey ? activeCategory.children.find(c => c.key === activeSubKey) : null;

  // ── Back button helper ──
  const BackBtn = ({ label, onClick }) => (
    <button onClick={onClick} style={{ background: "none", border: "none", color: T.link || T.accent, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>‹ {label}</button>
  );

  // ── File list for fileStore items ──
  const FileList = ({ category }) => {
    const files = getFileStoreFiles(category);
    const filtered = searchTerm.trim() ? files.filter(f => f.name.toLowerCase().includes(searchTerm.trim().toLowerCase())) : files;
    return (
      <div>
        <UploadZone label="Drop files here or click to upload" files={[]} onAdd={f => addStoredFiles(category, f)} />
        {files.length > 0 && (
          <>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search files..." style={{ width: "100%", padding: "9px 14px", borderRadius: 10, background: "#fafafa", border: `1px solid ${T.border}`, color: T.text, fontSize: 13, fontFamily: "inherit", marginTop: 16, marginBottom: 8, boxSizing: "border-box" }} />
            <div style={{ fontSize: 11, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, marginTop: 6, marginBottom: 6 }}>{filtered.length} file{filtered.length !== 1 ? "s" : ""}</div>
          </>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: files.length > 0 ? 8 : 14 }}>
          {filtered.map((f, i) => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{f.type?.includes("pdf") ? "📄" : f.type?.includes("image") ? "🖼" : "📎"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{(f.size / 1024).toFixed(0)} KB · {new Date(f.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
              </div>
              <button onClick={() => downloadStoredFile(f)} style={{ background: "#f5f5f7", border: `1px solid ${T.border}`, color: T.sub, padding: "6px 12px", borderRadius: 8, fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>Download</button>
              <button onClick={() => { if (confirm(`Delete "${f.name}"?`)) deleteStoredFile(category, f.id); }} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 15, padding: "0 4px", lineHeight: 1, flexShrink: 0 }} onMouseOver={e => e.currentTarget.style.color = "#c0392b"} onMouseOut={e => e.currentTarget.style.color = T.muted}>×</button>
            </div>
          ))}
          {files.length === 0 && <div style={{ padding: "30px 0", textAlign: "center", color: T.muted, fontSize: 12 }}>No files yet. Upload to get started.</div>}
        </div>
      </div>
    );
  };

  // ── Version list for doc stores (read-only) ──
  const VersionList = ({ storeName }) => {
    const versions = getVersionStore(storeName);
    if (versions.length === 0) return <div style={{ padding: "30px 0", textAlign: "center", color: T.muted, fontSize: 12 }}>No versions yet.</div>;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {versions.map((v, i) => (
          <div key={v.id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: T.accent, borderRadius: 6, padding: "3px 8px", flexShrink: 0 }}>V{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: T.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.label || v.name || v.title || `Version ${i + 1}`}</div>
              {v.createdAt && <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{new Date(v.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── Sub-folder detail view ──
  if (activeChild) {
    return (
      <div>
        <BackBtn label={`Back to ${activeCategory.label}`} onClick={() => { setFilesSubSection(activeCategoryKey); pushNav("Projects", p, "Files", activeCategoryKey); }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>{activeChild.label}</div>
        <p style={{ fontSize: 12.5, color: T.muted, marginBottom: 18 }}>
          {activeChild.type === "rateCard" ? "Your default rate card — shared across all projects." : activeChild.type === "versionStore" ? "Read-only version list. Edit from the main section." : "Upload and manage files."}
        </p>
        {activeChild.type === "rateCard" && <BillieRateCardInline billieRateCards={billieRateCards} setBillieRateCards={setBillieRateCards} compact />}
        {activeChild.type === "fileStore" && <FileList category={activeChild.key} />}
        {activeChild.type === "versionStore" && <VersionList storeName={activeChild.store} />}
      </div>
    );
  }

  // ── Category sub-folder view ──
  if (activeCategory) {
    return (
      <div>
        <BackBtn label="Back to Files" onClick={() => { setFilesSubSection(null); pushNav("Projects", p, "Files", null); }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>{activeCategory.emoji} {activeCategory.label}</div>
        <p style={{ fontSize: 12.5, color: T.muted, marginBottom: 18 }}>Sub-folders for {activeCategory.label.toLowerCase()}.</p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 12 }}>
          {activeCategory.children.map(child => {
            let count = "";
            if (child.type === "fileStore") { const n = getFileStoreFiles(child.key).length; count = `${n} file${n !== 1 ? "s" : ""}`; }
            else if (child.type === "versionStore") { const n = getVersionStore(child.store).length; count = `${n} version${n !== 1 ? "s" : ""}`; }
            else if (child.type === "rateCard") count = "Global rate card";
            return (
              <a key={child.key} href={buildPath("Projects", p.id, "Files", `${activeCategoryKey}/${child.key}`)} onClick={e => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); setFilesSubSection(`${activeCategoryKey}/${child.key}`); pushNav("Projects", p, "Files", `${activeCategoryKey}/${child.key}`); }} className="proj-card" style={{ borderRadius: 14, padding: "18px 20px", background: T.surface, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textDecoration: "none", color: "inherit" }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{child.type === "rateCard" ? "💰" : child.type === "versionStore" ? "📋" : "📂"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.text, marginBottom: 2 }}>{child.label}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{count}</div>
                </div>
                <span style={{ color: T.muted, fontSize: 14, flexShrink: 0 }}>›</span>
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Top-level category grid ──
  return (
    <div>
      <p style={{ fontSize: 13, color: T.sub, marginBottom: 18 }}>All project files organised by category.</p>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 12 }}>
        {FOLDER_TREE.map(folder => {
          const count = getFolderCount(folder);
          return (
            <a key={folder.key} href={buildPath("Projects", p.id, "Files", folder.key)} onClick={e => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); setFilesSubSection(folder.key); pushNav("Projects", p, "Files", folder.key); }} className="proj-card" style={{ borderRadius: 16, padding: "22px 22px", background: T.surface, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textDecoration: "none", color: "inherit" }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{folder.emoji}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 3 }}>{folder.label}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{count} item{count !== 1 ? "s" : ""} · {folder.children.length} folder{folder.children.length !== 1 ? "s" : ""}</div>
              </div>
              <span style={{ color: T.muted, fontSize: 16, flexShrink: 0 }}>›</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
