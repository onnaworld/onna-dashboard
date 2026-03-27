import React from "react";

export default function Creative({
  T, isMobile, p,
  creativeSubSection, setCreativeSubSection,
  projectFileStore, setProjectFileStore,
  projectCreativeLinks, setProjectCreativeLinks,
  creativeSearchTerm, setCreativeSearchTerm,
  linkUploading, linkUploadProgress, uploadFromLink,
  pushNav, showAlert, buildPath,
  UploadZone,
}) {
  const storeFiles = (projectFileStore[p.id]||{});
  const moodFiles = storeFiles.moodboards||[];
  const briefFiles = storeFiles.briefs||[];

  const addStoredFiles = async (category, fileList) => {
    const newEntries = [];
    for (const f of fileList) {
      if (f.size > 40*1024*1024) { showAlert(`"${f.name}" is over 40 MB. Please use the Dropbox / Drive link for very large files.`); continue; }
      const data = await new Promise(r=>{const fr=new FileReader();fr.onload=e=>r(e.target.result);fr.readAsDataURL(f);});
      newEntries.push({id:Date.now()+Math.random(),name:f.name,size:f.size,type:f.type,data,createdAt:Date.now()});
    }
    if (newEntries.length===0) return;
    setProjectFileStore(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),[category]:[...((prev[p.id]||{})[category]||[]),...newEntries]}}));
  };
  const deleteStoredFile = (category, fileId) => {
    setProjectFileStore(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),[category]:((prev[p.id]||{})[category]||[]).filter(f=>f.id!==fileId)}}));
  };
  const downloadStoredFile = (file) => {
    const a=document.createElement("a"); a.href=file.data; a.download=file.name; a.click();
  };

  const FileVersionList = ({files,category}) => (
    <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14}}>
      {files.map((f,i)=>(
        <div key={f.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:12,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
          <span style={{fontSize:11,fontWeight:700,color:"#fff",background:T.accent,borderRadius:6,padding:"3px 8px",flexShrink:0}}>V{i+1}</span>
          <span style={{fontSize:15,flexShrink:0}}>{f.type?.includes("pdf")?"📄":f.type?.includes("image")?"🖼":"📎"}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,color:T.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:1}}>{(f.size/1024).toFixed(0)} KB · {new Date(f.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
          </div>
          <button onClick={()=>downloadStoredFile(f)} style={{background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Download</button>
          <button onClick={()=>{if(confirm(`Delete V${i+1} — ${f.name}?`))deleteStoredFile(category,f.id);}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:"0 4px",lineHeight:1,flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#c0392b"} onMouseOut={e=>e.currentTarget.style.color=T.muted}>×</button>
        </div>
      ))}
    </div>
  );

  const renderFileManager = (category, label, linkKey) => {
    const files = category==="moodboards"?moodFiles:briefFiles;
    const link = (projectCreativeLinks[p.id]||{})[linkKey]||"";
    return (
      <div>
        <button onClick={()=>window.history.back()} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>‹ Back to Creative</button>
        <div style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:4}}>{label}</div>
        <p style={{fontSize:12.5,color:T.muted,marginBottom:18}}>Upload versioned files or paste a Dropbox / Drive link to import.</p>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Dropbox / Drive Link</div>
          <div style={{display:"flex",gap:10}}>
            <input value={link} onChange={e=>setProjectCreativeLinks(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),[linkKey]:e.target.value}}))} placeholder="https://www.dropbox.com/sh/..." style={{flex:1,padding:"9px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
            {link&&<button disabled={linkUploading} onClick={()=>uploadFromLink(link,category)} style={{display:"flex",alignItems:"center",padding:"9px 18px",borderRadius:10,background:linkUploading?"#999":T.accent,color:"#fff",fontSize:13,fontWeight:600,border:"none",cursor:linkUploading?"default":"pointer",flexShrink:0,fontFamily:"inherit"}}>{linkUploading?"Uploading…":"Upload"}</button>}
          </div>
          {linkUploadProgress!==null&&<div style={{marginTop:8}}><div style={{height:6,borderRadius:3,background:"#e5e5ea",overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:linkUploadProgress===100?"#34c759":T.accent,width:`${linkUploadProgress}%`,transition:"width 0.3s ease"}}/></div><div style={{fontSize:11,color:T.muted,marginTop:4}}>{linkUploadProgress===100?"Complete!":linkUploadProgress<50?"Sending…":"Downloading…"} {linkUploadProgress}%</div></div>}
        </div>
        <UploadZone label={`Upload ${label.toLowerCase()} files (PDF, images)`} files={[]} onAdd={f=>addStoredFiles(category,f)}/>
        {files.length>0&&(
          <>
            <input value={creativeSearchTerm} onChange={e=>setCreativeSearchTerm(e.target.value)} placeholder={`Search ${label.toLowerCase()} files…`} style={{width:"100%",padding:"9px 14px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",marginTop:16,marginBottom:8,boxSizing:"border-box"}}/>
            <div style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,marginTop:6,marginBottom:6}}>{(creativeSearchTerm.trim()?files.filter(f=>f.name.toLowerCase().includes(creativeSearchTerm.trim().toLowerCase())):files).length} file{(creativeSearchTerm.trim()?files.filter(f=>f.name.toLowerCase().includes(creativeSearchTerm.trim().toLowerCase())):files).length!==1?"s":""}{creativeSearchTerm.trim()?" found":" uploaded"}</div>
            <FileVersionList files={creativeSearchTerm.trim()?files.filter(f=>f.name.toLowerCase().includes(creativeSearchTerm.trim().toLowerCase())):files} category={category}/>
          </>
        )}
      </div>
    );
  };

  // Sub-navigation: show cards if no sub-section selected
  if (!creativeSubSection) {
    return (
      <div>
        <p style={{fontSize:13,color:T.sub,marginBottom:18}}>Creative assets for this project.</p>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:12}}>
          {[["moodboard","Moodboard","🎨",moodFiles.length+" file"+(moodFiles.length!==1?"s":"")],["brief","Brief","📋",briefFiles.length+" file"+(briefFiles.length!==1?"s":"")]].map(([key,label,emoji,desc])=>(
            <a key={key} href={buildPath("Projects",p.id,"Creative",key)} onClick={(e)=>{if(e.metaKey||e.ctrlKey)return;e.preventDefault();setCreativeSubSection(key);pushNav("Projects",p,"Creative",key);}} className="proj-card" style={{borderRadius:16,padding:"22px 22px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",textDecoration:"none",color:"inherit"}}>
              <span style={{fontSize:28,flexShrink:0}}>{emoji}</span>
              <div style={{minWidth:0,flex:1}}>
                <div style={{fontSize:15,fontWeight:600,color:T.text,marginBottom:3}}>{label}</div>
                <div style={{fontSize:12,color:T.muted}}>{desc}</div>
              </div>
              <span style={{color:T.muted,fontSize:16,flexShrink:0}}>›</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (creativeSubSection==="moodboard") return renderFileManager("moodboards","Moodboard","moodboard");
  if (creativeSubSection==="brief") return renderFileManager("briefs","Brief","brief");
}
