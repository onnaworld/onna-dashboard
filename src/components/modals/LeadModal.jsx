import React, { useState } from "react";
import MobileDrawer, { CollapsibleSection } from "../ui/MobileDrawer";
import { createReminder } from "../../utils/reminders";

export function LeadModal({ T, isMobile, api, BtnPrimary, BtnSecondary, Sel, LocationPicker, CategoryPicker, OutreachBadge, selectedLead, setSelectedLead, addContactForm, setAddContactForm, addNewOption, customLeadCats, setCustomLeadCats, allLeadCats, customLocations, setCustomLocations, allLocations, OUTREACH_STATUSES, promoteToClient, setLocalLeads, setLeadStatusOverrides, archiveItem, pruneCustom, setXContacts, setUndoToastMsg, reminders, setReminders, doLogActivity }) {
  const showToast = msg => { if(setUndoToastMsg){setUndoToastMsg(msg);setTimeout(()=>setUndoToastMsg(""),3000);} };
  const [reminderDate, setReminderDate] = useState("");
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const content = (
    <>
      <CollapsibleSection title="Contact Details" defaultOpen={true}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:16}}>
          {[["company","Company"],["contact","Contact"],["role","Role"],["email","Email"],["phone","Phone"],["date","Date Contacted"],["value","Deal Value"]].map(([field,label])=>(
            <div key={field}>
              <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}</div>
              <input value={selectedLead[field]||""} onChange={e=>setSelectedLead(p=>({...p,[field]:e.target.value}))}
                style={{width:"100%",padding:"8px 11px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
            </div>
          ))}
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Status & Category" defaultOpen={true}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:16}}>
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Category</div>
            <CategoryPicker value={selectedLead.category||""} onChange={v=>setSelectedLead(p=>({...p,category:v}))} options={allLeadCats.filter(c=>c!=="All")} addNewOption={addNewOption} customCats={customLeadCats} setCustomCats={setCustomLeadCats} storageKey="onna_lead_cats"/>
          </div>
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Source</div>
            <Sel value={selectedLead.source||""} onChange={v=>setSelectedLead(p=>({...p,source:v}))} options={["Referral","LinkedIn","Website","Cold Outreach","Event","Other"]} minWidth="100%"/>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Status</div>
            <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:4}}>
              <OutreachBadge status={selectedLead.status} onClick={()=>{const next=OUTREACH_STATUSES[(OUTREACH_STATUSES.indexOf(selectedLead.status)+1)%OUTREACH_STATUSES.length];setSelectedLead(p=>({...p,status:next}));}}/>
              <span style={{fontSize:11,color:T.muted}}>click to cycle</span>
            </div>
          </div>
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Location</div>
            <LocationPicker value={selectedLead.location||""} onChange={v=>setSelectedLead(p=>({...p,location:v}))} options={allLocations} addNewOption={addNewOption} customLocs={customLocations} setCustomLocs={setCustomLocations} storageKey="onna_custom_locations"/>
          </div>
        </div>
      </CollapsibleSection>
      {/* Notes */}
      <CollapsibleSection title="Notes" defaultOpen={!isMobile}>
        <div style={{marginBottom:16}}>
          <textarea value={selectedLead.notes||""} onChange={e=>setSelectedLead(p=>({...p,notes:e.target.value}))} rows={3}
            placeholder="Comments, next steps, context…"
            style={{width:"100%",padding:"10px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",lineHeight:"1.6"}}/>
        </div>
      </CollapsibleSection>
      {/* Set Reminder */}
      {setReminders && (
        <div style={{marginBottom:16}}>
          {!showReminderPicker ? (
            <button onClick={()=>setShowReminderPicker(true)} style={{padding:"7px 16px",borderRadius:9,background:"#fff8e8",border:"1px solid #f5d13a",color:"#92680a",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Set Follow-up Reminder</button>
          ) : (
            <div style={{padding:"10px 12px",borderRadius:9,background:"#fff8e8",border:"1px solid #f5d13a"}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Remind me on</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input type="date" value={reminderDate} onChange={e=>setReminderDate(e.target.value)} style={{flex:1,padding:"6px 9px",borderRadius:7,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:12,fontFamily:"inherit"}}/>
                <button onClick={()=>{if(reminderDate){setReminders(prev=>[...prev,createReminder("follow_up","lead",selectedLead.id,selectedLead.company,reminderDate,`Follow up with "${selectedLead.company}"`)]);showToast("Reminder set");setShowReminderPicker(false);setReminderDate("");}}} style={{padding:"5px 14px",borderRadius:8,background:"#F5D13A",border:"none",color:"#3d2800",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Set</button>
                <button onClick={()=>{setShowReminderPicker(false);setReminderDate("");}} style={{padding:"5px 14px",borderRadius:8,background:"none",border:`1px solid ${T.border}`,color:T.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Additional Contacts */}
      <CollapsibleSection title="Contacts" defaultOpen={!isMobile}>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",marginBottom:8}}>
            <button onClick={()=>setAddContactForm({type:"lead",name:"",email:"",phone:"",role:""})} style={{fontSize:11,color:"#d4aa20",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,padding:0}}>+ Add Contact</button>
          </div>
          {(selectedLead._xContacts||[]).map((c,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8,padding:"8px 10px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,position:"relative"}}>
              <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Name</div><div style={{fontSize:12,color:T.text}}>{c.name||"\u2014"}</div></div>
              <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Role</div><div style={{fontSize:12,color:T.text}}>{c.role||"\u2014"}</div></div>
              <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Email</div><div style={{fontSize:12,color:T.text}}>{c.email||"\u2014"}</div></div>
              <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Phone</div><div style={{fontSize:12,color:T.text}}>{c.phone||"\u2014"}</div></div>
              <button onClick={()=>setSelectedLead(p=>({...p,_xContacts:(p._xContacts||[]).filter((_,j)=>j!==i)}))} style={{position:"absolute",top:4,right:8,background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:0,lineHeight:1}}>x</button>
            </div>
          ))}
          {addContactForm?.type==="lead"&&(
            <div style={{padding:"10px 12px",borderRadius:9,background:"white",border:"1.5px solid #F5D13A",marginTop:4}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                {[["Name","name"],["Role","role"],["Email","email"],["Phone","phone"]].map(([lbl,k])=>(
                  <div key={k}><div style={{fontSize:9,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>{lbl}</div>
                    <input value={addContactForm[k]||""} onChange={e=>setAddContactForm(p=>({...p,[k]:e.target.value}))} style={{width:"100%",padding:"6px 9px",borderRadius:7,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:12,fontFamily:"inherit"}}/></div>
                ))}
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button onClick={()=>setAddContactForm(null)} style={{padding:"5px 14px",borderRadius:8,background:"none",border:`1px solid ${T.border}`,color:T.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                <button onClick={()=>{setSelectedLead(p=>({...p,_xContacts:[...(p._xContacts||[]),{name:addContactForm.name,email:addContactForm.email,phone:addContactForm.phone,role:addContactForm.role}]}));setAddContactForm(null);}} style={{padding:"5px 14px",borderRadius:8,background:"#F5D13A",border:"none",color:"#3d2800",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Add</button>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={async()=>{
          if(!window.confirm(`Delete ${selectedLead.company}?`)) return;
          const snap = {...selectedLead};
          archiveItem('leads', snap);
          setSelectedLead(null);
          setLocalLeads(prev=>prev.filter(l=>l.id!==snap.id));
          setTimeout(()=>{
            setLocalLeads(prev=>{
              pruneCustom(prev,'category',customLeadCats,setCustomLeadCats,'onna_lead_cats');
              pruneCustom(prev,'location',customLocations,setCustomLocations,'onna_custom_locations');
              return prev;
            });
          },50);
          try{await api.delete(`/api/leads/${snap.id}`);}catch{}
        }} style={{background:"none",border:"none",color:"#c0392b",fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",padding:0}}>Delete lead</button>
        <div style={{display:"flex",gap:8}}>
          <BtnSecondary onClick={()=>setSelectedLead(null)}>Cancel</BtnSecondary>
          <BtnPrimary onClick={async()=>{
            const {id,_xContacts,...fields} = selectedLead;
            setXContacts('lead', id, _xContacts||[]);
            await api.put(`/api/leads/${id}`,{...fields,value:Number(fields.value)||0});
            setLocalLeads(prev=>prev.map(l=>l.id===id?selectedLead:l));
            setLeadStatusOverrides(prev=>{const n={...prev};delete n[id];return n;});
            showToast("Saved ✓");
            setSelectedLead(null);
          }}>Save Changes</BtnPrimary>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return <MobileDrawer title={selectedLead.company||"Lead"} onClose={()=>setSelectedLead(null)}>{content}</MobileDrawer>;
  }

  return (
    <div className="modal-bg" onClick={()=>setSelectedLead(null)}>
      <div style={{borderRadius:20,padding:28,width:520,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontSize:20,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>{selectedLead.company}</div>
            <div style={{fontSize:12,color:T.muted,marginTop:3}}>{selectedLead.category} · {selectedLead.location}</div>
          </div>
          <button onClick={()=>setSelectedLead(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>x</button>
        </div>
        {content}
      </div>
    </div>
  );
}
