import React from "react";
import { estCalcTotals, defaultSections, actualsGrandExpenseTotal, actualsGrandEffective, actualsGrandZohoTotal } from "../utils/helpers";
import Creative from "./project/Creative";
import Budget from "./project/Budget";
import Documents from "./project/Documents";
import Locations from "./project/Locations";
import Casting from "./project/Casting";
import Styling from "./project/Styling";
import Travel from "./project/Travel";
import Schedule from "./project/Schedule";
import { uploadFromLink as _uploadFromLink } from "../handlers/documentHandlers";

export default function ProjectSection({
  p, T, isMobile, api,
  // project data
  projectEntries, projectFileStore, setProjectFileStore, projectEstimates,
  projectInfo, setProjectInfo, projectInfoRef, syncProjectInfoToDocs,
  projectTodos, setProjectTodos, archivedTodos, setArchivedTodos,
  dashNotesList, setDashNotesList, dashSelectedNoteId, setDashSelectedNoteId,
  projectSection, setProjectSection,
  projectCreativeLinks, setProjectCreativeLinks,
  projectLocLinks, setProjectLocLinks,
  projectActuals, setProjectActuals,
  // project setters
  setLocalProjects, setSelectedProject,
  // sub-sections
  creativeSubSection, setCreativeSubSection,
  budgetSubSection, setBudgetSubSection,
  documentsSubSection, setDocumentsSubSection,
  locSubSection, setLocSubSection,
  castingSubSection, setCastingSubSection,
  stylingSubSection, setStylingSubSection,
  travelSubSection, setTravelSubSection,
  scheduleSubSection, setScheduleSubSection,
  permitsSubSection, setPermitsSubSection,
  // version states
  activeCSVersion, setActiveCSVersion,
  activeRAVersion, setActiveRAVersion,
  activeContractVersion, setActiveContractVersion,
  activeDietaryVersion, setActiveDietaryVersion,
  activeCastingDeckVersion, setActiveCastingDeckVersion,
  activeCastingTableVersion, setActiveCastingTableVersion,
  activeLocDeckVersion, setActiveLocDeckVersion,
  activeRecceVersion, setActiveRecceVersion,
  activeFittingVersion, setActiveFittingVersion,
  activeTIVersion, setActiveTIVersion,
  activeCPSVersion, setActiveCPSVersion,
  activeShotListVersion, setActiveShotListVersion,
  activeStoryboardVersion, setActiveStoryboardVersion,
  activePostProdVersion, setActivePostProdVersion,
  // stores
  callSheetStore, setCallSheetStore,
  riskAssessmentStore, setRiskAssessmentStore,
  contractDocStore, setContractDocStore,
  dietaryStore, setDietaryStore,
  locDeckStore, setLocDeckStore,
  recceReportStore, setRecceReportStore,
  castingDeckStore, setCastingDeckStore,
  castingTableStore, setCastingTableStore,
  fittingStore, setFittingStore,
  travelItineraryStore, setTravelItineraryStore,
  cpsStore, setCpsStore,
  shotListStore, setShotListStore,
  storyboardStore, setStoryboardStore,
  postProdStore, setPostProdStore,
  // estimate/budget
  editingEstimate, setEditingEstimate,
  actualsTrackerTab, setActualsTrackerTab, actualsExpandedRef,
  invoiceTab, setInvoiceTab,
  invoiceSearchTerm, setInvoiceSearchTerm,
  quoteSearchTerm, setQuoteSearchTerm,
  previewFile, setPreviewFile,
  // search terms
  creativeSearchTerm, setCreativeSearchTerm,
  castFileSearchTerm, setCastFileSearchTerm,
  styleSearchTerm, setStyleSearchTerm,
  // link upload
  linkUploading, setLinkUploading, linkUploadProgress, setLinkUploadProgress,
  // share/export states
  ctSignShareUrl, setCtSignShareUrl, ctSignShareLoading, setCtSignShareLoading,
  ctTypeModalOpen, setCtTypeModalOpen,
  dietaryTab, setDietaryTab,
  csCreateMenuDocs, setCsCreateMenuDocs,
  setCsDuplicateModal, setCsDuplicateSearch,
  setRaDuplicateModal, setRaDuplicateSearch,
  createMenuOpen, setCreateMenuOpen, setDuplicateModal, setDuplicateSearch,
  locShareUrl, setLocShareUrl, locShareLoading, setLocShareLoading,
  locShareTabs, setLocShareTabs, locDeckRef,
  recceShareUrl, setRecceShareUrl, recceShareLoading, setRecceShareLoading,
  castDeckShareUrl, setCastDeckShareUrl, castDeckShareLoading, setCastDeckShareLoading,
  castDeckShareTabs, setCastDeckShareTabs, castDeckRef,
  ctShareUrl, setCtShareUrl, ctShareLoading, setCtShareLoading, ctRef,
  fitShareTabs, setFitShareTabs, fitShareLoading, setFitShareLoading, fitDeckRef,
  tiShowAddMenu, setTiShowAddMenu,
  cpsShareUrl, setCpsShareUrl, cpsShareLoading, setCpsShareLoading,
  cpsShareTabs, setCpsShareTabs, cpsRef, cpsAutoSyncing,
  slShareUrl, setSlShareUrl, slShareLoading, setSlShareLoading, slRef,
  sbShareUrl, setSbShareUrl, sbShareLoading, setSbShareLoading, sbRef,
  ppShareUrl, setPpShareUrl, ppShareLoading, setPpShareLoading, ppRef,
  // handlers
  archiveItem, pushUndo, pushNav, showAlert, showPrompt, buildPath,
  getProjectFiles, addProjectFiles, getProjectCastingTables,
  setProjectEstimates,
  // ui components & constants
  PROJECT_SECTIONS, ProjectTodoList,
  EstCell, EstimateView, BtnPrimary, BtnExport, UploadZone,
  CSLogoSlot, CSAddBtn, CSEditField, CSEditTextarea, CSResizableImage, CSXbtn,
  DietaryTagSelect, SignaturePad, TICell, TITableSection,
  CS_FONT, CS_LS, PRINT_CLEANUP_CSS,
  CALLSHEET_INIT, DIETARY_INIT,
  LocationsConnie, mkLoc, mkDetail,
  RECCE_REPORT_INIT, mkRecceLocation, RECCE_RATINGS, RECCE_RATING_C,
  RecceInp, RecceField, RecceImgSlot,
  CastingConnie, CastingTableConnie, CAST_INIT, ctMkRole,
  FittingConnie, mkFitTalent, mkFitFitting,
  TRAVEL_ITINERARY_INIT, tiMkDay, tiMkMove,
  TI_FLIGHT_COLS, TI_CAR_COLS, TI_HOTEL_COLS, TI_ROOMING_COLS, TI_MOVEMENT_COLS,
  CPSPolly, ShotListPolly, StoryboardPolly, PostPolly,
  cpsDefaultPhases, mkFrame, ppMkVideo, ppMkStill, ppDefaultSchedule,
}) {
  const entries    = projectEntries[p.id]||[];
  const quotes     = (projectFileStore[p.id]||{}).quotations||[];
  const allEntries = [...entries,...quotes.map((f,i)=>({id:`q_${i}`,supplier:f.name,category:"Quote",subCategory:"",invoiceNumber:"",receiptLink:"",datePaid:"",amount:"",direction:"out",notes:"Uploaded quote"}))];
  // Revenue from latest estimate grand total
  const estVersions = projectEstimates[p.id] || [];
  const latestEst = estVersions.length > 0 ? estVersions[estVersions.length - 1] : null;
  const estRevenue = latestEst ? estCalcTotals(latestEst.sections || defaultSections()).grandTotal : 0;
  // Expenses from actuals (Zoho finals if available, otherwise expense totals)
  const actData = projectActuals[p.id];
  const actZoho = actData ? actualsGrandZohoTotal(actData) : 0;
  const actExpenses = actData ? actualsGrandExpenseTotal(actData) : 0;
  const actEffective = actData ? actualsGrandEffective(actData) : 0;
  const totalIn    = estRevenue;
  const totalOut   = actEffective;
  const profit     = totalIn - totalOut;
  const margin     = totalIn > 0 ? Math.round((profit / totalIn) * 100) : 0;

  const SECTION_META = {
    "Creative":       {emoji:"🎨",count:`${((projectFileStore[p.id]||{}).moodboards||[]).length+((projectFileStore[p.id]||{}).briefs||[]).length} files`},
    "Budget":         {emoji:"📊",count:`${(projectEstimates[p.id]||[]).length} estimate(s), ${quotes.length} quote(s)`},
    "Documents":      {emoji:"📁",count:"Call sheets, contracts & more"},
    "Locations":      {emoji:"📍",count:"Add folder link"},
    "Casting":        {emoji:"🎭",count:`${getProjectCastingTables(p.id).reduce((a,t)=>a+t.rows.length,0)} models`},
    "Styling":        {emoji:"👗",count:`${getProjectFiles(p.id,"styling").length} files`},
    "Travel":         {emoji:"✈️",count:"Flights, hotels & logistics"},
    "Schedule":       {emoji:"📒",count:"CPS, Shotlist, Storyboard & Post-Production"},
  };

  const MiniStat = ({label,value}) => (
    <div style={{borderRadius:14,padding:"18px 20px",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
      <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6,fontWeight:500}}>{label}</div>
      <div style={{fontSize:22,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>{value}</div>
    </div>
  );

  const uploadFromLink = (url, category) => _uploadFromLink(url, category, p.id, setLinkUploading, setLinkUploadProgress, setProjectFileStore, showAlert);

  if (projectSection==="Home") return (
    <div>
      {/* Editable project header */}
      <div style={{marginBottom:20,display:"flex",alignItems:"flex-start",gap:14}}>
        <div style={{flex:1}}>
          <input value={p.client||""} onChange={e=>{const v=e.target.value;setLocalProjects(prev=>prev.map(pr=>pr.id===p.id?{...pr,client:v}:pr));setSelectedProject(prev=>prev&&prev.id===p.id?{...prev,client:v}:prev);api.put(`/api/projects/${p.id}`,{client:v}).catch(()=>{});setDashNotesList(prev=>prev.map(n=>n.projectId===p.id?{...n,title:`${v} | ${p.name}`,updatedAt:Date.now()}:n));}} placeholder="Client name" style={{width:"100%",fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500,background:"transparent",border:"none",borderBottom:"1px solid transparent",padding:"2px 0",fontFamily:"inherit",outline:"none",cursor:"text"}} onFocus={e=>{e.target.style.borderBottomColor=T.accent}} onBlur={e=>{e.target.style.borderBottomColor="transparent"}}/>
          <input value={p.name||""} onChange={e=>{const v=e.target.value;setLocalProjects(prev=>prev.map(pr=>pr.id===p.id?{...pr,name:v}:pr));setSelectedProject(prev=>prev&&prev.id===p.id?{...prev,name:v}:prev);api.put(`/api/projects/${p.id}`,{name:v}).catch(()=>{});setDashNotesList(prev=>prev.map(n=>n.projectId===p.id?{...n,title:`${p.client} | ${v}`,updatedAt:Date.now()}:n));}} placeholder="Project name" style={{width:"100%",fontSize:22,fontWeight:700,color:T.text,letterSpacing:"-0.02em",background:"transparent",border:"none",borderBottom:"1px solid transparent",padding:"2px 0",fontFamily:"inherit",outline:"none",cursor:"text"}} onFocus={e=>{e.target.style.borderBottomColor=T.accent}} onBlur={e=>{e.target.style.borderBottomColor="transparent"}}/>
        </div>
        <select value={p.status||"Active"} onChange={e=>{const v=e.target.value;setLocalProjects(prev=>prev.map(pr=>pr.id===p.id?{...pr,status:v}:pr));api.put(`/api/projects/${p.id}`,{status:v}).catch(()=>{});}} style={{padding:"5px 24px 5px 10px",borderRadius:8,fontSize:11,fontWeight:500,border:`1px solid ${T.border}`,fontFamily:"inherit",cursor:"pointer",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' fill='none'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23aeaeb2' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center",background:p.status==="Active"?"#e8f5e9":p.status==="Completed"?"#e3f2fd":"#fff8e1",color:p.status==="Active"?"#2e7d32":p.status==="Completed"?"#1565c0":"#f57f17",flexShrink:0,marginTop:6}}>
          <option value="Active">Active</option>
          <option value="In Review">In Review</option>
          <option value="Completed">Completed</option>
        </select>
      </div>
      {/* Project Info */}
      <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:isMobile?16:28,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
        <div style={{padding:"10px 18px",borderBottom:`1px solid ${T.borderSub}`,background:"#fafafa"}}>
          <span style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600}}>Project Info</span>
        </div>
        {[["Shoot Name","shootName","e.g. Brand Campaign 2026"],["Shoot Date","shootDate","e.g. 15–17 March 2026"],["Shoot Location","shootLocation","e.g. Dubai Marina, Studio A"],["Usage","usage","e.g. Global digital & print, 12 months"],["Crew on Set","crewOnSet","e.g. 24 crew members"]].map(([label,key,ph])=>(
          <div key={key} style={{display:"flex",alignItems:"center",borderBottom:`1px solid ${T.borderSub}`,padding:"0 18px",minHeight:38}}>
            <span style={{fontSize:11,color:T.muted,fontWeight:500,width:120,flexShrink:0}}>{label}</span>
            <input value={(projectInfo[p.id]||{})[key]||""} onChange={e=>{const v=e.target.value;setProjectInfo(prev=>{const next={...prev,[p.id]:{...(prev[p.id]||{}),[key]:v}};projectInfoRef.current=next;return next;});}} onBlur={()=>{const info=(projectInfoRef.current||{})[p.id];if(info)syncProjectInfoToDocs(p.id,info);}} placeholder={ph} style={{flex:1,fontSize:13,color:T.text,background:"transparent",border:"none",padding:"8px 0",fontFamily:"inherit",outline:"none"}}/>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:14,marginBottom:isMobile?16:28}}>
        {[["Total Revenue",`AED ${totalIn.toLocaleString()}`,"income"],["Total Expenses",`AED ${totalOut.toLocaleString()}`,"outgoings"],["Net Profit",`AED ${profit.toLocaleString()}`,"revenue − expenses"],["Margin",`${margin}%`,"net / revenue"]].map(([l,v,s])=>(
          <div key={l} style={{borderRadius:16,padding:"20px 22px",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8,fontWeight:500}}>{l}</div>
            <div style={{fontSize:24,fontWeight:700,color:T.text,letterSpacing:"-0.02em",marginBottom:3}}>{v}</div>
            <div style={{fontSize:11,color:T.muted}}>{s}</div>
          </div>
        ))}
      </div>
      {/* Project To-Do List */}
      <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:24,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
        <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",gap:8,background:"#fafafa"}}>
          <span style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,flex:1}}>Project To-Do</span>
          <span style={{fontSize:11,color:T.muted}}>{(projectTodos[p.id]||[]).filter(t=>!archivedTodos.find(a=>a.id===t.id)&&!t.done).length} open</span>
        </div>
        <ProjectTodoList projectId={p.id} projectTodos={projectTodos} setProjectTodos={setProjectTodos} archivedTodos={archivedTodos} setArchivedTodos={setArchivedTodos}/>
      </div>
      {/* Project Notes */}
      {(()=>{
        const projNotes=dashNotesList.filter(n=>n.projectId===p.id).sort((a,b)=>b.updatedAt-a.updatedAt);
        return (
          <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:24,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",maxHeight:400}}>
            <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",gap:8,background:"#fafafa",flexShrink:0}}>
              <span style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,flex:1}}>Notes</span>
              <button onClick={()=>{const n={id:Date.now(),title:`${p.client||"Client"} | ${p.name||"Project"}`,content:"",updatedAt:Date.now(),projectId:p.id};setDashNotesList(prev=>[n,...prev]);}} style={{padding:"3px 10px",borderRadius:7,background:T.accent,border:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New</button>
            </div>
            <div style={{flex:1,overflowY:"auto"}}>
            {projNotes.length===0&&<div style={{padding:"20px 18px",textAlign:"center",fontSize:12,color:T.muted}}>No notes yet. Click + New to add one.</div>}
            {projNotes.map(note=>(
              <div key={note.id} style={{borderBottom:`1px solid ${T.borderSub}`}}>
                <div style={{display:"flex",alignItems:"center",padding:"10px 18px",gap:8,cursor:"pointer"}} onClick={()=>setDashSelectedNoteId(prev=>prev===note.id?null:note.id)}>
                  <span style={{fontSize:11,color:T.muted,flexShrink:0}}>{dashSelectedNoteId===note.id?"▾":"▸"}</span>
                  <span style={{fontSize:13,fontWeight:500,color:T.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{note.title||"Untitled"}</span>
                  <span style={{fontSize:10,color:T.muted,flexShrink:0}}>{note.updatedAt?new Date(note.updatedAt).toLocaleDateString([],{month:"short",day:"numeric"}):""}</span>
                  <button onClick={e=>{e.stopPropagation();if(window.confirm("Delete this note?"))setDashNotesList(prev=>prev.filter(n=>n.id!==note.id));}} style={{width:20,height:20,borderRadius:5,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,flexShrink:0}} title="Delete note">×</button>
                </div>
                {dashSelectedNoteId===note.id&&(
                  <div style={{padding:"0 18px 14px"}}>
                    <textarea value={note.content||""} onChange={e=>{const val=e.target.value;setDashNotesList(prev=>prev.map(n=>n.id===note.id?{...n,content:val,updatedAt:Date.now()}:n));}} placeholder="Write something..." style={{minHeight:60,width:"100%",fontSize:13,color:T.text,lineHeight:1.6,outline:"none",padding:"4px 0",fontFamily:"inherit",border:"none",background:"transparent",resize:"vertical",boxSizing:"border-box"}}/>
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
        );
      })()}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:10}}>
        {PROJECT_SECTIONS.filter(s=>s!=="Home").map(sec=>{
          const meta=SECTION_META[sec]||{emoji:"📁",count:"Click to open"};
          return (
            <a key={sec} href={buildPath("Projects",p.id,sec,null)} onClick={(e)=>{if(e.metaKey||e.ctrlKey)return;e.preventDefault();setProjectSection(sec);setCreativeSubSection(null);setBudgetSubSection(null);setDocumentsSubSection(null);setScheduleSubSection(null);setTravelSubSection(null);setPermitsSubSection(null);setStylingSubSection(null);setCastingSubSection(null);setActiveCastingDeckVersion(null);setActiveCastingTableVersion(null);setActiveCSVersion(null);setLocSubSection(null);setActiveRecceVersion(null);pushNav("Projects",p,sec,null);}} className="proj-card" style={{borderRadius:16,padding:"16px 18px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",textDecoration:"none",color:"inherit"}}>
              <span style={{fontSize:20,flexShrink:0}}>{meta.emoji}</span>
              <div style={{minWidth:0}}>
                <div style={{fontSize:13.5,fontWeight:500,color:T.text,marginBottom:2}}>{sec}</div>
                <div style={{fontSize:11,color:T.muted}}>{meta.count}</div>
              </div>
              <span style={{marginLeft:"auto",color:T.muted,fontSize:14,flexShrink:0}}>›</span>
            </a>
          ); })}
      </div>
      {/* Delete project */}
      <div style={{marginTop:40,paddingTop:20,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"flex-end"}}>
        <button onClick={async()=>{if(!confirm(`Delete "${p.name}"? This will be moved to Deleted.`))return;archiveItem('projects',p);await api.delete(`/api/projects/${p.id}`);setLocalProjects(prev=>prev.filter(x=>x.id!==p.id));setSelectedProject(null);setProjectSection("Home");}} style={{padding:"10px 22px",borderRadius:10,background:"#fff",border:"1px solid #e0e0e0",color:"#c0392b",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#c0392b";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#c0392b";}} onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.color="#c0392b";e.currentTarget.style.borderColor="#e0e0e0";}}>Delete Project</button>
      </div>
    </div>
  );

  // Creative section
  if (projectSection==="Creative") {
    return <Creative T={T} isMobile={isMobile} p={p}
      creativeSubSection={creativeSubSection} setCreativeSubSection={setCreativeSubSection}
      projectFileStore={projectFileStore} setProjectFileStore={setProjectFileStore}
      projectCreativeLinks={projectCreativeLinks} setProjectCreativeLinks={setProjectCreativeLinks}
      creativeSearchTerm={creativeSearchTerm} setCreativeSearchTerm={setCreativeSearchTerm}
      linkUploading={linkUploading} linkUploadProgress={linkUploadProgress} uploadFromLink={uploadFromLink}
      pushNav={pushNav} showAlert={showAlert} buildPath={buildPath}
      UploadZone={UploadZone}
    />;
  }

  // Budget section
  if (projectSection==="Budget") {
    return <Budget T={T} isMobile={isMobile} p={p}
      budgetSubSection={budgetSubSection} setBudgetSubSection={setBudgetSubSection}
      projectEstimates={projectEstimates} setProjectEstimates={setProjectEstimates} editingEstimate={editingEstimate} setEditingEstimate={setEditingEstimate}
      projectActuals={projectActuals} setProjectActuals={setProjectActuals} actualsTrackerTab={actualsTrackerTab} setActualsTrackerTab={setActualsTrackerTab}

      quotes={quotes} invoiceTab={invoiceTab} setInvoiceTab={setInvoiceTab}
      invoiceSearchTerm={invoiceSearchTerm} setInvoiceSearchTerm={setInvoiceSearchTerm} quoteSearchTerm={quoteSearchTerm} setQuoteSearchTerm={setQuoteSearchTerm}
      previewFile={previewFile} setPreviewFile={setPreviewFile}
      projectFileStore={projectFileStore} setProjectFileStore={setProjectFileStore} projectCreativeLinks={projectCreativeLinks} setProjectCreativeLinks={setProjectCreativeLinks}
      linkUploading={linkUploading} linkUploadProgress={linkUploadProgress} uploadFromLink={uploadFromLink}
      createMenuOpen={createMenuOpen} setCreateMenuOpen={setCreateMenuOpen} setDuplicateModal={setDuplicateModal} setDuplicateSearch={setDuplicateSearch}
      pushUndo={pushUndo} archiveItem={archiveItem} pushNav={pushNav} showAlert={showAlert} showPrompt={showPrompt} buildPath={buildPath}
      projectInfoRef={projectInfoRef} actualsExpandedRef={actualsExpandedRef}
      EstCell={EstCell} EstimateView={EstimateView} BtnPrimary={BtnPrimary} PRINT_CLEANUP_CSS={PRINT_CLEANUP_CSS}
    />;
  }

  // Documents section
  if (projectSection==="Documents") {
    return <Documents T={T} isMobile={isMobile} p={p}
      documentsSubSection={documentsSubSection} setDocumentsSubSection={setDocumentsSubSection}
      callSheetStore={callSheetStore} setCallSheetStore={setCallSheetStore} activeCSVersion={activeCSVersion} setActiveCSVersion={setActiveCSVersion}
      riskAssessmentStore={riskAssessmentStore} setRiskAssessmentStore={setRiskAssessmentStore} activeRAVersion={activeRAVersion} setActiveRAVersion={setActiveRAVersion}
      contractDocStore={contractDocStore} setContractDocStore={setContractDocStore} activeContractVersion={activeContractVersion} setActiveContractVersion={setActiveContractVersion}
      dietaryStore={dietaryStore} setDietaryStore={setDietaryStore} activeDietaryVersion={activeDietaryVersion} setActiveDietaryVersion={setActiveDietaryVersion}
      dietaryTab={dietaryTab} setDietaryTab={setDietaryTab}
      ctSignShareUrl={ctSignShareUrl} setCtSignShareUrl={setCtSignShareUrl} ctSignShareLoading={ctSignShareLoading} setCtSignShareLoading={setCtSignShareLoading}
      ctTypeModalOpen={ctTypeModalOpen} setCtTypeModalOpen={setCtTypeModalOpen}
      permitsSubSection={permitsSubSection} setPermitsSubSection={setPermitsSubSection}
      csCreateMenuDocs={csCreateMenuDocs} setCsCreateMenuDocs={setCsCreateMenuDocs} setCsDuplicateModal={setCsDuplicateModal} setCsDuplicateSearch={setCsDuplicateSearch}
      setRaDuplicateModal={setRaDuplicateModal} setRaDuplicateSearch={setRaDuplicateSearch}
      createMenuOpen={createMenuOpen} setCreateMenuOpen={setCreateMenuOpen} setDuplicateModal={setDuplicateModal} setDuplicateSearch={setDuplicateSearch}
      pushUndo={pushUndo} archiveItem={archiveItem} pushNav={pushNav} showAlert={showAlert}
      getProjectFiles={getProjectFiles} addProjectFiles={addProjectFiles} buildPath={buildPath}
      projectInfoRef={projectInfoRef} CALLSHEET_INIT={CALLSHEET_INIT} DIETARY_INIT={DIETARY_INIT}
      CSLogoSlot={CSLogoSlot} CSAddBtn={CSAddBtn} CSEditField={CSEditField} CSEditTextarea={CSEditTextarea} CSResizableImage={CSResizableImage} CSXbtn={CSXbtn}
      BtnExport={BtnExport} UploadZone={UploadZone} DietaryTagSelect={DietaryTagSelect} SignaturePad={SignaturePad} TICell={TICell}
      CS_FONT={CS_FONT} CS_LS={CS_LS} PRINT_CLEANUP_CSS={PRINT_CLEANUP_CSS}
    />;
  }

  // Locations section
  if (projectSection==="Locations") {
    return <Locations T={T} isMobile={isMobile} p={p}
      locSubSection={locSubSection} setLocSubSection={setLocSubSection}
      locDeckStore={locDeckStore} setLocDeckStore={setLocDeckStore} activeLocDeckVersion={activeLocDeckVersion} setActiveLocDeckVersion={setActiveLocDeckVersion}
      locShareUrl={locShareUrl} setLocShareUrl={setLocShareUrl} locShareLoading={locShareLoading} setLocShareLoading={setLocShareLoading}
      locShareTabs={locShareTabs} setLocShareTabs={setLocShareTabs} locDeckRef={locDeckRef}
      recceReportStore={recceReportStore} setRecceReportStore={setRecceReportStore} activeRecceVersion={activeRecceVersion} setActiveRecceVersion={setActiveRecceVersion}
      recceShareUrl={recceShareUrl} setRecceShareUrl={setRecceShareUrl} recceShareLoading={recceShareLoading} setRecceShareLoading={setRecceShareLoading}
      projectLocLinks={projectLocLinks} setProjectLocLinks={setProjectLocLinks}
      createMenuOpen={createMenuOpen} setCreateMenuOpen={setCreateMenuOpen} setDuplicateModal={setDuplicateModal} setDuplicateSearch={setDuplicateSearch}
      pushUndo={pushUndo} archiveItem={archiveItem} pushNav={pushNav} showAlert={showAlert}
      LocationsConnie={LocationsConnie} mkLoc={mkLoc} mkDetail={mkDetail}
      RECCE_REPORT_INIT={RECCE_REPORT_INIT} mkRecceLocation={mkRecceLocation} RECCE_RATINGS={RECCE_RATINGS} RECCE_RATING_C={RECCE_RATING_C}
      RecceInp={RecceInp} RecceField={RecceField} RecceImgSlot={RecceImgSlot} BtnExport={BtnExport} CSLogoSlot={CSLogoSlot}
      CS_FONT={CS_FONT} PRINT_CLEANUP_CSS={PRINT_CLEANUP_CSS}
    />;
  }

  // Casting section
  if (projectSection==="Casting") {
    return <Casting T={T} isMobile={isMobile} p={p}
      castingSubSection={castingSubSection} setCastingSubSection={setCastingSubSection}
      castingDeckStore={castingDeckStore} setCastingDeckStore={setCastingDeckStore} activeCastingDeckVersion={activeCastingDeckVersion} setActiveCastingDeckVersion={setActiveCastingDeckVersion}
      castDeckShareUrl={castDeckShareUrl} setCastDeckShareUrl={setCastDeckShareUrl} castDeckShareLoading={castDeckShareLoading} setCastDeckShareLoading={setCastDeckShareLoading}
      castDeckShareTabs={castDeckShareTabs} setCastDeckShareTabs={setCastDeckShareTabs} castDeckRef={castDeckRef}
      castingTableStore={castingTableStore} setCastingTableStore={setCastingTableStore} activeCastingTableVersion={activeCastingTableVersion} setActiveCastingTableVersion={setActiveCastingTableVersion}
      ctShareUrl={ctShareUrl} setCtShareUrl={setCtShareUrl} ctShareLoading={ctShareLoading} setCtShareLoading={setCtShareLoading} ctRef={ctRef}
      projectFileStore={projectFileStore} setProjectFileStore={setProjectFileStore} projectCreativeLinks={projectCreativeLinks} setProjectCreativeLinks={setProjectCreativeLinks}
      castFileSearchTerm={castFileSearchTerm} setCastFileSearchTerm={setCastFileSearchTerm}
      linkUploading={linkUploading} linkUploadProgress={linkUploadProgress} uploadFromLink={uploadFromLink}
      createMenuOpen={createMenuOpen} setCreateMenuOpen={setCreateMenuOpen} setDuplicateModal={setDuplicateModal} setDuplicateSearch={setDuplicateSearch}
      pushUndo={pushUndo} archiveItem={archiveItem} pushNav={pushNav} showAlert={showAlert}
      CastingConnie={CastingConnie} CastingTableConnie={CastingTableConnie} CAST_INIT={CAST_INIT} ctMkRole={ctMkRole}
      getProjectCastingTables={getProjectCastingTables} UploadZone={UploadZone}
    />;
  }

  // Styling section
  if (projectSection==="Styling") {
    return <Styling T={T} isMobile={isMobile} p={p}
      stylingSubSection={stylingSubSection} setStylingSubSection={setStylingSubSection}
      fittingStore={fittingStore} setFittingStore={setFittingStore} activeFittingVersion={activeFittingVersion} setActiveFittingVersion={setActiveFittingVersion}
      fitShareTabs={fitShareTabs} setFitShareTabs={setFitShareTabs} fitShareLoading={fitShareLoading} setFitShareLoading={setFitShareLoading} fitDeckRef={fitDeckRef}
      projectFileStore={projectFileStore} setProjectFileStore={setProjectFileStore} projectCreativeLinks={projectCreativeLinks} setProjectCreativeLinks={setProjectCreativeLinks}
      styleSearchTerm={styleSearchTerm} setStyleSearchTerm={setStyleSearchTerm}
      linkUploading={linkUploading} linkUploadProgress={linkUploadProgress} uploadFromLink={uploadFromLink}
      createMenuOpen={createMenuOpen} setCreateMenuOpen={setCreateMenuOpen} setDuplicateModal={setDuplicateModal} setDuplicateSearch={setDuplicateSearch}
      pushUndo={pushUndo} archiveItem={archiveItem} pushNav={pushNav} showAlert={showAlert}
      FittingConnie={FittingConnie} mkFitTalent={mkFitTalent} mkFitFitting={mkFitFitting}
      UploadZone={UploadZone}
    />;
  }

  // Travel section
  if (projectSection==="Travel") {
    return <Travel T={T} isMobile={isMobile} p={p}
      travelSubSection={travelSubSection} setTravelSubSection={setTravelSubSection}
      travelItineraryStore={travelItineraryStore} setTravelItineraryStore={setTravelItineraryStore} activeTIVersion={activeTIVersion} setActiveTIVersion={setActiveTIVersion}
      tiShowAddMenu={tiShowAddMenu} setTiShowAddMenu={setTiShowAddMenu}
      projectLocLinks={projectLocLinks} setProjectLocLinks={setProjectLocLinks}
      projectInfoRef={projectInfoRef}
      createMenuOpen={createMenuOpen} setCreateMenuOpen={setCreateMenuOpen} setDuplicateModal={setDuplicateModal} setDuplicateSearch={setDuplicateSearch}
      pushUndo={pushUndo} archiveItem={archiveItem} pushNav={pushNav} showAlert={showAlert} showPrompt={showPrompt}
      getProjectFiles={getProjectFiles} addProjectFiles={addProjectFiles}
      TRAVEL_ITINERARY_INIT={TRAVEL_ITINERARY_INIT} tiMkDay={tiMkDay} tiMkMove={tiMkMove}
      TI_FLIGHT_COLS={TI_FLIGHT_COLS} TI_CAR_COLS={TI_CAR_COLS} TI_HOTEL_COLS={TI_HOTEL_COLS} TI_ROOMING_COLS={TI_ROOMING_COLS} TI_MOVEMENT_COLS={TI_MOVEMENT_COLS}
      TICell={TICell} TITableSection={TITableSection} BtnExport={BtnExport} CSLogoSlot={CSLogoSlot} UploadZone={UploadZone}
      CS_FONT={CS_FONT} CS_LS={CS_LS} PRINT_CLEANUP_CSS={PRINT_CLEANUP_CSS}
    />;
  }

  // Schedule section
  if (projectSection==="Schedule") {
    return <Schedule T={T} isMobile={isMobile} p={p}
      scheduleSubSection={scheduleSubSection} setScheduleSubSection={setScheduleSubSection}
      cpsStore={cpsStore} setCpsStore={setCpsStore} activeCPSVersion={activeCPSVersion} setActiveCPSVersion={setActiveCPSVersion}
      cpsShareUrl={cpsShareUrl} setCpsShareUrl={setCpsShareUrl} cpsShareLoading={cpsShareLoading} setCpsShareLoading={setCpsShareLoading}
      cpsShareTabs={cpsShareTabs} setCpsShareTabs={setCpsShareTabs} cpsRef={cpsRef} cpsAutoSyncing={cpsAutoSyncing}
      shotListStore={shotListStore} setShotListStore={setShotListStore} activeShotListVersion={activeShotListVersion} setActiveShotListVersion={setActiveShotListVersion}
      slShareUrl={slShareUrl} setSlShareUrl={setSlShareUrl} slShareLoading={slShareLoading} setSlShareLoading={setSlShareLoading} slRef={slRef}
      storyboardStore={storyboardStore} setStoryboardStore={setStoryboardStore} activeStoryboardVersion={activeStoryboardVersion} setActiveStoryboardVersion={setActiveStoryboardVersion}
      sbShareUrl={sbShareUrl} setSbShareUrl={setSbShareUrl} sbShareLoading={sbShareLoading} setSbShareLoading={setSbShareLoading} sbRef={sbRef}
      postProdStore={postProdStore} setPostProdStore={setPostProdStore} activePostProdVersion={activePostProdVersion} setActivePostProdVersion={setActivePostProdVersion}
      ppShareUrl={ppShareUrl} setPpShareUrl={setPpShareUrl} ppShareLoading={ppShareLoading} setPpShareLoading={setPpShareLoading} ppRef={ppRef}
      createMenuOpen={createMenuOpen} setCreateMenuOpen={setCreateMenuOpen} setDuplicateModal={setDuplicateModal} setDuplicateSearch={setDuplicateSearch}
      pushUndo={pushUndo} archiveItem={archiveItem} pushNav={pushNav} showAlert={showAlert}
      CPSPolly={CPSPolly} ShotListPolly={ShotListPolly} StoryboardPolly={StoryboardPolly} PostPolly={PostPolly}
      cpsDefaultPhases={cpsDefaultPhases} mkFrame={mkFrame} ppMkVideo={ppMkVideo} ppMkStill={ppMkStill} ppDefaultSchedule={ppDefaultSchedule}
    />;
  }

  return null;
}
