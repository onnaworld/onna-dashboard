import React, { useState, useRef } from "react";

export default function Information({ T, api, isMobile, notes, setNotes, notesLoading, setNotesLoading, archiveItem, BtnPrimary, BtnSecondary, hydrated }) {
  const [noteAddOpen, setNoteAddOpen] = useState(false);
  const [noteEditId, setNoteEditId]   = useState(null);
  const [noteDraft, setNoteDraft]     = useState({title:"",content:""});
  const [noteSaving, setNoteSaving]   = useState(false);
  const [notesErr, setNotesErr]       = useState("");
  const notesFetchedRef               = useRef(false);

  // Lazy-fetch on first render — wait until global hydration is done
  React.useEffect(() => {
    if (!hydrated || notesFetchedRef.current || notesLoading) return;
    notesFetchedRef.current = true;
    if (notes.length === 0) setNotesLoading(true);
    api.get("/api/notes").then(data => {
      if (Array.isArray(data) && data.length) setNotes(data);
      setNotesLoading(false);
    }).catch(() => setNotesLoading(false));
  }, [hydrated]); // eslint-disable-line

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div style={{fontSize:22,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Information</div>
        <button onClick={()=>{setNoteAddOpen(true);setNoteEditId(null);setNoteDraft({title:"",content:""});}} style={{padding:"9px 18px",borderRadius:10,background:"#1d1d1f",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New</button>
      </div>

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
            <div key={n.id} style={{borderRadius:16,padding:"20px 22px",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",display:"flex",flexDirection:"column",gap:8}}>
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
  );
}
