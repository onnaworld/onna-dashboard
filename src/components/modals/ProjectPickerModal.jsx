import React from "react";

export function ProjectPickerModal({ T, pendingProjectTask, setPendingProjectTask, allProjectsMerged, pushUndo, setProjectTodos }) {
  return (
    <div className="modal-bg" onClick={()=>setPendingProjectTask(null)}>
      <div style={{borderRadius:16,padding:24,width:340,maxWidth:"90vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:4}}>Select Project</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:16}}>Which project should this task go under?</div>
        <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:220,overflowY:"auto"}}>
          {allProjectsMerged.filter(p=>p.status==="Active").map(p=>(
            <button key={p.id} onClick={()=>{pushUndo('add project task');setProjectTodos(prev=>({...prev,[p.id]:[...(prev[p.id]||[]),{id:Date.now(),text:pendingProjectTask,done:false,details:""}]}));setPendingProjectTask(null);}} style={{padding:"10px 14px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all 0.12s"}} onMouseEnter={e=>{e.currentTarget.style.background=T.accent;e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor=T.accent;}} onMouseLeave={e=>{e.currentTarget.style.background="#fafafa";e.currentTarget.style.color=T.text;e.currentTarget.style.borderColor=T.border;}}>
              <div>{p.name}</div>
              <div style={{fontSize:10,opacity:0.7,marginTop:1}}>{p.client}</div>
            </button>
          ))}
        </div>
        <button onClick={()=>setPendingProjectTask(null)} style={{marginTop:14,width:"100%",padding:"8px 0",borderRadius:10,background:"none",border:`1px solid ${T.border}`,color:T.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
      </div>
    </div>
  );
}
