import React from "react";

export function AppSidebar({T,isMobile,activeTab,TABS,changeTab,buildPath,setActiveTab,setSelectedProject,pushNav,StarIcon}){
  if(isMobile) return null;
  return (
    <div style={{width:220,flexShrink:0,background:"rgba(255,255,255,0.82)",borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
      <div style={{height:16}}/>

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

export function Topbar({T,isMobile,P,currentTab,selectedProject,projectSection,creativeSubSection,budgetSubSection,apiLoading,apiError,changeTab,mobileMenuOpen,setMobileMenuOpen,notifications,setNotifications,NotificationBell:NotifBellComp}){
  return (
    <div style={{padding:`0 ${P}px`,height:isMobile?50:58,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`,flexShrink:0,background:"rgba(255,255,255,0.9)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0,flex:1}}>
        <span style={{fontSize:isMobile?14:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentTab.label}</span>
        {selectedProject&&<><span style={{color:T.muted,fontSize:16,fontWeight:300,flexShrink:0}}>›</span><span style={{fontSize:isMobile?12:14,color:T.sub,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selectedProject.name}</span>{!isMobile&&projectSection!=="Home"&&<><span style={{color:T.muted,fontSize:16}}>›</span><span style={{fontSize:13,color:T.muted}}>{projectSection}{creativeSubSection?` › ${creativeSubSection==="moodboard"?"Moodboard":"Brief"}`:""}{budgetSubSection?` › ${budgetSubSection==="tracker"?"Budget Tracker":budgetSubSection==="estimates"?"Estimates":"Quotations"}`:""}</span></>}</>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:isMobile?6:10,flexShrink:0}}>
        {!isMobile&&apiLoading&&<span style={{fontSize:11,color:T.muted,display:"flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:"#92680a",display:"inline-block",animation:"pulse 1.2s ease-in-out infinite"}}/>Syncing…</span>}
        {!isMobile&&apiError&&!apiLoading&&<span title={`API: ${apiError}`} style={{fontSize:11,color:"#c0392b",cursor:"default"}}>● Offline</span>}
        {!isMobile&&!apiLoading&&!apiError&&<span style={{fontSize:11,color:"#147d50",display:"flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:"50%",background:"#147d50",display:"inline-block"}}/>Live</span>}
        {NotifBellComp&&notifications&&<NotifBellComp T={T} notifications={notifications} setNotifications={setNotifications}/>}
        {isMobile&&<button onClick={()=>setMobileMenuOpen(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",padding:6,fontSize:18,lineHeight:1,color:T.text,fontFamily:"inherit"}}>{mobileMenuOpen?"✕":"☰"}</button>}
      </div>
    </div>
  );
}
