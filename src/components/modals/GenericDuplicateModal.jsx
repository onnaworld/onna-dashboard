import React from "react";

export function GenericDuplicateModal({ duplicateModal, setDuplicateModal, duplicateSearch, setDuplicateSearch, localProjects, archivedProjects, selectedProject, pushUndo, cpsStore, setCpsStore, shotListStore, setShotListStore, storyboardStore, setStoryboardStore, postProdStore, setPostProdStore, castingDeckStore, setCastingDeckStore, castingTableStore, setCastingTableStore, fittingStore, setFittingStore, locDeckStore, setLocDeckStore, recceReportStore, setRecceReportStore, dietaryStore, setDietaryStore, travelItineraryStore, setTravelItineraryStore, projectEstimates, setProjectEstimates }) {
    const dt=duplicateModal.type;
    const DCONF={
      cps:{store:cpsStore,setStore:setCpsStore,archiveTable:"cps",archiveKey:"cps",title:"CPS",descFn:r=>{const t=(r.item?.phases||[]).reduce((s,ph)=>(ph.tasks||[]).length+s,0);return `${t} task${t!==1?"s":""}`;},labelKey:"label"},
      shotlist:{store:shotListStore,setStore:setShotListStore,archiveTable:"shotlist",archiveKey:"shotlist",title:"Shot List",descFn:r=>{const s=(r.item?.scenes||[]).length;return `${s} scene${s!==1?"s":""}`;},labelKey:"label"},
      storyboard:{store:storyboardStore,setStore:setStoryboardStore,archiveTable:"storyboard",archiveKey:"storyboard",title:"Storyboard",descFn:r=>{const f=(r.item?.frames||[]).length;return `${f} frame${f!==1?"s":""}`;},labelKey:"label"},
      postprod:{store:postProdStore,setStore:setPostProdStore,archiveTable:"postprod",archiveKey:"postprod",title:"Post-Production",descFn:r=>{const v=(r.item?.videos||[]).length;return `${v} video${v!==1?"s":""}`;},labelKey:"label"},
      casting:{store:castingDeckStore,setStore:setCastingDeckStore,archiveTable:"castingDecks",archiveKey:"castingDeck",title:"Casting Deck",descFn:r=>{const c=(r.item?.confirmed||[]).length;return `${c} confirmed`;},labelKey:"label"},
      casting_table:{store:castingTableStore,setStore:setCastingTableStore,archiveTable:"casting_table",archiveKey:"castingTable",title:"Casting Table",descFn:r=>{const m=(r.item?.roles||[]).reduce((s,rl)=>(rl.models||[]).length+s,0);return `${m} model${m!==1?"s":""}`;},labelKey:"label"},
      fitting:{store:fittingStore,setStore:setFittingStore,archiveTable:"fitting",archiveKey:"fitting",title:"Fitting Deck",descFn:r=>{const t=(r.item?.talent||[]).length;return `${t} talent`;},labelKey:"label"},
      locations:{store:locDeckStore,setStore:setLocDeckStore,archiveTable:"locationDecks",archiveKey:"locationDeck",title:"Locations Deck",descFn:r=>{const l=(r.item?.locations||[]).length;return `${l} location${l!==1?"s":""}`;},labelKey:"label"},
      recce:{store:recceReportStore,setStore:setRecceReportStore,archiveTable:"recceReports",archiveKey:"recceReport",title:"Recce Report",descFn:r=>{const l=(r.item?.locations||[]).length;return `${l} location${l!==1?"s":""}`;},labelKey:"label"},
      dietary:{store:dietaryStore,setStore:setDietaryStore,archiveTable:"dietaries",archiveKey:"dietary",title:"Dietary List",descFn:r=>{const c=(r.item?.people||[]).length;return `${c} crew`;},labelKey:"label"},
      itinerary:{store:travelItineraryStore,setStore:setTravelItineraryStore,archiveTable:"travelItineraries",archiveKey:"travelItinerary",title:"Travel Itinerary",descFn:r=>{const s=(r.item?.sections||[]).length;return `${s} section${s!==1?"s":""}`;},labelKey:"label"},
      estimate:{store:projectEstimates,setStore:setProjectEstimates,archiveTable:"estimates",archiveKey:"estimate",title:"Production Estimate",descFn:r=>{const secs=r.item?.sections||[];const gt=secs.reduce((s,sec)=>(sec.items||[]).reduce((a,it)=>a+(parseFloat(it.total)||0),0)+s,0);return gt>0?`AED ${gt.toLocaleString(undefined,{maximumFractionDigits:0})}`:"Empty";},labelKey:"ts.version",getLabelFn:item=>item?.ts?.version||"Untitled",setLabelFn:(clone,label)=>{if(!clone.ts)clone.ts={};clone.ts.version=label;}},
    };
    const conf=DCONF[dt];if(!conf)return null;
    const q=duplicateSearch.toLowerCase().trim();
    const results=[];
    Object.entries(conf.store||{}).forEach(([pid,items])=>{
      const proj=localProjects?.find(p=>String(p.id)===String(pid))||(archivedProjects||[]).find(p=>String(p.id)===String(pid));
      if(!proj)return; // skip orphaned data from deleted projects
      const projName=proj.name||"Untitled Project";
      const client=proj.client||"";
      const _getLabel=conf.getLabelFn||(item=>item[conf.labelKey]||"Untitled");
      (items||[]).forEach(item=>{
        results.push({item,projName,client,projectId:pid,label:_getLabel(item),source:"active"});
      });
    });
    const filtered=q?results.filter(r=>[r.projName,r.client,r.label].some(s=>(s||"").toLowerCase().includes(q))):results;
    const grouped={};
    filtered.forEach(r=>{const key=r.projName+(r.client?" | "+r.client:"");if(!grouped[key])grouped[key]=[];grouped[key].push(r);});
    const handleDuplicate=(r)=>{
      const clone=JSON.parse(JSON.stringify(r.item));
      clone.id=Date.now();
      if(clone.shareToken){clone.shareToken=null;clone.shareResourceId=null;}
      const _pid=selectedProject?.id;
      const _proj=localProjects?.find(p=>p.id===_pid)||(archivedProjects||[]).find(p=>p.id===_pid);
      const _pName=_proj?.name||"";
      if(_pid){
        pushUndo("duplicate " + conf.title.toLowerCase());
        conf.setStore(prev=>{const store=JSON.parse(JSON.stringify(prev));if(!store[_pid])store[_pid]=[];const vn=store[_pid].length+1;const autoLabel=`${_pName} ${conf.title} V${vn}`;if(conf.setLabelFn)conf.setLabelFn(clone,autoLabel);else clone.label=autoLabel;store[_pid].push(clone);return store;});
      }
      setDuplicateModal(null);setDuplicateSearch("");
    };
    return(
      <div onClick={()=>{setDuplicateModal(null);setDuplicateSearch("");}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:18,width:500,maxWidth:"94vw",maxHeight:"70vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.18)",overflow:"hidden"}}>
          <div style={{padding:"20px 24px 0",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:16,fontWeight:700,color:"#1d1d1f",letterSpacing:"-0.02em"}}>Copy {conf.title} from Project</div>
              <button onClick={()=>{setDuplicateModal(null);setDuplicateSearch("");}} style={{background:"#f5f5f7",border:"none",color:"#86868b",width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <input value={duplicateSearch} onChange={e=>setDuplicateSearch(e.target.value)} placeholder={`Search by project, client, or ${conf.title.toLowerCase()} name...`} autoFocus style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid #e0e0e0",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:12}} />
          </div>
          <div style={{overflowY:"auto",flex:1,padding:"0 24px 20px"}}>
            {Object.keys(grouped).length===0?(
              <div style={{textAlign:"center",padding:"32px 0",color:"#86868b",fontSize:13}}>No {conf.title.toLowerCase()}s found{q?" matching your search":""}.</div>
            ):Object.entries(grouped).map(([groupKey,items])=>(
              <div key={groupKey} style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:"#86868b",letterSpacing:0.5,textTransform:"uppercase",marginBottom:6,padding:"4px 0"}}>{groupKey}</div>
                {items.map((r,ri)=>(
                  <div key={ri} onClick={()=>handleDuplicate(r)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,border:"1px solid #e8e8e8",marginBottom:6,cursor:"pointer",transition:"border-color 0.15s,background 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#1976D2";e.currentTarget.style.background="#e3f2fd";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e8e8e8";e.currentTarget.style.background="transparent";}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#1d1d1f",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.label}</div>
                      <div style={{fontSize:11,color:"#86868b",marginTop:2}}>{conf.descFn(r)}</div>
                    </div>
                    <div style={{fontSize:11,color:"#1976D2",fontWeight:600,flexShrink:0}}>Duplicate</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
}
