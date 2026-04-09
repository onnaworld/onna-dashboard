import React, { Fragment, useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { renderHtmlToDocPages, exportDocPreview, PRINT_CLEANUP_CSS, PRINT_CLEANUP_SCRIPT, makeDocUpdater } from "../../utils/helpers";
import { showAlert, showPrompt } from "../../utils/modal";
import { CALLSHEET_INIT, DIETARY_INIT, ESTIMATE_INIT,
  CS_FONT, CS_LS, CSLogoSlot, CSAddBtn, CSEditField, CSEditTextarea, CSResizableImage, CSXbtn,
  RA_FONT, RA_LS, RA_LS_HDR, RA_GREY, CT_FONT, CT_LS, CT_LS_HDR, SignaturePad } from "../ui/DocHelpers";
import { RISK_ASSESSMENT_INIT } from "../../data/riskAssessmentInit";
import { CONTRACT_INIT, CONTRACT_DOC_TYPES, GENERAL_TERMS_DOC } from "./ContractCody";
import { revertConnieMarker, revertConnieMarkers } from "./CallSheetConnie";
import { revertMarker } from "./RiskAssessmentRonnie";
import { revertBillieMarker, revertBillieMarkers } from "./BudgetBillie";
import EstimateView from "./EstimateView";
export default function AgentDocPreview({agentId, projectId, callSheetStore, setCallSheetStore, activeCSVersion, riskAssessmentStore, setRiskAssessmentStore, activeRAVersion, contractDocStore, setContractDocStore, activeContractVersion, projectEstimates, setProjectEstimates, activeEstimateVersion, pushUndo, ronniePendingReview, setRonniePendingReview, onRonnieReviewDone, conniePendingReview, setConniePendingReview, onConnieReviewDone, billiePendingReview, setBilliePendingReview, onBillieReviewDone, billieRateCards, connieMode, dietaryStore, setDietaryStore, onDietarySelect, projectInfoRef:_piRef}) {
  if (!projectId) return null;

  // ── CONNIE: Dietary list view ──
  const [connieDietIdx,setConnieDietIdx]=useState(null);
  const [connieDietTab,setConnieDietTab]=useState("dietary");
  if (agentId === "compliance" && connieMode === "dietary" && dietaryStore && setDietaryStore) {
    const dietVersions = dietaryStore[projectId] || [];
    const addDietNew = () => {
      const newId = Date.now();
      const newDiet = {id:newId,label:`Dietary List ${dietVersions.length+1}`,...JSON.parse(JSON.stringify(DIETARY_INIT))};
      const _pi=(_piRef?.current||{})[projectId];
      if(_pi){if(_pi.shootName)newDiet.project.name=_pi.shootName;if(_pi.shootDate)newDiet.project.date=_pi.shootDate;}
      newDiet.project.name=newDiet.project.name==="[Project Name]"?`${_pi?.client||""} | ${_pi?.name||""}`.replace(/^TEMPLATE \| /,""):newDiet.project.name;
      const csVersions = (callSheetStore||{})[projectId] || [];
      if (csVersions.length > 0) {
        const latestCS = csVersions[csVersions.length - 1];
        if(latestCS.shootName)newDiet.project.name=latestCS.shootName;
        if(latestCS.date)newDiet.project.date=latestCS.date;
        const csParts=(latestCS.shootName||"").split(" | ");
        if(csParts.length>=2)newDiet.project.client=csParts[0].trim();
        const pulled = [];
        (latestCS.departments||[]).forEach(dept=>{(dept.crew||[]).forEach(cr=>{if(cr.name&&cr.name.trim())pulled.push({id:Date.now()+Math.random(),name:cr.name.trim(),role:cr.role||"",department:dept.name||"",dietary:"None",allergies:"",notes:""});});});
        if(pulled.length>0)newDiet.people=pulled;
      }
      setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));if(!store[projectId])store[projectId]=[];store[projectId].push(newDiet);return store;});
      return dietVersions.length; // return new index
    };
    const deleteDiet = (idx) => {
      if(!confirm("Delete this dietary list?"))return;
      setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[projectId]||[];arr.splice(idx,1);store[projectId]=arr;return store;});
      if(connieDietIdx===idx)setConnieDietIdx(dietVersions.length>1?0:null);
      else if(connieDietIdx!==null&&connieDietIdx>idx)setConnieDietIdx(connieDietIdx-1);
    };

    // Auto-create if no dietary lists exist
    if(dietVersions.length===0){
      const newIdx=addDietNew();
      setTimeout(()=>setConnieDietIdx(0),0);
    }

    // Auto-select first if none selected
    if(connieDietIdx===null && dietVersions.length>0){
      const activeIdx=dietVersions.length-1;
      return(<div style={{overflowY:"auto",padding:20,background:"#fff",height:"100%"}}>{setTimeout(()=>setConnieDietIdx(activeIdx),0)&&null}</div>);
    }

    if(connieDietIdx!==null && dietVersions.length>0){
      const dietIdx=Math.min(connieDietIdx,dietVersions.length-1);
      const dietData=dietVersions[dietIdx];
      if(!dietData){setConnieDietIdx(null);return null;}
      const dietU=(path,val)=>{setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[projectId]||[];const d=arr[dietIdx];const k=path.split(".");let o=d;for(let i=0;i<k.length-1;i++)o=o[k[i]];o[k[k.length-1]]=val;arr[dietIdx]=d;store[projectId]=arr;return store;});};
      const dietUpdatePerson=(i,key,val)=>{setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[projectId]||[];const d=arr[dietIdx];d.people=d.people.map((pr,j)=>j===i?{...pr,[key]:val}:pr);arr[dietIdx]=d;store[projectId]=arr;return store;});};
      const dietAddPerson=()=>{setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[projectId]||[];const d=arr[dietIdx];d.people.push({id:Date.now(),name:"",role:"",department:"",dietary:"None",allergies:"",notes:""});arr[dietIdx]=d;store[projectId]=arr;return store;});};
      const dietDeletePerson=(i)=>{setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[projectId]||[];const d=arr[dietIdx];d.people=d.people.filter((_,j)=>j!==i);arr[dietIdx]=d;store[projectId]=arr;return store;});};
      const dietSyncFromCS=async()=>{const csVersions=(callSheetStore||{})[projectId]||[];if(csVersions.length===0){showAlert("No call sheets found for this project. Create a call sheet first via the Call Sheets tab.");return;}let csIdx=csVersions.length-1;if(csVersions.length>1){const labels=csVersions.map((v,i)=>`${i+1}. ${v.label||"Day "+(i+1)}`).join("\n");const pick=await showPrompt("Which call sheet do you want to sync from?\n\n"+labels+"\n\nEnter number:");if(!pick)return;const n=parseInt(pick,10);if(isNaN(n)||n<1||n>csVersions.length){showAlert("Invalid selection.");return;}csIdx=n-1;}const latestCS=csVersions[csIdx];const pulled=[];(latestCS.departments||[]).forEach(dept=>{(dept.crew||[]).forEach(cr=>{if(cr.name&&cr.name.trim())pulled.push({name:cr.name.trim().toLowerCase(),role:cr.role||"",department:dept.name||"",origName:cr.name.trim()});});});if(pulled.length===0){showAlert("No crew found in call sheet.");return;}setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[projectId]||[];const d=arr[dietIdx];if(latestCS.shootName)d.project.name=latestCS.shootName;if(latestCS.date)d.project.date=latestCS.date;const csParts=(latestCS.shootName||"").split(" | ");if(csParts.length>=2)d.project.client=csParts[0].trim();d.people=pulled.map(pr=>({id:Date.now()+Math.random(),name:pr.origName,role:pr.role,department:pr.department,dietary:"None",allergies:"",notes:""}));arr[dietIdx]=d;store[projectId]=arr;return store;});showAlert(`Synced ${pulled.length} crew member${pulled.length===1?"":"s"} from call sheet. Previous dietary details cleared.`);};
      const dietCounts={};(dietData.people||[]).forEach(pr=>{const d=pr.dietary||"None";dietCounts[d]=(dietCounts[d]||0)+1;});
      const dietTotalWithDietary=(dietData.people||[]).filter(pr=>pr.dietary&&pr.dietary!=="None").length;
      const dietTotalWithAllergy=(dietData.people||[]).filter(pr=>pr.allergies&&pr.allergies.trim()).length;
      return(
        <div style={{overflowY:"auto",background:"#fff",height:"100%",display:"flex",flexDirection:"column"}}>
          {/* Tab bar */}
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"#fafafa",borderBottom:"1px solid #e5e5ea",overflowX:"auto",whiteSpace:"nowrap",flexShrink:0}}>
            {dietVersions.map((dv,i)=>{const isActive=i===dietIdx;return(
              <div key={dv.id} onClick={()=>setConnieDietIdx(i)} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:8,fontSize:12,fontWeight:600,fontFamily:"inherit",cursor:"pointer",border:isActive?"1px solid #c47090":"1px solid #e0e0e0",background:isActive?"#fff5f7":"#f5f5f7",color:isActive?"#7a1a30":"#6e6e73",borderBottom:isActive?"2px solid #c47090":"2px solid transparent",transition:"all 0.15s",flexShrink:0}}>
                <span>{dv.label||`List ${i+1}`}</span>
                {dietVersions.length>1&&<span onClick={e=>{e.stopPropagation();deleteDiet(i);}} style={{marginLeft:2,cursor:"pointer",opacity:0.5,fontSize:11,lineHeight:1}}>&times;</span>}
              </div>
            );})}
            <div onClick={()=>{const ni=addDietNew();setTimeout(()=>setConnieDietIdx(ni),0);}} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:8,border:"1.5px dashed #ccc",background:"transparent",fontSize:14,color:"#999",cursor:"pointer",flexShrink:0,fontFamily:"inherit"}}>+</div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:20}}>
            {/* Dietary/Menu tabs */}
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <input value={dietData.label||""} onChange={e=>dietU("label",e.target.value)} style={{fontSize:15,fontWeight:700,background:"transparent",border:"none",outline:"none",fontFamily:"inherit",padding:0,flex:1}} placeholder="Dietary List Name"/>
              {connieDietTab==="dietary"&&<button onClick={dietSyncFromCS} style={{padding:"5px 13px",borderRadius:8,background:"#f5f5f5",color:"#666",border:"1px solid #e5e5ea",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Sync from Call Sheet</button>}
            </div>
            <div style={{display:"flex",gap:0,marginBottom:14,borderBottom:"1px solid #e5e5ea"}}>
              {[{id:"dietary",label:"Dietary"},{id:"menu",label:"Menu"}].map(tab=><button key={tab.id} onClick={()=>setConnieDietTab(tab.id)} style={{padding:"8px 18px",fontSize:12,fontWeight:connieDietTab===tab.id?700:500,color:connieDietTab===tab.id?"#1d1d1f":"#86868b",background:"none",border:"none",borderBottom:connieDietTab===tab.id?"2px solid #1d1d1f":"2px solid transparent",cursor:"pointer",fontFamily:"inherit",marginBottom:-1}}>{tab.label}</button>)}
            </div>
            {connieDietTab==="dietary"&&<>
              <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                <span style={{fontSize:10,fontWeight:600,background:"#e3f2fd",color:"#1565c0",padding:"3px 10px",borderRadius:6}}>TOTAL CREW: {(dietData.people||[]).length}</span>
                <span style={{fontSize:10,fontWeight:600,background:dietTotalWithDietary>0?"#fff3e0":"#f5f5f5",color:dietTotalWithDietary>0?"#e65100":"#999",padding:"3px 10px",borderRadius:6}}>DIETARY: {dietTotalWithDietary}</span>
                <span style={{fontSize:10,fontWeight:600,background:dietTotalWithAllergy>0?"#fce4ec":"#f5f5f5",color:dietTotalWithAllergy>0?"#c62828":"#999",padding:"3px 10px",borderRadius:6}}>ALLERGIES: {dietTotalWithAllergy}</span>
              </div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr style={{background:"#1d1d1f",color:"#fff"}}>
                  <th style={{padding:"6px 8px",textAlign:"left",fontWeight:700,fontSize:9,letterSpacing:0.5}}>#</th>
                  <th style={{padding:"6px 8px",textAlign:"left",fontWeight:700,fontSize:9,letterSpacing:0.5}}>NAME</th>
                  <th style={{padding:"6px 8px",textAlign:"left",fontWeight:700,fontSize:9,letterSpacing:0.5}}>ROLE</th>
                  <th style={{padding:"6px 8px",textAlign:"left",fontWeight:700,fontSize:9,letterSpacing:0.5}}>DEPT</th>
                  <th style={{padding:"6px 8px",textAlign:"left",fontWeight:700,fontSize:9,letterSpacing:0.5}}>DIETARY</th>
                  <th style={{padding:"6px 8px",textAlign:"left",fontWeight:700,fontSize:9,letterSpacing:0.5}}>ALLERGIES</th>
                  <th style={{padding:"6px 8px",width:20}}></th>
                </tr></thead>
                <tbody>
                  {(dietData.people||[]).map((pr,i)=>(
                    <tr key={pr.id||i} style={{borderBottom:"1px solid #eee"}}>
                      <td style={{padding:"5px 8px",color:"#999",fontSize:10}}>{i+1}</td>
                      <td style={{padding:"5px 8px"}}><input value={pr.name||""} onChange={e=>dietUpdatePerson(i,"name",e.target.value)} placeholder="[Name]" style={{border:"none",outline:"none",fontSize:11,width:"100%",fontFamily:"inherit",background:(!pr.name||pr.name.startsWith("["))?"#FFFDE7":"transparent",padding:"2px 4px",borderRadius:3}}/></td>
                      <td style={{padding:"5px 8px"}}><input value={pr.role||""} onChange={e=>dietUpdatePerson(i,"role",e.target.value)} placeholder="[Role]" style={{border:"none",outline:"none",fontSize:11,width:"100%",fontFamily:"inherit",background:(!pr.role||pr.role.startsWith("["))?"#FFFDE7":"transparent",padding:"2px 4px",borderRadius:3}}/></td>
                      <td style={{padding:"5px 8px"}}><input value={pr.department||""} onChange={e=>dietUpdatePerson(i,"department",e.target.value)} placeholder="[Department]" style={{border:"none",outline:"none",fontSize:11,width:"100%",fontFamily:"inherit",background:(!pr.department||pr.department.startsWith("["))?"#FFFDE7":"transparent",padding:"2px 4px",borderRadius:3}}/></td>
                      <td style={{padding:"5px 8px"}}><select value={pr.dietary||"None"} onChange={e=>dietUpdatePerson(i,"dietary",e.target.value)} style={{border:"none",outline:"none",fontSize:10,fontFamily:"inherit",background:pr.dietary&&pr.dietary!=="None"?"#fff3e0":"#f5f5f5",padding:"2px 6px",borderRadius:4,cursor:"pointer"}}>{["None","Vegetarian","Vegan","Halal","Kosher","Gluten-Free","Dairy-Free","Nut Allergy","Shellfish Allergy","Pescatarian","Other"].map(o=><option key={o} value={o}>{o}</option>)}</select></td>
                      <td style={{padding:"5px 8px"}}><input value={pr.allergies||""} onChange={e=>dietUpdatePerson(i,"allergies",e.target.value)} style={{border:"none",outline:"none",fontSize:11,width:"100%",fontFamily:"inherit",padding:"2px 4px",borderRadius:3}}/></td>
                      <td style={{padding:"5px 8px"}}><span onClick={()=>dietDeletePerson(i)} style={{cursor:"pointer",fontSize:11,color:"#ddd"}} onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="#ddd"}>&times;</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={dietAddPerson} style={{marginTop:8,background:"none",border:"1px dashed #ccc",borderRadius:6,padding:"5px 12px",fontSize:10,color:"#999",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>+ ADD ROW</button>
            </>}
            {connieDietTab==="menu"&&<div>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
                <span onClick={()=>{setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[projectId]||[];const d=arr[dietIdx];if(!d.menu)d.menu=[];d.menu.push({id:Date.now(),category:"",items:""});arr[dietIdx]=d;store[projectId]=arr;return store;});}} style={{fontSize:10,color:"#999",cursor:"pointer",fontWeight:600}} onMouseEnter={e=>e.target.style.color="#000"} onMouseLeave={e=>e.target.style.color="#999"}>+ ADD SECTION</span>
              </div>
              {(dietData.menu||[]).map((m,mi)=>(
                <div key={m.id} style={{marginBottom:18}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                    <span onClick={()=>{setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[projectId]||[];const d=arr[dietIdx];d.menu=(d.menu||[]).filter((_,j)=>j!==mi);arr[dietIdx]=d;store[projectId]=arr;return store;});}} style={{cursor:"pointer",fontSize:10,color:"#ddd",flexShrink:0}} onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="#ddd"}>&times;</span>
                    <input value={m.category} onChange={e=>{const v=e.target.value;setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[projectId]||[];const d=arr[dietIdx];d.menu[mi].category=v;arr[dietIdx]=d;store[projectId]=arr;return store;});}} placeholder="e.g. Starters, Mains, Desserts, Drinks" style={{fontSize:11,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",background:"transparent",border:"none",outline:"none",color:"#000",padding:0,width:"100%",borderBottom:"1px solid #eee",paddingBottom:4,fontFamily:"inherit"}}/>
                  </div>
                  <textarea value={m.items} onChange={e=>{const v=e.target.value;setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[projectId]||[];const d=arr[dietIdx];d.menu[mi].items=v;arr[dietIdx]=d;store[projectId]=arr;return store;});}} placeholder="List menu items here..." rows={4} style={{fontSize:10,color:"#333",background:"#fafafa",border:"1px solid #eee",borderRadius:4,padding:"8px 10px",width:"100%",boxSizing:"border-box",resize:"vertical",outline:"none",lineHeight:1.7,fontFamily:"inherit"}}/>
                </div>
              ))}
              {(dietData.menu||[]).length===0&&<div style={{fontSize:10,color:"#ccc",letterSpacing:0.5,padding:"24px 8px",fontStyle:"italic",textAlign:"center"}}>No menu added yet. Click + ADD SECTION above.</div>}
            </div>}
          </div>
        </div>
      );
    }

    return <div style={{padding:20,background:"#fff",height:"100%"}}><div style={{color:"#888",fontSize:12,textAlign:"center",padding:40}}>Loading...</div></div>;
  }

  // ── CONNIE (Call Sheet) ──
  if (agentId === "compliance" && callSheetStore && setCallSheetStore) {
    const csVersions = callSheetStore[projectId] || [];
      if(csVersions.length===0) return <div style={{padding:40,textAlign:"center",color:"#888",fontSize:12}}>No call sheet created yet. Tell Connie a project name to get started.</div>;
    const csIdx = Math.min(activeCSVersion||0, csVersions.length - 1);
    const csData = csVersions[csIdx] || csVersions[0];
    const {update:csU, set:csSet} = makeDocUpdater(projectId, csIdx, setCallSheetStore, CALLSHEET_INIT, "Day 1");

    // ── Confirmed-fields tracking: yellow until user accepts or manually edits ──
    const cfSet = new Set(csData._confirmed || []);
    const isFC = (k) => cfSet.has(k);
    const confirmFC = (...keys) => { const cur = new Set(csData._confirmed || []); let ch = false; keys.forEach(k => { if (!cur.has(k)) { cur.add(k); ch = true; } }); if (ch) csU("_confirmed", [...cur]); };
    const csUC = (path, v, ...cfKeys) => { csU(path, v); if (cfKeys.length) confirmFC(...cfKeys); };
    const weatherHLKeys = ["weatherHighC","weatherHighF","weatherLowC","weatherLowF"];
    const weatherRFHLKeys = ["weatherRealFeelHighC","weatherRealFeelHighF","weatherRealFeelLowC","weatherRealFeelLowF"];
    const markerToCfKeys = (m) => {
      if (m.startsWith("cs:scalar:")) { const f = m.replace("cs:scalar:",""); if (weatherHLKeys.includes(f)) return ["weatherHL"]; if (weatherRFHLKeys.includes(f)) return ["weatherRFHL"]; return [f]; }
      if (m.startsWith("cs:emergencyNum:")) return ["emergNum:"+m.split(":")[2]];
      if (m === "cs:emergency.hospital") return ["emergency.hospital"];
      if (m === "cs:emergency.police") return ["emergency.police"];
      if (m.startsWith("cs:venueRow:")) { const label = m.replace("cs:venueRow:",""); const idx = (csData.venueRows||[]).findIndex(r=>r.label.toUpperCase()===label); return idx>=0?["venueRow:"+idx]:[]; }
      if (m === "cs:schedule") return (csData.schedule||[]).map((_,i)=>"schedRow:"+i);
      if (m.startsWith("cs:scheduleRow:")) return ["schedRow:"+m.split(":")[2]];
      if (m.startsWith("cs:crew:")) { const parts=m.split(":"); const dn=parts[2]; const rl=parts[3]; const di=(csData.departments||[]).findIndex(d=>d.name.toUpperCase()===dn); if(di<0) return []; const ci=csData.departments[di].crew.findIndex(c=>(c.role||"").toUpperCase()===rl); return ci>=0?["crew:"+di+":"+ci]:[]; }
      if (m === "cs:weatherHourly") return ["weatherHourly"];
      return [];
    };

      const cpr = conniePendingReview && conniePendingReview.projectId===projectId && conniePendingReview.vIdx===(activeCSVersion||0) ? conniePendingReview : null;
      const cprMarkers = cpr ? new Set(cpr.markers) : null;
      const hasCM = (m) => cprMarkers && cprMarkers.has(m);
      const finishCReview = () => { if(setConniePendingReview) setConniePendingReview(null); if(onConnieReviewDone) onConnieReviewDone(); };
      const acceptCM = (m) => { if(!setConniePendingReview||!cpr) return; confirmFC(...markerToCfKeys(m)); const next = cpr.markers.filter(x=>x!==m); if(next.length===0){ finishCReview(); } else { setConniePendingReview({...cpr, markers:next}); } };
      const declineCM = (m) => { if(!setConniePendingReview||!cpr) return; revertConnieMarker(m, cpr.preSnapshot, cpr.projectId, cpr.vIdx, setCallSheetStore); const next = cpr.markers.filter(x=>x!==m); if(next.length===0){ finishCReview(); } else { setConniePendingReview({...cpr, markers:next}); } };
      const acceptCMs = (...ms) => { if(!setConniePendingReview||!cpr) return; ms.forEach(m=>confirmFC(...markerToCfKeys(m))); const s=new Set(ms); const next = cpr.markers.filter(x=>!s.has(x)); if(next.length===0){ finishCReview(); } else { setConniePendingReview({...cpr, markers:next}); } };
      const declineCMs = (...ms) => { if(!setConniePendingReview||!cpr) return; revertConnieMarkers(ms, cpr.preSnapshot, cpr.projectId, cpr.vIdx, setCallSheetStore); const s=new Set(ms); const next = cpr.markers.filter(x=>!s.has(x)); if(next.length===0){ finishCReview(); } else { setConniePendingReview({...cpr, markers:next}); } };
      const acceptAllC = () => { if(!cpr) return; cpr.markers.forEach(m=>confirmFC(...markerToCfKeys(m))); finishCReview(); };
      const declineAllC = () => { if(!cpr) return; revertConnieMarkers(cpr.markers, cpr.preSnapshot, cpr.projectId, cpr.vIdx, setCallSheetStore); finishCReview(); };
      const cRevBtn = (type) => ({width:16,height:16,borderRadius:3,border:"none",background:type==="accept"?"#4caf50":"#ef5350",color:"#fff",fontSize:9,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:2,lineHeight:1,verticalAlign:"middle"});
      const cHL = {borderLeft:"3px solid #1976D2",paddingLeft:4,marginLeft:-7};

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

    // Auto-fill Production On Set from crew with PRODUCER in role
    const producerContacts = (csData.departments||[]).flatMap(d=>d.crew.filter(c=>c.role&&c.role.toUpperCase().includes("PRODUCER")&&c.name)).map(c=>c.name+(c.mobile?" | "+c.mobile:"")).join(" / ");
    if(producerContacts && !csData.productionContacts) setTimeout(()=>csU("productionContacts",producerContacts),0);

    const csLbl = {fontSize:9,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:CS_LS};
    const csDeptBg = "#F4F4F4";
    const csSecTitle = {fontSize:10,fontWeight:800,letterSpacing:CS_LS,textTransform:"uppercase",borderBottom:"2px solid #000",paddingBottom:5,marginBottom:10};
    const csTh = {padding:"5px 4px",fontSize:9,fontWeight:800,letterSpacing:CS_LS,color:"#555",background:"#fff",textTransform:"uppercase",whiteSpace:"nowrap"};

    return (
      <div style={{overflowY:"auto",padding:0,background:"#fff",height:"100%"}}>
        <div style={{padding:"8px 12px 4px",fontSize:10,fontWeight:600,color:"#888",letterSpacing:1,textTransform:"uppercase",borderBottom:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{display:"inline-flex",alignItems:"center",gap:6}}>Call Sheet — <input value={csData.label||""} onChange={e=>csU("label",e.target.value)} style={{padding:"2px 6px",borderRadius:5,border:"1px solid #e0e0e0",fontSize:10,fontWeight:600,fontFamily:"inherit",color:"#555",width:100,letterSpacing:1,textTransform:"uppercase",background:"transparent"}} placeholder={`Day ${csIdx+1}`} onFocus={e=>{e.target.style.borderColor="#c47090";e.target.style.background="#fff5f7";}} onBlur={e=>{e.target.style.borderColor="#e0e0e0";e.target.style.background="transparent";}}/></span>{cpr&&cpr.markers.length>0&&(<div style={{display:"flex",gap:4}}><button onClick={acceptAllC} style={{fontSize:9,fontWeight:600,color:"#2e7d32",background:"#e8f5e9",border:"none",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}>Accept All</button><button onClick={declineAllC} style={{fontSize:9,fontWeight:600,color:"#c62828",background:"#fce4ec",border:"none",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}>Decline All</button></div>)}</div>
        <div style={{padding:0,fontFamily:CS_FONT}}>
          <div style={{maxWidth:880,margin:"0 auto",background:"#FFFFFF"}}>
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
            <div style={{textAlign:"center",padding:"20px 32px 4px 48px"}}><div style={{fontSize:12,fontWeight:800,letterSpacing:CS_LS,color:"#000",display:"flex",justifyContent:"space-between",alignItems:"center"}}>CALL SHEET{cpr&&cpr.markers.length>0&&<span style={{display:"flex",gap:4,marginLeft:12}}><button onClick={acceptAllC} style={{fontSize:9,fontWeight:600,color:"#2e7d32",background:"#e8f5e9",border:"none",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}>Accept All</button><button onClick={declineAllC} style={{fontSize:9,fontWeight:600,color:"#c62828",background:"#fce4ec",border:"none",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}>Decline All</button></span>}</div></div>
            <div style={{padding:"8px 32px 10px 48px",display:"flex",justifyContent:"space-between",alignItems:"baseline",position:"relative"}}>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:CS_LS,position:"relative"}}><span style={hasCM("cs:scalar:shootName")?cHL:{}}><CSEditField value={csData.shootName} onChange={v=>{csU("shootName",v);confirmFC("shootName");}} bold alwaysYellow={!isFC("shootName")} style={{fontSize:11,fontWeight:800,letterSpacing:CS_LS}} placeholder="SHOOT NAME"/></span>{hasCM("cs:scalar:shootName")&&<span style={{position:"absolute",left:-28,top:0,display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:scalar:shootName")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:scalar:shootName")} style={cRevBtn("decline")}>{"✕"}</button></span>}</div>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:CS_LS,position:"absolute",left:"50%",transform:"translateX(-50%)"}}><span style={hasCM("cs:scalar:date")?cHL:{}}><CSEditField value={csData.date} onChange={v=>{csU("date",v);confirmFC("date");}} alwaysYellow={!isFC("date")} style={{fontSize:11,color:"#000",fontWeight:800,letterSpacing:CS_LS}} placeholder="DAY & DATE"/></span>{hasCM("cs:scalar:date")&&<span style={{position:"absolute",left:-28,top:0,display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:scalar:date")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:scalar:date")} style={cRevBtn("decline")}>{"✕"}</button></span>}</div>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:CS_LS,whiteSpace:"nowrap",position:"relative"}}>SHOOT DAY <span style={hasCM("cs:scalar:dayNumber")?cHL:{}}><CSEditField value={csData.dayNumber} onChange={v=>{csU("dayNumber",v);confirmFC("dayNumber");}} bold alwaysYellow={!isFC("dayNumber")} style={{fontSize:11,fontWeight:800,letterSpacing:CS_LS}} placeholder="#"/></span>{hasCM("cs:scalar:dayNumber")&&<span style={{position:"absolute",left:-28,top:0,display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:scalar:dayNumber")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:scalar:dayNumber")} style={cRevBtn("decline")}>{"✕"}</button></span>}</div>
            </div>
            <div style={{padding:"0 32px 10px 48px",textAlign:"center",position:"relative",...(hasCM("cs:scalar:passportNote")?cHL:{})}}><CSEditField value={csData.passportNote} onChange={v=>{csU("passportNote",v);confirmFC("passportNote");}} alwaysYellow={!isFC("passportNote")} style={{color:"#C62828",fontSize:8,fontWeight:700,letterSpacing:CS_LS}}/>{hasCM("cs:scalar:passportNote")&&<span style={{position:"absolute",left:-28,top:"50%",transform:"translateY(-50%)",display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:scalar:passportNote")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:scalar:passportNote")} style={cRevBtn("decline")}>{"✕"}</button></span>}</div>
            <div style={{height:1,background:"#eee",margin:"0 32px"}}/>
            <div style={{padding:"10px 32px 10px 48px",borderBottom:"1px solid #eee",fontSize:11,position:"relative"}}><span style={csLbl}>Production On Set: </span><span style={hasCM("cs:scalar:productionContacts")?cHL:{}}><CSEditField value={csData.productionContacts} onChange={v=>{csU("productionContacts",v);confirmFC("productionContacts");}} alwaysYellow={!isFC("productionContacts")} style={{fontSize:11,letterSpacing:CS_LS}} placeholder="Name + Number / Name + Number"/></span>{hasCM("cs:scalar:productionContacts")&&<span style={{position:"absolute",left:-28,top:"50%",transform:"translateY(-50%)",display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:scalar:productionContacts")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:scalar:productionContacts")} style={cRevBtn("decline")}>{"✕"}</button></span>}</div>
            {/* SHOOT */}
            <div style={{padding:"14px 32px 8px 48px"}}>
              <div style={{...csSecTitle,display:"flex",justifyContent:"space-between",alignItems:"center"}}>SHOOT</div>
              {csData.venueRows.map((row,i) => { const vrm = "cs:venueRow:"+row.label.toUpperCase(); const vrHas = hasCM(vrm); return (<div key={i} style={{display:"flex",alignItems:"center",marginBottom:5,gap:8,position:"relative"}} draggable onDragStart={e=>{e.dataTransfer.setData("text/plain","venueRow:"+i);e.currentTarget.style.opacity=0.4;}} onDragEnd={e=>{e.currentTarget.style.opacity=1;}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const d=e.dataTransfer.getData("text/plain");if(d.startsWith("venueRow:")){const from=+d.split(":")[1];if(from!==i)csSet(dd=>{const a=[...dd.venueRows];const[m]=a.splice(from,1);a.splice(i,0,m);return{...dd,venueRows:a};});}}}>{vrHas&&<div style={{position:"absolute",left:-28,top:0,display:"flex",gap:1}}><button onClick={()=>acceptCM(vrm)} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM(vrm)} style={cRevBtn("decline")}>{"✕"}</button></div>}<div style={{cursor:"grab",color:"#ccc",fontSize:10,padding:"0 2px",userSelect:"none"}}>☰</div><div style={{minWidth:95}}><CSEditField value={row.label} onChange={v=>{csU(`venueRows.${i}.label`,v);confirmFC("venueRow:"+i);}} bold alwaysYellow={!isFC("venueRow:"+i)} style={{fontSize:9,fontWeight:700,color:"#888",letterSpacing:CS_LS,textTransform:"uppercase"}} placeholder="LABEL"/></div><div style={{flex:1,fontSize:11,...(vrHas?cHL:{})}}><CSEditField value={row.value} onChange={v=>{csU(`venueRows.${i}.value`,v);confirmFC("venueRow:"+i);}} alwaysYellow={!isFC("venueRow:"+i)} style={{fontSize:11}} placeholder="Enter details..."/></div><CSXbtn onClick={()=>rmVenueRow(i)}/></div>);})}
              <CSAddBtn onClick={addVenueRow} label="Add Row"/>
            </div>
            {/* SCHEDULE */}
            <div style={{padding:"10px 32px 10px 48px"}}>
              <div style={{...csSecTitle,display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"}}>SCHEDULE{hasCM("cs:schedule")&&<span style={{position:"absolute",left:-28,top:0,display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:schedule")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:schedule")} style={cRevBtn("decline")}>{"✕"}</button></span>}</div>
              <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
                <thead><tr style={{background:csDeptBg}}><td style={{width:16,background:csDeptBg}}></td><td style={{...csTh,background:csDeptBg,width:"10%"}}>TIME</td><td style={{...csTh,background:csDeptBg,width:"18%"}}>ACTIVITY</td><td style={{...csTh,background:csDeptBg}}>NOTES</td><td style={{width:36,background:csDeptBg}}></td></tr></thead>
                <tbody>{csData.schedule.map((row,i) => { const srm = "cs:scheduleRow:"+i; const srHas = hasCM(srm); return (<tr key={i} draggable onDragStart={e=>{e.dataTransfer.setData("text/plain","sched:"+i);e.currentTarget.style.opacity=0.4;}} onDragEnd={e=>{e.currentTarget.style.opacity=1;}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const d=e.dataTransfer.getData("text/plain");if(d.startsWith("sched:")){const from=+d.split(":")[1];if(from!==i)csSet(dd=>{const a=[...dd.schedule];const[m]=a.splice(from,1);a.splice(i,0,m);return{...dd,schedule:a};});}}} style={{borderBottom:"1px solid #f0f0f0",background:srHas?"#E3F2FD":"#fff",cursor:"grab"}}><td style={{padding:"4px 2px 4px 0",fontSize:10,color:"#ccc",width:srHas?36:16}}>{srHas?<span style={{display:"inline-flex",gap:1}}><button onClick={()=>acceptCM(srm)} style={cRevBtn("accept")}>{"\u2713"}</button><button onClick={()=>declineCM(srm)} style={cRevBtn("decline")}>{"\u2715"}</button></span>:"\u2630"}</td><td style={{padding:"4px 4px 4px 0",fontSize:11,fontWeight:600}}><CSEditField value={row.time} onChange={v=>{csU(`schedule.${i}.time`,v);confirmFC("schedRow:"+i);}} alwaysYellow={!isFC("schedRow:"+i)} placeholder="00:00" style={{fontSize:11,fontWeight:600}}/></td><td style={{padding:"4px 4px",fontSize:11,fontWeight:600}}><CSEditField value={row.activity} onChange={v=>{csU(`schedule.${i}.activity`,v);confirmFC("schedRow:"+i);}} alwaysYellow={!isFC("schedRow:"+i)} placeholder="Activity" style={{fontSize:11,fontWeight:600}}/></td><td style={{padding:"4px 4px",fontSize:11}}><CSEditField value={row.notes} onChange={v=>{csU(`schedule.${i}.notes`,v);confirmFC("schedRow:"+i);}} alwaysYellow={!isFC("schedRow:"+i)} placeholder="Notes" style={{fontSize:11}}/></td><td style={{width:20}}><CSXbtn onClick={()=>rmScheduleRow(i)}/></td></tr>);})}</tbody>
              </table>
              <CSAddBtn onClick={addScheduleRow} label="Add Row"/>
            </div>
            {/* CONTACTS */}
            <div style={{padding:"10px 32px 10px 48px"}}>
              <div style={csSecTitle}>CONTACTS</div>
              <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
                <thead><tr><td style={{width:16}}></td><td style={{...csTh,width:"18%"}}>ROLE</td><td style={{...csTh,width:"17%"}}>NAME</td><td style={{...csTh,width:"17%"}}>MOBILE</td><td style={{...csTh,width:"30%"}}>EMAIL</td><td style={{...csTh,textAlign:"right",paddingRight:8}}>CALL TIME</td><td style={{width:14}}></td></tr></thead>
                <tbody>{csData.departments.map((dept,di) => {
                const deptMarkers = cpr ? cpr.markers.filter(m=>m.startsWith("cs:crew:"+dept.name.toUpperCase()+":")) : [];
                const deptHasMarker = deptMarkers.length > 0;
                return (<Fragment key={di}><tr draggable onDragStart={e=>{e.dataTransfer.setData("text/plain","dept:"+di);e.currentTarget.style.opacity=0.4;}} onDragEnd={e=>{e.currentTarget.style.opacity=1;}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const d=e.dataTransfer.getData("text/plain");if(d.startsWith("dept:")){const from=+d.split(":")[1];if(from!==di)csSet(dd=>{const a=[...dd.departments];const[m]=a.splice(from,1);a.splice(di,0,m);return{...dd,departments:a};});}}}><td colSpan={7} style={{padding:0}}><div style={{background:deptHasMarker?"#2e7d32":"#1a1a1a",padding:"3px 8px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"grab"}}><div style={{display:"flex",alignItems:"center",gap:4}}>{deptHasMarker&&<><button onClick={()=>acceptCMs(...deptMarkers)} style={{background:"#4caf50",border:"none",borderRadius:4,color:"#fff",fontSize:8,fontWeight:700,cursor:"pointer",padding:"2px 6px"}}>{"✓ All"}</button><button onClick={()=>declineCMs(...deptMarkers)} style={{background:"#ef5350",border:"none",borderRadius:4,color:"#fff",fontSize:8,fontWeight:700,cursor:"pointer",padding:"2px 6px"}}>{"✕ All"}</button></>}<CSEditField value={dept.name} onChange={v=>csU(`departments.${di}.name`,v)} bold style={{fontSize:9,fontWeight:800,letterSpacing:CS_LS,color:"#fff"}}/></div><button onClick={()=>rmDept(di)} style={{background:"none",border:"none",color:"#777",cursor:"pointer",fontSize:12,padding:"0 3px",lineHeight:1}} onMouseEnter={e=>(e.target.style.color="#ff6b6b")} onMouseLeave={e=>(e.target.style.color="#777")}>×</button></div></td></tr>
                {dept.crew.map((cr,ci) => { const crm = "cs:crew:"+dept.name.toUpperCase()+":"+(cr.role||"").toUpperCase(); const crHas = hasCM(crm); return (<tr key={ci} draggable onDragStart={e=>{e.dataTransfer.setData("text/plain","crew:"+di+":"+ci);e.currentTarget.style.opacity=0.4;}} onDragEnd={e=>{e.currentTarget.style.opacity=1;}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const d=e.dataTransfer.getData("text/plain");if(d.startsWith("crew:"+di+":")){const from=+d.split(":")[2];if(from!==ci)csSet(dd=>{const dept2={...dd.departments[di],crew:[...dd.departments[di].crew]};const[m]=dept2.crew.splice(from,1);dept2.crew.splice(ci,0,m);const depts=[...dd.departments];depts[di]=dept2;return{...dd,departments:depts};});}}} style={{background:crHas?"#E3F2FD":"#fff",borderBottom:"1px solid #f5f5f5",cursor:"grab"}}><td style={{padding:"3px 2px",fontSize:10,color:"#ddd",width:crHas?36:16}}>{crHas?<span style={{display:"inline-flex",gap:1}}><button onClick={()=>acceptCM(crm)} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM(crm)} style={cRevBtn("decline")}>{"✕"}</button></span>:"\u2630"}</td><td style={{padding:"3px 4px",fontSize:9,color:"#666"}}><CSEditField value={cr.role} onChange={v=>{csU(`departments.${di}.crew.${ci}.role`,v);confirmFC("crew:"+di+":"+ci);}} alwaysYellow={!isFC("crew:"+di+":"+ci)} style={{fontSize:9,color:"#666"}} placeholder="Role"/></td><td style={{padding:"3px 4px",fontSize:10,fontWeight:600}}><CSEditField value={cr.name} onChange={v=>{csU(`departments.${di}.crew.${ci}.name`,v);confirmFC("crew:"+di+":"+ci);}} alwaysYellow={!isFC("crew:"+di+":"+ci)} style={{fontSize:10}} placeholder=""/></td><td style={{padding:"3px 4px",fontSize:10}}><CSEditField value={cr.mobile} onChange={v=>{csU(`departments.${di}.crew.${ci}.mobile`,v);confirmFC("crew:"+di+":"+ci);}} alwaysYellow={!isFC("crew:"+di+":"+ci)} style={{fontSize:10}} placeholder=""/></td><td style={{padding:"3px 4px",fontSize:10,overflow:"hidden",textOverflow:"ellipsis"}}><CSEditField value={cr.email} onChange={v=>{csU(`departments.${di}.crew.${ci}.email`,v);confirmFC("crew:"+di+":"+ci);}} alwaysYellow={!isFC("crew:"+di+":"+ci)} style={{fontSize:10,color:"#1565C0"}} placeholder=""/></td><td style={{padding:"3px 8px 3px 4px",fontSize:10,fontWeight:600,textAlign:"right",whiteSpace:"nowrap"}}><CSEditField value={cr.callTime} onChange={v=>{csU(`departments.${di}.crew.${ci}.callTime`,v);confirmFC("crew:"+di+":"+ci);}} alwaysYellow={!isFC("crew:"+di+":"+ci)} style={{fontSize:10,fontWeight:600,textAlign:"right"}} placeholder=""/></td><td style={{width:14,padding:0}}><button onClick={()=>rmCrew(di,ci)} style={{background:"none",border:"none",color:"transparent",cursor:"pointer",fontSize:10,padding:"0 2px",lineHeight:1}} onMouseEnter={e=>(e.target.style.color="#d32f2f")} onMouseLeave={e=>(e.target.style.color="transparent")}>×</button></td></tr>);})}
                <tr style={{background:"#fff"}}><td colSpan={7} style={{padding:"2px 4px"}}><CSAddBtn onClick={()=>addCrew(di)} label="Add Crew"/></td></tr></Fragment>);})}</tbody>
              </table>
              <CSAddBtn onClick={addDept} label="Add Department"/>
            </div>
            {/* MAP */}
            <div style={{padding:"14px 32px 10px 48px"}}><div style={csSecTitle}>MAP</div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,fontSize:10,fontFamily:CS_FONT,position:"relative",...(hasCM("cs:scalar:mapLink")?cHL:{})}}>
                <span style={{fontSize:14}}>🔗</span>
                <span style={{flex:1}}><CSEditField value={csData.mapLink||""} onChange={v=>{csU("mapLink",v);confirmFC("mapLink");}} alwaysYellow={!isFC("mapLink")} style={{fontSize:10,color:"#1565C0",flex:1}} placeholder="Paste Google Maps link..."/></span>
                {csData.mapLink&&<a href={csData.mapLink} target="_blank" rel="noreferrer" style={{fontSize:9,color:"#1565C0",textDecoration:"none",whiteSpace:"nowrap"}}>Open ↗</a>}
                {hasCM("cs:scalar:mapLink")&&<span style={{position:"absolute",left:-28,top:"50%",transform:"translateY(-50%)",display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:scalar:mapLink")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:scalar:mapLink")} style={cRevBtn("decline")}>{"✕"}</button></span>}
              </div>
              {csData.mapLink&&!csData.mapImage&&<button onClick={()=>{const link=csData.mapLink;let q="";try{const u=new URL(link);q=u.pathname.replace("/maps/search/","").replace("/maps/place/","").split("/@")[0];if(!q)q=u.searchParams.get("q")||"";}catch{}if(!q)q=link.replace(/https?:\/\/[^/]+\//,"");q=decodeURIComponent(q).replace(/\+/g," ");const coords=link.match(/@(-?[\d.]+),(-?[\d.]+)/);let mapApiUrl;if(coords){mapApiUrl=`/api/map-image?lat=${coords[1]}&lon=${coords[2]}`;}else{mapApiUrl=`/api/map-image?q=${encodeURIComponent(q)}`;}fetch(mapApiUrl).then(r=>{if(!r.ok)throw new Error("Map service error");return r.blob();}).then(blob=>{const reader=new FileReader();reader.onload=e=>csU("mapImage",e.target.result);reader.readAsDataURL(blob);}).catch(()=>showAlert("Could not fetch map image. Try uploading a screenshot manually."));}} style={{background:"#1565C0",color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:8,display:"flex",alignItems:"center",gap:4}} onMouseEnter={e=>e.currentTarget.style.background="#0D47A1"} onMouseLeave={e=>e.currentTarget.style.background="#1565C0"}>Fetch Map Screenshot</button>}
              <CSResizableImage label="Map Image (JPEG)" image={csData.mapImage} onUpload={v=>csU("mapImage",v)} onRemove={()=>csU("mapImage",null)} defaultHeight={280}/>
              {(csData.extraMapImages||[]).map((img,i)=><div key={i} style={{marginTop:8}}><CSResizableImage label={"Extra Image "+(i+1)} image={img} onUpload={v=>csSet(d=>({...d,extraMapImages:(d.extraMapImages||[]).map((x,j)=>j===i?v:x)}))} onRemove={()=>csSet(d=>({...d,extraMapImages:(d.extraMapImages||[]).filter((_,j)=>j!==i)}))} defaultHeight={200}/></div>)}
              <button onClick={()=>csSet(d=>({...d,extraMapImages:[...(d.extraMapImages||[]),null]}))} style={{background:"none",border:"1px dashed #ddd",borderRadius:4,padding:"6px 14px",fontSize:10,color:"#999",cursor:"pointer",fontFamily:"inherit",marginTop:8,width:"100%"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#999";e.currentTarget.style.color="#666";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#ddd";e.currentTarget.style.color="#999";}}>+ Add Another Image</button>
              </div>
            {/* WEATHER */}
            <div style={{padding:"10px 32px 14px 48px"}}><div style={csSecTitle}>WEATHER</div>
              <div style={{marginBottom:6,fontSize:9,fontFamily:CS_FONT,fontStyle:"italic",letterSpacing:CS_LS,display:"flex",alignItems:"center",gap:4,position:"relative",...(hasCM("cs:scalar:weatherSummary")?cHL:{})}}>{hasCM("cs:scalar:weatherSummary")&&<span style={{position:"absolute",left:-28,top:0,display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:scalar:weatherSummary")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:scalar:weatherSummary")} style={cRevBtn("decline")}>{"✕"}</button></span>}<CSEditField value={csData.weatherSummary||""} onChange={v=>{csU("weatherSummary",v);confirmFC("weatherSummary");}} alwaysYellow={!isFC("weatherSummary")} style={{fontSize:9,fontStyle:"italic",letterSpacing:CS_LS,flex:1}} placeholder="e.g. Sunny, Clear Skies"/></div>
              <div style={{display:"flex",alignItems:"center",marginBottom:4,fontSize:10,fontFamily:CS_FONT,gap:8,position:"relative",...((hasCM("cs:scalar:weatherHighC")||hasCM("cs:scalar:weatherLowC"))?cHL:{})}}>{ (hasCM("cs:scalar:weatherHighC")||hasCM("cs:scalar:weatherLowC"))&&<span style={{position:"absolute",left:-28,top:0,display:"flex",gap:1}}><button onClick={()=>acceptCMs("cs:scalar:weatherHighC","cs:scalar:weatherHighF","cs:scalar:weatherLowC","cs:scalar:weatherLowF")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCMs("cs:scalar:weatherHighC","cs:scalar:weatherHighF","cs:scalar:weatherLowC","cs:scalar:weatherLowF")} style={cRevBtn("decline")}>{"✕"}</button></span>}<span style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#888"}}>HIGH: </span><CSEditField value={csData.weatherHighC||""} onChange={v=>{csU("weatherHighC",v);confirmFC("weatherHL");}} alwaysYellow={!isFC("weatherHL")} style={{fontSize:10,minWidth:20}} placeholder="—"/>°C / <CSEditField value={csData.weatherHighF||""} onChange={v=>{csU("weatherHighF",v);confirmFC("weatherHL");}} alwaysYellow={!isFC("weatherHL")} style={{fontSize:10,minWidth:20}} placeholder="—"/>°F<span style={{margin:"0 6px",color:"#ddd"}}>|</span><span style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#888"}}>LOW: </span><CSEditField value={csData.weatherLowC||""} onChange={v=>{csU("weatherLowC",v);confirmFC("weatherHL");}} alwaysYellow={!isFC("weatherHL")} style={{fontSize:10,minWidth:20}} placeholder="—"/>°C / <CSEditField value={csData.weatherLowF||""} onChange={v=>{csU("weatherLowF",v);confirmFC("weatherHL");}} alwaysYellow={!isFC("weatherHL")} style={{fontSize:10,minWidth:20}} placeholder="—"/>°F</div>
              <div style={{display:"flex",alignItems:"center",marginBottom:8,fontSize:10,fontFamily:CS_FONT,gap:8,position:"relative",...((hasCM("cs:scalar:weatherRealFeelHighC")||hasCM("cs:scalar:weatherRealFeelLowC"))?cHL:{})}}>{ (hasCM("cs:scalar:weatherRealFeelHighC")||hasCM("cs:scalar:weatherRealFeelLowC"))&&<span style={{position:"absolute",left:-28,top:0,display:"flex",gap:1}}><button onClick={()=>acceptCMs("cs:scalar:weatherRealFeelHighC","cs:scalar:weatherRealFeelHighF","cs:scalar:weatherRealFeelLowC","cs:scalar:weatherRealFeelLowF")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCMs("cs:scalar:weatherRealFeelHighC","cs:scalar:weatherRealFeelHighF","cs:scalar:weatherRealFeelLowC","cs:scalar:weatherRealFeelLowF")} style={cRevBtn("decline")}>{"✕"}</button></span>}<span style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#888"}}>REAL FEEL HIGH: </span><CSEditField value={csData.weatherRealFeelHighC||""} onChange={v=>{csU("weatherRealFeelHighC",v);confirmFC("weatherRFHL");}} alwaysYellow={!isFC("weatherRFHL")} style={{fontSize:10,minWidth:20}} placeholder="—"/>°C / <CSEditField value={csData.weatherRealFeelHighF||""} onChange={v=>{csU("weatherRealFeelHighF",v);confirmFC("weatherRFHL");}} alwaysYellow={!isFC("weatherRFHL")} style={{fontSize:10,minWidth:20}} placeholder="—"/>°F<span style={{margin:"0 6px",color:"#ddd"}}>|</span><span style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#888"}}>REAL FEEL LOW: </span><CSEditField value={csData.weatherRealFeelLowC||""} onChange={v=>{csU("weatherRealFeelLowC",v);confirmFC("weatherRFHL");}} alwaysYellow={!isFC("weatherRFHL")} style={{fontSize:10,minWidth:20}} placeholder="—"/>°C / <CSEditField value={csData.weatherRealFeelLowF||""} onChange={v=>{csU("weatherRealFeelLowF",v);confirmFC("weatherRFHL");}} alwaysYellow={!isFC("weatherRFHL")} style={{fontSize:10,minWidth:20}} placeholder="—"/>°F</div>
              {(csData.weatherHourly||[]).length>0?<div style={{marginBottom:10,...(hasCM("cs:weatherHourly")?cHL:{})}}>
                <div style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#888",marginBottom:4,display:"flex",alignItems:"center",position:"relative"}}>{hasCM("cs:weatherHourly")&&<span style={{position:"absolute",left:-28,top:0,display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:weatherHourly")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:weatherHourly")} style={cRevBtn("decline")}>{"✕"}</button></span>}HOURLY FORECAST</div>
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
                <div style={{display:"flex",alignItems:"center",gap:2,position:"relative",...(hasCM("cs:scalar:weatherSunrise")?cHL:{})}}>{hasCM("cs:scalar:weatherSunrise")&&<span style={{position:"absolute",left:-28,top:0,display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:scalar:weatherSunrise")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:scalar:weatherSunrise")} style={cRevBtn("decline")}>{"✕"}</button></span>}<span style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#888"}}>SUNRISE: </span><CSEditField value={csData.weatherSunrise||""} onChange={v=>{csU("weatherSunrise",v);confirmFC("weatherSunrise");}} alwaysYellow={!isFC("weatherSunrise")} style={{fontSize:10}} placeholder="00:00"/></div>
                <div style={{display:"flex",alignItems:"center",gap:2,justifyContent:"center",position:"relative",...(hasCM("cs:scalar:weatherSunset")?cHL:{})}}>{hasCM("cs:scalar:weatherSunset")&&<span style={{position:"absolute",left:-28,top:0,display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:scalar:weatherSunset")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:scalar:weatherSunset")} style={cRevBtn("decline")}>{"✕"}</button></span>}<span style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#888"}}>SUNSET: </span><CSEditField value={csData.weatherSunset||""} onChange={v=>{csU("weatherSunset",v);confirmFC("weatherSunset");}} alwaysYellow={!isFC("weatherSunset")} style={{fontSize:10}} placeholder="00:00"/></div>
                <div style={{display:"flex",alignItems:"center",gap:2,justifyContent:"flex-end",position:"relative",...(hasCM("cs:scalar:weatherBlueHour")?cHL:{})}}>{hasCM("cs:scalar:weatherBlueHour")&&<span style={{position:"absolute",left:-28,top:0,display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:scalar:weatherBlueHour")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:scalar:weatherBlueHour")} style={cRevBtn("decline")}>{"✕"}</button></span>}<span style={{fontWeight:700,letterSpacing:CS_LS,fontSize:9,color:"#888"}}>BLUE HOUR: </span><CSEditField value={csData.weatherBlueHour||""} onChange={v=>{csU("weatherBlueHour",v);confirmFC("weatherBlueHour");}} alwaysYellow={!isFC("weatherBlueHour")} style={{fontSize:10}} placeholder="00:00"/></div>
              </div>
              </div>
            {/* INVOICING */}
            <div style={{padding:"14px 32px 14px 48px"}}><div style={csSecTitle}>INVOICING</div><div style={{fontSize:11,marginBottom:8}}>Please note that payment terms are <strong><CSEditField value={csData.invoicing.terms} onChange={v=>{csU("invoicing.terms",v);confirmFC("invoicing.terms");}} bold alwaysYellow={!isFC("invoicing.terms")} style={{fontSize:11}}/></strong> from the date of invoice.</div><div style={{fontSize:11}}><div style={{fontWeight:700,marginBottom:2}}>FOR DUBAI CREW:</div><div>PLEASE SEND INVOICES TO: <CSEditField value={csData.invoicing.email} onChange={v=>{csU("invoicing.email",v);confirmFC("invoicing.email");}} alwaysYellow={!isFC("invoicing.email")} style={{fontSize:11,color:"#1565C0"}}/></div><div style={{fontWeight:700,marginTop:6}}>BILLING ADDRESS:</div><CSEditTextarea value={csData.invoicing.address} onChange={v=>csU("invoicing.address",v)} style={{fontSize:11,lineHeight:1.6}}/><div style={{marginTop:4}}><strong>TRN:</strong> <CSEditField value={csData.invoicing.trn} onChange={v=>{csU("invoicing.trn",v);confirmFC("invoicing.trn");}} alwaysYellow={!isFC("invoicing.trn")} style={{fontSize:11}}/></div></div></div>
            {/* PROTOCOL */}
            <div style={{padding:"10px 32px 10px 48px"}}><div style={{...csSecTitle,display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"}}>PROTOCOL ON SET{hasCM("cs:scalar:protocol")&&<span style={{position:"absolute",left:-28,top:0,display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:scalar:protocol")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:scalar:protocol")} style={cRevBtn("decline")}>{"✕"}</button></span>}</div><CSEditTextarea value={csData.protocol} onChange={v=>csU("protocol",v)} style={{fontSize:10,color:"#555",lineHeight:1.7}}/></div>
            {/* EMERGENCY */}
            <div style={{padding:"10px 32px 10px 48px"}}><div style={csSecTitle}>NEAREST EMERGENCY SERVICES</div><div style={{marginBottom:8}}><div style={{fontSize:11,fontWeight:700,letterSpacing:0.5,marginBottom:4,position:"relative",background:!isFC("emergencyDialPrefix")?"#FFFDE7":"transparent",borderRadius:2,padding:"2px 6px",...(hasCM("cs:scalar:emergencyDialPrefix")?cHL:{})}}><CSEditField value={csData.emergencyDialPrefix} onChange={v=>{csU("emergencyDialPrefix",v);confirmFC("emergencyDialPrefix");}} bold alwaysYellow={!isFC("emergencyDialPrefix")} style={{fontSize:11,fontWeight:700,letterSpacing:0.5}}/>{hasCM("cs:scalar:emergencyDialPrefix")&&<span style={{position:"absolute",left:-28,top:0,display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:scalar:emergencyDialPrefix")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:scalar:emergencyDialPrefix")} style={cRevBtn("decline")}>{"✕"}</button></span>}</div>{csData.emergencyNumbers.map((en,i) => (<div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,position:"relative",background:!isFC("emergNum:"+i)?"#FFFDE7":"transparent",borderRadius:2,padding:"2px 6px",...(hasCM("cs:emergencyNum:"+i)?cHL:{})}}><span style={{color:"#C62828",fontWeight:800,fontSize:11,minWidth:30}}><CSEditField value={en.number} onChange={v=>{csU(`emergencyNumbers.${i}.number`,v);confirmFC("emergNum:"+i);}} alwaysYellow={!isFC("emergNum:"+i)} style={{color:"#C62828",fontWeight:800,fontSize:11}}/></span><span style={{fontWeight:600,fontSize:9,letterSpacing:0.3,color:"#888"}}>FOR</span><CSEditField value={en.label} onChange={v=>{csU(`emergencyNumbers.${i}.label`,v);confirmFC("emergNum:"+i);}} bold alwaysYellow={!isFC("emergNum:"+i)} style={{fontSize:11,fontWeight:700,letterSpacing:0.3}}/>{hasCM("cs:emergencyNum:"+i)&&<span style={{position:"absolute",left:-28,top:"50%",transform:"translateY(-50%)",display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:emergencyNum:"+i)} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:emergencyNum:"+i)} style={cRevBtn("decline")}>{"✕"}</button></span>}<CSXbtn onClick={()=>rmEmergencyNum(i)} size={10}/></div>))}<CSAddBtn onClick={addEmergencyNum} label="Add"/></div><div style={{fontSize:11,marginBottom:4,background:!isFC("emergency.hospital")?"#FFFDE7":"transparent",padding:"3px 6px",borderRadius:2,display:"flex",alignItems:"center",position:"relative",...(hasCM("cs:emergency.hospital")?cHL:{})}}><strong>NEAREST HOSPITAL: </strong><CSEditField value={csData.emergency.hospital} onChange={v=>{csU("emergency.hospital",v);confirmFC("emergency.hospital");}} alwaysYellow={!isFC("emergency.hospital")} style={{fontSize:11}}/>{hasCM("cs:emergency.hospital")&&<span style={{position:"absolute",left:-28,top:"50%",transform:"translateY(-50%)",display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:emergency.hospital")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:emergency.hospital")} style={cRevBtn("decline")}>{"✕"}</button></span>}</div><div style={{fontSize:11,background:!isFC("emergency.police")?"#FFFDE7":"transparent",padding:"3px 6px",borderRadius:2,display:"flex",alignItems:"center",position:"relative",...(hasCM("cs:emergency.police")?cHL:{})}}><strong>NEAREST POLICE STATION: </strong><CSEditField value={csData.emergency.police} onChange={v=>{csU("emergency.police",v);confirmFC("emergency.police");}} alwaysYellow={!isFC("emergency.police")} style={{fontSize:11}}/>{hasCM("cs:emergency.police")&&<span style={{position:"absolute",left:-28,top:"50%",transform:"translateY(-50%)",display:"flex",gap:1}}><button onClick={()=>acceptCM("cs:emergency.police")} style={cRevBtn("accept")}>{"✓"}</button><button onClick={()=>declineCM("cs:emergency.police")} style={cRevBtn("decline")}>{"✕"}</button></span>}</div></div>
            {/* FOOTER */}
            <div style={{borderTop:"2px solid #000",margin:"16px 32px 0",padding:"14px 0 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:10,fontWeight:700,letterSpacing:CS_LS,color:"#000"}}>@ONNAPRODUCTION</div><div style={{fontSize:9,color:"#888",letterSpacing:CS_LS}}>DUBAI | LONDON</div></div><div style={{textAlign:"right"}}><div style={{fontSize:10,fontWeight:600,color:"#000",letterSpacing:CS_LS}}>WWW.ONNA.WORLD</div><div style={{fontSize:9,color:"#888",letterSpacing:CS_LS}}>HELLO@ONNAPRODUCTION.COM</div></div></div>
          </div>
        </div>
      </div>
    );
  }

  // ── RONNIE (Risk Assessment) ──
  if (agentId === "researcher" && riskAssessmentStore && setRiskAssessmentStore) {
    const raVersions = riskAssessmentStore[projectId] || [];
    if (!raVersions.length) return null;
    const raIdx = Math.min(activeRAVersion||0, raVersions.length - 1);
    const raData = raVersions[raIdx] || raVersions[0];
    const {update:raU, set:raSet} = makeDocUpdater(projectId, raIdx, setRiskAssessmentStore, RISK_ASSESSMENT_INIT, "Risk Assessment");
    const raSectionHdr = (title) => (<div style={{background:"#000",color:"#fff",fontFamily:RA_FONT,fontSize:10,fontWeight:700,letterSpacing:RA_LS_HDR,textAlign:"center",padding:"4px 0",textTransform:"uppercase",marginTop:24,marginBottom:0}}>{title}</div>);

    // Inline review state
    const pr = ronniePendingReview && ronniePendingReview.projectId===projectId && ronniePendingReview.vIdx===raIdx ? ronniePendingReview : null;
    const prMarkers = pr ? new Set(pr.markers) : null;
    const hasMarker = (m) => prMarkers && prMarkers.has(m);
    const finishReview = () => { if(setRonniePendingReview) setRonniePendingReview(null); if(onRonnieReviewDone&&pr) onRonnieReviewDone({projectId:pr.projectId,vIdx:pr.vIdx}); };
    const acceptMarker = (m) => { if(!setRonniePendingReview||!pr) return; const next = pr.markers.filter(x=>x!==m); if(next.length===0){ finishReview(); } else { setRonniePendingReview({...pr, markers:next}); } };
    const declineMarker = (m) => { if(!setRonniePendingReview||!pr) return; revertMarker(m, pr.preSnapshot, pr.projectId, pr.vIdx, setRiskAssessmentStore); const next = pr.markers.filter(x=>x!==m); if(next.length===0){ finishReview(); } else { setRonniePendingReview({...pr, markers:next}); } };
    const acceptAll = () => { finishReview(); };
    const declineAll = () => { if(!pr) return; pr.markers.forEach(m => revertMarker(m, pr.preSnapshot, pr.projectId, pr.vIdx, setRiskAssessmentStore)); finishReview(); };
    const reviewBtnStyle = (type) => ({width:18,height:18,borderRadius:4,border:"none",background:type==="accept"?"#4caf50":"#ef5350",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:3,lineHeight:1});
    const hlStyle = {background:"#e8f5e9",borderLeft:"3px solid #4caf50",marginLeft:-3,paddingLeft:3,borderRadius:2,transition:"background 0.2s"};

    return (
      <div style={{overflowY:"auto",padding:0,background:"#fff",height:"100%"}}>
        <div style={{padding:"8px 12px 4px",fontSize:10,fontWeight:600,color:"#888",letterSpacing:1,textTransform:"uppercase",borderBottom:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:4,...(hasMarker("scalar:label")?{background:"#e8f5e9",borderRadius:3,padding:"1px 4px"}:{})}}>Risk Assessment — <input value={raData.label||""} onChange={e=>raU("label",e.target.value)} placeholder="Untitled" style={{border:"none",borderBottom:"1px solid transparent",background:"transparent",fontSize:10,fontWeight:600,color:"#555",letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",padding:"0 2px",width:Math.max(80,(raData.label||"Untitled").length*7+10),outline:"none",transition:"border-color 0.2s"}} onFocus={e=>{e.target.style.borderBottomColor="#1a4a80";}} onBlur={e=>{e.target.style.borderBottomColor="transparent";}}/>{hasMarker("scalar:label")&&<><button onClick={()=>acceptMarker("scalar:label")} style={reviewBtnStyle("accept")}>{"✓"}</button><button onClick={()=>declineMarker("scalar:label")} style={reviewBtnStyle("decline")}>{"✕"}</button></>}</span>
          {pr&&pr.markers.length>0&&(
            <div style={{display:"flex",gap:4}}>
              <button onClick={acceptAll} style={{fontSize:9,fontWeight:600,color:"#2e7d32",background:"#e8f5e9",border:"none",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}>Accept All</button>
              <button onClick={declineAll} style={{fontSize:9,fontWeight:600,color:"#c62828",background:"#fce4ec",border:"none",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}>Decline All</button>
            </div>
          )}
        </div>
        <div style={{padding:"40px 40px",fontFamily:RA_FONT,color:"#1a1a1a",lineHeight:1.5,maxWidth:880,margin:"0 auto"}}>
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
            {[{l:"SHOOT NAME:",k:"shootName"},{l:"SHOOT DATE:",k:"shootDate"},{l:"LOCATIONS:",k:"locations"},{l:"CREW ON SET:",k:"crewOnSet"},{l:"TIMING:",k:"timing"}].map(({l,k})=>{
              const marked = hasMarker("scalar:"+k);
              return(<div key={k} style={{display:"flex",gap:6,marginBottom:2,alignItems:"center",...(marked?hlStyle:{})}}>
                <span style={{fontFamily:RA_FONT,fontSize:10,fontWeight:700,letterSpacing:RA_LS_HDR,minWidth:100}}>{l}</span>
                <CSEditField value={raData[k]||""} onChange={v=>raU(k,v)} isPlaceholder={!raData[k]} placeholder={`Enter ${l.toLowerCase().replace(":","")}` } style={{fontSize:10,letterSpacing:RA_LS}}/>
                {marked&&<button onClick={()=>acceptMarker("scalar:"+k)} style={reviewBtnStyle("accept")} title="Accept">{"✓"}</button>}
                {marked&&<button onClick={()=>declineMarker("scalar:"+k)} style={reviewBtnStyle("decline")} title="Revert">{"✕"}</button>}
              </div>); })}
          </div>
          {(raData.sections||[]).map((sec,si) => {
            const secUp = sec.title.toUpperCase();
            const isNewSection = hasMarker("newSection:"+secUp);
            return(<div key={sec.id||si} style={isNewSection?{...hlStyle,borderLeft:"3px solid #4caf50",paddingLeft:6,marginBottom:4}:{}}>
            <div style={{background:"#000",color:"#fff",fontFamily:RA_FONT,fontSize:10,fontWeight:700,letterSpacing:RA_LS_HDR,textAlign:"center",padding:"4px 8px",textTransform:"uppercase",marginTop:24,marginBottom:0,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
              <span style={{marginRight:4}}>{si+1}.</span>
              <CSEditField value={sec.title} onChange={v=>{raSet(d=>{d.sections[si].title=v;return d;});}} placeholder="Section Title" style={{fontSize:10,color:"#fff",letterSpacing:RA_LS_HDR}} bold/>
              {isNewSection&&<button onClick={()=>acceptMarker("newSection:"+secUp)} style={{...reviewBtnStyle("accept"),marginLeft:8}} title="Accept section">{"✓"}</button>}
              {isNewSection&&<button onClick={()=>declineMarker("newSection:"+secUp)} style={{...reviewBtnStyle("decline"),marginLeft:2}} title="Remove section">{"✕"}</button>}
              {!isNewSection&&<div onClick={()=>{if(pushUndo)pushUndo("delete section");raSet(d=>({...d,sections:d.sections.filter((_,j)=>j!==si)}));}} style={{position:"absolute",right:8,cursor:"pointer",fontSize:13,color:"#666",opacity:0.6}} onMouseEnter={e=>(e.target.style.opacity=1)} onMouseLeave={e=>(e.target.style.opacity=0.6)}>×</div>}
            </div>
            <div style={{display:"flex",background:RA_GREY,borderBottom:"1px solid #ddd",padding:"5px 0"}}>{(sec.cols||["Hazard","Risk Level","Who is at Risk","Mitigation Strategy"]).map((c,ci)=>(<div key={ci} style={{flex:ci===0?3:ci===3?5:1.2,fontFamily:RA_FONT,fontSize:9,fontWeight:700,letterSpacing:RA_LS_HDR,padding:"0 6px",color:"#000"}}>{c}</div>))}<div style={{width:24}}/></div>
            {(sec.rows||[]).map((row,ri) => {
              const rowMarked = hasMarker("row:"+secUp+":"+ri);
              return(<div key={ri} style={{display:"flex",borderBottom:"1px solid #eee",padding:"4px 0",alignItems:"flex-start",...(rowMarked?{background:"#e8f5e9"}:{})}} onMouseEnter={e=>{const rm=e.currentTarget.querySelector(".ra-rm");if(rm)rm.style.opacity=1;}} onMouseLeave={e=>{const rm=e.currentTarget.querySelector(".ra-rm");if(rm)rm.style.opacity=0;}}>
                {row.map((cell,ci) => (<div key={ci} style={{flex:ci===0?3:ci===3?5:1.2,padding:"0 6px"}}><CSEditField value={cell} onChange={v=>{raSet(d=>{d.sections[si].rows[ri][ci]=v;return d;});}} isPlaceholder={!cell} placeholder={(sec.cols||["Hazard","Risk Level","Who is at Risk","Mitigation"])[ci]} style={{fontSize:10,letterSpacing:RA_LS}} bold={ci===0}/></div>))}
                {rowMarked?(<div style={{display:"flex",gap:2,flexShrink:0,paddingRight:4}}>
                  <button onClick={()=>acceptMarker("row:"+secUp+":"+ri)} style={reviewBtnStyle("accept")} title="Accept">{"✓"}</button>
                  <button onClick={()=>declineMarker("row:"+secUp+":"+ri)} style={reviewBtnStyle("decline")} title="Revert">{"✕"}</button>
                </div>):(<div className="ra-rm" onClick={()=>{if(pushUndo)pushUndo("delete row");raSet(d=>({...d,sections:d.sections.map((s,j)=>j===si?{...s,rows:s.rows.filter((_,k)=>k!==ri)}:s)}));}} style={{width:24,cursor:"pointer",textAlign:"center",fontSize:12,color:"#bbb",opacity:0,transition:"opacity .15s"}}>×</div>)}
              </div>); })}
            <div onClick={()=>raSet(d=>({...d,sections:d.sections.map((s,j)=>j===si?{...s,rows:[...s.rows,(s.cols||["","","",""]).map(()=>"")]}:s)}))} style={{fontFamily:RA_FONT,fontSize:9,color:"#999",cursor:"pointer",padding:"4px 6px",letterSpacing:RA_LS,marginTop:2}}>+ Add Row</div>
          </div>); })}
          <div onClick={()=>raSet(d=>({...d,sections:[...d.sections,{id:Date.now(),title:"NEW SECTION",cols:["Hazard","Risk Level","Who is at Risk","Mitigation Strategy"],rows:[["","","",""]]}]}))} style={{fontFamily:RA_FONT,fontSize:9,color:"#999",cursor:"pointer",letterSpacing:RA_LS,textAlign:"center",marginTop:12,padding:6}}>+ Add Risk Section</div>
          {raSectionHdr("PROFESSIONAL CODE OF CONDUCT")}
          {(()=>{const marked=hasMarker("scalar:conductIntro"); return <div style={{padding:"8px 12px",...(marked?hlStyle:{})}}><CSEditTextarea value={raData.conductIntro||""} onChange={v=>raU("conductIntro",v)} style={{fontSize:10,letterSpacing:RA_LS,marginBottom:8}}/>{marked&&<span><button onClick={()=>acceptMarker("scalar:conductIntro")} style={reviewBtnStyle("accept")}>{"✓"}</button><button onClick={()=>declineMarker("scalar:conductIntro")} style={reviewBtnStyle("decline")}>{"✕"}</button></span>}</div>;})()}
          <div style={{padding:"8px 12px"}}>{(raData.conductItems||[]).map((item,i)=>{const itemMarked=hasMarker("arrayItem:conductItems:"+i); return (<div key={i} style={{display:"flex",alignItems:"baseline",marginBottom:4,gap:4,...(itemMarked?{...hlStyle,borderRadius:4,padding:"2px 4px"}:{})}} onMouseEnter={e=>{const rm=e.currentTarget.querySelector(".ra-rm");if(rm)rm.style.opacity=1;}} onMouseLeave={e=>{const rm=e.currentTarget.querySelector(".ra-rm");if(rm)rm.style.opacity=0;}}><span style={{fontFamily:RA_FONT,fontSize:10}}>•</span><div style={{flex:1}}><CSEditField value={item.label} onChange={v=>raSet(d=>{d.conductItems[i].label=v;return d;})} bold isPlaceholder={!item.label} placeholder="Label:" style={{fontSize:10,letterSpacing:RA_LS}}/>{" "}<CSEditField value={item.text} onChange={v=>raSet(d=>{d.conductItems[i].text=v;return d;})} isPlaceholder={!item.text} placeholder="Description" style={{fontSize:10,letterSpacing:RA_LS}}/></div>{itemMarked?<span style={{display:"flex",gap:1,flexShrink:0}}><button onClick={()=>acceptMarker("arrayItem:conductItems:"+i)} style={reviewBtnStyle("accept")}>{"✓"}</button><button onClick={()=>declineMarker("arrayItem:conductItems:"+i)} style={reviewBtnStyle("decline")}>{"✕"}</button></span>:<div className="ra-rm" onClick={()=>{if(pushUndo)pushUndo("delete conduct item");raSet(d=>({...d,conductItems:d.conductItems.filter((_,j)=>j!==i)}));}} style={{cursor:"pointer",fontSize:12,color:"#bbb",opacity:0,transition:"opacity .15s"}}>×</div>}</div>);})}<div onClick={()=>raSet(d=>({...d,conductItems:[...d.conductItems,{label:"",text:""}]}))} style={{fontFamily:RA_FONT,fontSize:9,color:"#999",cursor:"pointer",letterSpacing:RA_LS}}>+ Add Item</div></div>
          {raSectionHdr("LIABILITY WAIVER & ACKNOWLEDGMENT")}
          {(()=>{const marked=hasMarker("scalar:waiverIntro"); return <div style={{padding:"8px 12px",...(marked?hlStyle:{})}}><CSEditTextarea value={raData.waiverIntro||""} onChange={v=>raU("waiverIntro",v)} style={{fontSize:10,letterSpacing:RA_LS,marginBottom:8}}/>{marked&&<span><button onClick={()=>acceptMarker("scalar:waiverIntro")} style={reviewBtnStyle("accept")}>{"✓"}</button><button onClick={()=>declineMarker("scalar:waiverIntro")} style={reviewBtnStyle("decline")}>{"✕"}</button></span>}</div>;})()}
          <div style={{padding:"8px 12px"}}>{(raData.waiverItems||[]).map((item,i)=>{const itemMarked=hasMarker("arrayItem:waiverItems:"+i); return (<div key={i} style={{display:"flex",alignItems:"baseline",marginBottom:4,gap:4,...(itemMarked?{...hlStyle,borderRadius:4,padding:"2px 4px"}:{})}} onMouseEnter={e=>{const rm=e.currentTarget.querySelector(".ra-rm");if(rm)rm.style.opacity=1;}} onMouseLeave={e=>{const rm=e.currentTarget.querySelector(".ra-rm");if(rm)rm.style.opacity=0;}}><span style={{fontFamily:RA_FONT,fontSize:10,fontWeight:700,minWidth:14}}>{i+1}.</span><div style={{flex:1}}><CSEditField value={item.label} onChange={v=>raSet(d=>{d.waiverItems[i].label=v;return d;})} bold isPlaceholder={!item.label} placeholder="Label:" style={{fontSize:10,letterSpacing:RA_LS}}/>{" "}<CSEditField value={item.text} onChange={v=>raSet(d=>{d.waiverItems[i].text=v;return d;})} isPlaceholder={!item.text} placeholder="Description" style={{fontSize:10,letterSpacing:RA_LS}}/></div>{itemMarked?<span style={{display:"flex",gap:1,flexShrink:0}}><button onClick={()=>acceptMarker("arrayItem:waiverItems:"+i)} style={reviewBtnStyle("accept")}>{"✓"}</button><button onClick={()=>declineMarker("arrayItem:waiverItems:"+i)} style={reviewBtnStyle("decline")}>{"✕"}</button></span>:<div className="ra-rm" onClick={()=>{if(pushUndo)pushUndo("delete waiver item");raSet(d=>({...d,waiverItems:d.waiverItems.filter((_,j)=>j!==i)}));}} style={{cursor:"pointer",fontSize:12,color:"#bbb",opacity:0,transition:"opacity .15s"}}>×</div>}</div>);})}<div onClick={()=>raSet(d=>({...d,waiverItems:[...d.waiverItems,{label:"",text:""}]}))} style={{fontFamily:RA_FONT,fontSize:9,color:"#999",cursor:"pointer",letterSpacing:RA_LS}}>+ Add Item</div></div>
          {raSectionHdr("EMERGENCY RESPONSE PLAN")}
          <div style={{padding:"8px 12px"}}>{(raData.emergencyItems||[]).map((item,i)=>{const itemMarked=hasMarker("arrayItem:emergencyItems:"+i); return (<div key={i} style={{display:"flex",alignItems:"baseline",marginBottom:4,gap:4,...(itemMarked?{...hlStyle,borderRadius:4,padding:"2px 4px"}:{})}} onMouseEnter={e=>{const rm=e.currentTarget.querySelector(".ra-rm");if(rm)rm.style.opacity=1;}} onMouseLeave={e=>{const rm=e.currentTarget.querySelector(".ra-rm");if(rm)rm.style.opacity=0;}}><span style={{fontFamily:RA_FONT,fontSize:10}}>•</span><div style={{flex:1}}><CSEditField value={item.label} onChange={v=>raSet(d=>{d.emergencyItems[i].label=v;return d;})} bold isPlaceholder={!item.label} placeholder="Label:" style={{fontSize:10,letterSpacing:RA_LS}}/>{" "}<CSEditField value={item.text} onChange={v=>raSet(d=>{d.emergencyItems[i].text=v;return d;})} isPlaceholder={!item.text||/to be confirmed/i.test(item.text)} placeholder="Details" style={{fontSize:10,letterSpacing:RA_LS}}/></div>{itemMarked?<span style={{display:"flex",gap:1,flexShrink:0}}><button onClick={()=>acceptMarker("arrayItem:emergencyItems:"+i)} style={reviewBtnStyle("accept")}>{"✓"}</button><button onClick={()=>declineMarker("arrayItem:emergencyItems:"+i)} style={reviewBtnStyle("decline")}>{"✕"}</button></span>:<div className="ra-rm" onClick={()=>{if(pushUndo)pushUndo("delete emergency item");raSet(d=>({...d,emergencyItems:d.emergencyItems.filter((_,j)=>j!==i)}));}} style={{cursor:"pointer",fontSize:12,color:"#bbb",opacity:0,transition:"opacity .15s"}}>×</div>}</div>);})}<div onClick={()=>raSet(d=>({...d,emergencyItems:[...d.emergencyItems,{label:"",text:""}]}))} style={{fontFamily:RA_FONT,fontSize:9,color:"#999",cursor:"pointer",letterSpacing:RA_LS}}>+ Add Item</div></div>
          <div style={{marginTop:60,display:"flex",justifyContent:"space-between",fontFamily:RA_FONT,fontSize:9,letterSpacing:RA_LS_HDR,color:"#000"}}><div><div style={{fontWeight:700}}>@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div><div style={{textAlign:"right"}}><div style={{fontWeight:700}}>WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div></div>
        </div>
      </div>
    );
  }

  // ── CODY (Contracts) ──
  if (agentId === "contracts" && contractDocStore && setContractDocStore) {
    const ctVersions = contractDocStore[projectId] || [];
    if (ctVersions.length === 0) return <div style={{padding:40,textAlign:"center",color:"#888",fontSize:13}}>No contracts yet. Create one from Documents → Contracts.</div>;
    const ctIdx = Math.min(activeContractVersion||0, ctVersions.length - 1);
    const ctData = ctVersions[ctIdx] || ctVersions[0];
    const {update:ctU, set:ctSet} = makeDocUpdater(projectId, ctIdx, setContractDocStore, CONTRACT_INIT, "Contract");
    const activeContractType = ctData.contractType || "commission_se";
    const ctContract = CONTRACT_DOC_TYPES.find(c=>c.id===activeContractType) || CONTRACT_DOC_TYPES[0];
    const ctGetVal = (key) => (ctData.fieldValues||{})[key] || ctContract.fields.find(f=>f.key===key)?.defaultValue || "";
    const ctSetVal = (key, val) => ctSet(d=>({...d,fieldValues:{...(d.fieldValues||{}), [key]:val}}));
    const ctConfirmField = (key, val) => ctSet(d=>({...d, fieldConfirmed:{...(d.fieldConfirmed||{}), [key]: val}}));
    const ctGeneralTerms = (ctData.generalTermsEdits||{}).custom || GENERAL_TERMS_DOC[activeContractType] || "";
    const ctSetGeneralTerms = (val) => ctSet(d=>({...d,generalTermsEdits:{custom:val}}));

    return (
      <div style={{overflowY:"auto",padding:0,background:"#fff",height:"100%"}}>
        <div style={{padding:"8px 12px 4px",fontSize:10,fontWeight:600,color:"#888",letterSpacing:1,textTransform:"uppercase",borderBottom:"1px solid #eee"}}>Contract — {ctData.label||`Contract ${ctIdx+1}`} ({ctContract.short})</div>
        <div style={{padding:"40px 40px",fontFamily:CT_FONT,color:"#1a1a1a",lineHeight:1.5,maxWidth:880,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}><CSLogoSlot label="Production Logo" image={ctData.prodLogo} onUpload={v=>ctU("prodLogo",v)} onRemove={()=>ctU("prodLogo",null)}/></div>
          <div style={{borderBottom:"2.5px solid #000",marginBottom:16}}/>
          <div style={{textAlign:"center",fontFamily:CT_FONT,fontSize:12,fontWeight:700,letterSpacing:CT_LS_HDR,textTransform:"uppercase",marginBottom:24}}>{ctContract.title}</div>
          {ctContract.headTermsLabel && (<><div style={{background:"#f4f4f4",padding:"6px 12px",borderBottom:"1px solid #ddd"}}><span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:700,letterSpacing:CT_LS_HDR}}>{ctContract.headTermsLabel}</span></div>{ctContract.fields.map((field) => {const confirmed=(ctData.fieldConfirmed||{})[field.key];return(<div key={field.key} style={{display:"flex",borderBottom:"1px solid #eee",minHeight:32}}><div style={{width:220,minWidth:220,padding:"8px 12px",background:"#fafafa",borderRight:"1px solid #eee"}}><span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS}}>{field.label}</span></div><div style={{flex:1,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}><div style={{flex:1}}><CSEditField value={ctGetVal(field.key)} onChange={v=>ctSetVal(field.key,v)} isPlaceholder={!confirmed} placeholder={field.label} style={{fontSize:10,letterSpacing:CT_LS}}/></div><div onClick={()=>ctConfirmField(field.key,!confirmed)} style={{cursor:"pointer",width:16,height:16,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{confirmed?<svg width="14" height="14" viewBox="0 0 14 14"><rect x="0.5" y="0.5" width="13" height="13" rx="2" fill="#000" stroke="#000"/><path d="M3.5 7L6 9.5L10.5 4.5" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>:<svg width="14" height="14" viewBox="0 0 14 14"><rect x="0.5" y="0.5" width="13" height="13" rx="2" fill="none" stroke="#ccc" strokeWidth="1"/></svg>}</div></div></div>)})}</>)}
          {ctContract.sigLeft && (<><div style={{background:"#000",color:"#fff",fontFamily:CT_FONT,fontSize:10,fontWeight:700,letterSpacing:CT_LS_HDR,textAlign:"center",padding:"4px 0",textTransform:"uppercase",marginTop:32}}>SIGNATURE</div><div style={{display:"flex",borderBottom:"1px solid #eee",marginTop:0}}>{[{side:"left",label:ctContract.sigLeft},{side:"right",label:ctContract.sigRight}].map(({side,label})=>(<div key={side} style={{flex:1,padding:"12px",borderRight:side==="left"?"1px solid #eee":"none"}}><div style={{fontFamily:CT_FONT,fontSize:9,fontWeight:700,letterSpacing:CT_LS,marginBottom:12}}>{label}</div><div style={{marginBottom:8}}><span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,display:"block",marginBottom:4}}>Signature:</span><SignaturePad value={(ctData.signatures||{})[side]||""} onChange={v=>ctSet(d=>({...d,signatures:{...(d.signatures||{}), [side]:v}}))} height={60}/></div>{["name","date"].map(f=>(<div key={f} style={{display:"flex",gap:8,marginBottom:8,alignItems:"baseline"}}><span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,minWidth:80}}>{f==="name"?"Print Name:":"Date:"}</span><div style={{flex:1,borderBottom:"1px solid #ccc",minHeight:20}}><CSEditField value={(ctData.sigNames||{})[`${side}_${f}`]||""} onChange={v=>ctSet(d=>({...d,sigNames:{...(d.sigNames||{}), [`${side}_${f}`]:v}}))} placeholder={f==="name"?"Print name...":"Date..."} style={{fontSize:10}}/></div></div>))}</div>))}</div></>)}
          <div style={{marginTop:32}}><div style={{background:"#000",color:"#fff",fontFamily:CT_FONT,fontSize:10,fontWeight:700,letterSpacing:CT_LS_HDR,textAlign:"center",padding:"4px 0",textTransform:"uppercase"}}>GENERAL TERMS</div><textarea value={ctGeneralTerms} onChange={e=>ctSetGeneralTerms(e.target.value)} style={{width:"100%",boxSizing:"border-box",fontFamily:CT_FONT,fontSize:10,letterSpacing:CT_LS,lineHeight:1.6,color:"#1a1a1a",border:"1px solid #eee",borderTop:"none",padding:"12px",minHeight:600,resize:"vertical",outline:"none",background:"#fff",whiteSpace:"pre-wrap"}} onFocus={e=>{e.target.style.borderColor="#E0D9A8";e.target.style.background="#FFFDE7";}} onBlur={e=>{e.target.style.borderColor="#eee";e.target.style.background="#fff";}}/></div>
          <div style={{marginTop:60,display:"flex",justifyContent:"space-between",fontFamily:CT_FONT,fontSize:9,letterSpacing:CT_LS_HDR,color:"#000",borderTop:"2px solid #000",paddingTop:12}}><div><div style={{fontWeight:700}}>@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div><div style={{textAlign:"right"}}><div style={{fontWeight:700}}>WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div></div>
        </div>
      </div>
    );
  }

  // ── BILLIE (Estimate) ──
  if (agentId === "billie" && projectEstimates && setProjectEstimates) {
    const estVersions = projectEstimates[projectId] || [];
    if (!estVersions.length) return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#999",fontSize:13,fontFamily:"inherit",padding:24,textAlign:"center"}}>
        No estimate yet — pick a project or type <b>new</b> in the chat to create one.
      </div>
    );
    const estIdx = Math.min(activeEstimateVersion||0, estVersions.length - 1);
    const estData = estVersions[estIdx] || estVersions[0];
    const {set:estSet} = makeDocUpdater(projectId, estIdx, setProjectEstimates, JSON.parse(JSON.stringify(ESTIMATE_INIT)), "V1");

    const bpr = billiePendingReview && billiePendingReview.projectId===projectId && billiePendingReview.vIdx===estIdx ? billiePendingReview : null;
    const finishBReview = () => { if(setBilliePendingReview) setBilliePendingReview(null); if(onBillieReviewDone) onBillieReviewDone(); };
    const acceptBM = (m) => { if(!setBilliePendingReview||!bpr) return; const next = bpr.markers.filter(x=>x!==m); if(next.length===0){ finishBReview(); } else { setBilliePendingReview({...bpr, markers:next}); } };
    const declineBM = (m) => { if(!setBilliePendingReview||!bpr) return; revertBillieMarker(m, bpr.preSnapshot, bpr.projectId, bpr.vIdx, setProjectEstimates); const next = bpr.markers.filter(x=>x!==m); if(next.length===0){ finishBReview(); } else { setBilliePendingReview({...bpr, markers:next}); } };
    const acceptAllB = () => { if(!bpr) return; finishBReview(); };
    const declineAllB = () => { if(!bpr) return; revertBillieMarkers(bpr.markers, bpr.preSnapshot, bpr.projectId, bpr.vIdx, setProjectEstimates); finishBReview(); };

    return (
      <div style={{overflowY:"auto",overflowX:"auto",padding:0,background:"#fff",height:"100%"}}>
        <div style={{padding:"8px 12px 4px",fontSize:10,fontWeight:600,color:"#888",letterSpacing:1,textTransform:"uppercase",borderBottom:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{display:"flex",alignItems:"center",gap:6}}>Estimate — <input value={estData.ts?.version||""} onChange={e=>{const v=e.target.value;estSet(d=>({...d,ts:{...(d.ts||ESTIMATE_INIT.ts),version:v}}));}} placeholder={`V${estIdx+1}`} style={{padding:"2px 6px",borderRadius:5,border:"1px solid #e0e0e0",fontSize:10,fontWeight:600,fontFamily:"inherit",color:"#555",width:180,letterSpacing:1,textTransform:"uppercase",background:"transparent"}} onFocus={e=>{e.target.style.borderColor="#7ab87a";e.target.style.background="#f3fff3";}} onBlur={e=>{e.target.style.borderColor="#e0e0e0";e.target.style.background="transparent";}}/></span>
          {bpr&&bpr.markers.length>0&&(<div style={{display:"flex",gap:4}}><button onClick={acceptAllB} style={{fontSize:9,fontWeight:600,color:"#2e7d32",background:"#e8f5e9",border:"none",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}>Accept All</button><button onClick={declineAllB} style={{fontSize:9,fontWeight:600,color:"#c62828",background:"#fce4ec",border:"none",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}>Decline All</button></div>)}
        </div>
        <EstimateView estData={estData} onSet={estSet} pendingReview={bpr} onAcceptMarker={acceptBM} onDeclineMarker={declineBM} />
      </div>
    );
  }

  return null;
}


