import React, { Fragment } from "react";
import { getToken } from "../../utils/helpers";
import { RA_FONT, RA_LS, RA_LS_HDR, RA_GREY, CT_FONT, CT_LS, CT_LS_HDR } from "../ui/DocHelpers";
import { RISK_ASSESSMENT_INIT } from "../../data/riskAssessmentInit";
import { CONTRACT_DOC_TYPES, CONTRACT_TYPE_LABELS, GENERAL_TERMS_DOC } from "../agents/ContractCody";

export default function Documents({
  T, isMobile, p,
  documentsSubSection, setDocumentsSubSection,
  callSheetStore, setCallSheetStore, activeCSVersion, setActiveCSVersion,
  riskAssessmentStore, setRiskAssessmentStore, activeRAVersion, setActiveRAVersion,
  contractDocStore, setContractDocStore, activeContractVersion, setActiveContractVersion,
  dietaryStore, setDietaryStore, activeDietaryVersion, setActiveDietaryVersion,
  dietaryTab, setDietaryTab,
  ctSignShareUrl, setCtSignShareUrl, ctSignShareLoading, setCtSignShareLoading,
  ctTypeModalOpen, setCtTypeModalOpen,
  permitsSubSection, setPermitsSubSection,
  csCreateMenuDocs, setCsCreateMenuDocs, setCsDuplicateModal, setCsDuplicateSearch,
  setRaDuplicateModal, setRaDuplicateSearch,
  createMenuOpen, setCreateMenuOpen, setDuplicateModal, setDuplicateSearch,
  pushUndo, archiveItem, pushNav, showAlert,
  getProjectFiles, addProjectFiles, buildPath,
  projectInfoRef, CALLSHEET_INIT, DIETARY_INIT,
  CSLogoSlot, CSAddBtn, CSEditField, CSEditTextarea, CSResizableImage, CSXbtn,
  BtnExport, UploadZone, DietaryTagSelect, SignaturePad, TICell,
  CS_FONT, CS_LS, PRINT_CLEANUP_CSS,
}) {
  // Documents sub-navigation — Call Sheet, Risk Assessment, Contracts, Permits
  const DOC_CARDS = [
    {key:"callsheet",  emoji:"📋", label:"Call Sheet"},
    {key:"risk",       emoji:"⚠️", label:"Risk Assessment"},
    {key:"contracts",  emoji:"📝", label:"Contracts"},
    {key:"dietaries",  emoji:"🍽️", label:"Dietaries"},
    {key:"permits",    emoji:"📄", label:"Permits"},
  ];

  if (!documentsSubSection) return (
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
      {DOC_CARDS.map(c=>(
        <a key={c.key} href={buildPath("Projects",p.id,"Documents",c.key)} onClick={(e)=>{if(e.metaKey||e.ctrlKey)return;e.preventDefault();setDocumentsSubSection(c.key);pushNav("Projects",p,"Documents",c.key);}} className="proj-card" style={{borderRadius:16,padding:"22px 20px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",transition:"border-color 0.15s",textDecoration:"none",color:"inherit"}}>
          <span style={{fontSize:28}}>{c.emoji}</span>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.text}}>{c.label}</div>
            <div style={{fontSize:12,color:T.muted,marginTop:2}}>Open {c.label.toLowerCase()}</div>
          </div>
        </a>
      ))}
    </div>
  );

  // Back button for all document sub-sections
  const docBack = <button onClick={()=>window.history.back()} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>‹ Back to Documents</button>;

  if (documentsSubSection==="callsheet") {
    const csVersions = callSheetStore[p.id] || [];
    const addCSNew = () => {
      pushUndo("add call sheet");
      const newId = Date.now();
      const newCS = {id:newId,label:`${p.name} Call Sheet V${csVersions.length+1}`,...JSON.parse(JSON.stringify(CALLSHEET_INIT))};
      newCS.shootName=`${p.client||""} | ${p.name}`.replace(/^TEMPLATE \| /,"");
      const _pi2=(projectInfoRef.current||{})[p.id];
      if(_pi2){if(_pi2.shootName)newCS.shootName=_pi2.shootName;if(_pi2.shootDate)newCS.date=_pi2.shootDate;if(_pi2.shootLocation&&newCS.venueRows){const lr=newCS.venueRows.find(r=>r.label==="LOCATIONS");if(lr)lr.value=_pi2.shootLocation;}}
      setCallSheetStore(prev=>{const store=JSON.parse(JSON.stringify(prev));if(!store[p.id])store[p.id]=[];store[p.id].push(newCS);return store;});
      const logoImg=new Image();logoImg.crossOrigin="anonymous";logoImg.onload=()=>{try{const cv=document.createElement("canvas");cv.width=logoImg.naturalWidth;cv.height=logoImg.naturalHeight;cv.getContext("2d").drawImage(logoImg,0,0);const dataUrl=cv.toDataURL("image/png");setCallSheetStore(prev=>{const s=JSON.parse(JSON.stringify(prev));const arr=s[p.id]||[];const idx=arr.findIndex(e=>e.id===newId);if(idx>=0&&!arr[idx].productionLogo){arr[idx].productionLogo=dataUrl;}return s;});}catch{}};logoImg.src="/onna-default-logo.png";
    };
    const deleteCS = (idx) => { if(!confirm("Delete this call sheet? This will be moved to Deleted."))return; pushUndo("delete call sheet"); const csData=JSON.parse(JSON.stringify((callSheetStore[p.id]||[])[idx])); if(csData)archiveItem('callSheets',{projectId:p.id,callSheet:csData}); setCallSheetStore(prev => { const store = JSON.parse(JSON.stringify(prev)); const arr = store[p.id] || []; arr.splice(idx, 1); store[p.id] = arr; return store; }); setActiveCSVersion(null); };

    // ── List view: no call sheet selected ──
    if (activeCSVersion === null || csVersions.length === 0) {
      return (
        <div>
          {docBack}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{fontSize:16,fontWeight:700,color:T.text}}>Call Sheets</div>
            <div style={{position:"relative"}}>
              <button onClick={()=>setCsCreateMenuDocs(prev=>!prev)} style={{padding:"7px 16px",borderRadius:9,background:T.accent,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New Call Sheet ▾</button>
              {csCreateMenuDocs&&<div onClick={()=>setCsCreateMenuDocs(false)} style={{position:"fixed",inset:0,zIndex:9998}} />}
              {csCreateMenuDocs&&(
                <div style={{position:"absolute",top:36,right:0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:180,overflow:"hidden"}}>
                  <div onClick={()=>{setCsCreateMenuDocs(false);addCSNew();}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Blank</div>
                  <div onClick={()=>{setCsCreateMenuDocs(false);setCsDuplicateModal({origin:"docs"});setCsDuplicateSearch("");}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Existing</div>
                </div>
              )}
            </div>
          </div>
          {csVersions.length===0 && <div style={{borderRadius:14,background:"#fafafa",border:`1.5px dashed ${T.border}`,padding:44,textAlign:"center"}}><div style={{fontSize:13,color:T.muted}}>No call sheets yet. Click "+ New Call Sheet" to get started.</div></div>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {csVersions.map((cs,i)=>{
              const deptCount=(cs.departments||[]).length;
              const crewCount=(cs.departments||[]).reduce((sum,d)=>(d.crew||[]).length+sum,0);
              return(
                <div key={cs.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border-color 0.15s"}} onClick={()=>setActiveCSVersion(i)} onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>CS</span>
                      <span style={{fontSize:8,fontWeight:600,letterSpacing:0.5,background:crewCount>0?"#e8f5e9":"#f5f5f5",color:crewCount>0?"#2e7d32":"#999",padding:"2px 8px",borderRadius:4}}>{deptCount} dept{deptCount!==1?"s":""} · {crewCount} crew</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:T.text}}>{cs.label||"Untitled"}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>{cs.date||"No date set"}</div>
                  </div>
                  <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>deleteCS(i)} style={{padding:"4px 10px",borderRadius:7,background:"#fff5f5",color:"#c0392b",border:"1px solid #f5c6cb",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                  </div>
                </div>
              ); })}
          </div>
        </div>
      );
    }

    // ── Detail view: editing a specific call sheet ──
    const csIdx = Math.min(activeCSVersion, csVersions.length - 1);
    const csData = csVersions[csIdx] || csVersions[0];
    if(!csData) { setActiveCSVersion(null); return null; }

    const csU = (path, val) => {
      setCallSheetStore(prev => {
        const store = JSON.parse(JSON.stringify(prev));
        const arr = store[p.id] || [];
        const idx = Math.min(csIdx, arr.length - 1);
        const d = arr[idx];
        const k = path.split("."); let o = d;
        for (let i = 0; i < k.length - 1; i++) o = o[k[i]];
        o[k[k.length - 1]] = val;
        arr[idx] = d; store[p.id] = arr; return store;
      });
    };
    const csSet = (fn) => {
      setCallSheetStore(prev => {
        const store = JSON.parse(JSON.stringify(prev));
        const arr = store[p.id] || [];
        if(arr.length===0)return store;
        const idx = Math.min(csIdx, arr.length - 1);
        arr[idx] = fn(arr[idx]);
        store[p.id] = arr; return store;
      });
    };
    const addScheduleRow = () => csSet(d => ({...d, schedule:[...d.schedule,{time:"",activity:"",notes:""}]}));
    const rmScheduleRow = i => csSet(d => ({...d, schedule:d.schedule.filter((_,j)=>j!==i)}));
    const addVenueRow = () => csSet(d => ({...d, venueRows:[...d.venueRows,{label:"",value:""}]}));
    const rmVenueRow = i => csSet(d => ({...d, venueRows:d.venueRows.filter((_,j)=>j!==i)}));
    const addCrew = di => csSet(d => {d.departments[di].crew.push({role:"",name:"",mobile:"",email:"",callTime:""}); return d;});
    const rmCrew = (di,ci) => csSet(d => {d.departments[di].crew.splice(ci,1); return d;});
    const addDept = () => csSet(d => ({...d, departments:[...d.departments,{name:"NEW DEPARTMENT",crew:[{role:"",name:"",mobile:"",email:"",callTime:""}]}]}));
    const rmDept = i => csSet(d => ({...d, departments:d.departments.filter((_,j)=>j!==i)}));
    const addEmergencyNum = () => csSet(d => ({...d, emergencyNumbers:[...d.emergencyNumbers,{label:"",number:""}]}));
    const rmEmergencyNum = i => csSet(d => ({...d, emergencyNumbers:d.emergencyNumbers.filter((_,j)=>j!==i)}));

    const csLbl = {fontSize:9,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:CS_LS};
    const csDeptBg = "#F4F4F4";
    const csSecTitle = {fontSize:10,fontWeight:800,letterSpacing:CS_LS,textTransform:"uppercase",borderBottom:"2px solid #000",paddingBottom:5,marginBottom:10};
    const csTh = {padding:"5px 4px",fontSize:9,fontWeight:800,letterSpacing:CS_LS,color:"#555",background:"#fff",textTransform:"uppercase",whiteSpace:"nowrap"};

    return (
      <div>
        {docBack}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>setActiveCSVersion(null)} style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:500,cursor:"pointer",border:`1px solid ${T.border}`,fontFamily:"inherit",background:"transparent",color:T.sub}}>‹ Back to Call Sheets</button>
            <div style={{fontSize:11,color:T.muted}}>Label: <input value={csData.label||""} onChange={e=>csU("label",e.target.value)} style={{padding:"4px 9px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:12,fontFamily:"inherit",color:T.text,width:160}} placeholder="Call Sheet"/></div>
          </div>
          <BtnExport onClick={()=>{const el=document.getElementById("onna-cs-print");if(!el)return;const clone=el.cloneNode(true);clone.querySelectorAll("button").forEach(b=>b.remove());clone.querySelectorAll("input[type=file]").forEach(b=>b.remove());clone.querySelectorAll("[data-cs-placeholder]").forEach(b=>b.remove());const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);const doc=iframe.contentDocument;doc.open();doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${csData.label||"Day 1"} Call Sheet | ${p.name}</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;padding:10mm 12mm;}@media print{@page{margin:0;size:A4;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);doc.close();doc.body.appendChild(doc.adoptNode(clone));const prevTitle=document.title;document.title=`${csData.label||"Day 1"} Call Sheet | ${p.name}`;const restoreTitle=()=>{document.title=prevTitle;try{document.body.removeChild(iframe);}catch{}window.removeEventListener("afterprint",restoreTitle);};window.addEventListener("afterprint",restoreTitle);setTimeout(()=>{doc.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(el=>el.remove());iframe.contentWindow.focus();iframe.contentWindow.print();},300);}}>Export PDF</BtnExport>
        </div>
        <div id="onna-cs-print" style={{background:"#fff",padding:"0",fontFamily:CS_FONT,borderRadius:0}}>
          <div style={{maxWidth:880,margin:"0 auto",background:"#FFFFFF"}}>

            {/* TOP BAR */}
            <div style={{padding:"40px 40px 0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                <CSLogoSlot label="Production Logo" image={csData.productionLogo} onUpload={v=>csU("productionLogo",v)} onRemove={()=>csU("productionLogo",null)}/>
                <div style={{display:"flex",gap:16,alignItems:"center",marginTop:-3}}>
                  <CSLogoSlot label="Agency Logo" image={csData.agencyLogo} onUpload={v=>csU("agencyLogo",v)} onRemove={()=>csU("agencyLogo",null)}/>
                  <CSLogoSlot label="Client Logo" image={csData.clientLogo} onUpload={v=>csU("clientLogo",v)} onRemove={()=>csU("clientLogo",null)}/>
                </div>
              </div>
              <div style={{borderBottom:"2.5px solid #000",marginBottom:16}}/>
            </div>

            <div style={{textAlign:"center",padding:"20px 32px 4px"}}>
              <div style={{fontSize:12,fontWeight:800,letterSpacing:CS_LS,color:"#000",display:"flex",justifyContent:"space-between",alignItems:"center"}}>CALL SHEET</div>
            </div>

            <div style={{padding:"8px 32px 10px",display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <div style={{fontWeight:800,letterSpacing:CS_LS}}>
                <CSEditField value={csData.shootName} onChange={v=>csU("shootName",v)} bold isPlaceholder style={{fontSize:11,fontWeight:800,letterSpacing:CS_LS}} placeholder="SHOOT NAME"/>
              </div>
              <div style={{fontWeight:800,letterSpacing:CS_LS,textAlign:"center"}}>
                <CSEditField value={csData.date} onChange={v=>csU("date",v)} isPlaceholder style={{fontSize:11,color:"#000",fontWeight:800,letterSpacing:CS_LS}} placeholder="DAY & DATE"/>
              </div>
              <div style={{fontWeight:800,letterSpacing:CS_LS,whiteSpace:"nowrap"}}>
                SHOOT DAY <CSEditField value={csData.dayNumber} onChange={v=>csU("dayNumber",v)} bold isPlaceholder style={{fontSize:11,fontWeight:800,letterSpacing:CS_LS}} placeholder="#"/>
              </div>
            </div>

            <div style={{padding:"0 32px 10px",textAlign:"center"}}>
              <CSEditField value={csData.passportNote} onChange={v=>csU("passportNote",v)} style={{color:"#C62828",fontSize:8,fontWeight:700,letterSpacing:CS_LS}}/>
            </div>
            <div style={{height:1,background:"#eee",margin:"0 32px"}}/>

            <div style={{padding:"10px 32px",borderBottom:"1px solid #eee",fontSize:11}}>
              <span style={csLbl}>Production On Set: </span>
              <CSEditField value={csData.productionContacts} onChange={v=>csU("productionContacts",v)} isPlaceholder style={{fontSize:11,letterSpacing:CS_LS}} placeholder="Name + Number / Name + Number"/>
            </div>

            {/* SHOOT */}
            <div style={{padding:"14px 32px 8px"}}>
              <div style={csSecTitle}>SHOOT</div>
              {csData.venueRows.map((row,i) => (
                <div key={i} style={{display:"flex",alignItems:"flex-start",marginBottom:5,gap:8}}>
                  <div style={{minWidth:95}}>
                    <CSEditField value={row.label} onChange={v=>csU(`venueRows.${i}.label`,v)} bold style={{fontSize:9,fontWeight:700,color:"#888",letterSpacing:CS_LS,textTransform:"uppercase"}} placeholder="LABEL"/>
                  </div>
                  <div style={{flex:1,fontSize:11}}>
                    <CSEditField value={row.value} onChange={v=>csU(`venueRows.${i}.value`,v)} isPlaceholder style={{fontSize:11}} placeholder="Enter details..."/>
                  </div>
                  <CSXbtn onClick={()=>rmVenueRow(i)}/>
                </div>
              ))}
              <CSAddBtn onClick={addVenueRow} label="Add Row"/>
            </div>

            {/* SCHEDULE */}
            <div style={{padding:"10px 32px"}}>
              <div style={csSecTitle}>SCHEDULE</div>
              <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
                <thead><tr style={{background:csDeptBg}}>
                  <td style={{...csTh,background:csDeptBg,width:"10%"}}>TIME</td>
                  <td style={{...csTh,background:csDeptBg,width:"18%"}}>ACTIVITY</td>
                  <td style={{...csTh,background:csDeptBg}}>NOTES</td>
                  <td style={{width:24,background:csDeptBg}}></td>
                </tr></thead>
                <tbody>
                  {csData.schedule.map((row,i) => (
                    <tr key={i} style={{borderBottom:"1px solid #f0f0f0",background:"#fff"}}>
                      <td style={{padding:"4px 4px 4px 0",fontSize:11,fontWeight:600}}>
                        <CSEditField value={row.time} onChange={v=>csU(`schedule.${i}.time`,v)} isPlaceholder placeholder="00:00" style={{fontSize:11,fontWeight:600}}/>
                      </td>
                      <td style={{padding:"4px 4px",fontSize:11,fontWeight:600}}>
                        <CSEditField value={row.activity} onChange={v=>csU(`schedule.${i}.activity`,v)} isPlaceholder placeholder="Activity" style={{fontSize:11,fontWeight:600}}/>
                      </td>
                      <td style={{padding:"4px 4px",fontSize:11}}>
                        <CSEditField value={row.notes} onChange={v=>csU(`schedule.${i}.notes`,v)} isPlaceholder placeholder="Notes" style={{fontSize:11}}/>
                      </td>
                      <td><CSXbtn onClick={()=>rmScheduleRow(i)}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <CSAddBtn onClick={addScheduleRow} label="Add Row"/>
            </div>

            {/* CONTACTS */}
            <div style={{padding:"10px 32px"}}>
              <div style={csSecTitle}>CONTACTS</div>
              <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
                <thead><tr>
                  <td style={{...csTh,width:"17%"}}>ROLE</td>
                  <td style={{...csTh,width:"15%"}}>NAME</td>
                  <td style={{...csTh,width:"16%"}}>MOBILE</td>
                  <td style={{...csTh,width:"30%"}}>EMAIL</td>
                  <td style={{...csTh,width:"8%",textAlign:"right",paddingRight:8}}>CALL TIME</td>
                  <td style={{...csTh,width:22}}></td>
                </tr></thead>
                <tbody>
                  {csData.departments.map((dept,di) => (
                    <Fragment key={di}>
                      <tr><td colSpan={6} style={{padding:0}}>
                        <div style={{background:"#1a1a1a",padding:"3px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <CSEditField value={dept.name} onChange={v=>csU(`departments.${di}.name`,v)} bold style={{fontSize:9,fontWeight:800,letterSpacing:CS_LS,color:"#fff"}}/>
                          <button onClick={()=>rmDept(di)} style={{background:"none",border:"none",color:"#777",cursor:"pointer",fontSize:12,padding:"0 3px",lineHeight:1}} onMouseEnter={e=>(e.target.style.color="#ff6b6b")} onMouseLeave={e=>(e.target.style.color="#777")}>×</button>
                        </div>
                      </td></tr>
                      {dept.crew.map((cr,ci) => (
                        <tr key={ci} style={{background:"#fff",borderBottom:"1px solid #f5f5f5"}}>
                          <td style={{padding:"3px 4px",fontSize:9,color:"#666"}}>
                            <CSEditField value={cr.role} onChange={v=>csU(`departments.${di}.crew.${ci}.role`,v)} style={{fontSize:9,color:"#666"}} placeholder="Role"/>
                          </td>
                          <td style={{padding:"3px 4px",fontSize:10,fontWeight:600}}>
                            <CSEditField value={cr.name} onChange={v=>csU(`departments.${di}.crew.${ci}.name`,v)} isPlaceholder style={{fontSize:10}} placeholder="Name"/>
                          </td>
                          <td style={{padding:"3px 4px",fontSize:10}}>
                            <CSEditField value={cr.mobile} onChange={v=>csU(`departments.${di}.crew.${ci}.mobile`,v)} isPlaceholder style={{fontSize:10}} placeholder="Phone"/>
                          </td>
                          <td style={{padding:"3px 4px",fontSize:10,overflow:"hidden",textOverflow:"ellipsis"}}>
                            <CSEditField value={cr.email} onChange={v=>csU(`departments.${di}.crew.${ci}.email`,v)} isPlaceholder style={{fontSize:10,color:"#1565C0"}} placeholder="Email"/>
                          </td>
                          <td style={{padding:"3px 8px 3px 4px",fontSize:10,fontWeight:600,textAlign:"right"}}>
                            <CSEditField value={cr.callTime} onChange={v=>csU(`departments.${di}.crew.${ci}.callTime`,v)} isPlaceholder style={{fontSize:10,fontWeight:600}} placeholder="Time"/>
                          </td>
                          <td><CSXbtn onClick={()=>rmCrew(di,ci)}/></td>
                        </tr>
                      ))}
                      <tr style={{background:"#fff"}}><td colSpan={6} style={{padding:"2px 4px"}}><CSAddBtn onClick={()=>addCrew(di)} label="Add Crew"/></td></tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
              <CSAddBtn onClick={addDept} label="Add Department"/>
            </div>

            {/* MAP */}
            <div style={{padding:"14px 32px 10px"}}>
              <div style={csSecTitle}>MAP</div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,fontSize:10,fontFamily:CS_FONT}}>
                <span style={{fontSize:14}}>🔗</span>
                <CSEditField value={csData.mapLink||""} onChange={v=>csU("mapLink",v)} isPlaceholder style={{fontSize:10,color:"#1565C0",flex:1}} placeholder="Paste Google Maps link..."/>
                {csData.mapLink&&<a href={csData.mapLink} target="_blank" rel="noreferrer" style={{fontSize:9,color:"#1565C0",textDecoration:"none",whiteSpace:"nowrap"}}>Open ↗</a>}
              </div>
              {csData.mapLink&&!csData.mapImage&&<button onClick={()=>{const link=csData.mapLink;let q="";try{const u=new URL(link);q=u.pathname.replace("/maps/search/","").replace("/maps/place/","").split("/@")[0];if(!q)q=u.searchParams.get("q")||"";}catch{}if(!q)q=link.replace(/https?:\/\/[^/]+\//,"");q=decodeURIComponent(q).replace(/\+/g," ");const coords=link.match(/@(-?[\d.]+),(-?[\d.]+)/);let mapApiUrl;if(coords){mapApiUrl=`/api/map-image?lat=${coords[1]}&lon=${coords[2]}`;}else{mapApiUrl=`/api/map-image?q=${encodeURIComponent(q)}`;}fetch(mapApiUrl).then(r=>{if(!r.ok)throw new Error("Map service error");return r.blob();}).then(blob=>{const reader=new FileReader();reader.onload=e=>csU("mapImage",e.target.result);reader.readAsDataURL(blob);}).catch(()=>showAlert("Could not fetch map image. Try uploading a screenshot manually."));}} style={{background:"#1565C0",color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:8,display:"flex",alignItems:"center",gap:4}} onMouseEnter={e=>e.currentTarget.style.background="#0D47A1"} onMouseLeave={e=>e.currentTarget.style.background="#1565C0"}>Fetch Map Screenshot</button>}
              <CSResizableImage label="Map Image (JPEG)" image={csData.mapImage} onUpload={v=>csU("mapImage",v)} onRemove={()=>csU("mapImage",null)} defaultHeight={280}/>
              {(csData.extraMapImages||[]).map((img,i)=><div key={i} style={{marginTop:8}}><CSResizableImage label={"Extra Image "+(i+1)} image={img} onUpload={v=>csSet(d=>({...d,extraMapImages:(d.extraMapImages||[]).map((x,j)=>j===i?v:x)}))} onRemove={()=>csSet(d=>({...d,extraMapImages:(d.extraMapImages||[]).filter((_,j)=>j!==i)}))} defaultHeight={200}/></div>)}
              <button onClick={()=>csSet(d=>({...d,extraMapImages:[...(d.extraMapImages||[]),null]}))} style={{background:"none",border:"1px dashed #ddd",borderRadius:4,padding:"6px 14px",fontSize:10,color:"#999",cursor:"pointer",fontFamily:"inherit",marginTop:8,width:"100%"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#999";e.currentTarget.style.color="#666";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#ddd";e.currentTarget.style.color="#999";}}>+ Add Another Image</button>
            </div>

            {/* WEATHER */}
            <div style={{padding:"10px 32px 14px"}}>
              <div style={csSecTitle}>WEATHER</div>
              <div style={{marginBottom:6,fontSize:9,fontFamily:CS_FONT,fontStyle:"italic",letterSpacing:CS_LS}}><CSEditField value={csData.weatherSummary||""} onChange={v=>csU("weatherSummary",v)} isPlaceholder style={{fontSize:9,fontStyle:"italic",letterSpacing:CS_LS}} placeholder="e.g. Sunny, Clear Skies"/></div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:10,fontFamily:CS_FONT}}>
                <div><span style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#888"}}>HIGH: </span><CSEditField value={csData.weatherHighC||""} onChange={v=>csU("weatherHighC",v)} isPlaceholder style={{fontSize:10,minWidth:20}} placeholder="—"/>°C / <CSEditField value={csData.weatherHighF||""} onChange={v=>csU("weatherHighF",v)} isPlaceholder style={{fontSize:10,minWidth:20}} placeholder="—"/>°F</div>
                <div><span style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#888"}}>LOW: </span><CSEditField value={csData.weatherLowC||""} onChange={v=>csU("weatherLowC",v)} isPlaceholder style={{fontSize:10,minWidth:20}} placeholder="—"/>°C / <CSEditField value={csData.weatherLowF||""} onChange={v=>csU("weatherLowF",v)} isPlaceholder style={{fontSize:10,minWidth:20}} placeholder="—"/>°F</div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:10,fontFamily:CS_FONT}}>
                <div><span style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#888"}}>REAL FEEL HIGH: </span><CSEditField value={csData.weatherRealFeelHighC||""} onChange={v=>csU("weatherRealFeelHighC",v)} isPlaceholder style={{fontSize:10,minWidth:20}} placeholder="—"/>°C / <CSEditField value={csData.weatherRealFeelHighF||""} onChange={v=>csU("weatherRealFeelHighF",v)} isPlaceholder style={{fontSize:10,minWidth:20}} placeholder="—"/>°F</div>
                <div><span style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#888"}}>REAL FEEL LOW: </span><CSEditField value={csData.weatherRealFeelLowC||""} onChange={v=>csU("weatherRealFeelLowC",v)} isPlaceholder style={{fontSize:10,minWidth:20}} placeholder="—"/>°C / <CSEditField value={csData.weatherRealFeelLowF||""} onChange={v=>csU("weatherRealFeelLowF",v)} isPlaceholder style={{fontSize:10,minWidth:20}} placeholder="—"/>°F</div>
              </div>
              {(csData.weatherHourly||[]).length>0?<div style={{marginBottom:10}}>
                <div style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#888",marginBottom:4}}>HOURLY FORECAST</div>
                <div style={{display:"flex",gap:0,width:"100%"}}>
                  {csData.weatherHourly.map((h,i)=>(<div key={i} style={{flex:1,textAlign:"center",padding:"4px 2px",borderRight:i<csData.weatherHourly.length-1?"1px solid #eee":"none",fontSize:9,fontFamily:CS_FONT}}>
                    <div style={{fontWeight:700,color:"#555"}}>{h.time}</div>
                    <div style={{fontSize:13,margin:"2px 0"}}>{(h.condition||"").toLowerCase().includes("sun")||(h.condition||"").toLowerCase().includes("clear")?"☀️":(h.condition||"").toLowerCase().includes("cloud")?"⛅":(h.condition||"").toLowerCase().includes("rain")||(h.condition||"").toLowerCase().includes("shower")?"🌧️":(h.condition||"").toLowerCase().includes("storm")||(h.condition||"").toLowerCase().includes("thunder")?"⛈️":(h.condition||"").toLowerCase().includes("wind")?"💨":(h.condition||"").toLowerCase().includes("fog")||(h.condition||"").toLowerCase().includes("mist")?"🌫️":(h.condition||"").toLowerCase().includes("snow")?"❄️":"🌤️"}</div>
                    <div style={{fontSize:11,fontWeight:800,color:"#1a1a1a",margin:"1px 0"}}>{h.tempC}°</div>
                    <div style={{fontSize:8,color:"#888"}}>{h.tempF}°F</div>
                  </div>))}
                </div>
              </div>:<div style={{marginBottom:10,border:"1px dashed #ddd",borderRadius:6,padding:"14px 10px",textAlign:"center"}}><div style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#bbb",marginBottom:4}}>HOURLY FORECAST</div><div style={{fontSize:9,color:"#ccc"}}>Ask Connie for weather details to populate</div></div>}
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,fontSize:10,fontFamily:CS_FONT}}>
                <div><span style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#888"}}>SUNRISE: </span><CSEditField value={csData.weatherSunrise||""} onChange={v=>csU("weatherSunrise",v)} isPlaceholder style={{fontSize:10}} placeholder="00:00"/></div>
                <div style={{textAlign:"center"}}><span style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#888"}}>SUNSET: </span><CSEditField value={csData.weatherSunset||""} onChange={v=>csU("weatherSunset",v)} isPlaceholder style={{fontSize:10}} placeholder="00:00"/></div>
                <div style={{textAlign:"right"}}><span style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#888"}}>BLUE HOUR: </span><CSEditField value={csData.weatherBlueHour||""} onChange={v=>csU("weatherBlueHour",v)} isPlaceholder style={{fontSize:10}} placeholder="00:00"/></div>
              </div>
              </div>

            {/* INVOICING */}
            <div style={{padding:"14px 32px"}}>
              <div style={csSecTitle}>INVOICING</div>
              <div style={{fontSize:11,marginBottom:8}}>
                Please note that payment terms are <strong><CSEditField value={csData.invoicing.terms} onChange={v=>csU("invoicing.terms",v)} bold style={{fontSize:11}}/></strong> from the date of invoice.
              </div>
              <div style={{fontSize:11}}>
                <div style={{fontWeight:700,marginBottom:2}}>FOR DUBAI CREW:</div>
                <div>PLEASE SEND INVOICES TO: <CSEditField value={csData.invoicing.email} onChange={v=>csU("invoicing.email",v)} style={{fontSize:11,color:"#1565C0"}}/></div>
                <div style={{fontWeight:700,marginTop:6}}>BILLING ADDRESS:</div>
                <CSEditTextarea value={csData.invoicing.address} onChange={v=>csU("invoicing.address",v)} style={{fontSize:11,lineHeight:1.6}}/>
                <div style={{marginTop:4}}><strong>TRN:</strong> <CSEditField value={csData.invoicing.trn} onChange={v=>csU("invoicing.trn",v)} style={{fontSize:11}}/></div>
              </div>
            </div>

            {/* PROTOCOL */}
            <div style={{padding:"10px 32px"}}>
              <div style={csSecTitle}>PROTOCOL ON SET</div>
              <CSEditTextarea value={csData.protocol} onChange={v=>csU("protocol",v)} style={{fontSize:10,color:"#555",lineHeight:1.7}}/>
            </div>

            {/* EMERGENCY */}
            <div style={{padding:"10px 32px"}}>
              <div style={csSecTitle}>NEAREST EMERGENCY SERVICES</div>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:0.5,marginBottom:4}}><CSEditField value={csData.emergencyDialPrefix} onChange={v=>csU("emergencyDialPrefix",v)} bold style={{fontSize:11,fontWeight:700,letterSpacing:0.5}}/></div>
                {csData.emergencyNumbers.map((en,i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                    <span style={{color:"#C62828",fontWeight:800,fontSize:11,minWidth:30}}>
                      <CSEditField value={en.number} onChange={v=>csU(`emergencyNumbers.${i}.number`,v)} style={{color:"#C62828",fontWeight:800,fontSize:11}}/>
                    </span>
                    <span style={{fontWeight:600,fontSize:9,letterSpacing:0.3,color:"#888"}}>FOR</span>
                    <CSEditField value={en.label} onChange={v=>csU(`emergencyNumbers.${i}.label`,v)} bold style={{fontSize:11,fontWeight:700,letterSpacing:0.3}}/>
                    <CSXbtn onClick={()=>rmEmergencyNum(i)} size={10}/>
                  </div>
                ))}
                <CSAddBtn onClick={addEmergencyNum} label="Add"/>
              </div>
              <div style={{fontSize:11,marginBottom:4,background:"#FFFDE7",padding:"3px 6px",borderRadius:2}}>
                <strong>NEAREST HOSPITAL: </strong><CSEditField value={csData.emergency.hospital} onChange={v=>csU("emergency.hospital",v)} style={{fontSize:11}}/>
              </div>
              <div style={{fontSize:11,background:"#FFFDE7",padding:"3px 6px",borderRadius:2}}>
                <strong>NEAREST POLICE STATION: </strong><CSEditField value={csData.emergency.police} onChange={v=>csU("emergency.police",v)} style={{fontSize:11}}/>
              </div>
            </div>

            {/* FOOTER */}
            <div style={{borderTop:"2px solid #000",margin:"16px 32px 0",padding:"14px 0 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:CS_LS,color:"#000"}}>@ONNAPRODUCTION</div>
                <div style={{fontSize:9,color:"#888",letterSpacing:CS_LS}}>DUBAI | LONDON</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,fontWeight:600,color:"#000",letterSpacing:CS_LS}}>WWW.ONNA.WORLD</div>
                <div style={{fontSize:9,color:"#888",letterSpacing:CS_LS}}>HELLO@ONNAPRODUCTION.COM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (documentsSubSection==="risk") {
    const raVersions = riskAssessmentStore[p.id] || [];
    const addRAVersion = () => { pushUndo("add risk assessment"); const newId=Date.now(); setRiskAssessmentStore(prev => { const store = JSON.parse(JSON.stringify(prev)); const arr = store[p.id] || []; arr.push({id:newId,label:`${p.name} Risk Assessment V${arr.length+1}`,...JSON.parse(JSON.stringify(RISK_ASSESSMENT_INIT))}); const _rn=arr[arr.length-1];const _pi4=(projectInfoRef.current||{})[p.id];if(_pi4){if(_pi4.shootName)_rn.shootName=_pi4.shootName;if(_pi4.shootDate)_rn.shootDate=_pi4.shootDate;if(_pi4.shootLocation)_rn.locations=_pi4.shootLocation;if(_pi4.crewOnSet)_rn.crewOnSet=_pi4.crewOnSet;} store[p.id] = arr; return store; }); const logoImg=new Image();logoImg.crossOrigin="anonymous";logoImg.onload=()=>{try{const cv=document.createElement("canvas");cv.width=logoImg.naturalWidth;cv.height=logoImg.naturalHeight;cv.getContext("2d").drawImage(logoImg,0,0);const dataUrl=cv.toDataURL("image/png");setRiskAssessmentStore(prev=>{const s=JSON.parse(JSON.stringify(prev));const arr=s[p.id]||[];const idx=arr.findIndex(e=>e.id===newId);if(idx>=0&&!arr[idx].productionLogo){arr[idx].productionLogo=dataUrl;}return s;});}catch{}};logoImg.src="/onna-default-logo.png"; };
    const deleteRA = (idx) => { if(!confirm("Delete this risk assessment? This will be moved to Deleted."))return; pushUndo("delete risk assessment"); const raData=JSON.parse(JSON.stringify((riskAssessmentStore[p.id]||[])[idx])); if(raData)archiveItem('riskAssessments',{projectId:p.id,riskAssessment:raData}); setRiskAssessmentStore(prev => { const store = JSON.parse(JSON.stringify(prev)); const arr = store[p.id] || []; arr.splice(idx, 1); store[p.id] = arr; return store; }); setActiveRAVersion(null); };

    // ── List view: no RA selected ──
    if (activeRAVersion === null || raVersions.length === 0) {
      return (
        <div>
          {docBack}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{fontSize:16,fontWeight:700,color:T.text}}>Risk Assessments</div>
            <div style={{position:"relative"}}>
              <button onClick={()=>setCreateMenuOpen(prev=>({...prev,ra:!prev.ra}))} style={{padding:"7px 16px",borderRadius:9,background:T.accent,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New Risk Assessment ▾</button>
              {createMenuOpen.ra&&<div onClick={()=>setCreateMenuOpen(prev=>({...prev,ra:false}))} style={{position:"fixed",inset:0,zIndex:9998}} />}
              {createMenuOpen.ra&&(
                <div style={{position:"absolute",top:36,right:0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:180,overflow:"hidden"}}>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,ra:false}));addRAVersion();}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Blank</div>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,ra:false}));setRaDuplicateModal({origin:"docs"});setRaDuplicateSearch("");}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Existing</div>
                </div>
              )}
            </div>
          </div>
          {raVersions.length===0 && <div style={{borderRadius:14,background:"#fafafa",border:`1.5px dashed ${T.border}`,padding:44,textAlign:"center"}}><div style={{fontSize:13,color:T.muted}}>No risk assessments yet. Click "+ New Risk Assessment" to get started, or ask Ronnie to build one for you.</div></div>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {raVersions.map((ra,i)=>{
              const sectionCount=(ra.sections||[]).length;
              const filledFields=[ra.shootName,ra.shootDate,ra.locations,ra.crewOnSet,ra.timing].filter(Boolean).length;
              return(
                <div key={ra.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border-color 0.15s"}} onClick={()=>setActiveRAVersion(i)} onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>RA</span>
                      <span style={{fontSize:8,fontWeight:600,letterSpacing:0.5,background:sectionCount>0?"#e8f5e9":"#f5f5f5",color:sectionCount>0?"#2e7d32":"#999",padding:"2px 8px",borderRadius:4}}>{sectionCount} section{sectionCount!==1?"s":""} · {filledFields}/5 fields</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:T.text}}>{ra.label||"Untitled"}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>{ra.shootDate||"No date set"}</div>
                  </div>
                  <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>deleteRA(i)} style={{padding:"4px 10px",borderRadius:7,background:"#fff5f5",color:"#c0392b",border:"1px solid #f5c6cb",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                  </div>
                </div>
              ); })}
          </div>
        </div>
      );
    }

    // ── Detail view: editing a specific RA ──
    const raIdx = Math.min(activeRAVersion, raVersions.length - 1);
    const raData = raVersions[raIdx] || raVersions[0];
    if(!raData) { setActiveRAVersion(null); return null; }
    const raU = (path, val) => { setRiskAssessmentStore(prev => { const store = JSON.parse(JSON.stringify(prev)); const arr = store[p.id] || []; if(!arr.length)return store; const idx = Math.min(raIdx, arr.length - 1); const d = arr[idx]; const k = path.split("."); let o = d; for (let i = 0; i < k.length - 1; i++) o = o[k[i]]; o[k[k.length - 1]] = val; arr[idx] = d; store[p.id] = arr; return store; }); };
    const raSet = (fn) => { setRiskAssessmentStore(prev => { const store = JSON.parse(JSON.stringify(prev)); const arr = store[p.id] || []; if(!arr.length)return store; const idx = Math.min(raIdx, arr.length - 1); arr[idx] = fn(JSON.parse(JSON.stringify(arr[idx]))); store[p.id] = arr; return store; }); };
    // RA_FONT, RA_LS, RA_LS_HDR, RA_GREY hoisted to top level
    const raSectionHdr = (title) => (<div style={{background:"#000",color:"#fff",fontFamily:RA_FONT,fontSize:10,fontWeight:700,letterSpacing:RA_LS_HDR,textAlign:"center",padding:"4px 0",textTransform:"uppercase",marginTop:24,marginBottom:0}}>{title}</div>);

    return (
      <div>
        {docBack}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>setActiveRAVersion(null)} style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:500,cursor:"pointer",border:`1px solid ${T.border}`,fontFamily:"inherit",background:"transparent",color:T.sub}}>‹ Back to Risk Assessments</button>
            <div style={{fontSize:11,color:T.muted}}>Label: <input value={raData.label||""} onChange={e=>raU("label",e.target.value)} style={{padding:"4px 9px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:12,fontFamily:"inherit",color:T.text,width:200}} placeholder="Risk Assessment"/></div>
          </div>
          <BtnExport onClick={()=>{const el=document.getElementById("onna-ra-print");if(!el)return;const clone=el.cloneNode(true);clone.querySelectorAll("button").forEach(b=>b.remove());clone.querySelectorAll("input[type=file]").forEach(b=>b.remove());const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);const doc=iframe.contentDocument;doc.open();doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${raData.label||"V1"} Risk Assessment | ${p.name}</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:Avenir,sans-serif;padding:10mm 12mm;}@media print{@page{margin:0;size:A4;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);doc.close();doc.body.appendChild(doc.adoptNode(clone));const prevTitle=document.title;document.title=`${raData.label||"V1"} Risk Assessment | ${p.name}`;const restoreTitle=()=>{document.title=prevTitle;try{document.body.removeChild(iframe);}catch{}window.removeEventListener("afterprint",restoreTitle);};window.addEventListener("afterprint",restoreTitle);setTimeout(()=>{doc.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(el=>el.remove());iframe.contentWindow.focus();iframe.contentWindow.print();},300);}}>Export PDF</BtnExport>
        </div>

        <div id="onna-ra-print" style={{background:"#fff",padding:"40px 40px",fontFamily:RA_FONT,color:"#1a1a1a",lineHeight:1.5,maxWidth:880,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <CSLogoSlot label="Production Logo" image={raData.productionLogo} onUpload={v=>raU("productionLogo",v)} onRemove={()=>raU("productionLogo",null)}/>
            <div style={{display:"flex",gap:16,alignItems:"center",marginTop:-3}}>
              <CSLogoSlot label="Agency Logo" image={raData.agencyLogo} onUpload={v=>raU("agencyLogo",v)} onRemove={()=>raU("agencyLogo",null)}/>
              <CSLogoSlot label="Client Logo" image={raData.clientLogo} onUpload={v=>raU("clientLogo",v)} onRemove={()=>raU("clientLogo",null)}/>
            </div>
          </div>
          <div style={{borderBottom:"2.5px solid #000",marginBottom:16}}/>
          <div style={{textAlign:"center",fontFamily:RA_FONT,fontSize:12,fontWeight:700,letterSpacing:RA_LS_HDR,textTransform:"uppercase",marginBottom:16}}>RISK ASSESSMENT</div>

          <div style={{marginBottom:20}}>
            {[{l:"SHOOT NAME:",k:"shootName"},{l:"SHOOT DATE:",k:"shootDate"},{l:"LOCATIONS:",k:"locations"},{l:"CREW ON SET:",k:"crewOnSet"},{l:"TIMING:",k:"timing"}].map(({l,k})=>(
              <div key={k} style={{display:"flex",gap:6,marginBottom:2}}>
                <span style={{fontFamily:RA_FONT,fontSize:10,fontWeight:700,letterSpacing:RA_LS_HDR,minWidth:100}}>{l}</span>
                <CSEditField value={raData[k]||""} onChange={v=>raU(k,v)} isPlaceholder={!raData[k]} placeholder={`Enter ${l.toLowerCase().replace(":","")}` } style={{fontSize:10,letterSpacing:RA_LS}}/>
              </div>
            ))}
          </div>

          {(raData.sections||[]).map((sec,si) => (
            <div key={sec.id||si}>
              <div style={{background:"#000",color:"#fff",fontFamily:RA_FONT,fontSize:10,fontWeight:700,letterSpacing:RA_LS_HDR,textAlign:"center",padding:"4px 8px",textTransform:"uppercase",marginTop:24,marginBottom:0,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                <span style={{marginRight:4}}>{si+1}.</span>
                <CSEditField value={sec.title} onChange={v=>{raSet(d=>{d.sections[si].title=v;return d;});}} placeholder="Section Title" style={{fontSize:10,color:"#fff",letterSpacing:RA_LS_HDR}} bold/>
                <div onClick={()=>{if(pushUndo)pushUndo("delete section");raSet(d=>({...d,sections:d.sections.filter((_,j)=>j!==si)}));}} style={{position:"absolute",right:8,cursor:"pointer",fontSize:13,color:"#666",opacity:0.6}} onMouseEnter={e=>(e.target.style.opacity=1)} onMouseLeave={e=>(e.target.style.opacity=0.6)}>×</div>
              </div>
              <div style={{display:"flex",background:RA_GREY,borderBottom:"1px solid #ddd",padding:"5px 0"}}>
                {(sec.cols||["Hazard","Risk Level","Who is at Risk","Mitigation Strategy"]).map((c,ci)=>(<div key={ci} style={{flex:ci===0?3:ci===3?5:1.2,fontFamily:RA_FONT,fontSize:9,fontWeight:700,letterSpacing:RA_LS_HDR,padding:"0 6px",color:"#000"}}>{c}</div>))}
                <div style={{width:24}}/>
              </div>
              {(sec.rows||[]).map((row,ri) => (
                <div key={ri} style={{display:"flex",borderBottom:"1px solid #eee",padding:"4px 0",alignItems:"flex-start"}} onMouseEnter={e=>{const rm=e.currentTarget.querySelector(".ra-rm");if(rm)rm.style.opacity=1;}} onMouseLeave={e=>{const rm=e.currentTarget.querySelector(".ra-rm");if(rm)rm.style.opacity=0;}}>
                  {row.map((cell,ci) => (<div key={ci} style={{flex:ci===0?3:ci===3?5:1.2,padding:"0 6px"}}><CSEditField value={cell} onChange={v=>{raSet(d=>{d.sections[si].rows[ri][ci]=v;return d;});}} isPlaceholder={!cell} placeholder={(sec.cols||["Hazard","Risk Level","Who is at Risk","Mitigation"])[ci]} style={{fontSize:10,letterSpacing:RA_LS}} bold={ci===0}/></div>))}
                  <div className="ra-rm" onClick={()=>{if(pushUndo)pushUndo("delete row");raSet(d=>({...d,sections:d.sections.map((s,j)=>j===si?{...s,rows:s.rows.filter((_,k)=>k!==ri)}:s)}));}} style={{width:24,cursor:"pointer",textAlign:"center",fontSize:12,color:"#bbb",opacity:0,transition:"opacity .15s"}}>×</div>
                </div>
              ))}
              <div onClick={()=>raSet(d=>({...d,sections:d.sections.map((s,j)=>j===si?{...s,rows:[...s.rows,(s.cols||["","","",""]).map(()=>"")]}:s)}))} style={{fontFamily:RA_FONT,fontSize:9,color:"#999",cursor:"pointer",padding:"4px 6px",letterSpacing:RA_LS,marginTop:2}}>+ Add Row</div>
            </div>
          ))}
          <div onClick={()=>raSet(d=>({...d,sections:[...d.sections,{id:Date.now(),title:"NEW SECTION",cols:["Hazard","Risk Level","Who is at Risk","Mitigation Strategy"],rows:[["","","",""]]}]}))} style={{fontFamily:RA_FONT,fontSize:9,color:"#999",cursor:"pointer",letterSpacing:RA_LS,textAlign:"center",marginTop:12,padding:6}}>+ Add Risk Section</div>

          {raSectionHdr("PROFESSIONAL CODE OF CONDUCT")}
          <div style={{padding:"8px 12px"}}><CSEditTextarea value={raData.conductIntro||""} onChange={v=>raU("conductIntro",v)} style={{fontSize:10,letterSpacing:RA_LS,marginBottom:8}}/></div>
          <div style={{padding:"8px 12px"}}>
            {(raData.conductItems||[]).map((item,i)=>(<div key={i} style={{display:"flex",alignItems:"baseline",marginBottom:4,gap:4}} onMouseEnter={e=>{const rm=e.currentTarget.querySelector(".ra-rm");if(rm)rm.style.opacity=1;}} onMouseLeave={e=>{const rm=e.currentTarget.querySelector(".ra-rm");if(rm)rm.style.opacity=0;}}><span style={{fontFamily:RA_FONT,fontSize:10}}>•</span><div style={{flex:1}}><CSEditField value={item.label} onChange={v=>raSet(d=>{d.conductItems[i].label=v;return d;})} bold isPlaceholder={!item.label} placeholder="Label:" style={{fontSize:10,letterSpacing:RA_LS}}/>{" "}<CSEditField value={item.text} onChange={v=>raSet(d=>{d.conductItems[i].text=v;return d;})} isPlaceholder={!item.text} placeholder="Description" style={{fontSize:10,letterSpacing:RA_LS}}/></div><div className="ra-rm" onClick={()=>{if(pushUndo)pushUndo("delete conduct item");raSet(d=>({...d,conductItems:d.conductItems.filter((_,j)=>j!==i)}));}} style={{cursor:"pointer",fontSize:12,color:"#bbb",opacity:0,transition:"opacity .15s"}}>×</div></div>))}
            <div onClick={()=>raSet(d=>({...d,conductItems:[...d.conductItems,{label:"",text:""}]}))} style={{fontFamily:RA_FONT,fontSize:9,color:"#999",cursor:"pointer",letterSpacing:RA_LS}}>+ Add Item</div>
          </div>

          {raSectionHdr("LIABILITY WAIVER & ACKNOWLEDGMENT")}
          <div style={{padding:"8px 12px"}}><CSEditTextarea value={raData.waiverIntro||""} onChange={v=>raU("waiverIntro",v)} style={{fontSize:10,letterSpacing:RA_LS,marginBottom:8}}/></div>
          <div style={{padding:"8px 12px"}}>
            {(raData.waiverItems||[]).map((item,i)=>(<div key={i} style={{display:"flex",alignItems:"baseline",marginBottom:4,gap:4}} onMouseEnter={e=>{const rm=e.currentTarget.querySelector(".ra-rm");if(rm)rm.style.opacity=1;}} onMouseLeave={e=>{const rm=e.currentTarget.querySelector(".ra-rm");if(rm)rm.style.opacity=0;}}><span style={{fontFamily:RA_FONT,fontSize:10,fontWeight:700,minWidth:14}}>{i+1}.</span><div style={{flex:1}}><CSEditField value={item.label} onChange={v=>raSet(d=>{d.waiverItems[i].label=v;return d;})} bold isPlaceholder={!item.label} placeholder="Label:" style={{fontSize:10,letterSpacing:RA_LS}}/>{" "}<CSEditField value={item.text} onChange={v=>raSet(d=>{d.waiverItems[i].text=v;return d;})} isPlaceholder={!item.text} placeholder="Description" style={{fontSize:10,letterSpacing:RA_LS}}/></div><div className="ra-rm" onClick={()=>{if(pushUndo)pushUndo("delete waiver item");raSet(d=>({...d,waiverItems:d.waiverItems.filter((_,j)=>j!==i)}));}} style={{cursor:"pointer",fontSize:12,color:"#bbb",opacity:0,transition:"opacity .15s"}}>×</div></div>))}
            <div onClick={()=>raSet(d=>({...d,waiverItems:[...d.waiverItems,{label:"",text:""}]}))} style={{fontFamily:RA_FONT,fontSize:9,color:"#999",cursor:"pointer",letterSpacing:RA_LS}}>+ Add Item</div>
          </div>

          {raSectionHdr("EMERGENCY RESPONSE PLAN")}
          <div style={{padding:"8px 12px"}}>
            {(raData.emergencyItems||[]).map((item,i)=>(<div key={i} style={{display:"flex",alignItems:"baseline",marginBottom:4,gap:4}} onMouseEnter={e=>{const rm=e.currentTarget.querySelector(".ra-rm");if(rm)rm.style.opacity=1;}} onMouseLeave={e=>{const rm=e.currentTarget.querySelector(".ra-rm");if(rm)rm.style.opacity=0;}}><span style={{fontFamily:RA_FONT,fontSize:10}}>•</span><div style={{flex:1}}><CSEditField value={item.label} onChange={v=>raSet(d=>{d.emergencyItems[i].label=v;return d;})} bold isPlaceholder={!item.label} placeholder="Label:" style={{fontSize:10,letterSpacing:RA_LS}}/>{" "}<CSEditField value={item.text} onChange={v=>raSet(d=>{d.emergencyItems[i].text=v;return d;})} isPlaceholder={!item.text||/to be confirmed/i.test(item.text)} placeholder="Details" style={{fontSize:10,letterSpacing:RA_LS}}/></div><div className="ra-rm" onClick={()=>{if(pushUndo)pushUndo("delete emergency item");raSet(d=>({...d,emergencyItems:d.emergencyItems.filter((_,j)=>j!==i)}));}} style={{cursor:"pointer",fontSize:12,color:"#bbb",opacity:0,transition:"opacity .15s"}}>×</div></div>))}
            <div onClick={()=>raSet(d=>({...d,emergencyItems:[...d.emergencyItems,{label:"",text:""}]}))} style={{fontFamily:RA_FONT,fontSize:9,color:"#999",cursor:"pointer",letterSpacing:RA_LS}}>+ Add Item</div>
          </div>

          <div style={{marginTop:60,display:"flex",justifyContent:"space-between",fontFamily:RA_FONT,fontSize:9,letterSpacing:RA_LS_HDR,color:"#000"}}>
            <div><div style={{fontWeight:700}}>@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div>
            <div style={{textAlign:"right"}}><div style={{fontWeight:700}}>WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div>
          </div>
        </div>
      </div>
    );
  }

  if (documentsSubSection==="contracts") {
    const ctVersions = contractDocStore[p.id] || [];
    // If no contract selected yet, show contract list + type selector
    if (activeContractVersion === null || ctVersions.length === 0) {
      const createContract = (typeId) => {
        setContractDocStore(prev => {
          const store = JSON.parse(JSON.stringify(prev));
          const arr = store[p.id] || [];
          const _pi8=(projectInfoRef.current||{})[p.id];const _cfv2={};if(_pi8?.usage)_cfv2.usage=_pi8.usage;if((typeId==="talent"||typeId==="talent_psc")&&_pi8?.shootLocation)_cfv2.venue=_pi8.shootLocation;if((typeId==="talent"||typeId==="talent_psc")&&_pi8?.shootName)_cfv2.campaign=_pi8.shootName;arr.push({id:Date.now(),label:CONTRACT_TYPE_LABELS[typeId]||typeId,contractType:typeId,fieldValues:_cfv2,fieldConfirmed:{},generalTermsEdits:{},sigNames:{},signatures:{},prodLogo:null,signingStatus:"not_sent",signingToken:null});
          // Load default logo as data URL
          const newIdx = arr.length - 1;
          const logoImg = new Image(); logoImg.crossOrigin = "anonymous";
          logoImg.onload = () => { try { const cv = document.createElement("canvas"); cv.width = logoImg.naturalWidth; cv.height = logoImg.naturalHeight; cv.getContext("2d").drawImage(logoImg, 0, 0); const dataUrl = cv.toDataURL("image/png"); setContractDocStore(prev => { const s = JSON.parse(JSON.stringify(prev)); if (s[p.id] && s[p.id][newIdx] && !s[p.id][newIdx].prodLogo) s[p.id][newIdx].prodLogo = dataUrl; return s; }); } catch {} };
          logoImg.src = "/onna-default-logo.png";
          store[p.id] = arr; return store;
        });
        setActiveContractVersion(ctVersions.length);
        setCtTypeModalOpen(false);
      };
      const deleteContract = (idx) => {
        if (!confirm("Delete this contract? This will be moved to Deleted.")) return;
        pushUndo("delete contract");
        const ctData=JSON.parse(JSON.stringify((contractDocStore[p.id]||[])[idx])); if(ctData)archiveItem('contracts',{projectId:p.id,contract:ctData});
        setContractDocStore(prev => { const store = JSON.parse(JSON.stringify(prev)); const arr = store[p.id] || []; arr.splice(idx, 1); store[p.id] = arr; return store; });
      };
      const checkSigningStatus = async (idx) => {
        const ct = ctVersions[idx]; if (!ct?.signingToken) return;
        try {
          const resp = await fetch(`/api/sign?token=${encodeURIComponent(ct.signingToken)}`, {headers:{"Authorization":`Bearer ${getToken()}`}});
          const data = await resp.json();
          if (data.error) { showAlert("Could not check: " + data.error); return; }
          if (data.status === "signed" && data.vendorSig) {
            setContractDocStore(prev => {
              const store = JSON.parse(JSON.stringify(prev)); const arr = store[p.id] || []; const c = arr[idx]; if (!c) return store;
              c.sigNames = { ...(c.sigNames||{}), right_name: data.vendorSig.sigName||"", right_date: data.vendorSig.sigDate||"" };
              c.signatures = { ...(c.signatures||{}), right: data.vendorSig.signature||"" };
              c.signingStatus = "signed"; arr[idx] = c; store[p.id] = arr; return store;
            });
            setTimeout(()=>{ setActiveContractVersion(idx); setTimeout(()=>{
              const el=document.getElementById("onna-ct-print");if(!el)return;
              const clone=el.cloneNode(true);clone.querySelectorAll("button").forEach(b=>b.remove());clone.querySelectorAll("input[type=file]").forEach(b=>b.remove());
              const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
              const idoc=iframe.contentDocument;const _ctLbl=(ctVersions[idx]?.label||"Contract");idoc.open();idoc.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+_ctLbl+' Contract | '+p.name+'</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:\'Avenir\',\'Avenir Next\',\'Nunito Sans\',sans-serif;padding:10mm 12mm;}@media print{@page{margin:0;size:A4;}}'+PRINT_CLEANUP_CSS+'</style></head><body></body></html>');idoc.close();
              idoc.body.appendChild(idoc.adoptNode(clone));const prevTitle=document.title;document.title=_ctLbl+' Contract | '+p.name;const restoreTitle=()=>{document.title=prevTitle;try{document.body.removeChild(iframe);}catch{}window.removeEventListener("afterprint",restoreTitle);};window.addEventListener("afterprint",restoreTitle);setTimeout(()=>{idoc.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(el=>el.remove());iframe.contentWindow.focus();iframe.contentWindow.print();},300);
            },500); },100);
            showAlert("Vendor signature merged! PDF export opening...");
          } else {
            showAlert("Status: " + (data.status||"pending") + " \u2014 not yet signed.");
          }
        } catch (err) { showAlert("Error checking status: " + err.message); }
      };
      const STATUS_BADGE = {not_sent:{label:"Not sent",bg:"#f5f5f5",color:"#999"},pending:{label:"Pending signature",bg:"#FFF9C4",color:"#8d6e00"},signed:{label:"Signed",bg:"#e8f5e9",color:"#2e7d32"}};
      return (
        <div>
          {docBack}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{fontSize:16,fontWeight:700,color:T.text}}>Contracts</div>
            <button onClick={()=>setCtTypeModalOpen(true)} style={{padding:"7px 16px",borderRadius:9,background:T.accent,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New Contract</button>
          </div>
          {ctVersions.length===0 && <div style={{borderRadius:14,background:"#fafafa",border:`1.5px dashed ${T.border}`,padding:44,textAlign:"center"}}><div style={{fontSize:13,color:T.muted}}>No contracts yet. Click "+ New Contract" to get started.</div></div>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {ctVersions.map((ct,i)=>{const def=CONTRACT_DOC_TYPES.find(c=>c.id===ct.contractType)||CONTRACT_DOC_TYPES[0];const sb=STATUS_BADGE[ct.signingStatus||"not_sent"]||STATUS_BADGE.not_sent;return(
              <div key={ct.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border-color 0.15s"}} onClick={()=>setActiveContractVersion(i)} onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>{def.short}</span>
                    <span style={{fontSize:8,fontWeight:600,letterSpacing:0.5,background:sb.bg,color:sb.color,padding:"2px 8px",borderRadius:4}}>{sb.label}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:T.text}}>{ct.label||def.label}</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:2}}>{(ct.fieldValues||{}).date||"No date set"}</div>
                </div>
                <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                  {ct.signingStatus==="pending"&&<button onClick={()=>checkSigningStatus(i)} style={{padding:"4px 10px",borderRadius:7,background:"#fff3e0",color:"#e65100",border:"1px solid #ffcc80",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Check Status</button>}
                  <button onClick={()=>deleteContract(i)} style={{padding:"4px 10px",borderRadius:7,background:"#fff5f5",color:"#c0392b",border:"1px solid #f5c6cb",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                </div>
              </div>
            );})}
          </div>
          {ctTypeModalOpen && (
            <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.4)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setCtTypeModalOpen(false)}>
              <div style={{background:"#fff",borderRadius:16,padding:"28px 32px",maxWidth:440,width:"90%",boxShadow:"0 8px 32px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>New Contract</div>
                <div style={{fontSize:12,color:T.muted,marginBottom:18}}>Select a contract type:</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {CONTRACT_DOC_TYPES.map(c=>(
                    <button key={c.id} onClick={()=>createContract(c.id)} style={{padding:"14px 18px",borderRadius:10,border:`1px solid ${T.border}`,background:T.surface,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all 0.12s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.background="#f8f8fa";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.surface;}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.text}}>{c.label}</div>
                      <div style={{fontSize:11,color:T.muted,marginTop:2}}>{c.short}</div>
                    </button>
                  ))}
                </div>
                <button onClick={()=>setCtTypeModalOpen(false)} style={{marginTop:14,padding:"8px 20px",borderRadius:8,background:"transparent",border:`1px solid ${T.border}`,color:T.sub,fontSize:12,cursor:"pointer",fontFamily:"inherit",width:"100%"}}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      );
    }

    const ctIdx = Math.min(activeContractVersion, ctVersions.length - 1);
    const ctData = ctVersions[ctIdx] || ctVersions[0];
    const ctU = (path, val) => { setContractDocStore(prev => { const store = JSON.parse(JSON.stringify(prev)); const arr = store[p.id] || []; const idx = Math.min(ctIdx, arr.length - 1); const d = arr[idx]; const k = path.split("."); let o = d; for (let i = 0; i < k.length - 1; i++) o = o[k[i]]; o[k[k.length - 1]] = val; arr[idx] = d; store[p.id] = arr; return store; }); };
    const ctSet = (fn) => { setContractDocStore(prev => { const store = JSON.parse(JSON.stringify(prev)); const arr = store[p.id] || []; const idx = Math.min(ctIdx, arr.length - 1); arr[idx] = fn(JSON.parse(JSON.stringify(arr[idx]))); store[p.id] = arr; return store; }); };
    const activeContractType = ctData.contractType || "commission_se";
    const ctContract = CONTRACT_DOC_TYPES.find(c=>c.id===activeContractType) || CONTRACT_DOC_TYPES[0];
    const ctGetVal = (key) => (ctData.fieldValues||{})[key] || ctContract.fields.find(f=>f.key===key)?.defaultValue || "";
    const ctSetVal = (key, val) => ctSet(d=>({...d,fieldValues:{...(d.fieldValues||{}), [key]:val}}));
    const ctConfirmField = (key, val) => ctSet(d=>({...d, fieldConfirmed:{...(d.fieldConfirmed||{}), [key]: val}}));
    const ctGeneralTerms = (ctData.generalTermsEdits||{}).custom || GENERAL_TERMS_DOC[activeContractType] || "";
    const ctSetGeneralTerms = (val) => ctSet(d=>({...d,generalTermsEdits:{custom:val}}));

    const sigShareUrl = ctSignShareUrl;
    const setSigShareUrl = setCtSignShareUrl;
    const sigShareLoading = ctSignShareLoading;
    const setSigShareLoading = setCtSignShareLoading;

    const sigShareTitle = `ONNA | ${ctData.label || ctContract.label}`;

    const sendForSignature = async () => {
      setSigShareLoading(true);
      try {
        const resolvedTerms = (ctData.generalTermsEdits||{}).custom || GENERAL_TERMS_DOC[activeContractType] || "";
        const fieldLabels = {};
        const resolvedFieldValues = {};
        ctContract.fields.forEach(f => { fieldLabels[f.key] = f.label; resolvedFieldValues[f.key] = ctGetVal(f.key); });
        const snapshot = { fieldValues: resolvedFieldValues, generalTermsEdits: { custom: resolvedTerms }, sigNames: ctData.sigNames || {}, signatures: ctData.signatures || {}, prodLogo: ctData.prodLogo || null, contractType: activeContractType, fieldLabels };
        const resp = await fetch("/api/sign", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` }, body: JSON.stringify({ contractSnapshot: snapshot, projectName: p.name, contractType: activeContractType, label: ctData.label || ctContract.label }) });
        const data = await resp.json();
        if (data.url) {
          setSigShareUrl(data.url);
          ctSet(d=>({...d, signingStatus:"pending", signingToken:data.token||null}));
        }
        else showAlert("Failed to create signing link: " + (data.error || "Unknown error"));
      } catch (err) { showAlert("Error: " + err.message); }
      setSigShareLoading(false);
    };

    const ctExportPDF = () => {
      const el=document.getElementById("onna-ct-print");if(!el)return;
      const clone=el.cloneNode(true);clone.querySelectorAll("button").forEach(b=>b.remove());clone.querySelectorAll("input[type=file]").forEach(b=>b.remove());clone.querySelectorAll("canvas").forEach(c=>{const img=document.createElement("img");img.src=c.toDataURL();img.style.cssText=c.style.cssText;c.parentNode.replaceChild(img,c);});
      const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:1000px;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
      const idoc=iframe.contentDocument;idoc.open();idoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${ctData.label||"Contract"} Contract | ${p.name}</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;padding:10mm 12mm;}@media print{@page{margin:0;size:A4;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);idoc.close();
      idoc.body.appendChild(idoc.adoptNode(clone));const prevTitle=document.title;document.title=`${ctData.label||"Contract"} Contract | ${p.name}`;const restoreTitle=()=>{document.title=prevTitle;try{document.body.removeChild(iframe);}catch{}window.removeEventListener("afterprint",restoreTitle);};window.addEventListener("afterprint",restoreTitle);setTimeout(()=>{idoc.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(el=>el.remove());iframe.contentWindow.focus();iframe.contentWindow.print();},300);
    };

    return (
      <div>
        <button onClick={()=>setActiveContractVersion(null)} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16}}>Back to Contracts</button>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>{ctContract.short}</span>
            <span style={{fontSize:14,fontWeight:600,color:T.text}}>{ctData.label||ctContract.label}</span>
          </div>
          <div style={{display:"flex",gap:6}}>
            <BtnExport onClick={ctExportPDF}>Export PDF</BtnExport>
            <button onClick={sendForSignature} disabled={sigShareLoading} style={{padding:"5px 13px",borderRadius:8,background:"#1a5a30",color:"#fff",border:"none",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:5,opacity:sigShareLoading?0.6:1}}>{sigShareLoading?"Generating\u2026":"Send for Signature"}</button>
          </div>
        </div>
        {sigShareUrl && (
          <div style={{background:"#f0faf4",border:"1px solid #c8efd4",borderRadius:10,padding:"14px 18px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,color:"#1a5a30",marginBottom:8}}>{sigShareTitle}</div>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <input readOnly value={sigShareUrl} style={{flex:1,minWidth:200,padding:"6px 10px",borderRadius:7,border:"1px solid #c8efd4",fontSize:11.5,fontFamily:"inherit",color:"#333",background:"#fff"}}/>
              <button onClick={()=>{navigator.clipboard.writeText(`${sigShareTitle}\n${sigShareUrl}`);}} style={{padding:"5px 13px",borderRadius:8,background:"#1d1d1f",color:"#fff",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Copy</button>
              <button onClick={()=>setSigShareUrl(null)} style={{background:"none",border:"none",color:"#999",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit",padding:"0 4px"}}>Close</button>
            </div>
          </div>
        )}
        <div style={{marginBottom:10,fontSize:11,color:T.muted}}>Label: <input value={ctData.label||""} onChange={e=>ctU("label",e.target.value)} style={{padding:"4px 9px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:12,fontFamily:"inherit",color:T.text,width:220}} placeholder={ctContract.label}/></div>

        <div style={{overflowX:"auto",margin:isMobile?"0 -16px":"0",padding:isMobile?"0 16px":"0"}}>
        <div id="onna-ct-print" style={{background:"#fff",padding:"40px 40px",fontFamily:CT_FONT,color:"#1a1a1a",lineHeight:1.5,maxWidth:880,margin:"0 auto",minWidth:600}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <CSLogoSlot label="Production Logo" image={ctData.prodLogo} onUpload={v=>ctU("prodLogo",v)} onRemove={()=>ctU("prodLogo",null)}/>
          </div>
          <div style={{borderBottom:"2.5px solid #000",marginBottom:16}}/>
          <div style={{textAlign:"center",fontFamily:CT_FONT,fontSize:12,fontWeight:700,letterSpacing:CT_LS_HDR,textTransform:"uppercase",marginBottom:12}}>{ctContract.title}</div>
          {(p.name || ctData.label) && <div style={{fontFamily:CT_FONT,fontSize:9,color:"#1a1a1a",letterSpacing:CT_LS,marginBottom:14}}>{p.name && <span>Project: {p.name}</span>}{p.name && ctData.label && <span style={{margin:"0 6px"}}>|</span>}{ctData.label && <span>{ctData.label}</span>}</div>}

          {ctContract.headTermsLabel && (<>
            <div style={{background:"#f4f4f4",padding:"6px 12px",borderBottom:"1px solid #ddd"}}>
              <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:700,letterSpacing:CT_LS_HDR}}>{ctContract.headTermsLabel}</span>
            </div>
            {ctContract.fields.map((field) => {const confirmed=(ctData.fieldConfirmed||{})[field.key];return(
              <div key={field.key} style={{display:"flex",borderBottom:"1px solid #eee",minHeight:32}}>
                <div style={{width:220,minWidth:220,padding:"8px 12px",background:"#fafafa",borderRight:"1px solid #eee"}}>
                  <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS}}>{field.label}</span>
                </div>
                <div style={{flex:1,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
                  <div style={{flex:1}}><CSEditField value={ctGetVal(field.key)} onChange={v=>ctSetVal(field.key,v)} isPlaceholder={!confirmed} placeholder={field.label} style={{fontSize:10,letterSpacing:CT_LS}}/></div>
                  <div onClick={()=>ctConfirmField(field.key,!confirmed)} style={{cursor:"pointer",width:16,height:16,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{confirmed?<svg width="14" height="14" viewBox="0 0 14 14"><rect x="0.5" y="0.5" width="13" height="13" rx="2" fill="#000" stroke="#000"/><path d="M3.5 7L6 9.5L10.5 4.5" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>:<svg width="14" height="14" viewBox="0 0 14 14"><rect x="0.5" y="0.5" width="13" height="13" rx="2" fill="none" stroke="#ccc" strokeWidth="1"/></svg>}</div>
                </div>
              </div>
            )})}
          </>)}

          {ctContract.sigLeft && (<>
            <div style={{background:"#000",color:"#fff",fontFamily:CT_FONT,fontSize:10,fontWeight:700,letterSpacing:CT_LS_HDR,textAlign:"center",padding:"4px 0",textTransform:"uppercase",marginTop:32}}>SIGNATURE</div>
            <div style={{display:"flex",borderBottom:"1px solid #eee",marginTop:0}}>
              {[{side:"left",label:ctContract.sigLeft},{side:"right",label:ctContract.sigRight}].map(({side,label})=>(
                <div key={side} style={{flex:1,padding:"12px",borderRight:side==="left"?"1px solid #eee":"none"}}>
                  <div style={{fontFamily:CT_FONT,fontSize:9,fontWeight:700,letterSpacing:CT_LS,marginBottom:12}}>{label}</div>
                  <div style={{marginBottom:8}}>
                    <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,display:"block",marginBottom:4}}>Signature:</span>
                    <SignaturePad value={(ctData.signatures||{})[side]||""} onChange={v=>ctSet(d=>({...d,signatures:{...(d.signatures||{}), [side]:v}}))} height={60}/>
                  </div>
                  {["name","date"].map(f=>(
                    <div key={f} style={{display:"flex",gap:8,marginBottom:8,alignItems:"baseline"}}>
                      <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,minWidth:80}}>{f==="name"?"Print Name:":"Date:"}</span>
                      <div style={{flex:1,borderBottom:"1px solid #ccc",minHeight:20}}>
                        <CSEditField value={(ctData.sigNames||{})[`${side}_${f}`]||""} onChange={v=>ctSet(d=>({...d,sigNames:{...(d.sigNames||{}), [`${side}_${f}`]:v}}))} placeholder={f==="name"?"Print name...":"Date..."} style={{fontSize:10}}/>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>)}

          <div style={{marginTop:32}}>
            <div style={{background:"#000",color:"#fff",fontFamily:CT_FONT,fontSize:10,fontWeight:700,letterSpacing:CT_LS_HDR,textAlign:"center",padding:"4px 0",textTransform:"uppercase"}}>GENERAL TERMS</div>
            <textarea value={ctGeneralTerms} onChange={e=>ctSetGeneralTerms(e.target.value)}
              style={{width:"100%",boxSizing:"border-box",fontFamily:CT_FONT,fontSize:10,letterSpacing:CT_LS,lineHeight:1.6,color:"#1a1a1a",border:"1px solid #eee",borderTop:"none",padding:"12px",minHeight:600,resize:"vertical",outline:"none",background:"#fff",whiteSpace:"pre-wrap"}}
              onFocus={e=>{e.target.style.borderColor="#E0D9A8";e.target.style.background="#FFFDE7";}}
              onBlur={e=>{e.target.style.borderColor="#eee";e.target.style.background="#fff";}}/>
          </div>

          <div style={{marginTop:60,display:"flex",justifyContent:"space-between",fontFamily:CT_FONT,fontSize:9,letterSpacing:CT_LS_HDR,color:"#000",borderTop:"2px solid #000",paddingTop:12}}>
            <div><div style={{fontWeight:700}}>@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div>
            <div style={{textAlign:"right"}}><div style={{fontWeight:700}}>WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // ── Dietaries section ──
  if (documentsSubSection==="dietaries") {
    const dietVersions = dietaryStore[p.id] || [];
    const addDietNew = () => {
      pushUndo("add dietary");
      const newId = Date.now();
      const newDiet = {id:newId,label:`${p.name} Dietary V${dietVersions.length+1}`,...JSON.parse(JSON.stringify(DIETARY_INIT))};
      const _pi=(projectInfoRef.current||{})[p.id];
      if(_pi){if(_pi.shootName)newDiet.project.name=_pi.shootName;if(_pi.shootDate)newDiet.project.date=_pi.shootDate;}
      newDiet.project.name=newDiet.project.name==="[Project Name]"?`${p.client||""} | ${p.name}`.replace(/^TEMPLATE \| /,""):newDiet.project.name;
      // Auto-sync crew + project info from call sheets
      const csVersions = callSheetStore[p.id] || [];
      if (csVersions.length > 0) {
        const latestCS = csVersions[csVersions.length - 1];
        if(latestCS.shootName)newDiet.project.name=latestCS.shootName;
        if(latestCS.date)newDiet.project.date=latestCS.date;
        // Extract client from shootName if it contains " | " pattern
        const csParts=(latestCS.shootName||"").split(" | ");
        if(csParts.length>=2)newDiet.project.client=csParts[0].trim();
        const pulled = [];
        (latestCS.departments||[]).forEach(dept=>{(dept.crew||[]).forEach(cr=>{if(cr.name&&cr.name.trim())pulled.push({id:Date.now()+Math.random(),name:cr.name.trim(),role:cr.role||"",department:dept.name||"",dietary:"None",allergies:"",notes:""});});});
        if(pulled.length>0)newDiet.people=pulled;
      }
      setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));if(!store[p.id])store[p.id]=[];store[p.id].push(newDiet);return store;});
      const logoImg=new Image();logoImg.crossOrigin="anonymous";logoImg.onload=()=>{try{const cv=document.createElement("canvas");cv.width=logoImg.naturalWidth;cv.height=logoImg.naturalHeight;cv.getContext("2d").drawImage(logoImg,0,0);const dataUrl=cv.toDataURL("image/png");setDietaryStore(prev=>{const s=JSON.parse(JSON.stringify(prev));const arr=s[p.id]||[];const idx=arr.findIndex(e=>e.id===newId);if(idx>=0&&!arr[idx].productionLogo){arr[idx].productionLogo=dataUrl;}return s;});}catch{}};logoImg.src="/onna-default-logo.png";
      setActiveDietaryVersion(dietVersions.length);
    };
    const deleteDiet = (idx) => {
      if(!confirm("Delete this dietary list? This will be moved to Deleted."))return;
      pushUndo("delete dietary");
      const dietData=JSON.parse(JSON.stringify((dietaryStore[p.id]||[])[idx]));
      if(dietData)archiveItem('dietaries',{projectId:p.id,dietary:dietData});
      setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];arr.splice(idx,1);store[p.id]=arr;return store;});
      setActiveDietaryVersion(null);
    };

    // ── List view ──
    if (activeDietaryVersion === null || dietVersions.length === 0) {
      return (
        <div>
          {docBack}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{fontSize:16,fontWeight:700,color:T.text}}>Dietary Lists</div>
            <div style={{position:"relative"}}>
              <button onClick={()=>setCreateMenuOpen(prev=>({...prev,diet:!prev.diet}))} style={{padding:"7px 16px",borderRadius:9,background:T.accent,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New Dietary List ▾</button>
              {createMenuOpen.diet&&<div onClick={()=>setCreateMenuOpen(prev=>({...prev,diet:false}))} style={{position:"fixed",inset:0,zIndex:9998}} />}
              {createMenuOpen.diet&&(
                <div style={{position:"absolute",top:36,right:0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:180,overflow:"hidden"}}>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,diet:false}));addDietNew();}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Blank</div>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,diet:false}));setDuplicateModal({type:"dietary"});setDuplicateSearch("");}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Existing</div>
                </div>
              )}
            </div>
          </div>
          {dietVersions.length===0 && <div style={{borderRadius:14,background:"#fafafa",border:`1.5px dashed ${T.border}`,padding:44,textAlign:"center"}}><div style={{fontSize:13,color:T.muted}}>No dietary lists yet. Click "+ New Dietary List" to get started.</div></div>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {dietVersions.map((diet,i)=>{
              const crewCount=(diet.people||[]).length;
              const dietaryCount=(diet.people||[]).filter(pr=>pr.dietary&&pr.dietary!=="None").length;
              return(
                <div key={diet.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border-color 0.15s"}} onClick={()=>setActiveDietaryVersion(i)}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>DL</span>
                      <span style={{fontSize:8,fontWeight:600,letterSpacing:0.5,background:crewCount>0?"#e8f5e9":"#f5f5f5",color:crewCount>0?"#2e7d32":"#999",padding:"2px 8px",borderRadius:4}}>{crewCount} crew · {dietaryCount} dietary</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:T.text}}>{diet.label||"Untitled"}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>{diet.project?.date||"No date set"}</div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();deleteDiet(i);}} style={{padding:"4px 10px",borderRadius:7,background:"#fff5f5",color:"#c0392b",border:"1px solid #f5c6cb",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ── Detail view ──
    const dietIdx = Math.min(activeDietaryVersion, dietVersions.length-1);
    const dietData = dietVersions[dietIdx] || dietVersions[0];
    if(!dietData){setActiveDietaryVersion(null);return null;}

    const dietU = (path, val) => {
      setDietaryStore(prev=>{
        const store=JSON.parse(JSON.stringify(prev));
        const arr=store[p.id]||[];
        const idx=Math.min(dietIdx,arr.length-1);
        const d=arr[idx];
        const k=path.split(".");let o=d;
        for(let i=0;i<k.length-1;i++)o=o[k[i]];
        o[k[k.length-1]]=val;
        arr[idx]=d;store[p.id]=arr;return store;
      });
    };
    const dietUpdatePerson = (i,key,val) => {
      setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[dietIdx];d.people=d.people.map((pr,j)=>j===i?{...pr,[key]:val}:pr);arr[dietIdx]=d;store[p.id]=arr;return store;});
    };
    const dietAddPerson = () => {
      setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[dietIdx];d.people.push({id:Date.now(),name:"",role:"",department:"",dietary:"None",allergies:"",notes:""});arr[dietIdx]=d;store[p.id]=arr;return store;});
    };
    const dietDeletePerson = (i) => {
      setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[dietIdx];d.people=d.people.filter((_,j)=>j!==i);arr[dietIdx]=d;store[p.id]=arr;return store;});
    };
    // Sync from call sheet — pulls crew from latest call sheet, reflects deleted rows
    const dietSyncFromCS = () => {
      const csVersions = callSheetStore[p.id] || [];
      if(csVersions.length===0){showAlert("No call sheets found for this project. Create a call sheet first.");return;}
      const latestCS = csVersions[csVersions.length-1];
      const pulled = [];
      (latestCS.departments||[]).forEach(dept=>{(dept.crew||[]).forEach(cr=>{if(cr.name&&cr.name.trim())pulled.push({name:cr.name.trim().toLowerCase(),role:cr.role||"",department:dept.name||"",origName:cr.name.trim()});});});
      if(pulled.length===0){showAlert("No crew names found in the latest call sheet.");return;}
      setDietaryStore(prev=>{
        const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[dietIdx];
        if(latestCS.shootName)d.project.name=latestCS.shootName;
        if(latestCS.date)d.project.date=latestCS.date;
        const csParts=(latestCS.shootName||"").split(" | ");
        if(csParts.length>=2)d.project.client=csParts[0].trim();
        d.people=pulled.map(pr=>({id:Date.now()+Math.random(),name:pr.origName,role:pr.role,department:pr.department,dietary:"None",allergies:"",notes:""}));
        arr[dietIdx]=d;store[p.id]=arr;return store;
      });
      showAlert(`Synced ${pulled.length} crew member${pulled.length===1?"":"s"} from call sheet. Previous dietary details cleared.`);
    };

    // Summary counts
    const dietCounts={};
    (dietData.people||[]).forEach(pr=>{const d=pr.dietary||"None";dietCounts[d]=(dietCounts[d]||0)+1;});
    const dietTotalWithDietary=(dietData.people||[]).filter(pr=>pr.dietary&&pr.dietary!=="None").length;
    const dietTotalWithAllergy=(dietData.people||[]).filter(pr=>pr.allergies&&pr.allergies.trim()).length;

    const dietExportPDF = (elId,orient) => {
      const _eid=elId||"onna-diet-print";const _ori=orient||"landscape";
      const el=document.getElementById(_eid);if(!el)return;
      const clone=el.cloneNode(true);clone.querySelectorAll("button").forEach(b=>b.remove());clone.querySelectorAll("input[type=file]").forEach(b=>b.remove());
      const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
      const doc=iframe.contentDocument;doc.open();doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${dietData.label||"Dietary List"} | ${p.name}</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;padding:10mm 12mm;}@media print{@page{margin:0;size:A4 ${_ori};}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);doc.close();
      doc.body.appendChild(doc.adoptNode(clone));const prevTitle=document.title;document.title=`${dietData.label||"Dietary List"} | ${p.name}`;const restoreTitle=()=>{document.title=prevTitle;try{document.body.removeChild(iframe);}catch{}window.removeEventListener("afterprint",restoreTitle);};window.addEventListener("afterprint",restoreTitle);setTimeout(()=>{iframe.contentWindow.focus();iframe.contentWindow.print();},300);
    };

    return (
      <div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <button onClick={()=>setActiveDietaryVersion(null)} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,display:"flex",alignItems:"center",gap:4}}>‹ Back to Dietary Lists</button>
          <div style={{flex:1}}/>
          {dietaryTab==="dietary"&&<button onClick={dietSyncFromCS} style={{padding:"5px 13px",borderRadius:8,background:"#f5f5f5",color:"#666",border:`1px solid ${T.border}`,fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:5}}>Sync from Call Sheet</button>}
          <BtnExport onClick={()=>dietExportPDF(dietaryTab==="menu"?"onna-menu-print":"onna-diet-print",dietaryTab==="menu"?"portrait":"landscape")}>Export PDF</BtnExport>
        </div>
        <div style={{marginBottom:12}}>
          <input value={dietData.label||""} onChange={e=>dietU("label",e.target.value)} style={{fontSize:16,fontWeight:700,color:T.text,background:"transparent",border:"none",outline:"none",fontFamily:"inherit",padding:0,width:"100%"}} placeholder="Dietary List Name"/>
        </div>
        <div style={{display:"flex",gap:0,marginBottom:18,borderBottom:`1px solid ${T.border}`}}>
          {[{id:"dietary",label:"Dietary"},{id:"menu",label:"Menu"}].map(tab=><button key={tab.id} onClick={()=>setDietaryTab(tab.id)} style={{padding:"8px 18px",fontSize:12,fontWeight:dietaryTab===tab.id?700:500,color:dietaryTab===tab.id?T.text:T.muted,background:"none",border:"none",borderBottom:dietaryTab===tab.id?`2px solid ${T.text}`:"2px solid transparent",cursor:"pointer",fontFamily:"inherit",marginBottom:-1}}>{tab.label}</button>)}
        </div>
        {dietaryTab==="dietary"&&<div id="onna-diet-print" style={{background:"#fff",padding:0,fontFamily:CS_FONT,borderRadius:0}}>
          <div style={{maxWidth:1123,margin:"0 auto",background:"#FFFFFF"}}>
            {/* Header */}
            <div style={{padding:"40px 40px 0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                <CSLogoSlot label="Production Logo" image={dietData.productionLogo} onUpload={v=>dietU("productionLogo",v)} onRemove={()=>dietU("productionLogo",null)}/>
                <div style={{display:"flex",gap:16,alignItems:"center",marginTop:-3}}>
                  <CSLogoSlot label="Agency Logo" image={dietData.agencyLogo} onUpload={v=>dietU("agencyLogo",v)} onRemove={()=>dietU("agencyLogo",null)}/>
                  <CSLogoSlot label="Client Logo" image={dietData.clientLogo} onUpload={v=>dietU("clientLogo",v)} onRemove={()=>dietU("clientLogo",null)}/>
                </div>
              </div>
              <div style={{borderBottom:"2.5px solid #000",marginBottom:16}}/>
            </div>

            <div style={{textAlign:"center",padding:"20px 32px 4px"}}>
              <div style={{fontSize:12,fontWeight:800,letterSpacing:CS_LS,color:"#000"}}>DIETARY REQUIREMENTS</div>
            </div>

            {/* Project info */}
            <div style={{padding:"8px 32px 12px",display:"flex",gap:4,flexWrap:"wrap"}}>
              {[["PROJECT:",dietData.project?.name,"project.name"],["CLIENT:",dietData.project?.client,"project.client"],["DATE:",dietData.project?.date,"project.date"],["CATERING:",dietData.project?.cateringContact,"project.cateringContact"]].map(([lbl,val,key])=>(
                <div key={key} style={{display:"flex",gap:4,alignItems:"baseline",marginRight:16}}>
                  <span style={{fontFamily:CS_FONT,fontSize:9,fontWeight:700,letterSpacing:0.5}}>{lbl}</span>
                  <TICell value={val||""} onChange={v=>dietU(key,v)}/>
                </div>
              ))}
            </div>

            {/* Summary badges */}
            <div style={{padding:"0 32px 14px",display:"flex",gap:6,flexWrap:"wrap"}}>
              <div style={{fontFamily:CS_FONT,fontSize:8,fontWeight:700,letterSpacing:0.5,background:"#f4f4f4",padding:"4px 10px",borderRadius:2,color:"#666"}}>TOTAL CREW: {(dietData.people||[]).length}</div>
              <div style={{fontFamily:CS_FONT,fontSize:8,fontWeight:700,letterSpacing:0.5,background:"#E8F5E9",padding:"4px 10px",borderRadius:2,color:"#2E7D32"}}>DIETARY: {dietTotalWithDietary}</div>
              <div style={{fontFamily:CS_FONT,fontSize:8,fontWeight:700,letterSpacing:0.5,background:"#FCE4EC",padding:"4px 10px",borderRadius:2,color:"#C62828"}}>ALLERGIES: {dietTotalWithAllergy}</div>
              {Object.entries(dietCounts).filter(([k])=>k!=="None").map(([tag,count])=>(
                <div key={tag} style={{fontFamily:CS_FONT,fontSize:8,letterSpacing:0.5,background:"#f9f9f9",padding:"4px 8px",borderRadius:2,color:"#999"}}>{tag}: {count}</div>
              ))}
            </div>

            {/* Table */}
            <div style={{padding:"0 32px",marginBottom:16}}>
              <div style={{display:"flex",background:"#000",padding:"4px 8px",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontFamily:CS_FONT,fontSize:10,fontWeight:700,letterSpacing:0.5,color:"#fff",textTransform:"uppercase"}}>CREW DIETARY NOTES</span>
                <span onClick={dietAddPerson} style={{fontFamily:CS_FONT,fontSize:8,color:"rgba(255,255,255,0.55)",cursor:"pointer",letterSpacing:0.5}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.55)"}>+ ADD ROW</span>
              </div>
              {/* Column headers */}
              <div style={{display:"flex",background:"#f4f4f4",borderBottom:"1px solid #ddd"}}>
                <div style={{width:24,fontFamily:CS_FONT,fontSize:7,fontWeight:700,letterSpacing:0.5,color:"#999",padding:"4px 4px",textAlign:"center"}}>#</div>
                <div style={{width:18}}/>
                <div style={{flex:1.2,fontFamily:CS_FONT,fontSize:7,fontWeight:700,letterSpacing:0.5,color:"#999",padding:"4px 6px"}}>NAME</div>
                <div style={{flex:0.8,fontFamily:CS_FONT,fontSize:7,fontWeight:700,letterSpacing:0.5,color:"#999",padding:"4px 6px"}}>ROLE</div>
                <div style={{flex:0.7,fontFamily:CS_FONT,fontSize:7,fontWeight:700,letterSpacing:0.5,color:"#999",padding:"4px 6px"}}>DEPARTMENT</div>
                <div style={{flex:0.7,fontFamily:CS_FONT,fontSize:7,fontWeight:700,letterSpacing:0.5,color:"#999",padding:"4px 6px"}}>DIETARY</div>
                <div style={{flex:1,fontFamily:CS_FONT,fontSize:7,fontWeight:700,letterSpacing:0.5,color:"#999",padding:"4px 6px"}}>ALLERGIES / INTOLERANCES</div>
                <div style={{flex:1.2,fontFamily:CS_FONT,fontSize:7,fontWeight:700,letterSpacing:0.5,color:"#999",padding:"4px 6px"}}>NOTES</div>
              </div>
              {/* Rows */}
              {(dietData.people||[]).map((person,i)=>(
                <div key={person.id} style={{display:"flex",borderBottom:"1px solid #f0f0f0",alignItems:"center",minHeight:28}}>
                  <div style={{width:24,fontFamily:CS_FONT,fontSize:8,fontWeight:700,letterSpacing:0.5,color:"#ccc",padding:"3px 4px",textAlign:"center"}}>{i+1}</div>
                  <div style={{width:18,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span onClick={()=>dietDeletePerson(i)} style={{cursor:"pointer",fontSize:10,color:"#ddd"}} onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="#ddd"}>×</span>
                  </div>
                  <div style={{flex:1.2}}><TICell value={person.name} onChange={v=>dietUpdatePerson(i,"name",v)} style={{fontWeight:600}}/></div>
                  <div style={{flex:0.8}}><TICell value={person.role} onChange={v=>dietUpdatePerson(i,"role",v)} style={{color:"#666"}}/></div>
                  <div style={{flex:0.7}}><TICell value={person.department} onChange={v=>dietUpdatePerson(i,"department",v)} style={{color:"#999"}}/></div>
                  <div style={{flex:0.7,padding:"2px 4px"}}><DietaryTagSelect value={person.dietary} onChange={v=>dietUpdatePerson(i,"dietary",v)}/></div>
                  <div style={{flex:1}}><TICell value={person.allergies} onChange={v=>dietUpdatePerson(i,"allergies",v)} style={{color:person.allergies?"#C62828":"#ddd"}}/></div>
                  <div style={{flex:1.2}}><TICell value={person.notes} onChange={v=>dietUpdatePerson(i,"notes",v)} style={{color:"#999",fontStyle:person.notes?"italic":"normal"}}/></div>
                </div>
              ))}
              {(dietData.people||[]).length===0&&<div style={{fontFamily:CS_FONT,fontSize:9,color:"#ccc",letterSpacing:0.5,padding:"12px 26px",fontStyle:"italic"}}>No crew listed — click Sync from Call Sheet or + ADD ROW</div>}
            </div>

            {/* Footer */}
            <div style={{padding:"0 32px 32px"}}>
              <div style={{marginTop:32,display:"flex",justifyContent:"space-between",fontFamily:CS_FONT,fontSize:9,letterSpacing:0.5,color:"#000",borderTop:"2px solid #000",paddingTop:12}}>
                <div><div style={{fontWeight:700}}>@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div>
                <div style={{textAlign:"right"}}><div style={{fontWeight:700}}>WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div>
              </div>
            </div>
          </div>
        </div>}
        {dietaryTab==="menu"&&<div id="onna-menu-print" style={{background:"#fff",padding:0,fontFamily:CS_FONT,borderRadius:0}}>
          <div style={{maxWidth:800,margin:"0 auto",background:"#FFFFFF"}}>
            <div style={{padding:"40px 40px 0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                <CSLogoSlot label="Production Logo" image={dietData.productionLogo} onUpload={v=>dietU("productionLogo",v)} onRemove={()=>dietU("productionLogo",null)}/>
                <div style={{display:"flex",gap:16,alignItems:"center",marginTop:-3}}>
                  <CSLogoSlot label="Agency Logo" image={dietData.agencyLogo} onUpload={v=>dietU("agencyLogo",v)} onRemove={()=>dietU("agencyLogo",null)}/>
                  <CSLogoSlot label="Client Logo" image={dietData.clientLogo} onUpload={v=>dietU("clientLogo",v)} onRemove={()=>dietU("clientLogo",null)}/>
                </div>
              </div>
            </div>
            <div style={{padding:"20px 40px 10px",textAlign:"center"}}>
              <div style={{fontFamily:CS_FONT,fontSize:22,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#000"}}>MENU</div>
              <div style={{fontFamily:CS_FONT,fontSize:10,color:"#666",marginTop:4,letterSpacing:0.5}}>{dietData.project?.name||""}{dietData.project?.date?" \u2014 "+dietData.project.date:""}</div>
            </div>
            <div style={{padding:"14px 40px",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
                <span onClick={()=>{setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[dietIdx];if(!d.menu)d.menu=[];d.menu.push({id:Date.now(),category:"",items:""});arr[dietIdx]=d;store[p.id]=arr;return store;});}} style={{fontFamily:CS_FONT,fontSize:9,color:"#999",cursor:"pointer",letterSpacing:0.5,fontWeight:600}} onMouseEnter={e=>e.target.style.color="#000"} onMouseLeave={e=>e.target.style.color="#999"}>+ ADD SECTION</span>
              </div>
              {(dietData.menu||[]).map((m,mi)=>(
                <div key={m.id} style={{marginBottom:18}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                    <span onClick={()=>{setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[dietIdx];d.menu=(d.menu||[]).filter((_,j)=>j!==mi);arr[dietIdx]=d;store[p.id]=arr;return store;});}} style={{cursor:"pointer",fontSize:10,color:"#ddd",flexShrink:0}} onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="#ddd"}>×</span>
                    <input value={m.category} onChange={e=>{const v=e.target.value;setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[dietIdx];d.menu[mi].category=v;arr[dietIdx]=d;store[p.id]=arr;return store;});}} placeholder="e.g. Starters, Mains, Desserts, Drinks" style={{fontFamily:CS_FONT,fontSize:11,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",background:"transparent",border:"none",outline:"none",color:"#000",padding:0,width:"100%",borderBottom:"1px solid #eee",paddingBottom:4}}/>
                  </div>
                  <textarea value={m.items} onChange={e=>{const v=e.target.value;setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[dietIdx];d.menu[mi].items=v;arr[dietIdx]=d;store[p.id]=arr;return store;});}} placeholder="List menu items here..." rows={4} style={{fontFamily:CS_FONT,fontSize:10,color:"#333",background:"#fafafa",border:"1px solid #eee",borderRadius:4,padding:"8px 10px",width:"100%",boxSizing:"border-box",resize:"vertical",outline:"none",lineHeight:1.7}}/>
                </div>
              ))}
              {(dietData.menu||[]).length===0&&<div style={{fontFamily:CS_FONT,fontSize:10,color:"#ccc",letterSpacing:0.5,padding:"24px 8px",fontStyle:"italic",textAlign:"center"}}>No menu added yet \u2014 click + ADD SECTION above</div>}
            </div>
            <div style={{padding:"0 40px 40px"}}>
              <div style={{marginTop:32,display:"flex",justifyContent:"space-between",fontFamily:CS_FONT,fontSize:9,letterSpacing:0.5,color:"#000",borderTop:"2px solid #000",paddingTop:12}}>
                <div><div style={{fontWeight:700}}>@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div>
                <div style={{textAlign:"right"}}><div style={{fontWeight:700}}>WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div>
              </div>
            </div>
          </div>
        </div>}
      </div>
    );
  }

  if (documentsSubSection==="permits") {
    const PERMIT_CARDS = [
      {key:"customs",  emoji:"🛃", label:"Customs Permit"},
      {key:"carnet",   emoji:"📑", label:"Carnet"},
      {key:"shoot",    emoji:"🎬", label:"Shoot Permit"},
    ];
    if (!permitsSubSection) return (
      <div>
        {docBack}
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
          {PERMIT_CARDS.map(c=>(
            <div key={c.key} onClick={()=>setPermitsSubSection(c.key)} className="proj-card" style={{borderRadius:16,padding:"22px 20px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",transition:"border-color 0.15s"}}>
              <span style={{fontSize:28}}>{c.emoji}</span>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.text}}>{c.label}</div>
                <div style={{fontSize:12,color:T.muted,marginTop:2}}>{(getProjectFiles(p.id,"permit_"+c.key)||[]).length} file{(getProjectFiles(p.id,"permit_"+c.key)||[]).length!==1?"s":""}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
    const permitBack = <button onClick={()=>setPermitsSubSection(null)} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>‹ Back to Permits</button>;
    const pc = PERMIT_CARDS.find(c=>c.key===permitsSubSection);
    return (
      <div>
        {permitBack}
        <div style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:14}}>{pc?.emoji} {pc?.label}</div>
        <UploadZone label={`Upload ${pc?.label.toLowerCase()} documents (PDF, images)`} files={getProjectFiles(p.id,"permit_"+permitsSubSection)} onAdd={f=>addProjectFiles(p.id,"permit_"+permitsSubSection,f)}/>
      </div>
    );
  }

  return null;
}
