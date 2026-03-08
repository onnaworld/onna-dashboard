import React from "react";

export default function Casting({
  T, isMobile, p,
  castingSubSection, setCastingSubSection,
  castingDeckStore, setCastingDeckStore, activeCastingDeckVersion, setActiveCastingDeckVersion,
  castDeckShareUrl, setCastDeckShareUrl, castDeckShareLoading, setCastDeckShareLoading,
  castDeckShareTabs, setCastDeckShareTabs, castDeckRef,
  castingTableStore, setCastingTableStore, activeCastingTableVersion, setActiveCastingTableVersion,
  ctShareUrl, setCtShareUrl, ctShareLoading, setCtShareLoading, ctRef,
  projectFileStore, setProjectFileStore, projectCreativeLinks, setProjectCreativeLinks,
  castFileSearchTerm, setCastFileSearchTerm,
  linkUploading, linkUploadProgress, uploadFromLink,
  createMenuOpen, setCreateMenuOpen, setDuplicateModal, setDuplicateSearch,
  pushUndo, archiveItem, pushNav, showAlert,
  CastingConnie, CastingTableConnie, CAST_INIT, ctMkRole,
  getProjectCastingTables, UploadZone,
}) {
  const castingTables = getProjectCastingTables(p.id);
  const castFiles = (projectFileStore[p.id]||{}).casting||[];
  const castLink = (projectCreativeLinks[p.id]||{}).casting||"";
  const castCols = [{key:"agency",label:"Agency"},{key:"name",label:"Name"},{key:"email",label:"Email"},{key:"option",label:"Option"},{key:"notes",label:"Notes"},{key:"link",label:"Link"}];

  const CASTING_CARDS = [
    {key:"tables", emoji:"\ud83d\udcdd", label:"Casting Tables"},
    {key:"deck",   emoji:"\ud83c\udfac", label:"Casting Deck"},
    {key:"files",  emoji:"\ud83d\udcc1", label:"Files & Uploads"},
  ];

  if (!castingSubSection) return (
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:14}}>
      {CASTING_CARDS.map(c=>(
        <div key={c.key} onClick={()=>{setCastingSubSection(c.key);pushNav("Projects",p,"Casting",c.key);}} className="proj-card" style={{borderRadius:16,padding:"22px 20px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",transition:"border-color 0.15s"}}>
          <span style={{fontSize:28}}>{c.emoji}</span>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.text}}>{c.label}</div>
            <div style={{fontSize:12,color:T.muted,marginTop:2}}>Open {c.label.toLowerCase()}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const castingBack = <button onClick={()=>{setCastingSubSection(null);setActiveCastingDeckVersion(null);setActiveCastingTableVersion(null);}} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>{"\u2039"} Back to Casting</button>;

  if (castingSubSection==="deck") {
    const castDeckVersions = castingDeckStore[p.id] || [];
    const addCastDeckNew = () => {
      pushUndo("add casting deck");
      const newId = Date.now();
      const proj = { name: `${p.client||""} | ${p.name}`.replace(/^TEMPLATE \| /,""), client: p.client || "[Client Name]", date: "[Date]", director: "[Director]" };
      const newDeck = { id: newId, label: `${p.name} Casting Deck V${castDeckVersions.length+1}`, project: proj, confirmed: CAST_INIT().confirmed, options: CAST_INIT().options };
      setCastingDeckStore(prev => { const store = JSON.parse(JSON.stringify(prev)); if (!store[p.id]) store[p.id] = []; store[p.id].push(newDeck); return store; });
    };

    if (activeCastingDeckVersion == null) return (
      <div>
        {castingBack}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div style={{fontSize:18,fontWeight:700,color:T.text}}>Casting Deck</div>
          <div style={{position:"relative"}}>
            <button onClick={()=>setCreateMenuOpen(prev=>({...prev,cast:!prev.cast}))} style={{background:T.accent,color:"#fff",border:"none",padding:"8px 20px",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New Casting Deck ▾</button>
            {createMenuOpen.cast&&<div onClick={()=>setCreateMenuOpen(prev=>({...prev,cast:false}))} style={{position:"fixed",inset:0,zIndex:9998}} />}
            {createMenuOpen.cast&&(
              <div style={{position:"absolute",top:36,right:0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:180,overflow:"hidden"}}>
                <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,cast:false}));addCastDeckNew();}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Blank</div>
                <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,cast:false}));setDuplicateModal({type:"casting"});setDuplicateSearch("");}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Existing</div>
              </div>
            )}
          </div>
        </div>
        {castDeckVersions.length===0 ? <div style={{textAlign:"center",padding:40,color:T.muted,fontSize:14}}>No casting deck versions yet. Create one to get started.</div>
        : <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {castDeckVersions.map((v,i)=>(
            <div key={v.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderRadius:12,background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}} onClick={()=>setActiveCastingDeckVersion(i)}>
              <span style={{fontSize:11,fontWeight:700,color:"#fff",background:T.accent,borderRadius:6,padding:"3px 10px"}}>{v.label||`V${i+1}`}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:T.text}}>{v.project?.name||"Untitled"}</div>
                <div style={{fontSize:12,color:T.muted}}>{(v.confirmed||[]).reduce((a,r)=>(a+(r.talent||[]).length),0)} confirmed, {(v.options||[]).reduce((a,r)=>(a+(r.talent||r.entries||[]).length),0)} options</div>
              </div>
              <button onClick={e=>{e.stopPropagation();if(confirm("Delete this casting deck version?")){pushUndo("delete casting deck");setCastingDeckStore(prev=>{const s=JSON.parse(JSON.stringify(prev));s[p.id].splice(i,1);return s;});}}} style={{background:"none",border:"none",color:T.muted,fontSize:18,cursor:"pointer"}} onMouseOver={e=>e.currentTarget.style.color="#c0392b"} onMouseOut={e=>e.currentTarget.style.color=T.muted}>×</button>
            </div>
          ))}
        </div>}
      </div>
    );

    const castIdx = activeCastingDeckVersion;
    const castData = castDeckVersions[castIdx];
    if (!castData) { setActiveCastingDeckVersion(null); return null; }

    const existingCastToken = castData.shareToken;
    const existingCastResourceId = castData.shareResourceId;
    const displayCastShareUrl = castDeckShareUrl || (existingCastToken ? `https://app.onna.digital/api/casting-share?token=${encodeURIComponent(existingCastToken)}` : null);
    const castShareTitle = `ONNA | ${castData.label || "Casting Deck"}`;

    const sendCastShare = async () => {
      if (castDeckShareTabs.size === 0) return;
      setCastDeckShareLoading(true);
      try { if (castDeckRef.current) await castDeckRef.current.share([...castDeckShareTabs], existingCastToken, existingCastResourceId); }
      catch (err) { showAlert("Error: " + err.message); }
      setCastDeckShareLoading(false);
    };
    const toggleCastShareTab = (t) => setCastDeckShareTabs(prev => { const n = new Set(prev); if (n.has(t)) n.delete(t); else n.add(t); return n; });
    const syncCastDeck = async () => {
      setCastDeckShareLoading(true);
      try {
        const tk = existingCastToken || castData.shareToken;
        let fb = null;
        if (tk) {
          try {
            const fbResp = await fetch(`/api/casting-share?token=${encodeURIComponent(tk)}&feedbackOnly=1`);
            if (fbResp.ok) { const fbData = await fbResp.json(); fb = fbData.feedback; }
          } catch {}
        }
        if (castDeckShareTabs.size > 0 && castDeckRef.current) {
          await castDeckRef.current.share([...castDeckShareTabs], existingCastToken, existingCastResourceId);
        }
        if (tk && fb && typeof fb === "object" && Object.keys(fb).length > 0) {
          try { await fetch("/api/casting-share", { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({token: tk, feedback: fb}) }); } catch {}
        }
        if (fb && typeof fb === "object") {
          setCastingDeckStore(prev => {
            const s = JSON.parse(JSON.stringify(prev));
            const cd = s[p.id] && s[p.id][castIdx];
            if (!cd) return s;
            let gi = 0;
            const applyToRoles = (roles) => { if (!roles) return; for (const role of roles) { const talent = role.talent || []; for (let ti = 0; ti < talent.length; ti++) { const key = "c" + gi; if (fb[key] && fb[key].status) { talent[ti].status = fb[key].status; } gi++; } } };
            applyToRoles(cd.confirmed);
            applyToRoles(cd.options);
            return s;
          });
        }
      } catch (err) { showAlert("Sync error: " + err.message); }
      setCastDeckShareLoading(false);
    };

    return (
      <div>
        {castingBack}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>CASTING</span>
            <input value={castData.label||""} onChange={e=>{setCastingDeckStore(prev=>{const s=JSON.parse(JSON.stringify(prev));s[p.id][castIdx].label=e.target.value;return s;});}} style={{fontSize:14,fontWeight:600,color:T.text,background:"transparent",border:"none",outline:"none",fontFamily:"inherit",padding:0}} placeholder="Version label"/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            {["confirmed","options"].map(t => (
              <label key={t} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,color:castDeckShareTabs.has(t)?"#1565C0":"#999",cursor:"pointer",userSelect:"none"}}>
                <input type="checkbox" checked={castDeckShareTabs.has(t)} onChange={()=>toggleCastShareTab(t)} style={{accentColor:"#1976D2"}}/>
                {t.charAt(0).toUpperCase()+t.slice(1)}
              </label>
            ))}
            <button onClick={existingCastToken ? syncCastDeck : sendCastShare} disabled={castDeckShareLoading||castDeckShareTabs.size===0} style={{padding:"5px 16px",borderRadius:8,background:existingCastToken?"#1976D2":"#1d1d1f",color:"#fff",border:"none",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:(castDeckShareLoading||castDeckShareTabs.size===0)?0.5:1}}>
              {castDeckShareLoading ? "Syncing\u2026" : existingCastToken ? "Sync" : "Generate Link"}
            </button>
          </div>
        </div>
        {displayCastShareUrl && (
          <div style={{background:"#e3f2fd",border:"1px solid #90caf9",borderRadius:10,padding:"14px 18px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,color:"#1565C0",marginBottom:8}}>{castShareTitle}</div>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <a href={displayCastShareUrl} target="_blank" rel="noopener noreferrer" style={{flex:1,minWidth:200,padding:"6px 10px",borderRadius:7,border:"1px solid #90caf9",fontSize:11.5,fontFamily:"inherit",color:"#1565C0",background:"#fff",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{displayCastShareUrl}</a>
              <button onClick={()=>{navigator.clipboard.writeText(`${castShareTitle}\n${displayCastShareUrl}`);}} style={{padding:"5px 13px",borderRadius:8,background:"#1d1d1f",color:"#fff",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Copy</button>
            </div>
          </div>
        )}
        <div style={{overflowX:"auto",marginLeft:-20,marginRight:-20,paddingLeft:20,paddingRight:20}}>
          <CastingConnie
            ref={castDeckRef}
            initialProject={castData.project}
            initialConfirmed={castData.confirmed}
            initialOptions={castData.options}
            onChangeProject={proj => setCastingDeckStore(prev => { const s = JSON.parse(JSON.stringify(prev)); s[p.id][castIdx].project = proj; return s; })}
            onChangeConfirmed={conf => setCastingDeckStore(prev => { const s = JSON.parse(JSON.stringify(prev)); s[p.id][castIdx].confirmed = conf; return s; })}
            onChangeOptions={opts => setCastingDeckStore(prev => { const s = JSON.parse(JSON.stringify(prev)); s[p.id][castIdx].options = opts; return s; })}
            onShareUrl={(url, token, id) => { setCastDeckShareUrl(url); setCastingDeckStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if (s[p.id] && s[p.id][castIdx]) { s[p.id][castIdx].shareToken = token; s[p.id][castIdx].shareResourceId = id; } return s; }); }}
          />
        </div>
      </div>
    );
  }

  if (castingSubSection==="files") {
    return (
      <div>
        {castingBack}
        <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:4}}>Casting Files</div>
        <p style={{fontSize:12.5,color:T.muted,marginBottom:18}}>Upload casting files or paste a Dropbox / Drive link to import.</p>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Dropbox / Drive Link</div>
          <div style={{display:"flex",gap:10}}>
            <input value={castLink} onChange={e=>setProjectCreativeLinks(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),casting:e.target.value}}))} placeholder="https://www.dropbox.com/sh/..." style={{flex:1,padding:"9px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
            {castLink&&<button disabled={linkUploading} onClick={()=>uploadFromLink(castLink,"casting")} style={{display:"flex",alignItems:"center",padding:"9px 18px",borderRadius:10,background:linkUploading?"#999":T.accent,color:"#fff",fontSize:13,fontWeight:600,border:"none",cursor:linkUploading?"default":"pointer",flexShrink:0,fontFamily:"inherit"}}>{linkUploading?"Uploading\u2026":"Upload"}</button>}
          </div>
          {linkUploadProgress!==null&&<div style={{marginTop:8}}><div style={{height:6,borderRadius:3,background:"#e5e5ea",overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:linkUploadProgress===100?"#34c759":T.accent,width:`${linkUploadProgress}%`,transition:"width 0.3s ease"}}/></div><div style={{fontSize:11,color:T.muted,marginTop:4}}>{linkUploadProgress===100?"Complete!":linkUploadProgress<50?"Sending\u2026":"Downloading\u2026"} {linkUploadProgress}%</div></div>}
        </div>
        <UploadZone label="Upload casting files (PDF, images, comp cards)" files={[]} onAdd={async fileList=>{const ne=[];for(const f of fileList){if(f.size>40*1024*1024){showAlert(f.name+" is over 40 MB.");continue;}const data=await new Promise(r=>{const fr=new FileReader();fr.onload=e=>r(e.target.result);fr.readAsDataURL(f);});ne.push({id:Date.now()+Math.random(),name:f.name,size:f.size,type:f.type,data,createdAt:Date.now()});}if(ne.length>0)setProjectFileStore(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),casting:[...((prev[p.id]||{}).casting||[]),...ne]}}));}}/>
        {castFiles.length>0&&(()=>{const filteredCast=castFileSearchTerm.trim()?castFiles.filter(f=>f.name.toLowerCase().includes(castFileSearchTerm.trim().toLowerCase())):castFiles;return<>
            <input value={castFileSearchTerm} onChange={e=>setCastFileSearchTerm(e.target.value)} placeholder="Search casting files\u2026" style={{width:"100%",padding:"9px 14px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",marginTop:16,marginBottom:8,boxSizing:"border-box"}}/>
            <div style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,marginTop:6,marginBottom:6}}>{filteredCast.length} file{filteredCast.length!==1?"s":""}{castFileSearchTerm.trim()?" found":" uploaded"}</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14}}>
              {filteredCast.map((f,i)=>(<div key={f.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:12,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
                  <span style={{fontSize:11,fontWeight:700,color:"#fff",background:T.accent,borderRadius:6,padding:"3px 8px",flexShrink:0}}>V{i+1}</span>
                  <span style={{fontSize:15,flexShrink:0}}>{f.type?.includes("pdf")?"\ud83d\udcc4":f.type?.includes("image")?"\ud83d\uddbc":"\ud83d\udcce"}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:T.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:1}}>{(f.size/1024).toFixed(0)} KB \u00b7 {new Date(f.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
                  </div>
                  <button onClick={()=>{const a=document.createElement("a");a.href=f.data;a.download=f.name;a.click();}} style={{background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Download</button>
                  <button onClick={()=>{if(confirm("Delete V"+(i+1)+" - "+f.name+"?"))setProjectFileStore(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),casting:((prev[p.id]||{}).casting||[]).filter(x=>x.id!==f.id)}}));}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:"0 4px",lineHeight:1,flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#c0392b"} onMouseOut={e=>e.currentTarget.style.color=T.muted}>\u00d7</button>
                </div>))}
            </div>
          </>;})()}
      </div>
    );
  }

  /* Default: Casting Table sub-section */
  if (castingSubSection==="tables") {
    const ctVersions = Array.isArray(castingTableStore[p.id]) ? castingTableStore[p.id] : [];
    const addCTNew = () => {
      pushUndo("add casting table");
      const newId = Date.now();
      const proj = { name: `${p.client||""} | ${p.name}`.replace(/^TEMPLATE \| /,""), client: p.client || "[Client Name]", date: "[Date]", casting: "[Casting Director]" };
      const newCT = { id: newId, label: `${p.name} Casting Table V${ctVersions.length+1}`, project: proj, roles: [ctMkRole(), ctMkRole()] };
      setCastingTableStore(prev => { const store = JSON.parse(JSON.stringify(prev)); if (!Array.isArray(store[p.id])) store[p.id] = []; store[p.id].push(newCT); return store; });
    };
    const deleteCT = (idx) => {
      if (!confirm("Delete this Casting Table? This will be moved to Deleted.")) return;
      pushUndo("delete casting table");
      const ctDelData = JSON.parse(JSON.stringify((castingTableStore[p.id]||[])[idx]));
      if (ctDelData) archiveItem('casting_table', { projectId: p.id, castingTable: ctDelData });
      setCastingTableStore(prev => { const store = JSON.parse(JSON.stringify(prev)); const arr = store[p.id] || []; arr.splice(idx, 1); store[p.id] = arr; return store; });
      setActiveCastingTableVersion(null);
    };

    // List view
    if (activeCastingTableVersion === null || ctVersions.length === 0) {
      return (
        <div>
          {castingBack}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{fontSize:16,fontWeight:700,color:T.text}}>Casting Table</div>
            <div style={{position:"relative"}}>
              <button onClick={()=>setCreateMenuOpen(prev=>({...prev,ct:!prev.ct}))} style={{padding:"7px 16px",borderRadius:9,background:T.accent,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New Casting Table ▾</button>
              {createMenuOpen.ct&&<div onClick={()=>setCreateMenuOpen(prev=>({...prev,ct:false}))} style={{position:"fixed",inset:0,zIndex:9998}} />}
              {createMenuOpen.ct&&(
                <div style={{position:"absolute",top:36,right:0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:180,overflow:"hidden"}}>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,ct:false}));addCTNew();}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Blank</div>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,ct:false}));setDuplicateModal({type:"casting_table"});setDuplicateSearch("");}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Existing</div>
                </div>
              )}
            </div>
          </div>
          {ctVersions.length===0 && <div style={{borderRadius:14,background:"#fafafa",border:`1.5px dashed ${T.border}`,padding:44,textAlign:"center"}}><div style={{fontSize:13,color:T.muted}}>No casting tables yet. Click "+ New Casting Table" to get started.</div></div>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {ctVersions.map((ct,i) => {
              const totalModels = (ct.roles||[]).reduce((s,r) => s + (r.models||[]).length, 0);
              const confirmedModels = (ct.roles||[]).reduce((s,r) => s + (r.models||[]).filter(m=>m.option==="Confirmed").length, 0);
              return (
                <div key={ct.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border-color 0.15s"}} onClick={()=>setActiveCastingTableVersion(i)} onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>CASTING TABLE</span>
                      <span style={{fontSize:8,fontWeight:600,letterSpacing:0.5,background:confirmedModels>0?"#e8f5e9":"#f5f5f5",color:confirmedModels>0?"#2e7d32":"#999",padding:"2px 8px",borderRadius:4}}>{totalModels} models {"·"} {confirmedModels} confirmed</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:T.text}}>{ct.label||"Untitled"}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>{ct.project?.name||"No project name"}</div>
                  </div>
                  <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>deleteCT(i)} style={{background:"none",border:"none",fontSize:16,color:"#ccc",cursor:"pointer",padding:4}} onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="#ccc"}>{"×"}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Detail view
    const ctIdx = activeCastingTableVersion;
    const ctData = ctVersions[ctIdx];
    if (!ctData) { setActiveCastingTableVersion(null); return null; }

    const ctBack = <button onClick={()=>setActiveCastingTableVersion(null)} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>{"‹"} Back to Casting Table list</button>;

    const ctShareTitle = `ONNA | ${ctData.label || "Casting Table"}`;
    const existingCtToken = ctData.shareToken || null;
    const displayCtShareUrl = ctShareUrl || (existingCtToken ? `https://app.onna.digital/api/casting-share?token=${encodeURIComponent(existingCtToken)}` : null);
    const sendCtShare = async () => {
      setCtShareLoading(true);
      try {
        if (ctRef.current) await ctRef.current.share([], existingCtToken, ctData.shareResourceId);
      } catch (err) { showAlert("Error: " + err.message); }
      setCtShareLoading(false);
    };
    return (
      <div>
        {ctBack}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>CASTING TABLE</span>
            <input value={ctData.label||""} onChange={e=>{setCastingTableStore(prev=>{const s=JSON.parse(JSON.stringify(prev));s[p.id][ctIdx].label=e.target.value;return s;});}} style={{fontSize:14,fontWeight:600,color:T.text,background:"transparent",border:"none",outline:"none",fontFamily:"inherit",padding:0}} placeholder="Version label"/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={sendCtShare} disabled={ctShareLoading} style={{padding:"5px 16px",borderRadius:8,background:existingCtToken?"#1976D2":"#1d1d1f",color:"#fff",border:"none",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:ctShareLoading?0.5:1}}>
              {ctShareLoading ? "Generating…" : existingCtToken ? "Sync" : "Generate Link"}
            </button>
          </div>
        </div>
        {displayCtShareUrl && (
          <div style={{background:"#e3f2fd",border:"1px solid #90caf9",borderRadius:10,padding:"14px 18px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,color:"#1565C0",marginBottom:8}}>{ctShareTitle}</div>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <a href={displayCtShareUrl} target="_blank" rel="noopener noreferrer" style={{flex:1,minWidth:200,padding:"6px 10px",borderRadius:7,border:"1px solid #90caf9",fontSize:11.5,fontFamily:"inherit",color:"#1565C0",background:"#fff",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{displayCtShareUrl}</a>
              <button onClick={()=>{navigator.clipboard.writeText(`${ctShareTitle}\n${displayCtShareUrl}`);}} style={{padding:"5px 13px",borderRadius:8,background:"#1d1d1f",color:"#fff",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Copy</button>
            </div>
          </div>
        )}
        <div id="onna-ct-print">
          <CastingTableConnie
            ref={ctRef}
            initialProject={ctData.project}
            initialRoles={ctData.roles}
            onChangeProject={proj => setCastingTableStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if(s[p.id]&&s[p.id][ctIdx]) s[p.id][ctIdx].project = proj; return s; })}
            onChangeRoles={rls => setCastingTableStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if(s[p.id]&&s[p.id][ctIdx]) s[p.id][ctIdx].roles = rls; return s; })}
            onShareUrl={(url, token, id) => { setCtShareUrl(url); setCastingTableStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if (s[p.id] && s[p.id][ctIdx]) { s[p.id][ctIdx].shareToken = token; s[p.id][ctIdx].shareResourceId = id; } return s; }); }}
          />
        </div>
      </div>
    );
  }

  /* Default: old casting tables fallback */
  return (
    <div>
      {castingSubSection==="tables"&&castingBack}
      <div style={{textAlign:"center",padding:40,color:"#999"}}>Select a casting sub-section.</div>
    </div>
  );
}
