import React, { useState, useRef } from "react";

export default function Travel({
  T, isMobile, p,
  travelSubSection, setTravelSubSection,
  travelItineraryStore, setTravelItineraryStore, activeTIVersion, setActiveTIVersion,
  tiShowAddMenu, setTiShowAddMenu,
  projectLocLinks, setProjectLocLinks,
  projectInfoRef,
  createMenuOpen, setCreateMenuOpen, setDuplicateModal, setDuplicateSearch,
  pushUndo, archiveItem, pushNav, showAlert, showPrompt,
  getProjectFiles, addProjectFiles,
  TRAVEL_ITINERARY_INIT, tiMkDay, tiMkMove,
  TI_FLIGHT_COLS, TI_CAR_COLS, TI_HOTEL_COLS, TI_ROOMING_COLS, TI_MOVEMENT_COLS,
  TICell, TITableSection, BtnExport, CSLogoSlot, UploadZone,
  CS_FONT, CS_LS, PRINT_CLEANUP_CSS,
}) {
  const TRAVEL_CARDS = [
    {key:"flights",   emoji:"✈️",  label:"Flights"},
    {key:"passports", emoji:"🛂", label:"Passports"},
    {key:"hotels",    emoji:"🏨", label:"Hotels"},
    {key:"itinerary", emoji:"🗺️",  label:"Travel Itinerary"},
  ];

  if (!travelSubSection) return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:18}}>
        {TRAVEL_CARDS.map(c=>(
          <div key={c.key} onClick={()=>{setTravelSubSection(c.key);pushNav("Projects",p,"Travel",c.key);}} className="proj-card" style={{borderRadius:16,padding:"22px 20px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",transition:"border-color 0.15s"}}>
            <span style={{fontSize:28}}>{c.emoji}</span>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:T.text}}>{c.label}</div>
              <div style={{fontSize:12,color:T.muted,marginTop:2}}>{(getProjectFiles(p.id,"travel_"+c.key)||[]).length} file{(getProjectFiles(p.id,"travel_"+c.key)||[]).length!==1?"s":""}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:10,color:T.muted,marginBottom:8,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Dropbox / Drive Folder Link</div>
        <div style={{display:"flex",gap:10}}>
          <input value={projectLocLinks[p.id+"_travel"]||""} onChange={e=>setProjectLocLinks(prev=>({...prev,[p.id+"_travel"]:e.target.value}))} placeholder="https://www.dropbox.com/sh/..." style={{flex:1,padding:"9px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
          {projectLocLinks[p.id+"_travel"]&&<a href={projectLocLinks[p.id+"_travel"]} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",padding:"9px 18px",borderRadius:10,background:T.accent,color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none"}}>Open Folder ↗</a>}
        </div>
      </div>
    </div>
  );

  const travelBack = <button onClick={()=>window.history.back()} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>‹ Back to Travel</button>;
  const tc = TRAVEL_CARDS.find(c=>c.key===travelSubSection);

  // ── Travel Itinerary: full document editor ──
  if (travelSubSection === "itinerary") {
    const tiVersions = travelItineraryStore[p.id] || [];
    const addTINew = () => {
      pushUndo("add travel itinerary");
      const newId = Date.now();
      const newTI = {id:newId,label:`${p.name} Travel Itinerary V${tiVersions.length+1}`,...JSON.parse(JSON.stringify(TRAVEL_ITINERARY_INIT))};
      const _pi=(projectInfoRef.current||{})[p.id];
      if(_pi){if(_pi.shootName)newTI.project.name=_pi.shootName;if(_pi.shootDate)newTI.project.date=_pi.shootDate;}
      newTI.project.name=newTI.project.name==="[Project Name]"?`${p.client||""} | ${p.name}`.replace(/^TEMPLATE \| /,""):newTI.project.name;
      setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));if(!store[p.id])store[p.id]=[];store[p.id].push(newTI);return store;});
      const logoImg=new Image();logoImg.crossOrigin="anonymous";logoImg.onload=()=>{try{const cv=document.createElement("canvas");cv.width=logoImg.naturalWidth;cv.height=logoImg.naturalHeight;cv.getContext("2d").drawImage(logoImg,0,0);const dataUrl=cv.toDataURL("image/png");setTravelItineraryStore(prev=>{const s=JSON.parse(JSON.stringify(prev));const arr=s[p.id]||[];const idx=arr.findIndex(e=>e.id===newId);if(idx>=0&&!arr[idx].productionLogo){arr[idx].productionLogo=dataUrl;}return s;});}catch{}};logoImg.src="/onna-default-logo.png";
      setActiveTIVersion(tiVersions.length);
    };
    const deleteTI = (idx) => {
      if(!confirm("Delete this travel itinerary? This will be moved to Deleted."))return;
      pushUndo("delete travel itinerary");
      const tiData=JSON.parse(JSON.stringify((travelItineraryStore[p.id]||[])[idx]));
      if(tiData)archiveItem('travelItineraries',{projectId:p.id,travelItinerary:tiData});
      setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];arr.splice(idx,1);store[p.id]=arr;return store;});
      setActiveTIVersion(null);
    };

    // ── List view ──
    if (activeTIVersion === null || tiVersions.length === 0) {
      return (
        <div>
          {travelBack}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{fontSize:16,fontWeight:700,color:T.text}}>Travel Itineraries</div>
            <div style={{position:"relative"}}>
              <button onClick={()=>setCreateMenuOpen(prev=>({...prev,ti:!prev.ti}))} style={{padding:"7px 16px",borderRadius:9,background:T.accent,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New Itinerary ▾</button>
              {createMenuOpen.ti&&<div onClick={()=>setCreateMenuOpen(prev=>({...prev,ti:false}))} style={{position:"fixed",inset:0,zIndex:9998}} />}
              {createMenuOpen.ti&&(
                <div style={{position:"absolute",top:36,right:0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:180,overflow:"hidden"}}>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,ti:false}));addTINew();}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Blank</div>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,ti:false}));setDuplicateModal({type:"itinerary"});setDuplicateSearch("");}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Existing</div>
                </div>
              )}
            </div>
          </div>
          {tiVersions.length===0 && <div style={{borderRadius:14,background:"#fafafa",border:`1.5px dashed ${T.border}`,padding:44,textAlign:"center"}}><div style={{fontSize:13,color:T.muted}}>No travel itineraries yet. Click "+ New Itinerary" to get started.</div></div>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {tiVersions.map((ti,i)=>{
              const secCount=(ti.sections||[]).length;
              const rowCount=(ti.sections||[]).reduce((sum,s)=>(s.data||[]).length+sum,0);
              return(
                <div key={ti.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border-color 0.15s"}} onClick={()=>setActiveTIVersion(i)}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>TI</span>
                      <span style={{fontSize:8,fontWeight:600,letterSpacing:0.5,background:rowCount>0?"#e8f5e9":"#f5f5f5",color:rowCount>0?"#2e7d32":"#999",padding:"2px 8px",borderRadius:4}}>{secCount} section{secCount!==1?"s":""} · {rowCount} entr{rowCount!==1?"ies":"y"}</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:T.text}}>{ti.label||"Untitled"}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>{ti.project?.destination||"No destination set"}</div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();deleteTI(i);}} style={{padding:"4px 10px",borderRadius:7,background:"#fff5f5",color:"#c0392b",border:"1px solid #f5c6cb",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ── Detail view ──
    const tiIdx = Math.min(activeTIVersion, tiVersions.length-1);
    const tiData = tiVersions[tiIdx] || tiVersions[0];
    if(!tiData){setActiveTIVersion(null);return null;}

    const tiU = (path, val) => {
      setTravelItineraryStore(prev=>{
        const store=JSON.parse(JSON.stringify(prev));
        const arr=store[p.id]||[];
        const idx=Math.min(tiIdx,arr.length-1);
        const d=arr[idx];
        const k=path.split(".");let o=d;
        for(let i=0;i<k.length-1;i++)o=o[k[i]];
        o[k[k.length-1]]=val;
        arr[idx]=d;store[p.id]=arr;return store;
      });
    };
    const tiColsFor = (sec) => sec.type==="flights"?TI_FLIGHT_COLS:sec.type==="cars"?TI_CAR_COLS:sec.type==="hotels"?TI_HOTEL_COLS:(sec.columns||[]);
    const tiTemplateFor = (type) => type==="flights"?{id:Date.now(),name:"[Name / Role]",dateOut:"[Date]",routeOut:"[City (Code) > City (Code)]",timeOut:"[00:00 > 00:00]",dateReturn:"[Date]",routeReturn:"[City (Code) > City (Code)]",timeReturn:"[00:00 > 00:00]",airline:"[Airline]",flightNo:"[XX 000]",bookingRef:"[Ref]"}:type==="cars"?{id:Date.now(),name:"[Name]",date:"[Date]",flightTime:"[00:00 > 00:00]",collectionTime:"[00:00]",flightNo:"[XX 000]",pickUp:"[Airport / Hotel / Full Address]",dropOff:"[Hotel / Location / Full Address]",vehicleType:"[Sedan]",bookingRef:"[Ref]"}:{id:Date.now(),name:"[Name / Role]",hotel:"[Hotel Name]",address:"[Full Address]",checkIn:"[Date]",checkOut:"[Date]",roomType:"[Standard]",bookingRef:"[Ref]",notes:""};
    const tiUpdateRow = (si,ri,key,val) => {
      setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[tiIdx];d.sections=d.sections.map((s,i)=>i===si?{...s,data:s.data.map((r,j)=>j===ri?{...r,[key]:val}:r)}:s);arr[tiIdx]=d;store[p.id]=arr;return store;});
    };
    const tiAddRow = (si) => {
      const sec=tiData.sections[si];
      if(sec.type==="custom"){const emptyRow={id:Date.now()};(sec.columns||[]).forEach(c=>{emptyRow[c.key]="";});setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[tiIdx];d.sections[si].data.push(emptyRow);arr[tiIdx]=d;store[p.id]=arr;return store;});}
      else{setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[tiIdx];d.sections[si].data.push({...tiTemplateFor(sec.type),id:Date.now()});arr[tiIdx]=d;store[p.id]=arr;return store;});}
    };
    const tiDeleteRow = (si,ri) => {setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[tiIdx];d.sections[si].data=d.sections[si].data.filter((_,j)=>j!==ri);arr[tiIdx]=d;store[p.id]=arr;return store;});};
    const tiDeleteSection = (si) => {setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[tiIdx];d.sections=d.sections.filter((_,i)=>i!==si);arr[tiIdx]=d;store[p.id]=arr;return store;});};
    const tiEditSectionTitle = async (si) => {const val=await showPrompt("Section title:",tiData.sections[si].title);if(val!==null){setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];arr[tiIdx].sections[si].title=val.toUpperCase();store[p.id]=arr;return store;});}};
    const tiEditSectionSubtitle = async (si) => {const val=await showPrompt("Subtitle (leave blank for none):",tiData.sections[si].subtitle);if(val!==null){setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];arr[tiIdx].sections[si].subtitle=val;store[p.id]=arr;return store;});}};
    const tiAddSection = async (type) => {
      if(type==="custom"){
        const title=await showPrompt("Section title:","NEW SECTION");if(!title)return;
        const colInput=await showPrompt("Enter column names separated by commas:","Name, Date, Details, Notes");if(!colInput)return;
        const colNames=colInput.split(",").map(s=>s.trim()).filter(Boolean);if(colNames.length===0)return;
        const cols=colNames.map((name,i)=>({key:`col${i+1}`,label:name.toUpperCase(),flex:1}));
        const emptyRow={id:Date.now()};cols.forEach(c=>{emptyRow[c.key]="[Value]";});
        setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];arr[tiIdx].sections.push({id:`custom_${Date.now()}`,type:"custom",title:title.toUpperCase(),subtitle:"",data:[emptyRow],columns:cols});store[p.id]=arr;return store;});
      } else {
        const defs={flights:{type:"flights",title:"FLIGHT SCHEDULE",subtitle:"",data:[tiTemplateFor("flights")]},cars:{type:"cars",title:"AIRPORT TRANSFERS",subtitle:"All passengers will receive a text with driver details and live tracking link.",data:[tiTemplateFor("cars")]},hotels:{type:"hotels",title:"HOTEL ACCOMMODATION",subtitle:"",data:[tiTemplateFor("hotels")]}};
        setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];arr[tiIdx].sections.push({...defs[type],id:`${type}_${Date.now()}`});store[p.id]=arr;return store;});
      }
    };
    const tiAddCustomColumn = async (si) => {
      const name=await showPrompt("Column name:");if(!name)return;
      const sec=tiData.sections[si];const newKey=`col${(sec.columns||[]).length+1}_${Date.now()}`;
      setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const s=arr[tiIdx].sections[si];s.columns=[...(s.columns||[]),{key:newKey,label:name.toUpperCase(),flex:1}];s.data=s.data.map(r=>({...r,[newKey]:"[Value]"}));store[p.id]=arr;return store;});
    };
    const tiEditCustomColumn = async (si,ci) => {
      const sec=tiData.sections[si];const col=(sec.columns||[])[ci];if(!col)return;
      const name=await showPrompt("Rename column:",col.label);if(!name)return;
      setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];arr[tiIdx].sections[si].columns=(arr[tiIdx].sections[si].columns||[]).map((c,j)=>j===ci?{...c,label:name.toUpperCase()}:c);store[p.id]=arr;return store;});
    };
    const tiDeleteCustomColumn = (si,ci) => {
      const sec=tiData.sections[si];const col=(sec.columns||[])[ci];if(!col)return;
      setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const s=arr[tiIdx].sections[si];s.columns=(s.columns||[]).filter((_,j)=>j!==ci);s.data=s.data.map(r=>{const nr={...r};delete nr[col.key];return nr;});store[p.id]=arr;return store;});
    };

    // ── Rooming helpers ──
    const tiRooming = tiData.rooming || [];
    const tiTravelTab = tiData.travelTab || "itinerary";
    const tiSetTravelTab = (tab) => tiU("travelTab", tab);
    const tiUpdateRooming = (id,key,val) => {
      setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[tiIdx];d.rooming=(d.rooming||[]).map(r=>r.id===id?{...r,[key]:val}:r);store[p.id]=arr;return store;});
    };
    const tiAddRoomingRow = () => {
      setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[tiIdx];if(!d.rooming)d.rooming=[];d.rooming.push({id:"rm"+Date.now(),passportName:"",hotel:"",roomType:"",sharingWith:"",checkIn:"",checkOut:"",confirmNo:"",requests:""});store[p.id]=arr;return store;});
    };
    const tiDeleteRoomingRow = (id) => {
      setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[tiIdx];d.rooming=(d.rooming||[]).filter(r=>r.id!==id);store[p.id]=arr;return store;});
    };
    const tiDragRm = useRef(null);
    const [tiDropRmAt, setTiDropRmAt] = useState(null);
    const tiReorderRooming = (fromIdx, toIdx) => {
      setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[tiIdx];const rm=[...(d.rooming||[])];const [moved]=rm.splice(fromIdx,1);rm.splice(toIdx,0,moved);d.rooming=rm;store[p.id]=arr;return store;});
    };
    const tiSyncRoomingToHotels = () => {
      setTravelItineraryStore(prev=>{
        const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[tiIdx];
        const hotelIdx=(d.sections||[]).findIndex(s=>s.type==="hotels");
        if(hotelIdx===-1)return store;
        const newData=(d.rooming||[]).filter(r=>r.passportName&&!r.passportName.startsWith("[")).map(r=>({
          id:Date.now()+Math.random(),name:r.passportName,hotel:r.hotel,address:"",checkIn:r.checkIn,checkOut:r.checkOut,
          roomType:r.roomType+(r.sharingWith?" (w/ "+r.sharingWith+")":""),bookingRef:r.confirmNo,notes:r.requests,
        }));
        if(newData.length===0)return store;
        d.sections[hotelIdx].data=newData;store[p.id]=arr;return store;
      });
    };

    // ── Movement order helpers ──
    const tiMoveDays = tiData.moveDays || [tiMkDay()];
    const tiUpdateDay = (did,key,val) => {
      setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[tiIdx];d.moveDays=(d.moveDays||[]).map(dy=>dy.id===did?{...dy,[key]:val}:dy);store[p.id]=arr;return store;});
    };
    const tiAddDay = () => {
      setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[tiIdx];if(!d.moveDays)d.moveDays=[];d.moveDays.push(tiMkDay());store[p.id]=arr;return store;});
    };
    const tiDeleteDay = (did) => {
      setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[tiIdx];d.moveDays=(d.moveDays||[]).filter(dy=>dy.id!==did);store[p.id]=arr;return store;});
    };
    const tiUpdateMove = (did,mid,key,val) => {
      setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[tiIdx];d.moveDays=(d.moveDays||[]).map(dy=>dy.id===did?{...dy,moves:dy.moves.map(m=>m.id===mid?{...m,[key]:val}:m)}:dy);store[p.id]=arr;return store;});
    };
    const tiAddMove = (did) => {
      setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[tiIdx];d.moveDays=(d.moveDays||[]).map(dy=>dy.id===did?{...dy,moves:[...dy.moves,tiMkMove()]}:dy);store[p.id]=arr;return store;});
    };
    const tiDeleteMove = (did,mid) => {
      setTravelItineraryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[p.id]||[];const d=arr[tiIdx];d.moveDays=(d.moveDays||[]).map(dy=>dy.id===did?{...dy,moves:dy.moves.filter(m=>m.id!==mid)}:dy);store[p.id]=arr;return store;});
    };

    const tiExportPDF = () => {
      const el=document.getElementById("onna-ti-print");if(!el)return;
      const clone=el.cloneNode(true);clone.querySelectorAll("button").forEach(b=>b.remove());clone.querySelectorAll("input[type=file]").forEach(b=>b.remove());
      const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
      const tiTitle=`Travel Itinerary | ${p?.name||""}`;
      const doc=iframe.contentDocument;doc.open();doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${tiTitle}</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;padding:10mm 12mm;}@media print{@page{margin:0;size:A4 landscape;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);doc.close();
      doc.body.appendChild(doc.adoptNode(clone));const prevTitle=document.title;document.title=tiTitle;const restoreTitle=()=>{document.title=prevTitle;try{document.body.removeChild(iframe);}catch{}window.removeEventListener("afterprint",restoreTitle);};window.addEventListener("afterprint",restoreTitle);
      setTimeout(()=>{iframe.contentWindow.focus();iframe.contentWindow.print();},300);
    };

    return (
      <div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <button onClick={()=>setActiveTIVersion(null)} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,display:"flex",alignItems:"center",gap:4}}>‹ Back to Itineraries</button>
          <div style={{flex:1}}/>
          <BtnExport onClick={tiExportPDF}>Export PDF</BtnExport>
        </div>
        <div style={{marginBottom:12}}>
          <input value={tiData.label||""} onChange={e=>tiU("label",e.target.value)} style={{fontSize:16,fontWeight:700,color:T.text,background:"transparent",border:"none",outline:"none",fontFamily:"inherit",padding:0,width:"100%"}} placeholder="Itinerary Name"/>
        </div>
        <div id="onna-ti-print" style={{background:"#fff",padding:0,fontFamily:CS_FONT,borderRadius:0}}>
          <div style={{maxWidth:1123,margin:"0 auto",background:"#FFFFFF"}}>
            {/* Top bar */}
            <div style={{padding:isMobile?"16px 12px 0":"40px 40px 0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                <CSLogoSlot label="Production Logo" image={tiData.productionLogo} onUpload={v=>tiU("productionLogo",v)} onRemove={()=>tiU("productionLogo",null)}/>
                <div style={{display:"flex",gap:16,alignItems:"center",marginTop:-3}}>
                  <CSLogoSlot label="Agency Logo" image={tiData.agencyLogo} onUpload={v=>tiU("agencyLogo",v)} onRemove={()=>tiU("agencyLogo",null)}/>
                  <CSLogoSlot label="Client Logo" image={tiData.clientLogo} onUpload={v=>tiU("clientLogo",v)} onRemove={()=>tiU("clientLogo",null)}/>
                </div>
              </div>
              <div style={{borderBottom:"2.5px solid #000",marginBottom:16}}/>
            </div>

            {/* Tab bar */}
            <div style={{display:"flex",borderBottom:"2px solid #000",overflowX:"auto",margin:isMobile?"0 8px":"0 32px"}}>
              {[{id:"itinerary",label:"ITINERARY"},{id:"rooming",label:"ROOMING LIST"},{id:"movement",label:"MOVEMENT ORDER"}].map(t=>(
                <div key={t.id} onClick={()=>tiSetTravelTab(t.id)}
                  style={{fontFamily:CS_FONT,fontSize:9,fontWeight:tiTravelTab===t.id?700:400,letterSpacing:0.5,padding:isMobile?"8px 10px":"10px 16px",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,background:tiTravelTab===t.id?"#000":"#f5f5f5",color:tiTravelTab===t.id?"#fff":"#666",textTransform:"uppercase",borderRight:"1px solid #ddd"}}>{t.label}</div>
              ))}
              <div style={{flex:1}}/>
              {tiTravelTab==="rooming"&&(
                <div onClick={tiSyncRoomingToHotels} style={{fontFamily:CS_FONT,fontSize:9,fontWeight:700,letterSpacing:0.5,padding:"10px 16px",cursor:"pointer",background:"#f5f5f5",color:"#666",textTransform:"uppercase",borderLeft:"1px solid #ddd"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#eee"} onMouseLeave={e=>e.currentTarget.style.background="#f5f5f5"}>
                  SYNC TO HOTELS
                </div>
              )}
            </div>

            <div style={{textAlign:"center",padding:isMobile?"12px 12px 4px":"20px 32px 4px"}}>
              <div style={{fontSize:12,fontWeight:800,letterSpacing:CS_LS,color:"#000"}}>{tiTravelTab==="itinerary"?"TRAVEL ITINERARY":tiTravelTab==="rooming"?"ROOMING LIST":"MOVEMENT ORDER"}</div>
            </div>

            {/* Project info */}
            <div style={{padding:isMobile?"8px 12px 12px":"8px 32px 16px",display:"flex",gap:4,flexWrap:"wrap"}}>
              {[["PROJECT:",tiData.project?.name,"project.name"],["CLIENT:",tiData.project?.client,"project.client"],["DESTINATION:",tiData.project?.destination,"project.destination"],["DATE:",tiData.project?.date,"project.date"],["PRODUCER:",tiData.project?.producer,"project.producer"]].map(([lbl,val,key])=>(
                <div key={key} style={{display:"flex",gap:4,alignItems:"baseline",flex:1,minWidth:isMobile?"45%":"auto",marginRight:16}}>
                  <span style={{fontFamily:CS_FONT,fontSize:9,fontWeight:700,letterSpacing:0.5}}>{lbl}</span>
                  <TICell value={val||""} onChange={v=>tiU(key,v)}/>
                </div>
              ))}
            </div>

            {/* ========= ITINERARY TAB ========= */}
            {tiTravelTab==="itinerary"&&(<div style={{padding:isMobile?"0 8px":"0 32px",overflowX:"auto"}}>
              {(tiData.sections||[]).map((sec,si)=>(
                <TITableSection key={sec.id} title={sec.title} subtitle={sec.subtitle} columns={tiColsFor(sec)} rows={sec.data||[]}
                  onUpdate={(ri,key,val)=>tiUpdateRow(si,ri,key,val)} onAddRow={()=>tiAddRow(si)} onDeleteRow={(ri)=>tiDeleteRow(si,ri)}
                  onDelete={()=>tiDeleteSection(si)} onEditTitle={()=>tiEditSectionTitle(si)} onEditSubtitle={()=>tiEditSectionSubtitle(si)}
                  isCustom={sec.type==="custom"} onAddColumn={sec.type==="custom"?()=>tiAddCustomColumn(si):null}
                  onEditColumn={sec.type==="custom"?(ci)=>tiEditCustomColumn(si,ci):null} onDeleteColumn={sec.type==="custom"?(ci)=>tiDeleteCustomColumn(si,ci):null}/>
              ))}
              {(tiData.sections||[]).length===0&&<div style={{fontFamily:CS_FONT,fontSize:10,color:"#ccc",letterSpacing:0.5,padding:"40px 0",textAlign:"center"}}>No sections — click + ADD SECTION below to begin</div>}

              {/* Add section menu */}
              <div style={{position:"relative",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:tiShowAddMenu?"#333":"#f4f4f4",padding:"6px 8px",cursor:"pointer",borderRadius:1,transition:"background .15s"}}
                  onClick={()=>setTiShowAddMenu(!tiShowAddMenu)} onMouseEnter={e=>{if(!tiShowAddMenu)e.currentTarget.style.background="#eee";}} onMouseLeave={e=>{if(!tiShowAddMenu)e.currentTarget.style.background="#f4f4f4";}}>
                  <span style={{fontFamily:CS_FONT,fontSize:9,fontWeight:700,letterSpacing:0.5,color:tiShowAddMenu?"#fff":"#999",textTransform:"uppercase"}}>+ ADD SECTION</span>
                </div>
                {tiShowAddMenu&&(
                  <div style={{background:"#fff",border:"1px solid #ddd",borderTop:"none",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}>
                    {[{type:"flights",label:"Flight Schedule"},{type:"cars",label:"Airport Transfers"},{type:"hotels",label:"Hotel Accommodation"},{type:"custom",label:"Custom Table"}].map(opt=>(
                      <div key={opt.type} onClick={()=>{tiAddSection(opt.type);setTiShowAddMenu(false);}}
                        style={{fontFamily:CS_FONT,fontSize:9,letterSpacing:0.5,padding:"8px 12px",cursor:"pointer",borderBottom:"1px solid #f0f0f0",color:"#666"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f5f5f5"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confidentiality notice */}
              <div style={{marginTop:16,padding:"10px 0",borderTop:"1px solid #eee"}}>
                <div style={{fontFamily:CS_FONT,fontSize:8,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:"#999",marginBottom:4}}>CONFIDENTIALITY NOTICE</div>
                <div onClick={async ()=>{const val=await showPrompt("Edit notice:",tiData.notes);if(val!==null)tiU("notes",val);}}
                  style={{fontFamily:CS_FONT,fontSize:8,letterSpacing:0.5,lineHeight:1.5,color:"#999",cursor:"text"}}>
                  {tiData.notes||"Click to add confidentiality notice"}
                </div>
              </div>
            </div>)}

            {/* ========= ROOMING LIST TAB ========= */}
            {tiTravelTab==="rooming"&&(<div style={{padding:isMobile?"0 8px":"0 32px",overflowX:"auto"}}>
              {/* Room summary badges */}
              {(()=>{
                const types={};const hotels={};
                tiRooming.forEach(r=>{
                  const rt=(r.roomType||"").trim().toLowerCase();if(rt)types[rt]=(types[rt]||0)+1;
                  const h=(r.hotel||"").trim();if(h)hotels[h]=(hotels[h]||0)+1;
                });
                const filled=tiRooming.filter(r=>r.passportName).length;
                return(
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                    <div style={{fontFamily:CS_FONT,fontSize:8,fontWeight:700,letterSpacing:0.5,background:"#000",color:"#fff",padding:"3px 10px",borderRadius:2}}>{filled} GUESTS</div>
                    {Object.entries(types).map(([type,count])=>(
                      <div key={type} style={{fontFamily:CS_FONT,fontSize:8,fontWeight:700,letterSpacing:0.5,background:"#f4f4f4",color:"#666",padding:"3px 10px",borderRadius:2,textTransform:"uppercase"}}>{count} {type}</div>
                    ))}
                    {Object.entries(hotels).map(([hotel,count])=>(
                      <div key={hotel} style={{fontFamily:CS_FONT,fontSize:8,fontWeight:700,letterSpacing:0.5,background:"#E3F2FD",color:"#1565C0",padding:"3px 10px",borderRadius:2}}>{hotel}: {count}</div>
                    ))}
                  </div>
                );
              })()}

              {/* Rooming table header */}
              <div style={{display:"flex",background:"#000",padding:"4px 8px"}}>
                <div style={{width:18}}/>
                <div style={{width:14}}/>
                <div style={{width:22,fontFamily:CS_FONT,fontSize:7,fontWeight:700,letterSpacing:0.5,color:"#fff",padding:"4px 2px"}}>#</div>
                {TI_ROOMING_COLS.map(col=>(
                  <div key={col.key} style={{flex:col.flex,fontFamily:CS_FONT,fontSize:7,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:"#fff",padding:"4px 4px"}}>{col.label}</div>
                ))}
              </div>

              {/* Rooming rows */}
              {tiRooming.map((rm,ri)=>{
                const isDropHere=tiDropRmAt===ri&&tiDragRm.current!==null&&tiDragRm.current!==ri;
                return(
                  <div key={rm.id}
                    onDragOver={e=>{e.preventDefault();setTiDropRmAt(ri);}}
                    onDrop={()=>{
                      const from=tiDragRm.current;
                      if(from===null||from===ri){tiDragRm.current=null;setTiDropRmAt(null);return;}
                      tiReorderRooming(from,ri);
                      tiDragRm.current=null;setTiDropRmAt(null);
                    }}
                    onDragLeave={()=>setTiDropRmAt(null)}
                    style={{display:"flex",borderBottom:isDropHere?"2px solid #FFD54F":"1px solid #f0f0f0",alignItems:"stretch",minHeight:26}}>
                    <div style={{width:18,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span onClick={()=>tiDeleteRoomingRow(rm.id)} style={{cursor:"pointer",fontSize:10,color:"#ddd"}}
                        onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="#ddd"}>×</span>
                    </div>
                    <div draggable onDragStart={()=>{tiDragRm.current=ri;}} onDragEnd={()=>{tiDragRm.current=null;setTiDropRmAt(null);}}
                      style={{width:14,display:"flex",alignItems:"center",justifyContent:"center",cursor:"grab"}}>
                      <span style={{fontFamily:CS_FONT,fontSize:8,color:"#ccc"}}>≡</span>
                    </div>
                    <div style={{width:22,fontFamily:CS_FONT,fontSize:8,fontWeight:700,color:"#ccc",display:"flex",alignItems:"center",padding:"0 2px"}}>{ri+1}</div>
                    {TI_ROOMING_COLS.map(col=>(
                      <div key={col.key} style={{flex:col.flex}}>
                        <input value={rm[col.key]||""} onChange={e=>tiUpdateRooming(rm.id,col.key,e.target.value)}
                          placeholder={col.key==="passportName"?"Full passport name":col.key==="hotel"?"Hotel name":col.key==="roomType"?"Single / Double / Twin":col.key==="sharingWith"?"Roommate name":col.key==="checkIn"?"DD/MM":col.key==="checkOut"?"DD/MM":col.key==="confirmNo"?"Conf. number":"Requests..."}
                          style={{fontFamily:CS_FONT,fontSize:9,letterSpacing:0.5,border:"none",outline:"none",padding:"4px 4px",width:"100%",boxSizing:"border-box",
                            background:rm[col.key]?"transparent":"#FFFDE7",color:rm[col.key]?"#1a1a1a":"#999"}}/>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Add guest row */}
              <div style={{marginTop:4,marginBottom:16}}>
                <div onClick={tiAddRoomingRow} style={{display:"flex",alignItems:"center",background:"#f4f4f4",padding:"6px 8px",cursor:"pointer",borderRadius:1}}
                  onMouseEnter={e=>e.currentTarget.style.background="#eee"} onMouseLeave={e=>e.currentTarget.style.background="#f4f4f4"}>
                  <span style={{fontFamily:CS_FONT,fontSize:9,fontWeight:700,letterSpacing:0.5,color:"#999",textTransform:"uppercase"}}>+ ADD GUEST</span>
                </div>
              </div>

              <div style={{fontFamily:CS_FONT,fontSize:8,color:"#999",letterSpacing:0.5,padding:"8px 0",borderTop:"1px solid #eee"}}>
                Click SYNC TO HOTELS in the tab bar to push this rooming list into the Hotel Accommodation section on the Itinerary tab.
              </div>
            </div>)}

            {/* ========= MOVEMENT ORDER TAB ========= */}
            {tiTravelTab==="movement"&&(<div style={{padding:isMobile?"0 8px":"0 32px",overflowX:"auto"}}>
              {tiMoveDays.map((day,di)=>(
                <div key={day.id} style={{marginBottom:14}}>
                  {/* Day header */}
                  <div style={{display:"flex",alignItems:"center",background:"#000",padding:"4px 8px",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontFamily:CS_FONT,fontSize:9,fontWeight:700,letterSpacing:0.5,color:"#fff"}}>DAY {di+1}</span>
                      <input value={day.date} onChange={e=>tiUpdateDay(day.id,"date",e.target.value)} placeholder="DD/MM/YYYY"
                        style={{fontFamily:CS_FONT,fontSize:9,fontWeight:700,letterSpacing:0.5,color:"#fff",background:"transparent",border:"none",outline:"none",width:80,padding:"2px 4px"}}/>
                      <input value={day.title} onChange={e=>tiUpdateDay(day.id,"title",e.target.value)} placeholder="e.g. Travel Day / Shoot Day 1 / Recce"
                        style={{fontFamily:CS_FONT,fontSize:9,letterSpacing:0.5,color:"rgba(255,255,255,0.6)",background:"transparent",border:"none",outline:"none",width:250,padding:"2px 4px"}}/>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span onClick={()=>tiAddMove(day.id)} style={{fontFamily:CS_FONT,fontSize:8,color:"rgba(255,255,255,0.5)",cursor:"pointer",letterSpacing:0.5}}>+ ADD</span>
                      <span onClick={()=>tiDeleteDay(day.id)} style={{fontSize:12,color:"rgba(255,255,255,0.3)",cursor:"pointer"}}
                        onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.3)"}>×</span>
                    </div>
                  </div>
                  {/* Column header */}
                  <div style={{display:"flex",background:"#f4f4f4",padding:"3px 8px",gap:4}}>
                    <div style={{width:14}}/>
                    {TI_MOVEMENT_COLS.map(col=>(
                      <div key={col.key} style={{...(col.width?{width:col.width}:{flex:col.flex}),fontFamily:CS_FONT,fontSize:7,fontWeight:700,letterSpacing:0.5,color:"#999"}}>{col.label}</div>
                    ))}
                  </div>
                  {/* Move rows */}
                  {day.moves.map(mv=>(
                    <div key={mv.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderBottom:"1px solid #f0f0f0"}}>
                      <div style={{width:14}}>
                        <span onClick={()=>tiDeleteMove(day.id,mv.id)} style={{cursor:"pointer",fontSize:10,color:"#ddd"}}
                          onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="#ddd"}>×</span>
                      </div>
                      {TI_MOVEMENT_COLS.map(col=>(
                        <div key={col.key} style={{...(col.width?{width:col.width}:{flex:col.flex})}}>
                          <input value={mv[col.key]||""} onChange={e=>tiUpdateMove(day.id,mv.id,col.key,e.target.value)}
                            placeholder={col.key==="time"?"00:00":col.key==="activity"?"Activity / movement":col.key==="location"?"Location / address":col.key==="transport"?"Van / Car / Walk":col.key==="who"?"All / Crew / Talent":"Notes"}
                            style={{fontFamily:CS_FONT,fontSize:9,letterSpacing:0.5,border:"none",outline:"none",width:"100%",boxSizing:"border-box",padding:"3px 4px",
                              background:mv[col.key]?"transparent":"#FFFDE7",color:mv[col.key]?"#1a1a1a":"#999",
                              ...(col.key==="time"?{fontWeight:700}:{})}}/>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}

              <div style={{marginBottom:16}}>
                <div onClick={tiAddDay} style={{display:"flex",alignItems:"center",background:"#f4f4f4",padding:"6px 8px",cursor:"pointer",borderRadius:1}}
                  onMouseEnter={e=>e.currentTarget.style.background="#eee"} onMouseLeave={e=>e.currentTarget.style.background="#f4f4f4"}>
                  <span style={{fontFamily:CS_FONT,fontSize:9,fontWeight:700,letterSpacing:0.5,color:"#999",textTransform:"uppercase"}}>+ ADD DAY</span>
                </div>
              </div>
            </div>)}

            {/* Footer */}
            <div style={{padding:"0 32px 32px"}}>
              <div style={{marginTop:32,display:"flex",justifyContent:"space-between",fontFamily:CS_FONT,fontSize:9,letterSpacing:0.5,color:"#000",borderTop:"2px solid #000",paddingTop:12}}>
                <div><div style={{fontWeight:700}}>@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div>
                <div style={{textAlign:"right"}}><div style={{fontWeight:700}}>WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Other travel sub-sections: keep UploadZone ──
  return (
    <div>
      {travelBack}
      <div style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:14}}>{tc?.emoji} {tc?.label}</div>
      <UploadZone label={`Upload ${tc?.label.toLowerCase()} documents (PDF, images)`} files={getProjectFiles(p.id,"travel_"+travelSubSection)} onAdd={f=>addProjectFiles(p.id,"travel_"+travelSubSection,f)}/>
    </div>
  );
}
