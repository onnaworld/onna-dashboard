import React from "react";

export function TodoModal({ T, isMobile, BtnPrimary, Sel, selectedTodo, setSelectedTodo, allProjectsMerged, pushUndo, archiveItem, setProjectTodos, setTodos }) {
  return (
    <div className="modal-bg" onClick={()=>setSelectedTodo(null)}>
      <div style={{borderRadius:20,padding:28,width:500,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Task Details</div>
          <button onClick={()=>setSelectedTodo(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Task</div>
          <input value={selectedTodo.text} onChange={e=>{const u={...selectedTodo,text:e.target.value};setSelectedTodo(u);if(u._source==="project"){setProjectTodos(prev=>({...prev,[u.projectId]:(prev[u.projectId]||[]).map(x=>x.id===u.id?u:x)}));}else{setTodos(prev=>prev.map(t=>t.id===u.id?u:t));}}} style={{width:"100%",padding:"10px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:14,fontFamily:"inherit"}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:14}}>
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Tab</div>
            <Sel value={selectedTodo._source==="project"?"project":"onna"} onChange={v=>{const oldSource=selectedTodo._source;if(v==="onna"){const u={...selectedTodo,tab:"onna",_source:"general",subType:selectedTodo.subType};setSelectedTodo(u);if(oldSource==="project"){setProjectTodos(prev=>({...prev,[selectedTodo.projectId]:(prev[selectedTodo.projectId]||[]).filter(x=>x.id!==selectedTodo.id)}));setTodos(prev=>[...prev,u]);}else{setTodos(prev=>prev.map(t=>t.id===u.id?u:t));}}else if(v==="project"){const firstActive=allProjectsMerged.find(p=>p.status==="Active");if(!firstActive)return;const pid=selectedTodo._source==="project"?selectedTodo.projectId:firstActive.id;const u={...selectedTodo,_source:"project",projectId:pid};setSelectedTodo(u);if(oldSource!=="project"){setTodos(prev=>prev.filter(t=>t.id!==selectedTodo.id));setProjectTodos(prev=>({...prev,[pid]:[...(prev[pid]||[]),{id:u.id,text:u.text,done:u.done,details:u.details||""}]}));}}}} options={[{value:"onna",label:"ONNA"},{value:"project",label:"Projects"}]}/>
          </div>
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Category</div>
            <Sel value={selectedTodo._source==="project"?String(selectedTodo.projectId):(selectedTodo.subType||"none")} onChange={v=>{if(selectedTodo._source==="project"){const pid=Number(v);if(pid===selectedTodo.projectId)return;const u={...selectedTodo,projectId:pid};setSelectedTodo(u);setProjectTodos(prev=>{const updated={...prev};updated[selectedTodo.projectId]=(updated[selectedTodo.projectId]||[]).filter(x=>x.id!==selectedTodo.id);updated[pid]=[...(updated[pid]||[]),{id:u.id,text:u.text,done:u.done,details:u.details||""}];return updated;});}else{const u={...selectedTodo,subType:v==="none"?undefined:v};setSelectedTodo(u);setTodos(prev=>prev.map(t=>t.id===u.id?u:t));}}} options={selectedTodo._source==="project"?allProjectsMerged.filter(p=>p.status==="Active").map(p=>({value:String(p.id),label:p.name})):[{value:"none",label:"Unassigned"},{value:"monday",label:"Monday"},{value:"tuesday",label:"Tuesday"},{value:"wednesday",label:"Wednesday"},{value:"thursday",label:"Thursday"},{value:"friday",label:"Friday"},{value:"saturday",label:"Saturday"},{value:"sunday",label:"Sunday"},{value:"longterm",label:"Long Term"}]}/>
          </div>
        </div>
        <div style={{marginBottom:22}}>
          <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Additional Notes</div>
          <textarea value={selectedTodo.details||""} onChange={e=>{const u={...selectedTodo,details:e.target.value};setSelectedTodo(u);if(u._source==="project"){setProjectTodos(prev=>({...prev,[u.projectId]:(prev[u.projectId]||[]).map(x=>x.id===u.id?u:x)}));}else{setTodos(prev=>prev.map(t=>t.id===u.id?u:t));}}} rows={4} placeholder="Add notes, links, context…" style={{width:"100%",padding:"10px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <button onClick={()=>{pushUndo('delete task');archiveItem('todos',selectedTodo);if(selectedTodo._source==="project"){setProjectTodos(prev=>({...prev,[selectedTodo.projectId]:(prev[selectedTodo.projectId]||[]).filter(x=>x.id!==selectedTodo.id)}));}else{setTodos(prev=>prev.filter(t=>t.id!==selectedTodo.id));}setSelectedTodo(null);}} style={{padding:"8px 16px",borderRadius:10,background:"#fff0f0",border:"1px solid #ffd0d0",color:"#c0392b",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>Delete task</button>
          <BtnPrimary onClick={()=>setSelectedTodo(null)}>Done</BtnPrimary>
        </div>
      </div>
    </div>
  );
}
