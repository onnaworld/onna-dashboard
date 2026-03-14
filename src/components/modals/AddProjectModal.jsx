import React from "react";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function AddProjectModal({ T, isMobile, BtnPrimary, BtnSecondary, Sel, showAddProject, setShowAddProject, newProject, setNewProject, api, setLocalProjects }) {
  return (
    <div className="modal-bg" onClick={()=>setShowAddProject(false)}>
      <div style={{borderRadius:20,padding:28,width:480,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>New Project</div>
          <button onClick={()=>setShowAddProject(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:18}}>
          {[["Client","client"],["Project Name","name"],["Revenue (AED)","revenue"],["Cost (AED)","cost"]].map(([label,key])=>(
            <div key={key}>
              <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>{label}</div>
              <input value={newProject[key]} onChange={e=>setNewProject(p=>({...p,[key]:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
            </div>
          ))}
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Status</div>
            <Sel value={newProject.status} onChange={v=>setNewProject(p=>({...p,status:v}))} options={["Active","In Review","Completed"]}/>
          </div>
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Month / Year</div>
            <div style={{display:"flex",gap:6}}>
              <select value={newProject.month||new Date().getMonth()+1} onChange={e=>setNewProject(p=>({...p,month:Number(e.target.value)}))}
                style={{flex:1,padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",cursor:"pointer"}}>
                {MONTH_LABELS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <select value={newProject.year||new Date().getFullYear()} onChange={e=>setNewProject(p=>({...p,year:Number(e.target.value)}))}
                style={{width:85,padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",cursor:"pointer"}}>
                {[2024,2025,2026,2027,2028].map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <BtnSecondary onClick={()=>setShowAddProject(false)}>Cancel</BtnSecondary>
          <BtnPrimary onClick={async()=>{if(!newProject.client||!newProject.name)return;const saved=await api.post("/api/projects",{...newProject,revenue:Number(newProject.revenue)||0,cost:Number(newProject.cost)||0,month:newProject.month||new Date().getMonth()+1});if(saved.id)setLocalProjects(prev=>[...prev,saved]);setNewProject({client:"",name:"",revenue:"",cost:"",status:"Active",year:new Date().getFullYear(),month:new Date().getMonth()+1});setShowAddProject(false);}}>Save Project</BtnPrimary>
        </div>
      </div>
    </div>
  );
}
