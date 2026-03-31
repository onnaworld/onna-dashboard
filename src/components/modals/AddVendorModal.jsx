import React from "react";

export function AddVendorModal({ T, isMobile, BtnPrimary, BtnSecondary, Sel, LocationPicker, CategoryPicker, showAddVendor, setShowAddVendor, newVendor, setNewVendor, api, setVendors, addNewOption, customVendorCats, setCustomVendorCats, allVendorCats, allLocations, customLocations, setCustomLocations, showAlert }) {
  return (
    <div className="modal-bg" onClick={()=>setShowAddVendor(false)}>
      <div style={{borderRadius:isMobile?"20px 20px 0 0":20,padding:isMobile?"24px 20px":28,width:isMobile?"100%":520,maxWidth:isMobile?"100%":"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>New Vendor</div>
          <button onClick={()=>setShowAddVendor(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:18}}>
          {[["Name","name"],["Company","company"],["Email","email"],["Phone","phone"],["Website","website"],["Rate Card","rateCard"],["Notes","notes"]].map(([label,key])=>(
            <div key={key} style={{gridColumn:key==="notes"?"span 2":"auto"}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>{label}</div>
              <input value={newVendor[key]} onChange={e=>setNewVendor(p=>({...p,[key]:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
            </div>
          ))}
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Category</div>
            <CategoryPicker value={newVendor.category||""} onChange={v=>setNewVendor(p=>({...p,category:v}))} options={allVendorCats.filter(c=>c!=="All")} addNewOption={addNewOption} customCats={customVendorCats} setCustomCats={setCustomVendorCats} storageKey="onna_vendor_cats"/>
          </div>
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Location</div>
            <LocationPicker value={newVendor.location} onChange={v=>setNewVendor(p=>({...p,location:v}))} options={allLocations} addNewOption={addNewOption} customLocs={customLocations} setCustomLocs={setCustomLocations} storageKey="onna_custom_locations"/>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <BtnSecondary onClick={()=>setShowAddVendor(false)}>Cancel</BtnSecondary>
          <BtnPrimary onClick={async()=>{if(!newVendor.name&&!newVendor.company){showAlert("Please enter a name or company.");return;}const payload={};Object.keys(newVendor).forEach(k=>{payload[k]=newVendor[k]||"";});if(!payload.name)payload.name=payload.company;try{const saved=await api.post("/api/vendors",payload);if(saved&&saved.id){setVendors(prev=>[...prev,saved]);setNewVendor({name:"",company:"",category:"Locations",email:"",phone:"",website:"",location:"Dubai, UAE",notes:"",rateCard:""});setShowAddVendor(false);}else{showAlert("Failed to save vendor: "+(saved?.error||"Unknown error"));}}catch(e){showAlert("Failed to save vendor: "+(e.message||"Network error"));};}}>Save Vendor</BtnPrimary>
        </div>
      </div>
    </div>
  );
}
