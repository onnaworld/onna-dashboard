import React from "react";

export default function Vendors({
  T, isMobile,
  bbCat, setBbCat, bbLocation, setBbLocation, filteredBB,
  customVendorCats, setCustomVendorCats, customVendorLocs, setCustomVendorLocs,
  allVendorCats, allVendorLocs, addNewOption,
  getSearch, setSearch, setShowAddVendor, setEditVendor, getXContacts,
  downloadCSV, exportTablePDF,
  SearchBar, Sel, TH, TD, BtnPrimary,
}) {
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <SearchBar value={getSearch("Vendors")} onChange={v=>setSearch("Vendors",v)} placeholder="Search contacts…"/>
        <Sel value={bbCat} onChange={v=>{if(v==="＋ Add category"){const n=addNewOption(customVendorCats,setCustomVendorCats,'onna_vendor_cats',"New category name:");if(n){setBbCat(n);setBbLocation("All");}}else{setBbCat(v);setBbLocation("All");}}} options={allVendorCats} minWidth={170}/>
        <Sel value={bbLocation} onChange={v=>{if(v==="＋ Add location"){const n=addNewOption(customVendorLocs,setCustomVendorLocs,'onna_vendor_locs',"New location name:");if(n)setBbLocation(n);}else setBbLocation(v);}} options={["All",...allVendorLocs]} minWidth={170}/>
        <span style={{fontSize:12,color:T.muted}}>{filteredBB.length} contacts</span>
        <button onClick={()=>downloadCSV(filteredBB,[{key:"name",label:"Name"},{key:"company",label:"Company"},{key:"category",label:"Category"},{key:"location",label:"Location"},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"website",label:"Website"},{key:"rateCard",label:"Rate Card"},{key:"notes",label:"Notes"}],"vendors.csv")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>CSV</button>
        <button onClick={()=>exportTablePDF(filteredBB,[{key:"name",label:"Name"},{key:"company",label:"Company"},{key:"category",label:"Category"},{key:"location",label:"Location"},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"website",label:"Website"}],"Vendors")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>PDF</button>
        <BtnPrimary onClick={()=>setShowAddVendor(true)}>+ New Vendor</BtnPrimary>
      </div>
      <div className="mob-table-wrap" style={{borderRadius:16,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <table style={{width:"100%",borderCollapse:"collapse",background:T.surface,minWidth:isMobile?520:"auto"}}>
          <thead><tr><TH>Name</TH><TH>Company</TH><TH>Category</TH><TH>Email</TH><TH>Phone</TH><TH>Website</TH><TH>Location</TH></tr></thead>
          <tbody>
            {filteredBB.map(b=>(
              <tr key={b.id} className="row" onClick={()=>setEditVendor({...b,_xContacts:getXContacts('vendor',b.id)})} style={{cursor:"pointer"}}>
                <TD bold>{b.name}</TD>
                <TD muted>{b.company||"—"}</TD>
                <TD muted>{b.category||"—"}</TD>
                <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}><a href={`mailto:${b.email}`} onClick={e=>e.stopPropagation()} style={{fontSize:12.5,color:T.link,textDecoration:"none"}}>{b.email||"—"}</a></td>
                <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`,whiteSpace:"nowrap",fontSize:12.5,color:T.sub}}>{b.phone||"—"}</td>
                <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}>{b.website?<a href={`https://${b.website}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:12.5,color:T.link,textDecoration:"none"}}>{b.website}</a>:<span style={{color:T.muted,fontSize:12.5}}>—</span>}</td>
                <TD muted>{b.location||"—"}</TD>
              </tr>
            ))}
            {filteredBB.length===0&&<tr><td colSpan={7} style={{padding:44,textAlign:"center",color:T.muted,fontSize:13}}>No contacts found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
