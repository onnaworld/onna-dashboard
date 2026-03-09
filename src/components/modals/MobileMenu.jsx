import React from "react";

export function MobileMenu({ isMobile, mobileMenuOpen, setMobileMenuOpen, T, TABS, buildPath, activeTab, changeTab, StarIcon, setShowArchive, setAuthed }) {
  return (
    <>
      <div onClick={()=>setMobileMenuOpen(false)} style={{position:"fixed",inset:0,zIndex:199,background:"rgba(0,0,0,0.25)"}}/>
      <div style={{position:"fixed",top:50,left:0,right:0,zIndex:200,background:"rgba(255,255,255,0.98)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`1px solid ${T.border}`,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",maxHeight:"calc(100vh - 60px)",overflowY:"auto",paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        {TABS.map(t=>(
          <a key={t.id} href={buildPath(t.id,null,null,null)} onClick={(e)=>{if(e.metaKey||e.ctrlKey)return;e.preventDefault();changeTab(t.id);setMobileMenuOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"13px 20px",background:activeTab===t.id?"#f5f5f7":"transparent",border:"none",borderBottom:`1px solid ${T.border}`,cursor:"pointer",fontFamily:"inherit",textDecoration:"none",color:"inherit"}}>
            <StarIcon size={12} color={activeTab===t.id?(t.starColor||"#1d1d1f"):"#aeaeb2"}/>
            <span style={{fontSize:13,fontWeight:activeTab===t.id?700:500,letterSpacing:"0.04em",color:activeTab===t.id?"#1d1d1f":"#666"}}>{t.label}</span>
          </a>
        ))}
        <button onClick={()=>{setShowArchive(true);setMobileMenuOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"13px 20px",background:"transparent",border:"none",borderBottom:`1px solid ${T.border}`,cursor:"pointer",fontFamily:"inherit"}}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="3" rx="1" stroke="#aeaeb2" strokeWidth="1.3"/><path d="M1.5 4v5.5a1 1 0 001 1h7a1 1 0 001-1V4" stroke="#aeaeb2" strokeWidth="1.3"/><path d="M4.5 7h3" stroke="#aeaeb2" strokeWidth="1.3" strokeLinecap="round"/></svg>
          <span style={{fontSize:13,fontWeight:500,letterSpacing:"0.04em",color:"#666"}}>ARCHIVE</span>
        </button>
        <button onClick={()=>{localStorage.removeItem("onna_token");setAuthed(false);setMobileMenuOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"13px 20px",background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit"}}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none"><path d="M4.5 2H2a1 1 0 00-1 1v6a1 1 0 001 1h2.5M8 9l3-3-3-3M11 6H5" stroke="#aeaeb2" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{fontSize:13,fontWeight:500,letterSpacing:"0.04em",color:"#666"}}>SIGN OUT</span>
        </button>
      </div>
    </>
  );
}
