import React, { useState, useMemo, useEffect } from "react";
import BulkActionBar from "./ui/BulkActionBar";
import { normalizeLocation, LOCATION_ALIASES } from "../utils/helpers";

export default function Vendors({
  T, isMobile, api,
  bbCat, setBbCat, bbLocation, setBbLocation, filteredBB,
  customVendorCats, setCustomVendorCats, customLocations, setCustomLocations,
  allVendorCats, allLocations, addNewOption,
  getSearch, setSearch, setShowAddVendor, setEditVendor, getXContacts,
  vendors, setVendors, archiveItem, pruneCustom,
  downloadCSV, exportTablePDF,
  SearchBar, Sel, TH, TD, BtnPrimary,
}) {
  // Auto-sync unknown locations from vendor data into customLocations (normalize aliases)
  const vendorLocs = useMemo(()=>Array.from(new Set(vendors.flatMap(v=>(v.location||"").includes("|")?(v.location||"").split("|").map(s=>normalizeLocation(s.trim())).filter(Boolean):[v.location].filter(Boolean).map(normalizeLocation)))),[vendors]);
  useEffect(()=>{
    const known = new Set(allLocations);
    const missing = vendorLocs.filter(l=>l&&!known.has(l)&&!LOCATION_ALIASES[l]);
    if(missing.length>0) setCustomLocations(prev=>{const s=new Set(prev);const added=missing.filter(m=>!s.has(m));if(!added.length)return prev;return[...prev,...added];});
  },[vendorLocs]); // eslint-disable-line
  // Auto-sync unknown categories from vendor data into customVendorCats
  const vendorCats = useMemo(()=>Array.from(new Set(vendors.flatMap(v=>(v.category||"").includes("|")?(v.category||"").split("|").map(s=>s.trim()).filter(Boolean):[v.category].filter(Boolean)))),[vendors]);
  useEffect(()=>{
    const known = new Set(allVendorCats);
    const missing = vendorCats.filter(c=>c&&!known.has(c));
    if(missing.length>0) setCustomVendorCats(prev=>{const s=new Set(prev);const added=missing.filter(m=>!s.has(m));if(!added.length)return prev;return[...prev,...added];});
  },[vendorCats]); // eslint-disable-line
  const [selectedIds, setSelectedIds] = useState(new Set());
  const toggleId = id => setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => { if (selectedIds.size === filteredBB.length) setSelectedIds(new Set()); else setSelectedIds(new Set(filteredBB.map(b => b.id))); };
  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} vendors?`)) return;
    const ids = [...selectedIds];
    ids.forEach(id => { const v = vendors.find(x => x.id === id); if (v) archiveItem('vendors', v); });
    await Promise.all(ids.map(id => api.delete(`/api/vendors/${id}`).catch(() => {})));
    const updated = vendors.filter(v => !selectedIds.has(v.id));
    setVendors(updated);
    pruneCustom(updated, 'category', customVendorCats, setCustomVendorCats, 'onna_vendor_cats');
    pruneCustom(updated, 'location', customLocations, setCustomLocations, 'onna_custom_locations');
    setSelectedIds(new Set());
  };
  const bulkChangeCategory = async (cat) => {
    const ids = [...selectedIds];
    await Promise.all(ids.map(id => api.put(`/api/vendors/${id}`, { category: cat }).catch(() => {})));
    setVendors(prev => prev.map(v => ids.includes(v.id) ? { ...v, category: cat } : v));
    setSelectedIds(new Set());
  };
  const bulkChangeLocation = async (loc) => {
    const ids = [...selectedIds];
    await Promise.all(ids.map(id => api.put(`/api/vendors/${id}`, { location: loc }).catch(() => {})));
    setVendors(prev => prev.map(v => ids.includes(v.id) ? { ...v, location: loc } : v));
    setSelectedIds(new Set());
  };
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <SearchBar value={getSearch("Vendors")} onChange={v=>setSearch("Vendors",v)} placeholder="Search contacts…"/>
        <Sel value={bbCat} onChange={v=>{if(v==="＋ Add category"){const n=addNewOption(customVendorCats,setCustomVendorCats,'onna_vendor_cats',"New category name:");if(n)setBbCat(n);}else{setBbCat(v);}}} options={allVendorCats} minWidth={170}/>
        <Sel value={bbLocation} onChange={v=>{if(v==="＋ Add location"){const n=addNewOption(customLocations,setCustomLocations,'onna_custom_locations',"New location name:");if(n)setBbLocation(n);}else{setBbLocation(v);}}} options={allLocations} minWidth={170}/>
        <span style={{fontSize:12,color:T.muted}}>{filteredBB.length} contacts</span>
        <button onClick={()=>downloadCSV(filteredBB,[{key:"name",label:"Name"},{key:"company",label:"Company"},{key:"category",label:"Category"},{key:"location",label:"Location"},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"website",label:"Website"},{key:"rateCard",label:"Rate Card"},{key:"notes",label:"Notes"}],"vendors.csv")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>CSV</button>
        <button onClick={()=>exportTablePDF(filteredBB,[{key:"name",label:"Name"},{key:"company",label:"Company"},{key:"category",label:"Category"},{key:"location",label:"Location"},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"website",label:"Website"}],"Vendors")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>PDF</button>
        <BtnPrimary onClick={()=>setShowAddVendor(true)}>+ New Vendor</BtnPrimary>
      </div>
      <div className="mob-table-wrap" style={{borderRadius:16,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <table style={{width:"100%",borderCollapse:"collapse",background:T.surface,minWidth:isMobile?520:"auto"}}>
          <thead><tr>
            <th style={{padding:"11px 8px",borderBottom:`1px solid ${T.border}`,width:32}}><input type="checkbox" checked={selectedIds.size===filteredBB.length&&filteredBB.length>0} onChange={toggleAll}/></th>
            <TH>Name</TH><TH>Company</TH><TH>Category</TH><TH>Email</TH><TH>Phone</TH><TH>Website</TH><TH>Location</TH>
          </tr></thead>
          <tbody>
            {filteredBB.map(b=>(
              <tr key={b.id} className="row" onClick={()=>{const d=b.dietaries;setEditVendor({...b,dietaries:typeof d==="string"?(() => {try{return JSON.parse(d)}catch{return []}})():Array.isArray(d)?d:[],_xContacts:getXContacts('vendor',b.id)});}} style={{cursor:"pointer",background:selectedIds.has(b.id)?"#fffbe6":undefined}}>
                <td style={{padding:"11px 8px",borderBottom:`1px solid ${T.borderSub}`}} onClick={e=>{e.stopPropagation();toggleId(b.id);}}><input type="checkbox" checked={selectedIds.has(b.id)} readOnly/></td>
                <TD bold>{b.name}</TD>
                <TD muted>{b.company||"\u2014"}</TD>
                <TD muted>{b.category||"\u2014"}</TD>
                <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}><a href={`mailto:${b.email}`} onClick={e=>e.stopPropagation()} style={{fontSize:12.5,color:T.link,textDecoration:"none"}}>{b.email||"\u2014"}</a></td>
                <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`,whiteSpace:"nowrap",fontSize:12.5,color:T.sub}}>{b.phone||"\u2014"}</td>
                <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}>{b.website?<a href={`https://${b.website}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:12.5,color:T.link,textDecoration:"none"}}>{b.website}</a>:<span style={{color:T.muted,fontSize:12.5}}>{"\u2014"}</span>}</td>
                <TD muted>{b.location||"\u2014"}</TD>
              </tr>
            ))}
            {filteredBB.length===0&&<tr><td colSpan={8} style={{padding:44,textAlign:"center",color:T.muted,fontSize:13}}>No contacts found.</td></tr>}
          </tbody>
        </table>
      </div>
      {selectedIds.size>0&&<BulkActionBar selectedIds={selectedIds} onDelete={bulkDelete} onChangeCategory={()=>{const cat=prompt("New category for selected vendors:");if(cat)bulkChangeCategory(cat);}} onChangeLocation={()=>{const loc=prompt("New location for selected vendors:");if(loc)bulkChangeLocation(loc);}} onClear={()=>setSelectedIds(new Set())}/>}
    </div>
  );
}
