import React from "react";

export default function Settings({T,isMobile,P,setAuthed,settingsSection,setSettingsSection,archive,setArchive,restoreItem,permanentlyDelete,catEdit,setCatEdit,catEditVal,setCatEditVal,catSaving,renameCat,deleteCat,renameLoc,deleteLoc,customLeadCats,customVendorCats,customLocations,setCustomLocations,hiddenBuiltinLocs,hiddenLeadBuiltins,hiddenVendorBuiltins,DEFAULT_LOCATIONS,LEAD_CATEGORIES,VENDORS_CATEGORIES,sops,setSops,sopFilter,setSopFilter,sopAddOpen,setSopAddOpen,sopEditId,setSopEditId,sopDraft,setSopDraft,sopPreview,setSopPreview,AGENT_DEFS,BtnPrimary,BtnSecondary,renderSopMarkdown,localProjects,localLeads,localClients,vendors,outreach,notes}){

  const _downloadFile=(filename,content,type="application/json")=>{
    const blob=new Blob([content],{type});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  };
  const _toCsv=(arr,cols)=>{
    if(!arr||!arr.length)return "";
    const keys=cols||Object.keys(arr[0]);
    const header=keys.join(",");
    const rows=arr.map(r=>keys.map(k=>{const v=r[k]??"";return typeof v==="string"&&(v.includes(",")||v.includes('"')||v.includes("\n"))?'"'+v.replace(/"/g,'""')+'"':String(v);}).join(","));
    return header+"\n"+rows.join("\n");
  };
  const _exportJson=()=>{
    const data={projects:localProjects||[],leads:localLeads||[],clients:localClients||[],vendors:vendors||[],outreach:outreach||[],notes:notes||[],sops:sops||[],exportedAt:new Date().toISOString()};
    _downloadFile("onna-export-"+new Date().toISOString().slice(0,10)+".json",JSON.stringify(data,null,2));
  };
  const _exportCsv=(name,arr)=>{
    if(!arr||!arr.length){alert("No "+name+" data to export.");return;}
    _downloadFile("onna-"+name+"-"+new Date().toISOString().slice(0,10)+".csv",_toCsv(arr),"text/csv");
  };
  return (
    <div style={{display:"flex",gap:0,margin:`-${P}px -${P}px -${isMobile?80:44}px`,height:`calc(100% + ${P}px + ${isMobile?80:44}px)`,overflow:"hidden"}}>
      {/* Settings Sidebar */}
      <div style={{width:220,flexShrink:0,borderRight:`1px solid ${T.border}`,padding:"28px 0",display:"flex",flexDirection:"column",gap:2}}>
        <div style={{padding:"0 20px",marginBottom:20}}>
          <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Settings</div>
          <div style={{fontSize:12,color:T.muted,marginTop:2}}>Manage your account</div>
        </div>
        {[
          {id:"deleted",label:"Deleted",icon:'<svg width="14" height="14" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="3" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 4v5.5a1 1 0 001 1h7a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.2"/><path d="M4.5 7h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>'},
          {id:"categories",label:"Manage Categories",icon:'<svg width="14" height="14" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>'},
          {id:"locations",label:"Manage Locations",icon:'<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1C4.8 1 3 2.8 3 5c0 3 4 7.5 4 7.5s4-4.5 4-7.5c0-2.2-1.8-4-4-4z" stroke="currentColor" strokeWidth="1.2"/><circle cx="7" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>'},
          {id:"sop",label:"SOPs",icon:'<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 1h8a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/><path d="M5 4h4M5 7h4M5 10h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>'},
          {id:"export",label:"Data Export",icon:'<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v8M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 11h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>'},
          {id:"security",label:"Security",icon:'<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L2 3v4c0 3.3 2.1 5.3 5 6 2.9-.7 5-2.7 5-6V3L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M5 7l2 2 3-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>'},
          {id:"tos",label:"Terms of Service",icon:'<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 1h8a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/><path d="M5 4h4M5 6.5h4M5 9h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>'},
          {id:"privacy",label:"Privacy Policy",icon:'<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M3 12c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>'},
          {id:"signout",label:"Sign Out",icon:'<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9 10l3-3-3-3M13 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>'},
        ].map(item=>(
          <button key={item.id} onClick={()=>{if(item.id==="signout"){localStorage.removeItem("onna_token");setAuthed(false);}else setSettingsSection(item.id);}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 20px",background:settingsSection===item.id&&item.id!=="signout"?"rgba(0,0,0,0.05)":"none",border:"none",borderLeft:settingsSection===item.id&&item.id!=="signout"?`3px solid ${T.accent}`:"3px solid transparent",color:item.id==="signout"?"#c0392b":settingsSection===item.id?T.text:T.sub,fontSize:13,fontWeight:settingsSection===item.id?600:500,cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%"}} onMouseOver={e=>{if(settingsSection!==item.id)e.currentTarget.style.background="rgba(0,0,0,0.03)";}} onMouseOut={e=>{if(settingsSection!==item.id)e.currentTarget.style.background="none";}}>
            <span dangerouslySetInnerHTML={{__html:item.icon}}/>
            {item.label}
            {item.id==="deleted"&&archive.length>0&&<span style={{marginLeft:"auto",background:T.borderSub,borderRadius:999,padding:"1px 7px",fontSize:10.5,color:T.sub}}>{archive.length}</span>}
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div style={{flex:1,padding:28,overflowY:"auto"}}>
        {settingsSection==="deleted"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div>
                <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Deleted Items</div>
                <div style={{fontSize:12,color:T.muted,marginTop:2}}>Deleted items are permanently removed after 30 days</div>
              </div>
              {archive.length>0&&<button onClick={()=>{if(window.confirm("Permanently remove all deleted items?"))setArchive(()=>{try{localStorage.removeItem('onna_archive');}catch{}return [];});}} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,color:T.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:"6px 14px"}}>Clear all</button>}
            </div>
            {archive.length===0?(
              <div style={{padding:"60px 0",textAlign:"center",color:T.muted,fontSize:13}}>No deleted items.</div>
            ):(
              ["todos","notes","dashNotes","leads","vendors","outreach","estimates","projects","callSheets","riskAssessments","contracts","travelItineraries","dietaries","clients"].map(table=>{
                const entries=archive.filter(e=>e.table===table);
                if(!entries.length) return null;
                const label={todos:"Tasks",notes:"Notes",dashNotes:"Dashboard Notes",leads:"Leads",vendors:"Vendors",outreach:"Outreach",estimates:"Estimates",projects:"Projects",callSheets:"Call Sheets",riskAssessments:"Risk Assessments",contracts:"Contracts",travelItineraries:"Travel Itineraries",dietaries:"Dietary Lists",clients:"Clients"}[table]||table;
                return (
                  <div key={table} style={{marginBottom:24}}>
                    <div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>{label} ({entries.length})</div>
                    {entries.map(e=>{
                      const daysLeft=Math.max(0,30-Math.floor((Date.now()-new Date(e.deletedAt).getTime())/(86400000)));
                      return (
                        <div key={e.id} style={{display:"flex",alignItems:"center",padding:"10px 12px",borderRadius:10,border:`1px solid ${T.border}`,marginBottom:6,background:"#fafafa"}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.item?.text||e.item?.title||e.item?.company||e.item?.name||e.item?.callSheet?.label||e.item?.riskAssessment?.label||e.item?.contract?.label||e.item?.travelItinerary?.label||e.item?.dietary?.label||e.item?.label||"Untitled"}</div>
                            <div style={{fontSize:11,color:T.muted,marginTop:2}}>{daysLeft} day{daysLeft!==1?"s":""} remaining</div>
                          </div>
                          <div style={{display:"flex",gap:6}}>
                            <button onClick={()=>restoreItem(e)} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,color:T.sub,cursor:"pointer",padding:"4px 10px",fontFamily:"inherit"}}>Restore</button>
                            <button onClick={()=>permanentlyDelete(e.id)} style={{background:"none",border:"none",fontSize:11,color:"#c0392b",cursor:"pointer",padding:"4px 8px",fontFamily:"inherit"}}>Delete</button>
                          </div>
                        </div>
                      ); })}
                  </div>
                ); })
            )}
          </div>
        )}
        {settingsSection==="categories"&&(
          <div>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Manage Categories</div>
              <div style={{fontSize:12,color:T.muted,marginTop:2}}>Edit or delete client and vendor categories</div>
            </div>
            {[
              {label:"Client Categories",type:"lead",builtin:LEAD_CATEGORIES.filter(c=>c!=="All"),custom:customLeadCats,hidden:hiddenLeadBuiltins},
              {label:"Vendor Categories",type:"vendor",builtin:VENDORS_CATEGORIES,custom:customVendorCats,hidden:hiddenVendorBuiltins},
            ].map(section=>(
              <div key={section.type} style={{marginBottom:28}}>
                <div style={{fontSize:10,color:T.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12,paddingBottom:7,borderBottom:`1px solid ${T.border}`}}>{section.label}</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {section.builtin.filter(c=>!section.hidden.includes(c)).map(cat=>(
                    <div key={cat} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`}}>
                      {catEdit&&catEdit.type===section.type&&catEdit.cat===cat?(
                        <>
                          <input autoFocus value={catEditVal} onChange={e=>setCatEditVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")renameCat(section.type,cat,catEditVal);if(e.key==="Escape")setCatEdit(null);}} style={{flex:1,border:`1.5px solid ${T.accent}`,borderRadius:7,padding:"5px 8px",fontSize:13,fontFamily:"inherit",outline:"none",background:"white"}}/>
                          <button disabled={catSaving} onClick={()=>renameCat(section.type,cat,catEditVal)} style={{background:T.accent,border:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",padding:"4px 10px",borderRadius:6,fontFamily:"inherit",opacity:catSaving?0.5:1}}>Save</button>
                          <button onClick={()=>setCatEdit(null)} style={{background:"none",border:"none",color:T.muted,fontSize:11,cursor:"pointer",padding:"4px 6px",fontFamily:"inherit"}}>Cancel</button>
                        </>
                      ):(
                        <>
                          <span style={{flex:1,fontSize:13,color:T.text}}>{cat}</span>
                          <span style={{fontSize:10,color:T.muted,background:"#f0ede8",borderRadius:999,padding:"2px 8px",fontWeight:500}}>built-in</span>
                          <button disabled={catSaving} onClick={()=>{setCatEdit({type:section.type,cat});setCatEditVal(cat);}} style={{background:"none",border:"none",color:T.sub,fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#f0f0f5"} onMouseOut={e=>e.currentTarget.style.background="none"}>Rename</button>
                          <button disabled={catSaving} onClick={async()=>{if(!window.confirm('Delete "'+cat+'"? All '+(section.type==='lead'?'clients':'vendors')+' in this category will have it cleared.'))return;await deleteCat(section.type,cat);}} style={{background:"none",border:"none",color:"#c0392b",fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,opacity:catSaving?0.4:1,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#fff0f0"} onMouseOut={e=>e.currentTarget.style.background="none"}>Delete</button>
                        </>
                      )}
                    </div>
                  ))}
                  {section.custom.map(cat=>(
                    <div key={cat} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`}}>
                      {catEdit&&catEdit.type===section.type&&catEdit.cat===cat?(
                        <>
                          <input autoFocus value={catEditVal} onChange={e=>setCatEditVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")renameCat(section.type,cat,catEditVal);if(e.key==="Escape")setCatEdit(null);}} style={{flex:1,border:`1.5px solid ${T.accent}`,borderRadius:7,padding:"5px 8px",fontSize:13,fontFamily:"inherit",outline:"none",background:"white"}}/>
                          <button disabled={catSaving} onClick={()=>renameCat(section.type,cat,catEditVal)} style={{background:T.accent,border:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",padding:"4px 10px",borderRadius:6,fontFamily:"inherit",opacity:catSaving?0.5:1}}>Save</button>
                          <button onClick={()=>setCatEdit(null)} style={{background:"none",border:"none",color:T.muted,fontSize:11,cursor:"pointer",padding:"4px 6px",fontFamily:"inherit"}}>Cancel</button>
                        </>
                      ):(
                        <>
                          <span style={{flex:1,fontSize:13,color:T.text}}>{cat}</span>
                          <button disabled={catSaving} onClick={()=>{setCatEdit({type:section.type,cat});setCatEditVal(cat);}} style={{background:"none",border:"none",color:T.sub,fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#f0f0f5"} onMouseOut={e=>e.currentTarget.style.background="none"}>Rename</button>
                          <button disabled={catSaving} onClick={async()=>{if(!window.confirm('Delete "'+cat+'"? All '+(section.type==='lead'?'clients':'vendors')+' in this category will have it cleared.'))return;await deleteCat(section.type,cat);}} style={{background:"none",border:"none",color:"#c0392b",fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,opacity:catSaving?0.4:1,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#fff0f0"} onMouseOut={e=>e.currentTarget.style.background="none"}>Delete</button>
                        </>
                      )}
                    </div>
                  ))}
                  {section.builtin.filter(c=>!section.hidden.includes(c)).length===0&&section.custom.length===0&&(
                    <div style={{fontSize:13,color:T.muted,padding:"12px 0",textAlign:"center"}}>No categories.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {settingsSection==="locations"&&(
          <div>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Manage Locations</div>
              <div style={{fontSize:12,color:T.muted,marginTop:2}}>Edit or delete locations used across the app</div>
            </div>
            <div style={{marginBottom:28}}>
              <div style={{fontSize:10,color:T.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12,paddingBottom:7,borderBottom:`1px solid ${T.border}`}}>Locations</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {DEFAULT_LOCATIONS.filter(l=>!hiddenBuiltinLocs.includes(l)).map(loc=>(
                  <div key={loc} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`}}>
                    {catEdit&&catEdit.type==="location"&&catEdit.cat===loc?(
                      <>
                        <input autoFocus value={catEditVal} onChange={e=>setCatEditVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")renameLoc(loc,catEditVal);if(e.key==="Escape")setCatEdit(null);}} style={{flex:1,border:`1.5px solid ${T.accent}`,borderRadius:7,padding:"5px 8px",fontSize:13,fontFamily:"inherit",outline:"none",background:"white"}}/>
                        <button disabled={catSaving} onClick={()=>renameLoc(loc,catEditVal)} style={{background:T.accent,border:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",padding:"4px 10px",borderRadius:6,fontFamily:"inherit",opacity:catSaving?0.5:1}}>Save</button>
                        <button onClick={()=>setCatEdit(null)} style={{background:"none",border:"none",color:T.muted,fontSize:11,cursor:"pointer",padding:"4px 6px",fontFamily:"inherit"}}>Cancel</button>
                      </>
                    ):(
                      <>
                        <span style={{flex:1,fontSize:13,color:T.text}}>{loc}</span>
                        <span style={{fontSize:10,color:T.muted,background:"#f0ede8",borderRadius:999,padding:"2px 8px",fontWeight:500}}>built-in</span>
                        <button disabled={catSaving} onClick={()=>{setCatEdit({type:"location",cat:loc});setCatEditVal(loc);}} style={{background:"none",border:"none",color:T.sub,fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#f0f0f5"} onMouseOut={e=>e.currentTarget.style.background="none"}>Rename</button>
                        <button disabled={catSaving} onClick={async()=>{if(!window.confirm('Delete "'+loc+'"? It will be removed from all vendors and clients.'))return;await deleteLoc(loc);}} style={{background:"none",border:"none",color:"#c0392b",fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,opacity:catSaving?0.4:1,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#fff0f0"} onMouseOut={e=>e.currentTarget.style.background="none"}>Delete</button>
                      </>
                    )}
                  </div>
                ))}
                {customLocations.map(loc=>(
                  <div key={loc} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`}}>
                    {catEdit&&catEdit.type==="location"&&catEdit.cat===loc?(
                      <>
                        <input autoFocus value={catEditVal} onChange={e=>setCatEditVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")renameLoc(loc,catEditVal);if(e.key==="Escape")setCatEdit(null);}} style={{flex:1,border:`1.5px solid ${T.accent}`,borderRadius:7,padding:"5px 8px",fontSize:13,fontFamily:"inherit",outline:"none",background:"white"}}/>
                        <button disabled={catSaving} onClick={()=>renameLoc(loc,catEditVal)} style={{background:T.accent,border:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",padding:"4px 10px",borderRadius:6,fontFamily:"inherit",opacity:catSaving?0.5:1}}>Save</button>
                        <button onClick={()=>setCatEdit(null)} style={{background:"none",border:"none",color:T.muted,fontSize:11,cursor:"pointer",padding:"4px 6px",fontFamily:"inherit"}}>Cancel</button>
                      </>
                    ):(
                      <>
                        <span style={{flex:1,fontSize:13,color:T.text}}>{loc}</span>
                        <button disabled={catSaving} onClick={()=>{setCatEdit({type:"location",cat:loc});setCatEditVal(loc);}} style={{background:"none",border:"none",color:T.sub,fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#f0f0f5"} onMouseOut={e=>e.currentTarget.style.background="none"}>Rename</button>
                        <button disabled={catSaving} onClick={async()=>{if(!window.confirm('Delete "'+loc+'"? It will be removed from all vendors and clients.'))return;await deleteLoc(loc);}} style={{background:"none",border:"none",color:"#c0392b",fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,opacity:catSaving?0.4:1,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#fff0f0"} onMouseOut={e=>e.currentTarget.style.background="none"}>Delete</button>
                      </>
                    )}
                  </div>
                ))}
                {DEFAULT_LOCATIONS.filter(l=>!hiddenBuiltinLocs.includes(l)).length===0&&customLocations.length===0&&(
                  <div style={{fontSize:13,color:T.muted,padding:"12px 0",textAlign:"center"}}>No locations.</div>
                )}
              </div>
              <button onClick={()=>{const val=window.prompt("New location name:");if(!val||!val.trim())return;const trimmed=val.trim();if([...DEFAULT_LOCATIONS,...customLocations].includes(trimmed))return;setCustomLocations(prev=>[...prev,trimmed]);}} style={{marginTop:12,background:"none",border:`1px solid ${T.border}`,borderRadius:8,color:T.sub,fontSize:12,fontWeight:600,cursor:"pointer",padding:"8px 16px",fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#f0f0f5"} onMouseOut={e=>e.currentTarget.style.background="none"}>+ Add location</button>
            </div>
          </div>
        )}
        {settingsSection==="sop"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div>
                <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Standard Operating Procedures</div>
                <div style={{fontSize:12,color:T.muted,marginTop:2}}>Agent guides and production workflows</div>
              </div>
              <BtnPrimary onClick={()=>{setSopAddOpen(true);setSopEditId(null);setSopDraft({title:"",content:"",category:"agent",agent:""});setSopPreview(false);}}>+ New SOP</BtnPrimary>
            </div>

            {/* Filter tabs */}
            <div style={{display:"flex",gap:6,marginBottom:20}}>
              {[{id:"all",label:"All"},{id:"agent",label:"Agent Guides"},{id:"workflow",label:"Workflows"}].map(f=>(
                <button key={f.id} onClick={()=>setSopFilter(f.id)} style={{padding:"5px 14px",borderRadius:999,background:sopFilter===f.id?T.accent:"#f5f5f7",color:sopFilter===f.id?"#fff":T.sub,border:"none",fontSize:11.5,fontWeight:sopFilter===f.id?600:500,cursor:"pointer",fontFamily:"inherit"}}>{f.label}</button>
              ))}
            </div>

            {/* Add/Edit form */}
            {(sopAddOpen||(sopEditId!==null&&typeof sopEditId==="number"))&&(
              <div style={{padding:18,borderRadius:12,border:`1.5px solid ${T.accent}`,background:"white",marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12}}>{typeof sopEditId==="number"?"Edit SOP":"New SOP"}</div>
                <div style={{display:"grid",gridTemplateColumns:sopDraft.category==="agent"?"1fr 1fr 1fr":"1fr 1fr",gap:10,marginBottom:12}}>
                  <div>
                    <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Title</div>
                    <input value={sopDraft.title} onChange={e=>setSopDraft(d=>({...d,title:e.target.value}))} placeholder="e.g. How to use Vendor Vinnie" style={{width:"100%",padding:"8px 11px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Category</div>
                    <select value={sopDraft.category} onChange={e=>setSopDraft(d=>({...d,category:e.target.value,agent:e.target.value==="workflow"?"":d.agent}))} style={{width:"100%",padding:"8px 11px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}>
                      <option value="agent">Agent Guide</option>
                      <option value="workflow">Workflow</option>
                    </select>
                  </div>
                  {sopDraft.category==="agent"&&(
                    <div>
                      <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Agent</div>
                      <select value={sopDraft.agent} onChange={e=>setSopDraft(d=>({...d,agent:e.target.value}))} style={{width:"100%",padding:"8px 11px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}>
                        <option value="">Select agent...</option>
                        {AGENT_DEFS.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <button onClick={()=>setSopPreview(false)} style={{padding:"4px 12px",borderRadius:7,background:!sopPreview?"#1d1d1f":"#f5f5f7",color:!sopPreview?"#fff":T.sub,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Write</button>
                  <button onClick={()=>setSopPreview(true)} style={{padding:"4px 12px",borderRadius:7,background:sopPreview?"#1d1d1f":"#f5f5f7",color:sopPreview?"#fff":T.sub,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Preview</button>
                </div>
                {sopPreview?(
                  <div style={{minHeight:120,padding:14,borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`}} dangerouslySetInnerHTML={{__html:renderSopMarkdown(sopDraft.content)||`<span style="color:${T.muted};font-size:13px">Nothing to preview</span>`}}/>
                ):(
                  <textarea value={sopDraft.content} onChange={e=>setSopDraft(d=>({...d,content:e.target.value}))} rows={8} placeholder={"# Getting Started\n\nDescribe the procedure step by step...\n\n## Steps\n\n1. First step\n2. Second step\n\n- Use **bold** for emphasis"} style={{width:"100%",padding:"10px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"monospace",resize:"vertical",lineHeight:"1.6"}}/>
                )}
                <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}>
                  <BtnSecondary onClick={()=>{setSopAddOpen(false);setSopEditId(null);setSopDraft({title:"",content:"",category:"agent",agent:""});setSopPreview(false);}}>Cancel</BtnSecondary>
                  <BtnPrimary disabled={!sopDraft.title.trim()||!sopDraft.content.trim()} onClick={()=>{
                    const now=new Date().toISOString();
                    if(typeof sopEditId==="number"){
                      setSops(prev=>prev.map(s=>s.id===sopEditId?{...s,title:sopDraft.title,content:sopDraft.content,category:sopDraft.category,agent:sopDraft.agent,updated_at:now}:s));
                    }else{
                      const id=Date.now();
                      setSops(prev=>[...prev,{id,title:sopDraft.title,content:sopDraft.content,category:sopDraft.category,agent:sopDraft.agent,order:prev.length,created_at:now,updated_at:now}]);
                    }
                    setSopAddOpen(false);setSopEditId(null);setSopDraft({title:"",content:"",category:"agent",agent:""});setSopPreview(false);
                  }}>{typeof sopEditId==="number"?"Save Changes":"Create SOP"}</BtnPrimary>
                </div>
              </div>
            )}

            {/* SOP list */}
            {(()=>{
              const filtered=sops.filter(s=>sopFilter==="all"||s.category===sopFilter);
              if(filtered.length===0) return (
                <div style={{padding:"60px 0",textAlign:"center"}}>
                  <div style={{fontSize:32,marginBottom:8}}>📋</div>
                  <div style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:4}}>No SOPs yet</div>
                  <div style={{fontSize:12,color:T.muted,maxWidth:300,margin:"0 auto",lineHeight:1.6}}>Create agent guides for your team to learn how to use each of the 7 agents, or add production workflow documentation.</div>
                </div>
              );
              const agents=filtered.filter(s=>s.category==="agent");
              const workflows=filtered.filter(s=>s.category==="workflow");
              const renderGroup=(label,items)=>{
                if(!items.length) return null;
                return (
                  <div key={label} style={{marginBottom:24}}>
                    <div style={{fontSize:10,color:T.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>{label} ({items.length})</div>
                    {items.map(s=>{
                      const isExpanded=sopEditId===("view_"+s.id);
                      const agentDef=s.agent?AGENT_DEFS.find(a=>a.id===s.agent):null;

                      return (
                        <div key={s.id} style={{marginBottom:6,borderRadius:12,border:`1px solid ${T.border}`,background:"#fafafa",overflow:"hidden"}}>
                          <div onClick={()=>setSopEditId(prev=>prev===("view_"+s.id)?null:("view_"+s.id))} style={{display:"flex",alignItems:"center",padding:"12px 14px",cursor:"pointer",gap:10}} onMouseOver={e=>e.currentTarget.style.background="#f0f0f5"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:13,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</div>
                              <div style={{fontSize:11,color:T.muted,marginTop:2,display:"flex",alignItems:"center",gap:8}}>
                                {agentDef&&<span style={{background:agentDef.tagBg,color:agentDef.accent,padding:"1px 8px",borderRadius:999,fontSize:10,fontWeight:600}}>{agentDef.name}</span>}
                                <span>Updated {new Date(s.updated_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
                              <button onClick={()=>{setSopEditId(s.id);setSopDraft({title:s.title,content:s.content,category:s.category,agent:s.agent||""});setSopAddOpen(false);setSopPreview(false);}} style={{background:"none",border:"none",color:T.sub,fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#f0f0f5"} onMouseOut={e=>e.currentTarget.style.background="none"}>Edit</button>
                              <button onClick={()=>{if(window.confirm("Delete this SOP?"))setSops(prev=>prev.filter(x=>x.id!==s.id));}} style={{background:"none",border:"none",color:"#c0392b",fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#fff0f0"} onMouseOut={e=>e.currentTarget.style.background="none"}>Delete</button>
                            </div>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{transform:isExpanded?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.15s"}}><path d="M2 3.5L5 6.5L8 3.5" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                          {isExpanded&&(
                            <div style={{padding:"0 14px 14px",borderTop:`1px solid ${T.border}`}}>
                              <div style={{paddingTop:12}} dangerouslySetInnerHTML={{__html:renderSopMarkdown(s.content)}}/>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              };
              return <>{renderGroup("Agent Guides",agents)}{renderGroup("Workflows",workflows)}</>;
            })()}
          </div>
        )}
        {settingsSection==="export"&&(
          <div>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Data Export</div>
              <div style={{fontSize:12,color:T.muted,marginTop:2}}>Download your data as JSON or CSV files</div>
            </div>
            <div style={{padding:18,borderRadius:12,border:`1px solid ${T.border}`,background:"#fafafa",marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12}}>Full Export</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:14,lineHeight:1.6}}>Export all your data (projects, leads, clients, vendors, outreach, notes, SOPs) as a single JSON file.</div>
              <button onClick={_exportJson} style={{background:T.accent,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",padding:"8px 18px",borderRadius:8,fontFamily:"inherit"}}>Export All Data (JSON)</button>
            </div>
            <div style={{padding:18,borderRadius:12,border:`1px solid ${T.border}`,background:"#fafafa"}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12}}>Individual CSV Exports</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:14,lineHeight:1.6}}>Export individual data types as CSV files for use in spreadsheets.</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {[
                  {label:"Projects",data:localProjects,name:"projects"},
                  {label:"Leads",data:localLeads,name:"leads"},
                  {label:"Clients",data:localClients,name:"clients"},
                  {label:"Vendors",data:vendors,name:"vendors"},
                  {label:"Outreach",data:outreach,name:"outreach"},
                  {label:"Notes",data:notes,name:"notes"},
                ].map(item=>(
                  <button key={item.name} onClick={()=>_exportCsv(item.name,item.data)} style={{background:"white",border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",padding:"7px 14px",fontFamily:"inherit",color:T.text}} onMouseOver={e=>e.currentTarget.style.background="#f0f0f5"} onMouseOut={e=>e.currentTarget.style.background="white"}>{item.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}
        {settingsSection==="security"&&(
          <div>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Security Overview</div>
              <div style={{fontSize:12,color:T.muted,marginTop:2}}>How Onna protects your data</div>
            </div>
            {[
              {title:"Encryption at Rest",desc:"All vault data is encrypted using AES-256-GCM with PBKDF2-derived keys. Encryption keys are derived per-user and never stored in plaintext."},
              {title:"Transport Security",desc:"All connections use HTTPS with TLS 1.2+. HSTS (HTTP Strict Transport Security) is enabled with preload to prevent protocol downgrade attacks."},
              {title:"Authentication",desc:"User sessions are secured with JWT tokens. Passwords are hashed using bcrypt with a cost factor of 10 on the backend. Tokens expire after a configurable period."},
              {title:"Infrastructure",desc:"Frontend is hosted on Vercel's edge network with automatic DDoS protection. Database uses Turso (LibSQL) with encrypted connections and automatic backups."},
              {title:"CORS & API Security",desc:"API proxy restricts requests to whitelisted origins only. All API routes validate the origin header and reject unauthorized cross-origin requests."},
              {title:"Rate Limiting",desc:"General API endpoints: 120 requests per minute. Authentication endpoints: 10 requests per minute. Rate limits are enforced per-IP at the serverless function level."},
              {title:"Security Headers",desc:"X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy restricts camera, microphone, and geolocation access."},
              {title:"Data Residency",desc:"Deployment region is configurable. By default, the application and database are deployed to regions compliant with your organization's data residency requirements."},
            ].map((item,i)=>(
              <div key={i} style={{padding:"14px 16px",borderRadius:10,border:`1px solid ${T.border}`,background:"#fafafa",marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:4}}>{item.title}</div>
                <div style={{fontSize:12,color:T.sub,lineHeight:1.6}}>{item.desc}</div>
              </div>
            ))}
          </div>
        )}
        {settingsSection==="tos"&&(
          <div style={{maxWidth:720}}>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Terms of Service</div>
              <div style={{fontSize:12,color:T.muted,marginTop:2}}>Last updated: March 1, 2026</div>
            </div>
            <div style={{fontSize:13,color:T.sub,lineHeight:1.8}}>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>1. Acceptance of Terms</strong><br/>By accessing or using the Onna platform ("Service"), operated by Onna World FZ-LLC ("Onna", "we", "us"), registered in Dubai, UAE, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>2. Description of Service</strong><br/>Onna is a production management platform that provides project tracking, client and vendor management, AI-powered agents, document generation, outreach tracking, and related tools for creative and production professionals.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>3. User Accounts</strong><br/>You must provide accurate registration information and maintain the confidentiality of your account credentials. You are responsible for all activity under your account. Notify us immediately of any unauthorized use.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>4. Acceptable Use</strong><br/>You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to gain unauthorized access to any part of the Service; (c) interfere with or disrupt the Service or its infrastructure; (d) reverse-engineer, decompile, or disassemble any part of the Service; (e) use automated systems to access the Service beyond normal usage patterns.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>5. Intellectual Property</strong><br/>The Service, including its design, code, AI agents, and documentation, is the property of Onna World FZ-LLC. Your data remains yours. By using the Service, you grant us a limited license to process your data solely to provide the Service.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>6. Data & Privacy</strong><br/>Your use of the Service is also governed by our Privacy Policy. We implement industry-standard security measures including AES-256 encryption, HTTPS transport, and bcrypt password hashing.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>7. AI Agents</strong><br/>Onna provides AI-powered agents for production assistance. AI outputs are advisory and should be reviewed before use in production decisions. Onna is not liable for decisions made based on AI agent outputs.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>8. Service Availability</strong><br/>We strive for high availability but do not guarantee uninterrupted access. We may perform maintenance, updates, or modifications to the Service with or without notice. We are not liable for any downtime or data loss.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>9. Limitation of Liability</strong><br/>To the maximum extent permitted by law, Onna shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>10. Termination</strong><br/>We may suspend or terminate your access to the Service at any time for violation of these Terms. Upon termination, your right to use the Service ceases immediately. You may export your data before termination using the Data Export feature.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>11. Governing Law</strong><br/>These Terms are governed by the laws of the United Arab Emirates and the Emirate of Dubai. Any disputes shall be resolved in the courts of Dubai, UAE.</p>
              <p style={{marginBottom:0}}><strong style={{color:T.text}}>12. Contact</strong><br/>For questions about these Terms, contact us at legal@onna.world.</p>
            </div>
          </div>
        )}
        {settingsSection==="privacy"&&(
          <div style={{maxWidth:720}}>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Privacy Policy</div>
              <div style={{fontSize:12,color:T.muted,marginTop:2}}>Last updated: March 1, 2026</div>
            </div>
            <div style={{fontSize:13,color:T.sub,lineHeight:1.8}}>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>1. Introduction</strong><br/>Onna World FZ-LLC ("Onna", "we", "us"), based in Dubai, UAE, is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use the Onna platform ("Service").</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>2. Information We Collect</strong><br/><em>Account Information:</em> Name, email address, and password (hashed with bcrypt) when you register.<br/><em>Usage Data:</em> Projects, leads, clients, vendors, outreach records, notes, SOPs, and other content you create within the Service.<br/><em>Technical Data:</em> Browser type, IP address, and access timestamps for security and rate-limiting purposes.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>3. How We Use Your Information</strong><br/>We use your information to: (a) provide and maintain the Service; (b) authenticate your identity; (c) process your data through AI agents at your request; (d) enforce rate limits and prevent abuse; (e) communicate service updates when necessary.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>4. Data Storage & Security</strong><br/>Your data is encrypted at rest using AES-256-GCM. All data in transit is protected via HTTPS/TLS 1.2+. Passwords are hashed using bcrypt. Our infrastructure is hosted on Vercel with database services provided by Turso (LibSQL). We implement CORS restrictions, rate limiting, and security headers to protect against common attack vectors.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>5. AI Processing</strong><br/>When you use AI agents, your prompts and relevant context data are sent to third-party AI providers (Anthropic) for processing. We do not use your data to train AI models. AI interactions are not stored beyond the duration of the request.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>6. Data Sharing</strong><br/>We do not sell, rent, or trade your personal information. We may share data with: (a) infrastructure providers (Vercel, Turso) as necessary to operate the Service; (b) AI providers (Anthropic) to process agent requests; (c) law enforcement if required by applicable law.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>7. Data Retention</strong><br/>Your data is retained as long as your account is active. Deleted items are permanently removed after 30 days. You may export all your data at any time using the Data Export feature in Settings.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>8. Your Rights</strong><br/>You have the right to: (a) access your data via the platform; (b) export your data in JSON or CSV format; (c) request deletion of your account and associated data; (d) correct inaccurate information in your account.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>9. Cookies & Local Storage</strong><br/>We use browser local storage to cache data for offline access and performance. We use a JWT token stored in local storage for authentication. We do not use tracking cookies or third-party analytics.</p>
              <p style={{marginBottom:16}}><strong style={{color:T.text}}>10. International Data Transfers</strong><br/>Your data may be processed in regions where our infrastructure providers operate. We ensure appropriate safeguards are in place for any cross-border data transfers.</p>
              <p style={{marginBottom:0}}><strong style={{color:T.text}}>11. Contact</strong><br/>For privacy-related inquiries, contact us at privacy@onna.world.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
