import React from "react";

export function CategoryManagerModal({ T, BtnSecondary, showCatManager, setShowCatManager, LEAD_CATEGORIES, VENDORS_CATEGORIES, customLeadCats, customVendorCats, hiddenLeadBuiltins, hiddenVendorBuiltins, catEdit, setCatEdit, catEditVal, setCatEditVal, catSaving, renameCat, deleteCat }) {
  return (
    <div className="modal-bg" onClick={()=>setShowCatManager(false)}>
      <div style={{borderRadius:20,padding:28,width:560,maxWidth:"94vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"85vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22,flexShrink:0}}>
          <div>
            <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Manage Categories</div>
            <div style={{fontSize:12,color:T.muted,marginTop:2}}>Edit or delete client and vendor categories</div>
          </div>
          <button onClick={()=>setShowCatManager(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {[
            {label:"Client Categories",type:"lead",builtin:LEAD_CATEGORIES.filter(c=>c!=="All"),custom:customLeadCats,hidden:hiddenLeadBuiltins},
            {label:"Vendor Categories",type:"vendor",builtin:VENDORS_CATEGORIES,custom:customVendorCats,hidden:hiddenVendorBuiltins},
          ].map(section=>(
            <div key={section.type} style={{marginBottom:28}}>
              <div style={{fontSize:10,color:T.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12,paddingBottom:7,borderBottom:`1px solid ${T.border}`}}>{section.label}</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {/* Built-in categories */}
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
                        <button disabled={catSaving} onClick={async()=>{if(!window.confirm(`Delete "${cat}"? All ${section.type==='lead'?'clients':'vendors'} in this category will have it cleared.`))return;await deleteCat(section.type,cat);}} style={{background:"none",border:"none",color:"#c0392b",fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,opacity:catSaving?0.4:1,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#fff0f0"} onMouseOut={e=>e.currentTarget.style.background="none"}>Delete</button>
                      </>
                    )}
                  </div>
                ))}
                {/* Custom categories */}
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
                        <button disabled={catSaving} onClick={async()=>{if(!window.confirm(`Delete "${cat}"? All ${section.type==='lead'?'clients':'vendors'} in this category will have it cleared.`))return;await deleteCat(section.type,cat);}} style={{background:"none",border:"none",color:"#c0392b",fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,opacity:catSaving?0.4:1,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#fff0f0"} onMouseOut={e=>e.currentTarget.style.background="none"}>Delete</button>
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
        <div style={{borderTop:`1px solid ${T.border}`,paddingTop:16,marginTop:4,flexShrink:0,display:"flex",justifyContent:"flex-end"}}>
          <BtnSecondary onClick={()=>setShowCatManager(false)}>Done</BtnSecondary>
        </div>
      </div>
    </div>
  );
}
