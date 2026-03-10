import React, { useEffect, useRef, useCallback } from "react";

export default function Styling({
  T, isMobile, p,
  stylingSubSection, setStylingSubSection,
  fittingStore, setFittingStore, activeFittingVersion, setActiveFittingVersion,
  fitShareTabs, setFitShareTabs, fitShareLoading, setFitShareLoading, fitDeckRef,
  projectFileStore, setProjectFileStore, projectCreativeLinks, setProjectCreativeLinks,
  styleSearchTerm, setStyleSearchTerm,
  linkUploading, linkUploadProgress, uploadFromLink,
  createMenuOpen, setCreateMenuOpen, setDuplicateModal, setDuplicateSearch,
  pushUndo, archiveItem, pushNav, showAlert,
  FittingConnie, mkFitTalent, mkFitFitting,
  UploadZone,
}) {
  const STYLING_CARDS = [
    {key:"fitting",  emoji:"\ud83d\udc57", label:"Fitting Deck"},
    {key:"files",    emoji:"\ud83d\udcc1", label:"Files & Uploads"},
  ];

  if (!stylingSubSection) return (
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
      {STYLING_CARDS.map(c=>(
        <div key={c.key} onClick={()=>{setStylingSubSection(c.key);pushNav("Projects",p,"Styling",c.key);}} className="proj-card" style={{borderRadius:16,padding:"22px 20px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",transition:"border-color 0.15s"}}>
          <span style={{fontSize:28}}>{c.emoji}</span>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.text}}>{c.label}</div>
            <div style={{fontSize:12,color:T.muted,marginTop:2}}>Open {c.label.toLowerCase()}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const stylingBack = <button onClick={()=>setStylingSubSection(null)} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>{"‹"} Back to Styling</button>;

  if (stylingSubSection==="fitting") {
    const fitVersions = fittingStore[p.id] || [];
    const addFitNew = () => {
      pushUndo("add fitting deck");
      const newId = Date.now();
      const proj = { name: `${p.client||""} | ${p.name}`.replace(/^TEMPLATE \| /,""), client: p.client || "[Client Name]", date: "[Date]", stylist: "[Stylist]" };
      const newFit = { id: newId, label: `${p.name} Fitting Deck V${fitVersions.length+1}`, project: proj, talent: [mkFitTalent(), mkFitTalent()], fittings: [mkFitFitting(), mkFitFitting()] };
      setFittingStore(prev => { const store = JSON.parse(JSON.stringify(prev)); if (!store[p.id]) store[p.id] = []; store[p.id].push(newFit); return store; });
    };
    const deleteFitVersion = (idx) => {
      if (!confirm("Delete this Fitting Deck? This will be moved to Deleted.")) return;
      pushUndo("delete fitting deck");
      const fitData = JSON.parse(JSON.stringify((fittingStore[p.id]||[])[idx]));
      if (fitData) archiveItem('fitting', { projectId: p.id, fitting: fitData });
      setFittingStore(prev => { const store = JSON.parse(JSON.stringify(prev)); const arr = store[p.id] || []; arr.splice(idx, 1); store[p.id] = arr; return store; });
      setActiveFittingVersion(null);
    };

    if (activeFittingVersion === null || fitVersions.length === 0) {
      return (
        <div>
          {stylingBack}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{fontSize:16,fontWeight:700,color:T.text}}>Fitting Deck</div>
            <div style={{position:"relative"}}>
              <button onClick={()=>setCreateMenuOpen(prev=>({...prev,fit:!prev.fit}))} style={{padding:"7px 16px",borderRadius:9,background:T.accent,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New Fitting Deck ▾</button>
              {createMenuOpen.fit&&<div onClick={()=>setCreateMenuOpen(prev=>({...prev,fit:false}))} style={{position:"fixed",inset:0,zIndex:9998}} />}
              {createMenuOpen.fit&&(
                <div style={{position:"absolute",top:36,right:0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:180,overflow:"hidden"}}>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,fit:false}));addFitNew();}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Blank</div>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,fit:false}));setDuplicateModal({type:"fitting"});setDuplicateSearch("");}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Existing</div>
                </div>
              )}
            </div>
          </div>
          {fitVersions.length===0 && <div style={{borderRadius:14,background:"#fafafa",border:`1.5px dashed ${T.border}`,padding:44,textAlign:"center"}}><div style={{fontSize:13,color:T.muted}}>No fitting decks yet. Click "+ New Fitting Deck" to get started.</div></div>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {fitVersions.map((fit,i) => {
              const totalLooks = (fit.talent||[]).reduce((s,t) => s + (t.looks||[]).length, 0);
              const approvedLooks = (fit.talent||[]).reduce((s,t) => s + (t.looks||[]).filter(l=>l.status==="Approved").length, 0);
              return (
                <div key={fit.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border-color 0.15s"}} onClick={()=>setActiveFittingVersion(i)} onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>FITTING</span>
                      <span style={{fontSize:8,fontWeight:600,letterSpacing:0.5,background:approvedLooks>0?"#e8f5e9":"#f5f5f5",color:approvedLooks>0?"#2e7d32":"#999",padding:"2px 8px",borderRadius:4}}>{totalLooks} looks {"·"} {approvedLooks} approved</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:T.text}}>{fit.label||"Untitled"}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>{fit.project?.name||"No project name"}</div>
                  </div>
                  <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>deleteFitVersion(i)} style={{background:"none",border:"none",fontSize:16,color:"#ccc",cursor:"pointer",padding:4}} onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="#ccc"}>{"×"}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const fitIdx = activeFittingVersion;
    const fitData = fitVersions[fitIdx];

    // Auto-sync approval statuses to portal when fittings change
    const fitSyncTimer = useRef(null);
    const syncFeedbackToPortal = useCallback((fittings, token) => {
      if (!token || !fittings) return;
      clearTimeout(fitSyncTimer.current);
      fitSyncTimer.current = setTimeout(async () => {
        // Build feedback map matching portal card indices
        const feedback = {};
        let ci = 0;
        fittings.forEach(fit => {
          (fit.images || []).forEach((img, n) => {
            const st = (fit.imageStatuses || {})[n];
            if (st && st !== "none") {
              feedback["c" + ci] = { status: st, note: (fit.imageNotes || {})[n] || "" };
            }
            ci++;
          });
        });
        try {
          await fetch("/api/fit-share", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, feedback }),
          });
        } catch {}
      }, 1200);
    }, []);

    // Build a fingerprint of approval statuses to detect changes
    const statusFingerprint = React.useMemo(() => {
      if (!fitData?.fittings) return "";
      return fitData.fittings.map(f =>
        (f.images || []).map((_, n) => (f.imageStatuses || {})[n] || "").join(",")
      ).join("|");
    }, [fitData?.fittings]);

    useEffect(() => {
      if (fitData?.shareToken && fitData?.fittings && statusFingerprint) {
        syncFeedbackToPortal(fitData.fittings, fitData.shareToken);
      }
    }, [statusFingerprint, fitData?.shareToken, syncFeedbackToPortal]);

    if (!fitData) { setActiveFittingVersion(null); return null; }

    const fitBack = <button onClick={()=>setActiveFittingVersion(null)} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>{"‹"} Back to Fitting Decks</button>;

    const fitShareTitle = `ONNA | ${fitData.label || "Fitting Deck"}`;
    const existingFitToken = fitData.shareToken || null;
    const displayFitShareUrl = existingFitToken ? `https://app.onna.digital/api/fit-share?token=${encodeURIComponent(existingFitToken)}` : null;
    const pushFeedbackOnly = async () => {
      if (!existingFitToken || !fitData.fittings) return;
      const feedback = {};
      let ci = 0;
      fitData.fittings.forEach(fit => {
        (fit.images || []).forEach((img, n) => {
          const st = (fit.imageStatuses || {})[n];
          if (st && st !== "none") {
            feedback["c" + ci] = { status: st, note: (fit.imageNotes || {})[n] || "" };
          }
          ci++;
        });
      });
      await fetch("/api/fit-share", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: existingFitToken, feedback }),
      });
    };
    const sendFitShare = async () => {
      if (fitShareTabs.size === 0) return;
      setFitShareLoading(true);
      try {
        // Always regenerate full HTML so images/content sync through
        if (fitDeckRef.current) await fitDeckRef.current.share([...fitShareTabs], existingFitToken, fitData.shareResourceId);
      } catch (err) {
        // If full sync fails (payload too large), fall back to feedback-only
        if (existingFitToken) {
          try { await pushFeedbackOnly(); showAlert("Images too large for full sync — approvals synced only. Try removing some images."); }
          catch { showAlert("Error: " + err.message); }
        } else { showAlert("Error: " + err.message); }
      }
      setFitShareLoading(false);
    };
    const toggleFitShareTab = (t) => setFitShareTabs(prev => { const n = new Set(prev); if (n.has(t)) n.delete(t); else n.add(t); return n; });
    return (
      <div>
        {fitBack}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
            <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555",flexShrink:0}}>FITTING</span>
            <input value={fitData.label||""} onChange={e=>{setFittingStore(prev=>{const s=JSON.parse(JSON.stringify(prev));s[p.id][fitIdx].label=e.target.value;return s;});}} style={{fontSize:14,fontWeight:600,color:T.text,background:"transparent",border:"none",outline:"none",fontFamily:"inherit",padding:0,flex:1,minWidth:0}} placeholder="Version label"/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            {["confirmed","options"].map(t => (
              <label key={t} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,color:fitShareTabs.has(t)?"#1565C0":"#999",cursor:"pointer",userSelect:"none"}}>
                <input type="checkbox" checked={fitShareTabs.has(t)} onChange={()=>toggleFitShareTab(t)} style={{accentColor:"#1976D2"}}/>
                {t === "confirmed" ? "Confirmed" : "Options"}
              </label>
            ))}
            <button onClick={sendFitShare} disabled={fitShareLoading||fitShareTabs.size===0} style={{padding:"5px 16px",borderRadius:8,background:existingFitToken?"#1976D2":"#1d1d1f",color:"#fff",border:"none",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:(fitShareLoading||fitShareTabs.size===0)?0.5:1}}>
              {fitShareLoading ? "Generating\u2026" : existingFitToken ? "Sync" : "Generate Link"}
            </button>
          </div>
        </div>
        {displayFitShareUrl && (
          <div style={{background:"#e3f2fd",border:"1px solid #90caf9",borderRadius:10,padding:"14px 18px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,color:"#1565C0",marginBottom:8}}>{fitShareTitle}</div>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <a href={displayFitShareUrl} target="_blank" rel="noopener noreferrer" style={{flex:1,minWidth:200,padding:"6px 10px",borderRadius:7,border:"1px solid #90caf9",fontSize:11.5,fontFamily:"inherit",color:"#1565C0",background:"#fff",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{displayFitShareUrl}</a>
              <button onClick={()=>{navigator.clipboard.writeText(`${fitShareTitle}\n${displayFitShareUrl}`);}} style={{padding:"5px 13px",borderRadius:8,background:"#1d1d1f",color:"#fff",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Copy</button>
            </div>
          </div>
        )}
        <div style={{overflowX:"auto",margin:isMobile?"0 -16px":"0 -28px",padding:isMobile?"0 16px":"0 28px"}}>
          <FittingConnie
            ref={fitDeckRef}
            initialProject={fitData.project}
            initialTalent={fitData.talent}
            initialFittings={fitData.fittings}
            onChangeProject={proj => setFittingStore(prev => { const s = JSON.parse(JSON.stringify(prev)); s[p.id][fitIdx].project = proj; return s; })}
            onChangeTalent={tal => setFittingStore(prev => { const s = JSON.parse(JSON.stringify(prev)); s[p.id][fitIdx].talent = tal; return s; })}
            onChangeFittings={fits => setFittingStore(prev => { const s = JSON.parse(JSON.stringify(prev)); s[p.id][fitIdx].fittings = fits; return s; })}
            onShareUrl={(url, token, id) => {
              setFittingStore(prev => {
                const s = JSON.parse(JSON.stringify(prev));
                if (s[p.id] && s[p.id][fitIdx]) {
                  s[p.id][fitIdx].shareToken = token;
                  s[p.id][fitIdx].shareResourceId = id;
                  if (!s[p.id][fitIdx].shareLinks) s[p.id][fitIdx].shareLinks = [];
                  s[p.id][fitIdx].shareLinks.push({ url, token, resourceId: id, createdAt: new Date().toISOString() });
                }
                return s;
              });
            }}
          />
        </div>
      </div>
    );
  }

  if (stylingSubSection==="files") {
    const styleFiles = (projectFileStore[p.id]||{}).styling_store||[];
    const styleLink = (projectCreativeLinks[p.id]||{}).styling||"";
    return (
      <div>
        {stylingBack}
        <div style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:4}}>Files & Uploads</div>
        <p style={{fontSize:12.5,color:T.muted,marginBottom:18}}>Upload styling files or paste a Dropbox / Drive link to import.</p>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Dropbox / Drive Link</div>
          <div style={{display:"flex",gap:10}}>
            <input value={styleLink} onChange={e=>setProjectCreativeLinks(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),styling:e.target.value}}))} placeholder="https://www.dropbox.com/sh/..." style={{flex:1,padding:"9px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
            {styleLink&&<button disabled={linkUploading} onClick={()=>uploadFromLink(styleLink,"styling_store")} style={{display:"flex",alignItems:"center",padding:"9px 18px",borderRadius:10,background:linkUploading?"#999":T.accent,color:"#fff",fontSize:13,fontWeight:600,border:"none",cursor:linkUploading?"default":"pointer",flexShrink:0,fontFamily:"inherit"}}>{linkUploading?"Uploading\u2026":"Upload"}</button>}
          </div>
          {linkUploadProgress!==null&&<div style={{marginTop:8}}><div style={{height:6,borderRadius:3,background:"#e5e5ea",overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:linkUploadProgress===100?"#34c759":T.accent,width:`${linkUploadProgress}%`,transition:"width 0.3s ease"}}/></div><div style={{fontSize:11,color:T.muted,marginTop:4}}>{linkUploadProgress===100?"Complete!":linkUploadProgress<50?"Sending\u2026":"Downloading\u2026"} {linkUploadProgress}%</div></div>}
        </div>
        <UploadZone label="Upload styling documents (PDF, images, lookbooks)" files={[]} onAdd={async fileList=>{const ne=[];for(const f of fileList){if(f.size>40*1024*1024){showAlert(f.name+" is over 40 MB.");continue;}const data=await new Promise(r=>{const fr=new FileReader();fr.onload=e=>r(e.target.result);fr.readAsDataURL(f);});ne.push({id:Date.now()+Math.random(),name:f.name,size:f.size,type:f.type,data,createdAt:Date.now()});}if(ne.length>0)setProjectFileStore(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),styling_store:[...((prev[p.id]||{}).styling_store||[]),...ne]}}));}}/>
        {styleFiles.length>0&&(()=>{const filteredStyle=styleSearchTerm.trim()?styleFiles.filter(f=>f.name.toLowerCase().includes(styleSearchTerm.trim().toLowerCase())):styleFiles;return<>
            <input value={styleSearchTerm} onChange={e=>setStyleSearchTerm(e.target.value)} placeholder="Search styling files\u2026" style={{width:"100%",padding:"9px 14px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",marginTop:16,marginBottom:8,boxSizing:"border-box"}}/>
            <div style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,marginTop:6,marginBottom:6}}>{filteredStyle.length} file{filteredStyle.length!==1?"s":""}{styleSearchTerm.trim()?" found":" uploaded"}</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14}}>
              {filteredStyle.map((f,i)=>(<div key={f.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:12,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
                  <span style={{fontSize:11,fontWeight:700,color:"#fff",background:T.accent,borderRadius:6,padding:"3px 8px",flexShrink:0}}>V{i+1}</span>
                  <span style={{fontSize:15,flexShrink:0}}>{f.type?.includes("pdf")?"\ud83d\udcc4":f.type?.includes("image")?"\ud83d\uddbc":"\ud83d\udcce"}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:T.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:1}}>{(f.size/1024).toFixed(0)} KB \u00b7 {new Date(f.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
                  </div>
                  <button onClick={()=>{const a=document.createElement("a");a.href=f.data;a.download=f.name;a.click();}} style={{background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Download</button>
                  <button onClick={()=>{if(confirm("Delete V"+(i+1)+" - "+f.name+"?"))setProjectFileStore(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),styling_store:((prev[p.id]||{}).styling_store||[]).filter(x=>x.id!==f.id)}}));}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:"0 4px",lineHeight:1,flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#c0392b"} onMouseOut={e=>e.currentTarget.style.color=T.muted}>{"×"}</button>
                </div>))}
            </div>
          </>;})()}
      </div>
    );
  }

  return null;
}
