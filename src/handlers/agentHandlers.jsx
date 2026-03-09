import React from "react";

// ── Undo stack helpers ───────────────────────────────────────────────────────

export const doPushUndo = (label, undoStack, state) => {
  const clone = (v) => JSON.parse(JSON.stringify(v));
  undoStack.current.push({
    label,
    todos: clone(state.todos),
    projectTodos: clone(state.projectTodos),
    outreach: clone(state.outreach),
    vendors: clone(state.vendors),
    localProjects: clone(state.localProjects),
    archivedTodos: clone(state.archivedTodos),
    riskAssessmentStore: clone(state.riskAssessmentStore),
    cpsStore: clone(state.cpsStore),
    shotListStore: clone(state.shotListStore),
    storyboardStore: clone(state.storyboardStore),
    callSheetStore: clone(state.callSheetStore),
    contractDocStore: clone(state.contractDocStore),
    postProdStore: clone(state.postProdStore),
    fittingStore: clone(state.fittingStore),
    locDeckStore: clone(state.locDeckStore),
    recceReportStore: clone(state.recceReportStore),
    castingDeckStore: clone(state.castingDeckStore),
    castingTableStore: clone(state.castingTableStore),
    travelItineraryStore: clone(state.travelItineraryStore),
    dietaryStore: clone(state.dietaryStore),
    projectEstimates: clone(state.projectEstimates),
    archive: clone(state.archive),
  });
  if (undoStack.current.length > 50) undoStack.current.shift();
};

export const doPerformUndo = (undoStack, undoToastRef, setters) => {
  const { setTodos, setProjectTodos, setOutreach, setVendors, setLocalProjects, setArchivedTodos, setRiskAssessmentStore, setCpsStore, setShotListStore, setStoryboardStore, setCallSheetStore, setContractDocStore, setPostProdStore, setFittingStore, setLocDeckStore, setRecceReportStore, setCastingDeckStore, setCastingTableStore, setTravelItineraryStore, setDietaryStore, setProjectEstimates, setArchive, setUndoToastMsg } = setters;
  if (undoStack.current.length === 0) return;
  const snap = undoStack.current.pop();
  setTodos(snap.todos);
  setProjectTodos(snap.projectTodos);
  setOutreach(snap.outreach);
  setVendors(snap.vendors);
  setLocalProjects(snap.localProjects);
  setArchivedTodos(snap.archivedTodos);
  if (snap.riskAssessmentStore) setRiskAssessmentStore(snap.riskAssessmentStore);
  if (snap.cpsStore) setCpsStore(snap.cpsStore);
  if (snap.shotListStore) setShotListStore(snap.shotListStore);
  if (snap.storyboardStore) setStoryboardStore(snap.storyboardStore);
  if (snap.callSheetStore) setCallSheetStore(snap.callSheetStore);
  if (snap.contractDocStore) setContractDocStore(snap.contractDocStore);
  if (snap.postProdStore) setPostProdStore(snap.postProdStore);
  if (snap.fittingStore) setFittingStore(snap.fittingStore);
  if (snap.locDeckStore) setLocDeckStore(snap.locDeckStore);
  if (snap.recceReportStore) setRecceReportStore(snap.recceReportStore);
  if (snap.castingDeckStore) setCastingDeckStore(snap.castingDeckStore);
  if (snap.castingTableStore) setCastingTableStore(snap.castingTableStore);
  if (snap.travelItineraryStore) setTravelItineraryStore(snap.travelItineraryStore);
  if (snap.dietaryStore) setDietaryStore(snap.dietaryStore);
  if (snap.projectEstimates) setProjectEstimates(snap.projectEstimates);
  if (snap.archive) setArchive(snap.archive);
  setUndoToastMsg("Undo: " + (snap.label || "action"));
  clearTimeout(undoToastRef.current);
  undoToastRef.current = setTimeout(() => setUndoToastMsg(""), 1800);
};

// ── Agent markdown renderer ─────────────────────────────────────────────────

export const fmtInline = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p,i)=>{
    if (p.startsWith("**")&&p.endsWith("**")) return <strong key={i}>{p.slice(2,-2)}</strong>;
    if (p.startsWith("`")&&p.endsWith("`")) return <code key={i} style={{background:"rgba(0,0,0,0.07)",borderRadius:4,padding:"1px 5px",fontSize:"0.88em",fontFamily:"monospace"}}>{p.slice(1,-1)}</code>;
    return <span key={i}>{p}</span>;
  });
};

export const renderAgentMd = (text) => {
  if (!text) return null;
  const lines = text.split("\n");
  const out = []; let inCode=false; let codeLines=[]; let inTable=false; let tableRows=[];
  const flushTable = (key) => {
    if (!tableRows.length) return;
    out.push(<div key={`t${key}`} style={{overflowX:"auto",marginBottom:6}}>
      <table style={{borderCollapse:"collapse",fontSize:11.5,width:"100%"}}>
        {tableRows.map((r,ri)=><tr key={ri}>{r.map((c,ci)=>{
          const Tag=ri===0?"th":"td";
          return <Tag key={ci} style={{border:"1px solid #d1d1d6",padding:"4px 8px",textAlign:"left",background:ri===0?"#f5f5f7":"transparent",whiteSpace:"nowrap"}}>{fmtInline(c.trim())}</Tag>;
        })}</tr>)}
      </table></div>);
    tableRows=[];
  };
  lines.forEach((line,i)=>{
    if (line.startsWith("```")) {
      if (inCode) { out.push(<pre key={i} style={{background:"#f2f2f7",borderRadius:8,padding:"10px 12px",overflowX:"auto",fontSize:11.5,lineHeight:1.5,margin:"4px 0",fontFamily:"monospace"}}>{codeLines.join("\n")}</pre>); codeLines=[]; inCode=false; }
      else { if(inTable){flushTable(i);inTable=false;} inCode=true; } return;
    }
    if (inCode) { codeLines.push(line); return; }
    if (line.startsWith("|")) {
      const cells = line.split("|").slice(1,-1);
      if (!cells.every(c=>/^[-: ]+$/.test(c))) { inTable=true; tableRows.push(cells); }
      return;
    }
    if (inTable) { flushTable(i); inTable=false; }
    if (line.startsWith("### ")) { out.push(<div key={i} style={{fontWeight:700,fontSize:12.5,marginTop:10,marginBottom:2,color:"#1d1d1f"}}>{fmtInline(line.slice(4))}</div>); return; }
    if (line.startsWith("## "))  { out.push(<div key={i} style={{fontWeight:700,fontSize:14,marginTop:12,marginBottom:4,color:"#1d1d1f"}}>{fmtInline(line.slice(3))}</div>); return; }
    if (line.startsWith("# "))   { out.push(<div key={i} style={{fontWeight:700,fontSize:16,marginTop:14,marginBottom:6,color:"#1d1d1f"}}>{fmtInline(line.slice(2))}</div>); return; }
    if (line.match(/^[-*]\s/))   { out.push(<div key={i} style={{display:"flex",gap:6,marginBottom:1.5}}><span style={{flexShrink:0,marginTop:2}}>•</span><span style={{lineHeight:1.55}}>{fmtInline(line.slice(2))}</span></div>); return; }
    const numMatch = line.match(/^(\d+)\.\s(.*)$/);
    if (numMatch) { out.push(<div key={i} style={{display:"flex",gap:6,marginBottom:1.5}}><span style={{flexShrink:0,minWidth:16,textAlign:"right",marginTop:2}}>{numMatch[1]}.</span><span style={{lineHeight:1.55}}>{fmtInline(numMatch[2])}</span></div>); return; }
    if (!line.trim()) { out.push(<div key={i} style={{height:5}}/>); return; }
    out.push(<div key={i} style={{lineHeight:1.6,marginBottom:1}}>{fmtInline(line)}</div>); });
  if (inTable) flushTable("end");
  return out;
};

// ── Agent streaming chat ─────────────────────────────────────────────────────

export const sendAgentMessage = async (agentId, userText, agentStreaming, agentChats, setAgentChats, setAgentInput, setAgentStreaming, agentChatEndRef) => {
  if (!userText.trim() || agentStreaming) return;
  const userMsg = {role:"user", content:userText.trim()};
  const history = [...(agentChats[agentId]||[]), userMsg];
  setAgentChats(prev=>({...prev,[agentId]:history}));
  setAgentInput("");
  setAgentStreaming(true);
  setAgentChats(prev=>({...prev,[agentId]:[...history,{role:"assistant",content:"",streaming:true}]}));
  try {
    const messages = history.map(m=>({role:m.role,content:m.content}));
    const res = await fetch(`/api/agents/${agentId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages})});
    if (!res.ok) {
      const e = await res.json().catch(()=>({error:`HTTP ${res.status}`}));
      setAgentChats(prev=>({...prev,[agentId]:[...history,{role:"assistant",content:`Error: ${e.error||"Unknown error"}`,streaming:false}]}));
      setAgentStreaming(false); return;
    }
    const reader = res.body.getReader(); const decoder = new TextDecoder();
    let fullText=""; let buffer="";
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      buffer += decoder.decode(value,{stream:true});
      const lines = buffer.split("\n"); buffer = lines.pop()||"";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw||raw==="[DONE]") continue;
        try {
          const ev = JSON.parse(raw);
          if (ev.type==="content_block_delta"&&ev.delta?.type==="text_delta") {
            fullText += ev.delta.text;
            setAgentChats(prev=>({...prev,[agentId]:[...history,{role:"assistant",content:fullText,streaming:true}]}));
          }
          if (ev.type==="message_stop") {
            setAgentChats(prev=>({...prev,[agentId]:[...history,{role:"assistant",content:fullText,streaming:false}]}));
          }
          if (ev.error) {
            fullText += (fullText?"\n\n":"")+`⚠️ ${ev.error}`;
            setAgentChats(prev=>({...prev,[agentId]:[...history,{role:"assistant",content:fullText,streaming:false}]}));
          }
        } catch {}
      }
    }
    setAgentChats(prev=>({...prev,[agentId]:prev[agentId].map((m,i)=>i===prev[agentId].length-1?{...m,streaming:false}:m)}));
  } catch(err) {
    setAgentChats(prev=>({...prev,[agentId]:[...history,{role:"assistant",content:`Error: ${err.message}`,streaming:false}]}));
  }
  setAgentStreaming(false);
  setTimeout(()=>agentChatEndRef.current?.scrollIntoView({behavior:"smooth"}),50);
};
