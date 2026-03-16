import React from "react";

export default function Locations({
  T, isMobile, p,
  locSubSection, setLocSubSection,
  locDeckStore, setLocDeckStore, activeLocDeckVersion, setActiveLocDeckVersion,
  locShareUrl, setLocShareUrl, locShareLoading, setLocShareLoading,
  locShareTabs, setLocShareTabs, locDeckRef,
  recceReportStore, setRecceReportStore, activeRecceVersion, setActiveRecceVersion,
  recceShareUrl, setRecceShareUrl, recceShareLoading, setRecceShareLoading,
  projectLocLinks, setProjectLocLinks,
  createMenuOpen, setCreateMenuOpen, setDuplicateModal, setDuplicateSearch,
  pushUndo, archiveItem, pushNav, showAlert,
  LocationsConnie, mkLoc, mkDetail,
  RECCE_REPORT_INIT, mkRecceLocation, RECCE_RATINGS, RECCE_RATING_C,
  RecceInp, RecceField, RecceImgSlot, BtnExport, CSLogoSlot,
  CS_FONT, PRINT_CLEANUP_CSS,
}) {
  const LOC_CARDS = [
    {key:"deck",  emoji:"\ud83d\udccd", label:"Locations Deck"},
    {key:"recce", emoji:"\ud83d\udcf7", label:"Recce Report"},
  ];

  if (!locSubSection) return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:18}}>
        {LOC_CARDS.map(c=>(
          <div key={c.key} onClick={()=>{setLocSubSection(c.key);pushNav("Projects",p,"Locations",c.key);}} className="proj-card" style={{borderRadius:16,padding:"22px 20px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",transition:"border-color 0.15s"}}>
            <span style={{fontSize:28}}>{c.emoji}</span>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:T.text}}>{c.label}</div>
              <div style={{fontSize:12,color:T.muted,marginTop:2}}>Open {c.label.toLowerCase()}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:10,color:T.muted,marginBottom:8,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Dropbox / Drive Folder Link</div>
        <div style={{display:"flex",gap:10}}>
          <input value={projectLocLinks[p.id]||""} onChange={e=>setProjectLocLinks(prev=>({...prev,[p.id]:e.target.value}))} placeholder="https://www.dropbox.com/sh/..." style={{flex:1,padding:"9px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
          {projectLocLinks[p.id]&&<a href={projectLocLinks[p.id]} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",padding:"9px 18px",borderRadius:10,background:T.accent,color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none"}}>Open Folder ↗</a>}
        </div>
      </div>
    </div>
  );

  const locSectionBack = <button onClick={()=>{setLocSubSection(null);setActiveLocDeckVersion(null);setActiveRecceVersion(null);}} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>{"\u2039"} Back to Locations</button>;

  // ── Locations Deck sub-section ──
  if (locSubSection==="deck") {
  const locVersions = locDeckStore[p.id] || [];
  const addLocNew = () => {
    pushUndo("add locations deck");
    const newId = Date.now();
    const proj = { name: `${p.client||""} | ${p.name}`.replace(/^TEMPLATE \| /,""), client: p.client || "", date: "" };
    const newLoc = { id: newId, label: `${p.name} Locations Deck V${locVersions.length+1}`, project: proj, locations: [mkLoc(), mkLoc(), mkLoc()], details: [mkDetail(), mkDetail(), mkDetail()], shareToken: null, shareResourceId: null };
    setLocDeckStore(prev => { const store = JSON.parse(JSON.stringify(prev)); if (!store[p.id]) store[p.id] = []; store[p.id].push(newLoc); return store; });
  };
  const deleteLocDeck = (idx) => {
    if (!confirm("Delete this Locations Deck? This will be moved to Deleted.")) return;
    pushUndo("delete locations deck");
    const locData = JSON.parse(JSON.stringify((locDeckStore[p.id]||[])[idx]));
    if (locData) archiveItem('locationDecks', { projectId: p.id, locationDeck: locData });
    setLocDeckStore(prev => { const store = JSON.parse(JSON.stringify(prev)); const arr = store[p.id] || []; arr.splice(idx, 1); store[p.id] = arr; return store; });
    setActiveLocDeckVersion(null);
  };

  // List view
  if (activeLocDeckVersion === null || locVersions.length === 0) {
    return (
      <div>
        {locSectionBack}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div style={{fontSize:16,fontWeight:700,color:T.text}}>Locations Deck</div>
          <div style={{position:"relative"}}>
            <button onClick={()=>setCreateMenuOpen(prev=>({...prev,loc:!prev.loc}))} style={{padding:"7px 16px",borderRadius:9,background:T.accent,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New Locations Deck ▾</button>
            {createMenuOpen.loc&&<div onClick={()=>setCreateMenuOpen(prev=>({...prev,loc:false}))} style={{position:"fixed",inset:0,zIndex:9998}} />}
            {createMenuOpen.loc&&(
              <div style={{position:"absolute",top:36,right:0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:180,overflow:"hidden"}}>
                <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,loc:false}));addLocNew();}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Blank</div>
                <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,loc:false}));setDuplicateModal({type:"locations"});setDuplicateSearch("");}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Existing</div>
              </div>
            )}
          </div>
        </div>
        {locVersions.length===0 && <div style={{borderRadius:14,background:"#fafafa",border:`1.5px dashed ${T.border}`,padding:44,textAlign:"center"}}><div style={{fontSize:13,color:T.muted}}>No locations decks yet. Click "+ New Locations Deck" to get started.</div></div>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {locVersions.map((loc,i) => {
            const totalLocs = (loc.locations||[]).length;
            const bookedLocs = (loc.locations||[]).filter(l=>l.status==="Booked").length;
            return (
              <div key={loc.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border-color 0.15s"}} onClick={()=>setActiveLocDeckVersion(i)} onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>LOCATIONS</span>
                    <span style={{fontSize:8,fontWeight:600,letterSpacing:0.5,background:bookedLocs>0?"#e8f5e9":"#f5f5f5",color:bookedLocs>0?"#2e7d32":"#999",padding:"2px 8px",borderRadius:4}}>{totalLocs} locations · {bookedLocs} booked</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:T.text}}>{loc.label||"Untitled"}</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:2}}>{loc.project?.name||"No project name"}</div>
                </div>
                <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>deleteLocDeck(i)} style={{background:"none",border:"none",fontSize:16,color:"#ccc",cursor:"pointer",padding:4}} onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="#ccc"}>×</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Detail view — render LocationsConnie
  const locIdx = activeLocDeckVersion;
  const locData = locVersions[locIdx];
  if (!locData) { setActiveLocDeckVersion(null); return null; }

  const locBack = <button onClick={()=>{setActiveLocDeckVersion(null);setLocShareUrl(null);}} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>‹ Back to Locations Deck list</button>;

  const locShareTitle = `ONNA | ${locData.label || "Locations Deck"}`;
  const existingLocToken = locData.shareToken || null;
  const displayLocShareUrl = locShareUrl || (existingLocToken ? `https://app.onna.digital/api/loc-share?token=${encodeURIComponent(existingLocToken)}` : null);
  const sendLocShare = async () => {
    if (locShareTabs.size === 0) return;
    setLocShareLoading(true);
    try {
      if (locDeckRef.current) await locDeckRef.current.share([...locShareTabs], existingLocToken, locData.shareResourceId);
    } catch (err) { showAlert("Error: " + err.message); }
    setLocShareLoading(false);
  };
  const toggleLocShareTab = (t) => setLocShareTabs(prev => { const n = new Set(prev); if (n.has(t)) n.delete(t); else n.add(t); return n; });
  const syncLocDeck = async () => {
    setLocShareLoading(true);
    try {
      const tk = existingLocToken || locData.shareToken;
      let fb = null;
      if (tk) {
        try {
          const fbResp = await fetch(`/api/loc-share?token=${encodeURIComponent(tk)}&feedbackOnly=1`);
          if (fbResp.ok) { const fbData = await fbResp.json(); fb = fbData.feedback; }
        } catch {}
      }
      if (locShareTabs.size > 0 && locDeckRef.current) {
        await locDeckRef.current.share([...locShareTabs], existingLocToken, locData.shareResourceId);
      }
      if (tk && fb && typeof fb === "object" && Object.keys(fb).length > 0) {
        try { await fetch("/api/loc-share", { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({token: tk, feedback: fb}) }); } catch {}
      }
      if (fb && typeof fb === "object") {
        setLocDeckStore(prev => {
          const s = JSON.parse(JSON.stringify(prev));
          const ld = s[p.id] && s[p.id][locIdx];
          if (!ld || !ld.locations) return s;
          ld.locations.forEach((loc, li) => { const key = "s" + li; if (fb[key] && fb[key].status) { loc.status = fb[key].status; } });
          return s;
        });
      }
    } catch (err) { showAlert("Sync error: " + err.message); }
    setLocShareLoading(false);
  };

  return (
    <div>
      {locBack}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>LOCATIONS</span>
          <input value={locData.label||""} onChange={e=>{setLocDeckStore(prev=>{const s=JSON.parse(JSON.stringify(prev));s[p.id][locIdx].label=e.target.value;return s;});}} style={{fontSize:14,fontWeight:600,color:T.text,background:"transparent",border:"none",outline:"none",fontFamily:"inherit",padding:0}} placeholder="Version label"/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          {["overview","detail"].map(t => (
            <label key={t} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,color:locShareTabs.has(t)?"#1565C0":"#999",cursor:"pointer",userSelect:"none"}}>
              <input type="checkbox" checked={locShareTabs.has(t)} onChange={()=>toggleLocShareTab(t)} style={{accentColor:"#1976D2"}}/>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </label>
          ))}
          <button onClick={existingLocToken ? syncLocDeck : sendLocShare} disabled={locShareLoading||locShareTabs.size===0} style={{padding:"5px 16px",borderRadius:8,background:existingLocToken?"#1976D2":"#1d1d1f",color:"#fff",border:"none",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:(locShareLoading||locShareTabs.size===0)?0.5:1}}>
            {locShareLoading ? "Syncing\u2026" : existingLocToken ? "Sync" : "Generate Link"}
          </button>
        </div>
      </div>
      {displayLocShareUrl && (
        <div style={{background:"#e3f2fd",border:"1px solid #90caf9",borderRadius:10,padding:"14px 18px",marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1565C0",marginBottom:8}}>{locShareTitle}</div>
          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <a href={displayLocShareUrl} target="_blank" rel="noopener noreferrer" style={{flex:1,minWidth:200,padding:"6px 10px",borderRadius:7,border:"1px solid #90caf9",fontSize:11.5,fontFamily:"inherit",color:"#1565C0",background:"#fff",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{displayLocShareUrl}</a>
            <button onClick={()=>{navigator.clipboard.writeText(`${locShareTitle}\n${displayLocShareUrl}`);}} style={{padding:"5px 13px",borderRadius:8,background:"#1d1d1f",color:"#fff",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Copy</button>
          </div>
        </div>
      )}
      <div style={{marginBottom:18}}>
        <div style={{fontSize:10,color:T.muted,marginBottom:8,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Dropbox / Drive Folder Link</div>
        <div style={{display:"flex",gap:10}}>
          <input value={projectLocLinks[p.id]||""} onChange={e=>setProjectLocLinks(prev=>({...prev,[p.id]:e.target.value}))} placeholder="https://www.dropbox.com/sh/..." style={{flex:1,padding:"9px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
          {projectLocLinks[p.id]&&<a href={projectLocLinks[p.id]} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",padding:"9px 18px",borderRadius:10,background:T.accent,color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none"}}>Open Folder ↗</a>}
        </div>
      </div>
      <div style={{overflowX:"auto",marginLeft:-20,marginRight:-20,paddingLeft:20,paddingRight:20}}>
        <LocationsConnie
          ref={locDeckRef}
          initialProject={locData.project}
          initialLocations={locData.locations}
          initialDetails={locData.details}
          onChangeProject={proj => setLocDeckStore(prev => { const s = JSON.parse(JSON.stringify(prev)); s[p.id][locIdx].project = proj; return s; })}
          onChangeLocations={locs => setLocDeckStore(prev => { const s = JSON.parse(JSON.stringify(prev)); s[p.id][locIdx].locations = locs; return s; })}
          onChangeDetails={dets => setLocDeckStore(prev => { const s = JSON.parse(JSON.stringify(prev)); s[p.id][locIdx].details = dets; return s; })}
          onShareUrl={(url, token, id) => { setLocShareUrl(url); setLocDeckStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if (s[p.id] && s[p.id][locIdx]) { s[p.id][locIdx].shareToken = token; s[p.id][locIdx].shareResourceId = id; } return s; }); }}
        />
      </div>
    </div>
  );
  } // end locSubSection==="deck"

  // ── Recce Report sub-section ──
  if (locSubSection==="recce") {
    const recceVersions = recceReportStore[p.id] || [];
    const addRecceNew = () => {
      pushUndo("add recce report");
      const newId = Date.now();
      const init = JSON.parse(JSON.stringify(RECCE_REPORT_INIT));
      init.project.name = `${p.client||""} | ${p.name}`.replace(/^TEMPLATE \| /,"");
      init.project.client = p.client || "[Client Name]";
      init.locations = [mkRecceLocation()];
      const newRecce = {id:newId,label:`${p.name} Recce Report V${recceVersions.length+1}`,...init};
      setRecceReportStore(prev=>{const store=JSON.parse(JSON.stringify(prev));if(!store[p.id])store[p.id]=[];store[p.id].push(newRecce);return store;});
      setActiveRecceVersion(recceVersions.length);
    };
    const deleteRecce = (idx) => {
      if(!confirm("Delete this recce report? This will be moved to Deleted."))return;
      pushUndo("delete recce report");
      const recceData=JSON.parse(JSON.stringify((recceReportStore[p.id]||[])[idx]));
      if(recceData)archiveItem('recceReports',{projectId:p.id,recceReport:recceData});
      setRecceReportStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];arr.splice(idx,1);store[p.id]=arr;return store;});
      setActiveRecceVersion(null);
    };

    if (activeRecceVersion === null || recceVersions.length === 0) {
      return (
        <div>
          {locSectionBack}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{fontSize:16,fontWeight:700,color:T.text}}>Recce Reports</div>
            <div style={{position:"relative"}}>
              <button onClick={()=>setCreateMenuOpen(prev=>({...prev,recce:!prev.recce}))} style={{padding:"7px 16px",borderRadius:9,background:T.accent,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New Recce Report ▾</button>
              {createMenuOpen.recce&&<div onClick={()=>setCreateMenuOpen(prev=>({...prev,recce:false}))} style={{position:"fixed",inset:0,zIndex:9998}} />}
              {createMenuOpen.recce&&(
                <div style={{position:"absolute",top:36,right:0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:180,overflow:"hidden"}}>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,recce:false}));addRecceNew();}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Blank</div>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,recce:false}));setDuplicateModal({type:"recce"});setDuplicateSearch("");}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Existing</div>
                </div>
              )}
            </div>
          </div>
          {recceVersions.length===0 && <div style={{borderRadius:14,background:"#fafafa",border:`1.5px dashed ${T.border}`,padding:44,textAlign:"center"}}><div style={{fontSize:13,color:T.muted}}>No recce reports yet. Click "+ New Recce Report" to get started.</div></div>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {recceVersions.map((rec,i)=>{
              const locCount=(rec.locations||[]).length;
              const rated=(rec.locations||[]).filter(l=>l.rating).length;
              return(
                <div key={rec.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border-color 0.15s"}} onClick={()=>setActiveRecceVersion(i)}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>RECCE</span>
                      <span style={{fontSize:8,fontWeight:600,letterSpacing:0.5,background:rated>0?"#e8f5e9":"#f5f5f5",color:rated>0?"#2e7d32":"#999",padding:"2px 8px",borderRadius:4}}>{locCount} location{locCount!==1?"s":""} · {rated} rated</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:T.text}}>{rec.label||"Untitled"}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>{rec.project?.scoutedBy?`Scouted by ${rec.project.scoutedBy}`:"No scout assigned"}</div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();deleteRecce(i);}} style={{padding:"4px 10px",borderRadius:7,background:"#fff5f5",color:"#c0392b",border:"1px solid #f5c6cb",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const rcIdx = Math.min(activeRecceVersion, recceVersions.length-1);
    const rcData = recceVersions[rcIdx];
    if(!rcData){setActiveRecceVersion(null);return null;}

    const rcU = (path, val) => {
      setRecceReportStore(prev=>{
        const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[rcIdx];
        const k=path.split(".");let o=d;for(let i=0;i<k.length-1;i++)o=o[k[i]];o[k[k.length-1]]=val;
        arr[rcIdx]=d;store[p.id]=arr;return store;
      });
    };
    const rcLocs = rcData.locations || [];
    const rcSelLoc = rcData.selLoc || (rcLocs.length>0?rcLocs[0].id:null);
    const curRecLoc = rcLocs.find(l=>l.id===rcSelLoc) || (rcLocs.length>0?rcLocs[0]:null);
    const rcUpdateLoc = (id,key,val) => {
      setRecceReportStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[rcIdx];d.locations=(d.locations||[]).map(l=>l.id===id?{...l,[key]:val}:l);store[p.id]=arr;return store;});
    };
    const rcAddLoc = () => {
      const nl = mkRecceLocation();
      setRecceReportStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[rcIdx];if(!d.locations)d.locations=[];d.locations.push(nl);d.selLoc=nl.id;store[p.id]=arr;return store;});
    };
    const rcDeleteLoc = (id) => {
      setRecceReportStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[rcIdx];d.locations=(d.locations||[]).filter(l=>l.id!==id);if(d.selLoc===id)d.selLoc=null;store[p.id]=arr;return store;});
    };
    const rcAddImage = (locId, fileList) => {
      Array.from(fileList).forEach(file=>{
        if(!file.type.startsWith("image/"))return;
        const r=new FileReader();
        r.onload=(e)=>setRecceReportStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[rcIdx];d.locations=(d.locations||[]).map(l=>l.id===locId?{...l,images:[...(l.images||[]),e.target.result]}:l);store[p.id]=arr;return store;});
        r.readAsDataURL(file);
      });
    };
    const rcRemoveImage = (locId,idx) => {
      setRecceReportStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[rcIdx];d.locations=(d.locations||[]).map(l=>l.id===locId?{...l,images:l.images.filter((_,i)=>i!==idx)}:l);store[p.id]=arr;return store;});
    };
    const rcExportPDF = () => {
      const el=document.getElementById("onna-recce-print");if(!el)return;
      const clone=el.cloneNode(true);clone.querySelectorAll("[data-hide]").forEach(n=>n.remove());
      clone.querySelectorAll("input, textarea").forEach(inp=>{
        if(!inp.value||!inp.value.trim())inp.style.display="none";
        else{const s=document.createElement("span");s.textContent=inp.value;s.style.cssText=inp.style.cssText;s.style.border="none";s.style.background="none";inp.replaceWith(s);}
      });
      const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
      const doc=iframe.contentDocument;doc.open();doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>\u200B</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;font-size:10px;color:#1a1a1a}@media print{@page{margin:12mm;size:portrait}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);doc.close();
      doc.body.appendChild(doc.adoptNode(clone));setTimeout(()=>{iframe.contentWindow.focus();iframe.contentWindow.print();setTimeout(()=>document.body.removeChild(iframe),1000);},300);
    };

    const existingRcToken = rcData.shareToken || null;
    const displayRcShareUrl = recceShareUrl || (existingRcToken ? `https://app.onna.digital/api/recce-share?token=${encodeURIComponent(existingRcToken)}` : null);
    const rcShareTitle = `ONNA | ${rcData.label || "Recce Report"}`;
    const sendRcShare = async () => {
      setRecceShareLoading(true);
      try {
        const el = document.getElementById("onna-recce-print"); if (!el) { setRecceShareLoading(false); return; }
        const clone = el.cloneNode(true);
        clone.querySelectorAll("[data-hide]").forEach(n => n.remove());
        clone.querySelectorAll("input, textarea").forEach(inp => {
          if (!inp.value || !inp.value.trim()) inp.style.display = "none";
          else { const s = document.createElement("span"); s.textContent = inp.value; s.style.cssText = inp.style.cssText; s.style.border = "none"; s.style.background = "none"; inp.replaceWith(s); }
        });
        clone.querySelectorAll("img").forEach(im => { if (im.src && !im.src.startsWith("data:") && !im.src.startsWith("http")) im.src = window.location.origin + im.getAttribute("src"); });
        const html = clone.innerHTML;
        if (!html) { setRecceShareLoading(false); return; }
        const body = { html, projectName: rcData.project?.name || "", clientName: rcData.project?.client || "", mode: "recce" };
        if (existingRcToken) body.token = existingRcToken;
        if (rcData.shareResourceId) body.resourceId = rcData.shareResourceId;
        const resp = await fetch("/api/recce-share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!resp.ok) throw new Error("Share failed");
        const data = await resp.json();
        setRecceShareUrl(data.url);
        setRecceReportStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if (s[p.id] && s[p.id][rcIdx]) { s[p.id][rcIdx].shareToken = data.token; s[p.id][rcIdx].shareResourceId = data.id; } return s; });
      } catch (err) { showAlert("Error: " + err.message); }
      setRecceShareLoading(false);
    };
    return (
      <div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <button onClick={()=>{setActiveRecceVersion(null);setRecceShareUrl(null);}} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,display:"flex",alignItems:"center",gap:4}}>‹ Back to Recce Reports</button>
          <div style={{flex:1}}/>
          <BtnExport onClick={rcExportPDF}>Export PDF</BtnExport>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>RECCE REPORT</span>
            <input value={rcData.label||""} onChange={e=>rcU("label",e.target.value)} style={{fontSize:14,fontWeight:600,color:T.text,background:"transparent",border:"none",outline:"none",fontFamily:"inherit",padding:0}} placeholder="Version label"/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={sendRcShare} disabled={recceShareLoading} style={{padding:"5px 16px",borderRadius:8,background:existingRcToken?"#1976D2":"#1d1d1f",color:"#fff",border:"none",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:recceShareLoading?0.5:1}}>
              {recceShareLoading ? "Generating\u2026" : existingRcToken ? "Sync" : "Generate Link"}
            </button>
          </div>
        </div>
        {displayRcShareUrl && (
          <div style={{background:"#e3f2fd",border:"1px solid #90caf9",borderRadius:10,padding:"14px 18px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,color:"#1565C0",marginBottom:8}}>{rcShareTitle}</div>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <a href={displayRcShareUrl} target="_blank" rel="noopener noreferrer" style={{flex:1,minWidth:200,padding:"6px 10px",borderRadius:7,border:"1px solid #90caf9",fontSize:11.5,fontFamily:"inherit",color:"#1565C0",background:"#fff",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{displayRcShareUrl}</a>
              <button onClick={()=>{navigator.clipboard.writeText(`${rcShareTitle}\n${displayRcShareUrl}`);}} style={{padding:"5px 13px",borderRadius:8,background:"#1d1d1f",color:"#fff",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Copy</button>
            </div>
          </div>
        )}

        <div id="onna-recce-print" style={{background:"#fff",padding:0,fontFamily:CS_FONT,borderRadius:0}}>
          <div style={{maxWidth:900,margin:"0 auto",background:"#fff"}}>
            <div style={{padding:"20px 16px 0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:4}}><img src="/onna-default-logo.png" alt="ONNA" style={{maxHeight:30,maxWidth:120,objectFit:"contain"}}/><div style={{fontFamily:CS_FONT,fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>RECCE REPORT</div></div>
                <div style={{display:"flex",gap:16,alignItems:"center",marginTop:-3}}><CSLogoSlot label="Production Logo" image={rcData.productionLogo} onUpload={v=>rcU("productionLogo",v)} onRemove={()=>rcU("productionLogo",null)}/><CSLogoSlot label="Client Logo" image={rcData.clientLogo} onUpload={v=>rcU("clientLogo",v)} onRemove={()=>rcU("clientLogo",null)}/></div>
              </div>
              <div style={{borderBottom:"2.5px solid #000",marginBottom:12}}/>
            </div>

            <div style={{padding:"0 16px",display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
              {[["PROJECT","project.name","Project Name"],["CLIENT","project.client","Client"],["DATE","project.date","Date"],["PRODUCER","project.producer","Producer"],["SCOUTED BY","project.scoutedBy","Name"]].map(([lbl,key,ph])=>(
                <div key={key} style={{display:"flex",gap:4,alignItems:"baseline"}}>
                  <span style={{fontFamily:CS_FONT,fontSize:9,fontWeight:700,letterSpacing:0.5}}>{lbl}:</span>
                  <RecceInp value={key.split(".").reduce((o,k)=>(o||{})[k],rcData)||""} onChange={v=>rcU(key,v)} placeholder={ph} style={{width:100,borderBottom:"1px solid #eee"}}/>
                </div>
              ))}
            </div>

            <div data-hide="1" style={{padding:"0 16px",display:"flex",gap:6,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
              {rcLocs.map((loc,idx)=>{
                const active=curRecLoc&&curRecLoc.id===loc.id;
                const rc=RECCE_RATING_C[loc.rating]||{bg:"#f4f4f4",text:"#999"};
                return(
                  <div key={loc.id} style={{display:"flex",alignItems:"center",borderRadius:2,border:active?"2px solid #000":"1px solid #ddd",overflow:"hidden"}}>
                    <div onClick={()=>rcU("selLoc",loc.id)}
                      style={{fontFamily:CS_FONT,fontSize:8,fontWeight:active?700:400,letterSpacing:0.5,padding:"5px 10px",cursor:"pointer",background:active?"#000":"#fff",color:active?"#fff":"#666"}}>
                      {idx+1}. {loc.name||"Untitled"}
                    </div>
                    {loc.rating&&<div style={{fontFamily:CS_FONT,fontSize:6,fontWeight:700,background:rc.bg,color:rc.text,padding:"5px 6px",letterSpacing:0.5}}>{loc.rating[0]}</div>}
                    <button onClick={()=>rcDeleteLoc(loc.id)}
                      style={{background:active?"#333":"#f5f5f5",border:"none",color:active?"rgba(255,255,255,0.4)":"#ccc",fontSize:10,cursor:"pointer",padding:"5px 6px",lineHeight:1}}>×</button>
                  </div>
                );
              })}
              <div onClick={rcAddLoc} style={{fontFamily:CS_FONT,fontSize:8,fontWeight:700,letterSpacing:0.5,padding:"5px 12px",cursor:"pointer",borderRadius:2,border:"1px dashed #ccc",color:"#999"}}>+ ADD LOCATION</div>
            </div>

            {curRecLoc&&(
              <div style={{padding:"0 16px"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",borderBottom:"2px solid #000",paddingBottom:6,marginBottom:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:CS_FONT,fontSize:8,fontWeight:700,letterSpacing:0.5,color:"#999",marginBottom:2}}>LOCATION {rcLocs.findIndex(l=>l.id===curRecLoc.id)+1}</div>
                    <RecceInp value={curRecLoc.name} onChange={v=>rcUpdateLoc(curRecLoc.id,"name",v)} placeholder="Location Name" style={{fontSize:20,fontWeight:700,padding:0}}/>
                  </div>
                  <div data-hide="1" style={{display:"flex",gap:0,borderRadius:2,overflow:"hidden",border:"1px solid #ddd",flexShrink:0,marginTop:14}}>
                    {RECCE_RATINGS.map(r=>{
                      const rc=RECCE_RATING_C[r];const active=curRecLoc.rating===r;
                      return(
                        <div key={r} onClick={()=>rcUpdateLoc(curRecLoc.id,"rating",active?"":r)}
                          style={{fontFamily:CS_FONT,fontSize:7,fontWeight:700,letterSpacing:0.5,padding:"4px 8px",cursor:"pointer",
                            background:active?rc.bg:"#fff",color:active?rc.text:"#ccc",
                            borderRight:r!=="Not Suitable"?"1px solid #ddd":"none"}}>{r.toUpperCase()}</div>
                      );
                    })}
                  </div>
                </div>

                <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:isMobile?"wrap":"nowrap"}}>
                  <RecceField label="ADDRESS" value={curRecLoc.address} onChange={v=>rcUpdateLoc(curRecLoc.id,"address",v)} placeholder="Full address" style={{flex:2,minWidth:isMobile?"100%":"auto"}}/>
                  <RecceField label="GPS COORDINATES" value={curRecLoc.gps} onChange={v=>rcUpdateLoc(curRecLoc.id,"gps",v)} placeholder="25.2048, 55.2708" style={{flex:0.8,minWidth:isMobile?"45%":"auto"}}/>
                  <RecceField label="CONTACT ON SITE" value={curRecLoc.contact} onChange={v=>rcUpdateLoc(curRecLoc.id,"contact",v)} placeholder="Name" style={{flex:0.8,minWidth:isMobile?"45%":"auto"}}/>
                  <RecceField label="PHONE" value={curRecLoc.contactPhone} onChange={v=>rcUpdateLoc(curRecLoc.id,"contactPhone",v)} placeholder="+971..." style={{flex:0.6,minWidth:isMobile?"45%":"auto"}}/>
                </div>

                <div style={{fontFamily:CS_FONT,fontSize:8,fontWeight:700,letterSpacing:0.5,color:"#999",marginBottom:6,borderBottom:"1px solid #eee",paddingBottom:3}}>TECHNICAL ASSESSMENT</div>
                <div style={{display:"flex",gap:10,marginBottom:8,flexWrap:isMobile?"wrap":"nowrap"}}>
                  <RecceField label="POWER SUPPLY" value={curRecLoc.power} onChange={v=>rcUpdateLoc(curRecLoc.id,"power",v)} placeholder="Mains available, socket count, generator needed..." style={{minWidth:isMobile?"100%":"auto"}}/>
                  <RecceField label="PARKING / LOAD-IN" value={curRecLoc.parking} onChange={v=>rcUpdateLoc(curRecLoc.id,"parking",v)} placeholder="Parking spaces, load-in access, restrictions..." style={{minWidth:isMobile?"100%":"auto"}}/>
                  <RecceField label="NATURAL LIGHT" value={curRecLoc.light} onChange={v=>rcUpdateLoc(curRecLoc.id,"light",v)} placeholder="Direction, best time of day, blackout options..." style={{minWidth:isMobile?"100%":"auto"}}/>
                </div>
                <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:isMobile?"wrap":"nowrap"}}>
                  <RecceField label="NOISE / SOUND" value={curRecLoc.noise} onChange={v=>rcUpdateLoc(curRecLoc.id,"noise",v)} placeholder="Traffic, construction, echo, AC hum..." style={{minWidth:isMobile?"100%":"auto"}}/>
                  <RecceField label="MOBILE SIGNAL / WIFI" value={curRecLoc.signal} onChange={v=>rcUpdateLoc(curRecLoc.id,"signal",v)} placeholder="Signal strength, WiFi available, password..." style={{minWidth:isMobile?"100%":"auto"}}/>
                  <RecceField label="PERMITS REQUIRED" value={curRecLoc.permits} onChange={v=>rcUpdateLoc(curRecLoc.id,"permits",v)} placeholder="DFTC, council, private, none..." style={{minWidth:isMobile?"100%":"auto"}}/>
                </div>

                <div style={{fontFamily:CS_FONT,fontSize:8,fontWeight:700,letterSpacing:0.5,color:"#999",marginBottom:6,borderBottom:"1px solid #eee",paddingBottom:3}}>FACILITIES & SAFETY</div>
                <div style={{display:"flex",gap:10,marginBottom:8,flexWrap:isMobile?"wrap":"nowrap"}}>
                  <RecceField label="NEAREST HOSPITAL / A&E" value={curRecLoc.hospital} onChange={v=>rcUpdateLoc(curRecLoc.id,"hospital",v)} placeholder="Name, address, distance..." style={{minWidth:isMobile?"100%":"auto"}}/>
                  <RecceField label="TOILETS / GREEN ROOM" value={curRecLoc.facilities} onChange={v=>rcUpdateLoc(curRecLoc.id,"facilities",v)} placeholder="On-site toilets, green room, changing area..." style={{minWidth:isMobile?"100%":"auto"}}/>
                  <RecceField label="HEALTH & SAFETY NOTES" value={curRecLoc.health} onChange={v=>rcUpdateLoc(curRecLoc.id,"health",v)} placeholder="Hazards, trip risks, restricted areas..." color="#C62828" style={{minWidth:isMobile?"100%":"auto"}}/>
                </div>

                <div style={{fontFamily:CS_FONT,fontSize:8,fontWeight:700,letterSpacing:0.5,color:"#999",marginBottom:6,borderBottom:"1px solid #eee",paddingBottom:3}}>RECOMMENDATION</div>
                <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:isMobile?"wrap":"nowrap"}}>
                  <RecceField label="RECOMMENDED SHOOT TIMES" value={curRecLoc.shootTimes} onChange={v=>rcUpdateLoc(curRecLoc.id,"shootTimes",v)} placeholder="e.g. 06:00-10:00 (golden hour), avoid 12:00-14:00 (harsh light)..." style={{flex:1,minWidth:isMobile?"100%":"auto"}}/>
                  <div style={{flex:1.5,minWidth:isMobile?"100%":"auto"}}>
                    <div style={{fontFamily:CS_FONT,fontSize:7,fontWeight:700,letterSpacing:0.5,color:"#999",marginBottom:2}}>RECOMMENDATION / NOTES</div>
                    <textarea value={curRecLoc.recommendation||""} onChange={e=>rcUpdateLoc(curRecLoc.id,"recommendation",e.target.value)}
                      placeholder="Overall assessment, things to be aware of, recommended or not..."
                      style={{fontFamily:CS_FONT,fontSize:9,letterSpacing:0.5,border:"1px solid #eee",outline:"none",width:"100%",padding:"6px 8px",color:"#333",minHeight:40,resize:"none",boxSizing:"border-box",lineHeight:1.5,borderRadius:2,background:curRecLoc.recommendation?"#fff":"#FFFDE7"}}/>
                  </div>
                </div>

                <div style={{fontFamily:CS_FONT,fontSize:8,fontWeight:700,letterSpacing:0.5,color:"#999",marginBottom:6,borderBottom:"1px solid #eee",paddingBottom:3}}>LOCATION PHOTOS</div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2, 1fr)":"repeat(4, 1fr)",gap:isMobile?6:8}}>
                  {(curRecLoc.images||[]).map((img,ii)=>(
                    <div key={ii} style={{height:isMobile?100:140,borderRadius:2,overflow:"hidden"}}>
                      <RecceImgSlot src={img} h="100%" onAdd={files=>rcAddImage(curRecLoc.id,files)} onRemove={()=>rcRemoveImage(curRecLoc.id,ii)}/>
                    </div>
                  ))}
                  {(curRecLoc.images||[]).length<20&&(
                    <div data-hide="1" style={{height:isMobile?100:140,background:"#f8f8f8",border:"1px dashed #ddd",borderRadius:2,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                      <label style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:2}}>
                        <span style={{fontSize:18,color:"#ccc"}}>+</span>
                        <span style={{fontFamily:CS_FONT,fontSize:7,color:"#aaa",letterSpacing:0.5}}>Add Photos</span>
                        <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{rcAddImage(curRecLoc.id,e.target.files);e.target.value="";}}/>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{padding:"0 16px 16px"}}>
              <div style={{marginTop:24,display:"flex",justifyContent:"space-between",fontFamily:CS_FONT,fontSize:9,letterSpacing:0.5,color:"#000",borderTop:"2px solid #000",paddingTop:10}}>
                <div><div style={{fontWeight:700}}>@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div>
                <div style={{textAlign:"right"}}><div style={{fontWeight:700}}>WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } // end locSubSection==="recce"

  return null;
}
