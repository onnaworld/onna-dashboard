import React from "react";

export default function Settings({T,isMobile,P,setAuthed,settingsSection,setSettingsSection,archive,setArchive,restoreItem,permanentlyDelete,catEdit,setCatEdit,catEditVal,setCatEditVal,catSaving,renameCat,deleteCat,customLeadCats,customVendorCats,hiddenLeadBuiltins,hiddenVendorBuiltins,LEAD_CATEGORIES,VENDORS_CATEGORIES,sops,setSops,sopFilter,setSopFilter,sopAddOpen,setSopAddOpen,sopEditId,setSopEditId,sopDraft,setSopDraft,sopPreview,setSopPreview,AGENT_DEFS,BtnPrimary,BtnSecondary,renderSopMarkdown}){
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
          {id:"sop",label:"SOPs",icon:'<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 1h8a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/><path d="M5 4h4M5 7h4M5 10h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>'},
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
      </div>
    </div>
  );
}
