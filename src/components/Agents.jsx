import React, { useState } from "react";

export default function Agents({
  isMobile, agentActiveIdx, setAgentActiveIdx: _setAgentActiveIdx,
  AGENT_DEFS, AgentCard,
  // AgentCard props
  vendors, localLeads, setVendors, setLocalLeads,
  callSheetStore, setCallSheetStore, selectedProject, allProjectsMerged,
  activeCSVersion, dietaryStore, setDietaryStore,
  riskAssessmentStore, setRiskAssessmentStore, activeRAVersion, setActiveRAVersion,
  contractDocStore, setContractDocStore, activeContractVersion, setActiveContractVersion,
  projectEstimates, setProjectEstimates, activeEstimateVersion, setActiveEstimateVersion,
  projectActuals, setProjectActuals,
  projectCasting, setProjectCasting, getProjectCastingTables,
  navigateToDoc, pushUndo, projectInfoRef, archiveItem,
  setCsDuplicateModal, setCsDuplicateSearch, setRaDuplicateModal, setRaDuplicateSearch,
  travelItineraryStore, setTravelItineraryStore,
  castingDeckStore, setCastingDeckStore, fittingStore, setFittingStore,
  castingTableStore, setCastingTableStore,
  cpsStore, setCpsStore, shotListStore, setShotListStore,
  storyboardStore, setStoryboardStore,
  locDeckStore, setLocDeckStore, recceReportStore, setRecceReportStore,
  postProdStore, setPostProdStore,
  syncProjectInfoToDocs,
  projectFileStore,
}) {
  const [agentHoverIdx, setAgentHoverIdx] = useState(null);
  const [agentStart, setAgentStart] = useState(0);
  const [agentSearch, setAgentSearch] = useState("");
  const [agentStripW, setAgentStripW] = useState(() => { try { return parseInt(localStorage.getItem("onna_agent_strip_w")) || 180; } catch { return 180; } });
  const [agentWantsFullWidth, setAgentWantsFullWidth] = useState(false);

  const _filteredAgents = agentSearch.trim() ? AGENT_DEFS.filter(a => a.name.toLowerCase().includes(agentSearch.toLowerCase()) || a.title.toLowerCase().includes(agentSearch.toLowerCase())) : AGENT_DEFS;
  const AGENTS_VISIBLE = isMobile ? 4 : 10;
  const agentTotal = _filteredAgents.length;
  const needsAgentNav = agentTotal > AGENTS_VISIBLE;

  const setAgentActiveIdx = idx => {
    _setAgentActiveIdx(idx);
    if (idx !== null && needsAgentNav) {
      if (idx < agentStart) setAgentStart(idx);
      else if (idx >= agentStart + AGENTS_VISIBLE) setAgentStart(idx - AGENTS_VISIBLE + 1);
    }
  };

  return (
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",height:isMobile?"calc(100vh - 94px)":"calc(100vh - 120px)",padding:isMobile?"0":"0 8px",gap:0,overflow:"hidden"}}>
      {/* Mobile: horizontal agent strip on top */}
      {isMobile&&<div style={{flexShrink:0,borderBottom:"1px solid #e5e5ea"}}>
        <div style={{display:"flex",flexDirection:"row",overflowX:"hidden",overflowY:"hidden",gap:0,padding:"10px 4px 8px",WebkitOverflowScrolling:"touch",justifyContent:"center",alignItems:"center"}}>
        {needsAgentNav&&<button onClick={()=>setAgentStart(s=>(s-1+agentTotal)%agentTotal)} style={{background:"none",border:"1px solid #e5e5ea",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#888",fontSize:14,flexShrink:0}}>‹</button>}
        {Array.from({length:Math.min(AGENTS_VISIBLE,agentTotal)},(_,k)=>_filteredAgents[(agentStart+k)%agentTotal]).map((a)=>{
          const i=AGENT_DEFS.indexOf(a);
          const isActive=agentActiveIdx===i;
          return(
          <button key={a.id} onClick={()=>setAgentActiveIdx(agentActiveIdx===i?null:i)} onMouseEnter={()=>setAgentHoverIdx(i)} onMouseLeave={()=>setAgentHoverIdx(null)}
            style={{flex:"0 0 auto",width:"20%",minWidth:0,background:isActive?"rgba(0,0,0,0.06)":"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 2px",borderRadius:14,transition:"transform 0.18s ease, background 0.18s ease",transform:isActive?"scale(1.08)":"scale(1)"}}>
            <div style={{transform:"scale(0.65)",transformOrigin:"center"}}><a.Blob mood={isActive?"excited":"idle"} bob={0}/></div>
            <span style={{fontSize:8,fontWeight:700,color:"#1d1d1f",fontFamily:"Avenir,'Avenir Next',sans-serif",letterSpacing:0.5,textTransform:"uppercase",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%"}}>{a.name}</span>
          </button>);})}
        {needsAgentNav&&<button onClick={()=>setAgentStart(s=>(s+1)%agentTotal)} style={{background:"none",border:"1px solid #e5e5ea",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#888",fontSize:14,flexShrink:0}}>›</button>}
        </div>
      </div>}
      {/* Desktop: vertical agent strip on left with drag-resize */}
      {!isMobile&&<>{/* strip */}<div style={{flex:`0 0 ${agentStripW}px`,display:"flex",flexDirection:"column",alignItems:"center",padding:"6px 0 0",borderRight:"1px solid #e5e5ea",minHeight:0,overflow:"hidden"}}>
        {/* Search */}
        <input value={agentSearch} onChange={e=>{setAgentSearch(e.target.value);}} placeholder="Search..." style={{width:agentStripW-16,padding:"4px 6px",borderRadius:6,border:"1px solid #e5e5ea",fontSize:9,fontFamily:"inherit",color:"#1d1d1f",background:"#f5f5f7",outline:"none",marginBottom:4,boxSizing:"border-box",textAlign:"center",flexShrink:0}}/>
        {/* Scrollable agent list — hidden scrollbar */}
        <div className="agent-strip-scroll" style={{flex:1,overflowY:"auto",overflowX:"hidden",width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:2,scrollbarWidth:"none",msOverflowStyle:"none"}}>
        <style>{`.agent-strip-scroll::-webkit-scrollbar{display:none;}`}</style>
        {_filteredAgents.map((a)=>{
          const i=AGENT_DEFS.indexOf(a);
          const isActive=agentActiveIdx===i;
          const isHover=agentHoverIdx===i;
          const sc=agentStripW<100?0.5:agentStripW<130?0.6:0.7;
          const mg=agentStripW<100?-12:agentStripW<130?-8:-4;
          return(
          <button key={a.id} onClick={()=>setAgentActiveIdx(agentActiveIdx===i?null:i)} onMouseEnter={()=>setAgentHoverIdx(i)} onMouseLeave={()=>setAgentHoverIdx(null)}
            style={{width:agentStripW-8,background:isActive?"rgba(0,0,0,0.06)":"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:0,padding:"3px 2px",borderRadius:10,transition:"transform 0.15s ease",transform:isActive?"scale(1.05)":"scale(1)",flexShrink:0}}>
            <div style={{transform:`scale(${sc})`,transformOrigin:"center",margin:`${mg}px 0`}}><a.Blob mood={isActive?"excited":isHover?"talking":"idle"} bob={0}/></div>
            <span style={{fontSize:agentStripW<100?7:8,fontWeight:700,color:"#1d1d1f",fontFamily:"Avenir,'Avenir Next',sans-serif",letterSpacing:0.8,textTransform:"uppercase",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%",lineHeight:1.2}}>{a.name}</span>
          </button>);})}
        </div>
      </div>
      {/* Drag handle to resize strip */}
      <div style={{flex:"0 0 4px",cursor:"col-resize",background:"transparent",zIndex:2,display:"flex",alignItems:"center",justifyContent:"center"}}
        onMouseDown={e=>{e.preventDefault();const startX=e.clientX;const startW=agentStripW;let curW=startW;const onMove=ev=>{curW=Math.max(70,Math.min(250,startW+(ev.clientX-startX)));setAgentStripW(curW);};const onUp=()=>{document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);try{localStorage.setItem("onna_agent_strip_w",String(curW));}catch{}};document.addEventListener("mousemove",onMove);document.addEventListener("mouseup",onUp);}}>
        <div style={{width:2,height:32,borderRadius:1,background:"#d1d1d6"}}/>
      </div></>}
      {/* Chat panel — takes full height on desktop */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"stretch",minHeight:0,padding:isMobile?"0":"4px 8px"}}>
        {agentActiveIdx===null?(
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:"white",borderRadius:isMobile?0:20,border:isMobile?"none":"1.5px solid #e5e5ea",boxShadow:isMobile?"none":"0 8px 32px rgba(0,0,0,0.08)",color:"#aeaeb2",fontSize:14,fontFamily:"Avenir,'Avenir Next',sans-serif",fontWeight:500,padding:24,textAlign:"center"}}>Select an agent to start chatting</div>
        ):(
          <div style={{flex:1,background:"white",borderRadius:isMobile?0:20,border:isMobile?"none":"1.5px solid #e5e5ea",boxShadow:isMobile?"none":"0 8px 32px rgba(0,0,0,0.08)",display:"flex",flexDirection:"column",overflow:"hidden",height:"100%",minHeight:0,width:"100%",maxWidth:"none"}}>
            {/* Bubble header with nav arrows */}
            <div style={{padding:"13px 18px 10px",borderBottom:"1px solid #f2f2f7",display:"flex",alignItems:"center",flexShrink:0}}>
              <span style={{fontWeight:700,fontSize:12,color:"#1d1d1f",fontFamily:"Avenir,'Avenir Next',sans-serif",letterSpacing:1.2,textTransform:"uppercase"}}>{AGENT_DEFS[agentActiveIdx].name}</span>
              <button onClick={()=>setAgentActiveIdx(null)} style={{marginLeft:"auto",background:"none",border:"none",fontSize:17,color:"#aeaeb2",cursor:"pointer",padding:"2px 6px",lineHeight:1}}>{"✕"}</button>
            </div>
            {/* AgentCard renders inline chat content */}
            {AGENT_DEFS.map((a,i)=>(
              <AgentCard key={a.id} agent={a} active={agentActiveIdx===i} onSelect={()=>setAgentActiveIdx(i)} onClose={()=>setAgentActiveIdx(null)}
                allVendors={a.id==="logistical"?vendors:undefined}
                allLeads={a.id==="logistical"?localLeads:undefined}
                onUpdateVendor={a.id==="logistical"?(id,fields)=>{setVendors(prev=>prev.map(v=>v.id===id?{...v,...fields}:v));}:undefined}
                onUpdateLead={a.id==="logistical"?(id,fields)=>{setLocalLeads(prev=>prev.map(l=>l.id===id?{...l,...fields}:l));}:undefined}
                callSheetStore={a.id==="compliance"?callSheetStore:undefined}
                setCallSheetStore={a.id==="compliance"?setCallSheetStore:undefined}
                selectedProject={(a.id==="compliance"||a.id==="researcher"||a.id==="contracts"||a.id==="billie"||a.id==="carrie"||a.id==="tina"||a.id==="tabby"||a.id==="polly"||a.id==="lillie"||a.id==="perry")?selectedProject:undefined}
                localProjects={(a.id==="compliance"||a.id==="researcher"||a.id==="contracts"||a.id==="billie"||a.id==="carrie"||a.id==="tina"||a.id==="tabby"||a.id==="polly"||a.id==="lillie"||a.id==="perry")?allProjectsMerged.filter(p=>p.client!=="TEMPLATE"):undefined}
                vendors={(a.id==="compliance"||a.id==="carrie")?vendors:undefined}
                activeCSVersion={a.id==="compliance"?activeCSVersion:undefined}
                dietaryStore={a.id==="compliance"?dietaryStore:undefined}
                setDietaryStore={a.id==="compliance"?setDietaryStore:undefined}
                riskAssessmentStore={a.id==="researcher"?riskAssessmentStore:undefined}
                setRiskAssessmentStore={a.id==="researcher"?setRiskAssessmentStore:undefined}
                activeRAVersion={a.id==="researcher"?activeRAVersion:undefined}
                setActiveRAVersion={a.id==="researcher"?setActiveRAVersion:undefined}
                contractDocStore={a.id==="contracts"?contractDocStore:undefined}
                setContractDocStore={a.id==="contracts"?setContractDocStore:undefined}
                activeContractVersion={a.id==="contracts"?activeContractVersion:undefined}
                setActiveContractVersion={a.id==="contracts"?setActiveContractVersion:undefined}
                projectEstimates={a.id==="billie"?projectEstimates:undefined}
                setProjectEstimates={a.id==="billie"?setProjectEstimates:undefined}
                activeEstimateVersion={a.id==="billie"?activeEstimateVersion:undefined}
                setActiveEstimateVersion={a.id==="billie"?setActiveEstimateVersion:undefined}
                projectActuals={a.id==="billie"?projectActuals:undefined}
                setProjectActuals={a.id==="billie"?setProjectActuals:undefined}
                projectCasting={a.id==="carrie"?projectCasting:undefined}
                setProjectCasting={a.id==="carrie"?setProjectCasting:undefined}
                getProjectCastingTables={a.id==="carrie"?getProjectCastingTables:undefined}
                onNavigateToDoc={(a.id==="compliance"||a.id==="researcher"||a.id==="contracts"||a.id==="billie")?navigateToDoc:undefined}
                onFullWidthChange={setAgentWantsFullWidth}
                isMobile={isMobile}
                pushUndo={pushUndo}
                projectInfoRef={projectInfoRef}
                onOpenDuplicateCS={a.id==="compliance"?(pid)=>{setCsDuplicateModal({origin:"connie",projectId:pid});setCsDuplicateSearch("");}:undefined}
                onOpenDuplicateRA={a.id==="researcher"?(pid)=>{setRaDuplicateModal({origin:"ronnie",projectId:pid});setRaDuplicateSearch("");}:undefined}
                onArchiveCallSheet={(a.id==="compliance"||a.id==="researcher"||a.id==="billie"||a.id==="contracts")?archiveItem:undefined}
                travelItineraryStore={a.id==="tina"?travelItineraryStore:undefined}
                setTravelItineraryStore={a.id==="tina"?setTravelItineraryStore:undefined}
                castingDeckStore={(a.id==="tabby")?castingDeckStore:undefined}
                setCastingDeckStore={(a.id==="tabby")?setCastingDeckStore:undefined}
                fittingStore={(a.id==="tabby")?fittingStore:undefined}
                setFittingStore={(a.id==="tabby")?setFittingStore:undefined}
                castingTableStore={(a.id==="tabby")?castingTableStore:undefined}
                setCastingTableStore={(a.id==="tabby")?setCastingTableStore:undefined}
                cpsStore={a.id==="polly"?cpsStore:undefined}
                setCpsStore={a.id==="polly"?setCpsStore:undefined}
                shotListStore={a.id==="polly"?shotListStore:undefined}
                setShotListStore={a.id==="polly"?setShotListStore:undefined}
                storyboardStore={a.id==="polly"?storyboardStore:undefined}
                setStoryboardStore={a.id==="polly"?setStoryboardStore:undefined}
                locDeckStore={a.id==="lillie"?locDeckStore:undefined}
                setLocDeckStore={a.id==="lillie"?setLocDeckStore:undefined}
                recceReportStore={a.id==="lillie"?recceReportStore:undefined}
                setRecceReportStore={a.id==="lillie"?setRecceReportStore:undefined}
                postProdStore={a.id==="perry"?postProdStore:undefined}
                setPostProdStore={a.id==="perry"?setPostProdStore:undefined}
                syncProjectInfoToDocs={(a.id==="compliance"||a.id==="researcher"||a.id==="contracts"||a.id==="billie")?syncProjectInfoToDocs:undefined}
                projectFileStore={a.id==="billie"?projectFileStore:undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
