import React, { useState, useEffect } from "react";
import MobileDrawer, { CollapsibleSection } from "../ui/MobileDrawer";
import { Typeahead } from "../ui/Typeahead";

// Vendor record field reuse (no backend schema change available, so two
// retired fields are repurposed rather than left unused):
//   - `rateCard` now holds the Instagram handle/link (Rate Card UI is gone).
//   - `dietaryNotes` now holds the primary contact's name (Dietary
//     Requirements UI is gone) — paired with the existing `email`/`phone`
//     columns to form the first row of the unified Contact list.
// Anything additional beyond that first contact still lives in the
// existing local `_xContacts` store (per-vendor, via getXContacts/setXContacts).
const buildContacts = (ev) => {
  const primary = { name: ev.dietaryNotes || "", email: ev.email || "", phone: ev.phone || "" };
  const extra = Array.isArray(ev._xContacts) ? ev._xContacts.map(c => ({ name: c.name || "", email: c.email || "", phone: c.phone || "" })) : [];
  return [primary, ...extra];
};

export function EditVendorModal({ T, isMobile, BtnPrimary, BtnSecondary, editVendor, setEditVendor, api, vendors, setVendors, archiveItem, pruneCustom, customVendorCats, setCustomVendorCats, allVendorCats, allLocations, customLocations, setCustomLocations, setXContacts, getXContacts, localLeads, setLocalLeads, setUndoToastMsg }) {
  const showToast = msg => { if(setUndoToastMsg){setUndoToastMsg(msg);setTimeout(()=>setUndoToastMsg(""),3000);} };
  const [contacts, setContacts] = useState(() => buildContacts(editVendor));
  useEffect(() => { setContacts(buildContacts(editVendor)); }, [editVendor.id]); // eslint-disable-line

  const loadVendor = (match) => {
    if (!match) return;
    setEditVendor({ ...match, _xContacts: getXContacts('vendor', match.id) });
  };

  const vendorToLead = async (move) => {
    const company = (editVendor.name||"").trim();
    if (!company) return;
    if (localLeads.some(l=>(l.company||"").toLowerCase()===company.toLowerCase())) {
      alert(`${company} is already a lead.`);
      return;
    }
    const newLead = {
      company,
      contact: contacts[0]?.name||"",
      email: contacts[0]?.email||"",
      phone: contacts[0]?.phone||"",
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

  const updateContact = (i, field, val) => setContacts(prev => prev.map((c,j) => j===i ? {...c,[field]:val} : c));
  const removeContact = (i) => setContacts(prev => prev.filter((_,j) => j!==i));
  const addContact = () => setContacts(prev => [...prev, { name:"", email:"", phone:"" }]);

  const vendorNameOptions = vendors.map(v=>v.name).filter(n=>n && n!==editVendor.name);
  const categoryOptions = allVendorCats.filter(c=>c!=="All");

  const fieldLbl = { fontSize:10, color:T.muted, marginBottom:4, fontWeight:500, letterSpacing:"0.06em", textTransform:"uppercase" };
  const fieldBox = { width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:9, background:"#f5f5f7", border:`1px solid ${T.border}`, color:T.text, fontSize:13, fontFamily:"inherit" };

  const content = (
    <>
      <CollapsibleSection title="Name" defaultOpen={true}>
        <div style={{marginBottom:14}}>
          <Typeahead
            value={editVendor.name||""}
            onChange={v=>setEditVendor(p=>({...p,name:v}))}
            options={vendorNameOptions}
            onPickExisting={name=>loadVendor(vendors.find(v=>v.name===name))}
            style={{...fieldBox}}
            inputStyle={{padding:"9px 12px",borderRadius:9,fontSize:13}}
          />
        </div>
      </CollapsibleSection>

      {/* Contact — one unified list: name/email/phone, add as many as needed. */}
      <CollapsibleSection title="Contact" defaultOpen={true}>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",marginBottom:8}}>
            <button onClick={addContact} style={{fontSize:11,color:"#d4aa20",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,padding:0}}>+ Add Contact</button>
          </div>
          {contacts.map((c,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:8,marginBottom:8,padding:"10px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,position:"relative"}}>
              {[["Name","name"],["Email","email"],["Phone","phone"]].map(([lbl,k])=>(
                <div key={k}>
                  <div style={{fontSize:9,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>{lbl}</div>
                  <input value={c[k]||""} onChange={e=>updateContact(i,k,e.target.value)} style={{width:"100%",boxSizing:"border-box",padding:"6px 9px",borderRadius:7,background:"#fff",border:`1px solid ${T.border}`,color:T.text,fontSize:12,fontFamily:"inherit"}}/>
                </div>
              ))}
              {contacts.length>1 && <button onClick={()=>removeContact(i)} style={{position:"absolute",top:4,right:6,background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:0,lineHeight:1}}>×</button>}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Notes */}
      <CollapsibleSection title="Notes" defaultOpen={!isMobile}>
        <div style={{marginBottom:16}}>
          <textarea value={editVendor.notes||""} onChange={e=>setEditVendor(p=>({...p,notes:e.target.value}))} rows={6}
            placeholder="Parking, access, contacts on set, booking lead time, rate card…"
            style={{width:"100%",padding:"10px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",lineHeight:"1.6",boxSizing:"border-box"}}/>
        </div>
      </CollapsibleSection>

      {/* Website + Instagram */}
      <CollapsibleSection title="Website & Instagram" defaultOpen={true}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:14}}>
          <div>
            <div style={fieldLbl}>Website</div>
            <input value={editVendor.website||""} onChange={e=>setEditVendor(p=>({...p,website:e.target.value}))} style={fieldBox}/>
          </div>
          <div>
            <div style={fieldLbl}>Instagram</div>
            <input value={editVendor.rateCard||""} onChange={e=>setEditVendor(p=>({...p,rateCard:e.target.value}))} placeholder="@handle" style={fieldBox}/>
          </div>
        </div>
      </CollapsibleSection>

      {/* Category + Location */}
      <CollapsibleSection title="Category & Location" defaultOpen={true}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:14}}>
          <div>
            <div style={fieldLbl}>Category</div>
            <Typeahead value={editVendor.category||""} onChange={v=>setEditVendor(p=>({...p,category:v}))} options={categoryOptions} style={fieldBox} inputStyle={{padding:"9px 12px",borderRadius:9,fontSize:13}}/>
          </div>
          <div>
            <div style={fieldLbl}>Location</div>
            <Typeahead value={editVendor.location||""} onChange={v=>setEditVendor(p=>({...p,location:v}))} options={allLocations} style={fieldBox} inputStyle={{padding:"9px 12px",borderRadius:9,fontSize:13}}/>
          </div>
        </div>
      </CollapsibleSection>

      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <button onClick={()=>vendorToLead(false)} style={{padding:"7px 16px",borderRadius:9,background:"#f3f0ff",border:"1px solid #d8d0f8",color:"#7c3aed",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Copy to Lead</button>
        <button onClick={()=>{if(window.confirm(`Move ${editVendor.name} to Leads? This will remove it from Vendors.`))vendorToLead(true);}} style={{padding:"7px 16px",borderRadius:9,background:"#eff6ff",border:"1px solid #bfdbfe",color:"#1a56db",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Move to Lead</button>
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
            const {id,_xContacts,dietaries,...rest}=editVendor;
            const [primary, ...extra] = contacts;
            const fields = { ...rest, email: primary?.email||"", phone: primary?.phone||"", dietaryNotes: primary?.name||"" };
            delete fields.company;
            Object.keys(fields).forEach(k=>{if(fields[k]==null)fields[k]="";});
            setXContacts('vendor', id, extra);
            try{
              await api.put(`/api/vendors/${id}`,fields);
              setVendors(prev=>prev.map(v=>v.id===id?{...v,...fields}:v));
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
            <div style={{fontSize:12,color:T.muted,marginTop:3}}>{[editVendor.category,editVendor.location].filter(Boolean).join(" · ")}</div>
          </div>
          <button onClick={()=>setEditVendor(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>x</button>
        </div>
        {content}
      </div>
    </div>
  );
}
