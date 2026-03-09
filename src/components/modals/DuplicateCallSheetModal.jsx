import React from "react";

export function DuplicateCallSheetModal({ csDuplicateModal, setCsDuplicateModal, csDuplicateSearch, setCsDuplicateSearch, callSheetStore, setCallSheetStore, localProjects, archivedProjects, selectedProject, pushUndo }) {
    const q=csDuplicateSearch.toLowerCase().trim();
    // Gather all call sheets: active + archived
    const results=[];
    // Active
    Object.entries(callSheetStore||{}).forEach(([pid,sheets])=>{
      const proj=localProjects?.find(p=>p.id===pid)||(archivedProjects||[]).find(p=>p.id===pid);
      const projName=proj?.name||"Unknown Project";
      const client=proj?.client||"";
      (sheets||[]).forEach((cs,idx)=>{
        const crewCount=(cs.departments||[]).reduce((sum,d)=>(d.crew||[]).length+sum,0);
        results.push({cs,projName,client,projectId:pid,label:cs.label||"Untitled",date:cs.date||"",crewCount,source:"active"});
      });
    });
    // Filter
    const filtered=q?results.filter(r=>[r.projName,r.client,r.label,r.cs.shootName||""].some(s=>(s||"").toLowerCase().includes(q))):results;
    // Group by project
    const grouped={};
    filtered.forEach(r=>{const key=r.projName+(r.client?" | "+r.client:"");if(!grouped[key])grouped[key]=[];grouped[key].push(r);});
    // Duplicate handler
    const handleDuplicate=(r)=>{
      const clone=JSON.parse(JSON.stringify(r.cs));
      clone.id=Date.now();
      const _pid=csDuplicateModal.origin==="connie"?csDuplicateModal.projectId:selectedProject?.id;
      const _proj=localProjects?.find(p=>p.id===_pid)||(archivedProjects||[]).find(p=>p.id===_pid);
      const _pName=_proj?.name||"";
      if(_pid){
        pushUndo("duplicate call sheet");
        setCallSheetStore(prev=>{const store=JSON.parse(JSON.stringify(prev));if(!store[_pid])store[_pid]=[];clone.label=`${_pName} Call Sheet V${store[_pid].length+1}`;store[_pid].push(clone);return store;});
      }
      setCsDuplicateModal(null);setCsDuplicateSearch("");
    };
    return(
      <div onClick={()=>{setCsDuplicateModal(null);setCsDuplicateSearch("");}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:18,width:500,maxWidth:"94vw",maxHeight:"70vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.18)",overflow:"hidden"}}>
          <div style={{padding:"20px 24px 0",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:16,fontWeight:700,color:"#1d1d1f",letterSpacing:"-0.02em"}}>Duplicate Existing Call Sheet</div>
              <button onClick={()=>{setCsDuplicateModal(null);setCsDuplicateSearch("");}} style={{background:"#f5f5f7",border:"none",color:"#86868b",width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <input value={csDuplicateSearch} onChange={e=>setCsDuplicateSearch(e.target.value)} placeholder="Search by project, client, or call sheet name..." autoFocus style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid #e0e0e0",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:12}} />
          </div>
          <div style={{overflowY:"auto",flex:1,padding:"0 24px 20px"}}>
            {Object.keys(grouped).length===0?(
              <div style={{textAlign:"center",padding:"32px 0",color:"#86868b",fontSize:13}}>No call sheets found{q?" matching your search":""}.</div>
            ):Object.entries(grouped).map(([groupKey,items])=>(
              <div key={groupKey} style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:"#86868b",letterSpacing:0.5,textTransform:"uppercase",marginBottom:6,padding:"4px 0"}}>{groupKey}</div>
                {items.map((r,ri)=>(
                  <div key={ri} onClick={()=>handleDuplicate(r)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,border:"1px solid #e8e8e8",marginBottom:6,cursor:"pointer",transition:"border-color 0.15s,background 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#c47090";e.currentTarget.style.background="#fff5f7";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e8e8e8";e.currentTarget.style.background="transparent";}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#1d1d1f",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.label}</div>
                      <div style={{fontSize:11,color:"#86868b",marginTop:2}}>{r.date||"No date"} · {r.crewCount} crew</div>
                    </div>
                    <div style={{fontSize:11,color:"#c47090",fontWeight:600,flexShrink:0}}>Duplicate</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
}
