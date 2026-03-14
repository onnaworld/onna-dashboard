import React, { useState, useRef, useEffect, useCallback } from "react";
import { T, api, debouncedGlobalSave } from "../../utils/helpers";

export const Badge = ({status}) => {
  const map = {"Not Contacted":["#fff3e0","#c0392b"],"New Lead":["#f0f0f5",T.sub],"Responded":["#e8f0ff","#1a56db"],"Meeting Arranged":["#fff8e8","#92680a"],"Converted to Client":["#edfaf3","#147d50"]};
  const [bg,tc] = map[status]||["#f5f5f7",T.muted];
  return <span style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"3px 9px",borderRadius:999,background:bg,color:tc,fontSize:11,fontWeight:500}}><span style={{width:5,height:5,borderRadius:"50%",background:tc,flexShrink:0}}/>{status}</span>;
};

export const Pill = ({label,active,onClick}) => (
  <button onClick={onClick} style={{padding:"5px 14px",borderRadius:999,fontSize:12,fontWeight:500,cursor:"pointer",border:"1px solid",fontFamily:"inherit",transition:"all 0.12s",background:active?T.accent:"#e8e8ed",borderColor:active?T.accent:"#d1d1d6",color:active?"#fff":T.sub,whiteSpace:"nowrap"}}>{label}</button>
);

export const StatCard = ({label,value,sub}) => (
  <div style={{borderRadius:16,padding:"20px 22px",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
    <div style={{fontSize:11,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase",color:T.muted,marginBottom:10}}>{label}</div>
    <div style={{fontSize:28,fontWeight:700,color:T.text,letterSpacing:"-0.02em",marginBottom:sub?4:0}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:T.sub}}>{sub}</div>}
  </div>
);

export const TH = ({children}) => <th style={{padding:"10px 14px",textAlign:"left",fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap",borderBottom:`1px solid ${T.borderSub}`,background:"#fafafa"}}>{children}</th>;
export const TD = ({children,bold,muted}) => <td style={{padding:"11px 14px",fontSize:12.5,color:bold?T.text:muted?T.muted:T.sub,borderBottom:`1px solid ${T.borderSub}`,verticalAlign:"middle"}}>{children}</td>;

export const SearchBar = ({value,onChange,placeholder}) => (
  <div style={{display:"flex",alignItems:"center",gap:8,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 13px",minWidth:220,boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke={T.muted} strokeWidth="1.4"/><path d="M8.5 8.5L11 11" stroke={T.muted} strokeWidth="1.4" strokeLinecap="round"/></svg>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Search…"} style={{border:"none",background:"transparent",color:T.text,fontSize:13,fontFamily:"inherit",outline:"none",width:"100%"}}/>
    {value&&<button onClick={()=>onChange("")} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>×</button>}
  </div>
);

export const Sel = ({value,onChange,options,minWidth}) => (
  <select value={value} onChange={e=>onChange(e.target.value)} style={{padding:"8px 30px 8px 12px",borderRadius:10,background:T.surface,border:`1px solid ${T.border}`,color:T.text,fontSize:12.5,fontFamily:"inherit",cursor:"pointer",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23aeaeb2' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",minWidth:minWidth||140,boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
    {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
  </select>
);

export const OutreachBadge = ({status,onClick}) => {
  const s = {not_contacted:{bg:"#fff3e0",c:"#c0392b",label:"Not Contacted"},cold:{bg:"#f5f5f7",c:T.sub,label:"Cold"},warm:{bg:"#eef4ff",c:"#1a56db",label:"Warm"},open:{bg:"#edfaf3",c:"#147d50",label:"Open"},client:{bg:"#f3e8ff",c:"#7c3aed",label:"Client"}}[status]||{bg:"#fff3e0",c:"#c0392b",label:"Not Contacted"};
  return <span onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:999,background:s.bg,color:s.c,fontSize:11,fontWeight:500,cursor:onClick?"pointer":"default"}}><span style={{width:5,height:5,borderRadius:"50%",background:s.c,flexShrink:0}}/>{s.label}</span>;
};

export const THFilter = ({label,value,onChange,options}) => (
  <th style={{padding:"10px 14px",textAlign:"left",fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap",borderBottom:`1px solid ${T.borderSub}`,background:"#fafafa"}}>
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <span>{label}</span>
      <select value={value} onChange={e=>onChange(e.target.value)} onClick={e=>e.stopPropagation()} style={{fontSize:10,color:value==="All"?T.muted:"#1a56db",background:"transparent",border:"none",outline:"none",cursor:"pointer",padding:0,fontFamily:"inherit",fontWeight:600,appearance:"none",maxWidth:140,letterSpacing:"0.04em"}}>
        {options.map(o=>{const val=o.value!==undefined?o.value:o;const lbl=o.label||o;return <option key={val} value={val}>{lbl}</option>;})}
      </select>
    </div>
  </th>
);

export const SectionBtn = ({label,active,onClick}) => (
  <button onClick={onClick} style={{padding:"6px 13px",borderRadius:9,fontSize:12,fontWeight:500,cursor:"pointer",border:`1px solid ${active?T.accent:T.border}`,fontFamily:"inherit",transition:"all 0.12s",background:active?T.accent:"transparent",color:active?"#fff":T.sub,whiteSpace:"nowrap"}}>{label}</button>
);

export const UploadZone = ({label,files,onAdd}) => {
  const handleDrop = e => {e.preventDefault();onAdd(Array.from(e.dataTransfer.files));};
  return (
    <div>
      <label onDrop={handleDrop} onDragOver={e=>e.preventDefault()} style={{display:"block",border:`1.5px dashed ${T.border}`,borderRadius:14,padding:36,textAlign:"center",cursor:"pointer",background:"#fafafa",transition:"border-color 0.15s"}}>
        <div style={{fontSize:26,marginBottom:8,opacity:0.35}}>⬆</div>
        <div style={{fontSize:13,color:T.sub,marginBottom:4,fontWeight:500}}>{label}</div>
        <div style={{fontSize:12,color:T.muted}}>Drag & drop or click to upload</div>
        <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{display:"none"}} onChange={e=>onAdd(Array.from(e.target.files))}/>
      </label>
      {files.length>0&&(
        <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:6}}>
          {files.map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:T.surface,border:`1px solid ${T.border}`}}>
              <span style={{fontSize:15}}>📄</span>
              <span style={{fontSize:12.5,color:T.sub,flex:1}}>{f.name}</span>
              <span style={{fontSize:11,color:T.muted}}>{(f.size/1024).toFixed(0)} KB</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Button primitives
export const BtnPrimary = ({children,onClick,disabled,small}) => (
  <button onClick={onClick} disabled={disabled} style={{padding:small?"5px 13px":"8px 18px",borderRadius:9,background:disabled?"#e8e8ed":T.accent,color:disabled?T.muted:"#fff",border:"none",fontSize:small?11:12.5,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",letterSpacing:"0.01em",opacity:disabled?0.6:1,transition:"opacity 0.12s"}}>{children}</button>
);
export const BtnSecondary = ({children,onClick,small}) => (
  <button onClick={onClick} style={{padding:small?"5px 13px":"8px 18px",borderRadius:9,background:T.surface,color:T.sub,border:`1px solid ${T.border}`,fontSize:small?11:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>{children}</button>
);
export const BtnExport = ({children,onClick}) => (
  <button onClick={onClick} style={{padding:"5px 13px",borderRadius:8,background:"#1d1d1f",color:"#fff",border:"none",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:5}}>⬇ {children}</button>
);

// ─── SOP Markdown renderer ────────────────────────────────────────────────────
export const renderSopMarkdown = (md) => {
  if(!md) return "";
  return md.split(/\n{2,}/).map(block=>{
    block=block.trim();
    if(!block) return "";
    const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const inline=s=>esc(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>");
    if(/^###\s/.test(block)) return `<h3 style="font-size:14px;font-weight:700;color:${T.text};margin:12px 0 4px">${inline(block.replace(/^###\s/,""))}</h3>`;
    if(/^##\s/.test(block)) return `<h2 style="font-size:15px;font-weight:700;color:${T.text};margin:14px 0 4px">${inline(block.replace(/^##\s/,""))}</h2>`;
    if(/^#\s/.test(block)) return `<h1 style="font-size:17px;font-weight:700;color:${T.text};margin:16px 0 6px">${inline(block.replace(/^#\s/,""))}</h1>`;
    const lines=block.split("\n");
    if(lines.every(l=>/^[-*]\s/.test(l))) return `<ul style="margin:6px 0;padding-left:18px;color:${T.sub};font-size:13px;line-height:1.7">${lines.map(l=>"<li>"+inline(l.replace(/^[-*]\s/,""))+"</li>").join("")}</ul>`;
    if(lines.every(l=>/^\d+\.\s/.test(l))) return `<ol style="margin:6px 0;padding-left:18px;color:${T.sub};font-size:13px;line-height:1.7">${lines.map(l=>"<li>"+inline(l.replace(/^\d+\.\s/,""))+"</li>").join("")}</ol>`;
    return `<p style="margin:6px 0;color:${T.sub};font-size:13px;line-height:1.7">${inline(block.replace(/\n/g," "))}</p>`;
  }).join("");
};

// ─── AI DOC PANEL ─────────────────────────────────────────────────────────────
export const AIDocPanel = ({project, docType, systemPrompt, savedDocs}) => {
  const key = `${project.client} — ${project.name}`;
  const [prompt,setPrompt] = useState("");
  const [output,setOutput] = useState(savedDocs[key]||"");
  const [loading,setLoading] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setOutput("");
    try {
      const data = await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:1500,system:systemPrompt,messages:[{role:"user",content:`Project: ${project.client} — ${project.name}\n\n${prompt}`}]});
      setOutput(data?.content?.[0]?.text||"");
    } catch {}
    setLoading(false);
  };

  const renderOutput = text => {
    if (!text) return null;
    const lines=text.split("\n"); const els=[]; let i=0;
    while (i<lines.length) {
      const line=lines[i].trim();
      if (line.includes("|")&&lines[i+1]&&lines[i+1].replace(/[-|:\s]/g,"")==="") {
        const hdrs=line.split("|").map(c=>c.trim()).filter(Boolean); const rows=[]; i+=2;
        while(i<lines.length&&lines[i].includes("|")){rows.push(lines[i].trim().split("|").map(c=>c.trim()).filter(Boolean));i++;}
        els.push(<div key={els.length} style={{overflowX:"auto",margin:"10px 0 14px"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{background:"#fafafa"}}>{hdrs.map((h,hi)=><th key={hi} style={{padding:"8px 12px",textAlign:"left",fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",borderBottom:`1px solid ${T.borderSub}`}}>{h}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr key={ri}>{row.map((cell,ci)=><td key={ci} style={{padding:"9px 12px",color:ci===0?T.text:T.sub,borderBottom:`1px solid ${T.borderSub}`}}>{cell}</td>)}</tr>)}</tbody></table></div>);
        continue;
      }
      if(line&&((line===line.toUpperCase()&&line.length>3&&!line.includes("|"))||/^\d+\./.test(line))) els.push(<div key={els.length} style={{marginTop:16,marginBottom:5,fontSize:10,fontWeight:700,letterSpacing:"0.09em",color:T.sub,borderBottom:`1px solid ${T.border}`,paddingBottom:4,textTransform:"uppercase"}}>{line}</div>);
      else if(line.startsWith("•")||line.startsWith("-")) els.push(<div key={els.length} style={{fontSize:13,color:T.sub,paddingLeft:10,lineHeight:"1.7"}}>{line}</div>);
      else if(line) els.push(<div key={els.length} style={{fontSize:13,color:T.sub,lineHeight:"1.7"}}>{line}</div>);
      i++;
    }
    return els;
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
        <div style={{padding:"11px 16px",borderBottom:`1px solid ${T.borderSub}`,fontSize:10,color:T.muted,letterSpacing:"0.07em",textTransform:"uppercase",background:"#fafafa",fontWeight:600}}>AI Generator — {docType}</div>
        <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe shoot, crew, location, timing…" rows={3} style={{width:"100%",background:"#fafafa",border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 13px",color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",lineHeight:"1.6"}}/>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <BtnPrimary onClick={generate} disabled={loading||!prompt.trim()}>{loading?"Generating…":`Generate ${docType}`}</BtnPrimary>
          </div>
        </div>
      </div>
      {(output||loading)&&(
        <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
          <div style={{padding:"11px 16px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fafafa"}}>
            <span style={{fontSize:10,color:T.muted,letterSpacing:"0.07em",textTransform:"uppercase",fontWeight:600}}>Generated {docType}</span>
            {output&&<div style={{display:"flex",gap:6}}>
              <BtnSecondary small onClick={()=>navigator.clipboard.writeText(output)}>Copy</BtnSecondary>
              <BtnExport onClick={()=>exportToPDF(buildDocHTML(output),`${docType} — ${project.name}`)}>Export PDF</BtnExport>
            </div>}
          </div>
          <div style={{padding:20,maxHeight:560,overflowY:"auto"}}>
            {loading?<div style={{display:"flex",alignItems:"center",gap:9,color:T.muted,fontSize:13}}><span style={{display:"inline-block",width:14,height:14,borderRadius:"50%",border:"2px solid #e0e0e5",borderTopColor:T.text,animation:"spin 0.8s linear infinite"}}/>Generating…</div>:renderOutput(output)}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── DASH NOTES COMPONENT ────────────────────────────────────────────────────
export const DashNotes = ({notes,setNotes,selectedId,setSelectedId,isMobile,onArchive}) => {
  const editorRef = useRef(null);
  const [hoveredNoteId,setHoveredNoteId] = useState(null);
  const [expandedNotes,setExpandedNotes] = useState(()=>new Set());
  const selectedNote = notes.find(n=>n.id===selectedId)||null;

  useEffect(()=>{
    if (editorRef.current) editorRef.current.innerHTML = selectedNote?.content||"";
  },[selectedId]); // eslint-disable-line

  const updateContent = () => {
    if (!selectedNote||!editorRef.current) return;
    const html=editorRef.current.innerHTML;
    setNotes(prev=>prev.map(n=>n.id===selectedId?{...n,content:html,updatedAt:Date.now()}:n));
  };
  const updateTitle = (val) => {
    setNotes(prev=>prev.map(n=>n.id===selectedId?{...n,title:val,updatedAt:Date.now()}:n));
  };
  const createNote = () => {
    const n={id:Date.now(),title:"",content:"",updatedAt:Date.now()};
    setNotes(prev=>[n,...prev]); setSelectedId(n.id);
  };
  const createSubNote = (parentId,e) => {
    e?.stopPropagation();
    const n={id:Date.now(),title:"",content:"",updatedAt:Date.now(),parentId};
    setNotes(prev=>[n,...prev]); setSelectedId(n.id);
    setExpandedNotes(prev=>{const s=new Set(prev);s.add(parentId);return s;});
  };
  const deleteNote = (id,e) => {
    e?.stopPropagation();
    const children = notes.filter(n=>n.parentId===id);
    const msg = children.length > 0 ? "Delete this note and its sub-notes?" : "Delete this note?";
    if (!window.confirm(msg)) return;
    const note = notes.find(n=>n.id===id);
    if (note && onArchive) onArchive('dashNotes', note);
    const idsToDelete = new Set([id, ...children.map(c=>c.id)]);
    setNotes(prev=>prev.filter(n=>!idsToDelete.has(n.id)));
    if (idsToDelete.has(selectedId)) setSelectedId(null);
  };
  const toggleExpand = (id,e) => {
    e.stopPropagation();
    setExpandedNotes(prev=>{const s=new Set(prev);if(s.has(id))s.delete(id);else s.add(id);return s;});
  };
  const fmt = (cmd,val) => { document.execCommand(cmd,false,val||null); editorRef.current?.focus(); };
  const getPlain = (html) => (html||"").replace(/<[^>]*>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">");
  const getTitle = (n) => n.title?.trim() || getPlain(n.content).split("\n")[0].trim().slice(0,50) || "New Note";
  const getPreview = (n) => { const p=getPlain(n.content).replace(/\n+/g," ").trim(); return p.slice(0,60); };
  const fmtDate = (ts) => { if(!ts)return""; const d=new Date(ts),now=new Date(); if(d.toDateString()===now.toDateString())return d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); return d.toLocaleDateString([],{month:"short",day:"numeric"}); };
  const topLevel = [...notes].filter(n=>!n.parentId).sort((a,b)=>b.updatedAt-a.updatedAt);
  const childrenOf = (pid) => notes.filter(n=>n.parentId===pid).sort((a,b)=>b.updatedAt-a.updatedAt);
  const hasChildren = (id) => notes.some(n=>n.parentId===id);
  const showList = !isMobile||!selectedNote;
  const showEditor = !isMobile||!!selectedNote;
  const TBtnStyle = {height:26,minWidth:26,borderRadius:5,border:`1px solid ${T.border}`,background:"#fff",cursor:"pointer",fontSize:12,fontFamily:"inherit",padding:"0 5px",display:"flex",alignItems:"center",justifyContent:"center"};
  const renderNoteItem = (n,isChild) => (
    <div key={n.id} onClick={()=>setSelectedId(n.id)} onMouseEnter={()=>setHoveredNoteId(n.id)} onMouseLeave={()=>setHoveredNoteId(null)} style={{padding:"11px 14px",paddingLeft:isChild?28:14,borderBottom:`1px solid ${T.borderSub}`,cursor:"pointer",background:selectedId===n.id?"#e8e8ed":isChild?"#f5f5f7":"transparent",borderLeft:!isChild&&hasChildren(n.id)?`3px solid ${T.accent}`:"3px solid transparent",transition:"background 0.1s",display:"flex",alignItems:"flex-start",gap:6}}>
      {!isChild && hasChildren(n.id) ? (
        <button onClick={e=>toggleExpand(n.id,e)} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,padding:"2px 0",lineHeight:1,flexShrink:0,marginTop:2,color:T.muted,width:14,textAlign:"center"}}>{expandedNotes.has(n.id)?"▼":"▶"}</button>
      ) : !isChild ? <span style={{width:14,flexShrink:0}}/> : null}
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:isChild?12:13,fontWeight:isChild?600:700,color:isChild?T.muted:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{getTitle(n)}</div>
        <div style={{display:"flex",gap:6,marginTop:2,alignItems:"center"}}>
          <span style={{fontSize:10.5,color:T.muted,flexShrink:0}}>{fmtDate(n.updatedAt)}</span>
          <span style={{fontSize:isChild?10:10.5,color:T.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{getPreview(n)}</span>
        </div>
      </div>
      {hoveredNoteId===n.id&&<>
        <button onClick={e=>createSubNote(n.parentId||n.id,e)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:13,padding:"0 2px",lineHeight:1,flexShrink:0,marginTop:1}} title="Add sub-note">+</button>
        <button onClick={e=>deleteNote(n.id,e)} style={{background:"none",border:"none",color:"#c0392b",cursor:"pointer",fontSize:15,padding:"0 2px",lineHeight:1,flexShrink:0,marginTop:1}} title="Delete note">×</button>
      </>}
    </div>
  );
  return (
    <div style={{marginTop:isMobile?12:18,borderRadius:16,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",display:"flex",height:isMobile?520:500,background:T.surface}}>
      {showList&&(
        <div style={{width:isMobile?"100%":220,borderRight:isMobile?"none":`1px solid ${T.border}`,display:"flex",flexDirection:"column",background:"#fafafa",flexShrink:0}}>
          <div style={{padding:"12px 14px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600}}>Notes</span>
            <button onClick={createNote} style={{width:22,height:22,borderRadius:6,background:T.accent,border:"none",color:"#fff",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,padding:0}}>+</button>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {topLevel.length===0&&!notes.some(n=>n.parentId)&&<div style={{padding:"28px 14px",textAlign:"center",fontSize:12,color:T.muted}}>No notes yet.<br/>Hit + to create one.</div>}
            {topLevel.map(n=>(
              <React.Fragment key={n.id}>
                {renderNoteItem(n,false)}
                {expandedNotes.has(n.id)&&childrenOf(n.id).map(c=>renderNoteItem(c,true))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      {showEditor&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          {selectedNote ? (
            <>
              {/* Formatting toolbar */}
              <div style={{padding:"6px 10px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",gap:3,background:"#fafafa",flexWrap:"wrap",flexShrink:0}}>
                {isMobile&&<button onClick={()=>setSelectedId(null)} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:"0 8px 0 0",marginRight:2}}>←</button>}
                <button onMouseDown={e=>{e.preventDefault();fmt("bold");}} style={{...TBtnStyle,fontWeight:700}}>B</button>
                <button onMouseDown={e=>{e.preventDefault();fmt("italic");}} style={{...TBtnStyle,fontStyle:"italic"}}>I</button>
                <button onMouseDown={e=>{e.preventDefault();fmt("underline");}} style={{...TBtnStyle,textDecoration:"underline"}}>U</button>
                <button onMouseDown={e=>{e.preventDefault();fmt("strikeThrough");}} style={{...TBtnStyle,textDecoration:"line-through"}}>S</button>
                <button onMouseDown={e=>{e.preventDefault();fmt("insertUnorderedList");}} title="Bullet list" style={{...TBtnStyle,fontSize:13}}>•≡</button>
                <button onMouseDown={e=>{e.preventDefault();fmt("insertOrderedList");}} title="Numbered list" style={{...TBtnStyle,fontSize:11}}>1≡</button>
                <div style={{width:1,height:18,background:T.border,margin:"0 2px"}}/>
                <select onMouseDown={e=>e.stopPropagation()} onChange={e=>{fmt("fontName",e.target.value);editorRef.current?.focus();}} defaultValue="" style={{...TBtnStyle,minWidth:90,padding:"0 4px",fontSize:11}}>
                  <option value="">Font</option>
                  <option value="Arial, sans-serif">Sans-serif</option>
                  <option value="Georgia, serif">Serif</option>
                  <option value="monospace">Mono</option>
                  <option value="'Trebuchet MS'">Trebuchet</option>
                  <option value="'Courier New'">Courier</option>
                </select>
                <select onMouseDown={e=>e.stopPropagation()} onChange={e=>{fmt("fontSize",e.target.value);editorRef.current?.focus();}} defaultValue="" style={{...TBtnStyle,width:50,padding:"0 4px",fontSize:11}}>
                  <option value="">Size</option>
                  <option value="1">XS</option>
                  <option value="2">S</option>
                  <option value="3">M</option>
                  <option value="4">L</option>
                  <option value="5">XL</option>
                  <option value="6">XXL</option>
                </select>
                <div style={{width:1,height:18,background:T.border,margin:"0 2px"}}/>
                {["#1d1d1f","#c0392b","#1a56db","#147d50","#8e24aa","#e67e22"].map(c=>(
                  <button key={c} onMouseDown={e=>{e.preventDefault();fmt("foreColor",c);}} title={c} style={{width:16,height:16,borderRadius:"50%",background:c,border:"1.5px solid rgba(0,0,0,0.18)",cursor:"pointer",padding:0,flexShrink:0}}/>
                ))}
                <div style={{width:1,height:18,background:T.border,margin:"0 2px"}}/>
                {[["#fff176","Yellow"],["#b3f0d4","Green"],["#b3d4f5","Blue"],["#ffd6d6","Red"]].map(([bg,lbl])=>(
                  <button key={bg} onMouseDown={e=>{e.preventDefault();fmt("hiliteColor",bg);}} title={`Highlight ${lbl}`} style={{width:16,height:16,borderRadius:3,background:bg,border:"1.5px solid rgba(0,0,0,0.12)",cursor:"pointer",padding:0,flexShrink:0}}/>
                ))}
                <button onMouseDown={e=>{e.preventDefault();fmt("hiliteColor","transparent");}} title="Clear highlight" style={{...TBtnStyle,fontSize:10,color:T.muted,minWidth:16,width:16,padding:0}}>{"✕"}</button>
                <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:10.5,color:T.muted}}>{fmtDate(selectedNote.updatedAt)}</span>
                  <button onClick={e=>deleteNote(selectedNote.id,e)} style={{background:"none",border:"none",color:T.muted,fontSize:12,cursor:"pointer",padding:"2px 4px",borderRadius:5,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.color="#c0392b"} onMouseOut={e=>e.currentTarget.style.color=T.muted}>Delete</button>
                </div>
              </div>
              {/* Title input */}
              <input value={selectedNote.title||""} onChange={e=>updateTitle(e.target.value)} placeholder="Title" style={{border:"none",borderBottom:`1px solid ${T.borderSub}`,padding:"14px 20px 10px",fontSize:20,fontWeight:700,color:T.text,outline:"none",background:"transparent",fontFamily:"inherit",width:"100%",boxSizing:"border-box",flexShrink:0}}/>
              {/* Editable content */}
              <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={updateContent} style={{flex:1,padding:"12px 20px 16px",outline:"none",fontSize:13.5,fontFamily:"inherit",color:T.text,lineHeight:1.75,overflowY:"auto",boxSizing:"border-box"}}/>
            </>
          ) : (
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,color:T.muted}}>
              <div style={{fontSize:13}}>Select a note or create a new one</div>
              <button onClick={createNote} style={{padding:"8px 18px",borderRadius:9,background:T.accent,border:"none",color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>+ New Note</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// ─── PROJECT TODO LIST COMPONENT ────────────────────────────────────────────
export const ProjectTodoList = ({projectId,projectTodos,setProjectTodos,archivedTodos,setArchivedTodos}) => {
  const [newText,setNewText] = useState("");
  const todos = (projectTodos[projectId]||[]).filter(t=>!archivedTodos.find(a=>a.id===t.id));
  const addTodo = () => {
    if (!newText.trim()) return;
    setProjectTodos(prev=>({...prev,[projectId]:[...(prev[projectId]||[]),{id:Date.now(),text:newText.trim(),done:false,details:""}]}));
    setNewText("");
  };
  return (
    <div style={{padding:"0 0 4px"}}>
      {todos.length===0&&<div style={{padding:"14px 18px",fontSize:13,color:T.muted}}>No tasks yet — add one below.</div>}
      {todos.map((t,i)=>(
        <div key={t.id} className="todo-item" style={{display:"flex",alignItems:"flex-start",gap:9,padding:"9px 18px",borderBottom:i<todos.length-1?`1px solid ${T.borderSub}`:"none",transition:"background 0.1s"}}>
          <button onClick={()=>setProjectTodos(prev=>({...prev,[projectId]:(prev[projectId]||[]).map(x=>x.id===t.id?{...x,done:!x.done}:x)}))} style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${t.done?T.muted:T.border}`,background:t.done?T.accent:"transparent",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginTop:2,transition:"all 0.12s"}}>
            {t.done&&<span style={{color:"#fff",fontSize:9,lineHeight:1,fontWeight:700}}>✓</span>}
          </button>
          <span style={{flex:1,fontSize:13,color:t.done?T.muted:T.text,textDecoration:t.done?"line-through":"none",lineHeight:"1.5"}}>{t.text}</span>
          <div style={{display:"flex",gap:3,opacity:0,transition:"opacity 0.12s"}} className="todo-del">
            <button onClick={()=>setArchivedTodos(prev=>[...prev,{...t,projectId}])} title="Archive" style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:11,padding:"2px 4px",borderRadius:4,fontFamily:"inherit"}}>⊘</button>
            <button onClick={()=>{archiveItem('todos',{...t,_source:"project",projectId});setProjectTodos(prev=>({...prev,[projectId]:(prev[projectId]||[]).filter(x=>x.id!==t.id)}));}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>×</button>
          </div>
        </div>
      ))}
      <div style={{display:"flex",gap:8,padding:"10px 14px 10px"}}>
        <input value={newText} onChange={e=>setNewText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTodo();}} placeholder="Add a task…" style={{flex:1,padding:"7px 11px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
        <button onClick={addTodo} style={{padding:"7px 13px",borderRadius:9,background:T.accent,border:"none",color:"#fff",fontSize:16,cursor:"pointer",lineHeight:1}}>+</button>
      </div>
    </div>
  );
};

// ─── LOGIN PAGE PRIMITIVES — must live at module level so React never remounts them ──

