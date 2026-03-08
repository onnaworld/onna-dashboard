import React from "react";

export default function Schedule({
  T, isMobile, p,
  scheduleSubSection, setScheduleSubSection,
  cpsStore, setCpsStore, activeCPSVersion, setActiveCPSVersion,
  cpsShareUrl, setCpsShareUrl, cpsShareLoading, setCpsShareLoading,
  cpsShareTabs, setCpsShareTabs, cpsRef, cpsAutoSyncing,
  shotListStore, setShotListStore, activeShotListVersion, setActiveShotListVersion,
  slShareUrl, setSlShareUrl, slShareLoading, setSlShareLoading, slRef,
  storyboardStore, setStoryboardStore, activeStoryboardVersion, setActiveStoryboardVersion,
  sbShareUrl, setSbShareUrl, sbShareLoading, setSbShareLoading, sbRef,
  postProdStore, setPostProdStore, activePostProdVersion, setActivePostProdVersion,
  ppShareUrl, setPpShareUrl, ppShareLoading, setPpShareLoading, ppRef,
  createMenuOpen, setCreateMenuOpen, setDuplicateModal, setDuplicateSearch,
  pushUndo, archiveItem, pushNav, showAlert,
  CPSPolly, ShotListPolly, StoryboardPolly, PostPolly,
  cpsDefaultPhases, mkFrame, ppMkVideo, ppMkStill, ppDefaultSchedule,
}) {
  const SCHED_CARDS = [
    {key:"cps",        emoji:"🎬", label:"CPS"},
    {key:"shotlist",   emoji:"📷", label:"Shot List"},
    {key:"storyboard", emoji:"🎨", label:"Storyboard"},
    {key:"postprod",   emoji:"🎞️", label:"Post-Production"},
  ];

  if (!scheduleSubSection) return (
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:14}}>
      {SCHED_CARDS.map(c=>(
        <div key={c.key} onClick={()=>{setScheduleSubSection(c.key);pushNav("Projects",p,"Schedule",c.key);}} className="proj-card" style={{borderRadius:16,padding:"22px 20px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",transition:"border-color 0.15s"}}>
          <span style={{fontSize:28}}>{c.emoji}</span>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.text}}>{c.label}</div>
            <div style={{fontSize:12,color:T.muted,marginTop:2}}>Open {c.label.toLowerCase()}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const schedBack = <button onClick={()=>window.history.back()} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>‹ Back to Schedule</button>;

  if (scheduleSubSection==="cps") {
    const cpsVersions = cpsStore[p.id] || [];
    const addCPSNew = () => {
      pushUndo("add CPS");
      const newId = Date.now();
      const proj = { name: `${p.client||""} | ${p.name}`.replace(/^TEMPLATE \| /,""), client: p.client || "[Client Name]", startDate: "[Start Date]", deliveryDate: "[Delivery Date]", producer: "[Producer]" };
      const newCPS = { id: newId, label: `${p.name} CPS V${cpsVersions.length+1}`, project: proj, phases: cpsDefaultPhases() };
      setCpsStore(prev => { const store = JSON.parse(JSON.stringify(prev)); if (!store[p.id]) store[p.id] = []; store[p.id].push(newCPS); return store; });
    };
    const deleteCPS = (idx) => {
      if (!confirm("Delete this CPS? This will be moved to Deleted.")) return;
      pushUndo("delete CPS");
      const cpsData = JSON.parse(JSON.stringify((cpsStore[p.id]||[])[idx]));
      if (cpsData) archiveItem('cps', { projectId: p.id, cps: cpsData });
      setCpsStore(prev => { const store = JSON.parse(JSON.stringify(prev)); const arr = store[p.id] || []; arr.splice(idx, 1); store[p.id] = arr; return store; });
      setActiveCPSVersion(null);
    };

    // List view
    if (activeCPSVersion === null || cpsVersions.length === 0) {
      return (
        <div>
          {schedBack}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{fontSize:16,fontWeight:700,color:T.text}}>Creative Production Schedule</div>
            <div style={{position:"relative"}}>
              <button onClick={()=>setCreateMenuOpen(prev=>({...prev,cps:!prev.cps}))} style={{padding:"7px 16px",borderRadius:9,background:T.accent,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New CPS ▾</button>
              {createMenuOpen.cps&&<div onClick={()=>setCreateMenuOpen(prev=>({...prev,cps:false}))} style={{position:"fixed",inset:0,zIndex:9998}} />}
              {createMenuOpen.cps&&(
                <div style={{position:"absolute",top:36,right:0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:180,overflow:"hidden"}}>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,cps:false}));addCPSNew();}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Blank</div>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,cps:false}));setDuplicateModal({type:"cps"});setDuplicateSearch("");}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Existing</div>
                </div>
              )}
            </div>
          </div>
          {cpsVersions.length===0 && <div style={{borderRadius:14,background:"#fafafa",border:`1.5px dashed ${T.border}`,padding:44,textAlign:"center"}}><div style={{fontSize:13,color:T.muted}}>No schedules yet. Click "+ New CPS" to get started.</div></div>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {cpsVersions.map((cps,i) => {
              const totalTasks = (cps.phases||[]).reduce((s,ph) => s + (ph.tasks||[]).length, 0);
              const completeTasks = (cps.phases||[]).reduce((s,ph) => s + (ph.tasks||[]).filter(t=>t.status==="Complete").length, 0);
              const pct = totalTasks > 0 ? Math.round((completeTasks/totalTasks)*100) : 0;
              return (
                <div key={cps.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border-color 0.15s"}} onClick={()=>setActiveCPSVersion(i)} onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>CPS</span>
                      <span style={{fontSize:8,fontWeight:600,letterSpacing:0.5,background:pct>0?"#e8f5e9":"#f5f5f5",color:pct>0?"#2e7d32":"#999",padding:"2px 8px",borderRadius:4}}>{totalTasks} tasks · {pct}% complete</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:T.text}}>{cps.label||"Untitled"}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>{cps.project?.name||"No project name"}</div>
                  </div>
                  <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>deleteCPS(i)} style={{background:"none",border:"none",fontSize:16,color:"#ccc",cursor:"pointer",padding:4}} onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="#ccc"}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Detail view — render CPSPolly
    const cpsIdx = activeCPSVersion;
    const cpsData = cpsVersions[cpsIdx];
    if (!cpsData) { setActiveCPSVersion(null); return null; }

    const cpsBack = <button onClick={()=>setActiveCPSVersion(null)} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>‹ Back to CPS list</button>;

    const cpsShareTitle = `ONNA | ${cpsData.label || "Creative Production Schedule"}`;
    const existingToken = cpsData.shareToken || null;
    const displayShareUrl = cpsShareUrl || (existingToken ? `https://app.onna.digital/api/cps-share?token=${encodeURIComponent(existingToken)}` : null);
    const sendCpsShare = async () => {
      if (cpsShareTabs.size === 0) return;
      setCpsShareLoading(true);
      try {
        if (cpsRef.current) await cpsRef.current.share([...cpsShareTabs], existingToken, cpsData.shareResourceId);
      } catch (err) { showAlert("Error: " + err.message); }
      setCpsShareLoading(false);
    };
    const toggleShareTab = (t) => setCpsShareTabs(prev => { const n = new Set(prev); if (n.has(t)) n.delete(t); else n.add(t); return n; });

    return (
      <div>
        {cpsBack}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>CPS</span>
            <input value={cpsData.label||""} onChange={e=>{setCpsStore(prev=>{const s=JSON.parse(JSON.stringify(prev));s[p.id][cpsIdx].label=e.target.value;return s;});}} style={{fontSize:14,fontWeight:600,color:T.text,background:"transparent",border:"none",outline:"none",fontFamily:"inherit",padding:0}} placeholder="Version label"/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            {["schedule","timeline","calendar"].map(t => (
              <label key={t} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,color:cpsShareTabs.has(t)?"#1565C0":"#999",cursor:"pointer",userSelect:"none"}}>
                <input type="checkbox" checked={cpsShareTabs.has(t)} onChange={()=>toggleShareTab(t)} style={{accentColor:"#1976D2"}}/>
                {t.charAt(0).toUpperCase()+t.slice(1)}
              </label>
            ))}
            <button onClick={sendCpsShare} disabled={cpsShareLoading||cpsShareTabs.size===0} style={{padding:"5px 16px",borderRadius:8,background:existingToken?"#1976D2":"#1d1d1f",color:"#fff",border:"none",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:(cpsShareLoading||cpsShareTabs.size===0)?0.5:1}}>
              {cpsShareLoading ? "Generating\u2026" : existingToken ? "Sync" : "Generate Link"}
            </button>
            {existingToken&&cpsAutoSyncing&&<span style={{fontSize:10,color:"#1976D2",fontWeight:500,display:"inline-flex",alignItems:"center",gap:4}}>Syncing\u2026</span>}
            {existingToken&&!cpsAutoSyncing&&displayShareUrl&&<span style={{fontSize:10,color:"#4caf50",fontWeight:500}}>Auto-sync on</span>}
          </div>
        </div>
        {displayShareUrl && (
          <div style={{background:"#e3f2fd",border:"1px solid #90caf9",borderRadius:10,padding:"14px 18px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,color:"#1565C0",marginBottom:8}}>{cpsShareTitle}</div>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <a href={displayShareUrl} target="_blank" rel="noopener noreferrer" style={{flex:1,minWidth:200,padding:"6px 10px",borderRadius:7,border:"1px solid #90caf9",fontSize:11.5,fontFamily:"inherit",color:"#1565C0",background:"#fff",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{displayShareUrl}</a>
              <button onClick={()=>{navigator.clipboard.writeText(`${cpsShareTitle}\n${displayShareUrl}`);}} style={{padding:"5px 13px",borderRadius:8,background:"#1d1d1f",color:"#fff",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Copy</button>
            </div>
          </div>
        )}
        <div id="onna-cps-print">
          <CPSPolly
            ref={cpsRef}
            initialProject={cpsData.project}
            initialPhases={cpsData.phases}
            onChangeProject={proj => setCpsStore(prev => { const s = JSON.parse(JSON.stringify(prev)); s[p.id][cpsIdx].project = proj; return s; })}
            onChangePhases={phases => setCpsStore(prev => { const s = JSON.parse(JSON.stringify(prev)); s[p.id][cpsIdx].phases = phases; return s; })}
            onShareUrl={(url, token, id) => { setCpsShareUrl(url); setCpsStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if (s[p.id] && s[p.id][cpsIdx]) { s[p.id][cpsIdx].shareToken = token; s[p.id][cpsIdx].shareResourceId = id; } return s; }); }}
          />
        </div>
      </div>
    );
  }

  if (scheduleSubSection==="shotlist") {
    const slVersions = shotListStore[p.id] || [];
    const addSLNew = () => {
      pushUndo("add shot list");
      const newId = Date.now();
      const proj = { name: `${p.client||""} | ${p.name}`.replace(/^TEMPLATE \| /,""), client: p.client || "[Client Name]", date: "[Date]", director: "[Director]", dop: "[DOP]" };
      const defaultScenes = [
        { id: 1, name: "SCENE 1", collapsed: false, shots: [{ id: 101, scene: "1A", type: "STILLS", description: "", timing: "", frame: "", movement: "", camera: "", lighting: "", talent: "", wardrobe: "", props: "", location: "", notes: "", status: "Planned", refImages: [], wardrobeImages: [], propImages: [] }] },
      ];
      const newSL = { id: newId, label: `${p.name} Shot List V${slVersions.length+1}`, project: proj, scenes: defaultScenes };
      setShotListStore(prev => { const store = JSON.parse(JSON.stringify(prev)); if (!store[p.id]) store[p.id] = []; store[p.id].push(newSL); return store; });
    };
    const deleteSL = (idx) => {
      if (!confirm("Delete this Shot List? This will be moved to Deleted.")) return;
      pushUndo("delete shot list");
      const slData = JSON.parse(JSON.stringify((shotListStore[p.id]||[])[idx]));
      if (slData) archiveItem('shotlist', { projectId: p.id, shotlist: slData });
      setShotListStore(prev => { const store = JSON.parse(JSON.stringify(prev)); const arr = store[p.id] || []; arr.splice(idx, 1); store[p.id] = arr; return store; });
      setActiveShotListVersion(null);
    };

    // List view
    if (activeShotListVersion === null || slVersions.length === 0) {
      return (
        <div>
          {schedBack}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{fontSize:16,fontWeight:700,color:T.text}}>Shot List</div>
            <div style={{position:"relative"}}>
              <button onClick={()=>setCreateMenuOpen(prev=>({...prev,sl:!prev.sl}))} style={{padding:"7px 16px",borderRadius:9,background:T.accent,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New Shot List ▾</button>
              {createMenuOpen.sl&&<div onClick={()=>setCreateMenuOpen(prev=>({...prev,sl:false}))} style={{position:"fixed",inset:0,zIndex:9998}} />}
              {createMenuOpen.sl&&(
                <div style={{position:"absolute",top:36,right:0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:180,overflow:"hidden"}}>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,sl:false}));addSLNew();}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Blank</div>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,sl:false}));setDuplicateModal({type:"shotlist"});setDuplicateSearch("");}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Existing</div>
                </div>
              )}
            </div>
          </div>
          {slVersions.length===0 && <div style={{borderRadius:14,background:"#fafafa",border:`1.5px dashed ${T.border}`,padding:44,textAlign:"center"}}><div style={{fontSize:13,color:T.muted}}>No shot lists yet. Click "+ New Shot List" to get started.</div></div>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {slVersions.map((sl,i) => {
              const totalShots = (sl.scenes||[]).reduce((s,sc) => s + (sc.shots||[]).length, 0);
              const approvedShots = (sl.scenes||[]).reduce((s,sc) => s + (sc.shots||[]).filter(sh=>sh.status==="Approved").length, 0);
              const pct = totalShots > 0 ? Math.round((approvedShots/totalShots)*100) : 0;
              return (
                <div key={sl.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border-color 0.15s"}} onClick={()=>setActiveShotListVersion(i)} onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>SHOT LIST</span>
                      <span style={{fontSize:8,fontWeight:600,letterSpacing:0.5,background:pct>0?"#e8f5e9":"#f5f5f5",color:pct>0?"#2e7d32":"#999",padding:"2px 8px",borderRadius:4}}>{totalShots} shots {"·"} {pct}% approved</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:T.text}}>{sl.label||"Untitled"}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>{sl.project?.name||"No project name"}</div>
                  </div>
                  <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>deleteSL(i)} style={{background:"none",border:"none",fontSize:16,color:"#ccc",cursor:"pointer",padding:4}} onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="#ccc"}>{"×"}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Detail view - render ShotListPolly
    const slIdx = activeShotListVersion;
    const slData = slVersions[slIdx];
    if (!slData) { setActiveShotListVersion(null); return null; }

    const slBack = <button onClick={()=>{setActiveShotListVersion(null);setSlShareUrl(null);}} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>{"‹"} Back to Shot List</button>;

    const slShareTitle = `ONNA | ${slData.label || "Shot List"}`;
    const existingSlToken = slData.shareToken || null;
    const displaySlShareUrl = slShareUrl || (existingSlToken ? `https://app.onna.digital/api/shotlist-share?token=${encodeURIComponent(existingSlToken)}` : null);
    const sendSlShare = async () => {
      setSlShareLoading(true);
      try { if (slRef.current) await slRef.current.share([], existingSlToken, slData.shareResourceId); }
      catch (err) { showAlert("Error: " + err.message); }
      setSlShareLoading(false);
    };
    return (
      <div>
        {slBack}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>SHOT LIST</span>
            <input value={slData.label||""} onChange={e=>{setShotListStore(prev=>{const s=JSON.parse(JSON.stringify(prev));s[p.id][slIdx].label=e.target.value;return s;});}} style={{fontSize:14,fontWeight:600,color:T.text,background:"transparent",border:"none",outline:"none",fontFamily:"inherit",padding:0}} placeholder="Version label"/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={sendSlShare} disabled={slShareLoading} style={{padding:"5px 16px",borderRadius:8,background:existingSlToken?"#1976D2":"#1d1d1f",color:"#fff",border:"none",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:slShareLoading?0.5:1}}>
              {slShareLoading ? "Generating\u2026" : existingSlToken ? "Sync" : "Generate Link"}
            </button>
          </div>
        </div>
        {displaySlShareUrl && (
          <div style={{background:"#e3f2fd",border:"1px solid #90caf9",borderRadius:10,padding:"14px 18px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,color:"#1565C0",marginBottom:8}}>{slShareTitle}</div>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <a href={displaySlShareUrl} target="_blank" rel="noopener noreferrer" style={{flex:1,minWidth:200,padding:"6px 10px",borderRadius:7,border:"1px solid #90caf9",fontSize:11.5,fontFamily:"inherit",color:"#1565C0",background:"#fff",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{displaySlShareUrl}</a>
              <button onClick={()=>{navigator.clipboard.writeText(`${slShareTitle}\n${displaySlShareUrl}`);}} style={{padding:"5px 13px",borderRadius:8,background:"#1d1d1f",color:"#fff",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Copy</button>
            </div>
          </div>
        )}
        <div style={{overflowX:"auto",margin:"0 -28px",padding:"0 28px"}}>
          <ShotListPolly
            ref={slRef}
            initialProject={slData.project}
            initialScenes={slData.scenes}
            onChangeProject={proj => setShotListStore(prev => { const s = JSON.parse(JSON.stringify(prev)); s[p.id][slIdx].project = proj; return s; })}
            onChangeScenes={scenes => setShotListStore(prev => { const s = JSON.parse(JSON.stringify(prev)); s[p.id][slIdx].scenes = scenes; return s; })}
            onShareUrl={(url, token, id) => { setSlShareUrl(url); setShotListStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if (s[p.id] && s[p.id][slIdx]) { s[p.id][slIdx].shareToken = token; s[p.id][slIdx].shareResourceId = id; } return s; }); }}
          />
        </div>
      </div>
    );
  }

  if (scheduleSubSection==="storyboard") {
    const sbVersions = storyboardStore[p.id] || [];
    const addSBNew = () => {
      pushUndo("add storyboard");
      const newId = Date.now();
      const proj = { name: `${p.client||""} | ${p.name}`.replace(/^TEMPLATE \| /,""), client: p.client || "[Client Name]", date: "[Date]", director: "[Director]", dop: "[DOP]" };
      const defaultFrames = [mkFrame(), mkFrame(), mkFrame(), mkFrame(), mkFrame(), mkFrame(), mkFrame(), mkFrame()];
      const newSB = { id: newId, label: `${p.name} Storyboard V${sbVersions.length+1}`, project: proj, frames: defaultFrames };
      setStoryboardStore(prev => { const store = JSON.parse(JSON.stringify(prev)); if (!store[p.id]) store[p.id] = []; store[p.id].push(newSB); return store; });
    };
    const deleteSB = (idx) => {
      if (!confirm("Delete this Storyboard? This will be moved to Deleted.")) return;
      pushUndo("delete storyboard");
      const sbData = JSON.parse(JSON.stringify((storyboardStore[p.id]||[])[idx]));
      if (sbData) archiveItem('storyboard', { projectId: p.id, storyboard: sbData });
      setStoryboardStore(prev => { const store = JSON.parse(JSON.stringify(prev)); const arr = store[p.id] || []; arr.splice(idx, 1); store[p.id] = arr; return store; });
      setActiveStoryboardVersion(null);
    };

    if (activeStoryboardVersion === null || sbVersions.length === 0) {
      return (
        <div>
          {schedBack}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{fontSize:16,fontWeight:700,color:T.text}}>Storyboard</div>
            <div style={{position:"relative"}}>
              <button onClick={()=>setCreateMenuOpen(prev=>({...prev,sb:!prev.sb}))} style={{padding:"7px 16px",borderRadius:9,background:T.accent,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New Storyboard ▾</button>
              {createMenuOpen.sb&&<div onClick={()=>setCreateMenuOpen(prev=>({...prev,sb:false}))} style={{position:"fixed",inset:0,zIndex:9998}} />}
              {createMenuOpen.sb&&(
                <div style={{position:"absolute",top:36,right:0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:180,overflow:"hidden"}}>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,sb:false}));addSBNew();}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Blank</div>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,sb:false}));setDuplicateModal({type:"storyboard"});setDuplicateSearch("");}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Existing</div>
                </div>
              )}
            </div>
          </div>
          {sbVersions.length===0 && <div style={{borderRadius:14,background:"#fafafa",border:`1.5px dashed ${T.border}`,padding:44,textAlign:"center"}}><div style={{fontSize:13,color:T.muted}}>No storyboards yet. Click "+ New Storyboard" to get started.</div></div>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {sbVersions.map((sb,i) => {
              const totalFrames = (sb.frames||[]).length;
              const filledFrames = (sb.frames||[]).filter(f=>f.image||f.caption||f.action).length;
              return (
                <div key={sb.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border-color 0.15s"}} onClick={()=>setActiveStoryboardVersion(i)} onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>STORYBOARD</span>
                      <span style={{fontSize:8,fontWeight:600,letterSpacing:0.5,background:filledFrames>0?"#e8f5e9":"#f5f5f5",color:filledFrames>0?"#2e7d32":"#999",padding:"2px 8px",borderRadius:4}}>{totalFrames} frames · {filledFrames} filled</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:T.text}}>{sb.label||"Untitled"}</div>
                  </div>
                  <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>deleteSB(i)} style={{background:"none",border:"none",fontSize:16,color:"#ccc",cursor:"pointer",padding:4}} onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="#ccc"}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const sbIdx = activeStoryboardVersion;
    const sbData = sbVersions[sbIdx];
    if (!sbData) { setActiveStoryboardVersion(null); return null; }

    const sbBack = <button onClick={()=>{setActiveStoryboardVersion(null);setSbShareUrl(null);}} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>{"‹"} Back to Storyboards</button>;

    const sbShareTitle = `ONNA | ${sbData.label || "Storyboard"}`;
    const existingSbToken = sbData.shareToken || null;
    const displaySbShareUrl = sbShareUrl || (existingSbToken ? `https://app.onna.digital/api/storyboard-share?token=${encodeURIComponent(existingSbToken)}` : null);
    const sendSbShare = async () => {
      setSbShareLoading(true);
      try { if (sbRef.current) await sbRef.current.share([], existingSbToken, sbData.shareResourceId); }
      catch (err) { showAlert("Error: " + err.message); }
      setSbShareLoading(false);
    };
    return (
      <div>
        {sbBack}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>STORYBOARD</span>
            <input value={sbData.label||""} onChange={e=>{setStoryboardStore(prev=>{const s=JSON.parse(JSON.stringify(prev));s[p.id][sbIdx].label=e.target.value;return s;});}} style={{fontSize:14,fontWeight:600,color:T.text,background:"transparent",border:"none",outline:"none",fontFamily:"inherit",padding:0}} placeholder="Version label"/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={sendSbShare} disabled={sbShareLoading} style={{padding:"5px 16px",borderRadius:8,background:existingSbToken?"#1976D2":"#1d1d1f",color:"#fff",border:"none",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:sbShareLoading?0.5:1}}>
              {sbShareLoading ? "Generating\u2026" : existingSbToken ? "Sync" : "Generate Link"}
            </button>
          </div>
        </div>
        {displaySbShareUrl && (
          <div style={{background:"#e3f2fd",border:"1px solid #90caf9",borderRadius:10,padding:"14px 18px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,color:"#1565C0",marginBottom:8}}>{sbShareTitle}</div>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <a href={displaySbShareUrl} target="_blank" rel="noopener noreferrer" style={{flex:1,minWidth:200,padding:"6px 10px",borderRadius:7,border:"1px solid #90caf9",fontSize:11.5,fontFamily:"inherit",color:"#1565C0",background:"#fff",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{displaySbShareUrl}</a>
              <button onClick={()=>{navigator.clipboard.writeText(`${sbShareTitle}\n${displaySbShareUrl}`);}} style={{padding:"5px 13px",borderRadius:8,background:"#1d1d1f",color:"#fff",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Copy</button>
            </div>
          </div>
        )}
        <div style={{overflowX:"auto",margin:"0 -28px",padding:"0 28px"}}>
          <StoryboardPolly
            ref={sbRef}
            initialProject={sbData.project}
            initialFrames={sbData.frames}
            onChangeProject={proj => setStoryboardStore(prev => { const s = JSON.parse(JSON.stringify(prev)); s[p.id][sbIdx].project = proj; return s; })}
            onChangeFrames={frames => setStoryboardStore(prev => { const s = JSON.parse(JSON.stringify(prev)); s[p.id][sbIdx].frames = frames; return s; })}
            onShareUrl={(url, token, id) => { setSbShareUrl(url); setStoryboardStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if (s[p.id] && s[p.id][sbIdx]) { s[p.id][sbIdx].shareToken = token; s[p.id][sbIdx].shareResourceId = id; } return s; }); }}
          />
        </div>
      </div>
    );
  }

  if (scheduleSubSection==="postprod") {
    const ppVersions = Array.isArray(postProdStore[p.id]) ? postProdStore[p.id] : [];
    const addPPNew = () => {
      pushUndo("add post-production");
      const newId = Date.now();
      const proj = { name: `${p.client||""} | ${p.name}`.replace(/^TEMPLATE \| /,""), client: p.client || "[Client Name]", date: "[Date]", editor: "[Editor]", colourist: "[Colourist]", sound: "[Sound]", filesLink: "" };
      const newPP = { id: newId, label: `${p.name} Post Production V${ppVersions.length+1}`, project: proj, videos: [ppMkVideo(), ppMkVideo()], stills: [ppMkStill(), ppMkStill()], schedule: ppDefaultSchedule(), specNotes: "", feedback: "" };
      setPostProdStore(prev => { const store = JSON.parse(JSON.stringify(prev)); if (!Array.isArray(store[p.id])) store[p.id] = []; store[p.id].push(newPP); return store; });
    };
    const deletePP = (idx) => {
      if (!confirm("Delete this Post-Production schedule? This will be moved to Deleted.")) return;
      pushUndo("delete post-production");
      const ppDelData = JSON.parse(JSON.stringify((postProdStore[p.id]||[])[idx]));
      if (ppDelData) archiveItem('postprod', { projectId: p.id, postprod: ppDelData });
      setPostProdStore(prev => { const store = JSON.parse(JSON.stringify(prev)); const arr = store[p.id] || []; arr.splice(idx, 1); store[p.id] = arr; return store; });
      setActivePostProdVersion(null);
    };

    // List view
    if (activePostProdVersion === null || ppVersions.length === 0) {
      return (
        <div>
          {schedBack}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{fontSize:16,fontWeight:700,color:T.text}}>Post-Production</div>
            <div style={{position:"relative"}}>
              <button onClick={()=>setCreateMenuOpen(prev=>({...prev,pp:!prev.pp}))} style={{padding:"7px 16px",borderRadius:9,background:T.accent,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New Post-Production ▾</button>
              {createMenuOpen.pp&&<div onClick={()=>setCreateMenuOpen(prev=>({...prev,pp:false}))} style={{position:"fixed",inset:0,zIndex:9998}} />}
              {createMenuOpen.pp&&(
                <div style={{position:"absolute",top:36,right:0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:180,overflow:"hidden"}}>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,pp:false}));addPPNew();}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Blank</div>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,pp:false}));setDuplicateModal({type:"postprod"});setDuplicateSearch("");}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Existing</div>
                </div>
              )}
            </div>
          </div>
          {ppVersions.length===0 && <div style={{borderRadius:14,background:"#fafafa",border:`1.5px dashed ${T.border}`,padding:44,textAlign:"center"}}><div style={{fontSize:13,color:T.muted}}>No post-production schedules yet. Click "+ New Post-Production" to get started.</div></div>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {ppVersions.map((pp,i) => {
              const totalTasks = (pp.schedule||[]).length;
              const completeTasks = (pp.schedule||[]).filter(t=>t.status==="Complete"||t.status==="Delivered").length;
              const pct = totalTasks > 0 ? Math.round((completeTasks/totalTasks)*100) : 0;
              const totalDel = (pp.videos||[]).length + (pp.stills||[]).length;
              return (
                <div key={pp.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border-color 0.15s"}} onClick={()=>setActivePostProdVersion(i)} onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>POST-PRODUCTION</span>
                      <span style={{fontSize:8,fontWeight:600,letterSpacing:0.5,background:pct>0?"#e8f5e9":"#f5f5f5",color:pct>0?"#2e7d32":"#999",padding:"2px 8px",borderRadius:4}}>{totalDel} deliverables {"\u00b7"} {totalTasks} tasks {"\u00b7"} {pct}%</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:T.text}}>{pp.label||"Untitled"}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>{pp.project?.name||"No project name"}</div>
                  </div>
                  <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>deletePP(i)} style={{background:"none",border:"none",fontSize:16,color:"#ccc",cursor:"pointer",padding:4}} onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="#ccc"}>{"\u00d7"}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Detail view
    const ppIdx = activePostProdVersion;
    const ppData = ppVersions[ppIdx];
    if (!ppData) { setActivePostProdVersion(null); return null; }

    const ppBack = <button onClick={()=>setActivePostProdVersion(null)} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>{"\u2039"} Back to Post-Production list</button>;

    const ppShareTitle = `ONNA | ${ppData.label || "Post-Production"}`;
    const existingPpToken = ppData.shareToken || null;
    const displayPpShareUrl = ppShareUrl || (existingPpToken ? `https://app.onna.digital/api/postprod-share?token=${encodeURIComponent(existingPpToken)}` : null);
    const sendPpShare = async () => {
      setPpShareLoading(true);
      try {
        if (ppRef.current) await ppRef.current.share([], existingPpToken, ppData.shareResourceId);
      } catch (err) { showAlert("Error: " + err.message); }
      setPpShareLoading(false);
    };
    return (
      <div>
        {ppBack}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>POST-PRODUCTION</span>
            <input value={ppData.label||""} onChange={e=>{setPostProdStore(prev=>{const s=JSON.parse(JSON.stringify(prev));s[p.id][ppIdx].label=e.target.value;return s;});}} style={{fontSize:14,fontWeight:600,color:T.text,background:"transparent",border:"none",outline:"none",fontFamily:"inherit",padding:0}} placeholder="Version label"/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={sendPpShare} disabled={ppShareLoading} style={{padding:"5px 16px",borderRadius:8,background:existingPpToken?"#1976D2":"#1d1d1f",color:"#fff",border:"none",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:ppShareLoading?0.5:1}}>
              {ppShareLoading ? "Generating\u2026" : existingPpToken ? "Sync" : "Generate Link"}
            </button>
          </div>
        </div>
        {displayPpShareUrl && (
          <div style={{background:"#e3f2fd",border:"1px solid #90caf9",borderRadius:10,padding:"14px 18px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,color:"#1565C0",marginBottom:8}}>{ppShareTitle}</div>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <a href={displayPpShareUrl} target="_blank" rel="noopener noreferrer" style={{flex:1,minWidth:200,padding:"6px 10px",borderRadius:7,border:"1px solid #90caf9",fontSize:11.5,fontFamily:"inherit",color:"#1565C0",background:"#fff",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{displayPpShareUrl}</a>
              <button onClick={()=>{navigator.clipboard.writeText(`${ppShareTitle}\n${displayPpShareUrl}`);}} style={{padding:"5px 13px",borderRadius:8,background:"#1d1d1f",color:"#fff",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Copy</button>
            </div>
          </div>
        )}
        <div id="onna-pp-print">
          <PostPolly
            ref={ppRef}
            initialProject={ppData.project}
            initialVideos={ppData.videos}
            initialStills={ppData.stills}
            initialSchedule={ppData.schedule}
            initialSpecNotes={ppData.specNotes}
            initialFeedback={ppData.feedback}
            onChangeProject={proj => setPostProdStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if(s[p.id]&&s[p.id][ppIdx]) s[p.id][ppIdx].project = proj; return s; })}
            onChangeVideos={vids => setPostProdStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if(s[p.id]&&s[p.id][ppIdx]) s[p.id][ppIdx].videos = vids; return s; })}
            onChangeStills={stills => setPostProdStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if(s[p.id]&&s[p.id][ppIdx]) s[p.id][ppIdx].stills = stills; return s; })}
            onChangeSchedule={sched => setPostProdStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if(s[p.id]&&s[p.id][ppIdx]) s[p.id][ppIdx].schedule = sched; return s; })}
            onChangeSpecNotes={notes => setPostProdStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if(s[p.id]&&s[p.id][ppIdx]) s[p.id][ppIdx].specNotes = notes; return s; })}
            onChangeFeedback={fb => setPostProdStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if(s[p.id]&&s[p.id][ppIdx]) s[p.id][ppIdx].feedback = fb; return s; })}
            onShareUrl={(url, token, id) => { setPpShareUrl(url); setPostProdStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if (s[p.id] && s[p.id][ppIdx]) { s[p.id][ppIdx].shareToken = token; s[p.id][ppIdx].shareResourceId = id; } return s; }); }}
          />
        </div>
      </div>
    );
  }

  return null;
}
