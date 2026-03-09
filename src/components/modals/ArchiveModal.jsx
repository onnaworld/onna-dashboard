import React from "react";

export function ArchiveModal({ T, showArchive, setShowArchive, archive, setArchive, restoreItem, permanentlyDelete }) {
  return (
    <div className="modal-bg" onClick={()=>setShowArchive(false)}>
      <div style={{borderRadius:20,padding:28,width:680,maxWidth:"94vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"85vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22,flexShrink:0}}>
          <div>
            <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Deleted Items</div>
            <div style={{fontSize:12,color:T.muted,marginTop:2}}>Deleted items are permanently removed after 30 days</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {archive.length>0&&<button onClick={()=>{if(window.confirm("Permanently remove all deleted items?"))setArchive(()=>{try{localStorage.removeItem('onna_archive');}catch{}return [];});}} style={{background:"none",border:"none",color:T.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:0}}>Clear all</button>}
            <button onClick={()=>setShowArchive(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {archive.length===0?(
            <div style={{padding:"48px 0",textAlign:"center",color:T.muted,fontSize:13}}>No deleted items.</div>
          ):(
            ["todos","notes","dashNotes","leads","vendors","outreach","estimates","projects"].map(table=>{
              const entries = archive.filter(e=>e.table===table);
              if (!entries.length) return null;
              const label = {todos:"Tasks",notes:"Notes",dashNotes:"Dashboard Notes",leads:"Leads",vendors:"Vendors",outreach:"Outreach",estimates:"Estimates",projects:"Projects"}[table]||table;
              return (
                <div key={table} style={{marginBottom:24}}>
                  <div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>{label} ({entries.length})</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {entries.map(entry=>{
                      const it = entry.item;
                      const name = table==='estimates'?(it.estimate?.ts?.version||"Estimate"):table==='todos'?(it.text||"Task"):table==='dashNotes'?(it.title||"Untitled Note"):table==='notes'?(it.title||"Untitled Note"):table==='projects'?(it.name||"Project"):(it.company||it.name||"—");
                      const sub = table==='estimates'?(it.estimate?.ts?.project||""):table==='todos'?(it.tab==="onna"?"ONNA":it.tab==="personal"?"Personal":"Project"):table==='dashNotes'?"":(it.contact||it.clientName||it.category||it.client||"");
                      const deleted = new Date(entry.deletedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
                      return (
                        <div key={entry.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.borderSub}`}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                            {sub&&<div style={{fontSize:11.5,color:T.muted,marginTop:1}}>{sub}</div>}
                          </div>
                          <div style={{fontSize:11,color:T.muted,flexShrink:0}}>{(()=>{const days=Math.max(0,30-Math.floor((Date.now()-new Date(entry.deletedAt).getTime())/(24*60*60*1000)));return days<=7?<span style={{color:"#c0392b"}}>{days}d left</span>:<span>{days}d left</span>;})()}</div>
                          <button onClick={()=>restoreItem(entry)} style={{background:"#edfaf3",border:"none",color:"#147d50",padding:"5px 12px",borderRadius:7,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Restore</button>
                          <button onClick={()=>{if(window.confirm(`Permanently delete ${name}?`))permanentlyDelete(entry.id);}} style={{background:"none",border:"none",color:T.muted,fontSize:16,cursor:"pointer",padding:0,flexShrink:0}}>×</button>
                        </div>
                      ); })}
                  </div>
                </div>
              ); })
          )}
        </div>
      </div>
    </div>
  );
}
