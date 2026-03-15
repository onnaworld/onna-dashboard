import React, { useState, useEffect, useRef, useCallback, useMemo, Fragment } from "react";
import { createPortal } from "react-dom";
import { api, docApi, buildPath, getXContacts, setXContacts,
  findVendorOrLead, findAllSimilar, parseQuickEntry, detectFieldKey, fuzzyMatchProject,
  printCallSheetPDF, printRiskAssessmentPDF, downloadCSV, exportCastingPDF,
  loadPdfPages, loadDocxPages, processDocSignStamp, renderHtmlToDocPages, exportDocPreview,
  PRINT_CLEANUP_CSS, defaultSections,
  estSectionTotal, estRowTotal, estCalcTotals, estNum, estFmt,
  actualsSectionExpenseTotal, actualsSectionZohoTotal, actualsRowExpenseTotal,
  actualsGrandExpenseTotal, actualsGrandZohoTotal } from "../../utils/helpers";
import { CALLSHEET_INIT, DIETARY_INIT, DIETARY_TAGS, ESTIMATE_INIT } from "../ui/DocHelpers";
import { RISK_ASSESSMENT_INIT } from "../../data/riskAssessmentInit";
import { CONTRACT_INIT, migrateContract, CONTRACT_TYPE_IDS, CONTRACT_TYPE_LABELS,
  CONTRACT_FIELDS, CONTRACT_DOC_TYPES, GENERAL_TERMS_DOC,
  buildCodySystem, applyCodyPatch, handleCodyIntent } from "./ContractCody";
import { useUI } from "../../context/UIContext";
import { useProject } from "../../context/ProjectContext";
import { useAgentStore } from "../../context/AgentContext";
import VendorVinnieCard, { useVinnieCard, handleVinnieIntent } from "./VendorVinnie";
import { buildConnieSystem, applyConniePatch, buildConniePatchMarkers, ConnieTabBar, handleConnieIntent } from "./CallSheetConnie";
import { buildBillieSystem, applyBilliePatch, buildBilliePatchMarkers, handleBillieIntent } from "./BudgetBillie";
import { buildFinnSystem, applyFinnPatch } from "./FinanceFinn";
import { buildCarrieSystem, applyCarriePatch, handleCarrieIntent } from "./CastingCarrie";
import { buildRonnieSystem, applyRonniePatch, buildPatchMarkers, RonnieTabBar, handleRonnieIntent } from "./RiskAssessmentRonnie";
import { handleTinaIntent } from "./TravelTina";
import { handleTabbyIntent } from "./TalentTabby";
import { handlePollyIntent } from "./ProducerPolly";
import { handleLillieIntent } from "./LocationLillie";
import { handlePerryIntent } from "./PostProducerPerry";
import { DocPreviewDraggable } from "../ui/DocPreview";
import AgentDocPreview from "./AgentDocPreview";

// ─── _AgentDots — loading indicator ────────────────────────────────────────
function _AgentDots({ color = "#6e6e73" }) {
  return <div style={{display:"flex",gap:4,padding:"10px 14px"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:color,opacity:0.5,animation:`agentDotBounce 1.2s ${i*0.15}s infinite ease-in-out`}}/>)}<style>{`@keyframes agentDotBounce{0%,80%,100%{transform:scale(0.7)}40%{transform:scale(1.1)}}`}</style></div>;
}

// ─── _AgentBubble — chat message bubble ───────────────────────────────────
function _AgentBubble({msg,codyDocConfigRef,setMsgs,codySignPanel,setCodySignPanel}){
  const isAgent=msg.role==="assistant";
  const handleDragReprocess=useCallback(async(newCfg)=>{
    if(!codyDocConfigRef)return;
    codyDocConfigRef.current=newCfg;
    const result=await processDocSignStamp(newCfg.originalDoc,newCfg);
    setMsgs(prev=>prev.map(m=>m===msg?{...m,_docPreview:result,_docConfig:newCfg}:m));
    if(setCodySignPanel)setCodySignPanel({config:newCfg,preview:result});
  },[msg,codyDocConfigRef,setMsgs,setCodySignPanel]);
  return<div style={{display:"flex",justifyContent:isAgent?"flex-start":"flex-end",marginBottom:10}}>
    <div style={{maxWidth:"82%",padding:"10px 14px",borderRadius:isAgent?"6px 16px 16px 16px":"16px 6px 16px 16px",background:isAgent?"#f5f5f7":"#1d1d1f",color:isAgent?"#1d1d1f":"#fff",fontSize:13.5,lineHeight:1.6,border:isAgent?"1px solid #e5e5ea":"none",whiteSpace:"pre-wrap",fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",userSelect:"text",WebkitUserSelect:"text",cursor:"text"}}>
      {msg._attachments&&msg._attachments.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:msg.content?6:0}}>{msg._attachments.map((att,ai)=><img key={ai} src={att.dataUrl} alt={att.name||"attachment"} style={{maxWidth:160,maxHeight:120,borderRadius:6,objectFit:"cover",border:"1px solid rgba(255,255,255,0.2)"}}/>)}</div>}
      {msg._docPreview&&msg._docConfig&&codyDocConfigRef?(codySignPanel?<div style={{cursor:"pointer",borderRadius:8,overflow:"hidden",border:"1px solid #e0e0e0",marginBottom:msg.content?8:0,background:"#fafafa",maxWidth:120}} onClick={()=>setCodySignPanel&&setCodySignPanel({config:msg._docConfig,preview:msg._docPreview})}>
        <img src={msg._docPreview.pages[0]} alt="preview" style={{width:"100%",height:"auto",display:"block",borderBottom:"1px solid #eee"}}/>
        <div style={{padding:"4px 6px",fontSize:9,fontWeight:600,color:"#0066cc",textAlign:"center"}}>Viewing in panel</div>
      </div>:<DocPreviewDraggable config={msg._docConfig} onReprocess={handleDragReprocess} onExport={(pi)=>exportDocPreview(msg._docPreview,msg._docConfig&&msg._docConfig.originalDoc,pi)}/>):msg._docPreview&&<div onClick={()=>exportDocPreview(msg._docPreview,msg._docConfig&&msg._docConfig.originalDoc)} style={{cursor:"pointer",borderRadius:8,overflow:"hidden",border:"1px solid #e0e0e0",marginBottom:msg.content?8:0,background:"#fafafa",maxWidth:220}}>
        <img src={msg._docPreview.pages[0]} alt="preview" style={{width:"100%",height:"auto",display:"block",borderBottom:"1px solid #eee"}}/>
        <div style={{padding:"8px 10px",fontSize:11,fontWeight:600,color:"#333"}}>{msg._docPreview.name||"Document"}</div>
        <div style={{padding:"0 10px 8px",fontSize:10,color:"#888",display:"flex",justifyContent:"space-between"}}><span>{msg._docPreview.pages.length} page{msg._docPreview.pages.length>1?"s":""}</span><span style={{color:"#0066cc"}}>Click to export PDF</span></div>
      </div>}
      {typeof msg.content === "string" ? msg.content.replace(/\*\*/g, "") : msg.content}
    </div>
  </div>;
}

// Chrome extension detection (Logan)
let _loganExtId = null;
if (typeof window !== "undefined") {
  window.addEventListener("message", e => {
    if (e.source === window && e.data?.type === "LOGAN_EXT_READY" && e.data.id) _loganExtId = e.data.id;
  });
  window.postMessage({ type: "LOGAN_REQUEST_ID" }, window.location.origin);
}

export default function AgentCard({agent,active,onSelect,onClose,allVendors,allLeads,onUpdateVendor,onUpdateLead,onNewLead,onNewOutreach,gcalToken,gcalEvents,callSheetStore,setCallSheetStore,selectedProject,localProjects,vendors:vendorsProp,activeCSVersion,dietaryStore,setDietaryStore,riskAssessmentStore,setRiskAssessmentStore,activeRAVersion,setActiveRAVersion,contractDocStore,setContractDocStore,activeContractVersion,setActiveContractVersion,projectEstimates,setProjectEstimates,activeEstimateVersion,setActiveEstimateVersion,projectActuals,setProjectActuals,projectCasting,setProjectCasting,getProjectCastingTables,onNavigateToDoc,onFullWidthChange,isMobile,pushUndo,projectInfoRef,onOpenDuplicateCS,onOpenDuplicateRA,onArchiveCallSheet,travelItineraryStore,setTravelItineraryStore,castingDeckStore,setCastingDeckStore,fittingStore,setFittingStore,castingTableStore,setCastingTableStore,cpsStore,setCpsStore,shotListStore,setShotListStore,storyboardStore,setStoryboardStore,locDeckStore,setLocDeckStore,recceReportStore,setRecceReportStore,postProdStore,setPostProdStore,syncProjectInfoToDocs,projectFileStore,onCreateProject}){
  const {Blob,name,title,emoji,system,placeholder,intro}=agent;
  const _needsProj={compliance:true,researcher:true,billie:true,carrie:true,finn:true,tina:true,tabby:true,polly:true,lillie:true,perry:true};
  const _buildIntro=()=>{
    if(!_needsProj[agent.id]||!/which project/i.test(intro))return intro;
    const activeProjs=(localProjects||[]).filter(pr=>pr.status!=="Completed"&&pr.name&&!/^TEMPLATE/i.test(pr.name));
    if(activeProjs.length===0)return intro;
    return intro+"\n\n"+activeProjs.map((pr,i)=>`${i+1}. **${pr.client||""}** — ${pr.name}`).join("\n");
  };
  const _introWithProjects=_buildIntro();
  const [msgs,setMsgs]         =useState(()=>{try{const s=localStorage.getItem('onna_agent_chat_'+agent.id);if(s){const p=JSON.parse(s);if(p[0]&&p[0].role==="assistant")p[0]={role:"assistant",content:_introWithProjects};return p;}return[{role:"assistant",content:_introWithProjects}];}catch{return[{role:"assistant",content:_introWithProjects}];}});
  const [input,_setInput]       =useState("");
  const _inputRef=useRef("");
  const _taRef=useRef(null);
  const setInput=(v)=>{_inputRef.current=v;_setInput(v);if(_taRef.current)_taRef.current.value=v;};
  const [loading,setLoading]   =useState(false);
  const [mood,setMood]         =useState("idle");
  const [bob,setBob]           =useState(0);
  const [pendingConv,_setPendingConv]=useState(null);
  const _pendingConvRef=useRef(null);
  const setPendingConv=(v)=>{_pendingConvRef.current=v;_setPendingConv(v);};
  const [pendingLead,setPending]   =useState(null);
  const [pendingType,setPendingType]=useState("lead");
  const [pendingId,setPendingId]   =useState(null);
  const [saveAsOutreach,setSaveAsOutreach]=useState(false);
  const [leadEdit,setLeadEdit]     =useState({});
  const [savingLead,setSaving]     =useState(false);
  const [pendingDuplicate,_setPendingDuplicate]=useState(null);
  const _pendingDupRef=useRef(null);
  const setPendingDuplicate=(v)=>{_pendingDupRef.current=v;_setPendingDuplicate(v);};
  const [attachments,setAttachments]=useState([]);
  const [isDragging,setIsDragging]=useState(false);
  const _dragAgents=useMemo(()=>new Set(["billie","compliance","researcher","contracts"]),[]);
  const _handleDroppedFiles=useCallback(async(files)=>{
    for(const f of files){
      const isPdf=f.type==="application/pdf"||f.name.toLowerCase().endsWith(".pdf");
      const isDocx=f.name.toLowerCase().endsWith(".docx")||f.name.toLowerCase().endsWith(".doc")||f.type==="application/vnd.openxmlformats-officedocument.wordprocessingml.document"||f.type==="application/msword";
      if(agent.id==="contracts"){
        // Contracts agent: route docs through Cody's upload flow
        const isImg=f.type.startsWith("image/");
        try{
          if(isPdf){const reader=new FileReader();reader.onload=async ev=>{try{const pages=await loadPdfPages(ev.target.result);codyDocConfigRef.current=null;setCodyUploadedDoc({name:f.name,type:"application/pdf",pages});setMsgs(prev=>[...prev,{role:"user",content:`📄 Uploaded: ${f.name} (${pages.length} page${pages.length>1?"s":""})`},{role:"assistant",content:`Got it! I've loaded "${f.name}" (${pages.length} page${pages.length>1?"s":""}). What would you like me to do?\n\n• "Sign this" — add signature (last page by default)\n• "Stamp all pages" — add stamp to every page\n• "Sign and stamp on company letterhead"\n• "Sign page 3" — apply to a specific page`}]);}catch(err){setMsgs(prev=>[...prev,{role:"assistant",content:`Failed to load PDF: ${err.message}`}]);}};reader.readAsDataURL(f);
          }else if(isDocx){setMsgs(prev=>[...prev,{role:"user",content:`📄 Uploaded: ${f.name}`},{role:"assistant",content:`Loading Word document...`}]);const arrayBuffer=await f.arrayBuffer();const pages=await loadDocxPages(arrayBuffer);codyDocConfigRef.current=null;setCodyUploadedDoc({name:f.name,type:"application/docx",pages});setMsgs(prev=>{const m=[...prev];m.pop();return[...m,{role:"assistant",content:`Got it! I've loaded "${f.name}" (${pages.length} page${pages.length>1?"s":""}). What would you like me to do?\n\n• "Sign this"\n• "Stamp all pages"\n• "Sign and stamp on company letterhead"`}];});
          }else if(isImg){const reader=new FileReader();reader.onload=ev=>{codyDocConfigRef.current=null;setCodyUploadedDoc({name:f.name,type:f.type,pages:[ev.target.result]});setMsgs(prev=>[...prev,{role:"user",content:`📄 Uploaded: ${f.name}`},{role:"assistant",content:`Got "${f.name}"! What would you like me to do — sign, stamp, or put on letterhead?`}]);};reader.readAsDataURL(f);
          }
        }catch(err){setMsgs(prev=>[...prev,{role:"assistant",content:`Failed to load document: ${err.message}`}]);}
      }else{
        // Billie, compliance, researcher: images + PDFs → attachments
        const reader=new FileReader();const dataUrl=await new Promise((res,rej)=>{reader.onload=ev=>res(ev.target.result);reader.onerror=rej;reader.readAsDataURL(f);});
        if(isPdf&&(agent.id==="billie")){try{const pages=await loadPdfPages(dataUrl);const capped=pages.slice(0,10);if(pages.length>10)setMsgs(prev=>[...prev,{role:"assistant",content:`PDF has ${pages.length} pages — using first 10 for analysis.`}]);capped.forEach((pg,i)=>{setAttachments(prev=>[...prev,{name:`${f.name}_p${i+1}`,type:"image/jpeg",dataUrl:pg}]);});}catch(err){setMsgs(prev=>[...prev,{role:"assistant",content:`Failed to load PDF: ${err.message}`}]);}}
        else{setAttachments(prev=>[...prev,{name:f.name,type:f.type,dataUrl}]);}
      }
    }
  },[agent.id]);
  const [connieCtx,setConnieCtx]=useState(()=>{try{const s=localStorage.getItem('onna_connie_ctx');const p=s?JSON.parse(s):null;if(p&&p._mode){localStorage.removeItem('onna_connie_ctx');return null;}return p;}catch{return null;}}); // {projectId, vIdx} — confirmed project+day for Connie
  const [connieDietMode,setConnieDietMode]=useState(null); // projectId string when dietary side panel is active
  const [csCreateMenuConnie,setCsCreateMenuConnie]=useState(false); // local dropdown for Connie "+" button
  const csCreateBtnRef=useRef(null);
  const [conniePending,setConniePending]=useState(null); // {projectId, step:"pick_name"|"pick_existing_or_new"}
  const [connieDietPending,setConnieDietPending]=useState(null); // {type:"confirm_add_cs", name, dietary, vendorMatch:{name,email,phone}|null, projectId}
  const [connieTabs,setConnieTabs]=useState(()=>{try{const s=localStorage.getItem('onna_connie_tabs');return s?JSON.parse(s):[];}catch{return [];}});
  const addConnieTab=(projectId,vIdx,label)=>setConnieTabs(prev=>{if(prev.some(t=>t.projectId===projectId&&t.vIdx===vIdx))return prev;return[...prev,{projectId,vIdx,label}];});
  const [ronnieCtx,setRonnieCtx]=useState(()=>{try{const s=localStorage.getItem('onna_ronnie_ctx');const p=s?JSON.parse(s):null;if(p&&p._step){localStorage.removeItem('onna_ronnie_ctx');return null;}return p;}catch{return null;}}); // {projectId, vIdx}
  const [ronniePendingReview,setRonniePendingReview]=useState(null); // {preSnapshot, markers[], projectId, vIdx}
  const [conniePendingReview,setConniePendingReview]=useState(null); // {preSnapshot, markers[], projectId, vIdx}
  const [billiePendingReview,setBilliePendingReview]=useState(null); // {preSnapshot, markers[], projectId, vIdx}
  const [ronnieTabs,setRonnieTabs]=useState(()=>{try{const s=localStorage.getItem('onna_ronnie_tabs');return s?JSON.parse(s):[];}catch{return [];}});
  const addRonnieTab=(projectId,vIdx,label)=>setRonnieTabs(prev=>{if(prev.some(t=>t.projectId===projectId&&t.vIdx===vIdx))return prev;return[...prev,{projectId,vIdx,label}];});
  const [raCreateMenuRonnie,setRaCreateMenuRonnie]=useState(false);
  const raCreateBtnRef=useRef(null);
  const [codyCtx,setCodyCtx]=useState(()=>{try{const s=localStorage.getItem('onna_cody_ctx');return s?JSON.parse(s):null;}catch{return null;}}); // {projectId, vIdx}
  const codyPendingRef=useRef(null); // null | {projectId, step:"pick_existing_or_new"} | {projectId, step:"pick_type"} | {projectId, step:"pick_name", typeId}
  const [billieCtx,setBillieCtx]=useState(()=>{try{const s=localStorage.getItem('onna_billie_ctx');const p=s?JSON.parse(s):null;if(p&&(p.pendingCreate||p.pendingVersion)){localStorage.removeItem('onna_billie_ctx');return null;}return p;}catch{return null;}}); // {projectId, vIdx}
  const [billieTabs,setBillieTabs]=useState(()=>{try{const s=localStorage.getItem('onna_billie_tabs');return s?JSON.parse(s):[];}catch{return [];}});
  const addBillieTab=(projectId,vIdx,label)=>setBillieTabs(prev=>{if(prev.some(t=>t.projectId===projectId&&t.vIdx===vIdx))return prev;return[...prev,{projectId,vIdx,label}];});
  const [finnCtx,setFinnCtx]=useState(null); // unused — merged into Billie
  const [carrieCtx,setCarrieCtx]=useState(()=>{try{const s=localStorage.getItem('onna_carrie_ctx');return s?JSON.parse(s):null;}catch{return null;}}); // {projectId}
  const [tinaCtx,setTinaCtx]=useState(()=>{try{const s=localStorage.getItem('onna_tina_ctx');return s?JSON.parse(s):null;}catch{return null;}}); // {projectId}
  const [tabbyCtx,setTabbyCtx]=useState(()=>{try{const s=localStorage.getItem('onna_tabby_ctx');return s?JSON.parse(s):null;}catch{return null;}}); // {projectId}
  const [pollyCtx,setPollyCtx]=useState(()=>{try{const s=localStorage.getItem('onna_polly_ctx');return s?JSON.parse(s):null;}catch{return null;}}); // {projectId}
  const [lillieCtx,setLillieCtx]=useState(()=>{try{const s=localStorage.getItem('onna_lillie_ctx');return s?JSON.parse(s):null;}catch{return null;}}); // {projectId}
  const [perryCtx,setPerryCtx]=useState(()=>{try{const s=localStorage.getItem('onna_perry_ctx');return s?JSON.parse(s):null;}catch{return null;}}); // {projectId}
  const [pendingProjectCreate,setPendingProjectCreate]=useState(null); // {step:"client"|"name", client?:string}
  const lastSearchRef=useRef(null); // stores last Outlook search result for "update vendor X"
  const attachRef=useRef(null);
  const billieAttachRef=useRef(null);
  const [codyUploadedDoc,setCodyUploadedDoc]=useState(null); // {name, type, pages:[dataUrl,...]}
  const [codySignPanel,setCodySignPanel]=useState(null); // {config, preview} — split-panel sign/stamp viewer
  const codyDocRef=useRef(null); // file input ref for Cody doc uploads
  const codyDocConfigRef=useRef(null); // {originalDoc, wantSign, wantStamp, wantLetterhead, signPages, stampPages, letterPages, signOffset, stampOffset, signOffsetX, stampOffsetX, signScale, stampScale}
  const [codyPickerPid,setCodyPickerPid]=useState(null); // projectId when contract picker is shown
  const [codyTabs,setCodyTabs]=useState(()=>{try{const s=localStorage.getItem('onna_cody_tabs');return s?JSON.parse(s):[];}catch{return [];}});
  const addCodyTab=(projectId,vIdx,label)=>setCodyTabs(prev=>{if(prev.some(t=>t.projectId===projectId&&t.vIdx===vIdx))return prev;return[...prev,{projectId,vIdx,label}];});
  const [ctCreateMenuCody,setCtCreateMenuCody]=useState(false);
  const ctCreateBtnRefCody=useRef(null);
  const agentUndoStack=useRef([]); // unified undo stack for all agent doc changes (up to 50)
  const agentUndoThrottle=useRef(0);
  const pushAgentUndo=useCallback(()=>{const now=Date.now();if(now-agentUndoThrottle.current<300)return;agentUndoThrottle.current=now;const snap={};if(contractDocStore)snap.contractDocStore=JSON.parse(JSON.stringify(contractDocStore));if(callSheetStore)snap.callSheetStore=JSON.parse(JSON.stringify(callSheetStore));if(riskAssessmentStore)snap.riskAssessmentStore=JSON.parse(JSON.stringify(riskAssessmentStore));if(projectEstimates)snap.projectEstimates=JSON.parse(JSON.stringify(projectEstimates));agentUndoStack.current.push(snap);if(agentUndoStack.current.length>50)agentUndoStack.current.shift();},[contractDocStore,callSheetStore,riskAssessmentStore,projectEstimates]);
  const popAgentUndo=useCallback(()=>{if(agentUndoStack.current.length===0)return false;const snap=agentUndoStack.current.pop();if(snap.contractDocStore&&setContractDocStore)setContractDocStore(snap.contractDocStore);if(snap.callSheetStore&&setCallSheetStore)setCallSheetStore(snap.callSheetStore);if(snap.riskAssessmentStore&&setRiskAssessmentStore)setRiskAssessmentStore(snap.riskAssessmentStore);if(snap.projectEstimates&&setProjectEstimates)setProjectEstimates(snap.projectEstimates);return true;},[setContractDocStore,setCallSheetStore,setRiskAssessmentStore,setProjectEstimates]);
  const pushCodyUndo=pushAgentUndo;const popCodyUndo=popAgentUndo;
  const codySetContractDocStore=useCallback((updater)=>{pushAgentUndo();if(setContractDocStore)setContractDocStore(updater);},[pushAgentUndo,setContractDocStore]);
  const undoSetCallSheetStore=useCallback((updater)=>{pushAgentUndo();if(setCallSheetStore)setCallSheetStore(updater);},[pushAgentUndo,setCallSheetStore]);
  const undoSetRiskAssessmentStore=useCallback((updater)=>{pushAgentUndo();if(setRiskAssessmentStore)setRiskAssessmentStore(updater);},[pushAgentUndo,setRiskAssessmentStore]);
  const undoSetProjectEstimates=useCallback((updater)=>{pushAgentUndo();if(setProjectEstimates)setProjectEstimates(updater);},[pushAgentUndo,setProjectEstimates]);

  // ── Split-pane: detect if agent has active project context ──
  const hasDocCtx = (agent.id==="compliance" && (!!connieCtx || !!connieDietMode)) || (agent.id==="researcher" && !!ronnieCtx) || (agent.id==="contracts" && !!codyCtx) || (agent.id==="billie" && !!billieCtx) || (agent.id==="carrie" && !!carrieCtx) || (agent.id==="tina" && !!tinaCtx) || (agent.id==="tabby" && !!tabbyCtx) || (agent.id==="polly" && !!pollyCtx) || (agent.id==="lillie" && !!lillieCtx) || (agent.id==="perry" && !!perryCtx);
  const docProjectId = agent.id==="compliance"?(connieDietMode||connieCtx?.projectId) : agent.id==="researcher"?ronnieCtx?.projectId : agent.id==="contracts"?codyCtx?.projectId : agent.id==="billie"?billieCtx?.projectId : agent.id==="carrie"?carrieCtx?.projectId : agent.id==="tina"?tinaCtx?.projectId : agent.id==="tabby"?tabbyCtx?.projectId : agent.id==="polly"?pollyCtx?.projectId : agent.id==="lillie"?lillieCtx?.projectId : agent.id==="perry"?perryCtx?.projectId : null;
  useEffect(()=>{
    if (onFullWidthChange) onFullWidthChange(active && !isMobile);
  },[active, isMobile]);

  const chatRef=useRef(null);
  const rafRef=useRef(null);
  const t0=useRef(null);
  useEffect(()=>{
    const speed=agent.id==="compliance"?1.1:agent.id==="researcher"?1.9:1.5;
    const amp=agent.id==="compliance"?3:5;
    const fn=ts=>{if(!t0.current)t0.current=ts;setBob(Math.sin(((ts-t0.current)/1000)*speed)*amp);rafRef.current=requestAnimationFrame(fn);};
    rafRef.current=requestAnimationFrame(fn);
    return()=>cancelAnimationFrame(rafRef.current);
  },[agent.id]);
  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[msgs,loading]);
  useEffect(()=>{try{localStorage.setItem('onna_agent_chat_'+agent.id,JSON.stringify(msgs));}catch{}},[msgs,agent.id]);
  useEffect(()=>{if(agent.id==="compliance"){try{if(connieCtx)localStorage.setItem('onna_connie_ctx',JSON.stringify(connieCtx));else localStorage.removeItem('onna_connie_ctx');}catch{}}},[connieCtx,agent.id]);
  useEffect(()=>{if(agent.id==="researcher"){try{if(ronnieCtx)localStorage.setItem('onna_ronnie_ctx',JSON.stringify(ronnieCtx));else localStorage.removeItem('onna_ronnie_ctx');}catch{}}},[ronnieCtx,agent.id]);
  // Cmd+Z undo for all doc agents (contracts, compliance, researcher, billie) — works even from textarea
  useEffect(()=>{if(!active)return;const docAgents=["contracts","compliance","researcher","billie"];if(!docAgents.includes(agent.id))return;const handler=e=>{if((e.metaKey||e.ctrlKey)&&e.key==="z"&&!e.shiftKey){if(agentUndoStack.current.length===0)return;e.preventDefault();e.stopPropagation();popAgentUndo();}};window.addEventListener("keydown",handler,true);return()=>window.removeEventListener("keydown",handler,true);},[agent.id,active,popAgentUndo]);
  useEffect(()=>{if(agent.id==="contracts"){try{if(codyCtx)localStorage.setItem('onna_cody_ctx',JSON.stringify(codyCtx));else localStorage.removeItem('onna_cody_ctx');}catch{}}},[codyCtx,agent.id]);
  useEffect(()=>{if(agent.id==="billie"){try{if(billieCtx)localStorage.setItem('onna_billie_ctx',JSON.stringify(billieCtx));else localStorage.removeItem('onna_billie_ctx');}catch{}}},[billieCtx,agent.id]);
  
  useEffect(()=>{if(agent.id==="carrie"){try{if(carrieCtx)localStorage.setItem('onna_carrie_ctx',JSON.stringify(carrieCtx));else localStorage.removeItem('onna_carrie_ctx');}catch{}}},[carrieCtx,agent.id]);
  useEffect(()=>{if(agent.id==="tina"){try{if(tinaCtx)localStorage.setItem('onna_tina_ctx',JSON.stringify(tinaCtx));else localStorage.removeItem('onna_tina_ctx');}catch{}}},[tinaCtx,agent.id]);
  useEffect(()=>{if(agent.id==="tabby"){try{if(tabbyCtx)localStorage.setItem('onna_tabby_ctx',JSON.stringify(tabbyCtx));else localStorage.removeItem('onna_tabby_ctx');}catch{}}},[tabbyCtx,agent.id]);
  useEffect(()=>{if(agent.id==="polly"){try{if(pollyCtx)localStorage.setItem('onna_polly_ctx',JSON.stringify(pollyCtx));else localStorage.removeItem('onna_polly_ctx');}catch{}}},[pollyCtx,agent.id]);
  useEffect(()=>{if(agent.id==="lillie"){try{if(lillieCtx)localStorage.setItem('onna_lillie_ctx',JSON.stringify(lillieCtx));else localStorage.removeItem('onna_lillie_ctx');}catch{}}},[lillieCtx,agent.id]);
  useEffect(()=>{if(agent.id==="perry"){try{if(perryCtx)localStorage.setItem('onna_perry_ctx',JSON.stringify(perryCtx));else localStorage.removeItem('onna_perry_ctx');}catch{}}},[perryCtx,agent.id]);
  useEffect(()=>{if(agent.id==="compliance"){try{localStorage.setItem('onna_connie_tabs',JSON.stringify(connieTabs));}catch{}}},[connieTabs,agent.id]);
  useEffect(()=>{if(agent.id==="researcher"){try{localStorage.setItem('onna_ronnie_tabs',JSON.stringify(ronnieTabs));}catch{}}},[ronnieTabs,agent.id]);
  useEffect(()=>{if(agent.id==="billie"){try{localStorage.setItem('onna_billie_tabs',JSON.stringify(billieTabs));}catch{}}},[billieTabs,agent.id]);
  // Seed tab from existing connieCtx on mount (so returning users see their active tab)
  useEffect(()=>{if(agent.id==="compliance"&&connieCtx&&connieTabs.length===0){const p=localProjects?.find(pr=>pr.id===connieCtx.projectId);if(p){const vs=callSheetStore?.[p.id]||[];const vLabel=(vs[connieCtx.vIdx]?.label)||`Day ${connieCtx.vIdx+1}`;addConnieTab(p.id,connieCtx.vIdx,`${p.name} · ${vLabel}`);}}},[]);// eslint-disable-line react-hooks/exhaustive-deps
  // Remove tabs for archived/deleted projects
  useEffect(()=>{if(agent.id==="compliance"&&connieTabs.length>0&&localProjects){const activeIds=new Set(localProjects.map(p=>p.id));const filtered=connieTabs.filter(t=>activeIds.has(t.projectId));if(filtered.length!==connieTabs.length){setConnieTabs(filtered);if(connieCtx&&!activeIds.has(connieCtx.projectId)){if(filtered.length>0){setConnieCtx({projectId:filtered[0].projectId,vIdx:filtered[0].vIdx});}else{setConnieCtx(null);}}}}},[localProjects,agent.id]);// eslint-disable-line react-hooks/exhaustive-deps

  // Seed tab from existing ronnieCtx on mount
  useEffect(()=>{if(agent.id==="researcher"&&ronnieCtx&&ronnieTabs.length===0){const p=localProjects?.find(pr=>pr.id===ronnieCtx.projectId);if(p){addRonnieTab(p.id,0,p.name);}}},[]);// eslint-disable-line react-hooks/exhaustive-deps
  // Remove ronnie tabs for archived/deleted projects
  useEffect(()=>{if(agent.id==="researcher"&&ronnieTabs.length>0&&localProjects){const activeIds=new Set(localProjects.map(p=>p.id));const filtered=ronnieTabs.filter(t=>activeIds.has(t.projectId));if(filtered.length!==ronnieTabs.length){setRonnieTabs(filtered);if(ronnieCtx&&!activeIds.has(ronnieCtx.projectId)){if(filtered.length>0){setRonnieCtx({projectId:filtered[0].projectId,vIdx:filtered[0].vIdx});}else{setRonnieCtx(null);}}}}},[localProjects,agent.id]);// eslint-disable-line react-hooks/exhaustive-deps
  // Seed tab from existing billieCtx on mount
  useEffect(()=>{if(agent.id==="billie"&&billieCtx&&billieCtx.vIdx!=null&&billieTabs.length===0){const p=localProjects?.find(pr=>pr.id===billieCtx.projectId);if(p){const vs=projectEstimates?.[p.id]||[];const vLabel=(vs[billieCtx.vIdx]?.ts?.version)||`V${(billieCtx.vIdx||0)+1}`;addBillieTab(p.id,billieCtx.vIdx,`${p.name} · ${vLabel}`);}}},[]);// eslint-disable-line react-hooks/exhaustive-deps
  // Remove billie tabs for archived/deleted projects
  useEffect(()=>{if(agent.id==="billie"&&billieTabs.length>0&&localProjects){const activeIds=new Set(localProjects.map(p=>p.id));const filtered=billieTabs.filter(t=>activeIds.has(t.projectId));if(filtered.length!==billieTabs.length){setBillieTabs(filtered);if(billieCtx&&!activeIds.has(billieCtx.projectId)){if(filtered.length>0){setBillieCtx({projectId:filtered[0].projectId,vIdx:filtered[0].vIdx});}else{setBillieCtx(null);}}}}},[localProjects,agent.id]);// eslint-disable-line react-hooks/exhaustive-deps
  // Cody tabs: persist
  useEffect(()=>{if(agent.id==="contracts"){try{localStorage.setItem('onna_cody_tabs',JSON.stringify(codyTabs));}catch{}}},[codyTabs,agent.id]);
  // Seed cody tab from existing codyCtx on mount
  useEffect(()=>{if(agent.id==="contracts"&&codyCtx&&codyCtx.vIdx!=null&&codyTabs.length===0){const p=localProjects?.find(pr=>pr.id===codyCtx.projectId);if(p){const vs=contractDocStore?.[p.id]||[];const v=vs[codyCtx.vIdx];const vLabel=v?.label||CONTRACT_TYPE_LABELS[v?.contractType]||`Version ${(codyCtx.vIdx||0)+1}`;addCodyTab(p.id,codyCtx.vIdx,`${p.name} · ${vLabel}`);}}},[]);// eslint-disable-line react-hooks/exhaustive-deps
  // Remove cody tabs for archived/deleted projects
  useEffect(()=>{if(agent.id==="contracts"&&codyTabs.length>0&&localProjects){const activeIds=new Set(localProjects.map(p=>p.id));const filtered=codyTabs.filter(t=>activeIds.has(t.projectId));if(filtered.length!==codyTabs.length){setCodyTabs(filtered);if(codyCtx&&!activeIds.has(codyCtx.projectId)){if(filtered.length>0){setCodyCtx({projectId:filtered[0].projectId,vIdx:filtered[0].vIdx});}else{setCodyCtx(null);}}}}},[localProjects,agent.id]);// eslint-disable-line react-hooks/exhaustive-deps
  const searchViaExt=(query,source)=>new Promise(resolve=>{
    if(!_loganExtId)return resolve({ok:false,error:"Extension not detected — reload the dashboard after installing the extension, and make sure Outlook or WhatsApp Web is open in another tab."});
    if(!window.chrome?.runtime?.sendMessage)return resolve({ok:false,error:"Not running in Chrome with the extension installed."});
    const timer=setTimeout(()=>resolve({ok:false,error:"Search timed out — the tab may still be loading."}),25000);
    try{window.chrome.runtime.sendMessage(_loganExtId,{type:"FIND_CONTACT",query,source:source||"auto"},res=>{clearTimeout(timer);if(window.chrome.runtime.lastError)resolve({ok:false,error:window.chrome.runtime.lastError.message});else resolve(res||{ok:false,error:"No response"});});}
    catch(e){clearTimeout(timer);resolve({ok:false,error:e.message});}
  });
  // Strip own-domain (onna) data from search results so user's own email/info doesn't leak into contacts
  const _stripOwn=(lead)=>{
    if(!lead)return lead;
    const l={...lead};
    if(l.email&&/onna/i.test(l.email))l.email="";
    if(l.phone&&/onna/i.test(l.phone))l.phone="";
    if(l._allEmails)l._allEmails=l._allEmails.filter(e=>!/onna/i.test(e));
    if(l._domains)l._domains=l._domains.filter(d=>!/onna/i.test(d));
    return l;
  };

  const _LEAD_CATS_BASE=["Production Companies","Creative Agencies","Beauty & Fragrance","Jewellery & Watches","Fashion","Editorial","Sports","Hospitality","Market Research","Commercial"];
  const _VENDOR_CATS_BASE=["Locations","Hair and Makeup","Stylists","Casting","Catering","Set Design","Equipment","Crew","Production"];
  const _LOCS_BASE=["Dubai, UAE","London, UK","New York, US","Los Angeles, US"];
  const _SOURCES=["Direct","Referral","LinkedIn","Website","Cold Outreach","Event","Other"];
  // ── Format helpers — clean up user input ──
  const _titleCase=(s)=>s.replace(/\b\w/g,c=>c.toUpperCase());
  const _formatPhone=(s)=>{
    let p=s.replace(/[^\d+\-() ]/g,"").replace(/\s+/g," ").trim();
    // If it starts with 00, convert to +
    if(p.startsWith("00"))p="+"+p.slice(2);
    // If no country code and 10+ digits, assume +971 (UAE)
    const digits=p.replace(/\D/g,"");
    if(!p.startsWith("+")&&digits.length>=10){
      if(digits.startsWith("0"))p="+971 "+digits.slice(1);
      else if(digits.startsWith("971"))p="+"+digits;
    }
    // Format: +XX XXXX XXXXXX or similar grouping
    if(p.startsWith("+")){
      const d=p.replace(/\D/g,"");
      if(d.length===12)p="+"+d.slice(0,2)+" "+d.slice(2,6)+" "+d.slice(6);      // +44 7779 300256
      else if(d.length===11)p="+"+d.slice(0,2)+" "+d.slice(2,6)+" "+d.slice(6);  // +44 7779 30025
      else if(d.length===13)p="+"+d.slice(0,3)+" "+d.slice(3,5)+" "+d.slice(5,8)+" "+d.slice(8); // +971 50 123 4567
    }
    return p;
  };
  const _formatVal=(key,val)=>{
    if(!val)return val;
    if(key==="name"||key==="contact"||key==="company")return _titleCase(val);
    if(key==="phone")return _formatPhone(val);
    if(key==="email")return val.toLowerCase().trim();
    if(key==="website")return val.toLowerCase().replace(/^https?:\/\//i,"").replace(/\/$/,"").trim();
    if(key==="location")return _titleCase(val);
    if(key==="role")return _titleCase(val);
    return val;
  };
  // Read custom options from localStorage (same keys as dashboard)
  const _readCustom=(key)=>{try{return JSON.parse(localStorage.getItem(key)||"[]");}catch{return[];}};
  const _persistCustom=(key,val)=>{const list=_readCustom(key);if(!list.includes(val)){list.push(val);try{localStorage.setItem(key,JSON.stringify(list));}catch{}}};
  const _VENDOR_CATS=[..._VENDOR_CATS_BASE,..._readCustom("onna_vendor_cats")];
  const _LEAD_CATS=[..._LEAD_CATS_BASE,..._readCustom("onna_lead_cats")];
  const _VENDOR_LOCS=[..._LOCS_BASE,..._readCustom("onna_vendor_locs")];
  const _LEAD_LOCS=[..._LOCS_BASE,..._readCustom("onna_lead_locs")];
  const showEntry=(entry,type,id=null,asOutreach=false)=>{setPendingType(type);setPendingId(id);setLeadEdit(entry);setPending(entry);setSaveAsOutreach(asOutreach);};
  const buildQuestions=(entry,type)=>{
    const qs=[];
    if(type==="vendor"){
      if(!entry.name)qs.push({key:"name",q:"Vendor name?"});
      if(!entry.company)qs.push({key:"company",q:"Company name?"});
      if(!entry.email)qs.push({key:"email",q:"Email address? (or tell me their company, e.g. 'works for Common Era')"});
      if(!entry.phone)qs.push({key:"phone",q:"Phone number?"});
      if(!entry.category||!_VENDOR_CATS.includes(entry.category))qs.push({key:"category",q:"Category?",options:_VENDOR_CATS,addNew:true});
      if(!entry.website)qs.push({key:"website",q:"Website?"});
      if(!entry.rateCard)qs.push({key:"rateCard",q:"Any rate card info?"});
      qs.push({key:"location",q:"Location?",options:_VENDOR_LOCS,addNew:true});
      qs.push({key:"notes",q:"Any notes?"});
    }else{
      if(!entry.contact)qs.push({key:"contact",q:"Contact name?"});
      if(!entry.company)qs.push({key:"company",q:"Company?"});
      if(!entry.role)qs.push({key:"role",q:"Their role or title?"});
      if(!entry.email)qs.push({key:"email",q:"Email address? (or tell me their company, e.g. 'works for Common Era')"});
      if(!entry.phone)qs.push({key:"phone",q:"Phone number?"});
      if(!entry.category||!_LEAD_CATS.includes(entry.category))qs.push({key:"category",q:"Category?",options:_LEAD_CATS,addNew:true});
      if(!entry.value||Number(entry.value)===0)qs.push({key:"value",q:"Estimated deal value? (AED)"});
      if(!entry.status||entry.status==="not_contacted")qs.push({key:"status",q:"Lead status — cold, warm, or open?"});
      qs.push({key:"location",q:"Location?",options:_LEAD_LOCS,addNew:true});
      qs.push({key:"source",q:"How did you find them? Direct · Referral · LinkedIn · Website · Cold Outreach · Event · Other"});
      qs.push({key:"notes",q:"Any notes?"});
    }
    return qs;
  };
  // Helper: finish Q&A — respects xContact mode (saves as secondary contact on parent)
  const _finishQA=(conv,e,history,extraMsg="")=>{
    if(conv._saveAsXContact){
      const xc=conv._saveAsXContact;
      const existing=getXContacts(xc.type,xc.id);
      const nc={name:e.contact||e.name||"",role:e.role||"",email:e.email||"",phone:e.phone||""};
      const updated=[...existing,nc];
      setXContacts(xc.type,xc.id,updated);
      showEntry({...xc.record,_xContacts:updated},xc.type,xc.id,conv.saveAsOutreach||false);
      setMsgs([...history,{role:"assistant",content:`${extraMsg?extraMsg+"\n\n":""}Added ${nc.name||"new contact"} as a contact on ${xc.existName}. Review below.`}]);
      return true;
    }
    return false;
  };
  const startConv=(entry,type,asOutreach=false,updateId=null)=>{
    const qs=buildQuestions(entry,type);
    if(qs.length===0){showEntry(entry,type,updateId,asOutreach);return null;}
    setPendingConv({entry,type,saveAsOutreach:asOutreach,updateId,questions:qs,idx:0});
    return qs[0].q;
  };
  // Helper: build duplicate prompt message from array of matches
  const _dupMsg=(matches,queryName)=>{
    const _label=(m)=>m.type==="vendor"?(m.record.name||m.record.company):(m.record.contact||m.record.company);
    if(matches.length===1){
      const m=matches[0];
      return `"${queryName}" looks similar to an existing ${m.type}: "${_label(m)}".\n1. Update "${_label(m)}"\n2. Add as new contact on "${_label(m)}"\n3. None of these — create separate entry\n\nReply 1, 2, or 3.`;
    }
    const list=matches.map((m,i)=>`${i+1}. ${_label(m)} (${m.type})`).join("\n");
    return `"${queryName}" looks similar to existing entries:\n\n${list}\n\nReply with a number to select, or "${matches.length+1}" to create a separate new entry.`;
  };
  const saveLead=async()=>{
    setSaving(true);
    try{
      if(pendingType==="vendor"){
        const fields={name:leadEdit.name||"",company:leadEdit.company||"",category:leadEdit.category||"",email:leadEdit.email||"",phone:leadEdit.phone||"",website:leadEdit.website||"",location:leadEdit.location||"Dubai, UAE",notes:leadEdit.notes||"",rateCard:leadEdit.rateCard||""};
        if(pendingId){await api.put(`/api/vendors/${pendingId}`,fields);onUpdateVendor?.(pendingId,fields);setMsgs(p=>[...p,{role:"assistant",content:`✓ ${leadEdit.name||"Vendor"} updated.`}]);}
        else{const saved=await api.post("/api/vendors",fields);if(saved?.id||saved?.name){setMsgs(p=>[...p,{role:"assistant",content:`✓ ${leadEdit.name||"Vendor"} saved to Vendors.`}]);}else{setMsgs(p=>[...p,{role:"assistant",content:`⚠️ ${saved?.error||"Save failed"}`}]);setSaving(false);return;}}
      }else{
        const fields={company:leadEdit.company||"",contact:leadEdit.contact||"",email:leadEdit.email||"",phone:leadEdit.phone||"",role:leadEdit.role||"",value:Number(leadEdit.value)||0,category:leadEdit.category||"",location:leadEdit.location||"Dubai, UAE",notes:leadEdit.notes||"",source:leadEdit.source||"Direct",date:leadEdit.date||new Date().toISOString().split("T")[0],status:leadEdit.status||"cold"};
        if(pendingId){await api.put(`/api/leads/${pendingId}`,fields);onUpdateLead?.(pendingId,fields);setMsgs(p=>[...p,{role:"assistant",content:`✓ ${leadEdit.contact||"Lead"} updated.`}]);}
        else{
          const saved=await api.post("/api/leads",fields);
          if(!saved?.id&&!saved?.company){setMsgs(p=>[...p,{role:"assistant",content:`⚠️ ${saved?.error||"Save failed"}`}]);setSaving(false);return;}
          // Update local leads state so UI reflects immediately
          if(saved?.id)onNewLead?.({...fields,id:saved.id});
          let msg=`✓ ${leadEdit.contact||leadEdit.company||"Lead"} saved to pipeline!`;
          if(saveAsOutreach){
            const os=(!leadEdit.status||leadEdit.status==="not_contacted")?"cold":leadEdit.status;
            const oF={clientName:leadEdit.contact||"",company:leadEdit.company||"",role:leadEdit.role||"",email:leadEdit.email||"",phone:leadEdit.phone||"",category:leadEdit.category||"",date:leadEdit.date||new Date().toISOString().split("T")[0],notes:leadEdit.notes||"",status:os,value:Number(leadEdit.value)||0,location:leadEdit.location||"Dubai, UAE",source:leadEdit.source||"Direct"};
            try{const oSaved=await api.post("/api/outreach",oF);onNewOutreach?.({...oF,id:oSaved?.id||Date.now()});msg+="\nAlso logged to Outreach Tracker ✓";}catch(e){msg+=`\n(Outreach save failed: ${e.message})`;}
          }
          setMsgs(p=>[...p,{role:"assistant",content:msg}]);
        }
      }
    }catch(e){setMsgs(p=>[...p,{role:"assistant",content:`⚠️ Save failed: ${e.message}`}]);}
    // Persist xContacts to localStorage if present
    if(leadEdit._xContacts&&pendingId){setXContacts(pendingType,pendingId,leadEdit._xContacts);}
    setSaving(false);setPending(null);
  };
  const lf=(label,key,wide=false,opts=null,inputType="text")=>(
    <div key={key} style={{gridColumn:wide?"1/-1":"auto",display:"flex",flexDirection:"column",gap:4}}>
      <label style={{fontSize:10.5,fontWeight:600,color:"#6e6e73",textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</label>
      {opts?(
        <select value={leadEdit[key]||""} onChange={e=>setLeadEdit(p=>({...p,[key]:e.target.value}))} style={{padding:"7px 10px",borderRadius:8,border:"1px solid #e5e5ea",fontSize:13,fontFamily:"inherit",color:"#1d1d1f",background:"#f5f5f7",outline:"none"}}>
          <option value="">—</option>
          {opts.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ):wide?(
        <textarea value={leadEdit[key]||""} onChange={e=>setLeadEdit(p=>({...p,[key]:e.target.value}))} rows={2} style={{padding:"7px 10px",borderRadius:8,border:"1px solid #e5e5ea",fontSize:13,fontFamily:"inherit",color:"#1d1d1f",background:"#f5f5f7",outline:"none",resize:"vertical"}}/>
      ):(
        <input type={inputType} value={leadEdit[key]||""} onChange={e=>setLeadEdit(p=>({...p,[key]:e.target.value}))} style={{padding:"7px 10px",borderRadius:8,border:"1px solid #e5e5ea",fontSize:13,fontFamily:"inherit",color:"#1d1d1f",background:"#f5f5f7",outline:"none"}}/>
      )}
    </div>
  );

  const send=async()=>{
    if(!_inputRef.current.trim()&&!attachments.length)return;
    const input=_inputRef.current;
    // Immediately clear the textarea so it doesn't linger while handlers run
    if(_taRef.current)_taRef.current.value="";
    _inputRef.current="";_setInput("");
    // ── Clear chat intent (runs even while loading) ──────────────────────────
    if(/^(clear(\s+chat|\s+prompt|\s+all|\s+history)?|reset(\s+chat)?|wipe(\s+chat)?|start\s*over|new\s+chat)$/i.test(input.trim())){
      const fresh=[{role:"assistant",content:_introWithProjects}];
      setMsgs(fresh);setInput("");setLoading(false);setMood("idle");setPendingConv(null);setPending(null);setPendingDuplicate(null);setAttachments([]);setConnieCtx(null);setConnieTabs([]);setConnieDietMode(null);setRonnieCtx(null);setRonnieTabs([]);setBillieCtx(null);setBillieTabs([]);setBilliePendingReview(null);setCodyCtx(null);setCodyTabs([]);codyPendingRef.current=null;setCodyUploadedDoc(null);setCodySignPanel(null);setCodyPickerPid(null);
      if(setActiveContractVersion)setActiveContractVersion(null);if(setActiveRAVersion)setActiveRAVersion(null);if(setActiveEstimateVersion)setActiveEstimateVersion(null);
      try{localStorage.setItem('onna_agent_chat_'+agent.id,JSON.stringify(fresh));}catch{}
      return;
    }
    if(loading)return;
    const curAttachments=[...attachments];
    setAttachments([]);
    const displayContent=input.trim()+(curAttachments.length?` [${curAttachments.length} image${curAttachments.length>1?"s":""}]`:"");
    const userMsg={role:"user",content:displayContent,_attachments:curAttachments.length?curAttachments:undefined};
    const history=[...msgs,userMsg];

    // ── Quick-action number replies from intro bubbles ─────────────────────────
    const _isIntroReply=/^[123]$/.test(input.trim());
    const _lastMsg=msgs.length>0?msgs[msgs.length-1]:null;
    const _lastContent=_lastMsg?.content||"";
    const _lastHasProjectList=/\n\d+\.\s+\*\*/.test(_lastContent);
    const _lastIsIntro=_lastMsg&&_lastMsg.role==="assistant"&&/Here's what I can do|What do you need\?/i.test(_lastContent)&&!_lastHasProjectList;
    if(_isIntroReply&&_lastIsIntro){
      const n=parseInt(input.trim(),10);
      const _needsProject={compliance:true,researcher:true,contracts:true,billie:true,finn:true,carrie:true,logistical:false};
      const _responses={
        logistical:{1:"Tell me about the vendor — name, category, email and phone number.",2:"Who did you contact? Give me the name and what happened, and I'll log it with today's date.",3:"Who are you looking for? Give me a name, category, or location and I'll search."},
        compliance:{1:"Let's edit a call sheet. Which project should I work on?",2:"I'll review what's missing. Which project should I work on?",3:"Let's manage dietary requirements. Which project should I work on?"},
        researcher:{1:"I'll help add risks. Which project should I work on?",2:"I'll review the assessment. Which project should I work on?",3:"I'll generate a risk report. Which project should I work on?"},
        billie:{1:"I'll work on the budget. Which project should I work on?",2:"I'll help track expenses. Which project should I work on?",3:"I'll compare actuals vs estimates. Which project should I work on?"},

        carrie:{1:"I'll add talent. Which project should I work on?",2:"I'll search agencies or generate a brief. Which project should I work on?",3:"I'll review casting and export. Which project should I work on?"},
        contracts:{1:"Let's work on a live contract. Which project should I work on?",2:"Sure! Describe the document you need — for example:\n\n• \"Draft an NDA for a freelance editor\"\n• \"Create a liability waiver for a night shoot in RAK\"\n• \"Write a release form for talent appearing in a commercial\"\n\nWhat would you like me to draft?",3:"Upload a PDF using the 📎 button below, or ask me to generate a document first — then I can add your signature, company stamp, and ONNA letterhead.\n\nTry: \"Create a liability waiver\" → then \"Sign and stamp this\""},
      };
      const agentResp=_responses[agent.id];
      if(agentResp&&agentResp[n]){
        // ── Vinnie: option 1 → start vendor Q&A with split screen ──
        if(agent.id==="logistical"&&n===1){
          const entry={_type:"vendor",name:"",company:"",category:"",email:"",phone:"",website:"",location:"Dubai, UAE",notes:"",rateCard:""};
          const firstQ=startConv(entry,"vendor",false,null);
          setMsgs([...history,{role:"assistant",content:`New vendor — let's fill in the details. ('x' to skip)\n\n${firstQ}`}]);
          setInput("");setLoading(false);return;
        }
        // ── Vinnie: option 2 → start outreach Q&A with split screen ──
        if(agent.id==="logistical"&&n===2){
          const today=new Date().toISOString().slice(0,10);
          const entry={_type:"lead",contact:"",company:"",email:"",phone:"",role:"",value:"",category:"",location:"Dubai, UAE",date:today,source:"Direct",notes:"",status:"not_contacted"};
          const firstQ=startConv(entry,"lead",true,null);
          setMsgs([...history,{role:"assistant",content:`New outreach entry — let's fill in the details. ('x' to skip)\n\n${firstQ}`}]);
          setInput("");setLoading(false);return;
        }
        let reply=agentResp[n];
        if(_needsProject[agent.id]&&/which project/i.test(reply)){
          const activeProjs=(localProjects||[]).filter(pr=>pr.status!=="Completed"&&pr.name&&!/^TEMPLATE/i.test(pr.name));
          if(activeProjs.length>0) reply+="\n\n"+activeProjs.map((pr,i)=>`${i+1}. **${pr.client||""}** — ${pr.name}`).join("\n");
          else reply+="\n\nNo active projects found. Create one first in the Projects section.";
        }
        setMsgs([...history,{role:"assistant",content:reply}]);
        setInput("");setLoading(false);return;
      }
    }

    // ── Pending conversational Q&A → popup at end ─────────────────────────────
    // ── Break out of Q&A if user starts a new creation command ──
    if(pendingConv&&agent.id==="logistical"&&/^(?:new|create|add)\s+(?:vendor|supplier|lead|contact|outreach)/i.test(input.trim().replace(/^(?:hey|hi|hello|yo)?\s*(?:vinnie|vin)\s*[,.]?\s*/i,""))){
      setPendingConv(null);setPending(null);
    }
    if(pendingConv){
      // ── Awaiting type choice (from bare "new") ──
      if(pendingConv._awaitingTypeChoice){
        const pick=input.trim();
        const today=new Date().toISOString().slice(0,10);
        setMsgs(history);setInput("");
        if(pick==="1"||/^vendor/i.test(pick)){
          setPendingConv(null);
          const entry={_type:"vendor",name:"",company:"",category:"",email:"",phone:"",website:"",location:"Dubai, UAE",notes:"",rateCard:""};
          const firstQ=startConv(entry,"vendor",false,null);
          setMsgs([...history,{role:"assistant",content:`New vendor — let's fill in the details. ('x' to skip)\n\n${firstQ}`}]);
        }else if(pick==="2"||/^lead/i.test(pick)){
          setPendingConv(null);
          const entry={_type:"lead",contact:"",company:"",email:"",phone:"",role:"",value:"",category:"",location:"Dubai, UAE",date:today,source:"Direct",notes:"",status:"not_contacted"};
          const firstQ=startConv(entry,"lead",false,null);
          setMsgs([...history,{role:"assistant",content:`New lead — let's fill in the details. ('x' to skip)\n\n${firstQ}`}]);
        }else if(pick==="3"||/^outreach/i.test(pick)){
          setPendingConv(null);
          const entry={_type:"lead",contact:"",company:"",email:"",phone:"",role:"",value:"",category:"",location:"Dubai, UAE",date:today,source:"Direct",notes:"",status:"not_contacted"};
          const firstQ=startConv(entry,"lead",true,null);
          setMsgs([...history,{role:"assistant",content:`New outreach tracker — let's fill in the details. ('x' to skip)\n\n${firstQ}`}]);
        }else{
          setMsgs([...history,{role:"assistant",content:"Please reply 1 (Vendor), 2 (Lead), or 3 (Outreach Tracker)."}]);
        }
        return;
      }
      // ── Awaiting update name (from bare "update") ──
      if(pendingConv._awaitingUpdateName){
        const pick=input.trim().replace(/^(?:update|edit|modify|open|show)\s+(?:the\s+)?(?:(?:vendor|supplier|lead|contact)\s+)?/i,"").trim();
        setMsgs(history);setInput("");
        setPendingConv(null);
        if(!pick||pick.length<2){
          setMsgs([...history,{role:"assistant",content:"Please type a name to look up, e.g. 'Nancy' or 'Acme Corp'."}]);
          setPendingConv({_awaitingUpdateName:true,entry:null,type:null,questions:[],idx:0});
          return;
        }
        // Look up the name
        setLoading(true);setMood("thinking");
        const found=findVendorOrLead(pick,allVendors,allLeads);
        if(found){
          const {record,type}=found;
          const displayName=type==="vendor"?record.name:(record.contact||record.company);
          const merged={...record};
          showEntry(merged,type,record.id,false);
          const missingEmail=!merged.email;const missingPhone=!merged.phone;
          const optList=[];
          if(missingEmail)optList.push("Search Outlook for email");
          if(missingPhone)optList.push("Search WhatsApp for phone");
          optList.push("Add a secondary contact");
          const opts="\n\n"+optList.map((o,i)=>`${i+1}. ${o}`).join("\n")+"\n\nType 'done' if you don't need anything else.";
          setPendingConv({_awaitingUpdateAction:true,_updateRecord:merged,_updateType:type,_updateId:record.id,_updateName:displayName,_actionOptions:optList,entry:null,type:null,questions:[],idx:0});
          setMsgs([...history,{role:"assistant",content:`Found ${displayName} (${type}). Edit below and save.${opts}`}]);
        }else{
          setMsgs([...history,{role:"assistant",content:`No record found for "${pick}". Try a different name, or type 'new' to create one.`}]);
        }
        setLoading(false);setMood("idle");
        return;
      }
      // ── Awaiting update action (search outlook/whatsapp after opening card) ──
      if(pendingConv._awaitingUpdateAction){
        const pick=input.trim();
        const {_updateRecord:rec,_updateType:uType,_updateId:uId,_updateName:uName,_actionOptions:opts}=pendingConv;
        setMsgs(history);setInput("");
        // Allow free-text search commands too
        const pickNum=parseInt(pick);
        const pickedOpt=(pickNum>=1&&pickNum<=opts.length)?opts[pickNum-1]:"";
        const isOutlook=/outlook|email/i.test(pickedOpt)||/\b(?:search|check)\s*(?:outlook|email)/i.test(pick);
        const isWhatsapp=/whatsapp|phone/i.test(pickedOpt)||/\b(?:search|check)\s*(?:whatsapp|phone)/i.test(pick);
        const isAddContact=/secondary|add.*contact/i.test(pickedOpt)||/\b(?:add|new)\s*(?:a\s+)?(?:secondary|contact|person)\b/i.test(pick);
        const isDone=/^(done|no|skip|x|cancel|nothing|nah)$/i.test(pick);
        if(isDone){setPendingConv(null);setMsgs([...history,{role:"assistant",content:"All good. Edit the card and save when ready."}]);return;}
        if(isAddContact){
          // Start xContact Q&A for a new secondary contact on this record
          setPendingConv(null);
          const xContactFields=uType==="vendor"
            ?[["name","Contact name?"],["email","Email address?"],["phone","Phone number?"],["role","Their role or title?"]]
            :[["name","Contact name?"],["role","Their role or title?"],["email","Email address?"],["phone","Phone number?"]];
          const xQs=xContactFields.map(([k,q])=>({key:k==="name"?"contact":k,q}));
          const convData={entry:{_type:uType,contact:"",email:"",phone:"",role:""},type:uType,saveAsOutreach:false,updateId:uId,questions:xQs,idx:0,_saveAsXContact:{type:uType,id:uId,record:rec,existName:uName}};
          setPendingConv(convData);
          setMsgs([...history,{role:"assistant",content:`Adding a new contact on ${uName}.\n\n${xQs[0].q} (or 'x' to skip)`}]);
          return;
        }
        if(isOutlook||isWhatsapp){
          const source=isWhatsapp?"whatsapp":"outlook";
          setLoading(true);setMood("thinking");
          setMsgs([...history,{role:"assistant",content:`Searching ${isWhatsapp?"WhatsApp":"Outlook"} for ${uName}...`}]);
          const result=await searchViaExt(uName,source);
          setLoading(false);setMood("idle");
          if(result.ok&&result.lead){
            const l=_stripOwn(result.lead);
            const updated={...rec};
            let filled=[];
            if(!updated.email&&l.email){updated.email=_formatVal("email",l.email);filled.push("email: "+l.email);}
            if(!updated.phone&&l.phone){updated.phone=_formatVal("phone",l.phone);filled.push("phone: "+l.phone);}
            if(!updated.website&&l.website){updated.website=_formatVal("website",l.website);filled.push("website: "+l.website);}
            if(!updated.company&&l.company){updated.company=l.company;filled.push("company: "+l.company);}
            if(uType==="vendor"&&!updated.notes&&l.role){updated.notes=l.role;filled.push("notes: "+l.role);}
            if(uType!=="vendor"&&!updated.role&&l.role){updated.role=l.role;filled.push("role: "+l.role);}
            if(filled.length){
              showEntry(updated,uType,uId,false);
              lastSearchRef.current={...l,_type:uType,_query:uName,_ts:Date.now()};
            }
            // Check remaining missing fields
            const stillMissingEmail=!updated.email;const stillMissingPhone=!updated.phone;
            const newOpts=[];
            if(stillMissingEmail)newOpts.push("Search Outlook for email");
            if(stillMissingPhone)newOpts.push("Search WhatsApp for phone");
            newOpts.push("Add a secondary contact");
            setPendingConv({...pendingConv,_updateRecord:updated,_actionOptions:newOpts});
            const optStr=newOpts.map((o,i)=>`${i+1}. ${o}`).join("\n");
            setMsgs([...history,{role:"assistant",content:`${filled.length?`Found: ${filled.join(", ")}. Updated card.`:`No results from ${isWhatsapp?"WhatsApp":"Outlook"}.`}\n\n${optStr}\n\nOr type 'done'.`}]);
          }else{
            setMsgs([...history,{role:"assistant",content:`No results from ${isWhatsapp?"WhatsApp":"Outlook"}. ${opts.map((o,i)=>`${i+1}. ${o}`).join("\n")}\n\nOr type 'done'.`}]);
          }
          return;
        }
        // Unrecognized — re-show options
        const optStr=opts.map((o,i)=>`${i+1}. ${o}`).join("\n");
        setMsgs([...history,{role:"assistant",content:`Reply with a number:\n\n${optStr}\n\nOr type 'done' to skip.`}]);
        return;
      }
      // ── Mid-Q&A search — fill missing fields from Outlook/WhatsApp ──
      const midSearchM=agent.id==="logistical"&&input.trim().match(/\b(?:search|check|look|find|scan)\s+(?:(?:my|in|on|the)\s+)?(?:outlook|whatsapp|emails?|inbox|chats?)\b/i);
      if(midSearchM){
        const conv=pendingConv;
        const searchName=conv.entry?.contact||conv.entry?.name||lastSearchRef.current?._query||"";
        if(searchName){
          setMsgs(history);setInput("");setLoading(true);setMood("thinking");
          const srcM=input.trim().match(/\b(outlook|whatsapp)\b/i);
          const source=srcM?srcM[1].toLowerCase():undefined;
          // Search by name, then also by company if available — combine results
          const searchTerms=[searchName];
          if(conv.entry?.company&&conv.entry.company.toLowerCase()!==searchName.toLowerCase())searchTerms.push(conv.entry.company);
          const _junk=/^(unread|inbox|focused|drafts?|sent|junk|archive|deleted|starred|flagged|all mail|spam|trash|important|none|null|undefined|n\/a)$/i;
          const _clean=(v)=>v&&typeof v==="string"&&v.trim()&&!_junk.test(v.trim())&&!/onna/i.test(v.trim())?v.trim():"";
          let combinedLead={};let allFoundEmails=[];
          for(const term of searchTerms){
            const result=await searchViaExt(term,source);
            if(result.ok&&result.lead){
              const l=_stripOwn(result.lead);
              if(!combinedLead.email)combinedLead={...l};
              if(l.email&&/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(l.email)&&!/onna/i.test(l.email))allFoundEmails.push(l.email);
              if(l._allEmails)l._allEmails.filter(em=>!/onna/i.test(em)&&/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(em)).forEach(em=>allFoundEmails.push(em));
            }
          }
          if(combinedLead.email||combinedLead.phone){
            lastSearchRef.current={...combinedLead,_type:conv.type,_query:searchName,_ts:Date.now()};
            const e={...conv.entry};
            const filled=[];
            // Fill non-email fields directly (phone, company, website, role)
            const fillKeys=conv.type==="vendor"
              ?[["phone","phone"],["company","company"],["website","website"],["notes","role"]]
              :[["phone","phone"],["company","company"],["role","role"]];
            for(const [eKey,lKey] of fillKeys){
              const cleaned=eKey==="phone"?(_clean(combinedLead[lKey])&&/\d{4,}/.test(_clean(combinedLead[lKey]))?_clean(combinedLead[lKey]):""):_clean(combinedLead[lKey]);
              if(!e[eKey]&&cleaned){e[eKey]=_formatVal(eKey,cleaned);filled.push(eKey);}
            }
            // For email: show all found options for user to choose
            const uniqueEmails=[...new Set(allFoundEmails)];
            // Score emails by relevance
            const firstName=(searchName.split(" ")[0]||"").toLowerCase();
            const lastName=(searchName.split(" ").slice(1).join(" ")||"").toLowerCase().replace(/\s+/g,"");
            const compClean=(e.company||"").toLowerCase().replace(/[^a-z0-9]/g,"");
            const _scoreEmail=(em)=>{
              let s=0;const local=em.split("@")[0].toLowerCase();const dom=em.split("@")[1]||"";
              if(firstName&&local.includes(firstName))s+=10;
              if(lastName&&local.includes(lastName))s+=8;
              if(compClean&&dom.replace(/[^a-z0-9]/g,"").includes(compClean))s+=5;
              if(/^(info|hello|contact|admin|office|sales|support|team|enquiries|bookings|studio)@/i.test(em))s-=4;
              return s;
            };
            uniqueEmails.sort((a,b)=>_scoreEmail(b)-_scoreEmail(a));
            // Filter out emails that clearly don't belong to this person
            const midRelevant=uniqueEmails.filter(em=>_scoreEmail(em)>0);
            const midFinal=midRelevant.length>0?midRelevant:uniqueEmails;
            if(!e.email&&midFinal.length>1){
              // Multiple emails — show options, don't auto-fill
              filled.push("email (options below)");
              const filledMsg=filled.length?`Found! Filled in: ${filled.join(", ")}.`:"";
              const optList=midFinal.map((o,i)=>`${i+1}. ${o}`).join("\n");
              // Find the email question index
              const emailQIdx=conv.questions.findIndex(q=>q.key==="email");
              const targetIdx=emailQIdx>=0?emailQIdx:conv.idx;
              setPendingConv({...conv,entry:e,idx:targetIdx,_emailOptions:midFinal});
              setMsgs([...history,{role:"assistant",content:`${filledMsg}\n\nFound possible emails for ${searchName}:\n\n${optList}\n\nReply with the number, type the correct email, or 'x' to skip.`}]);
            }else if(!e.email&&midFinal.length===1&&_scoreEmail(midFinal[0])>=15){
              // Single high-confidence email — auto-fill
              e.email=_formatVal("email",midFinal[0]);filled.push("email");
              let newIdx=conv.idx;const qs=conv.questions;
              while(newIdx<qs.length&&e[qs[newIdx].key])newIdx++;
              const filledMsg=`Found! Filled in: ${filled.join(", ")}.`;
              if(newIdx>=qs.length){setPendingConv(null);if(!_finishQA(conv,e,history,filledMsg)){showEntry(e,conv.type,conv.updateId,conv.saveAsOutreach);setMsgs([...history,{role:"assistant",content:`${filledMsg}\n\nAll filled in! Review everything below and hit Save ✓`}]);}}
              else{setPendingConv({...conv,entry:e,idx:newIdx});setMsgs([...history,{role:"assistant",content:`${filledMsg}\n\n${qs[newIdx].q} (or 'x' to skip)`}]);}
            }else if(!e.email&&midFinal.length===1){
              // Single low-confidence email — show as option
              const optList=`1. ${midFinal[0]}`;
              const emailQIdx=conv.questions.findIndex(q=>q.key==="email");
              const targetIdx=emailQIdx>=0?emailQIdx:conv.idx;
              const filledMsg=filled.length?`Found! Filled in: ${filled.join(", ")}.`:"";
              setPendingConv({...conv,entry:e,idx:targetIdx,_emailOptions:midFinal});
              setMsgs([...history,{role:"assistant",content:`${filledMsg}\n\nFound a possible email for ${searchName}:\n\n${optList}\n\nReply 1 to use it, type the correct email, or 'x' to skip.`}]);
            }else{
              // Email already filled or no emails found — fill other fields and continue
              const filledMsg=filled.length?`Found! Filled in: ${filled.join(", ")}.`:`Searched for ${searchName} but couldn't extract usable contact info.`;
              let newIdx=conv.idx;const qs=conv.questions;
              while(newIdx<qs.length&&e[qs[newIdx].key])newIdx++;
              if(newIdx>=qs.length){setPendingConv(null);if(!_finishQA(conv,e,history,filledMsg)){showEntry(e,conv.type,conv.updateId,conv.saveAsOutreach);setMsgs([...history,{role:"assistant",content:`${filledMsg}\n\nAll filled in! Review everything below and hit Save ✓`}]);}}
              else{setPendingConv({...conv,entry:e,idx:newIdx});setMsgs([...history,{role:"assistant",content:`${filledMsg}\n\n${qs[newIdx].q} (or 'x' to skip)`}]);}
            }
          }else{
            setMsgs([...history,{role:"assistant",content:`Couldn't find "${searchName}" — no results. Let's continue.\n\n${conv.questions[conv.idx].q} (or 'x' to skip)`}]);
          }
          setLoading(false);setMood("idle");return;
        }
      }
      // ── "try again" / "search again" / "retry" — abort Q&A, re-search Outlook ──
      const retryM=agent.id==="logistical"&&input.trim().match(/\b(?:try|search|look|fetch|find|retry|redo|re-?search|re-?do)\s*(?:again|outlook|emails?)?\s*(?:for\s+)?(.+)?$/i);
      if(retryM){
        const retryName=(retryM[1]||"").trim().replace(/\s+(?:again|in\s+outlook|in\s+my\s+emails?)$/i,"").trim()||pendingConv.entry?.contact||pendingConv.entry?.name||lastSearchRef.current?._query||"";
        if(retryName){
          setPendingConv(null);
          setMsgs(history);setInput("");setLoading(true);setMood("thinking");
          setMsgs([...history,{role:"assistant",content:`Searching again for "${retryName}"…`}]);
          const retryType=pendingConv.type||"lead";
          const result=await searchViaExt(retryName);
          if(result.ok&&result.lead){
            const l=_stripOwn(result.lead);
            if(retryType==="vendor"&&!l.name)l.name=l.contact||retryName;
            lastSearchRef.current={...l,_type:retryType,_query:retryName,_ts:Date.now()};
            const foundEntry={...l,_type:retryType};
            const fqf=startConv(foundEntry,retryType,false,pendingConv.updateId||null);
            setMsgs([...history,{role:"assistant",content:`Found ${l.contact||l.name||retryName}!\n📧 ${l.email||"—"}  📱 ${l.phone||"—"}\n🏢 ${l.company||"—"}  💼 ${l.role||"—"}${fqf?"\n\n"+fqf+" (or 'x' to skip)":"\n\nReview and save below."}`}]);
          }else{
            setMsgs([...history,{role:"assistant",content:`Still couldn't find "${retryName}".\n\n${result.error||""}\n\nTip: try opening an email from this person in Outlook first, then say "try again".`}]);
          }
          setLoading(false);setMood("idle");return;
        }
      }
      // ── Handle pending disambiguations from "change" command ──
      if(pendingConv._awaitingNameChoice){
        const pick=input.trim();
        const fieldKey=pendingConv._awaitingNameChoice;
        const inlineVal=pendingConv._awaitingNameInline||"";
        const conv={...pendingConv};delete conv._awaitingNameChoice;delete conv._awaitingNameInline;
        if(pick==="1"){
          // Master name
          if(inlineVal){
            const updatedRec={...conv._saveAsXContact.record,name:inlineVal};
            setPendingConv({...conv,_saveAsXContact:{...conv._saveAsXContact,record:updatedRec,existName:inlineVal}});
            setMsgs(history);setInput("");
            setMsgs([...history,{role:"assistant",content:`Updated master name to "${inlineVal}". What else?`}]);
          }else{
            setMsgs(history);setInput("");
            setMsgs([...history,{role:"assistant",content:`What should the master name be?`}]);
            setPendingConv({...conv,_awaitingMasterEdit:"name"});
          }
          return;
        }else if(pick==="2"){
          // Secondary contact name
          if(inlineVal){
            const e={...conv.entry};e.name=inlineVal;e.contact=inlineVal;
            setPendingConv({...conv,entry:e});
            setMsgs(history);setInput("");
            setMsgs([...history,{role:"assistant",content:`Updated contact name to "${inlineVal}". What else?`}]);
          }else{
            setMsgs(history);setInput("");
            setMsgs([...history,{role:"assistant",content:`What should the contact's name be?`}]);
            setPendingConv({...conv,_awaitingContactEdit:"name"});
          }
          return;
        }
        // If neither 1 nor 2, fall through to normal Q&A
        setPendingConv(conv);
      }
      if(pendingConv._awaitingMasterEdit){
        const field=pendingConv._awaitingMasterEdit;
        const val=input.trim();
        const conv={...pendingConv};delete conv._awaitingMasterEdit;
        const updatedRec={...conv._saveAsXContact.record,[field]:val};
        const newXc={...conv._saveAsXContact,record:updatedRec};
        if(field==="name")newXc.existName=val;
        setPendingConv({...conv,_saveAsXContact:newXc});
        setMsgs(history);setInput("");
        setMsgs([...history,{role:"assistant",content:`Updated master ${field} to "${val}". ${conv.questions[conv.idx]?.q||"What else?"} (or 'x' to skip)`}]);
        return;
      }
      if(pendingConv._awaitingContactEdit){
        const field=pendingConv._awaitingContactEdit;
        const val=input.trim();
        const conv={...pendingConv};delete conv._awaitingContactEdit;
        const e={...conv.entry};e[field]=val;
        if(field==="name")e.contact=val;
        setPendingConv({...conv,entry:e});
        setMsgs(history);setInput("");
        setMsgs([...history,{role:"assistant",content:`Updated contact ${field} to "${val}". ${conv.questions[conv.idx]?.q||"What else?"} (or 'x' to skip)`}]);
        return;
      }
      // ── "change email" / "edit name" / "go back to phone" — jump to that field ──
      // Also supports: "change name to X", "change master name", "change secondary email", "change contact name"
      const changeM=input.trim().match(/^(?:change|edit|update|modify|go\s*back\s*to|redo)\s+(?:the\s+)?(?:my\s+)?(?:(master|main|primary|secondary|contact(?:'s)?|their|new)\s+)?(name|company|email|phone|role|title|website|category|location|rate\s*card|notes|value|status|source|date|contact\s*name|contact)\b(?:\s+(?:to|=|:)\s+(.+))?/i);
      if(changeM){
        const qualifier=(changeM[1]||"").toLowerCase();
        const rawField=changeM[2].toLowerCase().replace(/\s+/g,"");
        const inlineVal=(changeM[3]||"").trim();
        const fieldMap={name:"name",company:"company",email:"email",phone:"phone",role:"role",title:"role",website:"website",category:"category",location:"location",ratecard:"rateCard",notes:"notes",value:"value",status:"status",source:"source",date:"date",contactname:"contact",contact:"contact"};
        const fieldKey=fieldMap[rawField]||rawField;
        const conv=pendingConv;
        const isXMode=!!conv._saveAsXContact;
        const isSecondary=isXMode&&/^(secondary|contact|their|new)$/.test(qualifier);
        const isMaster=/^(master|main|primary)$/.test(qualifier);

        // In xContact mode: "change name" is ambiguous — ask which one
        if(isXMode&&(fieldKey==="name"||fieldKey==="contact")&&!qualifier){
          setMsgs(history);setInput("");
          const masterName=conv._saveAsXContact.existName||conv._saveAsXContact.record.name||"master record";
          const contactName=conv.entry.contact||conv.entry.name||"new contact";
          setMsgs([...history,{role:"assistant",content:`Which name do you want to change?\n1. Master name ("${masterName}")\n2. Secondary contact name ("${contactName}")\n\nReply 1 or 2.`}]);
          setPendingConv({...conv,_awaitingNameChoice:fieldKey,_awaitingNameInline:inlineVal});
          return;
        }

        // In xContact mode with "master" qualifier — edit the parent record's field directly on card
        if(isXMode&&isMaster){
          if(inlineVal){
            const rec=conv._saveAsXContact.record;
            const updatedRec={...rec,[fieldKey==="contact"?"name":fieldKey]:inlineVal};
            setPendingConv({...conv,_saveAsXContact:{...conv._saveAsXContact,record:updatedRec,existName:fieldKey==="name"?inlineVal:conv._saveAsXContact.existName}});
            setMsgs(history);setInput("");
            setMsgs([...history,{role:"assistant",content:`Updated master ${rawField} to "${inlineVal}". What else?`}]);
          }else{
            setMsgs(history);setInput("");
            setMsgs([...history,{role:"assistant",content:`What should the master ${rawField} be?`}]);
            setPendingConv({...conv,_awaitingMasterEdit:fieldKey==="contact"?"name":fieldKey});
          }
          return;
        }

        // xContact mode with secondary qualifier or default in xContact — edit the contact's field
        if(isXMode&&(isSecondary||qualifier==="")){
          // Map "name" to the contact entry's name field
          const contactKey=(fieldKey==="name"||fieldKey==="contact")?"name":fieldKey;
          if(inlineVal){
            const e={...conv.entry};
            e[contactKey]=inlineVal;
            if(contactKey==="name")e.contact=inlineVal;
            setPendingConv({...conv,entry:e});
            setMsgs(history);setInput("");
            setMsgs([...history,{role:"assistant",content:`Updated contact ${rawField} to "${inlineVal}". What else?`}]);
          }else{
            const qIdx=conv.questions.findIndex(q=>q.key===contactKey);
            if(qIdx>=0){
              const e={...conv.entry};
              e[contactKey]="";
              setPendingConv({...conv,entry:e,idx:qIdx,_awaitingNewCat:false});
              setMsgs(history);setInput("");
              setMsgs([...history,{role:"assistant",content:`Sure — ${conv.questions[qIdx].q} (or 'x' to skip)`}]);
            }else{
              // Field not in xContact Q&A (like name) — ask directly
              setMsgs(history);setInput("");
              setMsgs([...history,{role:"assistant",content:`What should the contact's ${rawField} be?`}]);
              setPendingConv({...conv,_awaitingContactEdit:contactKey});
            }
          }
          return;
        }

        // Normal Q&A mode — jump to field question
        const qIdx=conv.questions.findIndex(q=>q.key===fieldKey);
        if(qIdx>=0){
          const e={...conv.entry};
          if(inlineVal){
            e[fieldKey]=_formatVal(fieldKey,inlineVal);
            setPendingConv({...conv,entry:e});
            setMsgs(history);setInput("");
            setMsgs([...history,{role:"assistant",content:`Updated ${rawField} to "${e[fieldKey]}". What else?`}]);
          }else{
            e[fieldKey]="";
            setMsgs(history);setInput("");
            setPendingConv({...conv,entry:e,idx:qIdx,_awaitingNewCat:false});
            setMsgs([...history,{role:"assistant",content:`Sure — ${conv.questions[qIdx].q} (or 'x' to skip)`}]);
          }
          return;
        }
        // Field not in Q&A questions — update directly on card
        if(inlineVal){
          const e={...conv.entry};
          e[fieldKey]=_formatVal(fieldKey,inlineVal);
          setPendingConv({...conv,entry:e});
          setMsgs(history);setInput("");
          setMsgs([...history,{role:"assistant",content:`Updated ${rawField} to "${e[fieldKey]}". What else?`}]);
        }else{
          setMsgs(history);setInput("");
          setMsgs([...history,{role:"assistant",content:`You can edit ${changeM[2]} directly on the card, or say "change ${rawField} to [value]".`}]);
        }
        return;
      }
      setMsgs(history);setInput("");
      // ── Go back to previous question ──
      const isBack=/^(back|go back|prev|previous|undo)$/i.test(input.trim());
      if(isBack&&pendingConv.idx>0){
        const prevIdx=pendingConv.idx-1;
        const prevQ=pendingConv.questions[prevIdx];
        setPendingConv({...pendingConv,idx:prevIdx,_awaitingNewCat:false});
        setMsgs([...history,{role:"assistant",content:`${prevQ.q} (or 'x' to skip)`}]);
        return;
      }
      const isSkip=/^(x|skip|n\/a|none|-|pass|don'?t have(?: that)?|i don'?t|not sure|leave(?: it)? blank|unsure|nothing|blank)$/i.test(input.trim());
      const conv=pendingConv;
      const q=conv.questions[conv.idx];
      let e={...conv.entry};

      // ── Handle pending "add new category?" confirmation ──
      if(conv._awaitingNewCat){
        const isYes=/^(yes|yep|yeah|y|sure|ok|create|add)\b/i.test(input.trim());
        const isNo=/^(no|nope|nah|n|cancel)\b/i.test(input.trim());
        if(isYes){
          // Persist the custom category to localStorage for future dropdown use
          if(e.category){
            const catKey=conv.type==="vendor"?"onna_vendor_cats":"onna_lead_cats";
            _persistCustom(catKey,e.category);
          }
          // keep the custom category as-is, advance to next question
          const next=conv.idx+1;
          if(next>=conv.questions.length){
            setPendingConv(null);
            if(_finishQA(conv,e,history)){/* saved as xContact */}
            else if(!conv.updateId){
              const eName=conv.type==="vendor"?e.name:(e.contact||"");
              const eCompany=e.company||"";
              const catDupMatches=[...findAllSimilar(eName,allVendors,allLeads),...(eCompany?findAllSimilar(eCompany,allVendors,allLeads):[])];
              const seenC=new Set();const catDedup=catDupMatches.filter(m=>{const k=m.type+"_"+m.record.id;if(seenC.has(k))return false;seenC.add(k);return true;});
              if(catDedup.length>0){
                const queryName=eName||eCompany;
                setPendingDuplicate({entry:{...e,_type:conv.type},matches:catDedup,saveAsOutreach:conv.saveAsOutreach||false});
                setMsgs([...history,{role:"assistant",content:`All filled in! But I found similar entries.\n\n${_dupMsg(catDedup,queryName)}`}]);
              }else{
                showEntry(e,conv.type,conv.updateId,conv.saveAsOutreach);
                setMsgs([...history,{role:"assistant",content:"All filled in! Review everything below and hit Save ✓"}]);
              }
            }else{
              showEntry(e,conv.type,conv.updateId,conv.saveAsOutreach);
              setMsgs([...history,{role:"assistant",content:"All filled in! Review everything below and hit Save ✓"}]);
            }
          }else{
            setPendingConv({...conv,_awaitingNewCat:false,entry:e,idx:next});
            setMsgs([...history,{role:"assistant",content:conv.questions[next].q+" (or 'x' to skip)"}]);
          }
        }else if(isNo){
          // re-ask the category question
          setPendingConv({...conv,_awaitingNewCat:false,entry:{...e,category:""}});
          setMsgs([...history,{role:"assistant",content:q.q+" (or 'x' to skip)"}]);
        }else{
          setMsgs([...history,{role:"assistant",content:"Add new category? Reply yes or no."}]);
        }
        return;
      }

      if(q){
        if(isSkip){
          if(q.key==="location"&&!e.location)e.location="Dubai, UAE";
        }else{
          if(q.key==="status"){
            if(/cold/i.test(input))e.status="cold";
            else if(/warm/i.test(input))e.status="warm";
            else if(/open/i.test(input))e.status="open";
          }else if(q.key==="value"){
            e.value=Number(input.replace(/[^0-9.]/g,""))||0;
          }else if(q.key==="category"){
            const validCats=conv.type==="vendor"?_VENDOR_CATS:_LEAD_CATS;
            const inp=input.trim().toLowerCase();
            const match=validCats.find(c=>c.toLowerCase()===inp)||validCats.find(c=>c.toLowerCase().startsWith(inp)||inp.startsWith(c.toLowerCase().split(" ")[0]))||validCats.find(c=>c.toLowerCase().includes(inp)||inp.includes(c.toLowerCase().replace(/ & /," ").split(" ")[0]));
            if(match){
              e.category=match;
            }else{
              e.category=input.trim();
              setPendingConv({...conv,entry:e,_awaitingNewCat:true});
              setMsgs([...history,{role:"assistant",content:`"${input.trim()}" isn't a recognised category. Add it as a new category?`}]);
              return;
            }
          }else if(q.key==="email"){
            const inp2=input.trim();
            // If it's a valid email, just use it
            if(/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(inp2)){
              e.email=_formatVal("email",inp2);
            }else if(conv._emailOptions){
              // User is picking from options (e.g. "1", "2", or the email itself)
              const pickNum=parseInt(inp2);
              if(pickNum>=1&&pickNum<=conv._emailOptions.length){e.email=_formatVal("email",conv._emailOptions[pickNum-1]);}
              else{const pickMatch=conv._emailOptions.find(o=>o.toLowerCase().includes(inp2.toLowerCase()));if(pickMatch)e.email=_formatVal("email",pickMatch);else e.email=_formatVal("email",inp2);}
              delete conv._emailOptions;
            }else{
              // Check for company hint: "works for X", "at X", "company is X", or just a company name
              const companyHint=inp2.match(/(?:works?\s+(?:for|at)|at|company\s+(?:is|=)|from)\s+(.+)/i);
              const hintName=companyHint?companyHint[1].trim():inp2;
              // Get domains from last search
              const ls=lastSearchRef.current;
              const allEmails=ls?._allEmails||[];
              const domains=ls?._domains||[];
              // Find domains matching the company hint
              const hintLower=hintName.toLowerCase().replace(/[^a-z0-9]/g,"");
              const matchDomains=domains.filter(d=>d.replace(/[^a-z0-9]/g,"").includes(hintLower)||hintLower.includes(d.split(".")[0].replace(/[^a-z0-9]/g,"")));
              // Also check allEmails for ones at matching domains
              const matchEmails=allEmails.filter(em=>{const d=em.split("@")[1]||"";return matchDomains.some(md=>d===md)||d.replace(/[^a-z0-9]/g,"").includes(hintLower);});
              if(matchDomains.length||matchEmails.length){
                // Generate likely email patterns for the contact name at the domain
                const contactName=(e.contact||e.name||"").trim();
                const firstName=(contactName.split(" ")[0]||"").toLowerCase();
                const lastName=(contactName.split(" ").slice(1).join(" ")||"").toLowerCase().replace(/\s+/g,"");
                const domain=matchDomains[0]||(matchEmails[0]||"").split("@")[1]||"";
                // Real scraped emails first, then pattern suggestions
                const suggestions=[...matchEmails];
                if(domain){
                  const patterns=[];
                  if(firstName)patterns.push(firstName+"@"+domain);
                  if(firstName&&lastName)patterns.push(firstName+"."+lastName+"@"+domain);
                  if(firstName&&lastName)patterns.push(firstName[0]+"."+lastName+"@"+domain);
                  if(firstName&&lastName)patterns.push(firstName[0]+lastName+"@"+domain);
                  if(lastName)patterns.push(lastName+"@"+domain);
                  patterns.forEach(p=>{if(!suggestions.includes(p))suggestions.push(p);});
                }
                // Deduplicate
                const unique=[...new Set(suggestions)];
                if(unique.length){
                  setPendingConv({...conv,entry:e,_emailOptions:unique});
                  const optList=unique.map((o,i)=>`${i+1}. ${o}`).join("\n");
                  setMsgs([...history,{role:"assistant",content:`Found options at ${domain||hintName}:\n\n${optList}\n\nReply with the number, or type the correct email.`}]);
                  return;
                }
              }
              // No domain match — treat as raw input
              e.email=_formatVal("email",inp2);
            }
          }else if(q.key==="website"){
            const inp2=input.trim();
            if(conv._websiteOptions){
              const pickNum=parseInt(inp2);
              if(pickNum>=1&&pickNum<=conv._websiteOptions.length){e.website=conv._websiteOptions[pickNum-1];}
              else{const pickMatch=conv._websiteOptions.find(o=>o.toLowerCase().includes(inp2.toLowerCase()));e.website=pickMatch||_formatVal("website",inp2);}
              delete conv._websiteOptions;
            }else{
              e.website=_formatVal("website",inp2);
            }
          }else{
            e[q.key]=_formatVal(q.key,input.trim());
            // Persist custom location to localStorage for future dropdown use
            if(q.key==="location"&&e[q.key]){
              const locs=conv.type==="vendor"?_VENDOR_LOCS:_LEAD_LOCS;
              if(!locs.includes(input.trim())){
                const locKey=conv.type==="vendor"?"onna_vendor_locs":"onna_lead_locs";
                _persistCustom(locKey,input.trim());
              }
            }
          }
        }
      }
      // ── Inline duplicate check after name/company/contact is answered ──
      if(!conv._skipDupCheck&&!conv.updateId&&(q?.key==="name"||q?.key==="company"||q?.key==="contact")&&!isSkip){
        const val=e[q.key]||"";
        if(val){
          const inlineMatches=findAllSimilar(val,allVendors,allLeads);
          if(inlineMatches.length>0){
            setPendingConv(null);
            setPendingDuplicate({entry:{...e,_type:conv.type},matches:inlineMatches,saveAsOutreach:conv.saveAsOutreach||false,_remainingConv:{...conv,entry:e,idx:conv.idx+1}});
            setMsgs([...history,{role:"assistant",content:_dupMsg(inlineMatches,val)}]);
            return;
          }
        }
      }
      const next=conv.idx+1;
      if(next>=conv.questions.length){
        setPendingConv(null);
        // If this Q&A was collecting details for an xContact (option 2), save it now
        if(conv._saveAsXContact){
          const xc=conv._saveAsXContact;
          const existing=getXContacts(xc.type,xc.id);
          const nc={name:e.contact||e.name||"",role:e.role||"",email:e.email||"",phone:e.phone||""};
          const updated=[...existing,nc];
          setXContacts(xc.type,xc.id,updated);
          showEntry({...xc.record,_xContacts:updated},xc.type,xc.id,conv.saveAsOutreach||false);
          setMsgs([...history,{role:"assistant",content:`Added ${nc.name||"new contact"} as a contact on ${xc.existName}. Review the card below.`}]);
          return;
        }
        // Company-based duplicate detection for new entries (skip if user already said "create separate")
        if(!conv._skipDupCheck&&!conv.updateId){
          const eName=conv.type==="vendor"?e.name:(e.contact||"");
          const eCompany=e.company||"";
          const nameMatches=findAllSimilar(eName,allVendors,allLeads);
          const compMatches=nameMatches.length===0&&eCompany?findAllSimilar(eCompany,allVendors,allLeads):[];
          const allDupMatches=[...nameMatches,...compMatches];
          // Deduplicate by id+type
          const seenIds=new Set();const dedupMatches=allDupMatches.filter(m=>{const k=m.type+"_"+m.record.id;if(seenIds.has(k))return false;seenIds.add(k);return true;});
          if(dedupMatches.length>0){
            const queryName=eName||eCompany;
            setPendingDuplicate({entry:{...e,_type:conv.type},matches:dedupMatches,saveAsOutreach:conv.saveAsOutreach||false});
            setMsgs([...history,{role:"assistant",content:`All filled in! But I found similar entries.\n\n${_dupMsg(dedupMatches,queryName)}`}]);
          }else{
            showEntry(e,conv.type,conv.updateId,conv.saveAsOutreach);
            setMsgs([...history,{role:"assistant",content:"All filled in! Review everything below and hit Save ✓"}]);
          }
        }else{
          showEntry(e,conv.type,conv.updateId,conv.saveAsOutreach);
          setMsgs([...history,{role:"assistant",content:"All filled in! Review everything below and hit Save ✓"}]);
        }
      }else{
        // When advancing to email question and company/name is known, search Outlook first
        const nextQ=conv.questions[next];
        const searchQuery=e.contact||e.name||"";
        if(nextQ.key==="email"&&searchQuery&&agent.id==="logistical"){
          setLoading(true);setMood("thinking");
          // Search by name first, then also by company if available — combine results
          const searchTerms=[searchQuery];
          if(e.company&&e.company.toLowerCase()!==searchQuery.toLowerCase())searchTerms.push(e.company);
          setMsgs([...history,{role:"assistant",content:`Searching Outlook for ${searchQuery}'s email…`}]);
          let allFoundEmails=[];let allDoms=[];let bestLead={};let bestPhone="";
          for(const term of searchTerms){
            const sr=await searchViaExt(term);
            if(sr.ok&&sr.lead){
              const sl=_stripOwn(sr.lead);
              if(sl.email&&/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(sl.email)&&!/onna/i.test(sl.email))allFoundEmails.push(sl.email);
              if(sl._allEmails)(sl._allEmails).filter(em=>!/onna/i.test(em)&&/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(em)).forEach(em=>allFoundEmails.push(em));
              if(sl._domains)(sl._domains).filter(d=>!/onna/i.test(d)).forEach(d=>allDoms.push(d));
              if(!bestPhone&&sl.phone&&/\d{4,}/.test(sl.phone)&&!/onna/i.test(sl.phone))bestPhone=sl.phone;
              if(!bestLead.email)bestLead=sl;
            }
          }
          setLoading(false);setMood("idle");
          if(bestLead)lastSearchRef.current={...bestLead,_type:conv.type,_query:searchQuery,_ts:Date.now()};
          // Also fill phone if available
          if(!e.phone&&bestPhone)e.phone=_formatVal("phone",bestPhone);
          // Only show REAL scraped emails — no generated guesses
          const contactName=searchQuery;
          const firstName=(contactName.split(" ")[0]||"").toLowerCase();
          const lastName=(contactName.split(" ").slice(1).join(" ")||"").toLowerCase().replace(/\s+/g,"");
          const compClean=(e.company||"").toLowerCase().replace(/[^a-z0-9]/g,"");
          // Deduplicate real emails only
          const unique=[...new Set(allFoundEmails)];
          // Score each email: higher = more likely to belong to this contact
          const _scoreEmail=(em)=>{
            let s=0;const local=em.split("@")[0].toLowerCase();const dom=em.split("@")[1]||"";
            if(firstName&&local.includes(firstName))s+=10;
            if(lastName&&local.includes(lastName))s+=8;
            if(compClean&&dom.replace(/[^a-z0-9]/g,"").includes(compClean))s+=5;
            if(compClean&&local.includes(compClean))s-=3; // company-wide email like info@, less likely personal
            if(/^(info|hello|contact|admin|office|sales|support|team|enquiries|bookings|studio)@/i.test(em))s-=4;
            return s;
          };
          unique.sort((a,b)=>_scoreEmail(b)-_scoreEmail(a));
          // Filter out emails that clearly don't belong to this person (score <= 0)
          const relevant=unique.filter(em=>_scoreEmail(em)>0);
          const finalEmails=relevant.length>0?relevant:unique;
          if(finalEmails.length===1&&_scoreEmail(finalEmails[0])>=15){
            // High-confidence single match — auto-fill but still show it
            e.email=_formatVal("email",finalEmails[0]);
            let skipIdx=next+1;
            while(skipIdx<conv.questions.length&&e[conv.questions[skipIdx].key])skipIdx++;
            if(skipIdx>=conv.questions.length){
              setPendingConv(null);
              // If xContact mode, save as secondary contact on parent record
              if(conv._saveAsXContact){
                const xc=conv._saveAsXContact;
                const existing=getXContacts(xc.type,xc.id);
                const nc={name:e.contact||e.name||"",role:e.role||"",email:e.email||"",phone:e.phone||""};
                const updated=[...existing,nc];
                setXContacts(xc.type,xc.id,updated);
                showEntry({...xc.record,_xContacts:updated},xc.type,xc.id,conv.saveAsOutreach||false);
                setMsgs([...history,{role:"assistant",content:`Found email: ${finalEmails[0]}. Added ${nc.name||"new contact"} as a contact on ${xc.existName}. Review below.`}]);
              }else{
              showEntry(e,conv.type,conv.updateId,conv.saveAsOutreach);
              setMsgs([...history,{role:"assistant",content:`Found ${searchQuery}'s email: ${finalEmails[0]}\n\nAll filled in! Review everything below and hit Save ✓`}]);
              }
            }else{
              setPendingConv({...conv,entry:e,idx:skipIdx});
              setMsgs([...history,{role:"assistant",content:`Found ${searchQuery}'s email: ${finalEmails[0]}\n\n${conv.questions[skipIdx].q} (or 'x' to skip)`}]);
            }
          }else if(finalEmails.length>0){
            // Multiple options or low confidence — let user choose
            setPendingConv({...conv,entry:e,idx:next,_emailOptions:finalEmails});
            const optList=finalEmails.map((o,i)=>`${i+1}. ${o}`).join("\n");
            setMsgs([...history,{role:"assistant",content:`Found possible emails for ${searchQuery}:\n\n${optList}\n\nReply with the number, type the correct email, or 'x' to skip.`}]);
          }else{
            setPendingConv({...conv,entry:e,idx:next});
            setMsgs([...history,{role:"assistant",content:`Couldn't find ${searchQuery}'s email in Outlook.\n\n${nextQ.q} (or 'x' to skip)`}]);
          }
        }else if(nextQ.key==="website"&&agent.id==="logistical"){
          // Auto-search for website using email domains, last search data, and company name
          const ls=lastSearchRef.current;
          const allDoms=[...(ls?._domains||[])].filter(d=>!/onna/i.test(d));
          const allEm=[...(ls?._allEmails||[])].filter(em=>!/onna/i.test(em));
          const compClean=(e.company||e.name||"").toLowerCase().replace(/[^a-z0-9]/g,"");
          // Extract unique domains from emails
          const emailDoms=[...new Set(allEm.map(em=>(em.split("@")[1]||"").toLowerCase()).filter(d=>d&&!/gmail|yahoo|hotmail|outlook|icloud|aol|protonmail|live|msn|me\.com/i.test(d)))];
          // Combine all domain sources
          const allCandidates=[...new Set([...allDoms,...emailDoms])];
          // Build website URLs from domains
          const websites=[];
          for(const d of allCandidates){
            const clean=d.replace(/^www\./i,"");
            if(clean)websites.push("www."+clean);
          }
          // Only use real scraped domains — no guesses
          // Score by relevance to company/contact name
          const _scoreWebsite=(w)=>{
            let s=0;const wClean=w.toLowerCase().replace(/[^a-z0-9]/g,"");
            if(compClean&&(wClean.includes(compClean)||compClean.includes(w.split(".").filter(p=>p!=="www"&&p!=="com"&&p!=="org"&&p!=="net"&&p!=="co"&&p!=="uk"&&p!=="io")[0]||"")))s+=10;
            const nameParts=(e.contact||e.name||"").toLowerCase().split(/\s+/);
            nameParts.forEach(p=>{if(p.length>=3&&wClean.includes(p))s+=5;});
            // Penalize generic/unrelated domains
            if(/google|microsoft|apple|facebook|twitter|linkedin|instagram/i.test(w))s-=10;
            return s;
          };
          const unique=[...new Set(websites)];
          unique.sort((a,b)=>_scoreWebsite(b)-_scoreWebsite(a));
          if(unique.length===1&&_scoreWebsite(unique[0])>=10){
            // High-confidence single match — auto-fill
            e.website=unique[0];
            let skipIdx=next+1;
            while(skipIdx<conv.questions.length&&e[conv.questions[skipIdx].key])skipIdx++;
            if(skipIdx>=conv.questions.length){
              setPendingConv(null);
              if(!_finishQA(conv,e,history,`Found website: ${unique[0]}`)){
                showEntry(e,conv.type,conv.updateId,conv.saveAsOutreach);
                setMsgs([...history,{role:"assistant",content:`Found website: ${unique[0]}\n\nAll filled in! Review everything below and hit Save ✓`}]);
              }
            }else{
              setPendingConv({...conv,entry:e,idx:skipIdx});
              setMsgs([...history,{role:"assistant",content:`Found website: ${unique[0]}\n\n${conv.questions[skipIdx].q} (or 'x' to skip)`}]);
            }
          }else if(unique.length>0){
            // Multiple options — let user choose
            setPendingConv({...conv,entry:e,idx:next,_websiteOptions:unique});
            const optList=unique.map((o,i)=>`${i+1}. ${o}`).join("\n");
            setMsgs([...history,{role:"assistant",content:`Found possible websites:\n\n${optList}\n\nReply with the number, type the correct website, or 'x' to skip.`}]);
          }else{
            setPendingConv({...conv,entry:e,idx:next});
            setMsgs([...history,{role:"assistant",content:nextQ.q+" (or 'x' to skip)"}]);
          }
        }else{
          setPendingConv({...conv,entry:e,idx:next});
          setMsgs([...history,{role:"assistant",content:nextQ.q+" (or 'x' to skip)"}]);
        }
      }
      return;
    }

    // ── Pending duplicate confirmation (must come before vendor/lead intent handlers) ──
    const _dupState=_pendingDupRef.current||pendingDuplicate;
    if(_dupState&&agent.id==="logistical"){
      const {entry,matches:dupMatches,similar,saveAsOutreach:dupSaveAsOutreach}=_dupState;
      // Support both old (similar) and new (matches) format
      const allMatches=dupMatches||(similar?[similar]:[]);
      const pick=input.trim();
      const pickNum=parseInt(pick);
      setMsgs(history);setInput("");setLoading(false);

      // ── Phase 1: Multiple matches — user picks which one ──
      if(allMatches.length>1&&!_dupState._selectedMatch){
        const noneIdx=allMatches.length+1;
        if(pickNum>=1&&pickNum<=allMatches.length){
          // User selected a match — now ask what to do with it
          const sel=allMatches[pickNum-1];
          const selName=sel.type==="vendor"?(sel.record.name||sel.record.company):(sel.record.contact||sel.record.company);
          setPendingDuplicate({..._dupState,_selectedMatch:sel});
          setMsgs([...history,{role:"assistant",content:`Selected: "${selName}" (${sel.type}).\n1. Update existing entry\n2. Add as new contact on this card\n3. None of these — create separate entry\n\nReply 1, 2, or 3.`}]);
        }else if(pickNum===noneIdx||/^(no|none|nope|new|different|create|separate)\b/i.test(pick)){
          // "None of these" — create new, skip duplicate detection
          const qname=entry._type==="vendor"?entry.name:entry.contact;
          const rc=_dupState._remainingConv;
          setPendingDuplicate(null);
          if(rc&&rc.idx<rc.questions.length){
            setPendingConv({...rc,_skipDupCheck:true});
            setMsgs([...history,{role:"assistant",content:`New entry for ${qname||"this contact"}. Continuing…\n\n${rc.questions[rc.idx].q} (or 'x' to skip)`}]);
          }else{
            // All fields filled — go straight to save card, no more duplicate checks
            showEntry(entry,entry._type,null,dupSaveAsOutreach||false);
            setMsgs([...history,{role:"assistant",content:`New entry for ${qname||"this contact"} — review and save below.`}]);
          }
        }else{
          // Invalid — re-show list
          const queryName=entry.contact||entry.name||entry.company||"";
          setMsgs([...history,{role:"assistant",content:_dupMsg(allMatches,queryName)}]);
        }
        setMood("idle");return;
      }

      // ── Phase 2: Single match or match already selected — pick action ──
      const chosen=_dupState._selectedMatch||allMatches[0];
      if(!chosen){setPendingDuplicate(null);setMood("idle");return;}
      const existName=chosen.type==="vendor"?(chosen.record.name||chosen.record.company):(chosen.record.contact||chosen.record.company);
      const is1=/^(1|yes|yep|yeah|sure|correct|right|that'?s? ?(them|him|her|it)?|update|them)\b/i.test(pick);
      const is2=/^(2|add\s*contact|add\s*new\s*contact|add\s*to)\b/i.test(pick);
      const is3=/^(3|no|nope|new|different|create|separate)\b/i.test(pick);
      if(is1){
        const merged={...chosen.record};
        for(const[k,v]of Object.entries(entry)){if(v&&k!=="_type"&&typeof v==="string"?v.trim():v)merged[k]=v;}
        setPendingDuplicate(null);
        const fq1=startConv(merged,chosen.type,dupSaveAsOutreach||false,chosen.record.id);
        setMsgs([...history,{role:"assistant",content:fq1?`Updating ${existName}. ${fq1} (or 'x' to skip)`:`Updating ${existName} — review below.`}]);
      }else if(is2){
        const contactName=entry.contact||entry.name||"new contact";
        setPendingDuplicate(null);
        const xContactFields=chosen.type==="vendor"
          ?[["email","Email address?"],["phone","Phone number?"],["role","Their role or title?"]]
          :[["role","Their role or title?"],["email","Email address?"],["phone","Phone number?"]];
        const xQs=xContactFields.filter(([k])=>!entry[k]).map(([k,q])=>({key:k,q}));
        if(xQs.length>0){
          const convData={entry:{...entry},type:chosen.type,saveAsOutreach:dupSaveAsOutreach||false,updateId:chosen.record.id,questions:xQs,idx:0,_saveAsXContact:{type:chosen.type,id:chosen.record.id,record:chosen.record,existName}};
          // If first xContact question is email, auto-search Outlook first
          if(xQs[0].key==="email"&&contactName){
            setPendingConv(convData);
            setLoading(true);setMood("thinking");
            setMsgs([...history,{role:"assistant",content:`Adding ${contactName} as a contact on ${existName}. Searching Outlook for their email…`}]);
            const xSearchTerms=[contactName];
            if(entry.company&&entry.company.toLowerCase()!==contactName.toLowerCase())xSearchTerms.push(entry.company);
            if(existName&&existName.toLowerCase()!==contactName.toLowerCase()&&(!entry.company||existName.toLowerCase()!==entry.company.toLowerCase()))xSearchTerms.push(existName);
            let xAllEmails=[];let xAllDoms=[];let xBestLead={};let xBestPhone="";
            for(const term of xSearchTerms){
              const sr=await searchViaExt(term);
              if(sr.ok&&sr.lead){
                const sl=_stripOwn(sr.lead);
                if(sl.email&&/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(sl.email)&&!/onna/i.test(sl.email))xAllEmails.push(sl.email);
                if(sl._allEmails)sl._allEmails.filter(em=>!/onna/i.test(em)&&/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(em)).forEach(em=>xAllEmails.push(em));
                if(sl._domains)sl._domains.filter(d=>!/onna/i.test(d)).forEach(d=>xAllDoms.push(d));
                if(!xBestPhone&&sl.phone&&/\d{4,}/.test(sl.phone)&&!/onna/i.test(sl.phone))xBestPhone=sl.phone;
                if(!xBestLead.email)xBestLead=sl;
              }
            }
            setLoading(false);setMood("idle");
            if(xBestLead)lastSearchRef.current={...xBestLead,_type:chosen.type,_query:contactName,_ts:Date.now()};
            const xEntry={...convData.entry};
            if(!xEntry.phone&&xBestPhone)xEntry.phone=_formatVal("phone",xBestPhone);
            const xUniqueEmails=[...new Set(xAllEmails)];
            const xFirstName=(contactName.split(" ")[0]||"").toLowerCase();
            const xLastName=(contactName.split(" ").slice(1).join(" ")||"").toLowerCase().replace(/\s+/g,"");
            const xCompClean=(entry.company||existName||"").toLowerCase().replace(/[^a-z0-9]/g,"");
            const _xScoreEm=(em)=>{let s=0;const loc=em.split("@")[0].toLowerCase();const dom=em.split("@")[1]||"";if(xFirstName&&loc.includes(xFirstName))s+=10;if(xLastName&&loc.includes(xLastName))s+=8;if(xCompClean&&dom.replace(/[^a-z0-9]/g,"").includes(xCompClean))s+=5;if(/^(info|hello|contact|admin|office|sales|support|team|enquiries|bookings|studio)@/i.test(em))s-=4;return s;};
            xUniqueEmails.sort((a,b)=>_xScoreEm(b)-_xScoreEm(a));
            // Filter out emails that clearly don't belong to this contact
            const xRelevant=xUniqueEmails.filter(em=>_xScoreEm(em)>0);
            const xFinal=xRelevant.length>0?xRelevant:xUniqueEmails;
            if(xFinal.length===1&&_xScoreEm(xFinal[0])>=15){
              xEntry.email=_formatVal("email",xFinal[0]);
              let skipIdx=1;while(skipIdx<xQs.length&&xEntry[xQs[skipIdx].key])skipIdx++;
              if(skipIdx>=xQs.length){
                setPendingConv(null);
                const existing=getXContacts(chosen.type,chosen.record.id);
                const nc={name:contactName,role:xEntry.role||"",email:xEntry.email||"",phone:xEntry.phone||""};
                const updated=[...existing,nc];
                setXContacts(chosen.type,chosen.record.id,updated);
                showEntry({...chosen.record,_xContacts:updated},chosen.type,chosen.record.id,dupSaveAsOutreach||false);
                setMsgs([...history,{role:"assistant",content:`Found email: ${xFinal[0]}. Added ${contactName} as a contact on ${existName}. Review below.`}]);
              }else{
                setPendingConv({...convData,entry:xEntry,idx:skipIdx});
                setMsgs([...history,{role:"assistant",content:`Found email: ${xFinal[0]}\n\n${xQs[skipIdx].q} (or 'x' to skip)`}]);
              }
            }else if(xFinal.length>0){
              setPendingConv({...convData,entry:xEntry,idx:0,_emailOptions:xFinal});
              const optList=xFinal.map((o,i)=>`${i+1}. ${o}`).join("\n");
              setMsgs([...history,{role:"assistant",content:`Adding ${contactName} as a contact on ${existName}.\n\nFound possible emails:\n\n${optList}\n\nReply with the number, type the correct email, or 'x' to skip.`}]);
            }else{
              setPendingConv({...convData,entry:xEntry});
              setMsgs([...history,{role:"assistant",content:`Adding ${contactName} as a contact on ${existName}. Couldn't find their email in Outlook.\n\n${xQs[0].q} (or 'x' to skip)`}]);
            }
          }else{
            setPendingConv(convData);
            setMsgs([...history,{role:"assistant",content:`Adding ${contactName} as a contact on ${existName}. Let me get their details.\n\n${xQs[0].q} (or 'x' to skip)`}]);
          }
        }else{
          const existing=getXContacts(chosen.type,chosen.record.id);
          const nc={name:contactName,role:entry.role||"",email:entry.email||"",phone:entry.phone||""};
          const updated=[...existing,nc];
          setXContacts(chosen.type,chosen.record.id,updated);
          showEntry({...chosen.record,_xContacts:updated},chosen.type,chosen.record.id,dupSaveAsOutreach||false);
          setMsgs([...history,{role:"assistant",content:`Added ${contactName} as a contact on ${existName}. Review the card below.`}]);
        }
      }else if(is3){
        const qname=entry._type==="vendor"?entry.name:entry.contact;
        const rc=_dupState._remainingConv;
        setPendingDuplicate(null);
        if(rc&&rc.idx<rc.questions.length){
          setPendingConv({...rc,_skipDupCheck:true});
          setMsgs([...history,{role:"assistant",content:`New entry for ${qname||"this contact"}. Continuing…\n\n${rc.questions[rc.idx].q} (or 'x' to skip)`}]);
        }else{
          // All fields filled — go straight to save card, no more duplicate checks
          showEntry(entry,entry._type,null,dupSaveAsOutreach||false);
          setMsgs([...history,{role:"assistant",content:`New entry for ${qname||"this contact"} — review and save below.`}]);
        }
      }else{
        setMsgs([...history,{role:"assistant",content:`Selected: "${existName}" (${chosen.type}).\n1. Update existing entry\n2. Add as new contact on this card\n3. None of these — create separate entry\n\nReply 1, 2, or 3.`}]);
      }
      setMood("idle");return;
    }

    // ── Shared: create project intent (all agents) ──
    if(onCreateProject&&pendingProjectCreate){
      if(pendingProjectCreate.step==="client"){
        const client=input.trim();
        if(!client){setMsgs([...history,{role:"assistant",content:"What's the client name?"}]);setInput("");setLoading(false);setMood("idle");return;}
        setPendingProjectCreate({step:"name",client});
        setMsgs([...history,{role:"assistant",content:`Client: **${client}**. What should the project be called?`}]);
        setInput("");setLoading(false);setMood("idle");return;
      }
      if(pendingProjectCreate.step==="name"){
        const projName=input.trim();
        if(!projName){setMsgs([...history,{role:"assistant",content:"What's the project name?"}]);setInput("");setLoading(false);setMood("idle");return;}
        try{
          const saved=await api.post("/api/projects",{client:pendingProjectCreate.client,name:projName,revenue:0,cost:0,status:"Active",year:new Date().getFullYear()});
          if(saved&&saved.id){onCreateProject(saved);setPendingProjectCreate(null);setMsgs([...history,{role:"assistant",content:`Project created: **${saved.client} — ${saved.name}**`}]);setInput("");setLoading(false);setMood("idle");return;}
        }catch(err){setMsgs([...history,{role:"assistant",content:`Failed to create project: ${err.message||"unknown error"}`}]);setInput("");setLoading(false);setMood("idle");setPendingProjectCreate(null);return;}
      }
    }
    if(onCreateProject&&/(?:create|new|start|set\s*up)\s+(?:a\s+)?project/i.test(input)){
      // Try to extract "called X for Y" or "for Y called X" patterns
      const m1=input.match(/project\s+(?:called|named)\s+["""]?(.+?)["""]?\s+for\s+["""]?(.+?)["""]?\s*$/i);
      const m2=input.match(/project\s+for\s+["""]?(.+?)["""]?\s+(?:called|named)\s+["""]?(.+?)["""]?\s*$/i);
      const m3=input.match(/project\s+["""](.+?)["""]\s+for\s+["""]?(.+?)["""]?\s*$/i);
      const m4=input.match(/project\s+for\s+["""]?(.+?)["""]?\s*$/i);
      let client=null,projName=null;
      if(m1){projName=m1[1].trim();client=m1[2].trim();}
      else if(m2){client=m2[1].trim();projName=m2[2].trim();}
      else if(m3){projName=m3[1].trim();client=m3[2].trim();}
      if(client&&projName){
        try{
          const saved=await api.post("/api/projects",{client,name:projName,revenue:0,cost:0,status:"Active",year:new Date().getFullYear()});
          if(saved&&saved.id){onCreateProject(saved);setMsgs([...history,{role:"assistant",content:`Project created: **${saved.client} — ${saved.name}**`}]);setInput("");setLoading(false);setMood("idle");return;}
        }catch(err){setMsgs([...history,{role:"assistant",content:`Failed to create project: ${err.message||"unknown error"}`}]);setInput("");setLoading(false);setMood("idle");return;}
      }else if(m4){
        // Got client only from "project for X"
        setPendingProjectCreate({step:"name",client:m4[1].trim()});
        setMsgs([...history,{role:"assistant",content:`Client: **${m4[1].trim()}**. What should the project be called?`}]);
        setInput("");setLoading(false);setMood("idle");return;
      }else{
        setPendingProjectCreate({step:"client"});
        setMsgs([...history,{role:"assistant",content:"Sure! What's the client name?"}]);
        setInput("");setLoading(false);setMood("idle");return;
      }
    }

    // ── Vinnie intent dispatcher ──
    if(agent.id==="logistical"){
      const _vinnieHandled=await handleVinnieIntent({
        input,history,agent,
        setMsgs,setInput,setLoading,setMood,
        setPendingConv,setPendingDuplicate,setPending,
        showEntry,buildQuestions,startConv,_dupMsg,
        searchViaExt,_stripOwn,
        findVendorOrLead,findAllSimilar,parseQuickEntry,detectFieldKey,
        lastSearchRef,api,
        allVendors,allLeads,
        onUpdateVendor,onUpdateLead,
      });
      if(_vinnieHandled)return;
    }

    // ── Connie intent dispatcher ──
    if(agent.id==="compliance"){
      const _connieHandled=await handleConnieIntent({
        input,history,intro,agent,
        setMsgs,setInput,setLoading,setMood,
        connieCtx,setConnieCtx,
        conniePending,setConniePending,
        connieDietMode,setConnieDietMode,
        connieDietPending,setConnieDietPending,
        conniePendingReview,setConniePendingReview,
        connieTabs,addConnieTab,setConnieTabs,
        callSheetStore,setCallSheetStore,
        dietaryStore,setDietaryStore,
        localProjects,
        fuzzyMatchProject,printCallSheetPDF,syncProjectInfoToDocs,
        popAgentUndo,projectInfoRef,
        vendorsProp,allLeads,
        CALLSHEET_INIT,DIETARY_INIT,DIETARY_TAGS,PRINT_CLEANUP_CSS,
        buildConnieSystem,applyConniePatch,buildConniePatchMarkers,
        api,
      });
      if(_connieHandled)return;
    }


    // ── Billie intent dispatcher ──
    if(agent.id==="billie"){
      const _billieHandled=await handleBillieIntent({
        input,history,intro,agent,
        setMsgs,setInput,setLoading,setMood,
        billieCtx,setBillieCtx,
        billieTabs,setBillieTabs,addBillieTab,
        setActiveEstimateVersion,
        projectEstimates,setProjectEstimates,
        projectActuals,setProjectActuals,
        localProjects,projectFileStore,
        fuzzyMatchProject,syncProjectInfoToDocs,
        popAgentUndo,projectInfoRef,onNavigateToDoc,
        loadPdfPages,
        ESTIMATE_INIT,defaultSections,
        estSectionTotal,estRowTotal,estCalcTotals,estNum,estFmt,
        actualsSectionExpenseTotal,actualsSectionZohoTotal,
        actualsRowExpenseTotal,actualsGrandExpenseTotal,actualsGrandZohoTotal,
        buildBillieSystem,applyBilliePatch,buildBilliePatchMarkers,
        billiePendingReview,setBilliePendingReview,
        buildFinnSystem,applyFinnPatch,
      });
      if(_billieHandled)return;
    }


    // ── Carrie intent dispatcher ──
    if(agent.id==="carrie"){
      const _carrieHandled=await handleCarrieIntent({
        input,history,intro,agent,
        setMsgs,setInput,setLoading,setMood,
        carrieCtx,setCarrieCtx,
        projectCasting,setProjectCasting,getProjectCastingTables,
        buildCarrieSystem,applyCarriePatch,
        exportCastingPDF,downloadCSV,
        vendorsProp,fuzzyMatchProject,localProjects,
      });
      if(_carrieHandled)return;
    }


    // ── Ronnie intent dispatcher ──
    if(agent.id==="researcher"){
      const _ronnieHandled=await handleRonnieIntent({
        input,history,intro,agent,
        setMsgs,setInput,setLoading,setMood,
        ronnieCtx,setRonnieCtx,
        ronniePendingReview,setRonniePendingReview,
        ronnieTabs,setRonnieTabs,addRonnieTab,
        setActiveRAVersion,
        riskAssessmentStore,setRiskAssessmentStore,
        localProjects,curAttachments,
        fuzzyMatchProject,printRiskAssessmentPDF,syncProjectInfoToDocs,
        popAgentUndo,projectInfoRef,onNavigateToDoc,
        RISK_ASSESSMENT_INIT,PRINT_CLEANUP_CSS,
        buildRonnieSystem,applyRonniePatch,buildPatchMarkers,
      });
      if(_ronnieHandled)return;
    }


    // ── Cody intent dispatcher ──
    if(agent.id==="contracts"){
      const _codyHandled=await handleCodyIntent({
        input,history,intro,agent,
        setMsgs,setInput,setLoading,setMood,
        codyCtx,setCodyCtx,
        codyPendingRef,
        codyTabs,setCodyTabs,addCodyTab,
        setActiveContractVersion,
        codyUploadedDoc,setCodyUploadedDoc,
        codySignPanel,setCodySignPanel,
        codyPickerPid,setCodyPickerPid,
        codyDocConfigRef,
        contractDocStore,setContractDocStore:codySetContractDocStore,
        localProjects,curAttachments,
        fuzzyMatchProject,syncProjectInfoToDocs,
        pushAgentUndo,popAgentUndo,projectInfoRef,onNavigateToDoc,
        loadPdfPages,processDocSignStamp,renderHtmlToDocPages,
        CONTRACT_INIT,migrateContract,CONTRACT_TYPE_IDS,CONTRACT_TYPE_LABELS,
        CONTRACT_FIELDS,CONTRACT_DOC_TYPES,GENERAL_TERMS_DOC,
        buildCodySystem,applyCodyPatch,
        PRINT_CLEANUP_CSS,
        api,
      });
      if(_codyHandled)return;
    }


        // ── Tina intent dispatcher ──
    if(agent.id==="tina"){
      const _tinaHandled=await handleTinaIntent({
        input,history,intro,system,agent,
        setMsgs,setInput,setLoading,setMood,
        tinaCtx,setTinaCtx,
        travelItineraryStore,setTravelItineraryStore,
        localProjects,fuzzyMatchProject,projectInfoRef,
      });
      if(_tinaHandled)return;
    }

        // ── Tabby intent dispatcher ──
    if(agent.id==="tabby"){
      const _tabbyHandled=await handleTabbyIntent({
        input,history,intro,system,agent,
        setMsgs,setInput,setLoading,setMood,
        tabbyCtx,setTabbyCtx,
        castingDeckStore,setCastingDeckStore,
        fittingStore,setFittingStore,
        castingTableStore,setCastingTableStore,
        localProjects,fuzzyMatchProject,projectInfoRef,
      });
      if(_tabbyHandled)return;
    }

        // ── Polly intent dispatcher ──
    if(agent.id==="polly"){
      const _pollyHandled=await handlePollyIntent({
        input,history,intro,system,agent,
        setMsgs,setInput,setLoading,setMood,
        pollyCtx,setPollyCtx,
        cpsStore,setCpsStore,
        shotListStore,setShotListStore,
        storyboardStore,setStoryboardStore,
        localProjects,fuzzyMatchProject,projectInfoRef,
      });
      if(_pollyHandled)return;
    }

        // ── Lillie intent dispatcher ──
    if(agent.id==="lillie"){
      const _lillieHandled=await handleLillieIntent({
        input,history,intro,system,agent,
        setMsgs,setInput,setLoading,setMood,
        lillieCtx,setLillieCtx,
        locDeckStore,setLocDeckStore,
        recceReportStore,setRecceReportStore,
        localProjects,fuzzyMatchProject,projectInfoRef,
      });
      if(_lillieHandled)return;
    }


    // ── Perry intent dispatcher ──
    if(agent.id==="perry"){
      const _perryHandled=await handlePerryIntent({
        input,history,intro,system,agent,
        setMsgs,setInput,setLoading,setMood,
        perryCtx,setPerryCtx,
        postProdStore,setPostProdStore,
        localProjects,fuzzyMatchProject,projectInfoRef,
      });
      if(_perryHandled)return;
    }

    // ── Project guard: agents that need a project must select one first ──
    if(_needsProj[agent.id]&&!docProjectId){
      const activeProjs=(localProjects||[]).filter(pr=>pr.status!=="Completed"&&pr.name&&!/^TEMPLATE/i.test(pr.name));
      let reply="Which project should I work on?";
      if(activeProjs.length>0) reply+="\n\n"+activeProjs.map((pr,i)=>`${i+1}. **${pr.client||""}** — ${pr.name}`).join("\n");
      else reply+="\n\nNo active projects found. Create one first in the Projects section.";
      setMsgs([...history,{role:"assistant",content:reply}]);
      setLoading(false);setMood("idle");return;
    }

    setMsgs(history);setInput("");setLoading(true);setMood("thinking");
    try{
      const apiMessages=history.map(m=>{
        if(m.role==="assistant")return{role:m.role,content:typeof m.content==="string"?m.content:""};
        if(m._attachments&&m._attachments.length){
          const blocks=[];
          m._attachments.forEach(att=>{const b64=att.dataUrl.split(",")[1];const mt=att.type||"image/jpeg";blocks.push({type:"image",source:{type:"base64",media_type:mt,data:b64}});});
          const txt=(m.content||"").replace(/\s*\[\d+ images?\]\s*$/,"").trim();
          if(txt)blocks.push({type:"text",text:txt});
          return{role:"user",content:blocks};
        }
        return{role:m.role,content:m.content};
      });
      const res=await fetch(`/api/agents/${agent.id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system,messages:apiMessages})});
      if(!res.ok){const e=await res.json().catch(()=>({error:`HTTP ${res.status}`}));setMsgs(p=>[...p,{role:"assistant",content:`Error: ${e.error||"Unknown"}`}]);setLoading(false);setMood("idle");return;}
      const reader=res.body.getReader();const decoder=new TextDecoder();let fullText="";let buffer="";
      while(true){const{done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split("\n");buffer=lines.pop()||"";for(const line of lines){if(!line.startsWith("data: "))continue;const raw=line.slice(6).trim();if(!raw||raw==="[DONE]")continue;try{const ev=JSON.parse(raw);if(ev.type==="content_block_delta"&&ev.delta?.type==="text_delta"){fullText+=ev.delta.text;setMsgs([...history,{role:"assistant",content:fullText}]);}}catch{}}}
      setMsgs([...history,{role:"assistant",content:fullText||"Hmm, something went wrong!"}]);
      setMood("excited");setTimeout(()=>setMood("idle"),2500);
    }catch(err){setMsgs(p=>[...p,{role:"assistant",content:`Oops! ${err.message}`}]);setMood("idle");}
    setLoading(false);
  };

  // ── Vinnie split-screen card ──────────────────────────────────────────────
  const { isVinnie: _isVinnie, hasVinnieCard: _hasVinnieCard } = useVinnieCard({ agent, isMobile, pendingConv, pendingLead, pendingType, pendingId, leadEdit, getXContacts });

  function _renderVinnieCard(){
    return <VendorVinnieCard
      agent={agent} isMobile={isMobile}
      pendingConv={pendingConv} setPendingConv={setPendingConv} pendingLead={pendingLead} pendingType={pendingType} pendingId={pendingId}
      leadEdit={leadEdit} setLeadEdit={setLeadEdit} setPending={setPending} showEntry={showEntry} saveLead={saveLead} savingLead={savingLead}
      setMsgs={setMsgs} getXContacts={getXContacts}
      _VENDOR_CATS={_VENDOR_CATS} _LEAD_CATS={_LEAD_CATS} _SOURCES={_SOURCES}
    />;
  }

  const _dragCounter=useRef(0);
  const _onDragEnter=useCallback(e=>{if(!_dragAgents.has(agent.id))return;e.preventDefault();_dragCounter.current++;setIsDragging(true);},[agent.id,_dragAgents]);
  const _onDragLeave=useCallback(e=>{e.preventDefault();_dragCounter.current--;if(_dragCounter.current<=0){_dragCounter.current=0;setIsDragging(false);}},[]);
  const _onDragOver=useCallback(e=>{if(!_dragAgents.has(agent.id))return;e.preventDefault();e.dataTransfer.dropEffect="copy";},[agent.id,_dragAgents]);
  const _onDrop=useCallback(e=>{e.preventDefault();_dragCounter.current=0;setIsDragging(false);if(!_dragAgents.has(agent.id))return;const files=Array.from(e.dataTransfer.files||[]);if(files.length)_handleDroppedFiles(files);},[agent.id,_dragAgents,_handleDroppedFiles]);

  if(!active)return null;
  return(<>
    {/* save modal — only on mobile or non-Vinnie agents */}
    {pendingLead&&!_hasVinnieCard&&createPortal(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",zIndex:201,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:500,maxHeight:"92vh",overflowY:"auto",padding:"24px",boxShadow:"0 24px 70px rgba(0,0,0,0.18)",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',Arial,sans-serif"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:16,borderBottom:"1px solid #e5e5ea"}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:15,color:"#1d1d1f"}}>{pendingId?(pendingType==="vendor"?"Update Vendor":"Update Lead"):(pendingType==="vendor"?"New Vendor":"New Lead")}</div>
              <div style={{fontSize:12,color:"#6e6e73",marginTop:2}}>Review, edit if needed, then save</div>
            </div>
            <button onClick={()=>setPending(null)} style={{background:"none",border:"none",fontSize:22,color:"#aeaeb2",cursor:"pointer",lineHeight:1,padding:"2px 6px"}}>×</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px 14px",marginBottom:20}}>
            {pendingType==="vendor"?<>
              {lf("Name","name")}
              {lf("Company","company")}
              {lf("Category","category",false,_VENDOR_CATS)}
              {lf("Email","email",false,null,"email")}
              {lf("Phone","phone",false,null,"tel")}
              {lf("Website","website")}
              {lf("Rate Card","rateCard")}
              {lf("Location","location")}
              {lf("Notes","notes",true)}
            </>:<>
              {lf("Contact Name","contact")}
              {lf("Company","company")}
              {lf("Role / Title","role")}
              {lf("Email","email",false,null,"email")}
              {lf("Phone","phone",false,null,"tel")}
              {lf("Category","category",false,_LEAD_CATS)}
              {lf("Status","status",false,[{value:"not_contacted",label:"Not Contacted"},{value:"cold",label:"Cold"},{value:"warm",label:"Warm"},{value:"open",label:"Open"}])}
              {lf("Est. Value (AED)","value",false,null,"number")}
              {lf("Date","date",false,null,"date")}
              {lf("Location","location")}
              {lf("Source","source",false,_SOURCES)}
              {lf("Notes","notes",true)}
            </>}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setPending(null)} style={{flex:1,padding:"11px",borderRadius:10,background:"#f5f5f7",border:"1px solid #e5e5ea",fontSize:13,fontWeight:600,color:"#6e6e73",cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
            <button onClick={saveLead} disabled={savingLead} style={{flex:2,padding:"11px",borderRadius:10,background:"#1d1d1f",border:"none",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>{savingLead?"Saving…":pendingId?"✓ Save Changes":pendingType==="vendor"?"✓ Save Vendor":"✓ Save to Pipeline"}</button>
          </div>
        </div>
      </div>
    ,document.body)}

    {/* Split-pane: Vinnie card + chat, OR doc preview + chat, OR just chat */}
    {_hasVinnieCard ? (
      <div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden"}}>
        <div style={{flex:"0 0 45%",borderRight:"1.5px solid #e5e5ea",overflow:"hidden",background:"#fff"}}>
          {_renderVinnieCard()}
        </div>
        <div style={{flex:"0 0 55%",display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden"}}>
          {_renderAgentChat()}
        </div>
      </div>
    ) : codySignPanel ? (
      <div style={{display:"flex",flexDirection:isMobile?"column":"row",flex:1,minHeight:0,overflow:"hidden"}}>
        <div style={{flex:isMobile?"none":"0 0 55%",height:isMobile?"40%":"auto",borderRight:isMobile?"none":"1.5px solid #e5e5ea",overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"10px 16px",borderBottom:"1px solid #e5e5ea",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:"#fafafa"}}>
            <span style={{fontSize:12,fontWeight:700,color:"#1d1d1f"}}>Sign & Stamp Preview</span>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button onClick={()=>exportDocPreview(codySignPanel.preview,codySignPanel.config.originalDoc)} style={{border:"1px solid #0066cc",background:"#fff",color:"#0066cc",borderRadius:6,padding:"4px 12px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Export PDF</button>
              <button onClick={()=>setCodySignPanel(null)} style={{background:"none",border:"none",fontSize:18,color:"#aeaeb2",cursor:"pointer",lineHeight:1,padding:"2px 6px"}}>×</button>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:16,background:"#f5f5f7"}}>
            <DocPreviewDraggable config={codySignPanel.config} onReprocess={async(newCfg)=>{codyDocConfigRef.current=newCfg;const result=await processDocSignStamp(newCfg.originalDoc,newCfg);setCodySignPanel({config:newCfg,preview:result});setMsgs(prev=>prev.map(m=>m._docConfig?{...m,_docPreview:result,_docConfig:newCfg}:m));}} onExport={(pi)=>exportDocPreview(codySignPanel.preview,codySignPanel.config.originalDoc,pi)}/>
          </div>
        </div>
        <div style={{flex:isMobile?"none":"0 0 45%",height:isMobile?"60%":"auto",display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden"}}>
          {_renderAgentChat()}
        </div>
      </div>
    ) : hasDocCtx ? (
      <div style={{display:"flex",flexDirection:isMobile?"column":"row",flex:1,minHeight:0,overflow:"hidden"}}>
        <div style={{flex:isMobile?"none":"0 0 50%",height:isMobile?"35%":"auto",borderRight:isMobile?"none":"1.5px solid #e5e5ea",borderBottom:isMobile?"1.5px solid #e5e5ea":"none",overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"6px 12px",borderBottom:"1px solid #e5e5ea",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:"#fafafa"}}>
            <span style={{fontSize:11,fontWeight:600,color:"#6e6e73",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{agent.id==="contracts"&&codyCtx?(()=>{const v=(contractDocStore?.[codyCtx.projectId]||[])[codyCtx.vIdx];return(v?.label||`Version ${(codyCtx.vIdx||0)+1}`)+" Preview";})():agent.id==="compliance"&&connieDietMode?"Dietary Preview":agent.id==="compliance"?"Call Sheet Preview":agent.id==="researcher"?"Risk Assessment Preview":agent.id==="billie"?"Estimate Preview":agent.id==="carrie"?"Casting Deck Preview":"Preview"}</span>
            <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
              {["contracts","compliance","researcher","billie"].includes(agent.id)&&<button onClick={()=>{if(popAgentUndo()){setMsgs(prev=>[...prev,{role:"assistant",content:"Undone! Reverted the last change."}]);}}} title="Undo (⌘Z)" style={{background:"none",border:"1px solid #e0e0e0",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:600,color:"#6e6e73",cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s"}} onMouseOver={e=>{e.currentTarget.style.borderColor="#6e6e73";}} onMouseOut={e=>{e.currentTarget.style.borderColor="#e0e0e0";}}>⌘Z</button>}
              {agent.id==="contracts"&&codyCtx&&<>
                <button onClick={()=>{const v=(contractDocStore?.[codyCtx.projectId]||[])[codyCtx.vIdx];const label=v?.label||`Version ${(codyCtx.vIdx||0)+1}`;if(!confirm(`Delete "${label}"?`))return;pushAgentUndo();setContractDocStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[codyCtx.projectId]||[];arr.splice(codyCtx.vIdx,1);store[codyCtx.projectId]=arr;return store;});const _delPid=codyCtx.projectId;const _delIdx=codyCtx.vIdx;setCodyTabs(prev=>{const next=prev.filter(t=>!(t.projectId===_delPid&&t.vIdx===_delIdx)).map(t=>t.projectId===_delPid&&t.vIdx>_delIdx?{...t,vIdx:t.vIdx-1}:t);if(next.length>0){setCodyCtx({projectId:next[0].projectId,vIdx:next[0].vIdx});if(setActiveContractVersion)setActiveContractVersion(next[0].vIdx);}else{setCodyCtx(null);if(setActiveContractVersion)setActiveContractVersion(null);}return next;});setMsgs(prev=>[...prev,{role:"assistant",content:`Deleted "${label}". ${codyTabs.length>1?"Switched to next contract.":"Say a project name to start again, or press ⌘Z to undo."}`}]);}} title="Delete" style={{background:"none",border:"1px solid #e0e0e0",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:600,color:"#ff3b30",cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s"}} onMouseOver={e=>{e.currentTarget.style.borderColor="#ff3b30";e.currentTarget.style.background="#fff5f5";}} onMouseOut={e=>{e.currentTarget.style.borderColor="#e0e0e0";e.currentTarget.style.background="none";}}>Delete</button>
              </>}
              <button onClick={()=>{if(agent.id==="compliance"){setConnieCtx(null);setConnieDietMode(null);}else if(agent.id==="researcher"){setRonnieCtx(null);}else if(agent.id==="contracts"){setCodyCtx(null);}else if(agent.id==="billie"){setBillieCtx(null);}else if(agent.id==="carrie"){setCarrieCtx(null);}}} title="Close preview" style={{background:"none",border:"1px solid #e0e0e0",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:600,color:"#6e6e73",cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s",lineHeight:1}} onMouseOver={e=>{e.currentTarget.style.borderColor="#6e6e73";e.currentTarget.style.background="#f0f0f2";}} onMouseOut={e=>{e.currentTarget.style.borderColor="#e0e0e0";e.currentTarget.style.background="none";}}>✕</button>
            </div>
          </div>
          <div style={{flex:1,overflow:"auto"}}>
          <AgentDocPreview agentId={agent.id} projectId={docProjectId}
            callSheetStore={callSheetStore} setCallSheetStore={agent.id==="compliance"?undoSetCallSheetStore:setCallSheetStore} activeCSVersion={agent.id==="compliance"&&connieCtx&&connieCtx.vIdx!=null?connieCtx.vIdx:activeCSVersion}
            riskAssessmentStore={riskAssessmentStore} setRiskAssessmentStore={agent.id==="researcher"?undoSetRiskAssessmentStore:setRiskAssessmentStore} activeRAVersion={agent.id==="researcher"&&ronnieCtx&&ronnieCtx.vIdx!=null?ronnieCtx.vIdx:activeRAVersion}
            contractDocStore={contractDocStore} setContractDocStore={agent.id==="contracts"?codySetContractDocStore:setContractDocStore} activeContractVersion={activeContractVersion}
            projectEstimates={projectEstimates} setProjectEstimates={agent.id==="billie"?undoSetProjectEstimates:setProjectEstimates} activeEstimateVersion={activeEstimateVersion}
            pushUndo={pushUndo}
            ronniePendingReview={ronniePendingReview} setRonniePendingReview={setRonniePendingReview}
            conniePendingReview={conniePendingReview} setConniePendingReview={setConniePendingReview}
            billiePendingReview={billiePendingReview} setBilliePendingReview={setBilliePendingReview}
            onBillieReviewDone={()=>{setMsgs(prev=>[...prev,{role:"assistant",content:"✓ Review complete — estimate changes saved."}]);}}
            onConnieReviewDone={()=>{setMsgs(prev=>[...prev,{role:"assistant",content:"✓ Review complete — call sheet changes saved."}]);}}
            onRonnieReviewDone={(meta)=>{
              setMsgs(prev=>[...prev,{role:"assistant",content:"✓ Review complete — changes saved."}]);
            }}
            connieMode={agent.id==="compliance"&&connieDietMode?"dietary":null}
            dietaryStore={dietaryStore} setDietaryStore={setDietaryStore}
            onDietarySelect={(idx)=>{setConnieDietMode(null);const proj=localProjects?.find(p=>p.id===docProjectId);if(proj&&onNavigateToDoc){onNavigateToDoc(proj,"Documents","dietaries",{dietaryIdx:idx});}}}
            projectInfoRef={projectInfoRef}/>
          </div>
        </div>
        <div style={{flex:isMobile?"none":"0 0 50%",height:isMobile?"65%":"auto",display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden"}}>
          {_renderAgentChat()}
        </div>
      </div>
    ) : _renderAgentChat()}
  </>);

  function _renderAgentChat() { return (<>
    <ConnieTabBar agent={agent} connieTabs={connieTabs} setConnieTabs={setConnieTabs} connieCtx={connieCtx} setConnieCtx={setConnieCtx} connieDietMode={connieDietMode} setConnieDietMode={setConnieDietMode} callSheetStore={callSheetStore} setCallSheetStore={setCallSheetStore} onArchiveCallSheet={onArchiveCallSheet} csCreateMenuConnie={csCreateMenuConnie} setCsCreateMenuConnie={setCsCreateMenuConnie} csCreateBtnRef={csCreateBtnRef} localProjects={localProjects} setMsgs={setMsgs} projectInfoRef={projectInfoRef} addConnieTab={addConnieTab} onOpenDuplicateCS={onOpenDuplicateCS} CALLSHEET_INIT={CALLSHEET_INIT} />

    <RonnieTabBar agent={agent} ronnieTabs={ronnieTabs} setRonnieTabs={setRonnieTabs} ronnieCtx={ronnieCtx} setRonnieCtx={setRonnieCtx} riskAssessmentStore={riskAssessmentStore} setRiskAssessmentStore={setRiskAssessmentStore} onArchiveCallSheet={onArchiveCallSheet} raCreateMenuRonnie={raCreateMenuRonnie} setRaCreateMenuRonnie={setRaCreateMenuRonnie} raCreateBtnRef={raCreateBtnRef} localProjects={localProjects} setMsgs={setMsgs} projectInfoRef={projectInfoRef} addRonnieTab={addRonnieTab} setActiveRAVersion={setActiveRAVersion} onOpenDuplicateRA={onOpenDuplicateRA} RISK_ASSESSMENT_INIT={RISK_ASSESSMENT_INIT} />

    {/* Cody tab bar */}
    {agent.id==="contracts"&&codyTabs.length>0&&(
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"#fafafa",borderBottom:"1px solid #e5e5ea",overflowX:"auto",whiteSpace:"nowrap",flexShrink:0}}>
        {codyTabs.map((tab,i)=>{
          const isActive=codyCtx&&codyCtx.projectId===tab.projectId&&codyCtx.vIdx===tab.vIdx;
          const _ctVs=contractDocStore?.[tab.projectId]||[];
          const _ctV=_ctVs[tab.vIdx];
          const _ctProj=localProjects?.find(p=>p.id===tab.projectId);
          const _ctDynLabel=_ctProj?`${_ctProj.name} · ${_ctV?.label||CONTRACT_TYPE_LABELS[_ctV?.contractType]||`Version ${tab.vIdx+1}`}`:tab.label;
          return(
            <div key={`${tab.projectId}-${tab.vIdx}`} onClick={()=>{if(!isActive){setCodyCtx({projectId:tab.projectId,vIdx:tab.vIdx});if(setActiveContractVersion)setActiveContractVersion(tab.vIdx);setMsgs(prev=>[...prev,{role:"assistant",content:`Switched to ${_ctDynLabel}.`}]);}}} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:8,fontSize:12,fontWeight:600,fontFamily:"inherit",cursor:"pointer",border:isActive?"1px solid #8a6abf":"1px solid #e0e0e0",background:isActive?"#f5f0ff":"#f5f5f7",color:isActive?"#4a2a7a":"#6e6e73",borderBottom:isActive?"2px solid #8a6abf":"2px solid transparent",transition:"all 0.15s",flexShrink:0}}>
              <span>{_ctDynLabel}</span>
              <span onClick={e=>{e.stopPropagation();if(!confirm("Delete this contract? It will be moved to trash."))return;const pid=tab.projectId;const vidx=tab.vIdx;const ctData=(contractDocStore?.[pid]||[])[vidx];if(ctData&&onArchiveCallSheet)onArchiveCallSheet('contracts',{projectId:pid,contract:JSON.parse(JSON.stringify(ctData))});pushAgentUndo();setContractDocStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[pid]||[];arr.splice(vidx,1);store[pid]=arr;return store;});setCodyTabs(prev=>{const next=prev.filter((_,j)=>j!==i).map(t=>t.projectId===pid&&t.vIdx>vidx?{...t,vIdx:t.vIdx-1}:t);if(isActive){if(next.length>0){const switchTo=next[0];setCodyCtx({projectId:switchTo.projectId,vIdx:switchTo.vIdx});if(setActiveContractVersion)setActiveContractVersion(switchTo.vIdx);setMsgs(p=>[...p,{role:"assistant",content:`Deleted and switched to ${switchTo.label}.`}]);}else{setCodyCtx(null);if(setActiveContractVersion)setActiveContractVersion(null);setMsgs(p=>[...p,{role:"assistant",content:"Contract deleted. Pick a project to start a new one!"}]);}}return next;});}} style={{marginLeft:2,cursor:"pointer",opacity:0.5,fontSize:11,lineHeight:1}}>×</span>
            </div>
          ); })}
        <div style={{flexShrink:0}}>
          <div ref={ctCreateBtnRefCody} onClick={()=>setCtCreateMenuCody(prev=>!prev)} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:8,border:"1.5px dashed #ccc",background:"transparent",fontSize:14,color:"#999",cursor:"pointer",fontFamily:"inherit"}}>+</div>
          {ctCreateMenuCody&&<div onClick={()=>setCtCreateMenuCody(false)} style={{position:"fixed",inset:0,zIndex:9998}} />}
          {ctCreateMenuCody&&(()=>{const _r=ctCreateBtnRefCody.current?.getBoundingClientRect();return(
            <div style={{position:"fixed",top:(_r?.bottom||0)+4,left:_r?.left||0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:220,overflow:"hidden"}}>
              {CONTRACT_TYPE_IDS.map(typeId=>(
                <div key={typeId} onClick={()=>{setCtCreateMenuCody(false);const _pid=codyCtx?.projectId||codyTabs[codyTabs.length-1]?.projectId;if(_pid){const proj=localProjects?.find(p=>p.id===_pid);if(proj){codyPendingRef.current={projectId:_pid,step:"pick_name",typeId};setMsgs(prev=>[...prev,{role:"assistant",content:`Great — ${CONTRACT_TYPE_LABELS[typeId]} for ${proj.name}.\n\nWhat should we call this contract? (e.g. "Jane Doe" or "Director Agreement")`}]);}}}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ {CONTRACT_TYPE_LABELS[typeId]}</div>
              ))}
            </div>);})()}
        </div>
      </div>
    )}

    {/* Billie tab bar */}
    {agent.id==="billie"&&billieTabs.length>0&&(
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"#fafafa",borderBottom:"1px solid #e5e5ea",overflowX:"auto",whiteSpace:"nowrap",flexShrink:0}}>
        {billieTabs.map((tab,i)=>{
          const isActive=billieCtx&&billieCtx.projectId===tab.projectId&&billieCtx.vIdx===tab.vIdx;
          const _bEstVs=projectEstimates?.[tab.projectId]||[];
          const _bEstV=_bEstVs[tab.vIdx];
          const _bProj=localProjects?.find(p=>p.id===tab.projectId);
          const _bDynLabel=_bProj?`${_bProj.name} · ${_bEstV?.ts?.version||`V${tab.vIdx+1}`}`:tab.label;
          return(
            <div key={`${tab.projectId}-${tab.vIdx}`} onClick={()=>{if(!isActive){setBillieCtx({projectId:tab.projectId,vIdx:tab.vIdx});if(setActiveEstimateVersion)setActiveEstimateVersion(tab.vIdx);setMsgs(prev=>[...prev,{role:"assistant",content:`Switched to ${_bDynLabel}.`}]);}}} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:8,fontSize:12,fontWeight:600,fontFamily:"inherit",cursor:"pointer",border:isActive?"1px solid #7ab87a":"1px solid #e0e0e0",background:isActive?"#f3fff3":"#f5f5f7",color:isActive?"#1a5a1a":"#6e6e73",borderBottom:isActive?"2px solid #7ab87a":"2px solid transparent",transition:"all 0.15s",flexShrink:0}}>
              <span>{_bDynLabel}</span>
              <span onClick={e=>{e.stopPropagation();if(!confirm("Delete this estimate? It will be moved to trash."))return;const pid=tab.projectId;const vIdx=tab.vIdx;const estData=(projectEstimates?.[pid]||[])[vIdx];if(estData&&onArchiveCallSheet)onArchiveCallSheet('estimates',{projectId:pid,estimate:JSON.parse(JSON.stringify(estData))});setProjectEstimates(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[pid]||[];arr.splice(vIdx,1);store[pid]=arr;return store;});setBillieTabs(prev=>{const next=prev.filter((_,j)=>j!==i).map(t=>t.projectId===pid&&t.vIdx>vIdx?{...t,vIdx:t.vIdx-1}:t);if(isActive){if(next.length>0){const switchTo=next[0];setBillieCtx({projectId:switchTo.projectId,vIdx:switchTo.vIdx});if(setActiveEstimateVersion)setActiveEstimateVersion(switchTo.vIdx);setMsgs(p=>[...p,{role:"assistant",content:`Deleted and switched to ${switchTo.label}.`}]);}else{setBillieCtx(null);setMsgs(p=>[...p,{role:"assistant",content:"Estimate deleted. Pick a project to start a new one!"}]);}}return next;});}} style={{marginLeft:2,cursor:"pointer",opacity:0.5,fontSize:11,lineHeight:1}}>×</span>
            </div>
          ); })}
        <div onClick={()=>{const _pid=billieCtx?.projectId||billieTabs[billieTabs.length-1]?.projectId;if(_pid){const proj=localProjects?.find(p=>p.id===_pid);if(proj){const _curVs=projectEstimates?.[proj.id]||[];const _autoLbl=`V${_curVs.length+1}`;const ne={...JSON.parse(JSON.stringify(ESTIMATE_INIT)),id:Date.now()};const _pi5=(projectInfoRef.current||{})[proj.id];ne.ts={...ne.ts,version:_autoLbl,client:proj.client||"",project:_pi5?.shootName||proj.name||""};setProjectEstimates(prev=>({...prev,[proj.id]:[...(prev[proj.id]||[]),ne]}));const newIdx=_curVs.length;setBillieCtx({projectId:proj.id,vIdx:newIdx});if(setActiveEstimateVersion)setActiveEstimateVersion(newIdx);addBillieTab(proj.id,newIdx,`${proj.name} · ${_autoLbl}`);setMsgs(prev=>[...prev,{role:"assistant",content:`Created ${_autoLbl} for ${proj.name}. What would you like to do?`}]);}}}} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:8,border:"1.5px dashed #ccc",background:"transparent",fontSize:14,color:"#999",cursor:"pointer",flexShrink:0,fontFamily:"inherit"}}>+</div>
      </div>
    )}

        {/* inline chat messages */}
    <div ref={chatRef} onDragEnter={_onDragEnter} onDragLeave={_onDragLeave} onDragOver={_onDragOver} onDrop={_onDrop} style={{flex:1,overflowY:"auto",padding:"14px 16px",background:"white",minHeight:0,position:"relative"}}>
      {isDragging&&_dragAgents.has(agent.id)&&<div style={{position:"absolute",inset:0,zIndex:10,background:"rgba(255,255,255,0.85)",border:"2px dashed #7ab87a",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}><div style={{fontSize:14,fontWeight:600,color:"#4a8a4a",fontFamily:"inherit"}}>Drop files here</div></div>}
      {msgs.map((m,i)=>(<div key={i}>
          <_AgentBubble msg={m} codyDocConfigRef={codyDocConfigRef} setMsgs={setMsgs} codySignPanel={codySignPanel} setCodySignPanel={setCodySignPanel}/>
        </div>))}
      {loading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{background:"#f5f5f7",border:"1px solid #e5e5ea",borderRadius:"6px 16px 16px 16px"}}><_AgentDots color="#6e6e73"/></div></div>}
    </div>

    {/* Q&A bubbles: options + skip + back */}
    {pendingConv&&!pendingConv._awaitingNewCat&&!pendingConv._awaitingTypeChoice&&!pendingConv._awaitingUpdateName&&pendingConv.questions[pendingConv.idx]&&(
      <div style={{display:"flex",flexWrap:"wrap",gap:5,padding:"8px 12px 2px",background:"white",borderTop:"1px solid #f2f2f7",flexShrink:0}}>
        {pendingConv.questions[pendingConv.idx]?.options&&pendingConv.questions[pendingConv.idx].options.map(opt=>(
          <button key={opt} type="button" onClick={()=>{setInput(opt);setTimeout(send,0);}} style={{padding:"5px 10px",borderRadius:8,border:"1px solid #e5e5ea",background:"#f5f5f7",fontSize:11.5,fontWeight:500,color:"#1d1d1f",cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s"}} onMouseOver={e=>{e.currentTarget.style.background="#e8e8ed";e.currentTarget.style.borderColor="#c7c7cc";}} onMouseOut={e=>{e.currentTarget.style.background="#f5f5f7";e.currentTarget.style.borderColor="#e5e5ea";}}>
            {opt}
          </button>
        ))}
        {pendingConv.questions[pendingConv.idx]?.addNew&&(
          <button type="button" onClick={()=>{setInput("");setMsgs(prev=>[...prev,{role:"assistant",content:`Type a new ${pendingConv.questions[pendingConv.idx].key} below and press Enter.`}]);const ta=document.querySelector('[data-vinnie-ta]');if(ta){ta.focus();ta.placeholder="Type new "+pendingConv.questions[pendingConv.idx].key+"...";}}} style={{padding:"5px 10px",borderRadius:8,border:"1px dashed #d4aa20",background:"#fffef5",fontSize:11.5,fontWeight:600,color:"#7a5800",cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s"}} onMouseOver={e=>{e.currentTarget.style.background="#fef3c0";}} onMouseOut={e=>{e.currentTarget.style.background="#fffef5";}}>
            + Add New
          </button>
        )}
        <button type="button" onClick={()=>{setInput("skip");setTimeout(send,0);}} style={{padding:"5px 10px",borderRadius:8,border:"1px solid #e5e5ea",background:"#f5f5f7",fontSize:11.5,fontWeight:500,color:"#86868b",cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s"}} onMouseOver={e=>{e.currentTarget.style.background="#e8e8ed";}} onMouseOut={e=>{e.currentTarget.style.background="#f5f5f7";}}>
          Skip
        </button>
        {pendingConv.idx>0&&(
          <button type="button" onClick={()=>{setInput("back");setTimeout(send,0);}} style={{padding:"5px 10px",borderRadius:8,border:"1px solid #e5e5ea",background:"#f5f5f7",fontSize:11.5,fontWeight:500,color:"#86868b",cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s"}} onMouseOver={e=>{e.currentTarget.style.background="#e8e8ed";}} onMouseOut={e=>{e.currentTarget.style.background="#f5f5f7";}}>
            ← Back
          </button>
        )}
      </div>
    )}
    {/* Agent quick-action bubbles */}
    {(()=>{
      const _bubbleMap={
        logistical:[{label:"➕ Add Vendor",value:"1"},{label:"📞 Log Outreach",value:"2"},{label:"🔍 Search Contacts",value:"3"}],
        compliance:[{label:"✏️ Edit Call Sheet",value:"1"},{label:"✅ Review & Check",value:"2"},{label:"🍽️ Dietary & Catering",value:"3"}],
        researcher:[{label:"⚠️ Add Risks",value:"1"},{label:"✅ Review Assessment",value:"2"},{label:"📄 Generate Report",value:"3"}],
        billie:[{label:"💰 Build & Edit Budget",value:"1"},{label:"💳 Log Expenses",value:"2"},{label:"📊 Review & Compare",value:"3"}],
        contracts:[{label:"📋 Live Contracts",value:"1"},{label:"✍️ Generate Document",value:"2"},{label:"🖊️ Sign & Stamp",value:"3"}],

        carrie:[{label:"🎭 Add Talent",value:"1"},{label:"🔍 Search & Brief",value:"2"},{label:"📄 Review & Export",value:"3"}],
      };
      const bubbles=_bubbleMap[agent.id];
      if(!bubbles||loading||pendingConv)return null;
      const lastMsg=msgs.length>0?msgs[msgs.length-1]:null;
      if(!lastMsg||lastMsg.role!=="assistant")return null;
      if(!/Here's what I can do|What do you need\?|which project/i.test(lastMsg.content||""))return null;
      return(
        <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"8px 12px 2px",background:"white",borderTop:"1px solid #f2f2f7",flexShrink:0}}>
          {bubbles.map(opt=>(
            <button key={opt.value} type="button" onClick={()=>{setInput(opt.value);setTimeout(send,0);}} style={{padding:"6px 14px",borderRadius:10,border:"1px solid #e5e5ea",background:"#f5f5f7",fontSize:12,fontWeight:600,color:"#1d1d1f",cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s"}} onMouseOver={e=>{e.currentTarget.style.background="#e8e8ed";e.currentTarget.style.borderColor="#c7c7cc";}} onMouseOut={e=>{e.currentTarget.style.background="#f5f5f7";e.currentTarget.style.borderColor="#e5e5ea";}}>
              {opt.label}
            </button>
          ))}
        </div>
      );
    })()}
    {/* uploaded doc preview for Cody */}
    {agent.id==="contracts"&&codyUploadedDoc&&<div style={{padding:"6px 12px 0",background:"white",display:"flex",gap:6,alignItems:"center"}}>
      <div style={{display:"flex",gap:4,alignItems:"center",background:"#f0f4ff",border:"1px solid #c8d8f0",borderRadius:8,padding:"4px 10px"}}>
        <span style={{fontSize:16}}>📄</span>
        <span style={{fontSize:11,fontWeight:600,color:"#333",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{codyUploadedDoc.name}</span>
        <span style={{fontSize:10,color:"#666"}}>{codyUploadedDoc.pages.length}p</span>
        <button onClick={()=>{setCodyUploadedDoc(null);setCodySignPanel(null);}} style={{background:"none",border:"none",color:"#999",cursor:"pointer",fontSize:14,padding:"0 2px",lineHeight:1}}>×</button>
      </div>
    </div>}
    {/* attachment previews */}
    {attachments.length>0&&<div style={{padding:"6px 12px 0",display:"flex",gap:6,flexWrap:"wrap",background:"white"}}>
      {attachments.map((att,ai)=><div key={ai} style={{position:"relative",width:48,height:48,borderRadius:6,overflow:"hidden",border:"1px solid #e5e5ea"}}>
        <img src={att.dataUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <button onClick={()=>setAttachments(prev=>prev.filter((_,j)=>j!==ai))} style={{position:"absolute",top:-2,right:-2,background:"rgba(0,0,0,0.6)",color:"#fff",border:"none",borderRadius:"50%",width:16,height:16,fontSize:10,cursor:"pointer",lineHeight:"14px",textAlign:"center"}}>×</button>
      </div>)}
    </div>}
    {/* inline input bar */}
    <div style={{padding:"10px 12px",background:"white",borderTop:pendingConv&&pendingConv.questions[pendingConv.idx]?.options?"none":"1px solid #f2f2f7",display:"flex",gap:8,flexShrink:0}}>
      {(agent.id==="compliance"||agent.id==="researcher")&&<Fragment><button onClick={()=>attachRef.current?.click()} style={{background:"none",border:"1.5px solid #e5e5ea",borderRadius:12,padding:"0 10px",cursor:"pointer",fontSize:18,color:"#6e6e73",alignSelf:"stretch",minWidth:38,transition:"all 0.12s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#6e6e73";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e5e5ea";}}>📎</button><input ref={attachRef} type="file" accept="image/*" multiple onChange={e=>{const files=Array.from(e.target.files||[]);files.forEach(f=>{const reader=new FileReader();reader.onload=ev=>{setAttachments(prev=>[...prev,{name:f.name,type:f.type,dataUrl:ev.target.result}]);};reader.readAsDataURL(f);});e.target.value="";}} style={{display:"none"}}/></Fragment>}
      {agent.id==="billie"&&<Fragment><button onClick={()=>billieAttachRef.current?.click()} style={{background:"none",border:"1.5px solid #e5e5ea",borderRadius:12,padding:"0 10px",cursor:"pointer",fontSize:18,color:"#6e6e73",alignSelf:"stretch",minWidth:38,transition:"all 0.12s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#6e6e73";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e5e5ea";}}>📎</button><input ref={billieAttachRef} type="file" accept="image/*,application/pdf,.pdf" multiple onChange={async e=>{const files=Array.from(e.target.files||[]);e.target.value="";for(const f of files){const isPdf=f.type==="application/pdf"||f.name.toLowerCase().endsWith(".pdf");const reader=new FileReader();const dataUrl=await new Promise((res,rej)=>{reader.onload=ev=>res(ev.target.result);reader.onerror=rej;reader.readAsDataURL(f);});if(isPdf){try{const pages=await loadPdfPages(dataUrl);const capped=pages.slice(0,10);if(pages.length>10)setMsgs(prev=>[...prev,{role:"assistant",content:`PDF has ${pages.length} pages — using first 10 for analysis.`}]);capped.forEach((pg,i)=>{setAttachments(prev=>[...prev,{name:`${f.name}_p${i+1}`,type:"image/jpeg",dataUrl:pg}]);});}catch(err){setMsgs(prev=>[...prev,{role:"assistant",content:`Failed to load PDF: ${err.message}`}]);}}else{setAttachments(prev=>[...prev,{name:f.name,type:f.type,dataUrl}]);}}}} style={{display:"none"}}/></Fragment>}
      {agent.id==="contracts"&&<Fragment><label style={{background:"none",border:"1.5px solid #e5e5ea",borderRadius:12,padding:"0 10px",cursor:"pointer",fontSize:18,color:"#6e6e73",alignSelf:"stretch",minWidth:38,transition:"all 0.12s",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#6e6e73";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e5e5ea";}}>📎<input type="file" accept="application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;e.target.value="";const isPdf=f.type==="application/pdf"||f.name.toLowerCase().endsWith(".pdf");const isDocx=f.name.toLowerCase().endsWith(".docx")||f.name.toLowerCase().endsWith(".doc")||f.type==="application/vnd.openxmlformats-officedocument.wordprocessingml.document"||f.type==="application/msword";const isImg=f.type.startsWith("image/");try{if(isPdf){const reader=new FileReader();reader.onload=async ev=>{try{const pages=await loadPdfPages(ev.target.result);codyDocConfigRef.current=null;setCodyUploadedDoc({name:f.name,type:"application/pdf",pages});setMsgs(prev=>[...prev,{role:"user",content:`📄 Uploaded: ${f.name} (${pages.length} page${pages.length>1?"s":""})`},{role:"assistant",content:`Got it! I've loaded "${f.name}" (${pages.length} page${pages.length>1?"s":""}). What would you like me to do?\n\n• "Sign this" — add signature (last page by default)\n• "Stamp all pages" — add stamp to every page\n• "Sign and stamp on company letterhead"\n• "Sign page 3" — apply to a specific page\n• After applying: "Move signature up" / "Move stamp down"`}]);}catch(err){setMsgs(prev=>[...prev,{role:"assistant",content:`Failed to load PDF: ${err.message}`}]);}};reader.readAsDataURL(f);}else if(isDocx){setMsgs(prev=>[...prev,{role:"user",content:`📄 Uploaded: ${f.name}`},{role:"assistant",content:`Loading Word document...`}]);const arrayBuffer=await f.arrayBuffer();const pages=await loadDocxPages(arrayBuffer);codyDocConfigRef.current=null;setCodyUploadedDoc({name:f.name,type:"application/docx",pages});setMsgs(prev=>{const m=[...prev];m.pop();return[...m,{role:"assistant",content:`Got it! I've loaded "${f.name}" (${pages.length} page${pages.length>1?"s":""}). What would you like me to do?\n\n• "Sign this" — add signature (last page by default)\n• "Stamp all pages" — add stamp to every page\n• "Sign and stamp on company letterhead"\n• "Sign page 3" — apply to a specific page\n• After applying: "Move signature up" / "Move stamp down"`}];});}else if(isImg){const reader=new FileReader();reader.onload=async ev=>{codyDocConfigRef.current=null;setCodyUploadedDoc({name:f.name,type:f.type,pages:[ev.target.result]});setMsgs(prev=>[...prev,{role:"user",content:`📄 Uploaded: ${f.name}`},{role:"assistant",content:`Got "${f.name}"! What would you like me to do — sign, stamp, or put on letterhead?`}]);};reader.readAsDataURL(f);}else{const reader=new FileReader();reader.onload=async ev=>{codyDocConfigRef.current=null;setCodyUploadedDoc({name:f.name,type:f.type,pages:[ev.target.result]});setMsgs(prev=>[...prev,{role:"user",content:`📄 Uploaded: ${f.name}`},{role:"assistant",content:`I received "${f.name}". What would you like me to do — sign, stamp, or put on letterhead?`}]);};reader.readAsDataURL(f);}}catch(err){setMsgs(prev=>[...prev,{role:"assistant",content:`Failed to load document: ${err.message}`}]);}}} style={{display:"none"}}/></label></Fragment>}
      <textarea ref={_taRef} data-vinnie-ta value={input} onChange={e=>setInput(e.target.value)} onFocus={()=>setMood("talking")} onBlur={()=>setMood("idle")} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder={pendingConv&&pendingConv.questions[pendingConv.idx]?.options?"Type custom value or pick above...":placeholder} rows={2} style={{flex:1,resize:"none",border:`1.5px solid ${input?"#6e6e73":"#e5e5ea"}`,borderRadius:12,padding:"8px 12px",fontSize:isMobile?16:13,fontFamily:"inherit",outline:"none",color:"#1d1d1f",background:"#f5f5f7",transition:"border 0.15s",userSelect:"text",WebkitUserSelect:"text"}}/>
      {msgs.length>1&&<button onClick={()=>{const fresh=[{role:"assistant",content:_introWithProjects}];setMsgs(fresh);setInput("");setLoading(false);setMood("idle");setPendingConv(null);setPending(null);setPendingDuplicate(null);setAttachments([]);setConnieCtx(null);setConnieTabs([]);setConnieDietMode(null);setRonnieCtx(null);setRonnieTabs([]);setBillieCtx(null);setBillieTabs([]);setBilliePendingReview(null);setCodyCtx(null);setCodyTabs([]);codyPendingRef.current=null;setCodyUploadedDoc(null);setCodySignPanel(null);setCodyPickerPid(null);if(setActiveContractVersion)setActiveContractVersion(null);if(setActiveRAVersion)setActiveRAVersion(null);if(setActiveEstimateVersion)setActiveEstimateVersion(null);try{localStorage.setItem('onna_agent_chat_'+agent.id,JSON.stringify(fresh));}catch{}}} title="Clear chat" style={{background:"none",border:"1.5px solid #e5e5ea",borderRadius:12,padding:"0 10px",cursor:"pointer",fontSize:13,color:"#aeaeb2",alignSelf:"stretch",minWidth:38,transition:"all 0.12s",fontFamily:"inherit",fontWeight:500,display:"flex",alignItems:"center",gap:4}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#ff3b30";e.currentTarget.style.color="#ff3b30";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e5e5ea";e.currentTarget.style.color="#aeaeb2";}}>🗑</button>}
      <button onClick={send} disabled={loading||(!input.trim()&&!attachments.length)} style={{background:loading||(!input.trim()&&!attachments.length)?"#e5e5ea":"#1d1d1f",border:"none",color:loading||(!input.trim()&&!attachments.length)?"#aeaeb2":"#fff",borderRadius:12,padding:"0 14px",cursor:loading||(!input.trim()&&!attachments.length)?"not-allowed":"pointer",fontWeight:900,fontSize:18,alignSelf:"stretch",minWidth:44,transition:"background 0.12s"}}>↑</button>
    </div>
  </>); }
}

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────

