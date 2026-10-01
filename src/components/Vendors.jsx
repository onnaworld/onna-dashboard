import React, { useState, useEffect } from "react";
import BulkActionBar from "./ui/BulkActionBar";
import { Typeahead } from "./ui/Typeahead";

// Click-to-edit table cell — click anywhere in the cell to turn it into a
// text input, blur/Enter commits, Escape cancels. Stops the row's own
// onClick (which opens the full edit modal) so editing in-place doesn't
// also pop the modal open.
function VendorCell({ value, onSave, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value || "");
  useEffect(() => { if (!editing) setTemp(value || ""); }, [value, editing]);
  const commit = () => {
    setEditing(false);
    if (temp !== (value || "")) onSave(temp);
  };
  if (editing) {
    return (
      <input
        autoFocus
        value={temp}
        onChange={e => setTemp(e.target.value)}
        onBlur={commit}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => {
          if (e.key === "Enter") e.target.blur();
          if (e.key === "Escape") { setTemp(value || ""); setEditing(false); }
        }}
        style={{ fontSize: 12.5, fontFamily: "inherit", border: "1px solid #ddd", borderRadius: 4, padding: "3px 6px", width: "100%", boxSizing: "border-box", outline: "none" }}
      />
    );
  }
  return (
    <span
      onClick={e => { e.stopPropagation(); setEditing(true); }}
      title="Click to edit"
      style={{ cursor: "text", display: "block", minHeight: 16, color: value ? undefined : "#bbb" }}
    >
      {value || placeholder || "—"}
    </span>
  );
}

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
  // Inline table-cell edit — saves immediately, no modal needed.
  const updateVendorField = (id, field, value) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
    api.put(`/api/vendors/${id}`, { [field]: value }).catch(() => {});
  };
  // "+ New Vendor" drops a blank row straight into the table (top) instead of
  // opening a modal — fill it in via the inline cells above.
  const [addingBlank, setAddingBlank] = useState(false);
  const addBlankVendor = async () => {
    if (addingBlank) return;
    setAddingBlank(true);
    const payload = { name: "", company: "", category: bbCat !== "All" ? bbCat : "", email: "", phone: "", website: "", location: bbLocation !== "All" ? bbLocation : "", notes: "", rateCard: "" };
    try {
      const saved = await api.post("/api/vendors", payload);
      if (saved && saved.id) setVendors(prev => [saved, ...prev]);
      else if (saved && saved.queued) setVendors(prev => [{ ...payload, id: Date.now(), _queued: true }, ...prev]);
    } catch {}
    setAddingBlank(false);
  };
  const openVendorCard = (b) => {
    const d = b.dietaries;
    setEditVendor({ ...b, dietaries: typeof d === "string" ? (() => { try { return JSON.parse(d); } catch { return []; } })() : Array.isArray(d) ? d : [], _xContacts: getXContacts('vendor', b.id) });
  };
  const vendorNameOptions = vendors.map(v => v.name).filter(Boolean);
  const categoryOptions = allVendorCats.filter(c => c !== "All");
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <SearchBar value={getSearch("Vendors")} onChange={v=>setSearch("Vendors",v)} placeholder="Search contacts…"/>
        <Sel value={bbCat} onChange={v=>{if(v==="＋ Add category"){const n=addNewOption(customVendorCats,setCustomVendorCats,'onna_vendor_cats',"New category name:");if(n)setBbCat(n);}else{setBbCat(v);}}} options={allVendorCats} minWidth={170} searchable/>
        <Sel value={bbLocation} onChange={v=>{if(v==="＋ Add location"){const n=addNewOption(customLocations,setCustomLocations,'onna_custom_locations',"New location name:");if(n)setBbLocation(n);}else{setBbLocation(v);}}} options={allLocations} minWidth={170} searchable/>
        <span style={{fontSize:12,color:T.muted}}>{filteredBB.length} contacts</span>
        <button onClick={()=>downloadCSV(filteredBB,[{key:"name",label:"Name"},{key:"category",label:"Category"},{key:"location",label:"Location"},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"website",label:"Website"},{key:"rateCard",label:"Instagram"},{key:"notes",label:"Notes"}],"vendors.csv")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>CSV</button>
        <button onClick={()=>exportTablePDF(filteredBB,[{key:"name",label:"Name"},{key:"category",label:"Category"},{key:"location",label:"Location"},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"website",label:"Website"}],"Vendors")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>PDF</button>
        <BtnPrimary onClick={addBlankVendor} disabled={addingBlank}>+ New Vendor</BtnPrimary>
      </div>
      <div className="mob-table-wrap" style={{borderRadius:16,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <table style={{width:"100%",borderCollapse:"collapse",background:T.surface,minWidth:isMobile?520:"auto"}}>
          <thead><tr>
            <th style={{padding:"11px 8px",borderBottom:`1px solid ${T.border}`,width:32}}><input type="checkbox" checked={selectedIds.size===filteredBB.length&&filteredBB.length>0} onChange={toggleAll}/></th>
            <TH>Name</TH><TH>Category</TH><TH>Email</TH><TH>Phone</TH><TH>Website</TH><TH>Location</TH>
            <th style={{padding:"11px 8px",borderBottom:`1px solid ${T.border}`,width:32}}></th>
          </tr></thead>
          <tbody>
            {filteredBB.map(b=>(
              <tr key={b.id} className="row" style={{background:selectedIds.has(b.id)?"#fffbe6":undefined}}>
                <td style={{padding:"11px 8px",borderBottom:`1px solid ${T.borderSub}`}}><input type="checkbox" checked={selectedIds.has(b.id)} onChange={()=>toggleId(b.id)}/></td>
                <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`,fontSize:12.5,fontWeight:600,color:T.text}}>
                  <Typeahead value={b.name} options={vendorNameOptions.filter(n=>n!==b.name)} onChange={v=>updateVendorField(b.id,"name",v)} onPickExisting={n=>{const match=vendors.find(v=>v.name===n);if(match)openVendorCard(match);}} />
                </td>
                <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`,fontSize:12.5,color:T.muted}}>
                  <Typeahead value={b.category} options={categoryOptions} onChange={v=>updateVendorField(b.id,"category",v)} />
                </td>
                <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`,fontSize:12.5,color:T.link}}><VendorCell value={b.email} onSave={v=>updateVendorField(b.id,"email",v)} /></td>
                <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`,fontSize:12.5,color:T.sub}}><VendorCell value={b.phone} onSave={v=>updateVendorField(b.id,"phone",v)} /></td>
                <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`,fontSize:12.5,color:T.link}}><VendorCell value={b.website} onSave={v=>updateVendorField(b.id,"website",v)} /></td>
                <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`,fontSize:12.5,color:T.muted}}>
                  <Typeahead value={b.location} options={allLocations} onChange={v=>updateVendorField(b.id,"location",v)} />
                </td>
                <td style={{padding:"11px 8px",borderBottom:`1px solid ${T.borderSub}`,textAlign:"center"}}>
                  <button onClick={()=>openVendorCard(b)} title="Open full details" style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:14,padding:2,lineHeight:1}}>⤢</button>
                </td>
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
