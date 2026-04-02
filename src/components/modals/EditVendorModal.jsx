import React from "react";
import MobileDrawer, { CollapsibleSection } from "../ui/MobileDrawer";

export function EditVendorModal({ T, isMobile, BtnPrimary, BtnSecondary, Sel, LocationPicker, CategoryPicker, editVendor, setEditVendor, api, vendors, setVendors, archiveItem, pruneCustom, addNewOption, customVendorCats, setCustomVendorCats, allVendorCats, allLocations, customLocations, setCustomLocations, DIETARY_TAGS, DIETARY_TAG_COLORS, addContactForm, setAddContactForm, setXContacts, localLeads, setLocalLeads, setUndoToastMsg, doLogActivity }) {
  const showToast = msg => { if(setUndoToastMsg){setUndoToastMsg(msg);setTimeout(()=>setUndoToastMsg(""),3000);} };
  const vendorToLead = async (move) => {
    const company = (editVendor.company||editVendor.name||"").trim();
    if (!company) return;
    if (localLeads.some(l=>(l.company||"").toLowerCase()===company.toLowerCase())) {
      alert(`${company} is already a lead.`);
      return;
    }
    const newLead = {
      company,
      contact: editVendor.name||"",
      email: editVendor.email||"",
      phone: editVendor.phone||"",
      location: editVendor.location||"",
      category: editVendor.category||"",
      notes: editVendor.notes||"",
      status: "not_contacted",
      date: new Date().toISOString().slice(0,10),
      value: "",
    };
    try {
      const saved = await api.post("/api/leads", newLead);
      if (saved.id) setLocalLeads(prev=>[...prev,saved]);
    } catch { return; }
    if (move) {
      archiveItem('vendors', editVendor);
      await api.delete(`/api/vendors/${editVendor.id}`);
      const updatedVendors = vendors.filter(v=>v.id!==editVendor.id);
      setVendors(updatedVendors);
      pruneCustom(updatedVendors,'category',customVendorCats,setCustomVendorCats,'onna_vendor_cats');
      pruneCustom(updatedVendors,'location',customLocations,setCustomLocations,'onna_custom_locations');
    }
    showToast(move?"Moved to Leads ✓":"Copied to Leads ✓");
    setEditVendor(null);
  };
  const content = (
    <>
      {/* Contact details */}
      <CollapsibleSection title="Contact Details" defaultOpen={true}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:14}}>
          {[["Name","name"],["Company","company"],["Email","email"],["Phone","phone"],["Website","website"]].map(([label,key])=>(
            <div key={key}>
              <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>{label}</div>
              <input value={editVendor[key]||""} onChange={e=>setEditVendor(p=>({...p,[key]:e.target.value}))}
                style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
            </div>
          ))}
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Category</div>
            <CategoryPicker value={editVendor.category||""} onChange={v=>setEditVendor(p=>({...p,category:v}))} options={allVendorCats.filter(c=>c!=="All")} addNewOption={addNewOption} customCats={customVendorCats} setCustomCats={setCustomVendorCats} storageKey="onna_vendor_cats"/>
          </div>
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Location</div>
            <LocationPicker value={editVendor.location||""} onChange={v=>setEditVendor(p=>({...p,location:v}))} options={allLocations} addNewOption={addNewOption} customLocs={customLocations} setCustomLocs={setCustomLocations} storageKey="onna_custom_locations"/>
          </div>
        </div>
      </CollapsibleSection>

      {/* Notes */}
      <CollapsibleSection title="Notes" defaultOpen={!isMobile}>
        <div style={{marginBottom:16}}>
          <textarea value={editVendor.notes||""} onChange={e=>setEditVendor(p=>({...p,notes:e.target.value}))} rows={6}
            placeholder="Parking, access, contacts on set, booking lead time…"
            style={{width:"100%",padding:"10px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",lineHeight:"1.6"}}/>
        </div>
      </CollapsibleSection>

      {/* Rate card */}
      <CollapsibleSection title="Rate Card" defaultOpen={!isMobile}>
        <div style={{marginBottom:14}}>
          <textarea value={editVendor.rateCard||""} onChange={e=>setEditVendor(p=>({...p,rateCard:e.target.value}))} rows={5}
            placeholder="e.g. AED 1,500/half day · AED 2,800/full day · overtime at AED 300/hr"
            style={{width:"100%",padding:"10px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",lineHeight:"1.6"}}/>
        </div>
      </CollapsibleSection>

      {/* Dietaries */}
      <CollapsibleSection title="Dietary Requirements" defaultOpen={!isMobile}>
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
            {DIETARY_TAGS.filter(t=>t!=="None").map(tag=>{const tc=DIETARY_TAG_COLORS[tag];const selected=(editVendor.dietaries||[]).includes(tag);return(
              <button key={tag} onClick={()=>setEditVendor(p=>{const cur=p.dietaries||[];return{...p,dietaries:selected?cur.filter(t=>t!==tag):[...cur,tag]};})}
                style={{padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:selected?700:500,fontFamily:"inherit",cursor:"pointer",border:selected?`1.5px solid ${tc.text}`:`1px solid ${T.border}`,background:selected?tc.bg:"#fafafa",color:selected?tc.text:T.muted,transition:"all 0.15s ease"}}>{tag}</button>
            );})}
          </div>
          {(editVendor.dietaries||[]).length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
            {(editVendor.dietaries||[]).map(tag=>{const tc=DIETARY_TAG_COLORS[tag]||DIETARY_TAG_COLORS["Other"];return(
              <span key={tag} style={{fontSize:10,fontWeight:600,background:tc.bg,color:tc.text,padding:"3px 8px",borderRadius:10,letterSpacing:"0.03em"}}>{tag}</span>
            );})}
          </div>}
          <textarea value={editVendor.dietaryNotes||""} onChange={e=>setEditVendor(p=>({...p,dietaryNotes:e.target.value}))} rows={2}
            placeholder="Additional dietary notes, allergies, preferences…"
            style={{width:"100%",padding:"10px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",lineHeight:"1.6"}}/>
        </div>
      </CollapsibleSection>

      {/* Additional Contacts */}
      <CollapsibleSection title="Additional Contacts" defaultOpen={!isMobile}>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",marginBottom:8}}>
            <button onClick={()=>setAddContactForm({type:"vendor",name:"",email:"",phone:"",role:""})} style={{fontSize:11,color:"#d4aa20",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,padding:0}}>+ Add Contact</button>
          </div>
          {(editVendor._xContacts||[]).map((c,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8,padding:"8px 10px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,position:"relative"}}>
              <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Name</div><div style={{fontSize:12,color:T.text}}>{c.name||"\u2014"}</div></div>
              <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Role</div><div style={{fontSize:12,color:T.text}}>{c.role||"\u2014"}</div></div>
              <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Email</div><div style={{fontSize:12,color:T.text}}>{c.email||"\u2014"}</div></div>
              <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Phone</div><div style={{fontSize:12,color:T.text}}>{c.phone||"\u2014"}</div></div>
              <button onClick={()=>setEditVendor(p=>{const updated=(p._xContacts||[]).filter((_,j)=>j!==i);setXContacts('vendor',p.id,updated);return{...p,_xContacts:updated};})} style={{position:"absolute",top:4,right:8,background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:0,lineHeight:1}}>x</button>
            </div>
          ))}
          {addContactForm?.type==="vendor"&&(
            <div style={{padding:"10px 12px",borderRadius:9,background:"white",border:"1.5px solid #F5D13A",marginTop:4}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                {[["Name","name"],["Role","role"],["Email","email"],["Phone","phone"]].map(([lbl,k])=>(
                  <div key={k}><div style={{fontSize:9,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>{lbl}</div>
                    <input value={addContactForm[k]||""} onChange={e=>setAddContactForm(p=>({...p,[k]:e.target.value}))} style={{width:"100%",padding:"6px 9px",borderRadius:7,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:12,fontFamily:"inherit"}}/></div>
                ))}
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button onClick={()=>setAddContactForm(null)} style={{padding:"5px 14px",borderRadius:8,background:"none",border:`1px solid ${T.border}`,color:T.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                <button onClick={()=>{const nc={name:addContactForm.name||"",email:addContactForm.email||"",phone:addContactForm.phone||"",role:addContactForm.role||""};setEditVendor(p=>{const updated=[...(p._xContacts||[]),nc];setXContacts('vendor',p.id,updated);return{...p,_xContacts:updated};});setAddContactForm(null);}} style={{padding:"5px 14px",borderRadius:8,background:"#F5D13A",border:"none",color:"#3d2800",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Add</button>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <button onClick={()=>vendorToLead(false)} style={{padding:"7px 16px",borderRadius:9,background:"#f3f0ff",border:"1px solid #d8d0f8",color:"#7c3aed",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Copy to Lead</button>
        <button onClick={()=>{if(window.confirm(`Move ${editVendor.name||editVendor.company} to Leads? This will remove it from Vendors.`))vendorToLead(true);}} style={{padding:"7px 16px",borderRadius:9,background:"#eff6ff",border:"1px solid #bfdbfe",color:"#1a56db",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Move to Lead</button>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={async()=>{
          if(!window.confirm(`Delete ${editVendor.name}?`)) return;
          archiveItem('vendors', editVendor);
          await api.delete(`/api/vendors/${editVendor.id}`);
          const updatedVendors = vendors.filter(v=>v.id!==editVendor.id);
          setVendors(updatedVendors);
          pruneCustom(updatedVendors,'category',customVendorCats,setCustomVendorCats,'onna_vendor_cats');
          pruneCustom(updatedVendors,'location',customLocations,setCustomLocations,'onna_custom_locations');
          setEditVendor(null);
        }} style={{background:"none",border:"none",color:"#c0392b",fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",padding:0}}>Delete vendor</button>
        <div style={{display:"flex",gap:8}}>
          <BtnSecondary onClick={()=>setEditVendor(null)}>Cancel</BtnSecondary>
          <BtnPrimary onClick={async()=>{
            const {id,_xContacts,...fields}=editVendor;
            if(Array.isArray(fields.dietaries))fields.dietaries=JSON.stringify(fields.dietaries);
            // Ensure no undefined/null values — backend may reject them
            Object.keys(fields).forEach(k=>{if(fields[k]==null)fields[k]="";});
            setXContacts('vendor', id, _xContacts||[]);
            try{
              await api.put(`/api/vendors/${id}`,fields);
              setVendors(prev=>prev.map(v=>v.id===id?editVendor:v));
              showToast("Saved ✓");
              setEditVendor(null);
            }catch(e){showToast("Save failed — please try again");}
          }}>Save Changes</BtnPrimary>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return <MobileDrawer title={editVendor.name||"Edit Vendor"} onClose={()=>setEditVendor(null)}>{content}</MobileDrawer>;
  }

  return (
    <div className="modal-bg" onClick={()=>setEditVendor(null)}>
      <div style={{borderRadius:20,padding:28,width:580,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
          <div>
            <div style={{fontSize:20,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>{editVendor.name||"Vendor"}</div>
            <div style={{fontSize:12,color:T.muted,marginTop:3}}>{[editVendor.company,editVendor.category,editVendor.location].filter(Boolean).join(" · ")}</div>
          </div>
          <button onClick={()=>setEditVendor(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>x</button>
        </div>
        {content}
      </div>
    </div>
  );
}
