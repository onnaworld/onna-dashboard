import React, { useState } from "react";

export default function Projects({
  T, isMobile, api,
  // Shared state
  selectedProject, setSelectedProject,
  projectSection, setProjectSection,
  localProjects, setLocalProjects,
  allProjectsMerged,
  archivedProjects, setArchivedProjects,
  saveStatus,
  setShowFromTemplate,
  setEditingEstimate,
  // Sub-section resetters
  setCreativeSubSection, setBudgetSubSection, setDocumentsSubSection,
  setScheduleSubSection, setTravelSubSection, setPermitsSubSection,
  setStylingSubSection, setCastingSubSection,
  setActiveCastingDeckVersion, setActiveCastingTableVersion,
  setActiveCSVersion, setLocSubSection, setActiveRecceVersion,
  // Functions
  renderProjectSection, getProjRevenue, getProjCost,
  archiveItem, buildPath, pushNav, getSearch, setSearch,
  // Constants
  PROJECT_SECTIONS,
  // UI components
  SearchBar, Pill, StatCard,
}) {
  // ── Local state (Projects-tab-only) ──
  const [projectYear, setProjectYear] = useState(2026);
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);

  // ── Computed values ──
  const projStatusColor = { Active: "#147d50", "In Review": "#92680a", Completed: T.muted };
  const projStatusBg = { Active: "#edfaf3", "In Review": "#fff8e8", Completed: "#f5f5f7" };
  const projects = allProjectsMerged.filter(p => p.year === projectYear || p.client === "TEMPLATE");
  const projRev = projects.reduce((a, b) => a + getProjRevenue(b), 0);
  const projProfit = projects.reduce((a, b) => a + (getProjRevenue(b) - getProjCost(b)), 0);
  const projMargin = projRev > 0 ? Math.round((projProfit / projRev) * 100) : 0;

  if (selectedProject) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
        <button onClick={() => window.history.back()} style={{ background: "none", border: "none", color: T.sub, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>{"\u2039"} Projects</button>
        {projectSection !== "Home" && <><span style={{ color: T.muted }}>{"\u203a"}</span><button onClick={() => window.history.back()} style={{ background: "none", border: "none", color: T.sub, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>{selectedProject.name}</button></>}
        {saveStatus && <span style={{ marginLeft: "auto", fontSize: 11, color: saveStatus === "saving" ? T.muted : "#34c759", fontWeight: 500, opacity: 0.85, transition: "opacity 0.3s", display: "flex", alignItems: "center", gap: 4 }}>{saveStatus === "saving" ? "Saving\u2026" : "Saved \u2713"}</span>}
      </div>
      {projectSection !== "Home" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <select value={projectSection} onChange={e => { setProjectSection(e.target.value); setEditingEstimate(null); setCreativeSubSection(null); setBudgetSubSection(null); setDocumentsSubSection(null); setScheduleSubSection(null); setTravelSubSection(null); setPermitsSubSection(null); setStylingSubSection(null); setCastingSubSection(null); setActiveCastingDeckVersion(null); setActiveCastingTableVersion(null); setActiveCSVersion(null); setLocSubSection(null); setActiveRecceVersion(null); pushNav("Projects", selectedProject, e.target.value, null); }} style={{ padding: "8px 30px 8px 13px", borderRadius: 10, background: "#fff", border: "1px solid #d2d2d7", color: "#1d1d1f", fontSize: 13, fontFamily: "inherit", cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23aeaeb2' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 11px center", fontWeight: 500, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", minWidth: 200 }}>
            {PROJECT_SECTIONS.filter(s => s !== "Home").map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
      )}
      {renderProjectSection(localProjects.find(lp => lp.id === selectedProject.id) || selectedProject)}
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <SearchBar value={getSearch("Projects")} onChange={v => setSearch("Projects", v)} placeholder="Search projects\u2026" />
        <div style={{ display: "flex", gap: 6 }}>{(() => { const cy = new Date().getFullYear(); const yrs = new Set([2024, 2025, 2026, cy, cy + 1]); allProjectsMerged.forEach(p => { if (p.year) yrs.add(p.year); }); return [...yrs].sort(); })().map(y => <Pill key={y} label={String(y)} active={projectYear === y} onClick={() => setProjectYear(y)} />)}</div>
        <span style={{ marginLeft: "auto", fontSize: 12, color: T.muted }}>{projects.length} projects</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Revenue" value={`AED ${(projRev / 1000).toFixed(0)}k`} />
        <StatCard label="Total Profit" value={`AED ${(projProfit / 1000).toFixed(0)}k`} />
        <StatCard label="Avg Margin" value={`${projMargin}%`} />
      </div>
      {/* Archive drop zone */}
      <div
        id="archive-drop-zone"
        onDragOver={e => { e.preventDefault(); document.getElementById("archive-drop-zone").style.borderColor = "#1d1d1f"; document.getElementById("archive-drop-zone").style.background = "#f0f0f2"; }}
        onDragLeave={e => { document.getElementById("archive-drop-zone").style.borderColor = "#d2d2d7"; document.getElementById("archive-drop-zone").style.background = "transparent"; }}
        onDrop={e => {
          e.preventDefault();
          const id = Number(e.dataTransfer.getData("projectId"));
          const proj = projects.find(p => p.id === id);
          if (proj?.client === "TEMPLATE") return;
          if (proj) { setArchivedProjects(prev => [...prev, proj]); }
          document.getElementById("archive-drop-zone").style.borderColor = "#d2d2d7";
          document.getElementById("archive-drop-zone").style.background = "transparent";
        }}
        style={{ border: "2px dashed #d2d2d7", borderRadius: 14, padding: "18px 24px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s", background: "transparent", cursor: "default" }}
      >
        <span style={{ fontSize: 18, opacity: 0.4 }}>{"\ud83d\udce6"}</span>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: T.sub }}>Archived Projects</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>Drag a project here to archive it</div>
        </div>
        {archivedProjects.length > 0 && <button onClick={() => setShowArchivedProjects(v => !v)} style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: `1px solid ${T.border}`, background: showArchivedProjects ? "#1d1d1f" : "transparent", color: showArchivedProjects ? "#fff" : T.sub, fontFamily: "inherit", transition: "all 0.12s" }}>{showArchivedProjects ? "Hide" : "Show"} ({archivedProjects.length})</button>}
      </div>

      {showArchivedProjects && archivedProjects.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>Archived Projects</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
            {archivedProjects.filter(p => !getSearch("Projects") || `${p.client} ${p.name}`.toLowerCase().includes(getSearch("Projects").toLowerCase())).map(p => {
              const _rev = getProjRevenue(p); const _cost = getProjCost(p); const profit = _rev - _cost; const margin = _rev > 0 ? Math.round((profit / _rev) * 100) : 0;
              return (
                <div key={p.id} className="proj-card" style={{ borderRadius: 16, padding: 20, background: T.surface, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <a href={buildPath("Projects", p.id, null, null)} onClick={(e) => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); setSelectedProject(p); setProjectSection("Home"); pushNav("Projects", p, "Home", null); }} style={{ display: "flex", flexDirection: "column", gap: 14, cursor: "pointer", textDecoration: "none", color: "inherit" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 10, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3, fontWeight: 500 }}>{p.client}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, letterSpacing: "-0.01em" }}>{p.name}</div>
                      </div>
                      <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 999, background: projStatusBg[p.status] || "#f5f5f7", color: projStatusColor[p.status] || T.muted, fontWeight: 500, whiteSpace: "nowrap" }}>{p.status}</span>
                    </div>
                  </a>
                  <div style={{ display: "flex", gap: 8, marginTop: -3 }}>
                    <button
                      onClick={e => { e.stopPropagation(); setArchivedProjects(prev => prev.filter(a => a.id !== p.id)); }}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px", borderRadius: 9, background: "transparent", border: `1px solid ${T.borderSub}`, color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, transition: "all 0.12s" }}
                      onMouseOver={e => { e.currentTarget.style.background = "#f5f5f7"; e.currentTarget.style.color = T.sub; }}
                      onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.muted; }}
                    >
                      <span style={{ fontSize: 13 }}>{"\u21a9"}</span> Unarchive
                    </button>
                    <button
                      onClick={async e => { e.stopPropagation(); if (!confirm(`Delete "${p.name}"? This will be moved to Deleted.`)) return; archiveItem('projects', p); setArchivedProjects(prev => prev.filter(a => a.id !== p.id)); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "7px 11px", borderRadius: 9, background: "transparent", border: `1px solid ${T.borderSub}`, color: T.muted, fontSize: 13, cursor: "pointer", transition: "all 0.12s" }}
                      onMouseOver={e => { e.currentTarget.style.background = "#fff0f0"; e.currentTarget.style.borderColor = "#fdc5c5"; e.currentTarget.style.color = "#c0392b"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = T.borderSub; e.currentTarget.style.color = T.muted; }}
                      title="Delete project"
                    >{"\u00d7"}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
        {projects.filter(p => !getSearch("Projects") || `${p.client} ${p.name}`.toLowerCase().includes(getSearch("Projects").toLowerCase())).map(p => {
          const _rev = getProjRevenue(p); const _cost = getProjCost(p); const profit = _rev - _cost; const margin = _rev > 0 ? Math.round((profit / _rev) * 100) : 0;
          return (
            <div
              key={p.id}
              draggable={p.client !== "TEMPLATE"}
              onDragStart={p.client !== "TEMPLATE" ? e => { e.dataTransfer.setData("projectId", String(p.id)); e.currentTarget.style.opacity = "0.5"; } : undefined}
              onDragEnd={p.client !== "TEMPLATE" ? e => { e.currentTarget.style.opacity = "1"; } : undefined}
              className="proj-card"
              style={{ borderRadius: 16, padding: 20, background: T.surface, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: "grab" }}
            >
              <a href={buildPath("Projects", p.id, null, null)} onClick={(e) => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); setSelectedProject(p); setProjectSection("Home"); pushNav("Projects", p, "Home", null); }} style={{ display: "flex", flexDirection: "column", gap: 14, cursor: "pointer", textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3, fontWeight: 500 }}>{p.client}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text, letterSpacing: "-0.01em" }}>{p.name}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 999, background: projStatusBg[p.status] || "#f5f5f7", color: projStatusColor[p.status] || T.muted, fontWeight: 500, whiteSpace: "nowrap" }}>{p.status}</span>
                </div>
              </a>
              <div style={{ display: "flex", gap: 8, marginTop: -3 }}>
                {p.client === "TEMPLATE" ? (
                  <button
                    onClick={e => { e.stopPropagation(); setShowFromTemplate(true); }}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px", borderRadius: 9, background: T.accent, border: "none", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, transition: "all 0.12s" }}
                    onMouseOver={e => { e.currentTarget.style.opacity = "0.85"; }}
                    onMouseOut={e => { e.currentTarget.style.opacity = "1"; }}
                  >
                    + New Project
                  </button>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); setArchivedProjects(prev => [...prev, p]); }}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px", borderRadius: 9, background: "transparent", border: `1px solid ${T.borderSub}`, color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, transition: "all 0.12s" }}
                    onMouseOver={e => { e.currentTarget.style.background = "#f5f5f7"; e.currentTarget.style.color = T.sub; }}
                    onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.muted; }}
                  >
                    <span style={{ fontSize: 13 }}>{"\ud83d\udce6"}</span> Archive
                  </button>
                )}
                {p.client !== "TEMPLATE" && <button
                  onClick={async e => { e.stopPropagation(); if (!confirm(`Delete "${p.name}"? This will be moved to Deleted.`)) return; archiveItem('projects', p); await api.delete(`/api/projects/${p.id}`); setLocalProjects(prev => prev.filter(x => x.id !== p.id)); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "7px 11px", borderRadius: 9, background: "transparent", border: `1px solid ${T.borderSub}`, color: T.muted, fontSize: 13, cursor: "pointer", transition: "all 0.12s" }}
                  onMouseOver={e => { e.currentTarget.style.background = "#fff0f0"; e.currentTarget.style.borderColor = "#fdc5c5"; e.currentTarget.style.color = "#c0392b"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = T.borderSub; e.currentTarget.style.color = T.muted; }}
                  title="Delete project"
                >{"\u00d7"}</button>}
              </div>
            </div>
          );
        })}
        {projects.length === 0 && <div style={{ gridColumn: "span 3", padding: 52, textAlign: "center", color: T.muted, fontSize: 13, borderRadius: 16, background: T.surface, border: `1px solid ${T.border}` }}>No projects for {projectYear}.</div>}
      </div>
    </div>
  );
}
