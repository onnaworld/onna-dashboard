import React from "react";

export function AddLeadModal({ T, isMobile, BtnPrimary, BtnSecondary, Sel, LocationPicker, showAddLead, setShowAddLead, newLead, setNewLead, api, setLocalLeads, addNewOption, customLeadCats, setCustomLeadCats, allLeadCats, allLocations, customLocations, setCustomLocations, OUTREACH_STATUSES, OUTREACH_STATUS_LABELS }) {
  return (
    <div className="modal-bg" onClick={()=>setShowAddLead(false)}>
      <div style={{borderRadius:isMobile?"20px 20px 0 0":20,padding:isMobile?"24px 20px":28,width:isMobile?"100%":520,maxWidth:isMobile?"100%":"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>New Lead</div>
          <button onClick={()=>setShowAddLead(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:18}}>
          {[["Company","company"],["Contact Name","contact"],["Role","role"],["Email","email"],["Phone","phone"],["Date Contacted","date"],["Value (AED)","value"]].map(([label,key])=>(
            <div key={key}>
              <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>{label}</div>
              <input value={newLead[key]} onChange={e=>setNewLead(p=>({...p,[key]:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
            </div>
          ))}
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Category</div>
            <Sel value={newLead.category} onChange={v=>{if(v==="＋ Add category"){const n=addNewOption(customLeadCats,setCustomLeadCats,'onna_lead_cats',"New category name:");if(n)setNewLead(p=>({...p,category:n}));}else setNewLead(p=>({...p,category:v}));}} options={allLeadCats.filter(c=>c!=="All")} minWidth={200}/>
          </div>
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Location</div>
            <LocationPicker value={newLead.location} onChange={v=>setNewLead(p=>({...p,location:v}))} options={allLocations} addNewOption={addNewOption} customLocs={customLocations} setCustomLocs={setCustomLocations} storageKey="onna_custom_locations"/>
          </div>
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Source</div>
            <Sel value={newLead.source} onChange={v=>setNewLead(p=>({...p,source:v}))} options={["Referral","LinkedIn","Website","Cold Outreach","Event","Other"]} minWidth={200}/>
          </div>
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Status</div>
            <Sel value={newLead.status} onChange={v=>setNewLead(p=>({...p,status:v}))} options={OUTREACH_STATUSES.map(s=>({value:s,label:OUTREACH_STATUS_LABELS[s]}))} minWidth={200}/>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <BtnSecondary onClick={()=>setShowAddLead(false)}>Cancel</BtnSecondary>
          <BtnPrimary onClick={async()=>{if(!newLead.company)return;const saved=await api.post("/api/leads",{...newLead,value:Number(newLead.value)||0});if(saved.id)setLocalLeads(prev=>[...prev,saved]);setNewLead({company:"",contact:"",email:"",phone:"",role:"",date:"",source:"Referral",status:"not_contacted",value:"",category:"Production Companies",location:"Dubai, UAE"});setShowAddLead(false);}}>Save Lead</BtnPrimary>
        </div>
      </div>
    </div>
  );
}
