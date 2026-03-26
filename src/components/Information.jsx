import React, { useState, useRef, useEffect } from "react";

export default function Information({ T, api, isMobile, notes, setNotes, notesLoading, setNotesLoading, archiveItem, BtnPrimary, BtnSecondary, hydrated, templateFiles, setTemplateFiles }) {
  const [noteAddOpen, setNoteAddOpen] = useState(false);
  const [noteEditId, setNoteEditId]   = useState(null);
  const [noteDraft, setNoteDraft]     = useState({title:"",content:""});
  const [noteSaving, setNoteSaving]   = useState(false);
  const [notesErr, setNotesErr]       = useState("");
  const notesFetchedRef               = useRef(false);
  const [infoTab, setInfoTab]         = useState("folder");

  // Notes are pre-fetched at app startup; only fetch here if cache is empty
  useEffect(() => {
    if (notesFetchedRef.current || notes.length > 0) return;
    notesFetchedRef.current = true;
    setNotesLoading(true);
    api.get("/api/notes").then(data => {
      if (Array.isArray(data) && data.length) setNotes(data);
      setNotesLoading(false);
    }).catch(() => setNotesLoading(false));
  }, []); // eslint-disable-line

  // File helpers
  const fileInputRef = useRef(null);
  const handleFileUpload = async (fileList) => {
    const newEntries = [];
    for (const f of Array.from(fileList)) {
      if (f.size > 40 * 1024 * 1024) { alert(`"${f.name}" is over 40 MB.`); continue; }
      const data = await new Promise(r => { const fr = new FileReader(); fr.onload = e => r(e.target.result); fr.readAsDataURL(f); });
      newEntries.push({ id: Date.now() + Math.random(), name: f.name, size: f.size, type: f.type, data, createdAt: Date.now() });
    }
    if (newEntries.length > 0) setTemplateFiles(prev => [...prev, ...newEntries]);
  };
  const deleteFile = (fileId) => { if (confirm("Delete this file?")) setTemplateFiles(prev => prev.filter(f => f.id !== fileId)); };
  const downloadFile = (file) => { const a = document.createElement("a"); a.href = file.data; a.download = file.name; a.click(); };
  const getIcon = (type) => type?.includes("pdf") ? "📄" : type?.includes("image") ? "🖼" : type?.includes("word") || type?.includes("doc") ? "📝" : type?.includes("sheet") || type?.includes("excel") || type?.includes("csv") ? "📊" : type?.includes("presentation") || type?.includes("powerpoint") ? "📊" : "📎";
  const fmtSize = (bytes) => bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div style={{fontSize:22,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Information</div>
        {infoTab === "notes" && (
          <button onClick={()=>{setNoteAddOpen(true);setNoteEditId(null);setNoteDraft({title:"",content:""});}} style={{padding:"9px 18px",borderRadius:10,background:"#1d1d1f",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New</button>
        )}
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:`2px solid ${T.border}`}}>
        {[["folder","Project Folder"],["notes","Notes"]].map(([key,label])=>(
          <button key={key} onClick={()=>setInfoTab(key)} style={{padding:"10px 20px",fontSize:13,fontWeight:infoTab===key?600:400,color:infoTab===key?T.text:T.muted,background:"none",border:"none",borderBottom:infoTab===key?"2px solid #1d1d1f":"2px solid transparent",marginBottom:-2,cursor:"pointer",fontFamily:"inherit",letterSpacing:"-0.01em"}}>{label}</button>
        ))}
      </div>

      {/* ── Project Folder ── */}
      {infoTab === "folder" && (
        <div>
          {/* Upload area */}
          <label
            onDrop={e=>{e.preventDefault();handleFileUpload(e.dataTransfer.files);}}
            onDragOver={e=>e.preventDefault()}
            style={{display:"block",border:`1.5px dashed ${T.border}`,borderRadius:14,padding:36,textAlign:"center",cursor:"pointer",background:"#fafafa",transition:"border-color 0.15s",marginBottom:20}}
          >
            <div style={{fontSize:26,marginBottom:8,opacity:0.35}}>⬆</div>
            <div style={{fontSize:13,color:T.sub,marginBottom:4,fontWeight:500}}>Upload branded templates & documents</div>
            <div style={{fontSize:12,color:T.muted}}>Drag & drop or click to upload (PDF, DOCX, XLSX, images, etc.)</div>
            <input ref={fileInputRef} type="file" multiple style={{display:"none"}} onChange={e=>{handleFileUpload(e.target.files);e.target.value="";}}/>
          </label>

          {/* File list */}
          {templateFiles.length === 0 ? (
            <div style={{textAlign:"center",padding:50,color:T.muted,fontSize:13}}>No templates yet. Upload branded documents to get started.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,marginBottom:4}}>{templateFiles.length} template{templateFiles.length !== 1 ? "s" : ""}</div>
              {templateFiles.sort((a,b) => b.createdAt - a.createdAt).map(f => (
                <div key={f.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                  <span style={{fontSize:22,flexShrink:0}}>{getIcon(f.type)}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13.5,color:T.text,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>{fmtSize(f.size)} · {new Date(f.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
                  </div>
                  <button onClick={()=>downloadFile(f)} style={{background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.sub,padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",flexShrink:0}} onMouseOver={e=>{e.currentTarget.style.background="#eee"}} onMouseOut={e=>{e.currentTarget.style.background="#f5f5f7"}}>Download</button>
                  <button onClick={()=>deleteFile(f.id)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:17,padding:"0 4px",lineHeight:1,flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#c0392b"} onMouseOut={e=>e.currentTarget.style.color=T.muted} title="Delete">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Notes ── */}
      {infoTab === "notes" && (
        <div>
          {/* Add / Edit form */}
          {noteAddOpen&&(
            <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,padding:"22px 24px",marginBottom:20,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
              <input value={noteDraft.title} onChange={e=>setNoteDraft(p=>({...p,title:e.target.value}))} placeholder="Title" autoFocus style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:15,fontWeight:600,fontFamily:"inherit",color:T.text,background:"#fafafa",boxSizing:"border-box",marginBottom:10}}/>
              <textarea value={noteDraft.content} onChange={e=>setNoteDraft(p=>({...p,content:e.target.value}))} placeholder="Write…" rows={6} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:13,fontFamily:"inherit",color:T.text,background:"#fafafa",boxSizing:"border-box",resize:"vertical",lineHeight:1.6}}/>
              {notesErr&&<div style={{fontSize:12,color:"#c0392b",marginTop:8,fontWeight:500}}>{notesErr}</div>}
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <BtnPrimary disabled={noteSaving||!noteDraft.content.trim()} onClick={async()=>{
                  setNoteSaving(true); setNotesErr("");
                  try {
                    if (noteEditId) {
                      const updated = await api.put(`/api/notes/${noteEditId}`,{title:noteDraft.title,content:noteDraft.content,updated_at:new Date().toISOString()});
                      if (updated.error) { setNotesErr(updated.error); setNoteSaving(false); return; }
                      setNotes(prev=>prev.map(n=>n.id===noteEditId?updated:n));
                    } else {
                      const saved = await api.post("/api/notes",{title:noteDraft.title,content:noteDraft.content});
                      if (saved.error) { setNotesErr(saved.error); setNoteSaving(false); return; }
                      setNotes(prev=>[saved,...prev]);
                    }
                    setNoteSaving(false); setNoteAddOpen(false); setNoteEditId(null); setNoteDraft({title:"",content:""});
                  } catch(e) { setNotesErr(e.message||"Failed to save."); setNoteSaving(false); }
                }}>{noteSaving?"Saving…":noteEditId?"Save Changes":"Save"}</BtnPrimary>
                <BtnSecondary onClick={()=>{setNoteAddOpen(false);setNoteEditId(null);setNoteDraft({title:"",content:""});setNotesErr("");}}>Cancel</BtnSecondary>
              </div>
            </div>
          )}

          {notesLoading ? (
            <div style={{textAlign:"center",padding:60,color:T.muted,fontSize:13}}>Loading…</div>
          ) : notes.length===0 ? (
            <div style={{textAlign:"center",padding:60,color:T.muted,fontSize:13}}>No information yet. Hit + New to start.</div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
              {notes.map(n=>(
                <div key={n.id} style={{borderRadius:16,padding:"20px 22px",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",gap:8}}>
                  {n.title&&<div style={{fontSize:14,fontWeight:700,color:T.text,letterSpacing:"-0.01em"}}>{n.title}</div>}
                  <div style={{fontSize:13,color:T.sub,lineHeight:1.65,whiteSpace:"pre-wrap",flexGrow:1}}>{n.content}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6,paddingTop:10,borderTop:`1px solid ${T.borderSub}`}}>
                    <span style={{fontSize:11,color:T.muted}}>{n.updated_at?new Date(n.updated_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):""}</span>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>{setNoteEditId(n.id);setNoteDraft({title:n.title||"",content:n.content||""});setNoteAddOpen(true);}} style={{background:"none",border:"none",fontSize:12,color:T.muted,cursor:"pointer",fontFamily:"inherit",padding:"2px 6px",borderRadius:6}} onMouseOver={ev=>ev.currentTarget.style.color=T.text} onMouseOut={ev=>ev.currentTarget.style.color=T.muted}>Edit</button>
                      <button onClick={async()=>{if(!confirm("Delete this item?"))return;archiveItem("notes",n);await api.delete(`/api/notes/${n.id}`);setNotes(prev=>prev.filter(x=>x.id!==n.id));}} style={{background:"none",border:"none",fontSize:12,color:T.muted,cursor:"pointer",fontFamily:"inherit",padding:"2px 6px",borderRadius:6}} onMouseOver={ev=>ev.currentTarget.style.color="#c0392b"} onMouseOut={ev=>ev.currentTarget.style.color=T.muted}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
