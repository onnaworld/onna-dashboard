import React from "react";

const ONNA_LOGO = "data:image/png;base64,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";

export function AppSidebar({T,isMobile,activeTab,TABS,changeTab,buildPath,setActiveTab,setSelectedProject,pushNav,StarIcon}){
  if(isMobile) return null;
  return (
    <div style={{width:220,flexShrink:0,background:"rgba(255,255,255,0.82)",borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
      <a href="/" onClick={(e)=>{if(!e.metaKey&&!e.ctrlKey){e.preventDefault();changeTab("Dashboard")}}} style={{padding:"20px 18px 16px",display:"flex",alignItems:"center",cursor:"pointer",textDecoration:"none"}}>
        <img src={ONNA_LOGO} alt="ONNA" style={{height:24,width:"auto",display:"block"}}/>
      </a>

      <nav style={{flex:1,padding:"4px 8px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
        {TABS.map(t=>(
          <a key={t.id} href={buildPath(t.id,null,null,null)} onClick={(e)=>{if(e.metaKey||e.ctrlKey)return;e.preventDefault();changeTab(t.id);}} className={`nav-btn${activeTab===t.id?" active":""}`} style={{textDecoration:"none",color:"inherit"}}>
            <StarIcon size={11} color={t.starColor||"currentColor"}/>
            <span>{t.label}</span>
          </a>
        ))}
      </nav>
      <div style={{margin:10,position:"relative"}}>
        <button onClick={()=>{setActiveTab("Settings");setSelectedProject(null);pushNav("Settings",null,null,null);}} style={{width:"100%",padding:"12px 14px",borderRadius:12,background:activeTab==="Settings"?"rgba(0,0,0,0.08)":"rgba(0,0,0,0.04)",border:`1px solid rgba(0,0,0,0.07)`,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0}}>E</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:T.text}}>Emily</div>
            <div style={{fontSize:11,color:T.muted}}>Admin · onna</div>
          </div>
        </button>
      </div>
    </div>
  );
}

export function Topbar({T,isMobile,P,currentTab,selectedProject,projectSection,creativeSubSection,budgetSubSection,apiLoading,apiError,changeTab,mobileMenuOpen,setMobileMenuOpen}){
  return (
    <div style={{padding:`0 ${P}px`,height:isMobile?50:58,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`,flexShrink:0,background:"rgba(255,255,255,0.9)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0,flex:1}}>
        {isMobile&&<img src="/onna-default-logo.png" alt="ONNA" onClick={(e)=>{if(e.metaKey||e.ctrlKey){window.open(window.location.origin,"_blank")}else{changeTab("Dashboard")}}} style={{height:18,width:"auto",marginRight:6,flexShrink:0,cursor:"pointer"}}/>}
        <span style={{fontSize:isMobile?14:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentTab.label}</span>
        {selectedProject&&<><span style={{color:T.muted,fontSize:16,fontWeight:300,flexShrink:0}}>›</span><span style={{fontSize:isMobile?12:14,color:T.sub,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selectedProject.name}</span>{!isMobile&&projectSection!=="Home"&&<><span style={{color:T.muted,fontSize:16}}>›</span><span style={{fontSize:13,color:T.muted}}>{projectSection}{creativeSubSection?` › ${creativeSubSection==="moodboard"?"Moodboard":"Brief"}`:""}{budgetSubSection?` › ${budgetSubSection==="tracker"?"Budget Tracker":budgetSubSection==="estimates"?"Estimates":"Quotations"}`:""}</span></>}</>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:isMobile?6:10,flexShrink:0}}>
        {!isMobile&&apiLoading&&<span style={{fontSize:11,color:T.muted,display:"flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:"#92680a",display:"inline-block",animation:"pulse 1.2s ease-in-out infinite"}}/>Syncing…</span>}
        {!isMobile&&apiError&&!apiLoading&&<span title={`API: ${apiError}`} style={{fontSize:11,color:"#c0392b",cursor:"default"}}>● Offline</span>}
        {!isMobile&&!apiLoading&&!apiError&&<span style={{fontSize:11,color:"#147d50",display:"flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:"50%",background:"#147d50",display:"inline-block"}}/>Live</span>}
        {isMobile&&<button onClick={()=>setMobileMenuOpen(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",padding:6,fontSize:18,lineHeight:1,color:T.text,fontFamily:"inherit"}}>{mobileMenuOpen?"✕":"☰"}</button>}
      </div>
    </div>
  );
}
