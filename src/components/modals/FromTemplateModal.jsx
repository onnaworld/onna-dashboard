import React from "react";

export function FromTemplateModal({ T, isMobile, BtnPrimary, BtnSecondary, Sel, showFromTemplate, setShowFromTemplate, templateProject, setTemplateProject, api, setLocalProjects, allProjectsMerged, callSheetStore, setCallSheetStore, riskAssessmentStore, setRiskAssessmentStore, contractDocStore, setContractDocStore, projectEstimates, setProjectEstimates, projectTodos, setProjectTodos, projectNotes, setProjectNotes, getProjectCastingTables, setProjectCasting, projectInfo, setProjectInfo, projectCreativeLinks, setProjectCreativeLinks, projectFileStore, setProjectFileStore, projectActuals, setProjectActuals, setSelectedProject, setProjectSection }) {
  return (
    <div className="modal-bg" onClick={()=>setShowFromTemplate(false)}>
      <div style={{borderRadius:20,padding:28,width:480,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>New Project from Template</div>
          <button onClick={()=>setShowFromTemplate(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{fontSize:12,color:T.muted,marginBottom:18}}>Creates a new project with all template structures (risk assessments, call sheets, contracts, estimates) pre-loaded.</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:18}}>
          {[["Client Name","client"],["Project Name","name"],["Revenue (AED)","revenue"],["Cost (AED)","cost"]].map(([label,key])=>(
            <div key={key}>
              <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>{label}</div>
              <input value={templateProject[key]} onChange={e=>setTemplateProject(p=>({...p,[key]:e.target.value}))} placeholder={key==="client"?"e.g. Columbia / IMA":key==="name"?"e.g. Ramadan Activation 2026":""} style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
            </div>
          ))}
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Status</div>
            <Sel value={templateProject.status} onChange={v=>setTemplateProject(p=>({...p,status:v}))} options={["Active","In Review","Completed"]}/>
          </div>
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Year</div>
            <Sel value={String(templateProject.year)} onChange={v=>setTemplateProject(p=>({...p,year:Number(v)}))} options={(()=>{try{const s=localStorage.getItem("onna_available_years");return s?JSON.parse(s).sort().map(String):["2025","2026"];}catch{return ["2025","2026"];}})()}/>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <BtnSecondary onClick={()=>setShowFromTemplate(false)}>Cancel</BtnSecondary>
          <BtnPrimary onClick={async()=>{
            if(!templateProject.client||!templateProject.name)return;
            const saved=await api.post("/api/projects",{...templateProject,revenue:Number(templateProject.revenue)||0,cost:Number(templateProject.cost)||0});
            if(!saved.id)return;
            setLocalProjects(prev=>[...prev,saved]);
            const tplId=allProjectsMerged.find(p=>p.client==="TEMPLATE")?.id;
            if(tplId){
              const tplCS=callSheetStore?.[tplId];
              if(tplCS&&tplCS.length>0) setCallSheetStore(prev=>({...prev,[saved.id]:JSON.parse(JSON.stringify(tplCS))}));
              const tplRA=riskAssessmentStore?.[tplId];
              if(tplRA&&tplRA.length>0) setRiskAssessmentStore(prev=>({...prev,[saved.id]:JSON.parse(JSON.stringify(tplRA))}));
              const tplCT=contractDocStore?.[tplId];
              if(tplCT&&tplCT.length>0) setContractDocStore(prev=>({...prev,[saved.id]:JSON.parse(JSON.stringify(tplCT))}));
              const tplEst=projectEstimates?.[tplId];
              if(tplEst&&tplEst.length>0){const cloned=JSON.parse(JSON.stringify(tplEst));cloned.forEach(e=>{if(e.ts){e.ts.client=saved.client||e.ts.client;e.ts.project=saved.name||e.ts.project;}});setProjectEstimates(prev=>({...prev,[saved.id]:cloned}));}
              const tplTodos=projectTodos?.[tplId];
              if(tplTodos&&tplTodos.length>0) setProjectTodos(prev=>({...prev,[saved.id]:JSON.parse(JSON.stringify(tplTodos)).map(t=>({...t,done:false}))}));
              const noteKeys=["_prodsched","_preprod","_postprod"];
              const noteUpdates={};noteKeys.forEach(k=>{const v=projectNotes[tplId+k];if(v)noteUpdates[saved.id+k]=v;});
              if(Object.keys(noteUpdates).length>0) setProjectNotes(prev=>({...prev,...noteUpdates}));
              const tplCastTables=getProjectCastingTables(tplId);
              if(tplCastTables.some(t=>t.rows.length>0)) setProjectCasting(prev=>({...prev,[saved.id]:JSON.parse(JSON.stringify(tplCastTables))}));
              const tplInfo=projectInfo?.[tplId];
              if(tplInfo&&Object.keys(tplInfo).length>0) setProjectInfo(prev=>({...prev,[saved.id]:JSON.parse(JSON.stringify(tplInfo))}));
              const tplLinks=projectCreativeLinks?.[tplId];
              if(tplLinks&&Object.keys(tplLinks).length>0) setProjectCreativeLinks(prev=>({...prev,[saved.id]:JSON.parse(JSON.stringify(tplLinks))}));
              const tplFiles=projectFileStore?.[tplId];
              if(tplFiles&&Object.keys(tplFiles).length>0) setProjectFileStore(prev=>({...prev,[saved.id]:JSON.parse(JSON.stringify(tplFiles))}));
              const tplActuals=projectActuals?.[tplId];
              if(tplActuals&&tplActuals.length>0){const cloned=JSON.parse(JSON.stringify(tplActuals));cloned.forEach(s=>s.rows.forEach(r=>{r.expenses=[];r.zohoAmount="0";r.status="";}));setProjectActuals(prev=>({...prev,[saved.id]:cloned}));}
            }
            setTemplateProject({client:"",name:"",revenue:"",cost:"",status:"Active",year:2026});
            setShowFromTemplate(false);
            setSelectedProject(saved);setProjectSection("Home");
          }}>Create Project</BtnPrimary>
        </div>
      </div>
    </div>
  );
}
