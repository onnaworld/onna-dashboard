import { useState, useMemo, useEffect, useRef, useCallback, Fragment } from "react";
import { createPortal } from "react-dom";

// ─── INDEXEDDB FILE STORAGE ──────────────────────────────────────────────────
const IDB_NAME="onna_files"; const IDB_STORE="files"; const IDB_VER=1;
const idbOpen=()=>new Promise((res,rej)=>{const r=indexedDB.open(IDB_NAME,IDB_VER);r.onupgradeneeded=e=>{e.target.result.createObjectStore(IDB_STORE)};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const idbGet=async(key)=>{const db=await idbOpen();return new Promise((res,rej)=>{const t=db.transaction(IDB_STORE,"readonly").objectStore(IDB_STORE).get(key);t.onsuccess=()=>res(t.result);t.onerror=()=>rej(t.error)})};
const idbSet=async(key,val)=>{const db=await idbOpen();return new Promise((res,rej)=>{const t=db.transaction(IDB_STORE,"readwrite").objectStore(IDB_STORE).put(val,key);t.onsuccess=()=>res();t.onerror=()=>rej(t.error)})};

// ─── CALL SHEET TEMPLATE ─────────────────────────────────────────────────────
const CS_FONT = "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
const CS_LS = 1.5;
const CS_YELLOW = "#FFF9C4";

const CSEditField = ({ value, onChange, style = {}, placeholder = "", bold = false, isPlaceholder = false }) => {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);
  const commit = () => { setEditing(false); onChange(temp); };
  const showYellow = isPlaceholder && !value;
  if (editing) return <input autoFocus value={temp} onChange={e=>setTemp(e.target.value)} onBlur={commit} onKeyDown={e=>e.key==="Enter"&&commit()} style={{...style,fontFamily:CS_FONT,fontSize:style.fontSize||11,fontWeight:bold?700:style.fontWeight||400,background:"#FFFDE7",border:"1px solid #E0D9A8",borderRadius:2,outline:"none",padding:"2px 5px",width:"100%",boxSizing:"border-box",color:style.color||"#1a1a1a"}} placeholder={placeholder}/>;
  return <span onClick={()=>{setTemp(value);setEditing(true);}} style={{...style,fontFamily:CS_FONT,fontWeight:bold?700:style.fontWeight||400,cursor:"text",display:"inline-block",minWidth:16,minHeight:14,background:showYellow?CS_YELLOW:"transparent",borderRadius:showYellow?2:0,padding:showYellow?"0 4px":0,borderBottom:"1px dashed transparent",transition:"all 0.15s"}} onMouseEnter={e=>(e.target.style.borderBottom="1px dashed #ccc")} onMouseLeave={e=>(e.target.style.borderBottom="1px dashed transparent")}>{value||<span style={{color:"#999",fontSize:style.fontSize||10}}>{placeholder}</span>}</span>;
};

const CSEditTextarea = ({ value, onChange, style = {} }) => {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);
  const commit = () => { setEditing(false); onChange(temp); };
  if (editing) return <textarea autoFocus value={temp} onChange={e=>setTemp(e.target.value)} onBlur={commit} rows={4} style={{...style,fontFamily:CS_FONT,fontSize:11,background:"#FFFDE7",border:"1px solid #E0D9A8",borderRadius:2,outline:"none",padding:"4px 6px",width:"100%",boxSizing:"border-box",resize:"vertical"}}/>;
  return <div onClick={()=>{setTemp(value);setEditing(true);}} style={{...style,cursor:"text",whiteSpace:"pre-wrap",fontFamily:CS_FONT,borderBottom:"1px dashed transparent",transition:"all 0.15s"}} onMouseEnter={e=>(e.target.style.borderBottom="1px dashed #ccc")} onMouseLeave={e=>(e.target.style.borderBottom="1px dashed transparent")}>{value||<span style={{color:"#999",fontSize:10}}>Click to edit</span>}</div>;
};

const CSLogoSlot = ({ label, image, onUpload, onRemove }) => {
  const ref = useRef();
  const handleFile = e => { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>onUpload(ev.target.result); r.readAsDataURL(f); };
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",minWidth:90}}>{image?<div style={{position:"relative"}}><img src={image} alt={label} style={{maxHeight:38,maxWidth:120,objectFit:"contain"}}/><button onClick={onRemove} style={{position:"absolute",top:-6,right:-6,background:"#eee",border:"none",borderRadius:"50%",width:16,height:16,fontSize:10,cursor:"pointer",lineHeight:"14px",color:"#666"}}>×</button></div>:<div onClick={()=>ref.current.click()} style={{width:100,height:36,border:"1.5px dashed #ccc",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:9,color:"#aaa",letterSpacing:0.5,fontFamily:CS_FONT}} onMouseEnter={e=>(e.currentTarget.style.borderColor="#999")} onMouseLeave={e=>(e.currentTarget.style.borderColor="#ccc")}>+ {label}</div>}<input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/></div>;
};

const CSResizableImage = ({ label, image, onUpload, onRemove, defaultHeight = 180 }) => {
  const ref = useRef();
  const [height, setHeight] = useState(defaultHeight);
  const dragRef = useRef({ dragging: false, startY: 0, startH: 0 });
  const handleFile = e => { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>onUpload(ev.target.result); r.readAsDataURL(f); };
  const onMouseDown = useCallback(e => {
    e.preventDefault(); dragRef.current = { dragging:true, startY:e.clientY, startH:height };
    const onMove = ev => { if(!dragRef.current.dragging)return; setHeight(Math.max(80,dragRef.current.startH+(ev.clientY-dragRef.current.startY))); };
    const onUp = () => { dragRef.current.dragging=false; window.removeEventListener("mousemove",onMove); window.removeEventListener("mouseup",onUp); };
    window.addEventListener("mousemove",onMove); window.addEventListener("mouseup",onUp);
  }, [height]);
  return <div>{image?<div style={{position:"relative"}}><img src={image} alt={label} style={{width:"100%",height,objectFit:"cover",borderRadius:4,display:"block"}}/><button onClick={onRemove} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.55)",color:"#fff",border:"none",borderRadius:"50%",width:24,height:24,fontSize:14,cursor:"pointer",lineHeight:"22px",textAlign:"center"}}>×</button><div onMouseDown={onMouseDown} style={{position:"absolute",bottom:0,left:0,right:0,height:14,cursor:"ns-resize",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(transparent, rgba(0,0,0,0.15))",borderRadius:"0 0 4px 4px"}}><div style={{width:40,height:3,background:"rgba(255,255,255,0.7)",borderRadius:2}}/></div></div>:<div onClick={()=>ref.current.click()} style={{width:"100%",height,border:"2px dashed #ddd",borderRadius:6,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#FAFAFA"}} onMouseEnter={e=>(e.currentTarget.style.borderColor="#999")} onMouseLeave={e=>(e.currentTarget.style.borderColor="#ddd")}><div style={{fontSize:28,color:"#ccc",marginBottom:4,lineHeight:1}}>+</div><div style={{fontSize:10,color:"#aaa",letterSpacing:0.5,fontFamily:CS_FONT}}>Upload {label}</div></div>}<input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/></div>;
};

const CSXbtn = ({ onClick, size = 16 }) => <button onClick={onClick} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:size,padding:"0 3px",lineHeight:1,transition:"color 0.15s"}} onMouseEnter={e=>(e.target.style.color="#d32f2f")} onMouseLeave={e=>(e.target.style.color="#ccc")}>×</button>;
const CSAddBtn = ({ onClick, label }) => <button onClick={onClick} style={{background:"none",border:"1px dashed #ddd",borderRadius:3,padding:"3px 12px",fontSize:9,color:"#aaa",cursor:"pointer",fontFamily:CS_FONT,letterSpacing:0.5,marginTop:4}} onMouseEnter={e=>{e.target.style.borderColor="#999";e.target.style.color="#666";}} onMouseLeave={e=>{e.target.style.borderColor="#ddd";e.target.style.color="#aaa";}}>+ {label}</button>;

const CALLSHEET_INIT = {
  shootName:"",date:"",dayNumber:"",productionContacts:"",passportNote:"",
  agencyLogo:null,clientLogo:null,mapImage:null,weatherImage:null,
  venueRows:[{label:"BASE CAMP",value:""},{label:"LOCATIONS",value:""},{label:"PARKING",value:""},{label:"ACCESS",value:""}],
  schedule:[{time:"",activity:"",notes:""},{time:"",activity:"",notes:""},{time:"",activity:"",notes:""},{time:"",activity:"",notes:""},{time:"",activity:"",notes:""}],
  departments:[
    {name:"CLIENT",crew:[{role:"MARKETING MANAGER",name:"",mobile:"",email:"",callTime:""}]},
    {name:"BRAND",crew:[{role:"BRAND DIRECTOR",name:"",mobile:"",email:"",callTime:""},{role:"MARKETING DIRECTOR",name:"",mobile:"",email:"",callTime:""},{role:"MARKETING EXECUTIVE",name:"",mobile:"",email:"",callTime:""},{role:"SNR. PRODUCER",name:"",mobile:"",email:"",callTime:""}]},
    {name:"CREATIVE",crew:[{role:"ART DIRECTOR / DIRECTOR",name:"",mobile:"",email:"",callTime:""}]},
    {name:"MOTION",crew:[{role:"DIRECTOR OF PHOTOGRAPHY",name:"",mobile:"",email:"",callTime:""},{role:"1ST ASSISTANT CAMERA",name:"",mobile:"",email:"",callTime:""},{role:"2ND ASSISTANT CAMERA",name:"",mobile:"",email:"",callTime:""},{role:"KEY GRIP",name:"",mobile:"",email:"",callTime:""},{role:"BEST BOY GRIP",name:"",mobile:"",email:"",callTime:""},{role:"GAFFER",name:"",mobile:"",email:"",callTime:""},{role:"SPARK/DRIVER",name:"",mobile:"",email:"",callTime:""},{role:"SPARK",name:"",mobile:"",email:"",callTime:""},{role:"SPARK",name:"",mobile:"",email:"",callTime:""},{role:"VTO",name:"",mobile:"",email:"",callTime:""},{role:"DIT",name:"",mobile:"",email:"",callTime:""}]},
    {name:"PHOTOGRAPHY",crew:[{role:"PHOTOGRAPHER",name:"",mobile:"",email:"",callTime:""},{role:"LIGHTING ASSISTANT",name:"",mobile:"",email:"",callTime:""},{role:"DIGI TECH",name:"",mobile:"",email:"",callTime:""}]},
    {name:"STYLING",crew:[{role:"STYLIST",name:"",mobile:"",email:"",callTime:""},{role:"STYLIST ASSISTANT",name:"",mobile:"",email:"",callTime:""}]},
    {name:"PROPS",crew:[{role:"PROP STYLIST",name:"",mobile:"",email:"",callTime:""}]},
    {name:"BEAUTY TEAM",crew:[{role:"HAIR STYLIST",name:"",mobile:"",email:"",callTime:""},{role:"HAIR ASSISTANT",name:"",mobile:"",email:"",callTime:""},{role:"MAKEUP ARTIST",name:"",mobile:"",email:"",callTime:""},{role:"MAKEUP ASSISTANT",name:"",mobile:"",email:"",callTime:""}]},
    {name:"MODEL",crew:[{role:"FEMALE MODEL",name:"",mobile:"",email:"",callTime:""},{role:"FEMALE MODEL",name:"",mobile:"",email:"",callTime:""},{role:"MALE MODEL",name:"",mobile:"",email:"",callTime:""},{role:"MALE MODEL",name:"",mobile:"",email:"",callTime:""},{role:"WAITER",name:"",mobile:"",email:"",callTime:""}]},
    {name:"PRODUCTION & LOCATION",crew:[{role:"LOCAL PRODUCER",name:"",mobile:"",email:"",callTime:""},{role:"ASSISTANT DIRECTOR",name:"",mobile:"",email:"",callTime:""},{role:"LOCATION MANAGER",name:"",mobile:"",email:"",callTime:""},{role:"LOCATION ASSISTANT",name:"",mobile:"",email:"",callTime:""},{role:"UNIT",name:"",mobile:"",email:"",callTime:""},{role:"UNIT",name:"",mobile:"",email:"",callTime:""},{role:"UNIT",name:"",mobile:"",email:"",callTime:""}]},
  ],
  emergencyNumbers:[{label:"POLICE",number:"999"},{label:"AMBULANCE",number:"998"},{label:"FIRE DEPARTMENT (CIVIL DEFENCE)",number:"997"}],
  emergencyDialPrefix:"UAE DIAL:",
  emergency:{hospital:"American Hospital Nad Al Sheba Clinic, Avenue Mall - Nad Al Sheba - Nadd Al Shiba Second - Dubai, +971 800 24392",police:"Nad Al Sheba Police Administration Office, Road - Nad Al Sheba - Nad Al Sheba 1 - Dubai, +971 4 336 3535"},
  invoicing:{terms:"NET 30 days",email:"accounts@onnaproduction.com",address:"ONNA FILM, TV & RADIO PRODUCTION SERVICES LLC.\nOFFICE NO. F1-022,\nPROPERTY INVESTMENT OFFICE 4-F1\nDUBAI, UNITED ARAB EMIRATES",trn:"105161036600003"},
  protocol:"WE KINDLY ASK ALL CAST AND CREW TO BE SENSITIVE TO THE BRANDS, LOGOS, PEOPLE AND PRODUCTS BEING CAPTURED ON THIS SHOOT AND REMIND YOU THAT IN WORKING ON THIS PRODUCTION YOU AGREE TO TREAT ALL CLIENT INFORMATION, PHOTOGRAPHY AND FILMING AS CONFIDENTIAL. YOU AGREE NOT TO COMMUNICATE ANY COMMENTS OR IMAGERY OF THE SHOOT AT ANY TIME BY ANY MEANS, INCLUDING VIA SOCIAL MEDIA WITHOUT EXPRESS PERMISSION FROM PRODUCTION.",
};

// ─── API ──────────────────────────────────────────────────────────────────────
const API = "https://onna-backend-v2.vercel.app";
const API_SECRET = import.meta.env.VITE_API_SECRET || "";
const GCAL_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const getToken = () => localStorage.getItem("onna_token") || "";
const _h = (extra={}) => ({"X-API-Secret":API_SECRET,"Authorization":`Bearer ${getToken()}`,...extra});
const _guard = r => { if(r.status===401){localStorage.removeItem("onna_token");window.location.reload();} return r.json(); };
const api = {
  get:    (path)       => fetch(`${API}${path}`,{headers:_h()}).then(_guard),
  post:   (path, body) => fetch(`${API}${path}`,{method:"POST",  headers:_h({"Content-Type":"application/json"}),body:JSON.stringify(body)}).then(_guard),
  put:    (path, body) => fetch(`${API}${path}`,{method:"PUT",   headers:_h({"Content-Type":"application/json"}),body:JSON.stringify(body)}).then(_guard),
  delete: (path)       => fetch(`${API}${path}`,{method:"DELETE",headers:_h()}).then(_guard),
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const LEAD_CATEGORIES = ["All","Production Companies","Creative Agencies","Beauty & Fragrance","Jewellery & Watches","Fashion","Editorial","Sports","Hospitality","Market Research","Commercial"];
const VENDORS_CATEGORIES = ["Locations","Hair and Makeup","Stylists","Casting","Catering","Set Design","Equipment","Crew","Production"];
const BB_LOCATIONS = ["All","Dubai, UAE","London, UK","New York, US","Los Angeles, US"];
const OUTREACH_STATUSES = ["not_contacted","cold","warm","open","client"];
const OUTREACH_STATUS_LABELS = {not_contacted:"Not Contacted",cold:"Cold",warm:"Warm",open:"Open",client:"Client"};
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
// Google Calendar event colorId → hex (from Google Calendar API /colors)
const GCAL_COLORS = {"1":"#d50000","2":"#e67c73","3":"#f4511e","4":"#f6bf26","5":"#33b679","6":"#0b8043","7":"#039be5","8":"#3f51b5","9":"#7986cb","10":"#8e24aa","11":"#616161"};
// Outlook / Office 365 ICS feed (public shared calendar)
const OUTLOOK_CAL_ICS = "https://outlook.office365.com/owa/calendar/2b3ad2259c4b4aaeb9ef497749cda730@onnaproduction.com/03e7e6c4750845fcb9ec9bb1040863bb2959111588689312764/calendar.ics";
const parseICS = (text) => {
  const now = new Date();
  const winStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const winEnd   = new Date(now.getFullYear(), now.getMonth() + 13, 0);
  const unfolded = text.replace(/\r\n[ \t]/g,"").replace(/\r\n/g,"\n").replace(/\r/g,"\n");
  const rawBlocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)||[];
  const getF = (block,key) => { const m=block.match(new RegExp(`^${key}(?:;[^:]*)?:(.+)$`,"m")); return m?m[1].trim():""; };
  const isZ = s => (s||"").endsWith("Z");
  const pad = n => String(n).padStart(2,"0");
  const parseDT = s => {
    if (!s) return null;
    const p = s.replace(/[^0-9T]/g,"");
    if (p.length===8) return new Date(+p.slice(0,4),+p.slice(4,6)-1,+p.slice(6,8));
    if (p.length>=15) { const [y,mo,d,h,mi,sc]=[p.slice(0,4),p.slice(4,6),p.slice(6,8),p.slice(9,11),p.slice(11,13),p.slice(13,15)].map(Number); return isZ(s)?new Date(Date.UTC(y,mo-1,d,h,mi,sc)):new Date(y,mo-1,d,h,mi,sc); }
    return null;
  };
  // Always store local date so grid key matching works regardless of timezone
  const dtToField = (dt,allDay,utc) => {
    if (!dt) return {};
    if (allDay) return {date:`${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`};
    if (utc) return {dateTime:dt.toISOString()};
    return {dateTime:`${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`};
  };
  const DAY_JS = {SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6};
  const mondayOf = d => { const r=new Date(d); r.setHours(0,0,0,0); r.setDate(r.getDate()-((r.getDay()+6)%7)); return r; };
  const expandRRule = (rrStr,rawS,rawE,exdates) => {
    const parts={}; rrStr.split(";").forEach(p=>{const [k,v]=p.split("=");if(k&&v)parts[k]=v;});
    const freq=parts.FREQ; if(!freq) return [];
    const intv=Math.max(1,parseInt(parts.INTERVAL||"1",10));
    const until=parts.UNTIL?parseDT(parts.UNTIL):winEnd;
    const maxN=parts.COUNT?parseInt(parts.COUNT,10):2000;
    const bds=parts.BYDAY?parts.BYDAY.split(",").map(s=>DAY_JS[s.replace(/[^A-Z]/g,"")]).filter(n=>n!=null):null;
    const allDay=rawS.replace(/[^0-9T]/g,"").length===8, utc=isZ(rawS);
    const dtS=parseDT(rawS),dtE=parseDT(rawE||rawS); if(!dtS) return [];
    const durMs=Math.max(0,(dtE||dtS)-dtS);
    const exSet=new Set(exdates.flatMap(l=>l.split(",")).map(s=>{const d=parseDT(s.trim());return d?`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`:null;}).filter(Boolean));
    const results=[]; let nTotal=0;
    const addOcc=occ=>{
      if(nTotal>=maxN||occ<dtS||occ<winStart||occ>winEnd||occ>until) return;
      const endO=new Date(occ.getTime()+durMs);
      const occKey=`${occ.getFullYear()}-${pad(occ.getMonth()+1)}-${pad(occ.getDate())}`;
      if(exSet.has(occKey)) return;
      results.push({start:dtToField(occ,allDay,utc),end:dtToField(endO,allDay,utc),occKey}); nTotal++;
    };
    if(freq==="DAILY"){
      let c=new Date(dtS); while(c<=winEnd&&c<=until&&nTotal<maxN){addOcc(c);c=new Date(c);c.setDate(c.getDate()+intv);}
    } else if(freq==="WEEKLY"){
      const days=bds||[dtS.getDay()]; let wk=mondayOf(dtS),wkN=0;
      while(wk<=winEnd&&wk<=until&&nTotal<maxN&&wkN<2000){
        for(const dn of days){const dm=(dn+6)%7;const occ=new Date(wk);occ.setDate(wk.getDate()+dm);if(!allDay)occ.setHours(dtS.getHours(),dtS.getMinutes(),dtS.getSeconds(),0);addOcc(occ);}
        wk.setDate(wk.getDate()+7*intv); wkN++;
      }
    } else if(freq==="MONTHLY"){
      let c=new Date(dtS); while(c<=winEnd&&c<=until&&nTotal<maxN){addOcc(c);c=new Date(c);c.setMonth(c.getMonth()+intv);}
    } else if(freq==="YEARLY"){
      let c=new Date(dtS); while(c<=winEnd&&c<=until&&nTotal<maxN){addOcc(c);c=new Date(c);c.setFullYear(c.getFullYear()+intv);}
    }
    return results;
  };
  const baseEvs=[]; const excMap={};
  for(const ve of rawBlocks){
    const g=k=>getF(ve,k);
    const uid=g("UID")||String(Math.random()); const recId=g("RECURRENCE-ID"),rrule=g("RRULE");
    const rawStart=g("DTSTART"),rawEnd=g("DTEND"); const summary=g("SUMMARY")||"(No title)";
    const exdates=[...ve.matchAll(/^EXDATE(?:;[^:]*)?:(.+)$/gm)].map(m=>m[1].trim());
    if(recId){ const rd=parseDT(recId); if(!rd) continue; const key=`${uid}_${rd.getFullYear()}-${pad(rd.getMonth()+1)}-${pad(rd.getDate())}`;
      const allDay=rawStart.replace(/[^0-9T]/g,"").length===8,utc=isZ(rawStart); const s=parseDT(rawStart),e=parseDT(rawEnd||rawStart);
      if(s) excMap[key]={id:key,summary,start:dtToField(s,allDay,utc),end:dtToField(e||s,allDay,utc),calendarColor:"#0078d4",_outlook:true};
    } else { baseEvs.push({uid,rrule,rawStart,rawEnd:rawEnd||rawStart,summary,exdates}); }
  }
  const events=[];
  for(const ev of baseEvs){
    if(!ev.rawStart) continue;
    const allDay=ev.rawStart.replace(/[^0-9T]/g,"").length===8,utc=isZ(ev.rawStart);
    const dtS=parseDT(ev.rawStart); if(!dtS) continue;
    if(ev.rrule){
      const occs=expandRRule(ev.rrule,ev.rawStart,ev.rawEnd,ev.exdates);
      for(const occ of occs){const key=`${ev.uid}_${occ.occKey}`;if(excMap[key]){events.push(excMap[key]);delete excMap[key];}else events.push({id:key,summary:ev.summary,start:occ.start,end:occ.end,calendarColor:"#0078d4",_outlook:true});}
    } else if(dtS>=winStart&&dtS<=winEnd){
      const dtE=parseDT(ev.rawEnd); events.push({id:ev.uid,summary:ev.summary,start:dtToField(dtS,allDay,utc),end:dtToField(dtE||dtS,allDay,utc),calendarColor:"#0078d4",_outlook:true});
    }
  }
  Object.values(excMap).forEach(ex=>{const ds=ex.start?.date||ex.start?.dateTime?.slice(0,10);if(ds){const d=new Date(ds+"T00:00:00");if(d>=winStart&&d<=winEnd)events.push(ex);}});
  return events;
};
const PROJECT_SECTIONS = ["Home","Creative","Budget","Documents","Travel","Locations","Casting","Styling","Schedule"];
const CONTRACT_TYPES = ["Commissioning Agreement – Self Employed","Commissioning Agreement – Via PSC","Talent Agreement","Talent Agreement – Via PSC"];

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:       "#f5f5f7",
  surface:  "#ffffff",
  border:   "#d2d2d7",
  borderSub:"#e8e8ed",
  text:     "#1d1d1f",
  sub:      "#6e6e73",
  muted:    "#aeaeb2",
  accent:   "#1d1d1f",
  link:     "#0066cc",
  inBg:     "#f0faf4", inColor:"#1a7f37",
  outBg:    "#fff3f0", outColor:"#c0392b",
};

// ─── STATIC SEED DATA (used as fallback until API loads) ─────────────────────
const SEED_LEADS = []; // populated from DB on load
const SEED_CLIENTS = [
];
const SEED_PROJECTS = [
  {id:1, client:"Columbia / IMA", name:"Ramadan Activation 2026", revenue:196507, cost:160000, status:"Active",    year:2026},
  {id:2, client:"Pulse Fitness",  name:"Social Media Campaign",   revenue:9400,   cost:4100,   status:"Active",    year:2026},
  {id:3, client:"Meridian Group", name:"Website Redesign",        revenue:31000,  cost:17500,  status:"Completed", year:2025},
  {id:4, client:"Apex Media",     name:"SEO Strategy",            revenue:8500,   cost:3200,   status:"Active",    year:2026},
  {id:5, client:"Ironclad Legal", name:"Content Suite",           revenue:18500,  cost:7400,   status:"In Review", year:2025},
  {id:6, client:"GreenPath",      name:"Launch Campaign",         revenue:3100,   cost:1800,   status:"Active",    year:2025},
  {id:7, client:"Meridian Group", name:"Brand Strategy",          revenue:14000,  cost:6200,   status:"Completed", year:2024},
  {id:8, client:"Nova Tech",      name:"Ad Campaign Q4",          revenue:11000,  cost:4800,   status:"Completed", year:2024},
];
const initVendors = [{"id":1,"name":"Alva East/West/Coachworks","category":"Locations","email":"info@alvastudios.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":2,"name":"Big Sky","category":"Locations","email":"them@bigskylondon.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":3,"name":"Black Island","category":"Locations","email":"info@islandstudios.net","phone":"44 020 8956 5600","website":"islandstudios.net/black-island","location":"London, UK","notes":"","rateCard":""},{"id":4,"name":"Malcolm Ryan","category":"Locations","email":"info@mrstudios.co.uk","phone":"44 020 8947 4766","website":"mrstudios.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":5,"name":"Park Royal","category":"Locations","email":"info@parkroyalstudios.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":6,"name":"Lock Studios","category":"Locations","email":"","phone":"","website":"www.lockstudios.co.uk/studios","location":"London, UK","notes":"","rateCard":""},{"id":7,"name":"Gas Works Studio","category":"Locations","email":"studio@gasph.com","phone":"","website":"gasph.com/studio_1","location":"London, UK","notes":"","rateCard":""},{"id":8,"name":"Jet Studios","category":"Locations","email":"zoe@jetstudios.co.uk","phone":"44 020 7731 1111","website":"www.jetstudios.co.uk/studio-1","location":"London, UK","notes":"","rateCard":""},{"id":9,"name":"The Yards Studio","category":"Locations","email":"BOOKINGS@THEYARDS.STUDIO","phone":"","website":"www.theyards.studio","location":"London, UK","notes":"","rateCard":""},{"id":10,"name":"Park Village","category":"Locations","email":"hello@parkvillage.co.uk","phone":"44 (0) 207 387 8077","website":"parkvillage.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":11,"name":"The Vale Studios","category":"Locations","email":"info@thevalestudios.com","phone":"","website":"thevalestudios.com","location":"London, UK","notes":"","rateCard":""},{"id":12,"name":"Spring Studios","category":"Locations","email":"londonstudios@springstudios.com","phone":"","website":"","location":"London, UK","notes":"EQ Prolighting / Catering Noco","rateCard":""},{"id":13,"name":"3 Mills","category":"Locations","email":"bookings@3mills.com","phone":"","website":"3mills.com","location":"London, UK","notes":"","rateCard":""},{"id":14,"name":"London Film Studios","category":"Locations","email":"bookings@londonfilmstudios.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":15,"name":"MR Studios","category":"Locations","email":"info@mrstudios.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":16,"name":"Shannon Studios","category":"Locations","email":"raph@shannonstudios.co.uk","phone":"","website":"www.shannonstudios.co.uk","location":"London, UK","notes":"Offers Equipment. Book Online, no insurance or account","rateCard":""},{"id":17,"name":"AW Studios","category":"Locations","email":"info@assistingwork.com","phone":"","website":"assistingwork.com/studio","location":"London, UK","notes":"","rateCard":""},{"id":18,"name":"Studio Monde","category":"Locations","email":"","phone":"44 020 8956 5600","website":"","location":"London, UK","notes":"","rateCard":""},{"id":19,"name":"South56 Studio","category":"Locations","email":"south56studio@gmail.com","phone":"44 020 8947 4766","website":"","location":"London, UK","notes":"300 editorial / 550 commercial - 10hr","rateCard":""},{"id":20,"name":"Silvertown","category":"Locations","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":21,"name":"Mars Volume","category":"Locations","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":22,"name":"Garden Studio","category":"Locations","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":23,"name":"Arii","category":"Locations","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":24,"name":"Pintsized Studios","category":"Locations","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":25,"name":"Dneg","category":"Locations","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":26,"name":"LC Locations","category":"Locations","email":"Hello@LClocations.co.uk","phone":"","website":"www.instagram.com/lclocations_","location":"London, UK","notes":"","rateCard":""},{"id":27,"name":"The Location Guys","category":"Locations","email":"hello@thelocationguys.co.uk","phone":"0207 099 8000","website":"www.thelocationguys.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":28,"name":"Location Partnership","category":"Locations","email":"info@locationpartnership.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":29,"name":"Location Works","category":"Locations","email":"sian@locationworks.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":30,"name":"1st Option","category":"Locations","email":"naomi@1st-option.com","phone":"020 7284 2345","website":"www.1st-option.com","location":"London, UK","notes":"","rateCard":""},{"id":31,"name":"JJ Media","category":"Locations","email":"cate@jjmedia.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":32,"name":"Fresh Locations","category":"Locations","email":"vicky@freshlocations.com","phone":"","website":"www.freshlocations.com","location":"London, UK","notes":"","rateCard":""},{"id":33,"name":"Airspace Locations","category":"Locations","email":"Sam Mosedale <sam@airspacelocations.co.uk>","phone":"0207 607 2202","website":"www.airspacelocations.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":34,"name":"Shoot Factory","category":"Locations","email":"info@shootfactory.co.uk","phone":"0207 252 3900","website":"www.shootfactory.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":35,"name":"Amazing Space","category":"Locations","email":"","phone":"020 7251 6661","website":"","location":"London, UK","notes":"","rateCard":""},{"id":36,"name":"Location HQ","category":"Locations","email":"Info <info@locationhq.co.uk>","phone":"","website":"www.locationhq.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":37,"name":"Lavish Locations","category":"Locations","email":"support@lavishlocations.zendesk.com","phone":"03337 007 007","website":"lavishlocations.com","location":"London, UK","notes":"","rateCard":""},{"id":38,"name":"Enso Studios","category":"Locations","email":"bookings@ensostudios.ae","phone":"","website":"www.ensostudios.ae","location":"Dubai, UAE","notes":"Daylight and rig","rateCard":""},{"id":39,"name":"Action Filmz","category":"Locations","email":"hello@actionfilmz.com","phone":"","website":"actionfilmz.com/studio","location":"Dubai, UAE","notes":"","rateCard":""},{"id":40,"name":"Hot Cold Studios","category":"Locations","email":"info@hotcoldstudio.com","phone":"","website":"hotcoldrental.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":41,"name":"ABOC Studios","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":42,"name":"Lighthouse Studios","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":43,"name":"Stellar Studios","category":"Locations","email":"info@thestellarstudios.com","phone":"","website":"thestellarstudios.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":44,"name":"Mulan Studio","category":"Locations","email":"","phone":"","website":"www.instagram.com/mulan.studio","location":"Dubai, UAE","notes":"","rateCard":""},{"id":45,"name":"Bickiboss studios","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":46,"name":"Heenat Salma, Qatar","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":47,"name":"E","category":"Locations","email":"michael@goshaburo.com / hello@goshaburo.com","phone":"","website":"www.instagram.com/skooni_/?hl=en","location":"Dubai, UAE","notes":"","rateCard":""},{"id":48,"name":"Siro Hotel","category":"Locations","email":"ivan.raykov@sirohotels.com / Patricia","phone":"","website":"","location":"Dubai, UAE","notes":"Camilia Ali Mourad Majdoub","rateCard":""},{"id":49,"name":"One & Only Zaabeel","category":"Locations","email":"camilia.majdoub@oneandonlyonezaabeel.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":50,"name":"Leila Heller Art Gallery","category":"Locations","email":"shanti@leilahellergallery.com","phone":"","website":"","location":"Dubai, UAE","notes":"AlSerkal Avenue, Al Quoz Ind Area 1, Dubai - UAE","rateCard":""},{"id":51,"name":"The Third Line","category":"Locations","email":"gabby@thethirdline.com","phone":"","website":"www.thethirdline.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":52,"name":"Custot Gallery Dubai","category":"Locations","email":"rayan@custot.ae","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":53,"name":"Collectional","category":"Locations","email":"Iman.n@thecollectional.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":54,"name":"Volte Art Projects","category":"Locations","email":"ea@volte.art","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":55,"name":"H Residence by Huna","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":56,"name":"Banyan Tree Blue waters","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":57,"name":"House of Wisdom","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":58,"name":"Koa Canvas","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":59,"name":"The Green Planet Dubai","category":"Locations","email":"info@thegreenplanetdubai.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":60,"name":"The Shadow House Abu Dhabi","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":61,"name":"The Farm, Albarari","category":"Locations","email":"events@thefarmdubai.ae","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":62,"name":"Emirates Palace MO, Abu Dhabi","category":"Locations","email":"moauh-reservations@mohg.com / XLi1@mohg.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":63,"name":"Emerald Palace Kempinski, Raffles, Palm Jumeirah, Dubai","category":"Locations","email":"Giuliana.GIARDINA@raffles.com","phone":"","website":"","location":"Dubai, UAE","notes":"GIARDINA Giuliana","rateCard":""},{"id":64,"name":"Burj Al Arab, Dubai","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":65,"name":"Melia Desert Palm, Dubai","category":"Locations","email":"sales.dp@melia.com / rochana.ndlovu@melia.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":66,"name":"Al Faya Lodge by Misk","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":67,"name":"Al Serkal","category":"Locations","email":"gautami@alserkal.online","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":68,"name":"Kite Beach Center UAQ","category":"Locations","email":"hello@kitesurfbeachcenter.ae","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":69,"name":"Bab Al Shams Resort, Dubai","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":70,"name":"Flamingo Beach Resort","category":"Locations","email":"ali@flamingoresortuae.com","phone":"","website":"","location":"Dubai, UAE","notes":"Ali Salamah","rateCard":""},{"id":71,"name":"Nikki Beach","category":"Locations","email":"elmra.gazizova@nikkibeachhotels.com","phone":"971 52 678 7145","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":72,"name":"Aura Sky Pool","category":"Locations","email":"auraevents@auraskypool.com","phone":"971 52 755 4994","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":73,"name":"Filming Locations","category":"Locations","email":"","phone":"971 52 921 2184","website":"filminglocations.io","location":"Dubai, UAE","notes":"","rateCard":""},{"id":74,"name":"Go Studios","category":"Locations","email":"info@go-studios.com","phone":"212 290 1120","website":"gostudios.nyc","location":"London, UK","notes":"New York","rateCard":""},{"id":75,"name":"Quixote","category":"Locations","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":76,"name":"Milk Studios","category":"Locations","email":"","phone":"","website":"","location":"London, UK","notes":"New York / LA","rateCard":""},{"id":77,"name":"Location Department","category":"Locations","email":"John Householder <john@locationdepartment.net>","phone":"212 463 7218","website":"www.locationdepartment.net","location":"London, UK","notes":"New York","rateCard":""},{"id":78,"name":"Natalie Shafii","category":"Hair and Makeup","email":"natalieshafii@gmail.com","phone":"","website":"","location":"London, UK","notes":"Unsigned · Hair","rateCard":""},{"id":79,"name":"Lou Box","category":"Hair and Makeup","email":"lou@loubox.co.uk","phone":"","website":"","location":"London, UK","notes":"MUA","rateCard":""},{"id":80,"name":"Rachel Singer Clark","category":"Hair and Makeup","email":"","phone":"","website":"","location":"London, UK","notes":"The Only Agency · MUA","rateCard":""},{"id":81,"name":"Chad Maxwell","category":"Hair and Makeup","email":"cmaxwellhair@gmail.com","phone":"","website":"","location":"London, UK","notes":"Stella Creative Artists · Hair","rateCard":""},{"id":82,"name":"Jaz Lanyero","category":"Hair and Makeup","email":"abitofjaz@gmail.com","phone":"","website":"","location":"London, UK","notes":"Unsigned · Hair","rateCard":""},{"id":83,"name":"Lydia Ward Smith","category":"Hair and Makeup","email":"info@lydiawardsmith.com","phone":"","website":"","location":"London, UK","notes":"Unsigned · MUA","rateCard":""},{"id":84,"name":"Vic Bond","category":"Hair and Makeup","email":"victoria_bond@live.co.uk","phone":"","website":"","location":"London, UK","notes":"Unsigned · MUA","rateCard":""},{"id":85,"name":"Randolph Gray","category":"Hair and Makeup","email":"Gary Lathrope <gary@garyrepresents.com>","phone":"","website":"","location":"London, UK","notes":"Gary Represents · Hair - Afro","rateCard":""},{"id":86,"name":"Sarah Jo Palmer","category":"Hair and Makeup","email":"lucy@maworldgroup.com","phone":"","website":"","location":"London, UK","notes":"Hair","rateCard":""},{"id":87,"name":"Siddharta Simone","category":"Hair and Makeup","email":"charlotte@streeters.com","phone":"","website":"","location":"London, UK","notes":"MUA","rateCard":""},{"id":88,"name":"A-frame agency","category":"Hair and Makeup","email":"shanti@a-framagency.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":89,"name":"Caren Agency","category":"Hair and Makeup","email":"caren@caren.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":90,"name":"Helena Narra","category":"Hair and Makeup","email":"","phone":"","website":"www.instagram.com/helenanarra","location":"Dubai, UAE","notes":"","rateCard":""},{"id":91,"name":"Kasia Domanska","category":"Hair and Makeup","email":"","phone":"","website":"www.instagram.com/kasia.domanska.makeup","location":"Dubai, UAE","notes":"","rateCard":""},{"id":92,"name":"Ivan Kuz","category":"Hair and Makeup","email":"kyzipe@gmail.com","phone":"971 50 505 1811","website":"www.instagram.com/lvan_kuz","location":"Dubai, UAE","notes":"2k · Hair but does both","rateCard":""},{"id":93,"name":"Mauro D. Hernan repped by MMG","category":"Hair and Makeup","email":"nouna@mmgartists.com","phone":"971 58 954 4698","website":"www.instagram.com/maurodhernanmakeup","location":"Dubai, UAE","notes":"2.5k · Makeup but does both","rateCard":""},{"id":94,"name":"Julia Rada","category":"Hair and Makeup","email":"juliaradaart@gmail.com","phone":"971 58 596 4807","website":"","location":"Dubai, UAE","notes":"3k · Make Up (3k Campaign Only)","rateCard":""},{"id":95,"name":"Sophie Leach","category":"Hair and Makeup","email":"sophie@sophieleach.com","phone":"","website":"www.sophieleach.com","location":"Dubai, UAE","notes":"Make Up or both (BAU / Campaign via Michelle Hay)","rateCard":""},{"id":96,"name":"Kavya Rajpowell","category":"Hair and Makeup","email":"contact@kavyarajpowell.com","phone":"","website":"","location":"Dubai, UAE","notes":"MUAH","rateCard":""},{"id":97,"name":"Mabys","category":"Hair and Makeup","email":"mabs.khakwani@gmail.com","phone":"","website":"","location":"Dubai, UAE","notes":"@mabys_art · MUA","rateCard":""},{"id":98,"name":"Manu Iosada","category":"Hair and Makeup","email":"","phone":"971 50 105 1959","website":"","location":"Dubai, UAE","notes":"expensive - 6k","rateCard":""},{"id":99,"name":"Betty Bee","category":"Hair and Makeup","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":100,"name":"Jessica Ortiz","category":"Hair and Makeup","email":"Katie Ward <katie@kalpana.us>","phone":"","website":"","location":"London, UK","notes":"Kalpana · MUA - New York","rateCard":""},{"id":101,"name":"Levi Monarch","category":"Hair and Makeup","email":"Leslie Kramer <info@kramerkramer.com>","phone":"","website":"","location":"London, UK","notes":"Kramer + Kramer · Hair - New York","rateCard":""},{"id":102,"name":"Marco Castro","category":"Hair and Makeup","email":"alec@born-artists.com","phone":"917 972 9800","website":"","location":"London, UK","notes":"Born Artists · MUA - New York","rateCard":""},{"id":103,"name":"Matthew Sky","category":"Hair and Makeup","email":"Melinda Barnes <melindab@nextmodels.com>","phone":"","website":"","location":"London, UK","notes":"Next Management · Grooming - LA","rateCard":""},{"id":104,"name":"Harris Elliott","category":"Stylists","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":105,"name":"Sophie Watson","category":"Stylists","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":106,"name":"Otter Hatchett","category":"Stylists","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":107,"name":"Oli Arnold","category":"Stylists","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":108,"name":"Charlie Schneider","category":"Stylists","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":109,"name":"Sofia Lazzari","category":"Stylists","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":110,"name":"Anisa Aour","category":"Stylists","email":"emily@chapmanburrell.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":111,"name":"Mac Heulster","category":"Stylists","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":112,"name":"Fernando Pichardo","category":"Stylists","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":113,"name":"Jade Chilton","category":"Stylists","email":"JadeLchilton@gmail.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":114,"name":"Jennifer Kolombo","category":"Stylists","email":"","phone":"","website":"www.instagram.com/bambikoko/?hl=en","location":"Dubai, UAE","notes":"","rateCard":""},{"id":115,"name":"Kate Hazell","category":"Stylists","email":"","phone":"","website":"www.kate-hazell.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":116,"name":"Marilla Rizzi","category":"Stylists","email":"visual@marillarizzi.com","phone":"","website":"www.marillarizzi.com","location":"Dubai, UAE","notes":"https://www.instagram.com/marilla_meryl/","rateCard":""},{"id":117,"name":"Vasil Bhozilov","category":"Stylists","email":"vasilbozhilov@gmail.com","phone":"","website":"www.instagram.com/vasilbozhilov","location":"Dubai, UAE","notes":"","rateCard":""},{"id":118,"name":"Gorkaya Natasha","category":"Stylists","email":"gogorkaya.n@gmail.com","phone":"","website":"www.instagram.com/vasilbozhilov","location":"Dubai, UAE","notes":"","rateCard":""},{"id":119,"name":"Charlotte White","category":"Stylists","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":120,"name":"Laura Jane Brown","category":"Stylists","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":121,"name":"Bellal Hassan","category":"Stylists","email":"","phone":"","website":"www.instagram.com/bbelalbebo/?hl=en","location":"London, UK","notes":"Cairo, Egypt","rateCard":""},{"id":122,"name":"IMG","category":"Casting","email":"Andrew.Garratt@img.com","phone":"44 (0) 7540 704276","website":"","location":"London, UK","notes":"","rateCard":""},{"id":123,"name":"PRM","category":"Casting","email":"sophie@prm-agency.com","phone":"44 (0) 7444 214 470","website":"","location":"London, UK","notes":"","rateCard":""},{"id":124,"name":"W Model","category":"Casting","email":"charlotte@wmodel.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":125,"name":"Whilhelmina","category":"Casting","email":"whitney.harrison@wilhelmina.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":126,"name":"Anti Agency","category":"Casting","email":"charlotte@antiagency.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":127,"name":"Evolve Model","category":"Casting","email":"elizabeth@evolvemodel.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":128,"name":"Models 1","category":"Casting","email":"alice@models1.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":129,"name":"Supa","category":"Casting","email":"ro@supamodelmanagement.com","phone":"44 (0) 207 4904 441","website":"","location":"London, UK","notes":"","rateCard":""},{"id":130,"name":"Body London","category":"Casting","email":"gemmah@bodylondon.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":131,"name":"Elite","category":"Casting","email":"s.delbanco@elitemodel.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":132,"name":"Select","category":"Casting","email":"nina@selectmodel.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":133,"name":"Storm","category":"Casting","email":"Charlotte@stormmanagement.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":134,"name":"Milk","category":"Casting","email":"kitty@milkmanagement.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":135,"name":"Premier","category":"Casting","email":"patrick@premiermodelmanagement.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":136,"name":"The Squad","category":"Casting","email":"Adam@thesquadmanagement.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":137,"name":"Next","category":"Casting","email":"Sarahv@nextmodels.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":138,"name":"Riches MGMT","category":"Casting","email":"philip@richesmgmt.com","phone":"31 (0) 616 763 544","website":"","location":"London, UK","notes":"","rateCard":""},{"id":139,"name":"Chapter MGMT","category":"Casting","email":"katies@chaptermgmt.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":140,"name":"Linden Staub","category":"Casting","email":"Becki Wilson <becki@lindenstaub.com>","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":141,"name":"Boss","category":"Casting","email":"russell@Bossmodels.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":142,"name":"Established","category":"Casting","email":"emily@establishedmodels.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":143,"name":"Perspective","category":"Casting","email":"billie@perspectivemanagement.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":144,"name":"Menace Models","category":"Casting","email":"assistant@menacemodels.co.uk","phone":"","website":"www.menacemodels.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":145,"name":"Viva London","category":"Casting","email":"natalie.hand@viva-london.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":146,"name":"Nevs","category":"Casting","email":"shaun@nevsnation.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":147,"name":"Sandra Reynolds","category":"Casting","email":"jemimamason@sandrareynolds.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":148,"name":"Nevs - Steven","category":"Casting","email":"steven@nevs.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":149,"name":"Models 1 - New Face","category":"Casting","email":"Georgia Lia - g.lia@models1.co.uk / Milena - milena@models1.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":150,"name":"Models 1 - Image","category":"Casting","email":"jordan@models1.co.uk / gemma@models1.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":151,"name":"IMG London","category":"Casting","email":"Anna Masters <anna.masters@img.com>","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":152,"name":"Supa","category":"Casting","email":"Tim@supamodelmanagement.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":153,"name":"FORD Models","category":"Casting","email":"crucker@fordmodels.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":154,"name":"VISION LA - Womens","category":"Casting","email":"Rhiannon Webb <rhiannon@VisionLosAngeles.com>","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":155,"name":"VISION LA - Mens","category":"Casting","email":"Marco Servetti <marco@VisionLosAngeles.com>","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":156,"name":"The Society NYC","category":"Casting","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":157,"name":"Photogenics","category":"Casting","email":"Alexis Renson <Alexis@photogenicsmedia.com>","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":158,"name":"The Dragonfly Agency","category":"Casting","email":"Stasia Langford <stasia@thedragonflyagency.com>","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":159,"name":"Whilhelmina","category":"Casting","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":160,"name":"Whilhelmina - NYC - Womens","category":"Casting","email":"jason.sobe@wilhelmina.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":161,"name":"Motion MGMT","category":"Casting","email":"alyona@motion-models.com and maria@motion-models.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":162,"name":"Michelle Hay Management","category":"Casting","email":"hello@michellehaymanagement.com","phone":"","website":"www.michellehaymanagement.com","location":"Dubai, UAE","notes":"Will cast for INTL models","rateCard":""},{"id":163,"name":"Fashion League UAE","category":"Casting","email":"leila@fashionleague.ae","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":164,"name":"MMG","category":"Casting","email":"faith@mmgmodels.com / shivangi@mmgmodels.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":165,"name":"JEEL Management","category":"Casting","email":"BOOKER - JEEL MGMT <booker@jeelmanagement.com>","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":166,"name":"MLN Model","category":"Casting","email":"info@mlnmodel.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":167,"name":"TAL Cmm","category":"Casting","email":"ingrid@talcmm.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":168,"name":"Nondescript Studios","category":"Casting","email":"bookings@nondescriptstudios.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":169,"name":"ANT Management","category":"Casting","email":"anita@antmgmt.com / Petrenne@antmgmt.com","phone":"","website":"www.antmgmt.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":170,"name":"Art Factory Studio","category":"Casting","email":"booking@artfactorystudio.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":171,"name":"Bareface Agency","category":"Casting","email":"hello@bareface.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":172,"name":"NDS Models","category":"Casting","email":"bookings@ndsmodels.com\nkim@ndsmodels.com\nleila@ndsmodels.com","phone":"","website":"ndsmodels.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":173,"name":"AVANT Agency ME","category":"Casting","email":"Liza Gorevalova <liza.g@avantmodels.agency>","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":174,"name":"Le Management","category":"Casting","email":"info@lemanagement.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":175,"name":"Nelson Model","category":"Casting","email":"leonard@nelsonmodel.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":176,"name":"Citizen","category":"Casting","email":"diego@city-models.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":177,"name":"Uno","category":"Casting","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":178,"name":"City Models","category":"Casting","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":179,"name":"Viva Models","category":"Casting","email":"Anna Masters <anna.masters@img.com>","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":180,"name":"Pique food","category":"Catering","email":"orders@piquefood.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":181,"name":"N5 Kitchen","category":"Catering","email":"suzie@n5kitchen.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":182,"name":"Zaras Kitchen","category":"Catering","email":"zara@zaraskitchen.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":183,"name":"Kate The Cook","category":"Catering","email":"kate@katethecook.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":184,"name":"Grays Inn Kitchen","category":"Catering","email":"graysinnkitchen@gmail.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":185,"name":"Tart London","category":"Catering","email":"jemima@tart-london.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":186,"name":"Clove London","category":"Catering","email":"feedme@clovelondon.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":187,"name":"Eden Caterers","category":"Catering","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":188,"name":"Pear drop london","category":"Catering","email":"lisa@peardroplondon.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":189,"name":"Bread and Honey","category":"Catering","email":"bookings@breadandhoney.net","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":190,"name":"Wolf & Lamb","category":"Catering","email":"hello@wolfandlamb.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":191,"name":"Marmelo Kitchen","category":"Catering","email":"catering@marmelokitchen.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":192,"name":"Luluz Catering","category":"Catering","email":"info@luluzcatering.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":193,"name":"Elevate Cater","category":"Catering","email":"jessey@elevatecaternyc.com","phone":"","website":"","location":"London, UK","notes":"New York","rateCard":""},{"id":194,"name":"The Chefs Agency","category":"Catering","email":"contact@thechefsagency.com","phone":"","website":"","location":"London, UK","notes":"New York","rateCard":""},{"id":195,"name":"Dishful Catering","category":"Catering","email":"info@dishfulcatering.com","phone":"","website":"","location":"London, UK","notes":"New York","rateCard":""},{"id":196,"name":"Haute Chefs","category":"Catering","email":"","phone":"","website":"hautechefsla.com","location":"London, UK","notes":"LA","rateCard":""},{"id":197,"name":"Kitchen Mouse","category":"Catering","email":"catering@kitchenmousela.com","phone":"","website":"www.kitchenmousela.com","location":"London, UK","notes":"LA","rateCard":""},{"id":198,"name":"One Life","category":"Catering","email":"","phone":"","website":"www.onelifedxb.com/catering/light-lunch","location":"Dubai, UAE","notes":"","rateCard":""},{"id":199,"name":"Taste Studio Catering","category":"Catering","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"130 pp","rateCard":""},{"id":200,"name":"Ghon Catering","category":"Catering","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":201,"name":"Cafe Nero","category":"Catering","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":202,"name":"Elements Catering","category":"Catering","email":"","phone":"","website":"www.elements.catering","location":"Dubai, UAE","notes":"","rateCard":""},{"id":203,"name":"Pinch Catering","category":"Catering","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":204,"name":"Blended Catering","category":"Catering","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":205,"name":"Ogart Catering","category":"Catering","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":206,"name":"Avec Events","category":"Catering","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":207,"name":"Relish Catering","category":"Catering","email":"Calvin Pinto <calvin@convoy-films.com>","phone":"","website":"","location":"Dubai, UAE","notes":"135 pp","rateCard":""},{"id":208,"name":"Zan Morley","category":"Set Design","email":"zanmorleystylist@gmail.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":209,"name":"Scott Kennedy","category":"Set Design","email":"sc0ttkennedy@hotmail.co.uk","phone":"44 (0) 7909 878 119","website":"","location":"London, UK","notes":"","rateCard":""},{"id":210,"name":"Johanna Currie","category":"Set Design","email":"johanna.currie@gmail.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":211,"name":"Bryony Edwards","category":"Set Design","email":"bryony@bryonyedwards.com","phone":"44 (0) 7800 796 051","website":"www.bryonyedwards.com","location":"London, UK","notes":"","rateCard":""},{"id":212,"name":"Sarianne Plaisant","category":"Set Design","email":"sarianneplaisant@gmail.com","phone":"44 (0) 7854 413305","website":"sarianneplaisant.com","location":"London, UK","notes":"","rateCard":""},{"id":213,"name":"Lizzie Jeffries","category":"Set Design","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":214,"name":"Laura Timmons","category":"Set Design","email":"laura.timmons@icloud.com","phone":"44 (0) 7716237772","website":"","location":"London, UK","notes":"","rateCard":""},{"id":215,"name":"Grace Becker Burnett","category":"Set Design","email":"gracebeckerburn@gmail.com","phone":"44 (0) 7393323469","website":"","location":"London, UK","notes":"","rateCard":""},{"id":216,"name":"Libby Keizer","category":"Set Design","email":"keizershalom@gmail.com","phone":"7565542036","website":"","location":"London, UK","notes":"","rateCard":""},{"id":217,"name":"Katia Hall","category":"Set Design","email":"katia@bryonyedwards.com","phone":"07789 936 486","website":"","location":"London, UK","notes":"","rateCard":""},{"id":218,"name":"Granger Hertzog","category":"Set Design","email":"harriet@grangerhertzog.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":219,"name":"Modern Classic Prop Hire","category":"Set Design","email":"modern@classicprophire.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":220,"name":"Classic Prop Hire","category":"Set Design","email":"tommy.hurton@classicprophire.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":221,"name":"Theme Traders","category":"Set Design","email":"tommy.hurton@classicprophire.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":222,"name":"Hapaca","category":"Set Design","email":"office@hapacastudio.com","phone":"44 (0) 203 397 2757","website":"hapacastudio.com/rental-backdrops","location":"London, UK","notes":"To Rent","rateCard":""},{"id":223,"name":"AJ's","category":"Set Design","email":"info@aj-s.co.uk","phone":"44 (0) 1749 813 044","website":"aj-s.co.uk/collections/backgrounds","location":"London, UK","notes":"To Buy","rateCard":""},{"id":224,"name":"Hapaca","category":"Set Design","email":"office@hapacastudio.com","phone":"44 (0) 203 397 2757","website":"hapacastudio.com/rental-backdrops","location":"London, UK","notes":"To Rent","rateCard":""},{"id":225,"name":"AJ's","category":"Set Design","email":"info@aj-s.co.uk","phone":"44 (0) 1749 813 044","website":"aj-s.co.uk/collections/backgrounds","location":"London, UK","notes":"To Buy","rateCard":""},{"id":226,"name":"Bryan Porter / BG Porter","category":"Set Design","email":"porter@owlandtheelephant.com","phone":"","website":"www.porterhandmade.com/contact","location":"London, UK","notes":"LA","rateCard":""},{"id":227,"name":"WANENMACHER Studios","category":"Set Design","email":"tamara@aterliermanagement.com","phone":"","website":"","location":"London, UK","notes":"LA - rep by Atelier MGMT","rateCard":""},{"id":228,"name":"Oliphant","category":"Set Design","email":"rentals@ostudio.com","phone":"","website":"oliphantstudio.com","location":"London, UK","notes":"New York / LA","rateCard":""},{"id":229,"name":"Katrine Hanna Set Designer","category":"Set Design","email":"katrine@katrinehanna.com","phone":"44 7951 051 558","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":230,"name":"KITAVIN Studio - Dmitri","category":"Set Design","email":"info@kitavin.com","phone":"","website":"www.instagram.com/kitavin.studio","location":"Dubai, UAE","notes":"","rateCard":""},{"id":231,"name":"The Creativ Club - Ximena sabatini","category":"Set Design","email":"ximena@thecreativclub.com","phone":"","website":"www.instagram.com/thecreativclub","location":"Dubai, UAE","notes":"2.5 AED full day onset styling\n1.8 AED half day onset styling\n2 AED prep full day \n1.5 AED prep half day","rateCard":""},{"id":232,"name":"Yehia Bedeir","category":"Set Design","email":"y.bedier@live.com","phone":"","website":"www.instagram.com/yehiabedier","location":"Dubai, UAE","notes":"","rateCard":""},{"id":233,"name":"Nour Choukeir","category":"Set Design","email":"nourchoukeir0@gmail.com","phone":"971 58 505 2640","website":"","location":"Dubai, UAE","notes":"Set Designer: AED 3,000 (prep) / AED 7,000 (shoot day)\nProps Master: AED 1,500 (prep) / AED 1,800 (shoot day)\nArt Assistant: AED 500 (prep) / AED 800 (shoot day)\nOn-Set Helper: AED 500 (shoot day)\nTruck Rental: AED 800 per day","rateCard":""},{"id":234,"name":"Duette - Fuad Ali","category":"Set Design","email":"info@duettestudio.com","phone":"971 52 849 1994","website":"","location":"Dubai, UAE","notes":"duette_studio","rateCard":""},{"id":235,"name":"Ayesha Riaz","category":"Set Design","email":"ayesha@cash--bar.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":236,"name":"Lauren Haslam","category":"Set Design","email":"lauren@laurenhaslam.com","phone":"971 50 456 6351","website":"","location":"Dubai, UAE","notes":"3000 AED prep/shoot","rateCard":""},{"id":237,"name":"Gosha","category":"Set Design","email":"","phone":"","website":"goshaflowers.com","location":"Dubai, UAE","notes":"Flowers","rateCard":""},{"id":238,"name":"Airwerks Studio","category":"Set Design","email":"","phone":"","website":"airwerksstudios.com","location":"Dubai, UAE","notes":"Vintage Cars","rateCard":""},{"id":239,"name":"Gas","category":"Equipment","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":240,"name":"Pro Lighting","category":"Equipment","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":241,"name":"Direct Digital","category":"Equipment","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":242,"name":"Hawk","category":"Equipment","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":243,"name":"Civilised","category":"Equipment","email":"operations@londoncarhire.com","phone":"44 (0) 207 738 7788","website":"londoncarhire.com","location":"London, UK","notes":"","rateCard":""},{"id":244,"name":"Driver - Sacha - Civilised","category":"Equipment","email":"sachaobodai@live.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":245,"name":"Milk Studios","category":"Equipment","email":"equipment-ny@milkstudios.com","phone":"212 645 2797","website":"www.milkstudios.com","location":"London, UK","notes":"New York","rateCard":""},{"id":246,"name":"Vivid Kid","category":"Equipment","email":"mjdidyoung@me.com","phone":"205 886 6656","website":"www.vividkid.com","location":"London, UK","notes":"New York","rateCard":""},{"id":247,"name":"Quixote","category":"Equipment","email":"NYPS@Quixote.com","phone":"347 448 8414","website":"quixote.com","location":"London, UK","notes":"New York","rateCard":""},{"id":248,"name":"Blacklane","category":"Equipment","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":249,"name":"Lightspeed","category":"Equipment","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":250,"name":"Blacklane","category":"Equipment","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":251,"name":"Lightspeed","category":"Equipment","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":252,"name":"Dubai Film","category":"Equipment","email":"contact@dubaifilm.ae","phone":"971 50 481 4509","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":253,"name":"Hot Cold Studio","category":"Equipment","email":"frankie@hotcoldstudio.com","phone":"","website":"www.hotcoldstudio.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":254,"name":"Pro Angles Media","category":"Equipment","email":"info@proanglesmedia.com","phone":"971 526 722 009","website":"www.proanglesmedia.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":255,"name":"Action Filmz","category":"Equipment","email":"","phone":"971 56 403 2761","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":256,"name":"Al Walid Equipment Rental","category":"Equipment","email":"walidequipment@gmail.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":257,"name":"Cinegear","category":"Equipment","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":258,"name":"The Global Limo","category":"Equipment","email":"info@thegloballimo.com","phone":"971 50 547 0868","website":"","location":"Dubai, UAE","notes":"Good for airport pick ups, luxury cars","rateCard":""},{"id":259,"name":"Fajr Al Noor Tourism","category":"Equipment","email":"info@busrentalindubai.com","phone":"971 55 451 9169","website":"","location":"Dubai, UAE","notes":"Good for cheap van 700 / 10 hours","rateCard":""},{"id":260,"name":"Wajid","category":"Equipment","email":"","phone":"971 55 948 0546","website":"","location":"Dubai, UAE","notes":"Good driver, 1500 aed for 10 hours 15 seater / 1600 aed for 10 hours 10 seater","rateCard":""},{"id":261,"name":"High End Films","category":"Equipment","email":"","phone":"966 55 450 3574","website":"www.highendfilms.com","location":"London, UK","notes":"Saudi","rateCard":""},{"id":262,"name":"Millimeter Productions","category":"Equipment","email":"fadi@millimeter.sa","phone":"","website":"","location":"London, UK","notes":"Saudi","rateCard":""},{"id":263,"name":"One Take Drones","category":"Equipment","email":"info@onetakedrones.com","phone":"","website":"","location":"London, UK","notes":"Saudi - Drone Hire","rateCard":""},{"id":264,"name":"James Cox","category":"Crew","email":"james@blackdotsvideo.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":265,"name":"James Cooke","category":"Crew","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":266,"name":"Adrian Cook","category":"Crew","email":"adrianvcook@gmail.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":267,"name":"Simon Plunkett","category":"Crew","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":268,"name":"Ben Kyle","category":"Crew","email":"info@ben-kyle.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":269,"name":"Jear Velasquez","category":"Crew","email":"studio@jearvelasquez.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":270,"name":"Christiaan Ellis","category":"Crew","email":"christiaanellis.vid@gmail.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":271,"name":"Elvira","category":"Crew","email":"","phone":"","website":"www.instagram.com/elviragabitova_?igsh=bnFhM3d0NWMxejlz","location":"Dubai, UAE","notes":"","rateCard":""},{"id":272,"name":"Bassem","category":"Crew","email":"","phone":"","website":"www.instagram.com/bassem_eldabour?igsh=MjF3emljOTg0Z2Q3&utm_source=qr -","location":"Dubai, UAE","notes":"","rateCard":""},{"id":273,"name":"Mattia Holme","category":"Crew","email":"nouna@mmgartists.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":274,"name":"Alastair Jerome-Ball","category":"Crew","email":"Alastair_jb@hotmail.co.uk","phone":"","website":"","location":"Dubai, UAE","notes":"Digi Opp","rateCard":""},{"id":275,"name":"Tony Ibrahim","category":"Crew","email":"focuspuller435@gmail.com","phone":"971 56 411 8207","website":"","location":"Dubai, UAE","notes":"1st AC - 2500 SHOOT / 1250 GC","rateCard":""},{"id":276,"name":"Sabrine El Basi","category":"Crew","email":"sabrine.elbasri95@gmail.com","phone":"212 695 898585","website":"","location":"Dubai, UAE","notes":"2nd AC - 1500 SHOOT / 750 GC","rateCard":""},{"id":277,"name":"Simon Charles","category":"Crew","email":"hi@soundindubai.com","phone":"971 52 877 7508","website":"","location":"Dubai, UAE","notes":"Soundie - 2850","rateCard":""},{"id":278,"name":"Jakub Plesniarski","category":"Crew","email":"jakub.plesniarski@gmail.com","phone":"","website":"mmgartists.com/en/artist/jakub-artist-1064/fashion","location":"Dubai, UAE","notes":"https://www.dropbox.com/scl/fi/d7m4w395wjzgeuj2trmi1/PORTFOLIO_Jakub_Plesniarski_MMG.pdf?rlkey=g7qbgs6h3w1ekgx1vz5zt5p1h&e=1&dl=0","rateCard":""},{"id":279,"name":"Lesha Lich","category":"Crew","email":"","phone":"","website":"www.instagram.com/leshalich","location":"Dubai, UAE","notes":"","rateCard":""},{"id":280,"name":"Moez Achour","category":"Crew","email":"","phone":"","website":"www.instagram.com/moezachourstudio/?hl=en","location":"Dubai, UAE","notes":"","rateCard":""},{"id":281,"name":"Mousslam Rabat","category":"Crew","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":282,"name":"Yassine Taha","category":"Crew","email":"","phone":"","website":"www.instagram.com/airplanemodev1/?hl=en","location":"Dubai, UAE","notes":"still life","rateCard":""},{"id":283,"name":"Amer Mohamad","category":"Crew","email":"","phone":"","website":"www.instagram.com/shootmeamer/?hl=en","location":"Dubai, UAE","notes":"","rateCard":""},{"id":284,"name":"Mazen Abusrour","category":"Crew","email":"","phone":"","website":"www.instagram.com/mazenabusrour","location":"Dubai, UAE","notes":"","rateCard":""},{"id":285,"name":"Cameron Bensley","category":"Crew","email":"cbensley70@gmail.com","phone":"","website":"www.instagram.com/cameron.bensleyy","location":"Dubai, UAE","notes":"still life","rateCard":""},{"id":286,"name":"Stef Galea","category":"Crew","email":"studio@stefgalea.com","phone":"","website":"","location":"Dubai, UAE","notes":"Fashion","rateCard":""},{"id":287,"name":"Sam Rawadi","category":"Crew","email":"booker@jeelmanagement.com","phone":"","website":"www.instagram.com/samrawadi","location":"Dubai, UAE","notes":"Fashion","rateCard":""},{"id":288,"name":"Daniel Asater","category":"Crew","email":"","phone":"","website":"www.instagram.com/daniel.asater","location":"Dubai, UAE","notes":"","rateCard":""},{"id":289,"name":"Fouad Tadros","category":"Crew","email":"info@fouadtadros.com","phone":"","website":"www.instagram.com/fouadtadros","location":"Dubai, UAE","notes":"","rateCard":""},{"id":290,"name":"Giuseppe Vitariello","category":"Crew","email":"","phone":"","website":"www.giuseppevitariello.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":291,"name":"Michel Takla","category":"Crew","email":"Michelltakla@gmail.com","phone":"","website":"www.micheltakla.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":292,"name":"Mox Santos","category":"Crew","email":"mox@nondescriptstudios.com","phone":"","website":"www.moxsantos.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":293,"name":"Amina Zaher","category":"Crew","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":294,"name":"Daron Bandeira","category":"Crew","email":"info@daronbandeira.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":295,"name":"Vladimir Marti","category":"Crew","email":"","phone":"","website":"www.vladimirmartistudio.com / https://www.instagram.com/vladimirmarti","location":"Dubai, UAE","notes":"","rateCard":""},{"id":296,"name":"Greg Adamski","category":"Crew","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":297,"name":"Things By People","category":"Crew","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":298,"name":"MMG","category":"Crew","email":"nouna@mmgartists.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":299,"name":"LMC Worldwide","category":"Crew","email":"","phone":"","website":"www.lmc.world","location":"Dubai, UAE","notes":"","rateCard":""},{"id":300,"name":"D&D Management","category":"Crew","email":"ddmgmt@capitaldgroup.com","phone":"","website":"www.dd-management.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":301,"name":"Natasha Yonan Kazandjian","category":"Crew","email":"","phone":"","website":"www.instagram.com/namayoka","location":"London, UK","notes":"Cairo, Egypt","rateCard":""},{"id":302,"name":"Mohhamed Sherif","category":"Crew","email":"","phone":"","website":"www.instagram.com/mohhamed_sherif","location":"London, UK","notes":"Cairo, Egypt","rateCard":""},{"id":303,"name":"Mariam Al Gendy","category":"Crew","email":"","phone":"","website":"www.instagram.com/mgendy_","location":"London, UK","notes":"","rateCard":""},{"id":304,"name":"Kolby Knight","category":"Crew","email":"","phone":"","website":"www.kolbyknight.com","location":"London, UK","notes":"New York","rateCard":""},{"id":305,"name":"Nicolas Kuttler","category":"Crew","email":"nicolas.kuttler@gmail.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":306,"name":"Lee Holmes","category":"Crew","email":"lee.m.holmes1@gmail.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":307,"name":"James Cook","category":"Crew","email":"me@jamestcook.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":308,"name":"Okay - Alex","category":"Crew","email":"athene@okaystudio.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":309,"name":"Cheat","category":"Crew","email":"dom@cheatit.co","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":310,"name":"Sølv","category":"Crew","email":"solvofficial@gmail.com","phone":"","website":"www.solvofficial.com","location":"London, UK","notes":"","rateCard":""},{"id":311,"name":"Tom Tripp","category":"Crew","email":"tomtrippmusic@gmail.com","phone":"44 (0) 7943 337295","website":"","location":"London, UK","notes":"","rateCard":""},{"id":312,"name":"Excellent Talent","category":"Crew","email":"info@excellenttalent.com","phone":"44 (0) 3452 100 111","website":"excellenttalent.com","location":"London, UK","notes":"","rateCard":""},{"id":313,"name":"Bring Digital","category":"Crew","email":"info@bringdigital.co.uk","phone":"44 (0) 0161 441 0895","website":"www.bringdigital.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":314,"name":"Voicebank London","category":"Crew","email":"voices@voicebanklondon.co.uk","phone":"44 (0) 20 3326 5430","website":"www.voicebanklondon.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":315,"name":"Another Tongue","category":"Crew","email":"Marcus Furlong <Marcus@anothertongue.com>","phone":"","website":"","location":"London, UK","notes":"£4k","rateCard":""},{"id":316,"name":"Sue Terry Voices","category":"Crew","email":"sue@sueterryvoices.com","phone":"44 (0) 20 7434 2040","website":"www.sueterryvoices.com","location":"London, UK","notes":"£1k per scripts + £250 recording fee","rateCard":""},{"id":317,"name":"Meet the Jones","category":"Crew","email":"Laura Milne <laura@meetthejoneses.co.uk>","phone":"","website":"","location":"London, UK","notes":"£5k for social","rateCard":""},{"id":318,"name":"Paul Drozdowski","category":"Crew","email":"maxxie3@hotmail.co.uk","phone":"","website":"","location":"London, UK","notes":"130 per image","rateCard":""},{"id":319,"name":"Paulina Teller","category":"Crew","email":"paulina@ptretouch.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":320,"name":"KK Retouch / Kushtrim Kunushevci","category":"Crew","email":"kushtrim.kunushevci@gmail.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":321,"name":"SoftSpot","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":322,"name":"Tiagi Production","category":"Production","email":"Iman@tiagi.com / Zim@tiagiproduction.com","phone":"","website":"","location":"London, UK","notes":"Iman / Zim","rateCard":""},{"id":323,"name":"Curated. Co","category":"Production","email":"katie@the-curated.co / curator@the-curated.co","phone":"","website":"","location":"London, UK","notes":"Katie Holmes / Giorgio","rateCard":""},{"id":324,"name":"Pavilion Works","category":"Production","email":"hello@pavilionworks.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":325,"name":"Danson Productions","category":"Production","email":"kerry@dansonproductions.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":326,"name":"Raw Productions","category":"Production","email":"info@raw-production.co.uk","phone":"","website":"","location":"London, UK","notes":"Jeska","rateCard":""},{"id":327,"name":"Un-Produced","category":"Production","email":"hello@un-produced.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":328,"name":"Town Production","category":"Production","email":"info@townprod.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":329,"name":"Rosco Production","category":"Production","email":"london@roscoproduction.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":330,"name":"Ragi Production","category":"Production","email":"office@ragiproductions.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":331,"name":"NM Production","category":"Production","email":"london@nm-productions.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":332,"name":"Mayor Production","category":"Production","email":"info@mayor.productions","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":333,"name":"MAD Production","category":"Production","email":"office@mad.global","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":334,"name":"January Production","category":"Production","email":"leonardpetit@gmail.com","phone":"","website":"","location":"London, UK","notes":"Leonard Petit","rateCard":""},{"id":335,"name":"JN Production","category":"Production","email":"info@jnproduction.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":336,"name":"Fresh Base","category":"Production","email":"info@fresh-base.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":337,"name":"Cebe Studio","category":"Production","email":"careers@cebe.studio","phone":"","website":"","location":"London, UK","notes":"London / Events & Stills","rateCard":""},{"id":338,"name":"Noir Production","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":339,"name":"Creative Blood Agency","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":340,"name":"Chebabo & Co","category":"Production","email":"anthony@chebabo.com","phone":"","website":"","location":"London, UK","notes":"Anthony Chebabo","rateCard":""},{"id":341,"name":"Ice Studios","category":"Production","email":"jess@icestudios.co","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":342,"name":"Aalto Production","category":"Production","email":"alex.aalto@yahoo.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":343,"name":"Somesuch & Co","category":"Production","email":"resume@somesuch.co","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":344,"name":"Lola Production","category":"Production","email":"london@lolaproduction.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":345,"name":"Farago Projects","category":"Production","email":"info@farago-projects.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":346,"name":"Pulse Films","category":"Production","email":"cv@pulsefilms.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":347,"name":"Partner Films","category":"Production","email":"info@partnerfilms.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":348,"name":"Honor Hellon","category":"Production","email":"honor@honorhellonproduction.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":349,"name":"We are by Association","category":"Production","email":"hello@wearebyassociation.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":350,"name":"Sonder","category":"Production","email":"hello@sonder.london","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":351,"name":"Hyperion","category":"Production","email":"hello@hyperionla.com","phone":"","website":"hyperionla.com","location":"London, UK","notes":"","rateCard":""},{"id":352,"name":"Division.Global","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":353,"name":"JNproduction","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":354,"name":"Left Productions","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":355,"name":"Blank Square Productions","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":356,"name":"The Morrison Group","category":"Production","email":"info@themorrisongrp.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":357,"name":"Virgin Soil","category":"Production","email":"contact@virginsoilpictures.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":358,"name":"Lola Production","category":"Production","email":"newyork@lolaproduction.com / losangeles@lolaproduction.com","phone":"","website":"","location":"London, UK","notes":"NYC / LA / LDN / EUROPE","rateCard":""},{"id":359,"name":"Partner Films","category":"Production","email":"info@partnerfilms.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":360,"name":"North of Now","category":"Production","email":"hi@northofnow.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":361,"name":"Crawford & Co","category":"Production","email":"zach@crawfordandcoproductions.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":362,"name":"Wilson Projects","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":363,"name":"Early Morning Riot","category":"Production","email":"jennifer@earlymorningriot.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":364,"name":"Oui Productions","category":"Production","email":"gabrielle@oui-productions.com","phone":"","website":"","location":"London, UK","notes":"Gabi","rateCard":""},{"id":365,"name":"YY Production","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"Asli","rateCard":""},{"id":366,"name":"Partner Films","category":"Production","email":"info@partnerfilms.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":367,"name":"Rosco Production","category":"Production","email":"newyork@roscoproduction.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":368,"name":"Honor Hellon","category":"Production","email":"honor@honorhellonproduction.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":369,"name":"We are By Association","category":"Production","email":"hello@wearebyassociation.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":370,"name":"Camp Productions","category":"Production","email":"fran@camp.productions","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":371,"name":"Public.Space","category":"Production","email":"contact@publicspace.studio","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":372,"name":"Goma Studios","category":"Production","email":"rudah@goma.co","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":373,"name":"Viewfinders","category":"Production","email":"dana@viewfinders.us","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":374,"name":"1505 Studio","category":"Production","email":"hello@1505.studio","phone":"","website":"www.1505.Studio","location":"Dubai, UAE","notes":"Beirut/Dubai","rateCard":""},{"id":375,"name":"NM Productions","category":"Production","email":"enquiries@nm-productions.com","phone":"","website":"www.nm-productions.com","location":"Dubai, UAE","notes":"London/Dubai/US","rateCard":""},{"id":376,"name":"MMG Art Production","category":"Production","email":"Ignacio@mmgartproduction.com","phone":"","website":"","location":"Dubai, UAE","notes":"Dubai","rateCard":""},{"id":377,"name":"WMI","category":"Production","email":"Jorge Agut Rosell <jorge@wmi-global.com>","phone":"","website":"","location":"Dubai, UAE","notes":"Dubai/London/NYC","rateCard":""},{"id":378,"name":"JWI","category":"Production","email":"hello@jwi-global.com","phone":"","website":"jwi-global.com","location":"Dubai, UAE","notes":"Dubai","rateCard":""},{"id":379,"name":"Dejavu Dubai","category":"Production","email":"","phone":"","website":"www.dejavu.ae","location":"Dubai, UAE","notes":"Dubai","rateCard":""},{"id":380,"name":"The Collective (Events)","category":"Production","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"Heather -","rateCard":""},{"id":381,"name":"Filmworks Group","category":"Production","email":"","phone":"","website":"filmworksgroup.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":382,"name":"AStudio","category":"Production","email":"","phone":"","website":"www.astudio.ae/creative-digital-agency","location":"Dubai, UAE","notes":"","rateCard":""},{"id":383,"name":"arabianEye","category":"Production","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":384,"name":"Nomad","category":"Production","email":"","phone":"","website":"filmsbynomad.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":385,"name":"Toast Films","category":"Production","email":"","phone":"","website":"www.toast-films.com","location":"Dubai, UAE","notes":"Abu Dhabi/Dubai","rateCard":""},{"id":386,"name":"Meraki","category":"Production","email":"","phone":"","website":"www.merakiproduction.com","location":"Dubai, UAE","notes":"London/Dubai","rateCard":""},{"id":387,"name":"Magnet","category":"Production","email":"","phone":"","website":"www.magnetconnect.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":388,"name":"Electriclime","category":"Production","email":"<layal@electriclimefilms.com> <michael@electriclimefilms.com>","phone":"","website":"electriclimefilms.com","location":"Dubai, UAE","notes":"Singapore/Dubai/Sydney","rateCard":""},{"id":389,"name":"Twofour54","category":"Production","email":"","phone":"","website":"www.twofour54.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":390,"name":"Good Stills","category":"Production","email":"jolianne@goodstills.com","phone":"","website":"www.goodstills.com","location":"Dubai, UAE","notes":"Dubai/Saudi/Bahrain","rateCard":""},{"id":391,"name":"everyone.film","category":"Production","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":392,"name":"Apex","category":"Production","email":"k.shurbaji@apexprodsmea.com","phone":"","website":"","location":"Dubai, UAE","notes":"Saudi","rateCard":""},{"id":393,"name":"Nashta Production","category":"Production","email":"contact@nashtaproduction.com","phone":"","website":"","location":"London, UK","notes":"Morrocco","rateCard":""},{"id":394,"name":"Kitten Production","category":"Production","email":"romain@kittenproduction.com","phone":"","website":"","location":"London, UK","notes":"Paris","rateCard":""},{"id":395,"name":"Company Paris","category":"Production","email":"contact@company.paris","phone":"","website":"","location":"London, UK","notes":"Paris","rateCard":""},{"id":396,"name":"Snap14 Production","category":"Production","email":"nadia@snap-14.com","phone":"","website":"www.snap14.com","location":"London, UK","notes":"Egypt","rateCard":""},{"id":397,"name":"Nakama Film","category":"Production","email":"Kenji Sato <kenji@nakamfilm.tv>","phone":"","website":"nakamafilm.tv","location":"London, UK","notes":"Japan","rateCard":""},{"id":398,"name":"Tokyo Colours","category":"Production","email":"Naoko Naoko@tokyo-colours.co.jp","phone":"","website":"","location":"London, UK","notes":"Japan","rateCard":""},{"id":399,"name":"Monky","category":"Production","email":"Håvard Schei <hs@monky.no>","phone":"","website":"www.monky.no","location":"London, UK","notes":"Norway","rateCard":""},{"id":400,"name":"Mercenaire Productions","category":"Production","email":"Salomé Jouan <salome@mercenaire.com>","phone":"","website":"","location":"London, UK","notes":"France","rateCard":""},{"id":401,"name":"Take Productions","category":"Production","email":"Take Production_Valie <valie@take.rocks>","phone":"","website":"","location":"London, UK","notes":"Bologna","rateCard":""},{"id":402,"name":"Juan Pina (Fixer)","category":"Production","email":"J.Pizitrone@gmail.com","phone":"","website":"","location":"London, UK","notes":"Mallorca","rateCard":""},{"id":403,"name":"Bibi Lacroix (Fixer)","category":"Production","email":"","phone":"","website":"www.wearestudiob.com","location":"London, UK","notes":"Mallorca","rateCard":""},{"id":404,"name":"Virtual Films","category":"Production","email":"info@virtualfilms.tv","phone":"","website":"virtualfilms.tv","location":"London, UK","notes":"Spain/Portugal - Barcelona","rateCard":""},{"id":405,"name":"Purple Brain","category":"Production","email":"mohammed@purplebrain.co","phone":"","website":"","location":"London, UK","notes":"Saudi Arabia","rateCard":""},{"id":406,"name":"Dora Joker","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"Barcelona","rateCard":""},{"id":407,"name":"Lettergray","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"Saudi Arabia","rateCard":""},{"id":408,"name":"Lindsay Nelson","category":"Production","email":"lindsaynelson106@gmail.com","phone":"","website":"www.lindsayjnelson.com","location":"Los Angeles, US","notes":"New York","rateCard":""},{"id":409,"name":"Sam Rockman","category":"Production","email":"sam@rockmanpro.com","phone":"","website":"www.rockmanpro.com","location":"Los Angeles, US","notes":"LA","rateCard":""},{"id":410,"name":"Helena Martel Sewards","category":"Production","email":"helena@lollywould.com","phone":"","website":"www.lollywould.com/about","location":"Los Angeles, US","notes":"LA","rateCard":""},{"id":411,"name":"Wei-Li Wang","category":"Production","email":"weili@hudsonhillproduction.com","phone":"","website":"","location":"Los Angeles, US","notes":"New York","rateCard":""},{"id":412,"name":"Louay Nasser","category":"Production","email":"","phone":"","website":"www.instagram.com/louay_nasser/?hl=en","location":"Los Angeles, US","notes":"Egypt","rateCard":""},{"id":413,"name":"Monique","category":"Production","email":"","phone":"","website":"","location":"Los Angeles, US","notes":"Egpyt","rateCard":""},{"id":414,"name":"Yazid","category":"Production","email":"Yazid@somnii.co.uk","phone":"","website":"","location":"Los Angeles, US","notes":"Marakesch Morroco","rateCard":""},{"id":415,"name":"FREELANCE Pas","category":"Production","email":"","phone":"","website":"","location":"Los Angeles, US","notes":"","rateCard":""},{"id":416,"name":"Rafael Aguilar","category":"Production","email":"rafaelaguilar.097@gmail.com","phone":"","website":"","location":"Los Angeles, US","notes":"New York","rateCard":""},{"id":417,"name":"Dan Coleman","category":"Production","email":"daniel.coleman723@gmail.com","phone":"","website":"","location":"Los Angeles, US","notes":"New York","rateCard":""},{"id":418,"name":"Roman Caesar","category":"Production","email":"r.caesar2288@gmail.com","phone":"","website":"","location":"Los Angeles, US","notes":"New York","rateCard":""},{"id":419,"name":"Shelton Lawrence","category":"Production","email":"sheltoncreator@gmail.com","phone":"","website":"","location":"Los Angeles, US","notes":"New York","rateCard":""}];
const initOutreach = []; // populated from DB on load
const savedCallSheets = {"Columbia / IMA — Ramadan Activation 2026":"SHOOT NAME: Columbia Ramadan Activation 2026"};
const savedRiskAssessments = {"Columbia / IMA — Ramadan Activation 2026":"SHOOT NAME: Columbia Ramadan Activation 2026"};
const initColumbiaEstimate = {
  version:"V1", date:"18/02/2026", client:"IMA", project:"COLUMBIA RAMADAN 2026 ACTIVATION",
  attention:"Freya Morris <freya.morris@ima.global>", photographer:"NATHAN EVANS / FRNDZ STUDIO",
  deliverables:"VIDEOS & STILLS", deadlines:"25TH FEB / MARCH 12",
  usageTerms:"12 months, global, digital, and social. Plus retail POS and OOH in Dubai.",
  agreedRounds:"2 ROUNDS OF FEEDBACK", shootDate:"21ST FEBRUARY / 7TH MARCH",
  shootDays:"2 SHOOT DAYS", shootHours:"BASED ON A 10 HOUR SHOOT DAY [3PM - 1AM]",
  shootLocation:"RAS AL KAIMAH", paymentTerms:"75% ADVANCE, 25% UPON COMPLETION (30 DAYS FROM INVOICE)",
  lineItems:[
    {cat:"1", name:"Photography Fees",       aed:25200},
    {cat:"2", name:"Photography Equipment",  aed:7500},
    {cat:"3", name:"Stills Post Production", aed:8000},
    {cat:"4", name:"Video Crew",             aed:51000},
    {cat:"5", name:"Video Equipment",        aed:13200},
    {cat:"6", name:"Video Post-Production",  aed:28000},
    {cat:"7", name:"Styling",                aed:0},
    {cat:"8", name:"Hair & Makeup",          aed:0},
    {cat:"9", name:"Talent",                 aed:0},
    {cat:"10",name:"Props & Set",            aed:0},
    {cat:"11",name:"Production",             aed:21000},
    {cat:"12",name:"Production Expenses",    aed:9000},
    {cat:"13",name:"Catering",               aed:5000},
    {cat:"14",name:"Vehicles",               aed:6000},
    {cat:"15",name:"Locations",              aed:0},
    {cat:"16",name:"Permits",                aed:0},
    {cat:"17",name:"Travel",                 aed:0},
    {cat:"18",name:"Production Fees",        aed:22607},
  ],
  notes:"SHOOT HOURS ARE BASED ON A 10 HOUR SHOOT DAY UNLESS OTHERWISE AGREED.\nEXCHANGE RATE CALCULATED AT 1 AED = 0.27 USD",
};

const TABS = [
  {id:"Dashboard", label:"DASHBOARD"},
  {id:"Agents",    label:"AGENTS"},
  {id:"Vendors",   label:"VENDORS"},
  {id:"Clients",   label:"CLIENTS"},
  {id:"Projects",  label:"PROJECTS"},
  {id:"Resources", label:"RESOURCES"},
  {id:"Notes",     label:"NOTES"},
];

const StarIcon = ({size=11,color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill={color} xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0,display:"block"}}>
    <path d="M6 0.5l1.39 2.82L10.5 3.8l-2.25 2.19.53 3.09L6 7.63l-2.78 1.45.53-3.09L1.5 3.8l3.11-.48L6 0.5z"/>
  </svg>
);

// ─── LOGAN EXTENSION BRIDGE ──────────────────────────────────────────────────
let _loganExtId = null;
if (typeof window !== "undefined") {
  window.addEventListener("message", e => {
    if (e.source === window && e.data?.type === "LOGAN_EXT_READY" && e.data.id) _loganExtId = e.data.id;
  });
  // Ping inject.js in case it already ran before this listener was registered
  window.postMessage({ type: "LOGAN_REQUEST_ID" }, window.location.origin);
}

// ─── AGENT CHARACTERS ────────────────────────────────────────────────────────
const _STAR = "M 43.5,18.1 Q 50.0,4.0 56.5,18.1 Q 62.9,32.2 78.3,34.0 Q 93.7,35.8 82.3,46.3 Q 70.9,56.8 74.0,72.0 Q 77.0,87.2 63.5,79.6 Q 50.0,72.0 36.5,79.6 Q 23.0,87.2 26.0,72.0 Q 29.1,56.8 17.7,46.3 Q 6.3,35.8 21.7,34.0 Q 37.1,32.2 43.5,18.1 Z";
const _YELLOW="#F5D13A",_PINK="#F2A7BC",_BLUE="#A8CCEA",_PURPLE="#C9B3E8",_GREEN="#A8D8B0";
function _DotEyes({y=42,spread=13,size=5,color="#1a1a1a"}){return<><circle cx={50-spread} cy={y} r={size} fill={color}/><circle cx={50+spread} cy={y} r={size} fill={color}/></>;}
function _SquintEyes({y=43,spread=13}){return<><path d={`M ${50-spread-6} ${y} Q ${50-spread} ${y-7} ${50-spread+6} ${y}`} stroke="#1a1a1a" strokeWidth="3.2" fill="none" strokeLinecap="round"/><path d={`M ${50+spread-6} ${y} Q ${50+spread} ${y-7} ${50+spread+6} ${y}`} stroke="#1a1a1a" strokeWidth="3.2" fill="none" strokeLinecap="round"/></>;}
function _OpenMouth({y=62}){return<><rect x="38" y={y} width="24" height="14" rx="7" fill="#1a1a1a"/><ellipse cx="50" cy={y+10} rx="9" ry="5" fill="#e8697a"/></>;}
function _VMouth({y=63}){return<path d={`M ${50-6} ${y} Q 50 ${y+7} ${50+6} ${y}`} stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/>;}
function _Cheeks({color="rgba(240,120,100,0.25)"}){return<><ellipse cx="34" cy="54" rx="6" ry="4" fill={color}/><ellipse cx="66" cy="54" rx="6" ry="4" fill={color}/></>;}
function _Logan({mood="idle",bob=0}){
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_YELLOW}/>
    {mood==="excited"?<><_Cheeks color="rgba(240,120,100,0.32)"/><_SquintEyes/><_OpenMouth y={61}/></>
    :mood==="thinking"?<><_DotEyes/><_VMouth y={64}/></>
    :mood==="talking"?<><_Cheeks color="rgba(240,120,100,0.22)"/><_DotEyes/><_OpenMouth y={62}/></>
    :<><_Cheeks color="rgba(240,120,100,0.22)"/><_DotEyes/><_VMouth y={63}/></>}
    <circle cx="84" cy="17" r="12" fill="rgba(210,238,255,0.75)" stroke="#1a1a1a" strokeWidth="2.2"/>
    <circle cx="84" cy="17" r="8" fill="rgba(230,247,255,0.9)"/>
    <line x1="92" y1="25" x2="100" y2="33" stroke="#1a1a1a" strokeWidth="2.8" strokeLinecap="round"/>
    <path d="M 77 42 Q 81 30 82 23" stroke={_YELLOW} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 77 42 Q 81 30 82 23" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>;
}
function _Rex({mood="idle",bob=0}){
  const frown=mood==="serious"||mood==="thinking";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_PINK}/>
    <_Cheeks color="rgba(240,120,140,0.25)"/>
    {mood==="talking"?<><_DotEyes y={46}/><_OpenMouth y={62}/></>
    :frown?<><_DotEyes y={46}/><path d="M 34 65 Q 50 57 66 65" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/></>
    :<><_DotEyes y={46}/><_VMouth y={64}/></>}
    <rect x="72" y="6" width="21" height="27" rx="3" fill="white" stroke="#1a1a1a" strokeWidth="2.2"/>
    <rect x="78" y="4" width="9" height="7" rx="3.5" fill="#1a1a1a"/>
    <line x1="75.5" y1="17" x2="90.5" y2="17" stroke="#c06070" strokeWidth="2"/>
    <line x1="75.5" y1="21" x2="90.5" y2="21" stroke="#aaa" strokeWidth="1.3"/>
    <line x1="75.5" y1="25" x2="86" y2="25" stroke="#aaa" strokeWidth="1.3"/>
    <line x1="75.5" y1="29" x2="90.5" y2="29" stroke="#aaa" strokeWidth="1.3"/>
    <path d="M 76 43 Q 80 29 81 20" stroke={_PINK} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 76 43 Q 80 29 81 20" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {mood==="thinking"&&<ellipse cx="17" cy="32" rx="4" ry="6" fill="rgba(140,200,255,0.65)"/>}
  </svg>;
}
function _Nova({mood="idle",bob=0}){
  const excited=mood==="excited";
  const mouth=excited?"M 42 62 Q 50 68 58 62":mood==="thinking"?"M 43 61 Q 50 57 57 61":"M 43 62 Q 50 67 57 62";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_BLUE}/>
    <_Cheeks color="rgba(100,150,220,0.22)"/>
    <circle cx="37" cy="43" r="10" fill="rgba(255,255,255,0.3)" stroke="#1a1a1a" strokeWidth="2.5"/>
    <circle cx="63" cy="43" r="10" fill="rgba(255,255,255,0.3)" stroke="#1a1a1a" strokeWidth="2.5"/>
    <line x1="47" y1="43" x2="53" y2="43" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round"/>
    <line x1="27" y1="41" x2="21" y2="39" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round"/>
    <line x1="73" y1="41" x2="79" y2="39" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round"/>
    {excited?<><path d="M 31 45 Q 37 40 43 45" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 57 45 Q 63 40 69 45" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><circle cx="37" cy="44" r="4" fill="#1a1a1a"/><circle cx="63" cy="44" r="4" fill="#1a1a1a"/></>}
    {mood==="talking"?<><rect x="38" y="62" width="24" height="14" rx="7" fill="#1a1a1a"/><ellipse cx="50" cy="72" rx="9" ry="5" fill="#e8697a"/></>:<path d={mouth} stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/>}
  </svg>;
}
function _Minnie({mood="idle",bob=0}){
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_PURPLE}/>
    <_Cheeks color="rgba(160,120,220,0.22)"/>
    {mood==="talking"?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :mood==="thinking"?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* calendar icon accessory */}
    <rect x="70" y="8" width="22" height="20" rx="3" fill="white" stroke="#1a1a1a" strokeWidth="2"/>
    <rect x="76" y="6" width="4" height="6" rx="2" fill="#1a1a1a"/>
    <rect x="84" y="6" width="4" height="6" rx="2" fill="#1a1a1a"/>
    <line x1="70" y1="16" x2="92" y2="16" stroke="#1a1a1a" strokeWidth="1.5"/>
    <circle cx="76" cy="22" r="1.5" fill={_PURPLE}/>
    <circle cx="81" cy="22" r="1.5" fill="#1a1a1a"/>
    <circle cx="86" cy="22" r="1.5" fill="#1a1a1a"/>
    <path d="M 72 44 Q 76 30 77 18" stroke={_PURPLE} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 72 44 Q 76 30 77 18" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>;
}
function _Billie({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_GREEN}/>
    <_Cheeks color="rgba(60,160,90,0.20)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Calculator accessory */}
    <rect x="71" y="5" width="22" height="27" rx="3.5" fill="white" stroke="#1a1a1a" strokeWidth="2.1"/>
    <rect x="73" y="8" width="18" height="7" rx="2" fill="#c8efd4"/>
    <text x="82" y="14.5" fontSize="5" fill="#2a7a3a" textAnchor="middle" fontWeight="700" fontFamily="monospace">AED</text>
    {/* Calc button grid */}
    {[[74,18],[79,18],[84,18],[89,18],[74,23],[79,23],[84,23],[89,23]].map(([x,y],i)=>(
      <rect key={i} x={x} y={y} width="3.5" height="3.5" rx="0.8" fill={i===3||i===7?"#3a9a5a":_GREEN} opacity="0.85"/>
    ))}
    <path d="M 73 46 Q 77 32 78 15" stroke={_GREEN} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 73 46 Q 77 32 78 15" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Coin stack */}
    <ellipse cx="19" cy="34" rx="7" ry="3" fill="#F5D13A" stroke="#1a1a1a" strokeWidth="1.5"/>
    <ellipse cx="19" cy="31" rx="7" ry="3" fill="#F5D13A" stroke="#1a1a1a" strokeWidth="1.5"/>
    <ellipse cx="19" cy="28" rx="7" ry="3" fill="#ffe066" stroke="#1a1a1a" strokeWidth="1.5"/>
  </svg>;
}
const AGENT_DEFS = [
  {id:"logistical",name:"Vendor Vinnie",title:"Contacts",emoji:"🔍",color:_YELLOW,border:"#d4aa20",accent:"#7a5800",bg:"#fffef5",textColor:"#3d2800",tagBg:"#fef3c0",Blob:_Logan,
   system:`You are Vendor Vinnie, a contact assistant built into the ONNA dashboard — a real production management system for ONNA, a film/TV production company in Dubai. You are directly connected to ONNA's live database. When you collect contact details, a save modal appears in the dashboard UI and the user saves the record straight to the database. Everything is real and connected.

You do two things:
1. Add vendors/suppliers — collect name, category, email, phone, location and a save form appears.
2. Log outreach — when the user mentions contacting someone, extract the details, auto-fill today's date, and a save form appears.

NEVER say you cannot save data, cannot connect to a database, or suggest using external tools like Airtable or Notion. You are already connected. Just collect the info and the system handles the rest.

Be warm, brief and direct.`,
   placeholder:`Create New Vendor`,
   intro:"Hey! I'm Vendor Vinnie. Let me create your database! ✏️"},
  {id:"compliance",name:"Call Sheet Connie",title:"Call Sheets",emoji:"📋",color:_PINK,border:"#c47090",accent:"#7a1a30",bg:"#fff5f7",textColor:"#3d0818",tagBg:"#fdd8e0",Blob:_Rex,
   system:`You are Call Sheet Connie, a production coordinator for ONNA, a film/TV production company in Dubai. Your job is to create detailed, professional call sheets for film and TV productions.

Given project details, produce a full call sheet including: production title, shoot date, location address and directions, general crew call time, department call times, cast list with character names and call times, locations (base camp, unit, holding), catering times, emergency contacts, nearest hospital, weather forecast note, and any special instructions.

Format clearly with sections. Be thorough, organised and precise.`,
   placeholder:"Give me your shoot details and I'll build the call sheet...",
   intro:"Hi! I'm Call Sheet Connie. Give me your shoot details and I'll put together a full call sheet. 📋"},
  {id:"researcher",name:"Risk Assessment Ronnie",title:"Risk Assessment",emoji:"🔬",color:_BLUE,border:"#6a9eca",accent:"#1a4a80",bg:"#f3f8ff",textColor:"#0a1f3d",tagBg:"#d8eaf8",Blob:_Nova,
   system:`You are Risk Assessment Ronnie, a serious safety and compliance officer for ONNA, a film/TV production company in Dubai. Cross-reference project details with UAE and international safety laws to draft Risk Assessments.

Be thorough and formal. Cover: location risks, equipment hazards, talent welfare, UAE permits (Media Regulatory Authority, Dubai Film Permit), weather, emergency protocols. Reference actual UAE laws and regulations. Structure output clearly with numbered sections and risk ratings.`,
   placeholder:"Describe your project and location for a risk assessment...",
   intro:"I'm Risk Assessment Ronnie. I do not take safety lightly. Describe your project and I will conduct a thorough risk assessment against UAE and international production safety regulations. 🔬"},
  {id:"minnie",name:"Meeting Minnie",title:"Scheduling",emoji:"📅",color:_PURPLE,border:"#a07cc0",accent:"#4a1a80",bg:"#faf5ff",textColor:"#2d0a50",tagBg:"#ede0f8",Blob:_Minnie,
   system:`You are Meeting Minnie, ONNA's scheduling assistant for a film/TV production company in Dubai. You help manage meeting requests from emails.

When given an email that looks like a meeting request, you:
1. Identify the key details: who is requesting, what they want to meet about, their proposed times if any
2. Check the calendar context provided to identify conflicts
3. Draft a warm, professional reply proposing three specific available time slots

Keep replies concise and professional. Sign off as the ONNA team. Always propose times in Dubai time (GST, UTC+4).`,
   placeholder:"Paste a meeting request email or say 'check emails for meeting requests'...",
   intro:"Hi! I'm Meeting Minnie. Paste a meeting request email and I'll check your calendar for conflicts and draft a reply with three available time slots. 📅"},
  {id:"billie",name:"Budget Billie",title:"Budgets",emoji:"💰",color:_GREEN,border:"#5aaa72",accent:"#1a5a30",bg:"#f3fbf5",textColor:"#0a2e14",tagBg:"#c8efd4",Blob:_Billie,
   system:`You are Budget Billie, ONNA's production budget assistant. ONNA is a film, TV and commercial production company based in Dubai and London. You build detailed, accurate line-item production budgets using current Dubai market rates. Always show dual currency columns (AED and USD, fixed rate 1 USD = 3.67 AED). Apply 15% Agency Fee and 10% Contingency by default. Be fast, confident and accurate.`,
   placeholder:"Describe your shoot and I'll build the budget...",
   intro:"Hey! I'm Budget Billie 💰 Tell me about your shoot — type, days, crew size, location — and I'll build a full line-item budget with AED/USD, markup and contingency. What are we shooting?"},
];
function levenshtein(a,b){
  a=a.toLowerCase().trim();b=b.toLowerCase().trim();
  if(!a.length)return b.length;if(!b.length)return a.length;
  const dp=Array.from({length:a.length+1},(_,i)=>[i,...Array(b.length).fill(0)]);
  for(let j=0;j<=b.length;j++)dp[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j-1],dp[i-1][j],dp[i][j-1]);
  return dp[a.length][b.length];
}
function findSimilar(name,allVendors,allLeads){
  if(!name)return null;
  const q=name.toLowerCase().trim();
  const thresh=Math.max(2,Math.floor(q.length*0.28));
  for(const v of(allVendors||[])){
    const vn=(v.name||"").toLowerCase().trim();if(!vn)continue;
    if(vn===q)return{record:v,type:"vendor",exact:true};
    if(levenshtein(q,vn)<=thresh)return{record:v,type:"vendor",exact:false};
  }
  for(const l of(allLeads||[])){
    const ln=(l.contact||l.company||"").toLowerCase().trim();if(!ln)continue;
    if(ln===q)return{record:l,type:"lead",exact:true};
    if(levenshtein(q,ln)<=thresh)return{record:l,type:"lead",exact:false};
  }
  return null;
}
function parseQuickEntry(text){
  if(text.length>300||text.includes("\n"))return null;
  const parts=text.split(",").map(s=>s.trim()).filter(Boolean);
  if(parts.length<3||parts.length>6)return null;
  const emailPart=parts.find(p=>/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(p));
  if(!emailPart)return null;
  const nonEmail=parts.filter(p=>p!==emailPart);
  const isVendor=/vendor|supplier|equipment|studio|hire|rental|crew|freelancer|photographer|videographer|stylist|catering|set design|casting|hair and makeup/i.test(text);
  const locPart=nonEmail.find(p=>/dubai|london|uae|uk|abu dhabi/i.test(p));
  const loc=locPart?locPart.replace(/\b(vendor|supplier|client|customer)\b/gi,"").replace(/[,\s]+$/,"").trim():"Dubai, UAE";
  if(isVendor){
    return{_type:"vendor",name:nonEmail[0]||"",category:nonEmail[1]||"",email:emailPart,phone:"",website:"",location:loc||"Dubai, UAE",notes:"",rateCard:""};
  }else{
    return{_type:"lead",contact:nonEmail[0]||"",role:nonEmail[1]||"",company:nonEmail[2]||"",email:emailPart,phone:"",value:"",category:"Other",location:loc||"Dubai, UAE",date:new Date().toISOString().split("T")[0],status:"not_contacted",notes:""};
  }
}
function detectFieldKey(value){
  if(/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(value))return"email";
  if(/^\+?[\d\s\-().]{7,}$/.test(value))return"phone";
  if(/^(https?:\/\/)?[\w-]+(\.[\w-]+)+/.test(value)&&!value.includes("@"))return"website";
  return"notes";
}
function findVendorOrLead(name,allVendors,allLeads){
  const q=name.toLowerCase().trim();
  const vendor=(allVendors||[]).find(v=>v.name?.toLowerCase().includes(q)||q.includes(v.name?.toLowerCase()?.trim()||"__"));
  if(vendor)return{record:vendor,type:"vendor"};
  const lead=(allLeads||[]).find(l=>(l.contact?.toLowerCase().includes(q)||q.includes(l.contact?.toLowerCase()?.trim()||"__"))||(l.company?.toLowerCase().includes(q)||q.includes(l.company?.toLowerCase()?.trim()||"__")));
  if(lead)return{record:lead,type:"lead"};
  return null;
}
function _AgentDots({color}){
  return<div style={{display:"flex",gap:5,padding:"10px 14px",alignItems:"center"}}>
    {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:color,animation:`bop 1s ease-in-out ${i*0.18}s infinite`}}/>)}
  </div>;
}
function _AgentBubble({msg}){
  const isAgent=msg.role==="assistant";
  return<div style={{display:"flex",justifyContent:isAgent?"flex-start":"flex-end",marginBottom:10}}>
    <div style={{maxWidth:"82%",padding:"10px 14px",borderRadius:isAgent?"6px 16px 16px 16px":"16px 6px 16px 16px",background:isAgent?"#f5f5f7":"#1d1d1f",color:isAgent?"#1d1d1f":"#fff",fontSize:13.5,lineHeight:1.6,border:isAgent?"1px solid #e5e5ea":"none",whiteSpace:"pre-wrap",fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",userSelect:"text",WebkitUserSelect:"text",cursor:"text"}}>
      {msg.content}
    </div>
  </div>;
}
function AgentCard({agent,active,onSelect,onClose,allVendors,allLeads,onUpdateVendor,onUpdateLead,gcalToken,gcalEvents}){
  const {Blob,name,title,emoji,system,placeholder,intro}=agent;
  const [msgs,setMsgs]         =useState(()=>{try{const s=localStorage.getItem('onna_agent_chat_'+agent.id);if(s){const p=JSON.parse(s);if(p[0]&&p[0].role==="assistant"&&p[0].content!==intro)p[0]={role:"assistant",content:intro};return p;}return[{role:"assistant",content:intro}];}catch{return[{role:"assistant",content:intro}];}});
  const [input,_setInput]       =useState("");
  const _inputRef=useRef("");
  const setInput=(v)=>{_inputRef.current=v;_setInput(v);};
  const [loading,setLoading]   =useState(false);
  const [mood,setMood]         =useState("idle");
  const [bob,setBob]           =useState(0);
  const [pendingConv,setPendingConv]=useState(null);
  const [pendingLead,setPending]   =useState(null);
  const [pendingType,setPendingType]=useState("lead");
  const [pendingId,setPendingId]   =useState(null);
  const [saveAsOutreach,setSaveAsOutreach]=useState(false);
  const [leadEdit,setLeadEdit]     =useState({});
  const [savingLead,setSaving]     =useState(false);
  const [pendingDuplicate,setPendingDuplicate]=useState(null);
  const chatRef=useRef(null);
  const rafRef=useRef(null);
  const t0=useRef(null);
  useEffect(()=>{
    const speed=agent.id==="compliance"?1.1:agent.id==="researcher"?1.9:agent.id==="minnie"?1.6:1.5;
    const amp=agent.id==="compliance"?3:agent.id==="minnie"?4:5;
    const fn=ts=>{if(!t0.current)t0.current=ts;setBob(Math.sin(((ts-t0.current)/1000)*speed)*amp);rafRef.current=requestAnimationFrame(fn);};
    rafRef.current=requestAnimationFrame(fn);
    return()=>cancelAnimationFrame(rafRef.current);
  },[agent.id]);
  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[msgs,loading]);
  useEffect(()=>{try{localStorage.setItem('onna_agent_chat_'+agent.id,JSON.stringify(msgs));}catch{}},[msgs,agent.id]);

  const searchViaExt=(query)=>new Promise(resolve=>{
    if(!_loganExtId)return resolve({ok:false,error:"Extension not detected — reload the dashboard after installing the Logan extension, and make sure Outlook is open in another tab."});
    if(!window.chrome?.runtime?.sendMessage)return resolve({ok:false,error:"Not running in Chrome with the extension installed."});
    const timer=setTimeout(()=>resolve({ok:false,error:"Search timed out — Outlook may still be loading."}),20000);
    try{window.chrome.runtime.sendMessage(_loganExtId,{type:"FIND_CONTACT",query},res=>{clearTimeout(timer);if(window.chrome.runtime.lastError)resolve({ok:false,error:window.chrome.runtime.lastError.message});else resolve(res||{ok:false,error:"No response"});});}
    catch(e){clearTimeout(timer);resolve({ok:false,error:e.message});}
  });

  const _LEAD_CATS=["Production Companies","Creative Agencies","Beauty & Fragrance","Jewellery & Watches","Fashion","Editorial","Sports","Hospitality","Market Research","Commercial"];
  const _VENDOR_CATS=["Locations","Hair and Makeup","Stylists","Casting","Catering","Set Design","Equipment","Crew","Production"];
  const _SOURCES=["Direct","Referral","LinkedIn","Website","Cold Outreach","Event","Other"];
  const showEntry=(entry,type,id=null,asOutreach=false)=>{setPendingType(type);setPendingId(id);setLeadEdit(entry);setPending(entry);setSaveAsOutreach(asOutreach);};
  const buildQuestions=(entry,type)=>{
    const qs=[];
    if(type==="vendor"){
      if(!entry.email)qs.push({key:"email",q:"Email address?"});
      if(!entry.phone)qs.push({key:"phone",q:"Phone number?"});
      if(!entry.category||!_VENDOR_CATS.includes(entry.category))qs.push({key:"category",q:"Category?",options:_VENDOR_CATS,addNew:true});
      if(!entry.website)qs.push({key:"website",q:"Website?"});
      if(!entry.rateCard)qs.push({key:"rateCard",q:"Any rate card info?"});
      qs.push({key:"location",q:"Location?",options:["Dubai, UAE","London, UK","New York, US","Los Angeles, US"],addNew:true});
      qs.push({key:"notes",q:"Any notes?"});
    }else{
      if(!entry.role)qs.push({key:"role",q:"Their role or title?"});
      if(!entry.email)qs.push({key:"email",q:"Email address?"});
      if(!entry.phone)qs.push({key:"phone",q:"Phone number?"});
      if(!entry.category||!_LEAD_CATS.includes(entry.category))qs.push({key:"category",q:"Category?",options:_LEAD_CATS,addNew:true});
      if(!entry.value||Number(entry.value)===0)qs.push({key:"value",q:"Estimated deal value? (AED)"});
      if(!entry.status||entry.status==="not_contacted")qs.push({key:"status",q:"Lead status — cold, warm, or open?"});
      qs.push({key:"location",q:"Location?",options:["Dubai, UAE","London, UK","New York, US","Los Angeles, US"],addNew:true});
      qs.push({key:"source",q:"How did you find them? Direct · Referral · LinkedIn · Website · Cold Outreach · Event · Other"});
      qs.push({key:"notes",q:"Any notes?"});
    }
    return qs;
  };
  const startConv=(entry,type,asOutreach=false,updateId=null)=>{
    const qs=buildQuestions(entry,type);
    if(qs.length===0){showEntry(entry,type,updateId,asOutreach);return null;}
    setPendingConv({entry,type,saveAsOutreach:asOutreach,updateId,questions:qs,idx:0});
    return qs[0].q;
  };
  const saveLead=async()=>{
    setSaving(true);
    try{
      if(pendingType==="vendor"){
        const fields={name:leadEdit.name||"",category:leadEdit.category||"",email:leadEdit.email||"",phone:leadEdit.phone||"",website:leadEdit.website||"",location:leadEdit.location||"Dubai, UAE",notes:leadEdit.notes||"",rateCard:leadEdit.rateCard||""};
        if(pendingId){await api.put(`/api/vendors/${pendingId}`,fields);onUpdateVendor?.(pendingId,fields);setMsgs(p=>[...p,{role:"assistant",content:`✓ ${leadEdit.name||"Vendor"} updated.`}]);}
        else{const saved=await api.post("/api/vendors",fields);if(saved?.id||saved?.name)setMsgs(p=>[...p,{role:"assistant",content:`✓ ${leadEdit.name||"Vendor"} saved to Vendors.`}]);else{setMsgs(p=>[...p,{role:"assistant",content:`⚠️ ${saved?.error||"Save failed"}`}]);setSaving(false);return;}}
      }else{
        const fields={company:leadEdit.company||"",contact:leadEdit.contact||"",email:leadEdit.email||"",phone:leadEdit.phone||"",role:leadEdit.role||"",value:Number(leadEdit.value)||0,category:leadEdit.category||"",location:leadEdit.location||"Dubai, UAE",notes:leadEdit.notes||"",source:leadEdit.source||"Direct",date:leadEdit.date||new Date().toISOString().split("T")[0],status:leadEdit.status||"cold"};
        if(pendingId){await api.put(`/api/leads/${pendingId}`,fields);onUpdateLead?.(pendingId,fields);setMsgs(p=>[...p,{role:"assistant",content:`✓ ${leadEdit.contact||"Lead"} updated.`}]);}
        else{
          const saved=await api.post("/api/leads",fields);
          if(!saved?.id&&!saved?.company){setMsgs(p=>[...p,{role:"assistant",content:`⚠️ ${saved?.error||"Save failed"}`}]);setSaving(false);return;}
          let msg=`✓ ${leadEdit.contact||leadEdit.company||"Lead"} saved to pipeline!`;
          if(saveAsOutreach){
            const os=(!leadEdit.status||leadEdit.status==="not_contacted")?"cold":leadEdit.status;
            const oF={clientName:leadEdit.contact||"",company:leadEdit.company||"",role:leadEdit.role||"",email:leadEdit.email||"",phone:leadEdit.phone||"",category:leadEdit.category||"",date:leadEdit.date||new Date().toISOString().split("T")[0],notes:leadEdit.notes||"",status:os,value:Number(leadEdit.value)||0,location:leadEdit.location||"Dubai, UAE",source:leadEdit.source||"Direct"};
            try{await api.post("/api/outreach",oF);msg+="\nAlso logged to Outreach Tracker ✓";}catch(e){msg+=`\n(Outreach save failed: ${e.message})`;}
          }
          setMsgs(p=>[...p,{role:"assistant",content:msg}]);
        }
      }
    }catch(e){setMsgs(p=>[...p,{role:"assistant",content:`⚠️ Save failed: ${e.message}`}]);}
    setSaving(false);setPending(null);
  };
  const lf=(label,key,wide=false,opts=null,inputType="text")=>(
    <div key={key} style={{gridColumn:wide?"1/-1":"auto",display:"flex",flexDirection:"column",gap:4}}>
      <label style={{fontSize:10.5,fontWeight:600,color:"#6e6e73",textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</label>
      {opts?(
        <select value={leadEdit[key]||""} onChange={e=>setLeadEdit(p=>({...p,[key]:e.target.value}))} style={{padding:"7px 10px",borderRadius:8,border:"1px solid #e5e5ea",fontSize:13,fontFamily:"inherit",color:"#1d1d1f",background:"#f5f5f7",outline:"none"}}>
          <option value="">—</option>
          {opts.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ):wide?(
        <textarea value={leadEdit[key]||""} onChange={e=>setLeadEdit(p=>({...p,[key]:e.target.value}))} rows={2} style={{padding:"7px 10px",borderRadius:8,border:"1px solid #e5e5ea",fontSize:13,fontFamily:"inherit",color:"#1d1d1f",background:"#f5f5f7",outline:"none",resize:"vertical"}}/>
      ):(
        <input type={inputType} value={leadEdit[key]||""} onChange={e=>setLeadEdit(p=>({...p,[key]:e.target.value}))} style={{padding:"7px 10px",borderRadius:8,border:"1px solid #e5e5ea",fontSize:13,fontFamily:"inherit",color:"#1d1d1f",background:"#f5f5f7",outline:"none"}}/>
      )}
    </div>
  );

  const send=async()=>{
    if(!_inputRef.current.trim()||loading)return;
    const input=_inputRef.current;
    // ── Clear chat intent ─────────────────────────────────────────────────────
    if(/^(clear( chat)?|reset( chat)?|wipe( chat)?)$/i.test(input.trim())){
      const fresh=[{role:"assistant",content:intro}];
      setMsgs(fresh);setInput("");setPendingConv(null);setPending(null);setPendingDuplicate(null);
      try{localStorage.setItem('onna_agent_chat_'+agent.id,JSON.stringify(fresh));}catch{}
      return;
    }
    const userMsg={role:"user",content:input.trim()};
    const history=[...msgs,userMsg];

    // ── Pending conversational Q&A → popup at end ─────────────────────────────
    if(pendingConv){
      setMsgs(history);setInput("");
      const isSkip=/^(x|skip|n\/a|none|-|pass|don'?t have(?: that)?|i don'?t|not sure|leave(?: it)? blank|unsure|nothing|blank)$/i.test(input.trim());
      const conv=pendingConv;
      const q=conv.questions[conv.idx];
      let e={...conv.entry};

      // ── Handle pending "add new category?" confirmation ──
      if(conv._awaitingNewCat){
        const isYes=/^(yes|yep|yeah|y|sure|ok|create|add)\b/i.test(input.trim());
        const isNo=/^(no|nope|nah|n|cancel)\b/i.test(input.trim());
        if(isYes){
          // keep the custom category as-is, advance to next question
          const next=conv.idx+1;
          if(next>=conv.questions.length){
            setPendingConv(null);
            showEntry(e,conv.type,conv.updateId,conv.saveAsOutreach);
            setMsgs([...history,{role:"assistant",content:"All filled in! Review everything below and hit Save ✓"}]);
          }else{
            setPendingConv({...conv,_awaitingNewCat:false,entry:e,idx:next});
            setMsgs([...history,{role:"assistant",content:conv.questions[next].q+" (or 'x' to skip)"}]);
          }
        }else if(isNo){
          // re-ask the category question
          setPendingConv({...conv,_awaitingNewCat:false,entry:{...e,category:""}});
          setMsgs([...history,{role:"assistant",content:q.q+" (or 'x' to skip)"}]);
        }else{
          setMsgs([...history,{role:"assistant",content:"Add new category? Reply yes or no."}]);
        }
        return;
      }

      if(q){
        if(isSkip){
          if(q.key==="location"&&!e.location)e.location="Dubai, UAE";
        }else{
          if(q.key==="status"){
            if(/cold/i.test(input))e.status="cold";
            else if(/warm/i.test(input))e.status="warm";
            else if(/open/i.test(input))e.status="open";
          }else if(q.key==="value"){
            e.value=Number(input.replace(/[^0-9.]/g,""))||0;
          }else if(q.key==="category"){
            const validCats=conv.type==="vendor"?_VENDOR_CATS:_LEAD_CATS;
            const inp=input.trim().toLowerCase();
            const match=validCats.find(c=>c.toLowerCase()===inp)||validCats.find(c=>c.toLowerCase().startsWith(inp)||inp.startsWith(c.toLowerCase().split(" ")[0]))||validCats.find(c=>c.toLowerCase().includes(inp)||inp.includes(c.toLowerCase().replace(/ & /," ").split(" ")[0]));
            if(match){
              e.category=match;
            }else{
              e.category=input.trim();
              setPendingConv({...conv,entry:e,_awaitingNewCat:true});
              setMsgs([...history,{role:"assistant",content:`"${input.trim()}" isn't a recognised category. Add it as a new category?`}]);
              return;
            }
          }else{e[q.key]=input.trim();}
        }
      }
      const next=conv.idx+1;
      if(next>=conv.questions.length){
        setPendingConv(null);
        showEntry(e,conv.type,conv.updateId,conv.saveAsOutreach);
        setMsgs([...history,{role:"assistant",content:"All filled in! Review everything below and hit Save ✓"}]);
      }else{
        setPendingConv({...conv,entry:e,idx:next});
        setMsgs([...history,{role:"assistant",content:conv.questions[next].q+" (or 'x' to skip)"}]);
      }
      return;
    }

    // ── Meeting Minnie: check emails + calendar ───────────────────────────────
    if(agent.id==="minnie"&&/check.*email|meeting request|scan.*inbox|find.*meeting|check.*inbox/i.test(input.trim())){
      setMsgs(history);setInput("");setLoading(true);setMood("thinking");
      const extResult=await searchViaExt("meeting request");
      let emailContext="";
      if(extResult.ok&&extResult.lead){
        emailContext=`\n\nEMAIL FOUND IN OUTLOOK:\n${JSON.stringify(extResult.lead,null,2)}`;
      }else{
        emailContext=`\n\nNo meeting request emails found via Outlook search. (${extResult.error||"No results"})`;
      }
      let calContext="";
      if(gcalToken&&gcalEvents&&gcalEvents.length){
        const now=new Date();
        const twoWeeks=new Date(now.getTime()+14*24*60*60*1000);
        const upcoming=(gcalEvents||[]).filter(ev=>{const s=ev.start?.dateTime||ev.start?.date;return s&&new Date(s)>=now&&new Date(s)<=twoWeeks;}).slice(0,30);
        calContext=`\n\nCALENDAR (next 14 days):\n${upcoming.map(ev=>`- ${ev.summary}: ${ev.start?.dateTime||ev.start?.date}${ev.end?.dateTime?` → ${ev.end.dateTime}`:""}`).join("\n")||"No events found"}`;
      }else{
        calContext="\n\nGoogle Calendar not connected. Suggest available slots based on typical business hours (9am–6pm GST, Mon–Fri).";
      }
      const contextMsg=`Check my emails for meeting requests and draft a reply.${emailContext}${calContext}`;
      try{
        const sysMsg=system+"\n\nToday's date: "+new Date().toLocaleDateString("en-GB",{weekday:"long",year:"numeric",month:"long",day:"numeric"})+" (Dubai time, GST UTC+4).";
        const proxyRes=await fetch("/api/agents/logistical",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[...history.slice(1),{role:"user",content:contextMsg}],system:sysMsg})});
        if(!proxyRes.ok){setMsgs([...history,{role:"assistant",content:"Couldn't reach the AI. Check your connection."}]);setLoading(false);setMood("idle");return;}
        const reader=proxyRes.body.getReader();const decoder=new TextDecoder();let reply="";
        setMsgs([...history,{role:"assistant",content:""}]);
        while(true){
          const{done,value}=await reader.read();if(done)break;
          const chunk=decoder.decode(value,{stream:true});
          const lines=chunk.split("\n");
          for(const line of lines){
            if(!line.startsWith("data:"))continue;
            const d=line.slice(5).trim();if(d==="[DONE]")continue;
            try{const j=JSON.parse(d);const t=j.delta?.text||j.content?.[0]?.text||"";if(t){reply+=t;setMsgs(prev=>{const n=[...prev];n[n.length-1]={role:"assistant",content:reply};return n;});}}catch{}
          }
        }
        setLoading(false);setMood("idle");
      }catch(e){setMsgs([...history,{role:"assistant",content:"Something went wrong: "+e.message}]);setLoading(false);setMood("idle");}
      return;
    }

    // ── Vinnie: add vendor/supplier ─────────────────────────────────────────
    const _isVendorIntent=agent.id==="logistical"&&/\b(vendor|supplier|add\s+(?:new\s+)?(?:vendor|supplier)|new\s+vendor|new\s+supplier|create\s+vendor|save\s+vendor)\b/i.test(input.trim())&&!/outreach|tracker|pipeline/i.test(input.trim());
    if(_isVendorIntent){
      setMsgs(history);setInput("");setLoading(true);setMood("thinking");
      try{
        const sys=`You are an expert at parsing natural language vendor/supplier descriptions into structured data. Extract ALL info you can infer and return ONLY a raw JSON object (no markdown, no array).

Rules:
- Names: anything that looks like a person/company name → "name"
- Emails: anything with @ → "email". Infer name from domain if no name given
- Phone numbers: digits with +/spaces/dashes → "phone"
- Website: domain only (no https://)
- Category: fuzzy match to closest from: Locations, Hair and Makeup, Stylists, Casting, Catering, Set Design, Equipment, Crew, Production. E.g. "photographer" → "Crew", "MUA" → "Hair and Makeup", "location scout" → "Locations"
- Location: any city/country mentioned, default "Dubai, UAE"

Fields: {"name":"","category":"","email":"","phone":"","website":"","location":"City, Country","notes":"","rateCard":""}.`;
        const data=await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:600,system:sys,messages:[{role:"user",content:input.trim()}]});
        const parsed=JSON.parse((data?.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());
        const entry={...parsed,_type:"vendor",location:parsed.location||"Dubai, UAE"};
        const vname=entry.name||"this vendor";
        const sim=findSimilar(vname,allVendors,allLeads);
        if(sim&&!sim.exact){
          const existName=sim.type==="vendor"?sim.record.name:(sim.record.contact||sim.record.company);
          setPendingDuplicate({entry,similar:sim,saveAsOutreach:false});
          setMsgs([...history,{role:"assistant",content:`Got it — ${vname}. I found a similar existing ${sim.type}: "${existName}". Did you mean them?\n\nReply yes or no.`}]);
        }else if(sim?.exact){
          const merged={...sim.record,...entry};
          const fq=startConv(merged,"vendor",false,sim.record.id);
          setMsgs([...history,{role:"assistant",content:fq?`${vname} exists — merging. ${fq} (or 'x' to skip)`:`${vname} exists — merging. Review below.`}]);
        }else{
          const firstQ=startConv(entry,"vendor",false,null);
          if(firstQ){
            setMsgs([...history,{role:"assistant",content:`Got it — ${vname} pulled. Let me fill in the gaps. ('x' to skip)\n\n${firstQ}`}]);
          }else{
            showEntry(entry,"vendor",null,false);
            setMsgs([...history,{role:"assistant",content:`Got it — review details for ${vname} below and hit Save.`}]);
          }
        }
      }catch(e){
        setMsgs([...history,{role:"assistant",content:"Hmm, I had trouble parsing that. Try: 'New vendor [Name], [Category], [email]'"}]);
      }
      setLoading(false);setMood("idle");
      return;
    }

    // ── Vinnie: add to outreach tracker / lead ───────────────────────────────
    if(agent.id==="logistical"&&!/\b(vendor|supplier)\b/i.test(input.trim())&&/outreach|pipeline|tracker|add.*lead|add.*contact|log.*contact|new.*lead|(just|today|yesterday|this morning|this week).{0,20}(contact|spoke|met|call|email|speak|reach)|(contact|spoke|met|called|emailed|reached).{0,30}(today|yesterday|them|him|her)|i.{0,15}(contacted|spoke|met|called|emailed)|just.{0,20}(contact|spoke|met|call|email)/i.test(input.trim())){
      setMsgs(history);setInput("");setLoading(true);setMood("thinking");
      const today=new Date().toISOString().slice(0,10);
      try{
        const sys=`You are an expert at parsing natural language contact descriptions into structured data. Extract ALL info you can infer and return ONLY a raw JSON object (no markdown, no array).

Rules:
- Names: anything that looks like a person's name → "contact"
- Emails: anything with @ → "email". Infer company from domain (e.g. emily@mrporter.com → company:"Mr Porter")
- Phone numbers: digits with +/spaces/dashes → "phone"
- Category: fuzzy match to the closest from this list: Production Companies, Creative Agencies, Beauty & Fragrance, Jewellery & Watches, Fashion, Editorial, Sports, Hospitality, Market Research, Commercial. E.g. "Production Company" → "Production Companies", "Beauty" → "Beauty & Fragrance", "Fashion brand" → "Fashion"
- Location: any city/country mentioned → "location", default "Dubai, UAE"
- Date: use today (${today}) unless explicitly stated
- Status: default "not_contacted" unless user says warm/open/cold

Fields: {"company":"","contact":"","role":"","email":"","phone":"","value":"","date":"YYYY-MM-DD","category":"","location":"Dubai, UAE","source":"Direct","notes":"","status":"not_contacted"}.`;
        const data=await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:600,system:sys,messages:[{role:"user",content:input.trim()}]});
        const parsed=JSON.parse((data?.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());
        const entry={...parsed,_type:"lead",date:parsed.date||today,status:parsed.status||"not_contacted"};
        const isOutreach=/outreach|tracker/i.test(input.trim());
        const name=entry.contact||entry.company||"this contact";
        const firstQ=startConv(entry,"lead",isOutreach,null);
        if(firstQ){
          setMsgs([...history,{role:"assistant",content:`Got it — ${name} pulled. Let me fill in the gaps. ('x' to skip)\n\n${firstQ}`}]);
        }else{
          showEntry(entry,"lead",null,isOutreach);
          setMsgs([...history,{role:"assistant",content:`Got it — review details for ${name} below and hit Save.`}]);
        }
      }catch(e){
        setMsgs([...history,{role:"assistant",content:"Hmm, I had trouble parsing that. Try: 'I contacted [Name] at [Company], [email], [category].'"}]);
      }
      setLoading(false);setMood("idle");
      return;
    }

    // ── Pending duplicate confirmation ────────────────────────────────────────
    if(pendingDuplicate&&agent.id==="logistical"){
      const {entry,similar,saveAsOutreach:dupSaveAsOutreach}=pendingDuplicate;
      const isYes=/^(yes|yep|yeah|sure|correct|right|that'?s? ?(them|him|her|it)?|update|them)\b/i.test(input.trim());
      const isNo=/^(no|nope|new|different|create|separate)\b/i.test(input.trim());
      setMsgs(history);setInput("");
      if(isYes){
        const existName=similar.type==="vendor"?similar.record.name:(similar.record.contact||similar.record.company);
        const merged={...similar.record,...entry};
        setPendingDuplicate(null);
        const fq1=startConv(merged,similar.type,dupSaveAsOutreach||false,similar.record.id);
        setMsgs([...history,{role:"assistant",content:fq1?`Updating ${existName}. ${fq1} (or 'x' to skip)`:`Updating ${existName} — review below.`}]);
      }else if(isNo){
        const qname=entry._type==="vendor"?entry.name:entry.contact;
        setPendingDuplicate(null);
        const fq2=startConv(entry,entry._type,dupSaveAsOutreach||false,null);
        setMsgs([...history,{role:"assistant",content:fq2?`New entry for ${qname||"this contact"}.\n\n${fq2} (or 'x' to skip)`:`New entry for ${qname||"this contact"} — review below.`}]);
      }else{
        const existName=similar.type==="vendor"?similar.record.name:(similar.record.contact||similar.record.company);
        setMsgs([...history,{role:"assistant",content:`Just to confirm — did you mean the existing entry "${existName}"? Reply yes or no.`}]);
      }
      setMood("idle");return;
    }

    // ── Intent detection (Vinnie only) ────────────────────────────────────────
    let findQuery=null;
    if(agent.id==="logistical"){
      const m=input.match(/\b(?:find|search|look\s+up|get|fetch)\s+(?:me\s+)?(?:the\s+)?(?:contact\s+(?:details?\s+)?(?:for|of)\s+)?([A-Za-z][A-Za-z\s]{1,35})(?:'s\b|\s+(?:contact|details|info|email|number|lead|and)|[.!?]?\s*$)/i);
      if(m?.[1]){findQuery=m[1].trim().replace(/\s+(contact|details|info|email|number|lead|please|and\s+save).*$/i,"").trim();if(findQuery.split(" ").length>4||/^(a|the|an|my|this)$/i.test(findQuery))findQuery=null;}
    }
    const quickEntry=(!findQuery&&agent.id==="logistical")?parseQuickEntry(input.trim()):null;
    setMsgs(history);setInput("");setLoading(true);setMood("thinking");

    if(findQuery){
      setMsgs([...history,{role:"assistant",content:`Searching your emails for "${findQuery}"…`}]);
      const result=await searchViaExt(findQuery);
      if(result.ok&&result.lead){
        const l=result.lead;
        const sim=findSimilar(l.contact||l.company||"",allVendors,allLeads);
        if(sim&&!sim.exact){
          const existName=sim.type==="vendor"?sim.record.name:(sim.record.contact||sim.record.company);
          setPendingDuplicate({entry:{...l,_type:"lead"},similar:sim,saveAsOutreach:false});
          setMsgs([...history,{role:"assistant",content:`Found info for ${l.contact||findQuery}. I also noticed a similar existing ${sim.type}: "${existName}". Did you mean them?\n\nReply yes or no.`}]);
        }else{
          const foundEntry={...l,_type:"lead"};
          const fqf=startConv(foundEntry,"lead",false,null);
          setMsgs([...history,{role:"assistant",content:`Found ${l.contact||findQuery}!\n📧 ${l.email||"—"}  📱 ${l.phone||"—"}\n🏢 ${l.company||"—"}  💼 ${l.role||"—"}${fqf?"\n\n"+fqf+" (or 'x' to skip)":"\n\nReview and save below."}`}]);
        }
      }else{
        setMsgs([...history,{role:"assistant",content:`Couldn't find "${findQuery}" automatically.\n\n${result.error||""}\n\nTip: make sure Outlook is open in another tab and the extension is installed.`}]);
      }
      setLoading(false);setMood("idle");return;
    }

    if(quickEntry){
      const qname=quickEntry._type==="vendor"?quickEntry.name:quickEntry.contact;
      const sim=findSimilar(qname,allVendors,allLeads);
      if(sim&&!sim.exact){
        const existName=sim.type==="vendor"?sim.record.name:(sim.record.contact||sim.record.company);
        setPendingDuplicate({entry:quickEntry,similar:sim,saveAsOutreach:false});
        setMsgs([...history,{role:"assistant",content:`Heads up — I found a similar existing ${sim.type}: "${existName}". Did you mean them, or is this a new contact?\n\nReply yes or no.`}]);
      }else if(sim?.exact){
        const merged={...sim.record,...quickEntry};
        const fqe=startConv(merged,sim.type,false,sim.record.id);
        setMsgs([...history,{role:"assistant",content:fqe?`${qname} exists — merging.\n\n${fqe} (or 'x' to skip)`:`${qname} exists — merging. Review below.`}]);
      }else{
        const fqn=startConv(quickEntry,quickEntry._type,false,null);
        setMsgs([...history,{role:"assistant",content:fqn?`Got it!\n\n${fqn} (or 'x' to skip)`:`Got it. Review and save below.`}]);
      }
      setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return;
    }

    // "add [value/descriptor] to [name]" — or "add this [field] to [name] [value]"
    if(agent.id==="logistical"){
      const addM=input.match(/^add\s+(.+?)\s+to\s+([A-Za-z].+?)\.?\s*$/i);
      if(addM){
        const [,rawField,rawNameAndMaybeVal]=addM;
        // Case 1: field value comes first — "add +971xxx to Abeer Ghani"
        const directKey=detectFieldKey(rawField.trim());
        // Case 2: value trails after name — "add this number to Abeer Ghani +971xxx"
        const phoneAtEnd=rawNameAndMaybeVal.match(/([\+]?\d[\d\s\-().]{5,})\s*$/);
        const emailAtEnd=rawNameAndMaybeVal.match(/([\w.+-]+@[\w.-]+\.[a-z]{2,})\s*$/i);
        const urlAtEnd=rawNameAndMaybeVal.match(/((?:https?:\/\/)?[\w-]+(\.[\w.-]+)+\/?\S*)\s*$/i);
        const trailingVal=(emailAtEnd?.[1]||phoneAtEnd?.[1]||urlAtEnd?.[1]||"").trim();
        let fieldValue=null,targetNameStr=null;
        if(directKey!=="notes"){
          fieldValue=rawField.trim();
          targetNameStr=rawNameAndMaybeVal.trim().replace(/\b(vendor|lead|contact|supplier)\b\s*/gi,"").trim();
        }else if(trailingVal){
          fieldValue=trailingVal;
          targetNameStr=rawNameAndMaybeVal.replace(trailingVal,"").trim().replace(/\b(vendor|lead|contact|supplier)\b\s*/gi,"").trim();
        }
        if(fieldValue&&targetNameStr){
          const found=findVendorOrLead(targetNameStr,allVendors,allLeads);
          if(found){
            const {record,type}=found;
            const fieldKey=detectFieldKey(fieldValue);
            const displayName=type==="vendor"?record.name:(record.contact||record.company);
            try{
              const updated={...record,[fieldKey]:fieldValue};
              const {id,...fields}=updated;
              if(type==="vendor"){await api.put(`/api/vendors/${id}`,fields);onUpdateVendor?.(id,{...fields});}
              else{await api.put(`/api/leads/${id}`,{...fields,value:Number(fields.value)||0});onUpdateLead?.(id,{...fields});}
              setMsgs([...history,{role:"assistant",content:`✓ ${displayName}'s ${fieldKey} updated to ${fieldValue}.`}]);
            }catch(e){setMsgs([...history,{role:"assistant",content:`⚠️ Save failed: ${e.message}`}]);}
            setLoading(false);setMood("idle");return;
          }else{
            setMsgs([...history,{role:"assistant",content:`I couldn't find "${targetNameStr}" in your vendors or leads.`}]);
            setLoading(false);setMood("idle");return;
          }
        }
      }
    }

    // Email paste — non-streaming extraction
    // Default to "lead" unless message explicitly says vendor/supplier
    if(agent.id==="logistical"&&/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(input)){
      const isVendorMsg=/\b(vendor|supplier|equipment|studio|hire|rental|crew|freelancer|photographer|videographer)\b/i.test(input);
      const today=new Date().toISOString().slice(0,10);
      try{
        const extractSys=isVendorMsg
          ?`Extract vendor/supplier info and return ONLY raw JSON object (no markdown): {"_type":"vendor","name":"","category":"","email":"","phone":"","website":"domain only","location":"City, Country","notes":"","rateCard":""}. If nothing extractable return {"_type":"none"}.`
          :`Extract contact info for outreach and return ONLY raw JSON object (no markdown): {"_type":"lead","company":"","contact":"","email":"","phone":"","role":"","value":"","category":"","location":"Dubai, UAE","date":"${today}","status":"not_contacted","notes":""}. For category pick from: Production Companies, Creative Agencies, Beauty & Fragrance, Jewellery & Watches, Fashion, Editorial, Sports, Hospitality, Market Research, Commercial. If nothing extractable return {"_type":"none"}.`;
        const data=await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:500,system:extractSys,messages:[{role:"user",content:input.trim().substring(0,4000)}]});
        const raw=(data?.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim();
        const parsed=JSON.parse(raw);
        if(parsed._type&&parsed._type!=="none"){
          const type=parsed._type;
          const ename=type==="vendor"?parsed.name:(parsed.contact||parsed.company);
          const sim=findSimilar(ename||"",allVendors,allLeads);
          if(sim&&!sim.exact){
            const existName=sim.type==="vendor"?sim.record.name:(sim.record.contact||sim.record.company);
            setPendingDuplicate({entry:parsed,similar:sim,saveAsOutreach:false});
            setMsgs([...history,{role:"assistant",content:`Extracted contact: ${ename}. I also found a similar existing ${sim.type}: "${existName}". Did you mean them?\n\nReply yes or no.`}]);
          }else{
            const fqp=startConv(parsed,type,false,sim?.record?.id||null);
            setMsgs([...history,{role:"assistant",content:`Extracted ${ename||"a contact"}!\n📧 ${parsed.email||"—"}  📱 ${parsed.phone||"—"}\n${type==="vendor"?`🏭 ${parsed.category||"—"}`:`🏢 ${parsed.company||"—"}  💼 ${parsed.role||"—"}`}${fqp?"\n\n"+fqp+" (or 'x' to skip)":"\n\nReview and save below."}`}]);
          }
          setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return;
        }
      }catch{}
    }

    try{
      const res=await fetch(`/api/agents/${agent.id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system,messages:history.map(m=>({role:m.role,content:m.content}))})});
      if(!res.ok){const e=await res.json().catch(()=>({error:`HTTP ${res.status}`}));setMsgs(p=>[...p,{role:"assistant",content:`Error: ${e.error||"Unknown"}`}]);setLoading(false);setMood("idle");return;}
      const reader=res.body.getReader();const decoder=new TextDecoder();let fullText="";let buffer="";
      while(true){const{done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split("\n");buffer=lines.pop()||"";for(const line of lines){if(!line.startsWith("data: "))continue;const raw=line.slice(6).trim();if(!raw||raw==="[DONE]")continue;try{const ev=JSON.parse(raw);if(ev.type==="content_block_delta"&&ev.delta?.type==="text_delta"){fullText+=ev.delta.text;setMsgs([...history,{role:"assistant",content:fullText}]);}}catch{}}}
      setMsgs([...history,{role:"assistant",content:fullText||"Hmm, something went wrong!"}]);
      setMood("excited");setTimeout(()=>setMood("idle"),2500);
    }catch(err){setMsgs(p=>[...p,{role:"assistant",content:`Oops! ${err.message}`}]);setMood("idle");}
    setLoading(false);
  };

  if(!active)return null;
  return(<>
    {/* save modal — portal to body so overflow:hidden parent can't clip it */}
    {pendingLead&&createPortal(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",zIndex:201,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:500,maxHeight:"92vh",overflowY:"auto",padding:"24px",boxShadow:"0 24px 70px rgba(0,0,0,0.18)",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',Arial,sans-serif"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:16,borderBottom:"1px solid #e5e5ea"}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:15,color:"#1d1d1f"}}>{pendingId?(pendingType==="vendor"?"Update Vendor":"Update Lead"):(pendingType==="vendor"?"New Vendor":"New Lead")}</div>
              <div style={{fontSize:12,color:"#6e6e73",marginTop:2}}>Review, edit if needed, then save</div>
            </div>
            <button onClick={()=>setPending(null)} style={{background:"none",border:"none",fontSize:22,color:"#aeaeb2",cursor:"pointer",lineHeight:1,padding:"2px 6px"}}>×</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px 14px",marginBottom:20}}>
            {pendingType==="vendor"?<>
              {lf("Name","name",true)}
              {lf("Category","category",false,_VENDOR_CATS)}
              {lf("Email","email",false,null,"email")}
              {lf("Phone","phone",false,null,"tel")}
              {lf("Website","website")}
              {lf("Rate Card","rateCard")}
              {lf("Location","location")}
              {lf("Notes","notes",true)}
            </>:<>
              {lf("Contact Name","contact")}
              {lf("Company","company")}
              {lf("Role / Title","role")}
              {lf("Email","email",false,null,"email")}
              {lf("Phone","phone",false,null,"tel")}
              {lf("Category","category",false,_LEAD_CATS)}
              {lf("Status","status",false,[{value:"not_contacted",label:"Not Contacted"},{value:"cold",label:"Cold"},{value:"warm",label:"Warm"},{value:"open",label:"Open"}])}
              {lf("Est. Value (AED)","value",false,null,"number")}
              {lf("Date","date",false,null,"date")}
              {lf("Location","location")}
              {lf("Source","source",false,_SOURCES)}
              {lf("Notes","notes",true)}
            </>}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setPending(null)} style={{flex:1,padding:"11px",borderRadius:10,background:"#f5f5f7",border:"1px solid #e5e5ea",fontSize:13,fontWeight:600,color:"#6e6e73",cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
            <button onClick={saveLead} disabled={savingLead} style={{flex:2,padding:"11px",borderRadius:10,background:"#1d1d1f",border:"none",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>{savingLead?"Saving…":pendingId?"✓ Save Changes":pendingType==="vendor"?"✓ Save Vendor":"✓ Save to Pipeline"}</button>
          </div>
        </div>
      </div>
    ,document.body)}

    {/* inline chat messages */}
    <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"14px 16px",background:"white",minHeight:0}}>
      {msgs.map((m,i)=>{
        const isBudgetMsg=agent.id==="billie"&&m.role==="assistant"&&/AED|subtotal|total|contingency|agency fee/i.test(m.content);
        return(<div key={i}>
          <_AgentBubble msg={m}/>
          {isBudgetMsg&&!loading&&(
            <div style={{display:"flex",gap:6,marginTop:-4,marginBottom:8,paddingLeft:4}}>
              <button onClick={()=>{
                const w=window.open("","_blank");
                if(!w)return;
                w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ONNA Budget</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11pt;color:#111;padding:20mm 16mm;line-height:1.6}h1{font-size:18pt;margin-bottom:4px}pre{white-space:pre-wrap;font-family:inherit;font-size:10.5pt;line-height:1.7}.footer{margin-top:30px;font-size:8pt;color:#888;border-top:1px solid #ddd;padding-top:8px}</style></head><body><h1>ONNA Production Budget</h1><p style="color:#666;font-size:9pt;margin-bottom:20px">${new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</p><pre>${m.content.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre><div class="footer">Generated by Budget Billie · ONNA Production Services · onna.world</div></body></html>`);
                w.document.close();w.print();
              }} style={{fontSize:10,fontWeight:600,color:"#1a5a30",background:"#c8efd4",border:"none",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit"}}>⬇ Export PDF</button>
              <button onClick={()=>navigator.clipboard?.writeText(m.content)} style={{fontSize:10,fontWeight:600,color:"#555",background:"#f0f0f0",border:"none",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit"}}>Copy</button>
            </div>
          )}
        </div>);
      })}
      {loading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{background:"#f5f5f7",border:"1px solid #e5e5ea",borderRadius:"6px 16px 16px 16px"}}><_AgentDots color="#6e6e73"/></div></div>}
    </div>

    {/* dropdown option buttons for category/location questions */}
    {pendingConv&&!pendingConv._awaitingNewCat&&pendingConv.questions[pendingConv.idx]?.options&&(
      <div style={{display:"flex",flexWrap:"wrap",gap:5,padding:"8px 12px 2px",background:"white",borderTop:"1px solid #f2f2f7"}}>
        {pendingConv.questions[pendingConv.idx].options.map(opt=>(
          <button key={opt} type="button" onClick={()=>{setInput(opt);setTimeout(send,0);}} style={{padding:"5px 10px",borderRadius:8,border:"1px solid #e5e5ea",background:"#f5f5f7",fontSize:11.5,fontWeight:500,color:"#1d1d1f",cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s"}} onMouseOver={e=>{e.currentTarget.style.background="#e8e8ed";e.currentTarget.style.borderColor="#c7c7cc";}} onMouseOut={e=>{e.currentTarget.style.background="#f5f5f7";e.currentTarget.style.borderColor="#e5e5ea";}}>
            {opt}
          </button>
        ))}
        {pendingConv.questions[pendingConv.idx].addNew&&(
          <button type="button" onClick={()=>{setInput("");const ta=document.querySelector('[data-vinnie-ta]');if(ta){ta.focus();ta.placeholder="Type new "+pendingConv.questions[pendingConv.idx].key+" and press Enter...";}}} style={{padding:"5px 10px",borderRadius:8,border:"1px dashed #d4aa20",background:"#fffef5",fontSize:11.5,fontWeight:600,color:"#7a5800",cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s"}} onMouseOver={e=>{e.currentTarget.style.background="#fef3c0";}} onMouseOut={e=>{e.currentTarget.style.background="#fffef5";}}>
            + Add New
          </button>
        )}
      </div>
    )}
    {/* inline input bar */}
    <div style={{padding:"10px 12px",background:"white",borderTop:pendingConv&&pendingConv.questions[pendingConv.idx]?.options?"none":"1px solid #f2f2f7",display:"flex",gap:8,flexShrink:0}}>
      <textarea data-vinnie-ta value={input} onChange={e=>setInput(e.target.value)} onFocus={()=>setMood("talking")} onBlur={()=>setMood("idle")} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder={pendingConv&&pendingConv.questions[pendingConv.idx]?.options?"Type custom value or pick above...":placeholder} rows={2} style={{flex:1,resize:"none",border:`1.5px solid ${input?"#6e6e73":"#e5e5ea"}`,borderRadius:12,padding:"8px 12px",fontSize:13,fontFamily:"inherit",outline:"none",color:"#1d1d1f",background:"#f5f5f7",transition:"border 0.15s",userSelect:"text",WebkitUserSelect:"text"}}/>
      <button onClick={send} disabled={loading||!input.trim()} style={{background:loading||!input.trim()?"#e5e5ea":"#1d1d1f",border:"none",color:loading||!input.trim()?"#aeaeb2":"#fff",borderRadius:12,padding:"0 14px",cursor:loading||!input.trim()?"not-allowed":"pointer",fontWeight:900,fontSize:18,alignSelf:"stretch",minWidth:44,transition:"background 0.12s"}}>↑</button>
    </div>
  </>);
}

// ─── PDF EXPORT via Blob URL ──────────────────────────────────────────────────
const exportToPDF = (content, title) => {
  const date = new Date().toLocaleDateString("en-GB", {day:"2-digit", month:"short", year:"numeric"});
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10.5pt;color:#111;background:#fff;padding:22mm 18mm;line-height:1.65;}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;padding-bottom:14px;border-bottom:1.5px solid #111;}
  .logo{font-size:22pt;font-weight:700;letter-spacing:-0.02em;}
  .doc-label{font-size:8pt;text-transform:uppercase;letter-spacing:0.1em;color:#666;margin-top:4px;}
  .co{text-align:right;font-size:8.5pt;color:#666;line-height:1.7;}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:5px 18px;margin-bottom:18px;padding:13px 15px;background:#f7f7f7;border-radius:5px;font-size:9pt;}
  .ml label{font-weight:600;font-size:7.5pt;text-transform:uppercase;letter-spacing:0.07em;color:#888;display:block;margin-bottom:2px;}
  table{width:100%;border-collapse:collapse;margin:8px 0 16px;font-size:9.5pt;}
  th{background:#111;color:#fff;padding:7px 11px;text-align:left;font-size:7.5pt;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;}
  td{padding:7px 11px;border-bottom:1px solid #eee;vertical-align:top;}
  tr:nth-child(even) td{background:#fafafa;}
  .sub td{font-weight:600;border-top:1px solid #bbb;}
  .vat td{color:#666;}
  .grand td{font-weight:700;font-size:11pt;background:#111!important;color:#fff;}
  .adv td{color:#666;background:#f5f5f5!important;}
  .right{text-align:right;}
  .sec{font-weight:700;text-transform:uppercase;letter-spacing:0.09em;font-size:8.5pt;color:#333;margin:16px 0 7px;border-bottom:1px solid #e0e0e0;padding-bottom:4px;}
  .bul{padding-left:14px;margin-bottom:4px;font-size:9.5pt;}
  p{margin-bottom:8px;font-size:9.5pt;}
  .sigs{margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:28px;}
  .sig{border-top:1px solid #111;padding-top:5px;font-size:8.5pt;color:#555;}
  .sig2{margin-top:22px;border-top:1px solid #bbb;padding-top:5px;font-size:8pt;color:#888;}
  .note{margin-top:14px;padding:10px 13px;background:#f5f5f5;border-left:2px solid #bbb;font-size:9pt;color:#555;white-space:pre-line;}
  .ftr{margin-top:36px;padding-top:10px;border-top:1px solid #e0e0e0;font-size:7.5pt;color:#aaa;display:flex;justify-content:space-between;}
  @media print{body{padding:15mm 12mm;}@page{margin:0;size:A4;}}
</style>
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
</head><body>
<div class="hdr">
  <div><div class="logo">onna</div><div class="doc-label">${title}</div></div>
  <div class="co">ONNA FILM TV RADIO PRODUCTION SERVICES LLC<br>Office F1-022, Dubai, UAE<br>hello@onnaproduction.com</div>
</div>
${content}
<div class="ftr"><span>ONNA FILM TV RADIO PRODUCTION SERVICES LLC · DUBAI &amp; LONDON</span><span>Generated ${date}</span></div>
</body></html>`;

  // Use Blob URL — avoids document.write cross-origin issues
  const blob = new Blob([html], {type:"text/html"});
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank");
  if (!win) {
    // Fallback: trigger download as .html file the user can print
    const a = document.createElement("a");
    a.href = url; a.download = `${title}.html`; a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

// ─── TABLE EXPORT HELPERS ──────────────────────────────────────────────────────
const downloadCSV = (rows, columns, filename) => {
  const header = columns.map(c=>`"${c.label}"`).join(",");
  const body = rows.map(r=>columns.map(c=>`"${String(r[c.key]??'').replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([header+"\n"+body],{type:"text/csv;charset=utf-8;"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),10000);
};

const exportTablePDF = (rows, columns, title) => {
  const thead = `<tr>${columns.map(c=>`<th>${c.label}</th>`).join("")}</tr>`;
  const tbody = rows.map(r=>`<tr>${columns.map(c=>`<td>${r[c.key]??''}</td>`).join("")}</tr>`).join("");
  exportToPDF(`<div class="sec">${title}</div><table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`, title);
};

const buildEstimateHTML = (est) => {
  const sub  = est.lineItems.filter(l=>l.cat!=="18").reduce((a,b)=>a+Number(b.aed),0);
  const fees = est.lineItems.filter(l=>l.cat==="18").reduce((a,b)=>a+Number(b.aed),0);
  const total = sub+fees; const vat=total*0.05; const grand=total+vat; const advance=grand*0.5;
  const metaRows=[["Date",est.date],["Client",est.client],["Project",est.project],["Attention",est.attention],["Photographer / Director",est.photographer],["Deliverables",est.deliverables],["Deadlines",est.deadlines],["Shoot Date",est.shootDate],["Shoot Location",est.shootLocation],["Usage Terms",est.usageTerms],["Payment Terms",est.paymentTerms]].filter(([,v])=>v);
  return `<div class="meta">${metaRows.map(([k,v])=>`<div class="ml"><label>${k}</label>${v}</div>`).join("")}</div>
<table><thead><tr><th style="width:38px">#</th><th>Category</th><th class="right">AED</th><th class="right">USD</th></tr></thead><tbody>
${est.lineItems.map(li=>`<tr><td style="color:#999">${li.cat}</td><td><strong>${li.name}</strong></td><td class="right">${Number(li.aed)>0?"AED "+Number(li.aed).toLocaleString():"—"}</td><td class="right" style="color:#888">${Number(li.aed)>0?"$"+(Number(li.aed)*0.27).toLocaleString(undefined,{maximumFractionDigits:2}):"—"}</td></tr>`).join("")}
<tr class="sub"><td colspan="2"><strong>SUBTOTAL</strong></td><td class="right"><strong>AED ${total.toLocaleString()}</strong></td><td class="right" style="color:#888">$${(total*0.27).toLocaleString(undefined,{maximumFractionDigits:0})}</td></tr>
<tr class="vat"><td colspan="2">VAT (5%)</td><td class="right">AED ${vat.toLocaleString(undefined,{maximumFractionDigits:2})}</td><td></td></tr>
<tr class="grand"><td colspan="2">GRAND TOTAL</td><td class="right">AED ${grand.toLocaleString(undefined,{maximumFractionDigits:2})}</td><td class="right">$${(grand*0.27).toLocaleString(undefined,{maximumFractionDigits:0})}</td></tr>
<tr class="adv"><td colspan="2">50% ADVANCE PAYMENT</td><td class="right">AED ${advance.toLocaleString(undefined,{maximumFractionDigits:2})}</td><td></td></tr>
</tbody></table>
${est.notes?`<div class="note">${est.notes}</div>`:""}
<div class="sigs"><div><div class="sig">Signed for and on behalf of ONNA</div><div class="sig2">Print Name &amp; Date</div></div><div><div class="sig">Signed for and on behalf of ${est.client||"Client"}</div><div class="sig2">Print Name &amp; Date</div></div></div>`;
};

const buildDocHTML = (text) => {
  if (!text) return "<p>No content generated.</p>";
  const lines=text.split("\n"); let html=""; let i=0;
  while (i<lines.length) {
    const line=lines[i].trim();
    if (line.includes("|")&&lines[i+1]&&lines[i+1].replace(/[-|:\s]/g,"")==="") {
      const hdrs=line.split("|").map(c=>c.trim()).filter(Boolean); const rows=[]; i+=2;
      while(i<lines.length&&lines[i].includes("|")){rows.push(lines[i].trim().split("|").map(c=>c.trim()).filter(Boolean));i++;}
      html+=`<table><thead><tr>${hdrs.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      continue;
    }
    if(line&&((line===line.toUpperCase()&&line.length>3&&!line.includes("|"))||/^\d+\./.test(line))) html+=`<div class="sec">${line}</div>`;
    else if(line.startsWith("•")||line.startsWith("-")) html+=`<div class="bul">${line}</div>`;
    else if(line) html+=`<p>${line}</p>`;
    i++;
  }
  return html;
};

const buildContractHTML = (text) => {
  if (!text) return "<p>No contract generated.</p>";
  let html="";
  text.split("\n").forEach(line=>{
    const t=line.trim(); if(!t){html+="<br>";return;}
    if(t===t.toUpperCase()&&t.length>4&&!t.includes("(")) html+=`<div class="sec">${t}</div>`;
    else if(t.startsWith("•")||t.startsWith("-")) html+=`<div class="bul">${t}</div>`;
    else html+=`<p>${t}</p>`;
  });
  return `<div>${html}</div><div class="sigs"><div><div class="sig">Signed for and on behalf of ONNA</div><div class="sig2">Print Name &amp; Date</div></div><div><div class="sig">Signed by Commissionee / Supplier</div><div class="sig2">Print Name &amp; Date</div></div></div>`;
};

const generateEstimateText = (est, sub, fees, total, vat, grand, advance) => {
  const lines = [`PRODUCTION ESTIMATE ${est.version}  DATE: ${est.date}`,`CLIENT: ${est.client}  PROJECT: ${est.project}`,`ATTENTION: ${est.attention}`,`PHOTOGRAPHER/DIRECTOR: ${est.photographer}`,`DELIVERABLES: ${est.deliverables}`,`DEADLINES: ${est.deadlines}`,`USAGE TERMS: ${est.usageTerms}`,`SHOOT DATE: ${est.shootDate}`,`SHOOT LOCATION: ${est.shootLocation}`,`PAYMENT TERMS: ${est.paymentTerms}`,``];
  (est.lineItems||[]).forEach(li=>lines.push(`${li.cat}  ${li.name}  AED ${Number(li.aed).toLocaleString()}  $${(Number(li.aed)*0.27).toFixed(2)}`));
  lines.push(``,`SUB TOTAL  AED ${sub.toLocaleString()}`,`VAT (5%)  AED ${vat.toFixed(2)}`,`GRAND TOTAL  AED ${grand.toFixed(2)}`,`50% ADVANCE  AED ${advance.toFixed(2)}`,``,`NOTES:`,est.notes||"");
  return lines.join("\n");
};

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
const Badge = ({status}) => {
  const map = {"Not Contacted":["#fff3e0","#c0392b"],"New Lead":["#f0f0f5",T.sub],"Responded":["#e8f0ff","#1a56db"],"Meeting Arranged":["#fff8e8","#92680a"],"Converted to Client":["#edfaf3","#147d50"]};
  const [bg,tc] = map[status]||["#f5f5f7",T.muted];
  return <span style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"3px 9px",borderRadius:999,background:bg,color:tc,fontSize:11,fontWeight:500}}><span style={{width:5,height:5,borderRadius:"50%",background:tc,flexShrink:0}}/>{status}</span>;
};

const Pill = ({label,active,onClick}) => (
  <button onClick={onClick} style={{padding:"5px 14px",borderRadius:999,fontSize:12,fontWeight:500,cursor:"pointer",border:"1px solid",fontFamily:"inherit",transition:"all 0.12s",background:active?T.accent:"#e8e8ed",borderColor:active?T.accent:"#d1d1d6",color:active?"#fff":T.sub,whiteSpace:"nowrap"}}>{label}</button>
);

const StatCard = ({label,value,sub}) => (
  <div style={{borderRadius:16,padding:"20px 22px",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
    <div style={{fontSize:11,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase",color:T.muted,marginBottom:10}}>{label}</div>
    <div style={{fontSize:28,fontWeight:700,color:T.text,letterSpacing:"-0.02em",marginBottom:sub?4:0}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:T.sub}}>{sub}</div>}
  </div>
);

const TH = ({children}) => <th style={{padding:"10px 14px",textAlign:"left",fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap",borderBottom:`1px solid ${T.borderSub}`,background:"#fafafa"}}>{children}</th>;
const TD = ({children,bold,muted}) => <td style={{padding:"11px 14px",fontSize:12.5,color:bold?T.text:muted?T.muted:T.sub,borderBottom:`1px solid ${T.borderSub}`,verticalAlign:"middle"}}>{children}</td>;

const SearchBar = ({value,onChange,placeholder}) => (
  <div style={{display:"flex",alignItems:"center",gap:8,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 13px",minWidth:220,boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke={T.muted} strokeWidth="1.4"/><path d="M8.5 8.5L11 11" stroke={T.muted} strokeWidth="1.4" strokeLinecap="round"/></svg>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Search…"} style={{border:"none",background:"transparent",color:T.text,fontSize:13,fontFamily:"inherit",outline:"none",width:"100%"}}/>
    {value&&<button onClick={()=>onChange("")} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>×</button>}
  </div>
);

const Sel = ({value,onChange,options,minWidth}) => (
  <select value={value} onChange={e=>onChange(e.target.value)} style={{padding:"8px 30px 8px 12px",borderRadius:10,background:T.surface,border:`1px solid ${T.border}`,color:T.text,fontSize:12.5,fontFamily:"inherit",cursor:"pointer",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23aeaeb2' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",minWidth:minWidth||140,boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
    {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
  </select>
);

const OutreachBadge = ({status,onClick}) => {
  const s = {not_contacted:{bg:"#fff3e0",c:"#c0392b",label:"Not Contacted"},cold:{bg:"#f5f5f7",c:T.sub,label:"Cold"},warm:{bg:"#eef4ff",c:"#1a56db",label:"Warm"},open:{bg:"#edfaf3",c:"#147d50",label:"Open"},client:{bg:"#f3e8ff",c:"#7c3aed",label:"Client"}}[status]||{bg:"#fff3e0",c:"#c0392b",label:"Not Contacted"};
  return <span onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:999,background:s.bg,color:s.c,fontSize:11,fontWeight:500,cursor:onClick?"pointer":"default"}}><span style={{width:5,height:5,borderRadius:"50%",background:s.c,flexShrink:0}}/>{s.label}</span>;
};

const _parseDate = (str) => {
  if (!str) return null;
  // Strip ordinal suffixes: "2nd February" → "2 February 2026"
  const clean = str.replace(/(\d+)(st|nd|rd|th)\b/i, "$1");
  // If no year present, append 2026
  const withYear = /\d{4}/.test(clean) ? clean : `${clean} 2026`;
  const d = new Date(withYear);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (str) => {
  if (!str) return "";
  const d = _parseDate(str);
  if (!d) return str;
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(2)}`;
};

const getMonthLabel = (str) => {
  if (!str) return "";
  const d = _parseDate(str);
  if (!d) return "";
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const THFilter = ({label,value,onChange,options}) => (
  <th style={{padding:"10px 14px",textAlign:"left",fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap",borderBottom:`1px solid ${T.borderSub}`,background:"#fafafa"}}>
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <span>{label}</span>
      <select value={value} onChange={e=>onChange(e.target.value)} onClick={e=>e.stopPropagation()} style={{fontSize:10,color:value==="All"?T.muted:"#1a56db",background:"transparent",border:"none",outline:"none",cursor:"pointer",padding:0,fontFamily:"inherit",fontWeight:600,appearance:"none",maxWidth:140,letterSpacing:"0.04em"}}>
        {options.map(o=>{const val=o.value!==undefined?o.value:o;const lbl=o.label||o;return <option key={val} value={val}>{lbl}</option>;})}
      </select>
    </div>
  </th>
);

const SectionBtn = ({label,active,onClick}) => (
  <button onClick={onClick} style={{padding:"6px 13px",borderRadius:9,fontSize:12,fontWeight:500,cursor:"pointer",border:`1px solid ${active?T.accent:T.border}`,fontFamily:"inherit",transition:"all 0.12s",background:active?T.accent:"transparent",color:active?"#fff":T.sub,whiteSpace:"nowrap"}}>{label}</button>
);

const UploadZone = ({label,files,onAdd}) => {
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
const BtnPrimary = ({children,onClick,disabled,small}) => (
  <button onClick={onClick} disabled={disabled} style={{padding:small?"5px 13px":"8px 18px",borderRadius:9,background:disabled?"#e8e8ed":T.accent,color:disabled?T.muted:"#fff",border:"none",fontSize:small?11:12.5,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",letterSpacing:"0.01em",opacity:disabled?0.6:1,transition:"opacity 0.12s"}}>{children}</button>
);
const BtnSecondary = ({children,onClick,small}) => (
  <button onClick={onClick} style={{padding:small?"5px 13px":"8px 18px",borderRadius:9,background:T.surface,color:T.sub,border:`1px solid ${T.border}`,fontSize:small?11:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>{children}</button>
);
const BtnExport = ({children,onClick}) => (
  <button onClick={onClick} style={{padding:"5px 13px",borderRadius:8,background:"#1d1d1f",color:"#fff",border:"none",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:5}}>⬇ {children}</button>
);

// ─── AI DOC PANEL ─────────────────────────────────────────────────────────────
const AIDocPanel = ({project, docType, systemPrompt, savedDocs}) => {
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
      <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <div style={{padding:"11px 16px",borderBottom:`1px solid ${T.borderSub}`,fontSize:10,color:T.muted,letterSpacing:"0.07em",textTransform:"uppercase",background:"#fafafa",fontWeight:600}}>AI Generator — {docType}</div>
        <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe shoot, crew, location, timing…" rows={3} style={{width:"100%",background:"#fafafa",border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 13px",color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",lineHeight:"1.6"}}/>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <BtnPrimary onClick={generate} disabled={loading||!prompt.trim()}>{loading?"Generating…":`Generate ${docType}`}</BtnPrimary>
          </div>
        </div>
      </div>
      {(output||loading)&&(
        <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
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
const DashNotes = ({notes,setNotes,selectedId,setSelectedId,isMobile}) => {
  const editorRef = useRef(null);
  const [hoveredNoteId,setHoveredNoteId] = useState(null);
  const selectedNote = notes.find(n=>n.id===selectedId)||null;

  useEffect(()=>{
    if (editorRef.current) editorRef.current.innerHTML = selectedNote?.content||"";
  },[selectedId]); // eslint-disable-line

  const updateContent = () => {
    if (!selectedNote||!editorRef.current) return;
    setNotes(prev=>prev.map(n=>n.id===selectedId?{...n,content:editorRef.current.innerHTML,updatedAt:Date.now()}:n));
  };
  const updateTitle = (val) => {
    setNotes(prev=>prev.map(n=>n.id===selectedId?{...n,title:val,updatedAt:Date.now()}:n));
  };
  const createNote = () => {
    const n={id:Date.now(),title:"",content:"",updatedAt:Date.now()};
    setNotes(prev=>[n,...prev]); setSelectedId(n.id);
  };
  const deleteNote = (id,e) => {
    e?.stopPropagation();
    if (!window.confirm("Delete this note?")) return;
    setNotes(prev=>prev.filter(n=>n.id!==id));
    if (selectedId===id) setSelectedId(null);
  };
  const fmt = (cmd,val) => { document.execCommand(cmd,false,val||null); editorRef.current?.focus(); };
  const getPlain = (html) => (html||"").replace(/<[^>]*>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">");
  const getTitle = (n) => n.title?.trim() || getPlain(n.content).split("\n")[0].trim().slice(0,50) || "New Note";
  const getPreview = (n) => { const p=getPlain(n.content).replace(/\n+/g," ").trim(); return p.slice(0,60); };
  const fmtDate = (ts) => { if(!ts)return""; const d=new Date(ts),now=new Date(); if(d.toDateString()===now.toDateString())return d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); return d.toLocaleDateString([],{month:"short",day:"numeric"}); };
  const sorted = [...notes].sort((a,b)=>b.updatedAt-a.updatedAt);
  const showList = !isMobile||!selectedNote;
  const showEditor = !isMobile||!!selectedNote;
  const TBtnStyle = {height:26,minWidth:26,borderRadius:5,border:`1px solid ${T.border}`,background:"#fff",cursor:"pointer",fontSize:12,fontFamily:"inherit",padding:"0 5px",display:"flex",alignItems:"center",justifyContent:"center"};
  return (
    <div style={{marginTop:isMobile?12:18,borderRadius:16,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",display:"flex",height:isMobile?520:500,background:T.surface}}>
      {showList&&(
        <div style={{width:isMobile?"100%":220,borderRight:isMobile?"none":`1px solid ${T.border}`,display:"flex",flexDirection:"column",background:"#fafafa",flexShrink:0}}>
          <div style={{padding:"12px 14px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600}}>Notes</span>
            <button onClick={createNote} style={{width:22,height:22,borderRadius:6,background:T.accent,border:"none",color:"#fff",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,padding:0}}>+</button>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {sorted.length===0&&<div style={{padding:"28px 14px",textAlign:"center",fontSize:12,color:T.muted}}>No notes yet.<br/>Hit + to create one.</div>}
            {sorted.map(n=>(
              <div key={n.id} onClick={()=>setSelectedId(n.id)} onMouseEnter={()=>setHoveredNoteId(n.id)} onMouseLeave={()=>setHoveredNoteId(null)} style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`,cursor:"pointer",background:selectedId===n.id?"#e8e8ed":"transparent",transition:"background 0.1s",display:"flex",alignItems:"flex-start",gap:6}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{getTitle(n)}</div>
                  <div style={{display:"flex",gap:6,marginTop:2,alignItems:"center"}}>
                    <span style={{fontSize:10.5,color:T.muted,flexShrink:0}}>{fmtDate(n.updatedAt)}</span>
                    <span style={{fontSize:10.5,color:T.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{getPreview(n)}</span>
                  </div>
                </div>
                {hoveredNoteId===n.id&&<button onClick={e=>deleteNote(n.id,e)} style={{background:"none",border:"none",color:"#c0392b",cursor:"pointer",fontSize:15,padding:"0 2px",lineHeight:1,flexShrink:0,marginTop:1}} title="Delete note">×</button>}
              </div>
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
                <button onMouseDown={e=>{e.preventDefault();fmt("hiliteColor","transparent");}} title="Clear highlight" style={{...TBtnStyle,fontSize:10,color:T.muted,minWidth:16,width:16,padding:0}}>✕</button>
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
const ProjectTodoList = ({projectId,projectTodos,setProjectTodos,archivedTodos,setArchivedTodos}) => {
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
        <div key={t.id} style={{display:"flex",alignItems:"flex-start",gap:9,padding:"9px 18px",borderBottom:i<todos.length-1?`1px solid ${T.borderSub}`:"none",transition:"background 0.1s"}}>
          <button onClick={()=>setProjectTodos(prev=>({...prev,[projectId]:(prev[projectId]||[]).map(x=>x.id===t.id?{...x,done:!x.done}:x)}))} style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${t.done?T.muted:T.border}`,background:t.done?T.accent:"transparent",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginTop:2,transition:"all 0.12s"}}>
            {t.done&&<span style={{color:"#fff",fontSize:9,lineHeight:1,fontWeight:700}}>✓</span>}
          </button>
          <span style={{flex:1,fontSize:13,color:t.done?T.muted:T.text,textDecoration:t.done?"line-through":"none",lineHeight:"1.5"}}>{t.text}</span>
          <div style={{display:"flex",gap:3,opacity:0,transition:"opacity 0.12s"}} className="todo-del">
            <button onClick={()=>setArchivedTodos(prev=>[...prev,{...t,projectId}])} title="Archive" style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:11,padding:"2px 4px",borderRadius:4,fontFamily:"inherit"}}>⊘</button>
            <button onClick={()=>setProjectTodos(prev=>({...prev,[projectId]:(prev[projectId]||[]).filter(x=>x.id!==t.id)}))} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>×</button>
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

// ─── VAULT CRYPTO (AES-256-GCM + PBKDF2) ─────────────────────────────────────
const VAULT_SALT  = "onna-vault-salt-2026";
const VAULT_CHECK = "onna-vault-verified";
const vaultDeriveKey = async (pass) => {
  const enc = new TextEncoder();
  const mat = await crypto.subtle.importKey("raw",enc.encode(pass),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt:enc.encode(VAULT_SALT),iterations:100000,hash:"SHA-256"},mat,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
};
const vaultEncrypt = async (key, data) => {
  const iv  = crypto.getRandomValues(new Uint8Array(12));
  const ct  = await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(typeof data==="string"?data:JSON.stringify(data)));
  const out = new Uint8Array(12+ct.byteLength); out.set(iv); out.set(new Uint8Array(ct),12);
  return btoa(String.fromCharCode(...out));
};
const vaultDecrypt = async (key, blob) => {
  const bytes = Uint8Array.from(atob(blob),c=>c.charCodeAt(0));
  const plain = await crypto.subtle.decrypt({name:"AES-GCM",iv:bytes.slice(0,12)},key,bytes.slice(12));
  const text  = new TextDecoder().decode(plain);
  try { return JSON.parse(text); } catch { return text; }
};

// ─── LOGIN PAGE PRIMITIVES — must live at module level so React never remounts them ──
const _LG_CARD = {width:380,background:"#fff",borderRadius:20,padding:"44px 40px 40px",boxShadow:"0 8px 40px rgba(0,0,0,0.1)",border:"1px solid rgba(0,0,0,0.07)"};
const _LG_WRAP = {minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5f5f7",fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif"};
const LgLogo = () => <div style={{marginBottom:32,textAlign:"center"}}><img src="/logo.png" alt="ONNA" style={{height:36,width:"auto"}}/></div>;
const LgIn = ({label,id,type="text",value,onChange,onEnter,placeholder,autoFocus,hasErr}) => (
  <div>
    <div style={{fontSize:11,fontWeight:600,color:"#6e6e73",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:6}}>{label}</div>
    <input id={id} type={type} value={value} onChange={e=>onChange(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&onEnter)onEnter();}} placeholder={placeholder} autoFocus={autoFocus} style={{width:"100%",padding:"11px 14px",borderRadius:11,border:`1.5px solid ${hasErr?"#c0392b":"#d2d2d7"}`,fontSize:14,fontFamily:"inherit",color:"#1d1d1f",background:"#fafafa",boxSizing:"border-box"}}/>
  </div>
);
const LgBtn = ({onClick,disabled,children}) => (
  <button onClick={onClick} disabled={disabled} style={{marginTop:4,padding:"13px",borderRadius:11,background:disabled?"#d2d2d7":"#1d1d1f",color:"#fff",border:"none",fontSize:14,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",letterSpacing:"0.01em"}}>{children}</button>
);
const LgLink = ({onClick,children}) => (
  <button onClick={onClick} style={{background:"none",border:"none",color:"#6e6e73",fontSize:12,cursor:"pointer",fontFamily:"inherit",textAlign:"center",marginTop:2}}>{children}</button>
);

export default function OnnaDashboard() {
  const _urlReset = new URLSearchParams(window.location.search).get("reset") || "";

  const [authed,setAuthed]         = useState(()=>!!localStorage.getItem("onna_token") && !_urlReset);
  const [lgUser,setLgUser]         = useState("");
  const [lgPass,setLgPass]         = useState("");
  const [lgErr,setLgErr]           = useState("");
  const [lgLoading,setLgLoading]   = useState(false);
  const [lgStep,setLgStep]         = useState(_urlReset ? "reset" : "login");
  const [lgEmail,setLgEmail]       = useState("");
  const [lgNewPass,setLgNewPass]   = useState("");
  const [lgNewPass2,setLgNewPass2] = useState("");

  const doLogin = async () => {
    if (!lgUser.trim()||!lgPass.trim()) return;
    setLgLoading(true); setLgErr("");
    try {
      const data = await fetch(`${API}/api/auth/login`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Secret":API_SECRET},body:JSON.stringify({username:lgUser,password:lgPass})}).then(r=>r.json());
      if (data.token) { localStorage.setItem("onna_token",data.token); window.location.reload(); }
      else setLgErr("Incorrect username or password");
    } catch { setLgErr("Could not connect. Please try again."); }
    setLgLoading(false);
  };

  const doResetRequest = async () => {
    setLgLoading(true);
    try {
      const data = await fetch(`${API}/api/auth/reset-request`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Secret":API_SECRET},body:JSON.stringify({email:lgEmail})}).then(r=>r.json());
      if (data.reset_url) { window.location.href=data.reset_url; return; } // SMTP not configured
    } catch {}
    setLgStep("forgot-sent"); setLgLoading(false);
  };

  const doResetConfirm = async () => {
    if (!lgNewPass||lgNewPass.length<8){setLgErr("Password must be at least 8 characters");return;}
    if (lgNewPass!==lgNewPass2){setLgErr("Passwords do not match");return;}
    setLgLoading(true); setLgErr("");
    try {
      const data = await fetch(`${API}/api/auth/reset-confirm`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Secret":API_SECRET},body:JSON.stringify({token:_urlReset,password:lgNewPass})}).then(r=>r.json());
      if (data.ok) setLgStep("reset-done");
      else setLgErr(data.error||"Reset failed. Link may have expired.");
    } catch { setLgErr("Could not connect. Please try again."); }
    setLgLoading(false);
  };

  // ── These two must live before the early return to satisfy Rules of Hooks ──
  const [activeTab,setActiveTab] = useState(()=>localStorage.getItem("onna_tab")||"Dashboard");
  useEffect(()=>{localStorage.setItem("onna_tab",activeTab);},[activeTab]);

  // Auto-logout after 30 min inactivity (only active while authed)
  useEffect(()=>{
    if (!authed) return;
    const TIMEOUT = 30*60*1000;
    let timer = setTimeout(()=>{localStorage.removeItem("onna_token");setAuthed(false);}, TIMEOUT);
    const reset = ()=>{ clearTimeout(timer); timer = setTimeout(()=>{localStorage.removeItem("onna_token");setAuthed(false);}, TIMEOUT); };
    const events = ["mousemove","mousedown","keydown","touchstart","scroll"];
    events.forEach(e=>window.addEventListener(e, reset, {passive:true}));
    return ()=>{ clearTimeout(timer); events.forEach(e=>window.removeEventListener(e, reset)); };
  },[authed]);

  if (!authed) return (
    <div style={_LG_WRAP}>
      <div style={_LG_CARD}>
        {lgStep==="login"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <LgLogo/>
            <LgIn label="Username" autoFocus value={lgUser} onChange={v=>{setLgUser(v);setLgErr("");}} onEnter={()=>document.getElementById("lg-p").focus()} placeholder="Username" hasErr={!!lgErr}/>
            <LgIn label="Password" id="lg-p" type="password" value={lgPass} onChange={v=>{setLgPass(v);setLgErr("");}} onEnter={doLogin} placeholder="••••••••••" hasErr={!!lgErr}/>
            {lgErr&&<div style={{fontSize:12,color:"#c0392b",textAlign:"center",fontWeight:500}}>{lgErr}</div>}
            <LgBtn onClick={doLogin} disabled={lgLoading||!lgUser.trim()||!lgPass.trim()}>{lgLoading?"Signing in…":"Sign In"}</LgBtn>
            <LgLink onClick={()=>{setLgStep("forgot");setLgErr("");}}>Forgot password?</LgLink>
          </div>
        )}
        {lgStep==="forgot"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <LgLogo/>
            <div style={{fontSize:13,color:"#6e6e73",textAlign:"center",marginTop:-14,marginBottom:6}}>Enter your email to receive a reset link</div>
            <LgIn label="Email Address" type="email" autoFocus value={lgEmail} onChange={v=>{setLgEmail(v);setLgErr("");}} onEnter={doResetRequest} placeholder="Your email address" hasErr={!!lgErr}/>
            <LgBtn onClick={doResetRequest} disabled={lgLoading||!lgEmail.trim()}>{lgLoading?"Sending…":"Send Reset Link"}</LgBtn>
            <LgLink onClick={()=>{setLgStep("login");setLgErr("");}}>‹ Back to sign in</LgLink>
          </div>
        )}
        {lgStep==="forgot-sent"&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:16}}>📧</div>
            <div style={{fontSize:18,fontWeight:700,color:"#1d1d1f",marginBottom:8}}>Check your inbox</div>
            <div style={{fontSize:13,color:"#6e6e73",lineHeight:1.7,marginBottom:24}}>If that email is registered, a reset link has been sent.<br/>It expires in 1 hour.</div>
            <button onClick={()=>{setLgStep("login");setLgEmail("");}} style={{padding:"11px 28px",borderRadius:11,background:"#1d1d1f",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Back to sign in</button>
          </div>
        )}
        {lgStep==="reset"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <LgLogo/>
            <div style={{fontSize:13,color:"#6e6e73",textAlign:"center",marginTop:-14,marginBottom:6}}>Choose a new password</div>
            <LgIn label="New Password" type="password" autoFocus value={lgNewPass} onChange={v=>{setLgNewPass(v);setLgErr("");}} onEnter={()=>document.getElementById("lg-p2").focus()} placeholder="At least 8 characters" hasErr={!!lgErr}/>
            <LgIn label="Confirm Password" id="lg-p2" type="password" value={lgNewPass2} onChange={v=>{setLgNewPass2(v);setLgErr("");}} onEnter={doResetConfirm} placeholder="Repeat password" hasErr={!!lgErr}/>
            {lgErr&&<div style={{fontSize:12,color:"#c0392b",textAlign:"center",fontWeight:500}}>{lgErr}</div>}
            <LgBtn onClick={doResetConfirm} disabled={lgLoading||!lgNewPass||!lgNewPass2}>{lgLoading?"Saving…":"Set New Password"}</LgBtn>
          </div>
        )}
        {lgStep==="reset-done"&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:16}}>✓</div>
            <div style={{fontSize:18,fontWeight:700,color:"#1d1d1f",marginBottom:8}}>Password updated</div>
            <div style={{fontSize:13,color:"#6e6e73",marginBottom:24}}>Sign in with your new password.</div>
            <button onClick={()=>{setLgStep("login");setLgNewPass("");setLgNewPass2("");window.history.replaceState({},"","/");}} style={{padding:"11px 28px",borderRadius:11,background:"#1d1d1f",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Sign In</button>
          </div>
        )}
      </div>
    </div>
  );

  const [isMobile,setIsMobile] = useState(()=>window.innerWidth<768);
  useEffect(()=>{const fn=()=>setIsMobile(window.innerWidth<768);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);

  const [searches,setSearches]                           = useState({});
  const setSearch = (tab,val) => setSearches(p=>({...p,[tab]:val}));
  const getSearch = tab => searches[tab]||"";

  const [leadCat,setLeadCat]                             = useState("All");
  const [leadStatus,setLeadStatus]                       = useState("All");
  const [leadMonth,setLeadMonth]                         = useState("All");
  const [selectedLead,setSelectedLead]                   = useState(null);
  const [selectedOutreach,setSelectedOutreach]           = useState(null);
  const [addContactForm,setAddContactForm]               = useState(null); // {type,name,email,phone,role}
  const [leadsView,setLeadsView]                         = useState(()=>localStorage.getItem("onna_leads_view")||"dashboard");
  useEffect(()=>{localStorage.setItem("onna_leads_view",leadsView);},[leadsView]);
  const [outreach,setOutreach]                           = useState(initOutreach);
  const [outreachMsg,setOutreachMsg]                     = useState("");
  const [outreachLoading,setOutreachLoading]             = useState(false);
  const [outreachCatFilter,setOutreachCatFilter]         = useState("All");
  const [outreachStatusFilter,setOutreachStatusFilter]   = useState("All");
  const [outreachMonthFilter,setOutreachMonthFilter]     = useState("All");

  const [vendors,setVendors]                         = useState(()=>{try{const c=localStorage.getItem('onna_cache_vendors');return c?JSON.parse(c):initVendors}catch{return initVendors}});
  const [bbCat,setBbCat]                                 = useState("All");
  const [bbLocation,setBbLocation]                       = useState("All");
  const [showRateModal,setShowRateModal]                 = useState(null);
  const [rateInput,setRateInput]                         = useState("");
  const [editVendor,setEditVendor]                       = useState(null);

  const [projectYear,setProjectYear]                     = useState(2026);
  const [selectedProject,setSelectedProject]             = useState(null);
  const [projectSection,setProjectSection]               = useState("Home");
  const [creativeSubSection,setCreativeSubSection]       = useState(null);
  const [budgetSubSection,setBudgetSubSection]           = useState(null);
  const [documentsSubSection,setDocumentsSubSection]     = useState(null);
  const [scheduleSubSection,setScheduleSubSection]       = useState(null);
  const [projectEntries,setProjectEntries]               = useState({});
  const [aiMsg,setAiMsg]                                 = useState("");
  const [aiLoading,setAiLoading]                         = useState(false);
  const [attachedFile,setAttachedFile]                   = useState(null);
  const [projectFiles,setProjectFiles]                   = useState({});
  const [projectFileStore,setProjectFileStore]           = useState({});
  const [fileStoreReady,setFileStoreReady]               = useState(false);
  const [projectCasting,setProjectCasting]               = useState({});
  const [projectLocLinks,setProjectLocLinks]             = useState({});
  const [projectCreativeLinks,setProjectCreativeLinks]   = useState(()=>{try{const s=localStorage.getItem('onna_creative_links');return s?JSON.parse(s):{}}catch{return {}}});
  const [projectContracts,setProjectContracts]           = useState({});
  const [callSheetStore,setCallSheetStore]               = useState(()=>{try{const s=localStorage.getItem('onna_callsheets');return s?JSON.parse(s):{}}catch{return {}}});
  const [projectEstimates,setProjectEstimates]           = useState({1:[{...initColumbiaEstimate,id:1,version:"V1"}]});
  const [projectNotes,setProjectNotes]                   = useState({});
  const [editingEstimate,setEditingEstimate]             = useState(null);
  const [contractType,setContractType]                   = useState(CONTRACT_TYPES[0]);
  const [contractFields,setContractFields]               = useState({commissionee:"",individual:"",role:"",fee:"",shootDate:"",deliverables:"",usageRights:"",paymentTerms:"NET 30 days",deadline:"",projectRef:""});
  const [generatedContract,setGeneratedContract]         = useState("");
  const [contractLoading,setContractLoading]             = useState(false);

  const [showAddProject,setShowAddProject]   = useState(false);
  const [showAddLead,setShowAddLead]         = useState(false);
  const [showAddVendor,setShowAddVendor]     = useState(false);
  const [showArchive,setShowArchive]         = useState(false);
  const [showUserMenu,setShowUserMenu]       = useState(false);
  const [archive,setArchive]                 = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_archive')||'[]')}catch{return []}});
  const [newProject,setNewProject]           = useState({client:"",name:"",revenue:"",cost:"",status:"Active",year:2026});
  const [newLead,setNewLead]                 = useState({company:"",contact:"",email:"",phone:"",role:"",date:"",source:"Referral",status:"not_contacted",value:"",category:"Production Companies",location:"Dubai, UAE"});
  const [newVendor,setNewVendor]             = useState({name:"",category:"Locations",email:"",phone:"",website:"",location:"Dubai, UAE",notes:"",rateCard:""});
  const [localProjects,setLocalProjects]     = useState(()=>{try{const c=localStorage.getItem('onna_cache_projects');return c?JSON.parse(c):[]}catch{return []}});
  const [localLeads,setLocalLeads]           = useState(()=>{try{const c=localStorage.getItem('onna_cache_leads');return c?JSON.parse(c):[]}catch{return []}});
  const [localClients,setLocalClients]       = useState(()=>{try{const c=localStorage.getItem('onna_cache_clients');return c?JSON.parse(c):[]}catch{return []}});
  const [apiLoading,setApiLoading]           = useState(true);
  const [apiError,setApiError]               = useState(null);

  // ── Vault state ──────────────────────────────────────────────────────────────
  const [vaultLocked,setVaultLocked]         = useState(true);
  const [vaultKey,setVaultKey]               = useState(null);
  const [vaultPass,setVaultPass]             = useState("");
  const [vaultErr,setVaultErr]               = useState("");
  const [vaultLoading,setVaultLoading]       = useState(false);
  const [vaultResources,setVaultResources]   = useState([]);
  const [vaultView,setVaultView]             = useState("passwords");
  const [vaultShowPw,setVaultShowPw]         = useState({});
  const [vaultCopied,setVaultCopied]         = useState(null);
  const [vaultSaving,setVaultSaving]         = useState(false);
  const [vaultAddPwOpen,setVaultAddPwOpen]   = useState(false);
  const [vaultEditId,setVaultEditId]         = useState(null);
  const [vaultNewPw,setVaultNewPw]           = useState({name:"",url:"",username:"",password:"",notes:""});
  const [vaultFileRef,setVaultFileRef]       = useState(null);
  const [vaultFileName,setVaultFileName]     = useState("");
  const [vaultFileErr,setVaultFileErr]       = useState("");
  const [vaultPwSearch,setVaultPwSearch]     = useState("");
  const [vaultViewEntry,setVaultViewEntry]   = useState(null);

  // ── Notes state ───────────────────────────────────────────────────────────────
  const [notes,setNotes]                     = useState([]);
  const [notesLoading,setNotesLoading]       = useState(false);
  const [noteAddOpen,setNoteAddOpen]         = useState(false);
  const [noteEditId,setNoteEditId]           = useState(null);
  const [noteDraft,setNoteDraft]             = useState({title:"",content:""});
  const [noteSaving,setNoteSaving]           = useState(false);
  const [notesErr,setNotesErr]               = useState("");

  const [leadStatusOverrides,setLeadStatusOverrides] = useState({});
  const [customLeadLocs,setCustomLeadLocs]   = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_lead_locs')||'[]')}catch{return []}});
  const [customLeadCats,setCustomLeadCats]   = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_lead_cats')||'[]')}catch{return []}});
  const [customVendorCats,setCustomVendorCats] = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_vendor_cats')||'[]')}catch{return []}});
  const [hiddenLeadBuiltins,setHiddenLeadBuiltins] = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_hidden_lead_cats')||'[]')}catch{return []}});
  const [hiddenVendorBuiltins,setHiddenVendorBuiltins] = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_hidden_vendor_cats')||'[]')}catch{return []}});
  const [showCatManager,setShowCatManager] = useState(false);
  const [catEdit,setCatEdit] = useState(null);
  const [catEditVal,setCatEditVal] = useState("");
  const [catSaving,setCatSaving] = useState(false);
  const [customVendorLocs,setCustomVendorLocs] = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_vendor_locs')||'[]')}catch{return []}});
  const [projectTodos,setProjectTodos] = useState(()=>{try{const s=localStorage.getItem('onna_ptodos');return s?JSON.parse(s):{}}catch(e){return {}}});
  const [archivedProjects,setArchivedProjects] = useState([]);
  const [archivedTodos,setArchivedTodos]     = useState([]);
  const [todos,setTodos] = useState(()=>{try{const s=localStorage.getItem('onna_todos');return s?JSON.parse(s):[]}catch(e){return []}});
  const [newTodo,setNewTodo]         = useState("");
  const [todoFilter,setTodoFilter]   = useState("todo");
  const [selectedTodo,setSelectedTodo] = useState(null);
  const [dashNotesList,setDashNotesList] = useState(()=>{try{const s=localStorage.getItem('onna_notes_list');return s?JSON.parse(s):[]}catch{return []}});
  const [dashSelectedNoteId,setDashSelectedNoteId] = useState(null);
  useEffect(()=>{try{localStorage.setItem('onna_todos',JSON.stringify(todos))}catch(e){}},[todos]);
  useEffect(()=>{try{localStorage.setItem('onna_ptodos',JSON.stringify(projectTodos))}catch(e){}},[projectTodos]);
  useEffect(()=>{try{localStorage.setItem('onna_notes_list',JSON.stringify(dashNotesList))}catch{}},[dashNotesList]);
  useEffect(()=>{idbGet("projectFileStore").then(d=>{if(d)setProjectFileStore(d);setFileStoreReady(true);}).catch(()=>setFileStoreReady(true));},[]);
  useEffect(()=>{if(fileStoreReady)idbSet("projectFileStore",projectFileStore).catch(()=>{});},[projectFileStore,fileStoreReady]);
  useEffect(()=>{try{localStorage.setItem('onna_creative_links',JSON.stringify(projectCreativeLinks))}catch{}},[projectCreativeLinks]);
  useEffect(()=>{try{localStorage.setItem('onna_callsheets',JSON.stringify(callSheetStore))}catch{}},[callSheetStore]);

  // ── Google Calendar state ─────────────────────────────────────────────────
  const [gcalToken,setGcalToken]     = useState(()=>{try{const t=localStorage.getItem('onna_gcal_token'),e=localStorage.getItem('onna_gcal_exp');if(t&&e&&Date.now()<Number(e))return t;}catch{}return null;});
  const [gcalEvents,setGcalEvents]   = useState([]);
  const [gcalLoading,setGcalLoading] = useState(false);
  const [gcalEventColors,setGcalEventColors] = useState({});
  const [calMonth,setCalMonth]       = useState(new Date());
  const [calDayView,setCalDayView]   = useState(null); // Date object for the clicked day
  const [outlookEvents,setOutlookEvents] = useState(()=>{try{const c=sessionStorage.getItem('onna_outlook_evs');return c?JSON.parse(c):[]}catch{return []}});
  const [outlookLoading,setOutlookLoading] = useState(false);
  const [outlookError,setOutlookError]     = useState("");

  // ── Agents state ──────────────────────────────────────────────────────────────
  const [agentActiveIdx,setAgentActiveIdx] = useState(null);
  const [agentHoverIdx,setAgentHoverIdx]   = useState(null);
  const agentConstellationRef              = useRef(null);

  // Load Google Identity Services script once
  useEffect(()=>{
    if (!GCAL_CLIENT_ID) return;
    if (document.getElementById("gsi-script")) return;
    const s = document.createElement("script");
    s.id = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    document.head.appendChild(s);
  },[]);

  const fetchGCalEvents = async (token, month) => {
    setGcalLoading(true);
    const yr = month.getFullYear(), mo = month.getMonth();
    const timeMin = new Date(yr, mo, 1).toISOString();
    const timeMax = new Date(yr, mo+1, 0, 23, 59, 59).toISOString();
    try {
      const params = new URLSearchParams({timeMin, timeMax, singleEvents:"true", orderBy:"startTime", maxResults:"250"});
      const [calListRes, colorsRes] = await Promise.all([
        fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250&showHidden=true",{headers:{Authorization:`Bearer ${token}`}}),
        fetch("https://www.googleapis.com/calendar/v3/colors",{headers:{Authorization:`Bearer ${token}`}})
      ]);
      const calList = await calListRes.json();
      const colorsData = await colorsRes.json().catch(()=>({}));
      if (colorsData.event) setGcalEventColors(colorsData.event);
      const calItems = calList.items||[];
      const allEventsArr = await Promise.all(calItems.map(cal=>
        fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${params}`,{headers:{Authorization:`Bearer ${token}`}})
          .then(r=>r.json()).then(d=>Array.isArray(d.items)?d.items.map(e=>({...e,calendarColor:cal.backgroundColor,calendarFg:cal.foregroundColor})):[]).catch(()=>[])
      ));
      setGcalEvents(allEventsArr.flat().sort((a,b)=>new Date(a.start?.dateTime||a.start?.date)-new Date(b.start?.dateTime||b.start?.date)));
    } catch {}
    setGcalLoading(false);
  };

  const fetchOutlookCal = async () => {
    setOutlookLoading(true);
    setOutlookError("");
    try {
      const res = await fetch("/api/proxy-ics");
      if (!res.ok) {
        const body = await res.text().catch(()=>"");
        throw new Error(`Proxy ${res.status}: ${body.slice(0,120)}`);
      }
      const text = await res.text();
      const evs = parseICS(text);
      setOutlookEvents(evs);
      try{sessionStorage.setItem('onna_outlook_evs',JSON.stringify(evs));}catch{}
    } catch(err) {
      console.error("Outlook ICS fetch failed:", err);
      setOutlookError(err.message||"Failed");
      try{const c=sessionStorage.getItem('onna_outlook_evs');if(c)setOutlookEvents(JSON.parse(c));}catch{}
    }
    setOutlookLoading(false);
  };

  // Silent re-auth: if user previously connected but token is gone/expired, auto-reconnect
  useEffect(()=>{
    if (!localStorage.getItem('onna_gcal_connected') || gcalToken) return;
    const tryS = () => {
      if (!window.google?.accounts?.oauth2 || !GCAL_CLIENT_ID) return;
      window.google.accounts.oauth2.initTokenClient({
        client_id: GCAL_CLIENT_ID,
        scope: "https://www.googleapis.com/auth/calendar.readonly",
        prompt: "",
        callback: resp => {
          if (resp.access_token) {
            setGcalToken(resp.access_token);
            try{localStorage.setItem('onna_gcal_token',resp.access_token);localStorage.setItem('onna_gcal_exp',String(Date.now()+55*60*1000));}catch{}
            fetchGCalEvents(resp.access_token, calMonth);
          }
        },
      }).requestAccessToken({prompt:"none"});
    };
    const t = setTimeout(tryS, 2000); // give GSI script time to load
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  // Proactive token refresh — check every 10 min, refresh if <8 min left on token
  useEffect(()=>{
    const id = setInterval(()=>{
      const exp = Number(localStorage.getItem('onna_gcal_exp')||0);
      if (!localStorage.getItem('onna_gcal_connected') || Date.now() < exp - 8*60*1000) return;
      if (!window.google?.accounts?.oauth2 || !GCAL_CLIENT_ID) return;
      window.google.accounts.oauth2.initTokenClient({
        client_id: GCAL_CLIENT_ID,
        scope: "https://www.googleapis.com/auth/calendar.readonly",
        prompt: "",
        callback: resp => {
          if (resp.access_token) {
            setGcalToken(resp.access_token);
            try{localStorage.setItem('onna_gcal_token',resp.access_token);localStorage.setItem('onna_gcal_exp',String(Date.now()+55*60*1000));}catch{}
          }
        },
      }).requestAccessToken({prompt:"none"});
    }, 10*60*1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  // Re-fetch when month changes while connected, and on mount if token restored
  useEffect(()=>{ if (gcalToken) fetchGCalEvents(gcalToken, calMonth); },[calMonth,gcalToken]); // eslint-disable-line
  // Auto-fetch Outlook ICS on mount (public feed, no auth needed)
  useEffect(()=>{ if (authed) fetchOutlookCal(); },[authed]); // eslint-disable-line

  const connectGCal = () => {
    if (!window.google?.accounts?.oauth2) {
      alert("Google Identity Services not loaded yet — please wait a moment and try again.");
      return;
    }
    window.google.accounts.oauth2.initTokenClient({
      client_id: GCAL_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      callback: (resp) => {
        if (resp.access_token) {
          setGcalToken(resp.access_token);
          try{localStorage.setItem('onna_gcal_token',resp.access_token);localStorage.setItem('onna_gcal_exp',String(Date.now()+55*60*1000));localStorage.setItem('onna_gcal_connected','1');}catch{}
          fetchGCalEvents(resp.access_token, calMonth);
        }
      },
    }).requestAccessToken();
  };

  // ── Load all data from backend ───────────────────────────────────────────
  useEffect(()=>{
    if (!authed) return;
    let cancelled = false;
    Promise.all([
      api.get("/api/projects"),
      api.get("/api/leads"),
      api.get("/api/clients"),
      api.get("/api/vendors"),
      api.get("/api/outreach"),
    ]).then(async ([projects, leads, clients, vendors, outreach])=>{
      if (cancelled) return;
      if (Array.isArray(projects) && projects.length > 0) { setLocalProjects(projects); try{localStorage.setItem('onna_cache_projects',JSON.stringify(projects))}catch{} }
      if (Array.isArray(leads)    && leads.length > 0)    { setLocalLeads(leads);    try{localStorage.setItem('onna_cache_leads',JSON.stringify(leads))}catch{} }
      if (Array.isArray(vendors)  && vendors.length > 0)  { setVendors(vendors);     try{localStorage.setItem('onna_cache_vendors',JSON.stringify(vendors))}catch{} }
      if (Array.isArray(outreach) && outreach.length > 0) setOutreach(outreach);

      // Retroactive sync: find any leads/outreach with status="client" that have no client record yet
      const existingClients = Array.isArray(clients) ? clients : [];
      const knownCompanies  = new Set(existingClients.map(c=>(c.company||"").trim().toLowerCase()));
      const allEntities     = [
        ...(Array.isArray(outreach)?outreach:[]).map(o=>({company:o.company,name:o.clientName||"",email:o.email||"",phone:o.phone||"",country:o.location||"",notes:o.notes||"",status:o.status})),
        ...(Array.isArray(leads)?leads:[]).map(l=>({company:l.company,name:l.contact||"",email:l.email||"",phone:l.phone||"",country:l.location||"",notes:l.notes||"",status:l.status})),
      ];
      const toCreate = allEntities.filter(e=>e.status==="client"&&e.company&&!knownCompanies.has(e.company.trim().toLowerCase()));
      // Dedupe by company within toCreate
      const seen = new Set();
      const unique = toCreate.filter(e=>{const k=e.company.trim().toLowerCase();if(seen.has(k))return false;seen.add(k);return true;});
      const newlyCreated = (await Promise.all(unique.map(e=>api.post("/api/clients",{company:e.company,name:e.name,email:e.email,phone:e.phone,country:e.country,notes:e.notes})))).filter(r=>r.id);
      const finalClients = [...existingClients,...newlyCreated];
      setLocalClients(finalClients);
      try{localStorage.setItem('onna_cache_clients',JSON.stringify(finalClients))}catch{}

      setApiLoading(false);
    }).catch(()=>setApiLoading(false));
    return ()=>{ cancelled=true; };
  },[authed]);

  const projStatusColor = {Active:"#147d50","In Review":"#92680a",Completed:T.muted};
  const projStatusBg    = {Active:"#edfaf3","In Review":"#fff8e8",Completed:"#f5f5f7"};

  const allProjectsMerged = localProjects.filter(p=>!archivedProjects.find(a=>a.id===p.id));
  const projects2026  = allProjectsMerged.filter(p=>p.year===2026);
  const rev2026       = projects2026.reduce((a,b)=>a+b.revenue,0);
  const profit2026    = projects2026.reduce((a,b)=>a+(b.revenue-b.cost),0);
  const totalPipeline = localLeads.reduce((a,b)=>a+b.value,0);
  const newCount      = localLeads.filter(l=>l.status==="not_contacted"||l.status==="cold").length;
  const activeProjects= allProjectsMerged.filter(p=>p.status==="Active");
  const projects      = allProjectsMerged.filter(p=>p.year===projectYear);
  const projRev       = projects.reduce((a,b)=>a+b.revenue,0);
  const projProfit    = projects.reduce((a,b)=>a+(b.revenue-b.cost),0);
  const projMargin    = projRev>0?Math.round((projProfit/projRev)*100):0;

  const allLeadsMerged = localLeads.map(l=>leadStatusOverrides[l.id]?{...l,status:leadStatusOverrides[l.id]}:l);
  // Merge outreach into leads, deduplicating by company name so nothing appears twice
  const _outreachKeys = new Set(outreach.map(o=>o.company.trim().toLowerCase()));
  const _pureLeads    = allLeadsMerged.filter(l=>!_outreachKeys.has(l.company.trim().toLowerCase()));
  const _outreachAsLeads = outreach.map(o=>({id:o.id,_fromOutreach:true,company:o.company,contact:o.clientName,role:o.role,email:o.email,category:o.category,status:o.status,date:o.date,value:o.value,location:o.location,notes:o.notes,phone:o.phone}));
  const allLeadsCombined = [..._pureLeads,..._outreachAsLeads];
  const leadMonths = ["All",...Array.from(new Set(allLeadsCombined.map(l=>getMonthLabel(l.date)).filter(Boolean)))];
  const filteredLeads = useMemo(()=>{
    const q=getSearch("Leads").toLowerCase();
    return allLeadsCombined
      .filter(l=>(!q||l.company.toLowerCase().includes(q)||(l.contact||"").toLowerCase().includes(q)||(l.role||"").toLowerCase().includes(q)||(l.email||"").toLowerCase().includes(q))&&(leadCat==="All"||l.category===leadCat)&&(leadStatus==="All"||l.status===leadStatus)&&(leadMonth==="All"||getMonthLabel(l.date)===leadMonth))
      .sort((a,b)=>(a.company||"").toLowerCase().localeCompare((b.company||"").toLowerCase()));
  },[searches,leadCat,leadStatus,leadMonth,localLeads,outreach]);

  const filteredBB = vendors.filter(b=>(bbCat==="All"||b.category===bbCat)&&(bbLocation==="All"||b.location===bbLocation)&&(!getSearch("Vendors")||b.name.toLowerCase().includes(getSearch("Vendors").toLowerCase())));

  const [outreachSort,setOutreachSort] = useState("date"); // "date" | "az"
  const outreachCategories = ["All",...Array.from(new Set(outreach.map(o=>o.category).filter(Boolean)))];
  const outreachMonths     = ["All",...Array.from(new Set(outreach.map(o=>getMonthLabel(o.date)).filter(Boolean)))];
  const filteredOutreach   = outreach.filter(o=>{
    if (o.status==="not_contacted") return false; // not_contacted items live in Leads
    const q=getSearch("Outreach").toLowerCase();
    return (!q||o.company.toLowerCase().includes(q)||o.clientName.toLowerCase().includes(q))&&(outreachCatFilter==="All"||o.category===outreachCatFilter)&&(outreachStatusFilter==="All"||o.status===outreachStatusFilter)&&(outreachMonthFilter==="All"||getMonthLabel(o.date)===outreachMonthFilter);
  }).sort((a,b)=>outreachSort==="az"
    ? (a.company||"").toLowerCase().localeCompare((b.company||"").toLowerCase())
    : (_parseDate(b.date)||new Date(0))-(_parseDate(a.date)||new Date(0)));

  // Dashboard todos — general and project kept strictly separate (projects = active only)
  const activeProjectIds = new Set(activeProjects.map(p=>p.id));
  const allProjectTodosFlat = Object.entries(projectTodos).flatMap(([pid,tlist])=>
    activeProjectIds.has(Number(pid)) ? (tlist||[]).map(t=>({...t,_source:"project",projectId:Number(pid)})) : []
  );
  const generalTodos = todos.filter(t=>!archivedTodos.find(a=>a.id===t.id)).map(t=>({...t,_source:"general"}));
  const projectTodosFlat = allProjectTodosFlat.filter(t=>!archivedTodos.find(a=>a.id===t.id));
  const allTodos = [...generalTodos,...projectTodosFlat];
  const filteredTodos = allTodos.filter(t=>{
    if (todoFilter==="todo") return t._source==="general" && !["later","longterm"].includes(t.subType);
    if (todoFilter==="general") return t._source==="general" && ["later","longterm"].includes(t.subType);
    if (todoFilter==="general-later") return t._source==="general" && t.subType==="later";
    if (todoFilter==="general-longterm") return t._source==="general" && t.subType==="longterm";
    if (todoFilter==="project") return t._source==="project";
    if (todoFilter.startsWith("project-")) return t._source==="project" && t.projectId===Number(todoFilter.replace("project-",""));
    return true;
  });
  const todoTopFilter = todoFilter==="todo"?"todo":todoFilter.startsWith("general")||todoFilter==="general"?"general":todoFilter.startsWith("project")||todoFilter==="project"?"project":"todo";

  const getProjectFiles    = (id,key) => (projectFiles[id]||{})[key]||[];
  const addProjectFiles    = (id,key,newFiles) => setProjectFiles(prev=>({...prev,[id]:{...(prev[id]||{}),[key]:[...getProjectFiles(id,key),...newFiles]}}));
  const getProjectCasting  = id => projectCasting[id]||[];
  const addCastingRow      = id => setProjectCasting(prev=>({...prev,[id]:[...(prev[id]||[]),{id:Date.now(),agency:"",name:"",email:"",option:"First Option"}]}));
  const updateCastingRow   = (id,rowId,field,val) => setProjectCasting(prev=>({...prev,[id]:(prev[id]||[]).map(r=>r.id===rowId?{...r,[field]:val}:r)}));
  const removeCastingRow   = (id,rowId) => setProjectCasting(prev=>({...prev,[id]:(prev[id]||[]).filter(r=>r.id!==rowId)}));

  const _aiSystem = `Extract contact info and return ONLY a raw JSON array with no markdown. Each item: {"company":"","clientName":"","role":"","email":"","phone":"","date":"YYYY-MM-DD","category":"","location":"","source":"Cold Outreach","notes":""}. Use location format like "Dubai, UAE" or "London, UK". If no date, use today's date.`;

  const processOutreach = async () => {
    if (!outreachMsg.trim()) return;
    setOutreachLoading(true);
    try {
      const data = await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:800,system:_aiSystem,messages:[{role:"user",content:outreachMsg}]});
      const parsed = JSON.parse((data?.content?.[0]?.text||"").replace(/```json|```/g,"").trim());
      const entries = (Array.isArray(parsed)?parsed:[parsed]).map(e=>({...e,status:"not_contacted",value:0}));
      const saved = await Promise.all(entries.map(e=>api.post("/api/outreach",e)));
      const newOutreach = saved.filter(e=>e.id);
      setOutreach(prev=>[...prev,...newOutreach]);
      setOutreachMsg("");
    } catch {}
    setOutreachLoading(false);
  };


  // Promote a lead/outreach entry to a client record when status → "client"
  const promoteToClient = async (entity) => {
    const company = (entity.company||"").trim();
    if (!company) return;
    if (localClients.some(c=>(c.company||"").toLowerCase()===company.toLowerCase())) return;
    const newClient = {
      company,
      name: entity.contact||entity.clientName||"",
      email: entity.email||"",
      phone: entity.phone||"",
      country: entity.location||"",
      notes: entity.notes||"",
    };
    const saved = await api.post("/api/clients", newClient);
    if (saved.id) setLocalClients(prev=>[...prev,saved]);
  };



  // ── Vault functions ───────────────────────────────────────────────────────────
  const unlockVault = async () => {
    if (!vaultPass.trim()) return;
    setVaultLoading(true); setVaultErr("");
    try {
      const key     = await vaultDeriveKey(vaultPass);
      const entries = await api.get("/api/resources");
      const meta    = Array.isArray(entries) ? entries.find(e=>e.type==="meta") : null;
      if (!meta) {
        // First-time setup — store verification blob
        const blob = await vaultEncrypt(key, VAULT_CHECK);
        await api.post("/api/resources", {type:"meta", blob});
        setVaultKey(key); setVaultResources([]); setVaultLocked(false);
      } else {
        const check = await vaultDecrypt(key, meta.blob);
        if (check !== VAULT_CHECK) { setVaultErr("Incorrect vault password"); setVaultLoading(false); return; }
        const decrypted = [];
        for (const e of (Array.isArray(entries)?entries:[]).filter(e=>e.type!=="meta")) {
          try { decrypted.push({...e,...(await vaultDecrypt(key,e.blob))}); } catch {}
        }
        setVaultKey(key); setVaultResources(decrypted); setVaultLocked(false);
      }
    } catch { setVaultErr("Incorrect vault password"); }
    setVaultLoading(false);
  };

  const vaultCopyPw = (id, password) => {
    navigator.clipboard.writeText(password);
    setVaultCopied(id);
    setTimeout(()=>setVaultCopied(null), 1800);
  };

  const addVaultPassword = async () => {
    if (!vaultNewPw.name.trim()||!vaultNewPw.password.trim()) return;
    setVaultSaving(true);
    const blob  = await vaultEncrypt(vaultKey, {type:"password",...vaultNewPw});
    const saved = await api.post("/api/resources", {type:"password", blob});
    if (saved.id) {
      setVaultResources(prev=>[...prev,{id:saved.id,type:"password",...vaultNewPw}]);
      setVaultNewPw({name:"",url:"",username:"",password:"",notes:""});
      setVaultAddPwOpen(false);
    }
    setVaultSaving(false);
  };

  const updateVaultPassword = async () => {
    if (!vaultNewPw.name.trim()||!vaultNewPw.password.trim()) return;
    setVaultSaving(true);
    const blob    = await vaultEncrypt(vaultKey, {type:"password",...vaultNewPw});
    const updated = await api.put(`/api/resources/${vaultEditId}`, {type:"password", blob});
    if (updated.id) {
      setVaultResources(prev=>prev.map(r=>r.id===vaultEditId?{...r,...vaultNewPw}:r));
      setVaultEditId(null); setVaultAddPwOpen(false); setVaultNewPw({name:"",url:"",username:"",password:"",notes:""});
    }
    setVaultSaving(false);
  };

  const addVaultFile = async (file) => {
    if (!file) return;
    setVaultSaving(true); setVaultFileErr("");
    try {
      const raw  = await new Promise(r=>{const fr=new FileReader();fr.onload=e=>r(e.target.result.split(",")[1]);fr.readAsDataURL(file);});
      const payload = {type:"file", name:vaultFileName||file.name, filename:file.name, mimetype:file.type, size:file.size, data:raw};
      const blob    = await vaultEncrypt(vaultKey, payload);
      const saved   = await api.post("/api/resources", {type:"file", blob});
      if (saved.id) {
        setVaultResources(prev=>[...prev,{id:saved.id,...payload}]);
        setVaultFileName(""); setVaultFileRef(null); setVaultFileErr("");
      } else {
        setVaultFileErr(saved.error || "Upload failed. Try a smaller file.");
      }
    } catch(e) { setVaultFileErr(e.message||"Upload failed. Try a smaller file."); }
    setVaultSaving(false);
  };

  const downloadVaultFile = (entry) => {
    const bytes = Uint8Array.from(atob(entry.data),c=>c.charCodeAt(0));
    const blob  = new Blob([bytes],{type:entry.mimetype||"application/octet-stream"});
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement("a"); a.href=url; a.download=entry.filename||entry.name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
  };

  const deleteVaultEntry = async (id) => {
    if (!confirm("Delete this entry? This cannot be undone.")) return;
    await api.delete(`/api/resources/${id}`);
    setVaultResources(prev=>prev.filter(r=>r.id!==id));
  };

  const processProjectAI = async p => {
    if (!aiMsg.trim()&&!attachedFile) return;
    setAiLoading(true);
    let fileData=null;
    if (attachedFile) fileData = await new Promise(resolve=>{const r=new FileReader();r.onload=e=>resolve(e.target.result.split(",")[1]);r.readAsDataURL(attachedFile);});
    const messages=[{role:"user",content:attachedFile?[{type:"image",source:{type:"base64",media_type:attachedFile.type,data:fileData}},{type:"text",text:`${aiMsg}\n\nExtract all financial info and return ONLY a JSON array, no markdown.`}]:aiMsg}];
    try {
      const data=await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:1200,system:"Extract expense/income entries for ONNA. Return ONLY a raw JSON array. Each entry: supplier, category, subCategory, invoiceNumber, receiptLink, datePaid, amount (number only), direction (in/out), notes.",messages});
      const parsed=JSON.parse((data?.content?.[0]?.text||"").replace(/```json|```/g,"").trim());
      setProjectEntries(prev=>({...prev,[p.id]:[...(prev[p.id]||[]),...(Array.isArray(parsed)?parsed:[parsed]).map((e,i)=>({...e,id:Date.now()+i}))]}));
      setAiMsg(""); setAttachedFile(null);
    } catch {}
    setAiLoading(false);
  };

  // ── Agent markdown renderer ───────────────────────────────────────────────────
  const fmtInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((p,i)=>{
      if (p.startsWith("**")&&p.endsWith("**")) return <strong key={i}>{p.slice(2,-2)}</strong>;
      if (p.startsWith("`")&&p.endsWith("`")) return <code key={i} style={{background:"rgba(0,0,0,0.07)",borderRadius:4,padding:"1px 5px",fontSize:"0.88em",fontFamily:"monospace"}}>{p.slice(1,-1)}</code>;
      return <span key={i}>{p}</span>;
    });
  };
  const renderAgentMd = (text) => {
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
      out.push(<div key={i} style={{lineHeight:1.6,marginBottom:1}}>{fmtInline(line)}</div>);
    });
    if (inTable) flushTable("end");
    return out;
  };

  // ── Agent streaming chat ──────────────────────────────────────────────────────
  const sendAgentMessage = async (agentId, userText) => {
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

  const generateContract = async p => {
    setContractLoading(true); setGeneratedContract("");
    const templates = {
      "Commissioning Agreement – Self Employed":`You are generating a COMMISSIONING AGREEMENT for ONNA. Fill in ALL fields with the provided details and output a complete, professional agreement. Structure:\n\nONNA\nCOMMISSIONING AGREEMENT\n\nCOMMERCIAL TERMS\nCommencement Date: [date]\nCommissioner: ONNA FILM TV RADIO PRODUCTION SERVICES LLC\nCommissionee: [commissionee name]\nRole/Services: [role]\nProject: [project]\nDeadline: [deadline]\nFee: [fee]\nPayment Terms: [payment terms]\nDeliverables: [deliverables]\nUsage Rights: [usage rights]\n\nSIGNATURE\nSigned for ONNA: _______________  Date: ______\nSigned by Commissionee: _______________  Date: ______\n\nGENERAL TERMS\n[Include all standard ONNA general terms: IP assignment, confidentiality, warranties, indemnity, termination, force majeure, governing law — Dubai courts]`,
      "Commissioning Agreement – Via PSC":`Generate a COMMISSIONING AGREEMENT VIA PSC for ONNA. Commercial terms:\n\nONNA\nCOMMISSIONING AGREEMENT – VIA PSC\n\nCOMMERCIAL TERMS\nCommencement Date: [date]\nCommissioner: ONNA FILM TV RADIO PRODUCTION SERVICES LLC\nCommissionee (PSC): [commissionee name]\nIndividual: [individual name]\nRole/Services: [role]\nProject: [project]\nDeadline: [deadline]\nFee: [fee]\nPayment Terms: [payment terms]\nDeliverables: [deliverables]\nUsage Rights: [usage rights]\n\nSIGNATURE\nSigned for ONNA: _______________  Date: ______\nSigned by PSC: _______________  Date: ______\n\nGENERAL TERMS\n[Include all standard PSC terms: IP assignment by PSC and Individual jointly, confidentiality, warranties, joint indemnity, termination, governing law — Dubai]`,
      "Talent Agreement":`Generate a TALENT AGREEMENT for ONNA. Structure:\n\nONNA\nTALENT AGREEMENT – COMMERCIAL TERMS\n\nCommencement Date: [date]\nAgency: ONNA FILM TV RADIO PRODUCTION SERVICES LLC\nClient/Brand: [project client]\nTalent Name: [commissionee]\nRole/Services: [role]\nShoot Date: [shoot date]\nFee: [fee]\nPayment Terms: NET 60 days from invoice\nDeliverables/Usage: [usage rights]\nDeadline: [deadline]\n\nSIGNATURE\nSigned for ONNA: _______________  Date: ______\nSigned by Talent/Agent: _______________  Date: ______\n\nGENERAL TERMS\n[Include: commencement, supply of services, warranties, image waiver, IP assignment, charges/payment, termination, governing law — Dubai/UK]`,
      "Talent Agreement – Via PSC":`Generate a TALENT AGREEMENT VIA PSC for ONNA. Structure:\n\nONNA\nTALENT AGREEMENT VIA PSC – COMMERCIAL TERMS\n\nCommencement Date: [date]\nAgency: ONNA FILM TV RADIO PRODUCTION SERVICES LLC\nClient/Brand: [project client]\nPSC Name: [commissionee]\nTalent Name: [individual]\nRole/Services: [role]\nShoot Date: [shoot date]\nFee: [fee]\nDeliverables/Usage: [usage rights]\n\nSIGNATURE\nSigned for ONNA: _______________  Date: ______\nSigned by PSC: _______________  Date: ______\n\nGENERAL TERMS\n[Include PSC-specific terms: PSC procures talent compliance, joint IP assignment, image waiver, indemnity, payment via PSC, governing law — Dubai/UK]`,
    };
    try {
      const data=await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:2000,system:templates[contractType]||templates["Commissioning Agreement – Self Employed"],messages:[{role:"user",content:`Generate the contract with these details:\nProject: ${p.client} — ${p.name}\nCommissionee: ${contractFields.commissionee}\nIndividual: ${contractFields.individual}\nRole: ${contractFields.role}\nFee: ${contractFields.fee}\nShoot Date: ${contractFields.shootDate}\nDeliverables: ${contractFields.deliverables}\nUsage Rights: ${contractFields.usageRights}\nPayment Terms: ${contractFields.paymentTerms}\nDeadline: ${contractFields.deadline}\nProject Ref: ${contractFields.projectRef}`}]});
      setGeneratedContract(data?.content?.[0]?.text || data?.error || "No output received.");
    } catch(e) { setGeneratedContract("Error: " + e.message); }
    setContractLoading(false);
  };

  const riskSystemPrompt = `You are a production coordinator for ONNA (Dubai & London). Generate a Risk Assessment using markdown tables.\n\nFormat:\nRISK ASSESSMENT\nSHOOT NAME: [name]\nSHOOT DATE: [date]\nLOCATION: [location]\nCREW ON SET: [number]\nTIMING: [times]\n\n1. ENVIRONMENTAL & TERRAIN RISKS\n| Hazard | Risk Level | Who is at Risk | Mitigation Strategy |\n|--------|------------|----------------|---------------------|\n\n2. [SHOOT-SPECIFIC SECTION]\n| Hazard | Risk Level | Who is at Risk | Mitigation Strategy |\n|--------|------------|----------------|---------------------|\n\n3. TECHNICAL EQUIPMENT RISKS\n| Hazard | Risk Level | Who is at Risk | Mitigation Strategy |\n|--------|------------|----------------|---------------------|\n\n4. BRAND & PRIVACY\n| Hazard | Risk Level | Who is at Risk | Control Measures |\n|--------|------------|----------------|------------------|\n\n5. PROFESSIONAL CODE OF CONDUCT\n• Client Relations, Anti-Harassment (Zero Tolerance), General Conduct\n\n6. LIABILITY WAIVER\n• Transport, Health, Safety Gear\n\nEMERGENCY RESPONSE PLAN\n| Contact | Details |\n|---------|---------|\n| Emergency | 999 / 998 / 997 |\n| Production Lead (Emily) | +971 585 608 616 |\n\n@ONNAPRODUCTION | DUBAI & LONDON`;

  const callSheetSystemPrompt = `You are a production coordinator for ONNA. Generate a Call Sheet using markdown tables.\n\nCALL SHEET\n**ALL CREW MUST BRING VALID EMIRATES ID TO SET**\n\nSHOOT NAME: [name]\nSHOOT DATE: [date]\nSHOOT ADDRESS: [address]\n\nPRODUCTION ON SET: EMILY LUCAS +971 585 608 616\n\nSCHEDULE\n| Time | Activity |\n|------|-----------|\n\nCREW\n| Role | Name | Mobile | Email | Call Time |\n|------|------|--------|-------|-----------|\n| PRODUCER | EMILY LUCAS | +971 585 608 616 | EMILY@ONNAPRODUCTION.COM | [time] |\n\nINVOICING\n| | |\n|-|-|\n| Payment Terms | NET 30 days |\n| Send To | accounts@onnaproduction.com |\n| Billing | ONNA FILM, TV & RADIO PRODUCTION SERVICES LLC., OFFICE F1-022, DUBAI |\n\nEMERGENCY SERVICES\n| Service | Contact |\n|---------|---------|\n| Police/Ambulance/Fire | 999 / 998 / 997 |\n\n@ONNAPRODUCTION | DUBAI & LONDON`;

  const changeTab = tab => {
    setActiveTab(tab); setSelectedProject(null); setProjectSection("Home"); setCreativeSubSection(null);setBudgetSubSection(null);setDocumentsSubSection(null);setScheduleSubSection(null);
    if (tab!=="Resources") { setVaultLocked(true); setVaultKey(null); setVaultPass(""); setVaultResources([]); setVaultErr(""); setVaultPwSearch(""); }
    if (tab==="Notes"&&notes.length===0&&!notesLoading) {
      setNotesLoading(true);
      api.get("/api/notes").then(data=>{ setNotes(Array.isArray(data)?data:[]); setNotesLoading(false); }).catch(()=>setNotesLoading(false));
    }
  };

  // ── Add-new helper for dynamic dropdowns ──────────────────────────────────
  const addNewOption = (currentList, setter, storageKey, prompt_label) => {
    const val = window.prompt(prompt_label);
    if (!val || !val.trim()) return null;
    const trimmed = val.trim();
    if (currentList.includes(trimmed)) return trimmed;
    const updated = [...currentList, trimmed];
    setter(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
    return trimmed;
  };

  // Remove custom options that are no longer used by any item
  const pruneCustom = (items, fieldName, customList, setter, storageKey) => {
    const used = new Set(items.map(i=>i[fieldName]).filter(Boolean));
    const pruned = customList.filter(opt=>used.has(opt));
    if (pruned.length !== customList.length) {
      setter(pruned);
      try { localStorage.setItem(storageKey, JSON.stringify(pruned)); } catch {}
    }
  };

  // ── Category manager helpers ──────────────────────────────────────────────
  const deleteCat = async (type, cat) => {
    setCatSaving(true);
    const isLead = type === 'lead';
    const builtin = isLead ? LEAD_CATEGORIES.includes(cat) : VENDORS_CATEGORIES.includes(cat);
    const records = isLead ? localLeads : vendors;
    const affected = records.filter(r => r.category === cat);
    for (const r of affected) {
      const {id, ...fields} = r;
      try {
        if (isLead) {
          await api.put(`/api/leads/${id}`, {...fields, category:'', value:Number(fields.value)||0});
          setLocalLeads(prev => prev.map(x => x.id===id ? {...x,category:''} : x));
        } else {
          await api.put(`/api/vendors/${id}`, {...fields, category:''});
          setVendors(prev => prev.map(x => x.id===id ? {...x,category:''} : x));
        }
      } catch {}
    }
    if (builtin) {
      const key = isLead ? 'onna_hidden_lead_cats' : 'onna_hidden_vendor_cats';
      const setter = isLead ? setHiddenLeadBuiltins : setHiddenVendorBuiltins;
      setter(prev => { const u=[...prev,cat]; try{localStorage.setItem(key,JSON.stringify(u));}catch{} return u; });
    } else {
      if (isLead) {
        const u = customLeadCats.filter(c=>c!==cat);
        setCustomLeadCats(u); try{localStorage.setItem('onna_lead_cats',JSON.stringify(u));}catch{}
      } else {
        const u = customVendorCats.filter(c=>c!==cat);
        setCustomVendorCats(u); try{localStorage.setItem('onna_vendor_cats',JSON.stringify(u));}catch{}
      }
    }
    setCatSaving(false);
  };

  const renameCat = async (type, oldCat, newCat) => {
    if (!newCat.trim() || newCat.trim()===oldCat) { setCatEdit(null); return; }
    setCatSaving(true);
    const isLead = type === 'lead';
    const records = isLead ? localLeads : vendors;
    const affected = records.filter(r => r.category === oldCat);
    for (const r of affected) {
      const {id, ...fields} = r;
      try {
        if (isLead) {
          await api.put(`/api/leads/${id}`, {...fields, category:newCat.trim(), value:Number(fields.value)||0});
          setLocalLeads(prev => prev.map(x => x.id===id ? {...x,category:newCat.trim()} : x));
        } else {
          await api.put(`/api/vendors/${id}`, {...fields, category:newCat.trim()});
          setVendors(prev => prev.map(x => x.id===id ? {...x,category:newCat.trim()} : x));
        }
      } catch {}
    }
    if (isLead) {
      const u = customLeadCats.map(c=>c===oldCat?newCat.trim():c);
      setCustomLeadCats(u); try{localStorage.setItem('onna_lead_cats',JSON.stringify(u));}catch{}
    } else {
      const u = customVendorCats.map(c=>c===oldCat?newCat.trim():c);
      setCustomVendorCats(u); try{localStorage.setItem('onna_vendor_cats',JSON.stringify(u));}catch{}
    }
    setCatEdit(null); setCatSaving(false);
  };

  // ── Extra contacts helpers (localStorage) ─────────────────────────────────
  const getXContacts = (type, id) => { try { return JSON.parse(localStorage.getItem(`onna_xc_${type}_${id}`) || '[]'); } catch { return []; } };
  const setXContacts = (type, id, arr) => { try { localStorage.setItem(`onna_xc_${type}_${id}`, JSON.stringify(arr)); } catch {} };

  // ── Archive helpers ──────────────────────────────────────────────────────────
  const archiveItem = (table, item) => {
    const entry = {id:Date.now(), table, item, deletedAt:new Date().toISOString()};
    setArchive(prev=>{
      const updated=[entry,...prev];
      try{localStorage.setItem('onna_archive',JSON.stringify(updated));}catch{}
      return updated;
    });
  };

  const restoreItem = async (entry) => {
    const {id:archiveId, table, item} = entry;
    const {id:_origId, ...fields} = item;
    const saved = await api.post(`/api/${table}`, fields);
    if (saved.id) {
      if (table==='leads') setLocalLeads(prev=>[...prev,saved]);
      else if (table==='vendors') setVendors(prev=>[...prev,saved]);
      else if (table==='outreach') setOutreach(prev=>[...prev,saved]);
    }
    setArchive(prev=>{
      const updated=prev.filter(e=>e.id!==archiveId);
      try{localStorage.setItem('onna_archive',JSON.stringify(updated));}catch{}
      return updated;
    });
  };

  const permanentlyDelete = (archiveId) => {
    setArchive(prev=>{
      const updated=prev.filter(e=>e.id!==archiveId);
      try{localStorage.setItem('onna_archive',JSON.stringify(updated));}catch{}
      return updated;
    });
  };

  const allLeadLocs  = ["All","London, UK","Dubai, UAE","New York, USA","Los Angeles, USA",...customLeadLocs,"＋ Add location"];
  const allLeadCats  = [...LEAD_CATEGORIES.filter(c=>!hiddenLeadBuiltins.includes(c)),...customLeadCats,"＋ Add category"];
  const allVendorCats = ["All",...VENDORS_CATEGORIES.filter(c=>!hiddenVendorBuiltins.includes(c)),...customVendorCats,"＋ Add category"];
  const allVendorLocs = [...BB_LOCATIONS,...customVendorLocs,"＋ Add location"];

  // ─── PROJECT SECTION RENDERER ──────────────────────────────────────────────
  const renderProjectSection = p => {
    const entries    = projectEntries[p.id]||[];
    const quotes     = getProjectFiles(p.id,"quotes");
    const allEntries = [...entries,...quotes.map((f,i)=>({id:`q_${i}`,supplier:f.name,category:"Quote",subCategory:"",invoiceNumber:"",receiptLink:"",datePaid:"",amount:"",direction:"out",notes:"Uploaded quote"}))];
    const totalIn    = entries.filter(e=>e.direction==="in").reduce((a,b)=>a+Number(b.amount),0);
    const totalOut   = entries.filter(e=>e.direction==="out").reduce((a,b)=>a+Number(b.amount),0);
    const profit     = totalIn-totalOut;
    const margin     = totalIn>0?Math.round((profit/totalIn)*100):0;

    const SECTION_META = {
      "Creative":       {emoji:"🎨",count:`${((projectFileStore[p.id]||{}).moodboards||[]).length+((projectFileStore[p.id]||{}).briefs||[]).length} files`},
      "Budget":         {emoji:"📊",count:`${(projectEstimates[p.id]||[]).length} estimate(s), ${quotes.length} quote(s)`},
      "Documents":      {emoji:"📁",count:"Call sheets, contracts & more"},
      "Locations":      {emoji:"📍",count:"Add folder link"},
      "Casting":        {emoji:"🎭",count:`${getProjectCasting(p.id).length} models`},
      "Styling":        {emoji:"👗",count:`${getProjectFiles(p.id,"styling").length} files`},
      "Travel":         {emoji:"✈️",count:"Flights, hotels & logistics"},
      "Schedule":       {emoji:"📒",count:"Production, pre & post"},
    };

    // mini stat card used in project sections
    const MiniStat = ({label,value}) => (
      <div style={{borderRadius:14,padding:"18px 20px",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6,fontWeight:500}}>{label}</div>
        <div style={{fontSize:22,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>{value}</div>
      </div>
    );

    if (projectSection==="Home") return (
      <div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:14,marginBottom:isMobile?16:28}}>
          {[["Total Revenue",`AED ${totalIn.toLocaleString()}`,"income"],["Total Expenses",`AED ${totalOut.toLocaleString()}`,"outgoings"],["Net Profit",`AED ${profit.toLocaleString()}`,"revenue − expenses"],["Margin",`${margin}%`,"net / revenue"]].map(([l,v,s])=>(
            <div key={l} style={{borderRadius:16,padding:"20px 22px",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8,fontWeight:500}}>{l}</div>
              <div style={{fontSize:24,fontWeight:700,color:T.text,letterSpacing:"-0.02em",marginBottom:3}}>{v}</div>
              <div style={{fontSize:11,color:T.muted}}>{s}</div>
            </div>
          ))}
        </div>
        {/* Project To-Do List */}
        <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:24,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",gap:8,background:"#fafafa"}}>
            <span style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,flex:1}}>Project To-Do</span>
            <span style={{fontSize:11,color:T.muted}}>{(projectTodos[p.id]||[]).filter(t=>!archivedTodos.find(a=>a.id===t.id)&&!t.done).length} open</span>
          </div>
          <ProjectTodoList projectId={p.id} projectTodos={projectTodos} setProjectTodos={setProjectTodos} archivedTodos={archivedTodos} setArchivedTodos={setArchivedTodos}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:10}}>
          {PROJECT_SECTIONS.filter(s=>s!=="Home").map(sec=>{
            const meta=SECTION_META[sec]||{emoji:"📁",count:"Click to open"};
            return (
              <div key={sec} onClick={()=>{setProjectSection(sec);setCreativeSubSection(null);setBudgetSubSection(null);setDocumentsSubSection(null);setScheduleSubSection(null);}} className="proj-card" style={{borderRadius:14,padding:"16px 18px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <span style={{fontSize:20,flexShrink:0}}>{meta.emoji}</span>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13.5,fontWeight:500,color:T.text,marginBottom:2}}>{sec}</div>
                  <div style={{fontSize:11,color:T.muted}}>{meta.count}</div>
                </div>
                <span style={{marginLeft:"auto",color:T.muted,fontSize:14,flexShrink:0}}>›</span>
              </div>
            );
          })}
        </div>
      </div>
    );

    if (projectSection==="Creative") {
      const storeFiles = (projectFileStore[p.id]||{});
      const moodFiles = storeFiles.moodboards||[];
      const briefFiles = storeFiles.briefs||[];

      const addStoredFiles = async (category, fileList) => {
        const newEntries = [];
        for (const f of fileList) {
          if (f.size > 40*1024*1024) { alert(`"${f.name}" is over 40 MB. Please use the Dropbox / Drive link for very large files.`); continue; }
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

      // Sub-section file manager
      const renderFileManager = (category, label, linkKey) => {
        const files = category==="moodboards"?moodFiles:briefFiles;
        const link = (projectCreativeLinks[p.id]||{})[linkKey]||"";
        return (
          <div>
            <button onClick={()=>{setCreativeSubSection(null);setBudgetSubSection(null);setDocumentsSubSection(null);setScheduleSubSection(null);}} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>‹ Back to Creative</button>
            <div style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:4}}>{label}</div>
            <p style={{fontSize:12.5,color:T.muted,marginBottom:18}}>Upload versioned files or link a Dropbox / Drive folder.</p>
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Dropbox / Drive Link</div>
              <div style={{display:"flex",gap:10}}>
                <input value={link} onChange={e=>setProjectCreativeLinks(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),[linkKey]:e.target.value}}))} placeholder="https://www.dropbox.com/sh/..." style={{flex:1,padding:"9px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                {link&&<a href={link} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",padding:"9px 18px",borderRadius:10,background:T.accent,color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none",flexShrink:0}}>Open ↗</a>}
              </div>
            </div>
            <UploadZone label={`Upload ${label.toLowerCase()} files (PDF, images)`} files={[]} onAdd={f=>addStoredFiles(category,f)}/>
            {files.length>0&&(
              <>
                <div style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,marginTop:22,marginBottom:6}}>{files.length} file{files.length!==1?"s":""} uploaded</div>
                <FileVersionList files={files} category={category}/>
              </>
            )}
          </div>
        );
      };

      // Sub-navigation: show two cards if no sub-section selected
      if (!creativeSubSection) return (
        <div>
          <p style={{fontSize:13,color:T.sub,marginBottom:18}}>Creative assets for this project.</p>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:12}}>
            {[["moodboard","Moodboard","🎨",moodFiles],["brief","Brief","📋",briefFiles]].map(([key,label,emoji,files])=>(
              <div key={key} onClick={()=>setCreativeSubSection(key)} className="proj-card" style={{borderRadius:14,padding:"22px 22px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <span style={{fontSize:28,flexShrink:0}}>{emoji}</span>
                <div style={{minWidth:0,flex:1}}>
                  <div style={{fontSize:15,fontWeight:600,color:T.text,marginBottom:3}}>{label}</div>
                  <div style={{fontSize:12,color:T.muted}}>{files.length} file{files.length!==1?"s":""}</div>
                </div>
                <span style={{color:T.muted,fontSize:16,flexShrink:0}}>›</span>
              </div>
            ))}
          </div>
        </div>
      );

      if (creativeSubSection==="moodboard") return renderFileManager("moodboards","Moodboard","moodboard");
      if (creativeSubSection==="brief") return renderFileManager("briefs","Brief","brief");
    }

    if (projectSection==="Budget") {
      const estimates    = projectEstimates[p.id]||[];
      const versionLabels= ["V1","V2","V3","V4","V5"];

      // Budget sub-navigation
      if (!budgetSubSection) return (
        <div>
          <p style={{fontSize:13,color:T.sub,marginBottom:18}}>Budget management for this project.</p>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:12}}>
            {[["tracker","Budget Tracker","💰","Track income & expenses"],["estimates","Estimates","📋",`${estimates.length} version(s)`],["quotations","Quotations","💬",`${quotes.length} quote(s)`]].map(([key,label,emoji,desc])=>(
              <div key={key} onClick={()=>setBudgetSubSection(key)} className="proj-card" style={{borderRadius:14,padding:"22px 22px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <span style={{fontSize:28,flexShrink:0}}>{emoji}</span>
                <div style={{minWidth:0,flex:1}}>
                  <div style={{fontSize:15,fontWeight:600,color:T.text,marginBottom:3}}>{label}</div>
                  <div style={{fontSize:12,color:T.muted}}>{desc}</div>
                </div>
                <span style={{color:T.muted,fontSize:16,flexShrink:0}}>›</span>
              </div>
            ))}
          </div>
        </div>
      );

      // Budget Tracker sub-section
      if (budgetSubSection==="tracker") return (
        <div>
          <button onClick={()=>{setBudgetSubSection(null);}} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>‹ Back to Budget</button>
          <div style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:18}}>Budget Tracker</div>
          <div style={{padding:52,textAlign:"center",color:T.muted,fontSize:13,borderRadius:14,background:T.surface,border:`1px solid ${T.border}`}}>Budget tracker coming soon — track project income, expenses, and profit here.</div>
        </div>
      );

      // Quotations sub-section
      if (budgetSubSection==="quotations") return (
        <div>
          <button onClick={()=>{setBudgetSubSection(null);}} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>‹ Back to Budget</button>
          <div style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:14}}>Quotations</div>
          <p style={{fontSize:13,color:T.sub,marginBottom:16}}>Upload supplier quotes here. They will also appear in the Finances table under the "Quote" category.</p>
          <UploadZone label="Upload supplier quotes (PDF, images)" files={quotes} onAdd={f=>addProjectFiles(p.id,"quotes",f)}/>
        </div>
      );

      // Estimates sub-section (existing estimates code below)
      if (budgetSubSection!=="estimates") return null;
      if (editingEstimate) {
        const est      = editingEstimate;
        const subtotal = est.lineItems.filter(l=>l.cat!=="18").reduce((a,b)=>a+Number(b.aed),0);
        const fees     = est.lineItems.filter(l=>l.cat==="18").reduce((a,b)=>a+Number(b.aed),0);
        const total    = subtotal+fees; const vat=total*0.05; const grand=total+vat; const advance=grand*0.5;
        return (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
              <button onClick={()=>setEditingEstimate(null)} style={{background:"none",border:"none",color:T.sub,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,display:"flex",alignItems:"center",gap:4,fontWeight:500}}>‹ Back</button>
              <span style={{fontSize:12,color:T.muted}}>Editing {est.version}</span>
              <div style={{marginLeft:"auto",display:"flex",gap:8}}>
                <BtnSecondary onClick={()=>navigator.clipboard.writeText(generateEstimateText(est,subtotal,fees,total,vat,grand,advance))}>Copy</BtnSecondary>
                <BtnExport onClick={()=>exportToPDF(buildEstimateHTML(est),`Production Estimate ${est.version} — ${est.project||p.name}`)}>Export PDF</BtnExport>
                <BtnPrimary onClick={()=>{const id=Date.now();const nextV=versionLabels[estimates.length]||`V${estimates.length+1}`;setProjectEstimates(prev=>({...prev,[p.id]:[...(prev[p.id]||[]),{...est,id,version:nextV}]}));setEditingEstimate(null);}}>Save as {versionLabels[estimates.length]||`V${estimates.length+1}`}</BtnPrimary>
              </div>
            </div>
            <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,padding:20,marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[["Date","date"],["Client","client"],["Project","project"],["Attention","attention"],["Photographer / Director","photographer"],["Deliverables","deliverables"],["Deadlines","deadlines"],["Usage Terms","usageTerms"],["Shoot Date","shootDate"],["Shoot Location","shootLocation"],["Payment Terms","paymentTerms"]].map(([label,key])=>(
                  <div key={key}>
                    <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:5,fontWeight:500}}>{label}</div>
                    <input value={est[key]||""} onChange={e=>setEditingEstimate(prev=>({...prev,[key]:e.target.value}))} style={{width:"100%",padding:"8px 11px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                  </div>
                ))}
              </div>
            </div>
            <div style={{borderRadius:14,overflow:"hidden",background:T.surface,border:`1px solid ${T.border}`,marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><TH>#</TH><TH>Category</TH><TH>AED</TH><TH>USD (×0.27)</TH></tr></thead>
                <tbody>
                  {est.lineItems.map((li,idx)=>(
                    <tr key={li.cat} style={{background:idx%2===0?"transparent":"#fafafa"}}>
                      <TD muted>{li.cat}</TD><TD bold>{li.name}</TD>
                      <td style={{padding:"9px 14px",borderBottom:`1px solid ${T.borderSub}`}}>
                        <input type="number" value={li.aed} onChange={e=>setEditingEstimate(prev=>({...prev,lineItems:prev.lineItems.map((l,i)=>i===idx?{...l,aed:Number(e.target.value)}:l)}))} style={{width:120,padding:"6px 9px",borderRadius:8,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:12.5,fontFamily:"inherit"}}/>
                      </td>
                      <TD muted>{li.aed?(li.aed*0.27).toLocaleString(undefined,{maximumFractionDigits:2}):"—"}</TD>
                    </tr>
                  ))}
                  <tr style={{background:"#f5f5f7"}}><td colSpan={2} style={{padding:"11px 14px",fontSize:12.5,fontWeight:600,color:T.text,borderTop:`1px solid ${T.border}`}}>SUBTOTAL</td><TD bold>AED ${total.toLocaleString()}</TD><TD muted>${(total*0.27).toLocaleString(undefined,{maximumFractionDigits:0})}</TD></tr>
                  <tr><td colSpan={2} style={{padding:"11px 14px",fontSize:12.5,color:T.sub}}>VAT (5%)</td><TD muted>AED ${vat.toLocaleString(undefined,{maximumFractionDigits:2})}</TD><TD muted/></tr>
                  <tr style={{background:T.accent}}><td colSpan={2} style={{padding:"11px 14px",fontSize:13,fontWeight:700,color:"#fff"}}>GRAND TOTAL</td><td style={{padding:"11px 14px",fontSize:13,fontWeight:700,color:"#fff"}}>AED ${grand.toLocaleString(undefined,{maximumFractionDigits:2})}</td><td style={{padding:"11px 14px",fontSize:12,color:"rgba(255,255,255,0.7)"}}>${(grand*0.27).toLocaleString(undefined,{maximumFractionDigits:0})}</td></tr>
                  <tr style={{background:"#f5f5f7"}}><td colSpan={2} style={{padding:"11px 14px",fontSize:12.5,color:T.sub}}>50% ADVANCE</td><TD muted>AED ${advance.toLocaleString(undefined,{maximumFractionDigits:2})}</TD><TD muted/></tr>
                </tbody>
              </table>
            </div>
            <div>
              <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6,fontWeight:500}}>Notes</div>
              <textarea value={est.notes||""} onChange={e=>setEditingEstimate(prev=>({...prev,notes:e.target.value}))} rows={3} style={{width:"100%",padding:"10px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none"}}/>
            </div>
          </div>
        );
      }
      return (
        <div>
          <button onClick={()=>{setBudgetSubSection(null);}} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>‹ Back to Budget</button>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{fontSize:18,fontWeight:700,color:T.text}}>Estimates</div>
            <BtnPrimary onClick={()=>setEditingEstimate({...initColumbiaEstimate,id:null,version:versionLabels[estimates.length]||`V${estimates.length+1}`,client:p.client,project:p.name})}>+ New Estimate</BtnPrimary>
          </div>
          {estimates.length===0?<div style={{padding:52,textAlign:"center",color:T.muted,fontSize:13,borderRadius:14,background:T.surface,border:`1px solid ${T.border}`}}>No estimates yet — click above to create one.</div>:(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {estimates.map(est=>{
                const sub=est.lineItems?.reduce((a,b)=>a+Number(b.aed),0)||0; const vat=sub*0.05; const grand=sub+vat;
                return (
                  <div key={est.id} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                    <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:6,background:"#f5f5f7",color:T.sub,border:`1px solid ${T.border}`}}>{est.version}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13.5,fontWeight:500,color:T.text}}>{est.project||p.name}</div>
                      <div style={{fontSize:11.5,color:T.muted,marginTop:2}}>{est.date} · AED ${grand.toLocaleString(undefined,{maximumFractionDigits:0})} inc. VAT</div>
                    </div>
                    <BtnSecondary small onClick={()=>setEditingEstimate({...est})}>Edit</BtnSecondary>
                    <BtnSecondary small onClick={()=>navigator.clipboard.writeText(generateEstimateText(est,sub,0,sub,vat,grand,grand*0.5))}>Copy</BtnSecondary>
                    <BtnExport onClick={()=>exportToPDF(buildEstimateHTML(est),`Production Estimate ${est.version} — ${est.project||p.name}`)}>PDF</BtnExport>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (projectSection==="Documents") {
      // Documents sub-navigation — Call Sheet, Risk Assessment, Contracts, Permits
      const DOC_CARDS = [
        {key:"callsheet",  emoji:"📋", label:"Call Sheet"},
        {key:"risk",       emoji:"⚠️", label:"Risk Assessment"},
        {key:"contracts",  emoji:"📝", label:"Contracts"},
        {key:"permits",    emoji:"📄", label:"Permits"},
      ];

      if (!documentsSubSection) return (
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
          {DOC_CARDS.map(c=>(
            <div key={c.key} onClick={()=>setDocumentsSubSection(c.key)} className="proj-card" style={{borderRadius:14,padding:"22px 20px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",transition:"border-color 0.15s"}}>
              <span style={{fontSize:28}}>{c.emoji}</span>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.text}}>{c.label}</div>
                <div style={{fontSize:12,color:T.muted,marginTop:2}}>Open {c.label.toLowerCase()}</div>
              </div>
            </div>
          ))}
        </div>
      );

      // Back button for all document sub-sections
      const docBack = <button onClick={()=>setDocumentsSubSection(null)} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>‹ Back to Documents</button>;

      if (documentsSubSection==="callsheet") {
        const csData = callSheetStore[p.id] || JSON.parse(JSON.stringify(CALLSHEET_INIT));
        const csU = (path, val) => {
          setCallSheetStore(prev => {
            const store = JSON.parse(JSON.stringify(prev));
            const d = store[p.id] || JSON.parse(JSON.stringify(CALLSHEET_INIT));
            const k = path.split("."); let o = d;
            for (let i = 0; i < k.length - 1; i++) o = o[k[i]];
            o[k[k.length - 1]] = val;
            store[p.id] = d; return store;
          });
        };
        const csSet = (fn) => {
          setCallSheetStore(prev => {
            const store = JSON.parse(JSON.stringify(prev));
            store[p.id] = fn(store[p.id] || JSON.parse(JSON.stringify(CALLSHEET_INIT)));
            return store;
          });
        };
        const addScheduleRow = () => csSet(d => ({...d, schedule:[...d.schedule,{time:"",activity:"",notes:""}]}));
        const rmScheduleRow = i => csSet(d => ({...d, schedule:d.schedule.filter((_,j)=>j!==i)}));
        const addVenueRow = () => csSet(d => ({...d, venueRows:[...d.venueRows,{label:"",value:""}]}));
        const rmVenueRow = i => csSet(d => ({...d, venueRows:d.venueRows.filter((_,j)=>j!==i)}));
        const addCrew = di => csSet(d => {d.departments[di].crew.push({role:"",name:"",mobile:"",email:"",callTime:""}); return d;});
        const rmCrew = (di,ci) => csSet(d => {d.departments[di].crew.splice(ci,1); return d;});
        const addDept = () => csSet(d => ({...d, departments:[...d.departments,{name:"NEW DEPARTMENT",crew:[{role:"",name:"",mobile:"",email:"",callTime:""}]}]}));
        const rmDept = i => csSet(d => ({...d, departments:d.departments.filter((_,j)=>j!==i)}));
        const addEmergencyNum = () => csSet(d => ({...d, emergencyNumbers:[...d.emergencyNumbers,{label:"",number:""}]}));
        const rmEmergencyNum = i => csSet(d => ({...d, emergencyNumbers:d.emergencyNumbers.filter((_,j)=>j!==i)}));

        const csLbl = {fontSize:9,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:CS_LS};
        const csDeptBg = "#F4F4F4";
        const csSecTitle = {fontSize:10,fontWeight:800,letterSpacing:CS_LS,textTransform:"uppercase",borderBottom:"2px solid #000",paddingBottom:5,marginBottom:10};
        const csTh = {padding:"5px 4px",fontSize:9,fontWeight:800,letterSpacing:CS_LS,color:"#555",background:"#fff",textTransform:"uppercase",whiteSpace:"nowrap"};

        return (
          <div>
            {docBack}
            <div style={{background:"#EDEDED",padding:"24px 12px",fontFamily:CS_FONT,borderRadius:14}}>
              <div style={{maxWidth:880,margin:"0 auto",background:"#FFFFFF"}}>

                {/* TOP BAR */}
                <div style={{padding:"22px 32px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:30,fontWeight:400,letterSpacing:1,color:"#000",fontFamily:"'Didot', serif"}}>onna</span>
                  <div style={{display:"flex",gap:16,alignItems:"center"}}>
                    <CSLogoSlot label="Agency Logo" image={csData.agencyLogo} onUpload={v=>csU("agencyLogo",v)} onRemove={()=>csU("agencyLogo",null)}/>
                    <CSLogoSlot label="Client Logo" image={csData.clientLogo} onUpload={v=>csU("clientLogo",v)} onRemove={()=>csU("clientLogo",null)}/>
                  </div>
                </div>
                <div style={{height:3,background:"#000",margin:"0 32px"}}/>

                <div style={{textAlign:"center",padding:"20px 32px 4px"}}>
                  <div style={{fontSize:12,fontWeight:800,letterSpacing:CS_LS,color:"#000"}}>CALL SHEET</div>
                </div>

                <div style={{padding:"8px 32px 16px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:24,fontWeight:800,letterSpacing:CS_LS,lineHeight:1.1}}>
                      <CSEditField value={csData.shootName} onChange={v=>csU("shootName",v)} bold isPlaceholder style={{fontSize:24,letterSpacing:CS_LS}} placeholder="SHOOT NAME"/>
                    </div>
                    <div style={{marginTop:6}}>
                      <CSEditField value={csData.date} onChange={v=>csU("date",v)} isPlaceholder style={{fontSize:10,color:"#000",fontWeight:600,letterSpacing:CS_LS}} placeholder="DAY & DATE"/>
                    </div>
                  </div>
                  <div style={{fontSize:12,fontWeight:700,letterSpacing:CS_LS,color:"#000",paddingTop:4,whiteSpace:"nowrap"}}>
                    SHOOT DAY <CSEditField value={csData.dayNumber} onChange={v=>csU("dayNumber",v)} bold isPlaceholder style={{fontSize:12,fontWeight:800,letterSpacing:CS_LS}} placeholder="#"/>
                  </div>
                </div>

                <div style={{padding:"0 32px 10px",textAlign:"center"}}>
                  <CSEditField value={csData.passportNote} onChange={v=>csU("passportNote",v)} isPlaceholder style={{color:"#C62828",fontSize:10,fontWeight:700,letterSpacing:CS_LS}} placeholder="E.G. ALL CREW MUST BRING VALID PASSPORT/ID TO SET"/>
                </div>
                <div style={{height:1,background:"#eee",margin:"0 32px"}}/>

                <div style={{padding:"10px 32px",borderBottom:"1px solid #eee",fontSize:11}}>
                  <span style={csLbl}>Production On Set: </span>
                  <CSEditField value={csData.productionContacts} onChange={v=>csU("productionContacts",v)} isPlaceholder style={{fontSize:11,letterSpacing:CS_LS}} placeholder="Name + Number / Name + Number"/>
                </div>

                {/* SHOOT */}
                <div style={{padding:"14px 32px 8px"}}>
                  <div style={csSecTitle}>SHOOT</div>
                  {csData.venueRows.map((row,i) => (
                    <div key={i} style={{display:"flex",alignItems:"flex-start",marginBottom:5,gap:8}}>
                      <div style={{minWidth:95}}>
                        <CSEditField value={row.label} onChange={v=>csU(`venueRows.${i}.label`,v)} bold style={{fontSize:9,fontWeight:700,color:"#888",letterSpacing:CS_LS,textTransform:"uppercase"}} placeholder="LABEL"/>
                      </div>
                      <div style={{flex:1,fontSize:11}}>
                        <CSEditField value={row.value} onChange={v=>csU(`venueRows.${i}.value`,v)} isPlaceholder style={{fontSize:11}} placeholder="Enter details..."/>
                      </div>
                      <CSXbtn onClick={()=>rmVenueRow(i)}/>
                    </div>
                  ))}
                  <CSAddBtn onClick={addVenueRow} label="Add Row"/>
                </div>

                {/* SCHEDULE */}
                <div style={{padding:"10px 32px"}}>
                  <div style={csSecTitle}>SCHEDULE</div>
                  <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
                    <thead><tr style={{background:csDeptBg}}>
                      <td style={{...csTh,background:csDeptBg,width:"10%"}}>TIME</td>
                      <td style={{...csTh,background:csDeptBg,width:"18%"}}>ACTIVITY</td>
                      <td style={{...csTh,background:csDeptBg}}>NOTES</td>
                      <td style={{width:24,background:csDeptBg}}></td>
                    </tr></thead>
                    <tbody>
                      {csData.schedule.map((row,i) => (
                        <tr key={i} style={{borderBottom:"1px solid #f0f0f0",background:"#fff"}}>
                          <td style={{padding:"4px 4px 4px 0",fontSize:11,fontWeight:600}}>
                            <CSEditField value={row.time} onChange={v=>csU(`schedule.${i}.time`,v)} isPlaceholder placeholder="00:00" style={{fontSize:11,fontWeight:600}}/>
                          </td>
                          <td style={{padding:"4px 4px",fontSize:11,fontWeight:600}}>
                            <CSEditField value={row.activity} onChange={v=>csU(`schedule.${i}.activity`,v)} isPlaceholder placeholder="Activity" style={{fontSize:11,fontWeight:600}}/>
                          </td>
                          <td style={{padding:"4px 4px",fontSize:11}}>
                            <CSEditField value={row.notes} onChange={v=>csU(`schedule.${i}.notes`,v)} isPlaceholder placeholder="Notes" style={{fontSize:11}}/>
                          </td>
                          <td><CSXbtn onClick={()=>rmScheduleRow(i)}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <CSAddBtn onClick={addScheduleRow} label="Add Row"/>
                </div>

                {/* CONTACTS */}
                <div style={{padding:"10px 32px"}}>
                  <div style={csSecTitle}>CONTACTS</div>
                  <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
                    <thead><tr>
                      <td style={{...csTh,width:"17%"}}>ROLE</td>
                      <td style={{...csTh,width:"15%"}}>NAME</td>
                      <td style={{...csTh,width:"16%"}}>MOBILE</td>
                      <td style={{...csTh,width:"30%"}}>EMAIL</td>
                      <td style={{...csTh,width:"8%",textAlign:"right",paddingRight:8}}>CALL TIME</td>
                      <td style={{...csTh,width:22}}></td>
                    </tr></thead>
                    <tbody>
                      {csData.departments.map((dept,di) => (
                        <Fragment key={di}>
                          <tr><td colSpan={6} style={{padding:0}}>
                            <div style={{background:"#1a1a1a",padding:"3px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <CSEditField value={dept.name} onChange={v=>csU(`departments.${di}.name`,v)} bold style={{fontSize:9,fontWeight:800,letterSpacing:CS_LS,color:"#fff"}}/>
                              <button onClick={()=>rmDept(di)} style={{background:"none",border:"none",color:"#777",cursor:"pointer",fontSize:12,padding:"0 3px",lineHeight:1}} onMouseEnter={e=>(e.target.style.color="#ff6b6b")} onMouseLeave={e=>(e.target.style.color="#777")}>×</button>
                            </div>
                          </td></tr>
                          {dept.crew.map((cr,ci) => (
                            <tr key={ci} style={{background:"#fff",borderBottom:"1px solid #f5f5f5"}}>
                              <td style={{padding:"3px 4px",fontSize:9,color:"#666"}}>
                                <CSEditField value={cr.role} onChange={v=>csU(`departments.${di}.crew.${ci}.role`,v)} style={{fontSize:9,color:"#666"}} placeholder="Role"/>
                              </td>
                              <td style={{padding:"3px 4px",fontSize:10,fontWeight:600}}>
                                <CSEditField value={cr.name} onChange={v=>csU(`departments.${di}.crew.${ci}.name`,v)} isPlaceholder style={{fontSize:10}} placeholder="Name"/>
                              </td>
                              <td style={{padding:"3px 4px",fontSize:10}}>
                                <CSEditField value={cr.mobile} onChange={v=>csU(`departments.${di}.crew.${ci}.mobile`,v)} isPlaceholder style={{fontSize:10}} placeholder="Phone"/>
                              </td>
                              <td style={{padding:"3px 4px",fontSize:10,overflow:"hidden",textOverflow:"ellipsis"}}>
                                <CSEditField value={cr.email} onChange={v=>csU(`departments.${di}.crew.${ci}.email`,v)} isPlaceholder style={{fontSize:10,color:"#1565C0"}} placeholder="Email"/>
                              </td>
                              <td style={{padding:"3px 8px 3px 4px",fontSize:10,fontWeight:600,textAlign:"right"}}>
                                <CSEditField value={cr.callTime} onChange={v=>csU(`departments.${di}.crew.${ci}.callTime`,v)} isPlaceholder style={{fontSize:10,fontWeight:600}} placeholder="Time"/>
                              </td>
                              <td><CSXbtn onClick={()=>rmCrew(di,ci)}/></td>
                            </tr>
                          ))}
                          <tr style={{background:"#fff"}}><td colSpan={6} style={{padding:"2px 4px"}}><CSAddBtn onClick={()=>addCrew(di)} label="Add Crew"/></td></tr>
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                  <CSAddBtn onClick={addDept} label="Add Department"/>
                </div>

                {/* MAP */}
                <div style={{padding:"14px 32px 10px"}}>
                  <div style={csSecTitle}>MAP</div>
                  <CSResizableImage label="Map Image (JPEG)" image={csData.mapImage} onUpload={v=>csU("mapImage",v)} onRemove={()=>csU("mapImage",null)} defaultHeight={280}/>
                </div>

                {/* WEATHER */}
                <div style={{padding:"10px 32px 14px"}}>
                  <div style={csSecTitle}>WEATHER</div>
                  <CSResizableImage label="Weather Screenshot (JPEG)" image={csData.weatherImage} onUpload={v=>csU("weatherImage",v)} onRemove={()=>csU("weatherImage",null)} defaultHeight={160}/>
                </div>

                {/* INVOICING */}
                <div style={{padding:"14px 32px"}}>
                  <div style={csSecTitle}>INVOICING</div>
                  <div style={{fontSize:11,marginBottom:8}}>
                    Please note that payment terms are <strong><CSEditField value={csData.invoicing.terms} onChange={v=>csU("invoicing.terms",v)} bold style={{fontSize:11}}/></strong> from the date of invoice.
                  </div>
                  <div style={{fontSize:11}}>
                    <div style={{fontWeight:700,marginBottom:2}}>FOR DUBAI CREW:</div>
                    <div>PLEASE SEND INVOICES TO: <CSEditField value={csData.invoicing.email} onChange={v=>csU("invoicing.email",v)} style={{fontSize:11,color:"#1565C0"}}/></div>
                    <div style={{fontWeight:700,marginTop:6}}>BILLING ADDRESS:</div>
                    <CSEditTextarea value={csData.invoicing.address} onChange={v=>csU("invoicing.address",v)} style={{fontSize:11,lineHeight:1.6}}/>
                    <div style={{marginTop:4}}><strong>TRN:</strong> <CSEditField value={csData.invoicing.trn} onChange={v=>csU("invoicing.trn",v)} style={{fontSize:11}}/></div>
                  </div>
                </div>

                {/* PROTOCOL */}
                <div style={{padding:"10px 32px"}}>
                  <div style={csSecTitle}>PROTOCOL ON SET</div>
                  <CSEditTextarea value={csData.protocol} onChange={v=>csU("protocol",v)} style={{fontSize:10,color:"#555",lineHeight:1.7}}/>
                </div>

                {/* EMERGENCY */}
                <div style={{padding:"10px 32px"}}>
                  <div style={csSecTitle}>NEAREST EMERGENCY SERVICES</div>
                  <div style={{fontSize:11,marginBottom:8,display:"flex",flexWrap:"wrap",alignItems:"center",gap:4}}>
                    <CSEditField value={csData.emergencyDialPrefix} onChange={v=>csU("emergencyDialPrefix",v)} bold style={{fontSize:11,fontWeight:700,letterSpacing:CS_LS}}/>
                    {csData.emergencyNumbers.map((en,i) => (
                      <span key={i} style={{display:"inline-flex",alignItems:"center",gap:2}}>
                        <span style={{color:"#C62828",fontWeight:800,fontSize:12}}>
                          <CSEditField value={en.number} onChange={v=>csU(`emergencyNumbers.${i}.number`,v)} style={{color:"#C62828",fontWeight:800,fontSize:12}}/>
                        </span>
                        <span style={{fontWeight:600,fontSize:10,letterSpacing:CS_LS}}> FOR </span>
                        <CSEditField value={en.label} onChange={v=>csU(`emergencyNumbers.${i}.label`,v)} bold style={{fontSize:10,fontWeight:700,letterSpacing:CS_LS}}/>
                        <CSXbtn onClick={()=>rmEmergencyNum(i)} size={13}/>
                        {i<csData.emergencyNumbers.length-1&&<span style={{color:"#ccc",margin:"0 4px"}}>|</span>}
                      </span>
                    ))}
                    <CSAddBtn onClick={addEmergencyNum} label="Add"/>
                  </div>
                  <div style={{fontSize:11,marginBottom:4}}>
                    <strong>NEAREST HOSPITAL: </strong><CSEditField value={csData.emergency.hospital} onChange={v=>csU("emergency.hospital",v)} style={{fontSize:11}}/>
                  </div>
                  <div style={{fontSize:11}}>
                    <strong>NEAREST POLICE STATION: </strong><CSEditField value={csData.emergency.police} onChange={v=>csU("emergency.police",v)} style={{fontSize:11}}/>
                  </div>
                </div>

                {/* FOOTER */}
                <div style={{borderTop:"2px solid #000",margin:"16px 32px 0",padding:"14px 0 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:CS_LS,color:"#000"}}>@ONNAPRODUCTION</div>
                    <div style={{fontSize:9,color:"#888",letterSpacing:CS_LS}}>DUBAI | LONDON</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:10,fontWeight:600,color:"#000",letterSpacing:CS_LS}}>WWW.ONNA.WORLD</div>
                    <div style={{fontSize:9,color:"#888",letterSpacing:CS_LS}}>HELLO@ONNAPRODUCTION.COM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      if (documentsSubSection==="risk") return (
        <div>{docBack}<AIDocPanel project={p} docType="Risk Assessment" systemPrompt={riskSystemPrompt} savedDocs={savedRiskAssessments}/></div>
      );

      if (documentsSubSection==="contracts") return (
        <div>
          {docBack}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:10,color:T.muted,marginBottom:8,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Agreement Type</div>
            <Sel value={contractType} onChange={setContractType} options={CONTRACT_TYPES} minWidth={320}/>
          </div>
          <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,padding:20,marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <div style={{fontSize:10,color:T.muted,marginBottom:16,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Supplier Details</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["Commissionee / Supplier Name","commissionee"],["Individual (for PSC agreements)","individual"],["Role / Services","role"],["Fee (incl. currency)","fee"],["Shoot / Service Date","shootDate"],["Payment Terms","paymentTerms"],["Deliverables","deliverables"],["Usage Rights","usageRights"],["Deadline","deadline"],["Project Reference","projectRef"]].map(([label,key])=>(
                <div key={key}>
                  <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:5,fontWeight:500}}>{label}</div>
                  <input value={contractFields[key]||""} onChange={e=>setContractFields(prev=>({...prev,[key]:e.target.value}))} style={{width:"100%",padding:"8px 11px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                </div>
              ))}
            </div>
            <div style={{marginTop:16,display:"flex",justifyContent:"flex-end"}}>
              <BtnPrimary onClick={()=>generateContract(p)} disabled={contractLoading}>{contractLoading?"Generating…":"Generate Contract"}</BtnPrimary>
            </div>
          </div>
          {generatedContract&&(
            <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div style={{padding:"11px 16px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fafafa"}}>
                <span style={{fontSize:10,color:T.muted,letterSpacing:"0.07em",textTransform:"uppercase",fontWeight:600}}>Generated Contract — {contractType}</span>
                <div style={{display:"flex",gap:6}}>
                  <BtnSecondary small onClick={()=>navigator.clipboard.writeText(generatedContract)}>Copy</BtnSecondary>
                  <BtnExport onClick={()=>exportToPDF(buildContractHTML(generatedContract),`${contractType} — ${p.name}`)}>Export PDF</BtnExport>
                </div>
              </div>
              <div style={{padding:22,maxHeight:500,overflowY:"auto"}}>
                <pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit",fontSize:13,lineHeight:"1.8",color:T.sub,margin:0}}>{generatedContract}</pre>
              </div>
            </div>
          )}
          <div style={{marginTop:18}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:8,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Saved Contracts</div>
            {(projectContracts[p.id]||[]).length===0?<div style={{fontSize:13,color:T.muted}}>No saved contracts yet.</div>:(projectContracts[p.id]||[]).map((c,i)=>(
              <div key={i} style={{padding:"10px 14px",borderRadius:10,background:T.surface,border:`1px solid ${T.border}`,marginBottom:6,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:12.5,color:T.sub,flex:1}}>{c.type} — {c.name}</span>
                <span style={{fontSize:11,color:T.muted}}>{c.date}</span>
              </div>
            ))}
          </div>
        </div>
      );

      if (documentsSubSection==="permits") return (
        <div>{docBack}<UploadZone label="Upload permit paperwork (PDF, images)" files={getProjectFiles(p.id,"permits")} onAdd={f=>addProjectFiles(p.id,"permits",f)}/></div>
      );

      return null;
    }

    if (projectSection==="Locations") return (
      <div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,color:T.muted,marginBottom:8,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Dropbox / Drive Folder Link</div>
          <div style={{display:"flex",gap:10}}>
            <input value={projectLocLinks[p.id]||""} onChange={e=>setProjectLocLinks(prev=>({...prev,[p.id]:e.target.value}))} placeholder="https://www.dropbox.com/sh/..." style={{flex:1,padding:"9px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
            {projectLocLinks[p.id]&&<a href={projectLocLinks[p.id]} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",padding:"9px 18px",borderRadius:10,background:T.accent,color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none"}}>Open Folder ↗</a>}
          </div>
        </div>
        {!projectLocLinks[p.id]&&<div style={{borderRadius:14,background:"#fafafa",border:`1.5px dashed ${T.border}`,padding:44,textAlign:"center"}}><div style={{fontSize:28,opacity:0.3,marginBottom:8}}>📁</div><div style={{fontSize:13,color:T.muted}}>Paste a Dropbox or Google Drive folder link above.</div></div>}
      </div>
    );

    if (projectSection==="Casting") {
      const castingRows = getProjectCasting(p.id);
      return (
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
            <BtnPrimary onClick={()=>addCastingRow(p.id)}>+ Add Model</BtnPrimary>
          </div>
          <div style={{borderRadius:14,overflow:"hidden",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr><TH>Agency</TH><TH>Name of Model</TH><TH>Email</TH><TH>Option</TH><TH/></tr></thead>
              <tbody>
                {castingRows.length===0?<tr><td colSpan={5} style={{padding:40,textAlign:"center",color:T.muted,fontSize:13}}>No models added yet.</td></tr>
                :castingRows.map(row=>(
                  <tr key={row.id}>
                    {["agency","name","email"].map(field=>(
                      <td key={field} style={{padding:"8px 14px",borderBottom:`1px solid ${T.borderSub}`}}>
                        <input value={row[field]} onChange={e=>updateCastingRow(p.id,row.id,field,e.target.value)} style={{width:"100%",padding:"6px 9px",borderRadius:8,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:12.5,fontFamily:"inherit"}}/>
                      </td>
                    ))}
                    <td style={{padding:"8px 14px",borderBottom:`1px solid ${T.borderSub}`}}>
                      <select value={row.option} onChange={e=>updateCastingRow(p.id,row.id,"option",e.target.value)} style={{padding:"6px 9px",borderRadius:8,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:12.5,fontFamily:"inherit"}}>
                        <option>First Option</option><option>Second Option</option><option>Confirmed</option><option>Released</option>
                      </select>
                    </td>
                    <td style={{padding:"8px 14px",borderBottom:`1px solid ${T.borderSub}`}}><button onClick={()=>removeCastingRow(p.id,row.id)} style={{background:"none",border:"none",color:T.muted,fontSize:16,cursor:"pointer",padding:0}}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (projectSection==="Styling") return <UploadZone label="Upload styling documents (PDF, images)" files={getProjectFiles(p.id,"styling")} onAdd={f=>addProjectFiles(p.id,"styling",f)}/>;

    // Travel section — upload zone + folder link
    if (projectSection==="Travel") return (
      <div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,color:T.muted,marginBottom:8,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Dropbox / Drive Folder Link</div>
          <div style={{display:"flex",gap:10}}>
            <input value={projectLocLinks[p.id+"_travel"]||""} onChange={e=>setProjectLocLinks(prev=>({...prev,[p.id+"_travel"]:e.target.value}))} placeholder="https://www.dropbox.com/sh/..." style={{flex:1,padding:"9px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
            {projectLocLinks[p.id+"_travel"]&&<a href={projectLocLinks[p.id+"_travel"]} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",padding:"9px 18px",borderRadius:10,background:T.accent,color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none"}}>Open Folder ↗</a>}
          </div>
        </div>
        <UploadZone label="Upload travel documents — flights, hotels, itineraries (PDF, images)" files={getProjectFiles(p.id,"travel")} onAdd={f=>addProjectFiles(p.id,"travel",f)}/>
      </div>
    );

    // Schedule section — sub-nav with Production Schedule, Pre-Production, Post-Production
    if (projectSection==="Schedule") {
      const SCHED_CARDS = [
        {key:"production",    emoji:"🎬", label:"Production Schedule"},
        {key:"preproduction", emoji:"📝", label:"Pre-Production"},
        {key:"postproduction",emoji:"🎞️", label:"Post-Production"},
      ];

      if (!scheduleSubSection) return (
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:14}}>
          {SCHED_CARDS.map(c=>(
            <div key={c.key} onClick={()=>setScheduleSubSection(c.key)} className="proj-card" style={{borderRadius:14,padding:"22px 20px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",transition:"border-color 0.15s"}}>
              <span style={{fontSize:28}}>{c.emoji}</span>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.text}}>{c.label}</div>
                <div style={{fontSize:12,color:T.muted,marginTop:2}}>Open {c.label.toLowerCase()}</div>
              </div>
            </div>
          ))}
        </div>
      );

      const schedBack = <button onClick={()=>setScheduleSubSection(null)} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>‹ Back to Schedule</button>;

      if (scheduleSubSection==="production") return (
        <div>
          {schedBack}
          <div style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:14}}>Production Schedule</div>
          <p style={{fontSize:13,color:T.sub,marginBottom:12}}>Key dates, shoot schedule, and production timeline.</p>
          <textarea value={projectNotes[p.id+"_prodsched"]||""} onChange={e=>setProjectNotes(prev=>({...prev,[p.id+"_prodsched"]:e.target.value}))} rows={16} placeholder="Add production schedule, shoot days, key dates…" style={{width:"100%",padding:16,borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,color:T.text,fontSize:13.5,fontFamily:"inherit",resize:"vertical",outline:"none",lineHeight:"1.7",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}/>
        </div>
      );

      if (scheduleSubSection==="preproduction") return (
        <div>
          {schedBack}
          <div style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:14}}>Pre-Production</div>
          <p style={{fontSize:13,color:T.sub,marginBottom:12}}>Planning notes, recces, meetings, and preparation tasks.</p>
          <textarea value={projectNotes[p.id+"_preprod"]||""} onChange={e=>setProjectNotes(prev=>({...prev,[p.id+"_preprod"]:e.target.value}))} rows={16} placeholder="Add pre-production notes, planning tasks, meeting notes…" style={{width:"100%",padding:16,borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,color:T.text,fontSize:13.5,fontFamily:"inherit",resize:"vertical",outline:"none",lineHeight:"1.7",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}/>
        </div>
      );

      if (scheduleSubSection==="postproduction") return (
        <div>
          {schedBack}
          <div style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:14}}>Post-Production</div>
          <p style={{fontSize:13,color:T.sub,marginBottom:12}}>Edit notes, delivery specs, feedback rounds, and post timeline.</p>
          <textarea value={projectNotes[p.id+"_postprod"]||""} onChange={e=>setProjectNotes(prev=>({...prev,[p.id+"_postprod"]:e.target.value}))} rows={16} placeholder="Add post-production notes, edit feedback, delivery specs…" style={{width:"100%",padding:16,borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,color:T.text,fontSize:13.5,fontFamily:"inherit",resize:"vertical",outline:"none",lineHeight:"1.7",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}/>
        </div>
      );

      return null;
    }

    return null;
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  const currentTab = TABS.find(t=>t.id===activeTab)||TABS[0];

  const P = isMobile ? 16 : 28; // main padding

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',Arial,sans-serif",color:T.text,display:"flex"}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg);}}
        *{box-sizing:border-box;}
        ::placeholder{color:#aeaeb2;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-thumb{background:#d1d1d6;border-radius:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        .nav-btn{width:100%;text-align:left;padding:8px 11px;border-radius:10px;border:none;background:transparent;color:#6e6e73;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.12s;display:flex;align-items:center;gap:9px;letter-spacing:0.04em;}
        .nav-btn:hover{color:#1d1d1f;background:rgba(0,0,0,0.05);}
        .nav-btn.active{background:rgba(0,0,0,0.08);color:#1d1d1f;}
        .row:hover{background:#f5f5f7!important;cursor:pointer;}
        .proj-card:hover{border-color:#c7c7cc!important;box-shadow:0 6px 20px rgba(0,0,0,0.08)!important;transform:translateY(-1px);}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.2);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);z-index:50;display:flex;align-items:${isMobile?"flex-end":"center"};justify-content:center;}
        input:focus,textarea:focus,select:focus{outline:none;border-color:#6e6e73!important;box-shadow:0 0 0 3px rgba(0,0,0,0.06)!important;}
        .todo-item:hover .todo-del{opacity:1;} .todo-del{opacity:0;transition:opacity 0.12s;}
        .todo-item:hover{background:#f5f5f7;border-radius:8px;}
        .mob-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
        .bottom-nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px 4px;border:none;background:transparent;cursor:pointer;font-family:inherit;transition:color 0.12s;}
        @keyframes sparkle{0%,100%{opacity:0;transform:scale(0.2) rotate(0deg);}50%{opacity:1;transform:scale(1) rotate(90deg);}}
        @keyframes bop{0%,80%,100%{transform:scale(1) translateY(0)}40%{transform:scale(1.4) translateY(-6px)}}
        @keyframes floatStar{0%{transform:translate(0,0) scale(0.8);opacity:0.6;}25%{transform:translate(4px,-5px) scale(1.1);opacity:1;}50%{transform:translate(8px,2px) scale(0.9);opacity:0.8;}75%{transform:translate(3px,6px) scale(1);opacity:1;}100%{transform:translate(0,0) scale(0.8);opacity:0.6;}}
        .agent-card{transition:all 0.15s ease;cursor:pointer;}
        .agent-card:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,0,0,0.1)!important;}
        .agent-chat-msg{animation:fadeInMsg 0.18s ease;}
        @keyframes fadeInMsg{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
      `}</style>

      {/* ── SIDEBAR (desktop only) ── */}
      <div style={{width:220,flexShrink:0,background:"rgba(255,255,255,0.82)",borderRight:`1px solid ${T.border}`,display:isMobile?"none":"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
        <div style={{padding:"20px 18px 16px",display:"flex",alignItems:"center"}}>
          <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAoAKADASIAAhEBAxEB/8QAGgABAAMBAQEAAAAAAAAAAAAAAAYICQUHA//EAEIQAAEDAwIDBQIKBQ0AAAAAAAECAwQABREGBwgSIRMUMUFRCTIVFiIjQlJhcXSzFzY4gZEYM0NUVmJygoOUocPT/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALl0pUD343Jt21W3UvVM1kSX+YR4MXm5e8SFAlKc+QAClE+iT54oJy860y0p15xDbaBlS1qACR6kmufB1DYJz5jwr5bJTwOC2zLQtQ/cDms6IkffDiZ1A8sSHrhDjODn7R0R7dC5vABPhnHoFLI8c+NSa68GO6kO3KkxLppi4SEJyYzMt1C1H0SVtpT/ABKaDQSlZ47P75bjbNa6Gk9wHLnKs7DyY8+3z1Fx+EnyWyoknABBCQSlQ8PEGtCoz7MmO1JjuodZdQFtrQcpUkjIIPmCKD6UqkXtJJEhnV2kAy+62DAfyELIz84n0rscD+/JkCNtfrGaS8PkWOa8vqsf1ZRPn9Qnx936oIXFpVc/aFPvMbFRFMPONFV9jpJQojI7J446fcK7HAo447w6WlbrilqMyX1Ucn+eVQe6UrlawJGkbyQcEQH+v+mqsrtq9x9S7d61hans0x1xxg8r8d1wluS0febWPQ48fIgEdRQazUqMbXa5sW4ui4WqdPP9pFkpw42ojtI7o95pY8lJP8RgjIINUl0hLlL9oA+0uS8pv40zk8pcJGAHcDHpQaA0pUA4gtfs7abU3jU5WjvqW+725tX9JJXkNjHmB1WR6JNBP6VkIU6qctTmrS7c1QhOEdc/tVY7ypJcCebPvYBVWmvDhuG3uZtNadRLcSbihPdbmgfRktgBRx5BQKVgeixQejUpSgVUT2lnevi1ovkJ7p3yV2vpz8jfJ/xz1buoFv3ttA3V24maXlvCNJ5hIgSSM9hISDyqI80kEpP2KOOuKCO8GybMnh00v8C9jgtOGXyY5jI7RXac/nnPr9Hl8sV6/Wadpu29nDPqOTFMR6BEkPfONSWC9b5xT4KQroM480qSrGAceFS+88aO5Uu2KjQLJpy3SVpKTKQy64pB9UJWspB/xBQoOx7SZdkOtNKIi9j8Mpgv995cc/Y86ex5v39tirYbCiSnZDQ4mBQeFghBQV447BGM/bjFUn2S2Q17vPrlOstfpuLNkefEidOnAodngY+baBweUgBPMAEpHh1AFaFMNNMMNsMtpbabSEIQkYCUgYAA9KCkPtKv1v0f+AkfmJqI8QWx7+mNDaZ3R0ey4i2SrZCdubLOQYUhTSD2ycdQhSj1+qo+hAEu9pUD8btHnHTuEj8xNW026gxbhs9pu3XCM1JiyLBFZfYdQFIcQqOkKSoHxBBIxQUc3P3xTuZwyw9O6gfA1ZarxGLqj078wGnkh4f3gSAsepBHjgWZ4D/2cbR+Ml/nKqo3FVsrL2n1d3m3Nuv6VuTilW985UWVeJYWfrDyJ95PXxCsW54D/wBnG0fjJf5yqD2LWX6oXn8A/wDlqrOjhP20tG6t01bpq5q7B8WXtoEsDKoz4eQErx5jqQR5gnwOCNF9YgnSN5AGSYD/AOWqqR+zcB/SjqQ46fAn/e3QQ3Z3Xeq+HDd6dYNTRXxbVPBi8QQchSfoSGvIkA8wP0knHTII6O2lyg3njvbu1rlNy4MzUkx+O+2cpcbUl0pUPvBq0PFnsjH3U0r8J2hptrVlsaJhudE96b8THWft6lJPgo+QUapnwpRpELiZ0nDlsOR5LFwdbdacSUrbWlpwFJB6ggjGKDT2s/8Aj+3G+Mu47Gire/zW3ToIf5T8lyWsDn+/kThP2Erq5m9+uY+3O1961Y8EreiscsRtXg7IX8ltP3cxBP2AmqJcL2zat8NU3+6aouNyYtkYdrJlx1JDz8t1RUBlaVDwC1K6eafWg9Jt2ruHpvheO1T2skJuD0TvLsn4JlkC4n5Ycz2XUBYCM+aBioZwGbj/ABT3QVpO4P8AJatShLKOY/Jblpz2R/zZKPtKkele2/yKNtP7Sau/3Ef/AMa8C4qtj29l7jYbxpe43STapZKRJkrSXY8pB5gOZCUgApwU9M5Qqg0bpUB4fdftblbUWfU+UiatvsLghIxySW+jnTyB6KA9FCp9QKUpQfOSwxJZUzJZbeaV7yHEhST94NciHpDScKZ32HpeyRpWebtmoDSF59eYJzmlKDt0pSgUpSgUpSgUpSgUpSgUpSgUpSgUpSg//9k=" alt="ONNA" style={{height:24,width:"auto",display:"block"}}/>
        </div>

        <nav style={{flex:1,padding:"4px 8px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>changeTab(t.id)} className={`nav-btn${activeTab===t.id?" active":""}`}>
              <StarIcon size={11} color="currentColor"/>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div style={{margin:10,position:"relative"}}>
          <button onClick={()=>setShowUserMenu(p=>!p)} style={{width:"100%",padding:"12px 14px",borderRadius:12,background:"rgba(0,0,0,0.04)",border:`1px solid rgba(0,0,0,0.07)`,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0}}>E</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:T.text}}>Emily</div>
              <div style={{fontSize:11,color:T.muted}}>Admin · onna</div>
            </div>
            <svg width={10} height={10} viewBox="0 0 10 10" fill="none" style={{flexShrink:0,color:T.muted,transform:showUserMenu?"rotate(180deg)":"none",transition:"transform 0.15s"}}><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {showUserMenu&&(
            <>
              <div style={{position:"fixed",inset:0,zIndex:49}} onClick={()=>setShowUserMenu(false)}/>
              <div style={{position:"absolute",bottom:"calc(100% + 6px)",left:0,right:0,background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,boxShadow:"0 4px 24px rgba(0,0,0,0.12)",zIndex:50,overflow:"hidden"}}>
                <button onClick={()=>{setShowUserMenu(false);setShowArchive(true);}} style={{width:"100%",padding:"11px 16px",background:"none",border:"none",borderBottom:`1px solid ${T.borderSub}`,color:T.text,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:9}} onMouseOver={e=>e.currentTarget.style.background="#f5f5f7"} onMouseOut={e=>e.currentTarget.style.background="none"}>
                  <svg width={13} height={13} viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="3" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 4v5.5a1 1 0 001 1h7a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.2"/><path d="M4.5 7h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  View Archive{archive.length>0&&<span style={{marginLeft:"auto",background:T.borderSub,borderRadius:999,padding:"1px 7px",fontSize:10.5,color:T.sub}}>{archive.length}</span>}
                </button>
                <button onClick={()=>{setShowUserMenu(false);setShowCatManager(true);}} style={{width:"100%",padding:"11px 16px",background:"none",border:"none",borderBottom:`1px solid ${T.borderSub}`,color:T.text,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:9}} onMouseOver={e=>e.currentTarget.style.background="#f5f5f7"} onMouseOut={e=>e.currentTarget.style.background="none"}>
                  <svg width={13} height={13} viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  Manage Categories
                </button>
                <button onClick={()=>{setShowUserMenu(false);localStorage.removeItem("onna_token");setAuthed(false);}} style={{width:"100%",padding:"11px 16px",background:"none",border:"none",color:"#c0392b",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:9}} onMouseOver={e=>e.currentTarget.style.background="#fff5f5"} onMouseOut={e=>e.currentTarget.style.background="none"}>
                  <svg width={13} height={13} viewBox="0 0 14 14" fill="none"><path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9 10l3-3-3-3M13 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{padding:`0 ${P}px`,height:isMobile?50:58,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`,flexShrink:0,background:"rgba(255,255,255,0.9)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0,flex:1}}>
            {isMobile&&<img src="/logo.png" alt="ONNA" style={{height:18,width:"auto",marginRight:6,flexShrink:0}}/>}
            <span style={{fontSize:isMobile?14:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentTab.label}</span>
            {selectedProject&&<><span style={{color:T.muted,fontSize:16,fontWeight:300,flexShrink:0}}>›</span><span style={{fontSize:isMobile?12:14,color:T.sub,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selectedProject.name}</span>{!isMobile&&projectSection!=="Home"&&<><span style={{color:T.muted,fontSize:16}}>›</span><span style={{fontSize:13,color:T.muted}}>{projectSection}{creativeSubSection?` › ${creativeSubSection==="moodboard"?"Moodboard":"Brief"}`:""}{budgetSubSection?` › ${budgetSubSection==="tracker"?"Budget Tracker":budgetSubSection==="estimates"?"Estimates":"Quotations"}`:""}</span></>}</>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:isMobile?6:10,flexShrink:0}}>
            {!isMobile&&apiLoading&&<span style={{fontSize:11,color:T.muted,display:"flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:"#92680a",display:"inline-block",animation:"pulse 1.2s ease-in-out infinite"}}/>Syncing…</span>}
            {!isMobile&&apiError&&!apiLoading&&<span title={`API: ${apiError}`} style={{fontSize:11,color:"#c0392b",cursor:"default"}}>● Offline</span>}
            {!isMobile&&!apiLoading&&!apiError&&<span style={{fontSize:11,color:"#147d50",display:"flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:"50%",background:"#147d50",display:"inline-block"}}/>Live</span>}
            {activeTab==="Projects"&&!selectedProject&&<BtnPrimary small={isMobile} onClick={()=>setShowAddProject(true)}>+ New Project</BtnPrimary>}
          </div>
        </div>

        {/* Scroll area */}
        <div style={{flex:1,overflowY:"auto",padding:`${P}px ${P}px ${isMobile?80:44}px`}}>

          {/* ══ DASHBOARD ══ */}
          {activeTab==="Dashboard"&&(
            <div>
              {/* ── Google Calendar Widget ── */}
              {(()=>{
                const today = new Date();
                const yr = calMonth.getFullYear();
                const mo = calMonth.getMonth();
                const firstDay = new Date(yr, mo, 1);
                const lastDay  = new Date(yr, mo+1, 0);
                const startOffset = (firstDay.getDay() + 6) % 7;
                const totalCells  = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
                const cells = Array.from({length:totalCells}, (_,i) => { const d = i - startOffset + 1; return (d < 1 || d > lastDay.getDate()) ? null : new Date(yr, mo, d); });
                const seen0 = new Set();
                const allCalEvents0 = [...gcalEvents, ...outlookEvents].filter(ev => { const day=ev.start?.date||ev.start?.dateTime?.slice(0,10); const k=(ev.summary||"").trim().toLowerCase()+"|"+day; if(seen0.has(k))return false; seen0.add(k); return true; });
                const eventsByDay0 = {};
                allCalEvents0.forEach(ev => { const startStr=ev.start?.date||ev.start?.dateTime?.slice(0,10); if(!startStr)return; const endStr=ev.end?.date||ev.end?.dateTime?.slice(0,10)||startStr; const cursor=new Date(startStr+"T00:00:00"); const endD=new Date(endStr+"T00:00:00"); const startKey=cursor.toISOString().slice(0,10); let guard=0; while(cursor<endD||cursor.toISOString().slice(0,10)===startKey){const key=cursor.toISOString().slice(0,10);if(!eventsByDay0[key])eventsByDay0[key]=[];eventsByDay0[key].push(ev);cursor.setDate(cursor.getDate()+1);if(++guard>14)break;} });
                const DAY_LABELS0 = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
                const monthLabel = calMonth.toLocaleDateString("en-US",{month:"long",year:"numeric"});
                return (
                  <div style={{marginBottom:isMobile?12:18,borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                    <div style={{padding:"13px 18px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fafafa",flexWrap:"wrap",gap:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600}}>Calendar</span>
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <button onClick={()=>setCalMonth(m=>new Date(m.getFullYear(),m.getMonth()-1,1))} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"1px 7px",cursor:"pointer",fontSize:14,color:T.sub,lineHeight:1.5,fontFamily:"inherit"}}>‹</button>
                          <span style={{fontSize:13.5,fontWeight:600,color:T.text,minWidth:isMobile?106:120,textAlign:"center"}}>{monthLabel}</span>
                          <button onClick={()=>setCalMonth(m=>new Date(m.getFullYear(),m.getMonth()+1,1))} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"1px 7px",cursor:"pointer",fontSize:14,color:T.sub,lineHeight:1.5,fontFamily:"inherit"}}>›</button>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <span style={{width:7,height:7,borderRadius:"50%",background:outlookLoading?"#f59e0b":outlookError?"#ef4444":outlookEvents.length>0?"#0078d4":"#d1d1d6",display:"inline-block",flexShrink:0}}/>
                          <span style={{fontSize:11,color:outlookError?"#ef4444":T.muted,fontWeight:500}} title={outlookError||undefined}>{outlookLoading?"Syncing…":outlookError?"Outlook error (↻ retry)":outlookEvents.length>0?`Outlook (${outlookEvents.length})`:"Outlook"}</span>
                          <button onClick={fetchOutlookCal} disabled={outlookLoading} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:10,padding:"0 2px",fontFamily:"inherit",textDecoration:"underline"}}>↻</button>
                        </div>
                        <div style={{width:1,height:12,background:T.border}}/>
                        {gcalToken ? (
                          <div style={{display:"flex",alignItems:"center",gap:5}}>
                            <span style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",display:"inline-block",flexShrink:0}}/>
                            <span style={{fontSize:11,color:T.muted,fontWeight:500}}>Google</span>
                            <button onClick={()=>{setGcalToken(null);setGcalEvents([]);try{localStorage.removeItem('onna_gcal_token');localStorage.removeItem('onna_gcal_exp');localStorage.removeItem('onna_gcal_connected');}catch{}}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:10,padding:"0 2px",fontFamily:"inherit",textDecoration:"underline"}}>Disconnect</button>
                          </div>
                        ) : GCAL_CLIENT_ID ? (
                          <button onClick={connectGCal} style={{padding:"4px 10px",borderRadius:7,background:T.accent,border:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ Google Calendar</button>
                        ) : null}
                      </div>
                    </div>
                    <div style={{padding:isMobile?"8px 6px":"12px 14px"}}>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:3}}>
                        {DAY_LABELS0.map(d=>(<div key={d} style={{textAlign:"center",fontSize:isMobile?9:10,fontWeight:600,color:T.muted,textTransform:"uppercase",letterSpacing:"0.05em",padding:"2px 0 5px"}}>{d}</div>))}
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:isMobile?2:3}}>
                        {cells.map((date,i)=>{
                          if (!date) return <div key={`e${i}`} style={{minHeight:isMobile?44:66}}/>;
                          const key=date.toISOString().slice(0,10);
                          const isToday=key===today.toISOString().slice(0,10);
                          const isWeekend=date.getDay()===0||date.getDay()===6;
                          const dayEvs=eventsByDay0[key]||[];
                          return (
                            <div key={key} onClick={()=>setCalDayView(date)} style={{minHeight:isMobile?44:66,borderRadius:7,background:isToday?T.accent+"15":"transparent",border:isToday?`1.5px solid ${T.accent}44`:`1px solid ${T.borderSub}`,padding:isMobile?"3px":"4px 5px",display:"flex",flexDirection:"column",gap:2,overflow:"hidden",minWidth:0,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=isToday?T.accent+"25":"#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background=isToday?T.accent+"15":"transparent"}>
                              <span style={{fontSize:isMobile?10:11,fontWeight:isToday?700:400,color:isToday?T.accent:isWeekend?T.muted:T.text,lineHeight:1,alignSelf:"flex-start",flexShrink:0}}>{date.getDate()}</span>
                              {isMobile?(dayEvs.length>0&&<div style={{display:"flex",gap:2,flexWrap:"wrap",marginTop:1}}>{dayEvs.slice(0,4).map((ev,ei)=>{const c=ev.colorId?(gcalEventColors[ev.colorId]?.background||GCAL_COLORS[ev.colorId]||T.accent):(ev.calendarColor||T.accent);return <span key={ei} style={{width:5,height:5,borderRadius:"50%",background:c,display:"inline-block"}}/>;})}</div>):(
                                <div style={{display:"flex",flexDirection:"column",gap:2,flex:1,overflow:"hidden",minWidth:0}}>
                                  {dayEvs.slice(0,3).map((ev,ei)=>{const col=ev.colorId?(gcalEventColors[ev.colorId]?.background||GCAL_COLORS[ev.colorId]||T.accent):(ev.calendarColor||T.accent);const title=ev.summary||"(no title)";const time=ev.start?.dateTime?new Date(ev.start.dateTime).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true}):null;return(<div key={ei} title={`${time?time+" ":""}${title}`} style={{fontSize:9.5,background:col+"22",color:col,borderRadius:3,padding:"1px 4px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontWeight:500,lineHeight:1.5,minWidth:0,width:"100%",boxSizing:"border-box"}}>{time?`${time} `:""}{title}</div>);})}
                                  {dayEvs.length>3&&<div style={{fontSize:9,color:T.muted,lineHeight:1.4}}>+{dayEvs.length-3} more</div>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {gcalLoading&&<div style={{textAlign:"center",padding:"10px 0",fontSize:12,color:T.muted}}>Loading events…</div>}
                      {!gcalToken&&!gcalLoading&&<div style={{textAlign:"center",padding:"10px 0",fontSize:12,color:T.muted}}>Connect Google Calendar to see your events here</div>}
                    </div>
                  </div>
                );
              })()}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?12:18}}>
                {/* Active Projects */}
                <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",display:"flex",flexDirection:"column"}}>
                  <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fafafa"}}>
                    <span style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600}}>Active Projects</span>
                    <span style={{fontSize:12,color:T.muted,fontWeight:500}}>{activeProjects.length}</span>
                  </div>
                  <div style={{overflowY:"auto",maxHeight:480}}>
                    {activeProjects.map((p,i)=>(
                      <div key={p.id} onClick={()=>{setActiveTab("Projects");setSelectedProject(p);setProjectSection("Home");}} style={{padding:"13px 18px",borderBottom:i<activeProjects.length-1?`1px solid ${T.borderSub}`:"none",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div>
                          <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2,fontWeight:500}}>{p.client}</div>
                          <div style={{fontSize:13.5,fontWeight:500,color:T.text}}>{p.name}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:15,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>AED {p.revenue.toLocaleString()}</div>
                          <div style={{fontSize:10,color:T.muted,marginTop:2}}>{p.year}</div>
                        </div>
                      </div>
                    ))}
                    {activeProjects.length===0&&<div style={{padding:"28px 18px",textAlign:"center",fontSize:13,color:T.muted}}>No active projects.</div>}
                  </div>
                </div>
                {/* To-Do */}
                <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",display:"flex",flexDirection:"column"}}>
                  {/* Title row */}
                  <div style={{padding:"13px 16px 0",background:"#fafafa",borderBottom:`1px solid ${T.borderSub}`}}>
                    <div style={{display:"flex",alignItems:"center",marginBottom:10}}>
                      <span style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,flex:1}}>To-Do</span>
                      <span style={{fontSize:11,color:T.muted}}>{allTodos.filter(t=>!t.done).length} open</span>
                    </div>
                    {/* Top-level filter tabs */}
                    <div style={{display:"flex",gap:0,borderRadius:8,background:"#ebebed",padding:2,marginBottom:10}}>
                      {[["todo","To Do"],["general","General"],["project","Projects"]].map(([val,label])=>(
                        <button key={val} onClick={()=>setTodoFilter(val)} style={{flex:1,padding:"5px 0",borderRadius:6,fontSize:11.5,fontWeight:500,cursor:"pointer",border:"none",fontFamily:"inherit",background:todoTopFilter===val?"#fff":"transparent",color:todoTopFilter===val?T.text:T.muted,boxShadow:todoTopFilter===val?"0 1px 2px rgba(0,0,0,0.08)":"none",transition:"all 0.12s"}}>{label}</button>
                      ))}
                    </div>
                    {/* Sub-filter row — General only */}
                    {todoTopFilter==="general"&&(
                      <div style={{display:"flex",gap:5,paddingBottom:10}}>
                        {[["general","All"],["general-later","Later"],["general-longterm","Long Term"]].map(([val,label])=>(
                          <button key={val} onClick={()=>setTodoFilter(val)} style={{padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:500,cursor:"pointer",border:`1px solid ${todoFilter===val?T.accent:T.borderSub}`,fontFamily:"inherit",background:todoFilter===val?T.accent:"transparent",color:todoFilter===val?"#fff":T.sub,transition:"all 0.12s"}}>{label}</button>
                        ))}
                      </div>
                    )}
                    {todoTopFilter==="project"&&(
                      <div style={{paddingBottom:10}}>
                        <select value={todoFilter} onChange={e=>setTodoFilter(e.target.value)} style={{width:"100%",padding:"7px 28px 7px 11px",borderRadius:9,background:"#fff",border:`1px solid ${T.border}`,color:T.text,fontSize:12.5,fontFamily:"inherit",cursor:"pointer",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23aeaeb2' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
                          <option value="project">All projects</option>
                          {allProjectsMerged.filter(p=>p.status==="Active").map(p=>(<option key={p.id} value={`project-${p.id}`}>{p.name}</option>))}
                        </select>
                      </div>
                    )}
                  </div>
                  {/* Task list — shows ~5 items then scrolls */}
                  <div style={{padding:"6px 12px",overflowY:"auto",maxHeight:215}}>
                    {filteredTodos.map(t=>(
                      <div key={t.id} className="todo-item" style={{display:"flex",alignItems:"flex-start",gap:9,padding:"8px 6px",borderBottom:`1px solid ${T.borderSub}`}}>
                        <button onClick={e=>{e.stopPropagation();(t._source==="project"?setProjectTodos(prev=>({...prev,[t.projectId]:(prev[t.projectId]||[]).map(x=>x.id===t.id?{...x,done:!x.done}:x)})):setTodos(prev=>prev.map(x=>x.id===t.id?{...x,done:!x.done}:x)));}} style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${t.done?T.muted:T.border}`,background:t.done?T.accent:"transparent",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginTop:2,transition:"all 0.12s"}}>
                          {t.done&&<span style={{color:"#fff",fontSize:9,lineHeight:1,fontWeight:700}}>✓</span>}
                        </button>
                        <div style={{flex:1,minWidth:0}}>
                          <span style={{fontSize:13,color:t.done?T.muted:T.text,textDecoration:t.done?"line-through":"none"}}>{t.text}</span>
                          {t._source==="project"&&<div style={{fontSize:10.5,color:T.muted,marginTop:1}}>{allProjectsMerged.find(p=>p.id===t.projectId)?.name||"Project"}</div>}
                          {t._source==="general"&&t.subType&&<div style={{fontSize:10,color:T.muted,marginTop:1,textTransform:"capitalize"}}>{t.subType==="longterm"?"Long Term":t.subType}</div>}
                        </div>
                        <div className="todo-del" style={{display:"flex",gap:3}}>
                          <button onClick={e=>{e.stopPropagation();setArchivedTodos(prev=>[...prev,t]);}} title="Archive" style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:11,padding:"2px 3px",borderRadius:4,fontFamily:"inherit",opacity:0.6}}>⊘</button>
                          <button onClick={e=>{e.stopPropagation();(t._source==="project"?setProjectTodos(prev=>({...prev,[t.projectId]:(prev[t.projectId]||[]).filter(x=>x.id!==t.id)})):setTodos(prev=>prev.filter(x=>x.id!==t.id)));}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:0,lineHeight:1}}>×</button>
                        </div>
                      </div>
                    ))}
                    {filteredTodos.length===0&&<div style={{padding:"20px 0",textAlign:"center",fontSize:13,color:T.muted}}>No tasks.</div>}
                  </div>
                  {/* Add input */}
                  <div style={{padding:"10px 12px",borderTop:`1px solid ${T.borderSub}`,display:"flex",gap:7,background:"#fafafa"}}>
                    <input value={newTodo} onChange={e=>setNewTodo(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newTodo.trim()){const subType=todoFilter==="general-later"?"later":todoFilter==="general-longterm"?"longterm":undefined;if(todoFilter.startsWith("project-")){const pid=Number(todoFilter.replace("project-",""));setProjectTodos(prev=>({...prev,[pid]:[...(prev[pid]||[]),{id:Date.now(),text:newTodo.trim(),done:false,details:""}]}));}else{setTodos(prev=>[...prev,{id:Date.now(),text:newTodo.trim(),done:false,type:"general",subType,details:""}]);}setNewTodo("");}}} placeholder={todoTopFilter==="project"?"Add project task…":todoFilter==="general-later"?"Add later task…":todoFilter==="general-longterm"?"Add long term task…":"Add task…"} style={{flex:1,padding:"7px 11px",borderRadius:9,background:"#fff",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                    <button onClick={()=>{if(newTodo.trim()){const subType=todoFilter==="general-later"?"later":todoFilter==="general-longterm"?"longterm":undefined;if(todoFilter.startsWith("project-")){const pid=Number(todoFilter.replace("project-",""));setProjectTodos(prev=>({...prev,[pid]:[...(prev[pid]||[]),{id:Date.now(),text:newTodo.trim(),done:false,details:""}]}));}else{setTodos(prev=>[...prev,{id:Date.now(),text:newTodo.trim(),done:false,type:"general",subType,details:""}]);}setNewTodo("");}}} style={{padding:"7px 14px",borderRadius:9,background:T.accent,border:"none",color:"#fff",fontSize:16,cursor:"pointer",lineHeight:1,flexShrink:0}}>+</button>
                  </div>
                </div>
              </div>

              {/* ── Notes ── */}
              <DashNotes notes={dashNotesList} setNotes={setDashNotesList} selectedId={dashSelectedNoteId} setSelectedId={setDashSelectedNoteId} isMobile={isMobile}/>

            </div>
          )}

          {/* ══ CAL DAY VIEW MODAL ══ */}
          {calDayView&&(()=>{
            const dayKey = calDayView.toISOString().slice(0,10);
            // Rebuild eventsByDay for the day modal (reuse same dedup logic)
            const seen2=new Set();
            const allEvs2=[...gcalEvents,...outlookEvents].filter(ev=>{const d2=ev.start?.date||ev.start?.dateTime?.slice(0,10);const k2=(ev.summary||"").trim().toLowerCase()+"|"+d2;if(seen2.has(k2))return false;seen2.add(k2);return true;});
            const dayEvsFull=allEvs2.filter(ev=>{const s=ev.start?.date||ev.start?.dateTime?.slice(0,10);if(!s)return false;const cursor=new Date(s+"T00:00:00");const startKey=cursor.toISOString().slice(0,10);// check if dayKey falls within this event's span
              const endS=ev.end?.date||ev.end?.dateTime?.slice(0,10)||s;const endD2=new Date(endS+"T00:00:00");const cellD=new Date(dayKey+"T00:00:00");return cellD>=cursor&&cellD<endD2||startKey===dayKey;}).sort((a,b)=>{const ta=a.start?.dateTime?new Date(a.start.dateTime):new Date(a.start.date+"T00:00:00");const tb=b.start?.dateTime?new Date(b.start.dateTime):new Date(b.start.date+"T00:00:00");return ta-tb;});
            const label=calDayView.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
            return(
              <div onClick={()=>setCalDayView(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
                <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:18,boxShadow:"0 8px 40px rgba(0,0,0,0.18)",width:"100%",maxWidth:480,maxHeight:"80vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
                  {/* Header */}
                  <div style={{padding:"16px 20px 12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
                    <div>
                      <div style={{fontSize:17,fontWeight:700,color:T.text}}>{calDayView.toLocaleDateString("en-US",{weekday:"long"})}</div>
                      <div style={{fontSize:13,color:T.muted,marginTop:1}}>{calDayView.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
                    </div>
                    <button onClick={()=>setCalDayView(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:T.muted,padding:"4px 8px",borderRadius:8,fontFamily:"inherit",lineHeight:1}}>✕</button>
                  </div>
                  {/* Event list */}
                  <div style={{overflowY:"auto",padding:"12px 20px 20px",flex:1}}>
                    {dayEvsFull.length===0?(
                      <div style={{textAlign:"center",padding:"32px 0",color:T.muted,fontSize:14}}>No events</div>
                    ):dayEvsFull.map((ev,i)=>{
                      const col=ev.colorId?(gcalEventColors[ev.colorId]?.background||GCAL_COLORS[ev.colorId]||T.accent):(ev.calendarColor||T.accent);
                      const isAllDay=!ev.start?.dateTime;
                      const startDT=ev.start?.dateTime?new Date(ev.start.dateTime):null;
                      const endDT=ev.end?.dateTime?new Date(ev.end.dateTime):null;
                      const timeStr=startDT?startDT.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true})+(endDT?" – "+endDT.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true}):""):"All day";
                      const source=ev._outlook?"Outlook":"Google";
                      return(
                        <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<dayEvsFull.length-1?`1px solid ${T.borderSub}`:"none",alignItems:"flex-start"}}>
                          <div style={{width:4,borderRadius:4,alignSelf:"stretch",background:col,flexShrink:0,minHeight:36}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:14,fontWeight:600,color:T.text,lineHeight:1.3}}>{ev.summary||"(No title)"}</div>
                            <div style={{fontSize:12,color:T.muted,marginTop:3}}>{timeStr}</div>
                            {ev.location&&<div style={{fontSize:11,color:T.muted,marginTop:2}}>📍 {ev.location}</div>}
                            {ev.description&&(()=>{
                              const plain=ev.description.replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#?\w+;/g," ").trim();
                              const parts=plain.split(/(https?:\/\/[^\s]+)/g);
                              return <div style={{fontSize:11,color:T.sub,marginTop:4,lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
                                {parts.map((p,pi)=>p.match(/^https?:\/\//)
                                  ?<a key={pi} href={p} target="_blank" rel="noreferrer" style={{color:T.accent,textDecoration:"underline",wordBreak:"break-all"}}>{p}</a>
                                  :<span key={pi}>{p}</span>)}
                              </div>;
                            })()}
                            <div style={{fontSize:10,color:T.muted,marginTop:4,opacity:0.6}}>{source}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ══ VENDORS ══ */}
          {activeTab==="Vendors"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
                <SearchBar value={getSearch("Vendors")} onChange={v=>setSearch("Vendors",v)} placeholder="Search contacts…"/>
                <Sel value={bbCat} onChange={v=>{if(v==="＋ Add category"){const n=addNewOption(customVendorCats,setCustomVendorCats,'onna_vendor_cats',"New category name:");if(n){setBbCat(n);setBbLocation("All");}}else{setBbCat(v);setBbLocation("All");}}} options={allVendorCats} minWidth={170}/>
                <Sel value={bbLocation} onChange={v=>{if(v==="＋ Add location"){const n=addNewOption(customVendorLocs,setCustomVendorLocs,'onna_vendor_locs',"New location name:");if(n)setBbLocation(n);}else setBbLocation(v);}} options={["All",...allVendorLocs]} minWidth={170}/>
                <span style={{fontSize:12,color:T.muted}}>{filteredBB.length} contacts</span>
                <button onClick={()=>downloadCSV(filteredBB,[{key:"name",label:"Name"},{key:"category",label:"Category"},{key:"location",label:"Location"},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"website",label:"Website"},{key:"rateCard",label:"Rate Card"},{key:"notes",label:"Notes"}],"vendors.csv")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>CSV</button>
                <button onClick={()=>exportTablePDF(filteredBB,[{key:"name",label:"Name"},{key:"category",label:"Category"},{key:"location",label:"Location"},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"website",label:"Website"}],"Vendors")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>PDF</button>
                <BtnPrimary onClick={()=>setShowAddVendor(true)}>+ New Vendor</BtnPrimary>
              </div>
              <div className="mob-table-wrap" style={{borderRadius:16,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <table style={{width:"100%",borderCollapse:"collapse",background:T.surface,minWidth:isMobile?520:"auto"}}>
                  <thead><tr><TH>Name</TH><TH>Category</TH><TH>Email</TH><TH>Phone</TH><TH>Website</TH><TH>Location</TH></tr></thead>
                  <tbody>
                    {filteredBB.map(b=>(
                      <tr key={b.id} className="row" onClick={()=>setEditVendor({...b,_xContacts:getXContacts('vendor',b.id)})} style={{cursor:"pointer"}}>
                        <TD bold>{b.name}</TD>
                        <TD muted>{b.category||"—"}</TD>
                        <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}><a href={`mailto:${b.email}`} onClick={e=>e.stopPropagation()} style={{fontSize:12.5,color:T.link,textDecoration:"none"}}>{b.email||"—"}</a></td>
                        <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`,whiteSpace:"nowrap",fontSize:12.5,color:T.sub}}>{b.phone||"—"}</td>
                        <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}>{b.website?<a href={`https://${b.website}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:12.5,color:T.link,textDecoration:"none"}}>{b.website}</a>:<span style={{color:T.muted,fontSize:12.5}}>—</span>}</td>
                        <TD muted>{b.location||"—"}</TD>
                      </tr>
                    ))}
                    {filteredBB.length===0&&<tr><td colSpan={6} style={{padding:44,textAlign:"center",color:T.muted,fontSize:13}}>No contacts found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ CLIENTS ══ */}
          {activeTab==="Clients"&&(
            <div>
              <div style={{display:"flex",gap:6,marginBottom:22}}>
                <Pill label="Overview"         active={leadsView==="dashboard"} onClick={()=>setLeadsView("dashboard")}/>
                <Pill label="Leads"            active={leadsView==="leads"}     onClick={()=>setLeadsView("leads")}/>
                <Pill label="Clients"          active={leadsView==="clients"}   onClick={()=>setLeadsView("clients")}/>
                <Pill label="Outreach Tracker" active={leadsView==="outreach"}  onClick={()=>setLeadsView("outreach")}/>
              </div>

              {leadsView==="dashboard"&&(()=>{
                const STATUSES = ["not_contacted","cold","warm","open","client"];
                /* ── Stats row ── */
                const _statsRow = (
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:14,marginBottom:isMobile?16:22}}>
                    <StatCard label="Projects 2026"  value={projects2026.length} sub={`${projects2026.filter(p=>p.status==="Active").length} active`}/>
                    <StatCard label="Revenue 2026"   value={`AED ${(rev2026/1000).toFixed(0)}k`} sub="all projects this year"/>
                    <StatCard label="Profit 2026"    value={`AED ${(profit2026/1000).toFixed(0)}k`} sub={`${rev2026?Math.round((profit2026/rev2026)*100):0}% margin`}/>
                    <StatCard label="Pipeline"       value={apiLoading?"—":`AED ${(totalPipeline/1000).toFixed(0)}k`} sub={`${newCount} new leads`}/>
                  </div>
                );
                const COLORS   = {not_contacted:"#c0392b",cold:"#6e6e73",warm:"#1a56db",open:"#147d50",client:"#7c3aed"};
                const STATUS_LABELS = OUTREACH_STATUS_LABELS;
                const counts   = STATUSES.map(s=>allLeadsCombined.filter(l=>l.status===s).length);
                const values   = STATUSES.map(s=>allLeadsCombined.filter(l=>l.status===s).reduce((a,b)=>a+(b.value||0),0));
                const total    = counts.reduce((a,b)=>a+b,0)||1;

                // Palette for category / location charts
                const PAL = ["#6366f1","#f59e0b","#10b981","#3b82f6","#f43f5e","#8b5cf6","#ec4899","#14b8a6","#f97316","#06b6d4","#84cc16","#a78bfa"];

                const stageGroups = STATUSES.map((s,i)=>({label:STATUS_LABELS[s],count:counts[i],color:COLORS[s]})).filter(g=>g.count>0);

                const _catMap={};allLeadsCombined.forEach(l=>{if(l.category)_catMap[l.category]=(_catMap[l.category]||0)+1;});
                const catGroups = Object.entries(_catMap).sort((a,b)=>b[1]-a[1]).map(([label,count],i)=>({label,count,color:PAL[i%PAL.length]}));

                const _locMap={};allLeadsCombined.forEach(l=>{if(l.location){const k=l.location.split(",")[0].trim();_locMap[k]=(_locMap[k]||0)+1;}});
                const locGroups = Object.entries(_locMap).sort((a,b)=>b[1]-a[1]).map(([label,count],i)=>({label,count,color:PAL[i%PAL.length]}));

                // Reusable donut renderer
                const Donut = ({title,groups})=>{
                  const R=58,CIR=2*Math.PI*R,gt=groups.reduce((a,g)=>a+g.count,0)||1;
                  let o=0;
                  const sg=groups.map(g=>{const d=(g.count/gt)*CIR,s={...g,d,o};o+=d;return s;});
                  return (
                    <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",padding:"22px 24px"}}>
                      <div style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,marginBottom:16}}>{title}</div>
                      <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
                        <svg width={156} height={156} viewBox="0 0 156 156">
                          <circle cx={78} cy={78} r={R} fill="none" stroke={T.borderSub} strokeWidth={22}/>
                          {sg.filter(g=>g.count>0).map((g,i)=>(
                            <circle key={i} cx={78} cy={78} r={R} fill="none" stroke={g.color} strokeWidth={22}
                              strokeDasharray={`${g.d} ${CIR-g.d}`} strokeDashoffset={-(g.o-(CIR/4))}/>
                          ))}
                          <text x={78} y={74} textAnchor="middle" style={{fontSize:22,fontWeight:700,fill:T.text,fontFamily:"inherit"}}>{gt}</text>
                          <text x={78} y={89} textAnchor="middle" style={{fontSize:10,fill:T.muted,fontFamily:"inherit"}}>total</text>
                        </svg>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {sg.map((g,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:7}}>
                            <span style={{width:8,height:8,borderRadius:2,background:g.color,flexShrink:0}}/>
                            <span style={{fontSize:11.5,color:T.sub,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.label}</span>
                            <span style={{fontSize:12,fontWeight:600,color:T.text}}>{g.count}</span>
                            <span style={{fontSize:11,color:T.muted,minWidth:28,textAlign:"right"}}>{Math.round((g.count/gt)*100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                };

                // Daily reminders logic
                const today = new Date();
                const oneMonthAgo = new Date(today); oneMonthAgo.setMonth(oneMonthAgo.getMonth()-1);
                const openLead = l => { if(l._fromOutreach){const o=outreach.find(o=>o.id===l.id)||{...l,clientName:l.contact};setSelectedOutreach({...o,_xContacts:getXContacts('outreach',o.id)});}else{setSelectedLead({...l,_xContacts:getXContacts('lead',l.id)});} };
                const toContact = allLeadsCombined.filter(l=>l.status==="not_contacted").slice(0,5);
                const toFollowUp = allLeadsCombined.filter(l=>{
                  if(l.status==="not_contacted"||l.status==="client") return false;
                  const d=_parseDate(l.date); return d&&d<oneMonthAgo;
                }).slice(0,5);

                const ReminderCard = ({lead,showDate})=>(
                  <div onClick={()=>openLead(lead)} className="row" style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:12,border:`1px solid ${T.border}`,background:T.surface,cursor:"pointer",marginBottom:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.company}</div>
                      <div style={{fontSize:11.5,color:T.muted,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.contact||"—"}{lead.category?` · ${lead.category}`:""}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                      <OutreachBadge status={lead.status}/>
                      {showDate&&lead.date&&<span style={{fontSize:10.5,color:T.muted}}>{formatDate(lead.date)}</span>}
                    </div>
                    {lead.email&&<a href={`mailto:${lead.email}`} onClick={e=>e.stopPropagation()} style={{fontSize:11,color:T.link,textDecoration:"none",background:"#f0f4ff",padding:"4px 9px",borderRadius:7,whiteSpace:"nowrap",flexShrink:0}}>Email</a>}
                  </div>
                );

                return (
                  <div>
                    {_statsRow}
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:isMobile?12:18,marginBottom:isMobile?14:22}}>
                      <Donut title="Conversion" groups={stageGroups}/>
                      <Donut title="By Category" groups={catGroups}/>
                      <Donut title="By Location" groups={locGroups}/>
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?12:18}}>
                      <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",padding:"22px 24px"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                          <div style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600}}>Contact Today</div>
                          <span style={{fontSize:11,color:"#c0392b",background:"#fff3e0",padding:"2px 8px",borderRadius:999,fontWeight:500}}>Not yet reached out</span>
                        </div>
                        {toContact.length===0
                          ? <div style={{fontSize:13,color:T.muted,textAlign:"center",padding:"24px 0"}}>All leads contacted!</div>
                          : toContact.map(l=><ReminderCard key={l.id} lead={l} showDate={false}/>)
                        }
                      </div>
                      <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",padding:"22px 24px"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                          <div style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600}}>Follow Up</div>
                          <span style={{fontSize:11,color:"#92680a",background:"#fff8e8",padding:"2px 8px",borderRadius:999,fontWeight:500}}>1+ month since contact</span>
                        </div>
                        {toFollowUp.length===0
                          ? <div style={{fontSize:13,color:T.muted,textAlign:"center",padding:"24px 0"}}>No follow-ups due yet.</div>
                          : toFollowUp.map(l=><ReminderCard key={l.id} lead={l} showDate={true}/>)
                        }
                      </div>
                    </div>
                  </div>
                );
              })()}

              {leadsView==="leads"&&(
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
                    <SearchBar value={getSearch("Leads")} onChange={v=>setSearch("Leads",v)} placeholder="Search company or contact…"/>
                    <span style={{fontSize:12,color:T.muted}}>{filteredLeads.length} leads</span>
                    <button onClick={()=>downloadCSV(filteredLeads,[{key:"company",label:"Company"},{key:"contact",label:"Contact"},{key:"role",label:"Role"},{key:"email",label:"Email"},{key:"category",label:"Category"},{key:"status",label:"Status"},{key:"date",label:"Date Contacted"},{key:"value",label:"Value (AED)"},{key:"location",label:"Location"},{key:"notes",label:"Notes"}],"leads.csv")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>CSV</button>
                    <button onClick={()=>exportTablePDF(filteredLeads,[{key:"company",label:"Company"},{key:"contact",label:"Contact"},{key:"role",label:"Role"},{key:"email",label:"Email"},{key:"category",label:"Category"},{key:"status",label:"Status"},{key:"date",label:"Date Contacted"}],"Leads Pipeline")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>PDF</button>
                    <BtnPrimary onClick={()=>setShowAddLead(true)}>+ New Lead</BtnPrimary>
                  </div>
                  <div style={{display:"flex",gap:16,marginBottom:12,flexWrap:"wrap"}}>
                    {[["not_contacted","Not yet reached out","#c0392b","#fff3e0"],["cold","No response",T.sub,"#f5f5f7"],["warm","Responded","#1a56db","#eef4ff"],["open","Meeting arranged","#147d50","#edfaf3"],["client","Converted to client","#7c3aed","#f3e8ff"]].map(([s,l,c,bg])=>(
                      <div key={s} style={{display:"flex",alignItems:"center",gap:6,fontSize:11.5}}><span style={{width:7,height:7,borderRadius:"50%",background:bg,border:`1.5px solid ${c}`}}/><span style={{color:c,fontWeight:600}}>{OUTREACH_STATUS_LABELS[s]}</span><span style={{color:T.muted}}>— {l}</span></div>
                    ))}
                    <span style={{fontSize:11.5,color:T.muted,marginLeft:"auto"}}>Click badge to cycle</span>
                  </div>
                  <div className="mob-table-wrap" style={{borderRadius:16,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",background:T.surface,minWidth:isMobile?620:"auto"}}>
                      <thead><tr>
                        <TH>Company</TH><TH>Contact</TH><TH>Role</TH><TH>Email</TH>
                        <THFilter label="Category" value={leadCat} onChange={setLeadCat} options={[...LEAD_CATEGORIES,...customLeadCats]}/>
                        <THFilter label="Status" value={leadStatus} onChange={setLeadStatus} options={[{value:"All",label:"All"},...OUTREACH_STATUSES.map(s=>({value:s,label:OUTREACH_STATUS_LABELS[s]}))]}/>
                        <THFilter label="Date Contacted" value={leadMonth} onChange={setLeadMonth} options={leadMonths}/>
                      </tr></thead>
                      <tbody>
                        {filteredLeads.map(l=>(
                          <tr key={`${l._fromOutreach?"o":"l"}_${l.id}`} className="row" onClick={()=>{ if(l._fromOutreach){const o=outreach.find(o=>o.id===l.id)||{...l,clientName:l.contact};setSelectedOutreach({...o,_xContacts:getXContacts('outreach',o.id)});}else{setSelectedLead({...l,_xContacts:getXContacts('lead',l.id)});}}}>
                            <TD bold>{l.company}</TD><TD>{l.contact}</TD><TD muted>{l.role||""}</TD>
                            <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}><a href={`mailto:${l.email}`} onClick={e=>e.stopPropagation()} style={{fontSize:12.5,color:T.link,textDecoration:"none"}}>{l.email}</a></td>
                            <TD muted>{l.category}</TD>
                            <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}} onClick={e=>e.stopPropagation()}><OutreachBadge status={l.status} onClick={async()=>{const next=OUTREACH_STATUSES[(OUTREACH_STATUSES.indexOf(l.status)+1)%OUTREACH_STATUSES.length];if(l._fromOutreach){await api.put(`/api/outreach/${l.id}`,{status:next});setOutreach(prev=>prev.map(x=>x.id===l.id?{...x,status:next}:x));}else{await api.put(`/api/leads/${l.id}`,{status:next});setLocalLeads(prev=>prev.map(x=>x.id===l.id?{...x,status:next}:x));}if(next==="client")promoteToClient(l);}}/></td>
                            <TD muted>{formatDate(l.date)}</TD>
                          </tr>
                        ))}
                        {filteredLeads.length===0&&<tr><td colSpan={7} style={{padding:44,textAlign:"center",color:T.muted,fontSize:13}}>No leads found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {leadsView==="clients"&&(
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                    <SearchBar value={getSearch("Clients")} onChange={v=>setSearch("Clients",v)} placeholder="Search clients…"/>
                    <span style={{fontSize:12,color:T.muted}}>{localClients.filter(c=>!getSearch("Clients")||c.company.toLowerCase().includes(getSearch("Clients").toLowerCase())).length} clients</span>
                  </div>
                  {localClients.filter(c=>!getSearch("Clients")||c.company.toLowerCase().includes(getSearch("Clients").toLowerCase())).length===0
                    ? <div style={{borderRadius:16,padding:44,textAlign:"center",background:T.surface,border:`1px solid ${T.border}`,color:T.muted,fontSize:13}}>No clients yet. Leads marked as "Client" will appear here automatically.</div>
                    : <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:14}}>
                        {localClients.filter(c=>!getSearch("Clients")||c.company.toLowerCase().includes(getSearch("Clients").toLowerCase())).map(c=>{
                          const cKey = (c.company||"").trim().toLowerCase();
                          const cProjects = localProjects.filter(p=>(p.client||"").trim().toLowerCase()===cKey);
                          const cRevenue  = cProjects.reduce((a,p)=>a+(p.revenue||0),0);
                          return (
                            <div key={c.id} className="proj-card" style={{borderRadius:16,padding:22,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                                <div style={{fontSize:15,fontWeight:600,color:T.text,letterSpacing:"-0.01em",lineHeight:1.3}}>{c.company}</div>
                                <div style={{display:"flex",alignItems:"center",gap:6}}>
                                  <span style={{fontSize:10,padding:"3px 9px",borderRadius:999,background:"#f3e8ff",color:"#7c3aed",fontWeight:500,flexShrink:0}}>Client</span>
                                  <button onClick={async()=>{if(!confirm(`Delete ${c.company}?`))return;await api.delete(`/api/clients/${c.id}`);setLocalClients(prev=>prev.filter(x=>x.id!==c.id));}} title="Delete client" style={{background:"none",border:"none",color:T.muted,fontSize:15,cursor:"pointer",padding:"1px 4px",borderRadius:5,lineHeight:1,flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#c0392b"} onMouseOut={e=>e.currentTarget.style.color=T.muted}>×</button>
                                </div>
                              </div>
                              {c.name&&<div style={{fontSize:12.5,color:T.sub,marginBottom:2,fontWeight:500}}>{c.name}</div>}
                              {c.country&&<div style={{fontSize:12,color:T.muted,marginBottom:12}}>{c.country}</div>}
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12,padding:"10px 12px",background:"#fafafa",borderRadius:10}}>
                                <div>
                                  <div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:3}}>Revenue</div>
                                  <div style={{fontSize:17,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>AED {cRevenue.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:3}}>Projects</div>
                                  <div style={{fontSize:17,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>{cProjects.length}</div>
                                </div>
                              </div>
                              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                                {c.email&&<a href={`mailto:${c.email}`} style={{fontSize:12,color:T.link,textDecoration:"none"}}>{c.email}</a>}
                                {c.phone&&<div style={{fontSize:12,color:T.muted}}>{c.phone}</div>}
                                {c.notes&&<div style={{fontSize:11.5,color:T.muted,marginTop:4,fontStyle:"italic"}}>{c.notes}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                  }
                </div>
              )}

              {leadsView==="outreach"&&(
                <div>
                  <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:20,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                    <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.borderSub}`,fontSize:10,color:T.muted,letterSpacing:"0.07em",textTransform:"uppercase",background:"#fafafa",fontWeight:600}}>Add Outreach Contact via AI</div>
                    <div style={{padding:"13px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
                      <textarea value={outreachMsg} onChange={e=>setOutreachMsg(e.target.value)} rows={2} placeholder={`e.g. "Rimowa - Priya Singh | Head of Marketing priya@rimowa.com, 27 Feb 2026, Fashion, Dubai, UAE"`} style={{flex:1,background:"#fafafa",border:`1px solid ${T.border}`,borderRadius:10,padding:"9px 13px",color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none"}}/>
                      <BtnPrimary onClick={processOutreach} disabled={outreachLoading||!outreachMsg.trim()}>{outreachLoading?"Adding…":"Add"}</BtnPrimary>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                    <SearchBar value={getSearch("Outreach")} onChange={v=>setSearch("Outreach",v)} placeholder="Search outreach…"/>
                    <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${T.border}`,flexShrink:0}}>
                      <button onClick={()=>setOutreachSort("date")} style={{padding:"5px 11px",background:outreachSort==="date"?T.accent:"#f5f5f7",border:"none",color:outreachSort==="date"?"#fff":T.sub,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>Recent first</button>
                      <button onClick={()=>setOutreachSort("az")} style={{padding:"5px 11px",background:outreachSort==="az"?T.accent:"#f5f5f7",border:"none",borderLeft:`1px solid ${T.border}`,color:outreachSort==="az"?"#fff":T.sub,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>A–Z</button>
                    </div>
                    <span style={{fontSize:12,color:T.muted}}>{filteredOutreach.length} contacts</span>
                    <button onClick={()=>downloadCSV(filteredOutreach,[{key:"company",label:"Company"},{key:"clientName",label:"Contact"},{key:"role",label:"Role"},{key:"email",label:"Email"},{key:"category",label:"Category"},{key:"status",label:"Status"},{key:"date",label:"Date Contacted"},{key:"value",label:"Value (AED)"},{key:"location",label:"Location"},{key:"notes",label:"Notes"}],"outreach.csv")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>CSV</button>
                    <button onClick={()=>exportTablePDF(filteredOutreach,[{key:"company",label:"Company"},{key:"clientName",label:"Contact"},{key:"role",label:"Role"},{key:"email",label:"Email"},{key:"category",label:"Category"},{key:"status",label:"Status"},{key:"date",label:"Date Contacted"}],"Outreach Tracker")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>PDF</button>
                  </div>
                  <div style={{display:"flex",gap:16,marginBottom:12,flexWrap:"wrap"}}>
                    {[["cold","No response",T.sub,"#f5f5f7"],["warm","Responded","#1a56db","#eef4ff"],["open","Meeting arranged","#147d50","#edfaf3"],["client","Converted to client","#7c3aed","#f3e8ff"]].map(([s,l,c,bg])=>(
                      <div key={s} style={{display:"flex",alignItems:"center",gap:6,fontSize:11.5}}><span style={{width:7,height:7,borderRadius:"50%",background:bg,border:`1.5px solid ${c}`}}/><span style={{color:c,fontWeight:600}}>{OUTREACH_STATUS_LABELS[s]}</span><span style={{color:T.muted}}>— {l}</span></div>
                    ))}
                    <span style={{fontSize:11.5,color:T.muted,marginLeft:"auto"}}>Click badge to cycle</span>
                  </div>
                  <div className="mob-table-wrap" style={{borderRadius:16,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",background:T.surface,minWidth:isMobile?660:"auto"}}>
                      <thead><tr>
                        <TH>Company</TH><TH>Contact</TH><TH>Role</TH><TH>Email</TH>
                        <THFilter label="Category" value={outreachCatFilter} onChange={setOutreachCatFilter} options={outreachCategories}/>
                        <THFilter label="Status" value={outreachStatusFilter} onChange={setOutreachStatusFilter} options={[{value:"All",label:"All"},...OUTREACH_STATUSES.filter(s=>s!=="not_contacted").map(s=>({value:s,label:OUTREACH_STATUS_LABELS[s]}))]}/>
                        <THFilter label="Date Contacted" value={outreachMonthFilter} onChange={setOutreachMonthFilter} options={outreachMonths}/>
                        <TH/>
                      </tr></thead>
                      <tbody>
                        {filteredOutreach.map(o=>(
                          <tr key={o.id} className="row" onClick={()=>setSelectedOutreach({...o,_xContacts:getXContacts('outreach',o.id)})}>
                            <TD bold>{o.company}</TD><TD>{o.clientName}</TD><TD muted>{o.role}</TD>
                            <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}><a href={`mailto:${o.email}`} onClick={e=>e.stopPropagation()} style={{fontSize:12.5,color:T.link,textDecoration:"none"}}>{o.email}</a></td>
                            <TD muted>{o.category}</TD>
                            <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}} onClick={e=>e.stopPropagation()}><OutreachBadge status={o.status} onClick={async()=>{const next=OUTREACH_STATUSES[(OUTREACH_STATUSES.indexOf(o.status)+1)%OUTREACH_STATUSES.length];await api.put(`/api/outreach/${o.id}`,{status:next});setOutreach(prev=>prev.map(x=>x.id===o.id?{...x,status:next}:x));if(next==="client")promoteToClient({...o,contact:o.clientName});}}/></td>
                            <TD muted>{formatDate(o.date)}</TD>
                            <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}} onClick={e=>e.stopPropagation()}><button onClick={async()=>{archiveItem('outreach',o);await api.delete(`/api/outreach/${o.id}`);setOutreach(prev=>prev.filter(x=>x.id!==o.id));}} style={{background:"none",border:"none",color:T.muted,fontSize:16,cursor:"pointer",padding:0}}>×</button></td>
                          </tr>
                        ))}
                        {filteredOutreach.length===0&&<tr><td colSpan={8} style={{padding:44,textAlign:"center",color:T.muted,fontSize:13}}>No outreach contacts found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ PROJECTS ══ */}
          {activeTab==="Projects"&&(()=>{
            if (selectedProject) return (
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:22}}>
                  <button onClick={()=>{setSelectedProject(null);setProjectSection("Home");setEditingEstimate(null);setGeneratedContract("");setCreativeSubSection(null);setBudgetSubSection(null);setDocumentsSubSection(null);setScheduleSubSection(null);}} style={{background:"none",border:"none",color:T.sub,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,display:"flex",alignItems:"center",gap:4,fontWeight:500}}>‹ Projects</button>
                  {projectSection!=="Home"&&<><span style={{color:T.muted}}>›</span><button onClick={()=>{setProjectSection("Home");setEditingEstimate(null);setCreativeSubSection(null);setBudgetSubSection(null);setDocumentsSubSection(null);setScheduleSubSection(null);}} style={{background:"none",border:"none",color:T.sub,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0}}>{selectedProject.name}</button></>}
                </div>
                {projectSection!=="Home"&&(
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
                    <select value={projectSection} onChange={e=>{setProjectSection(e.target.value);setEditingEstimate(null);setCreativeSubSection(null);setBudgetSubSection(null);setDocumentsSubSection(null);setScheduleSubSection(null);}} style={{padding:"8px 30px 8px 13px",borderRadius:10,background:"#fff",border:"1px solid #d2d2d7",color:"#1d1d1f",fontSize:13,fontFamily:"inherit",cursor:"pointer",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23aeaeb2' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 11px center",fontWeight:500,boxShadow:"0 1px 2px rgba(0,0,0,0.05)",minWidth:200}}>
                      {PROJECT_SECTIONS.filter(s=>s!=="Home").map(sec=>(
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                )}
                {renderProjectSection(selectedProject)}
              </div>
            );
            return (
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
                  <SearchBar value={getSearch("Projects")} onChange={v=>setSearch("Projects",v)} placeholder="Search projects…"/>
                  <div style={{display:"flex",gap:6}}>{[2024,2025,2026].map(y=><Pill key={y} label={String(y)} active={projectYear===y} onClick={()=>setProjectYear(y)}/>)}</div>
                  <span style={{marginLeft:"auto",fontSize:12,color:T.muted}}>{projects.length} projects</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:14,marginBottom:20}}>
                  <StatCard label="Total Revenue" value={`AED ${(projRev/1000).toFixed(0)}k`}/>
                  <StatCard label="Total Profit"  value={`AED ${(projProfit/1000).toFixed(0)}k`}/>
                  <StatCard label="Avg Margin"    value={`${projMargin}%`}/>
                </div>
                {/* Archive drop zone — shown while dragging */}
                <div
                  id="archive-drop-zone"
                  onDragOver={e=>{e.preventDefault();document.getElementById("archive-drop-zone").style.borderColor="#1d1d1f";document.getElementById("archive-drop-zone").style.background="#f0f0f2";}}
                  onDragLeave={e=>{document.getElementById("archive-drop-zone").style.borderColor="#d2d2d7";document.getElementById("archive-drop-zone").style.background="transparent";}}
                  onDrop={e=>{
                    e.preventDefault();
                    const id=Number(e.dataTransfer.getData("projectId"));
                    const proj=projects.find(p=>p.id===id);
                    if(proj){setArchivedProjects(prev=>[...prev,proj]);}
                    document.getElementById("archive-drop-zone").style.borderColor="#d2d2d7";
                    document.getElementById("archive-drop-zone").style.background="transparent";
                  }}
                  style={{border:"2px dashed #d2d2d7",borderRadius:14,padding:"18px 24px",marginBottom:16,display:"flex",alignItems:"center",gap:12,transition:"all 0.15s",background:"transparent",cursor:"default"}}
                >
                  <span style={{fontSize:18,opacity:0.4}}>⊘</span>
                  <div>
                    <div style={{fontSize:12.5,fontWeight:600,color:T.sub}}>Archive zone</div>
                    <div style={{fontSize:11.5,color:T.muted}}>Drag a project card here to archive it</div>
                  </div>
                  {archivedProjects.length>0&&<button onClick={()=>setShowArchive(v=>!v)} style={{marginLeft:"auto",padding:"5px 12px",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",border:`1px solid ${T.border}`,background:showArchive?"#1d1d1f":"transparent",color:showArchive?"#fff":T.sub,fontFamily:"inherit",transition:"all 0.12s"}}>{showArchive?"Hide archive":"View archive"} ({archivedProjects.length})</button>}
                </div>

                {showArchive&&archivedProjects.length>0&&(
                  <div style={{marginBottom:20}}>
                    <div style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,marginBottom:10}}>Archived Projects</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                      {archivedProjects.map(p=>{
                        const profit=p.revenue-p.cost; const margin=Math.round((profit/p.revenue)*100);
                        return (
                          <div key={p.id} style={{borderRadius:14,padding:16,background:"#fafafa",border:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:10,opacity:0.75}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                              <div>
                                <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{p.client}</div>
                                <div style={{fontSize:13,fontWeight:600,color:T.sub}}>{p.name}</div>
                              </div>
                              <button onClick={()=>setArchivedProjects(prev=>prev.filter(a=>a.id!==p.id))} style={{fontSize:11,color:T.link,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:500,whiteSpace:"nowrap"}}>Restore</button>
                            </div>
                            <div style={{display:"flex",gap:14}}>
                              <div><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",marginBottom:2}}>Revenue</div><div style={{fontSize:14,fontWeight:700,color:T.sub}}>AED {p.revenue.toLocaleString()}</div></div>
                              <div><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",marginBottom:2}}>Margin</div><div style={{fontSize:14,fontWeight:700,color:T.sub}}>{margin}%</div></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:14}}>
                  {projects.filter(p=>!getSearch("Projects")||`${p.client} ${p.name}`.toLowerCase().includes(getSearch("Projects").toLowerCase())).map(p=>{
                    const profit=p.revenue-p.cost; const margin=Math.round((profit/p.revenue)*100);
                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={e=>{e.dataTransfer.setData("projectId",String(p.id));e.currentTarget.style.opacity="0.5";}}
                        onDragEnd={e=>{e.currentTarget.style.opacity="1";}}
                        className="proj-card"
                        style={{borderRadius:16,padding:20,background:T.surface,border:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:14,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",cursor:"grab"}}
                      >
                        <div onClick={()=>{setSelectedProject(p);setProjectSection("Home");}} style={{display:"flex",flexDirection:"column",gap:14,cursor:"pointer"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                            <div>
                              <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:3,fontWeight:500}}>{p.client}</div>
                              <div style={{fontSize:14,fontWeight:600,color:T.text,letterSpacing:"-0.01em"}}>{p.name}</div>
                            </div>
                            <span style={{fontSize:10,padding:"3px 9px",borderRadius:999,background:projStatusBg[p.status]||"#f5f5f7",color:projStatusColor[p.status]||T.muted,fontWeight:500,whiteSpace:"nowrap"}}>{p.status}</span>
                          </div>
                          <div style={{borderTop:`1px solid ${T.borderSub}`}}/>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                            <div>
                              <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.04em",textTransform:"uppercase"}}>Revenue</div>
                              <div style={{fontSize:20,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>AED {p.revenue.toLocaleString()}</div>
                            </div>
                            <div>
                              <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.04em",textTransform:"uppercase"}}>Profit</div>
                              <div style={{fontSize:20,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>AED {profit.toLocaleString()}</div>
                            </div>
                          </div>
                          <div>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:11.5,color:T.muted}}>Margin</span><span style={{fontSize:11.5,fontWeight:600,color:T.text}}>{margin}%</span></div>
                            <div style={{height:3,borderRadius:999,background:T.borderSub}}><div style={{width:`${margin}%`,height:"100%",borderRadius:999,background:T.accent}}/></div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:8,marginTop:-4}}>
                          <button
                            onClick={e=>{e.stopPropagation();setArchivedProjects(prev=>[...prev,p]);}}
                            style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"7px",borderRadius:9,background:"transparent",border:`1px solid ${T.borderSub}`,color:T.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:500,transition:"all 0.12s"}}
                            onMouseOver={e=>{e.currentTarget.style.background="#f5f5f7";e.currentTarget.style.color=T.sub;}}
                            onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.muted;}}
                          >
                            <span style={{fontSize:13}}>⊘</span> Archive
                          </button>
                          <button
                            onClick={async e=>{e.stopPropagation();if(!confirm(`Delete "${p.name}"? This cannot be undone.`))return;await api.delete(`/api/projects/${p.id}`);setLocalProjects(prev=>prev.filter(x=>x.id!==p.id));}}
                            style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"7px 11px",borderRadius:9,background:"transparent",border:`1px solid ${T.borderSub}`,color:T.muted,fontSize:13,cursor:"pointer",transition:"all 0.12s"}}
                            onMouseOver={e=>{e.currentTarget.style.background="#fff0f0";e.currentTarget.style.borderColor="#fdc5c5";e.currentTarget.style.color="#c0392b";}}
                            onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=T.borderSub;e.currentTarget.style.color=T.muted;}}
                            title="Delete project"
                          >×</button>
                        </div>
                      </div>
                    );
                  })}
                  {projects.length===0&&<div style={{gridColumn:"span 3",padding:52,textAlign:"center",color:T.muted,fontSize:13,borderRadius:16,background:T.surface,border:`1px solid ${T.border}`}}>No projects for {projectYear}.</div>}
                </div>
              </div>
            );
          })()}

          {/* ══ RESOURCES ══ */}
          {activeTab==="Resources"&&(
            <div>
              {vaultLocked ? (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}>
                  <div style={{width:380,background:T.surface,borderRadius:20,padding:"44px 40px",border:`1px solid ${T.border}`,boxShadow:"0 8px 40px rgba(0,0,0,0.07)",textAlign:"center"}}>
                    <div style={{width:56,height:56,borderRadius:"50%",background:"#1d1d1f",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:24}}>🔒</div>
                    <div style={{fontSize:20,fontWeight:700,color:T.text,marginBottom:6,letterSpacing:"-0.02em"}}>Vault</div>
                    <div style={{fontSize:12,color:T.muted,lineHeight:1.7,marginBottom:28}}>Protected with AES-256-GCM encryption.<br/>Your data is never stored unencrypted.</div>
                    <div style={{display:"flex",flexDirection:"column",gap:12,textAlign:"left"}}>
                      <div>
                        <div style={{fontSize:10,fontWeight:600,color:T.muted,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:5}}>Vault Password</div>
                        <input type="password" value={vaultPass} onChange={e=>{setVaultPass(e.target.value);setVaultErr("");}} onKeyDown={e=>{if(e.key==="Enter")unlockVault();}} placeholder="••••••••••" autoFocus style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${vaultErr?"#c0392b":T.border}`,fontSize:14,fontFamily:"inherit",color:T.text,background:"#fafafa",boxSizing:"border-box"}}/>
                      </div>
                      {vaultErr&&<div style={{fontSize:12,color:"#c0392b",textAlign:"center",fontWeight:500}}>{vaultErr}</div>}
                      <button onClick={unlockVault} disabled={vaultLoading||!vaultPass.trim()} style={{padding:"12px",borderRadius:10,background:vaultLoading?"#d2d2d7":"#1d1d1f",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:vaultLoading?"not-allowed":"pointer",fontFamily:"inherit"}}>{vaultLoading?"Unlocking…":"Unlock Vault"}</button>
                    </div>
                    <div style={{marginTop:22,fontSize:11,color:T.muted,lineHeight:1.8}}>First time? Set a strong vault password.<br/>It cannot be recovered if forgotten.</div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* ── Vault header ── */}
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
                    <Pill label="Passwords" active={vaultView==="passwords"} onClick={()=>setVaultView("passwords")}/>
                    <Pill label="Documents"  active={vaultView==="files"}     onClick={()=>setVaultView("files")}/>
                    <button onClick={()=>{setVaultLocked(true);setVaultKey(null);setVaultPass("");setVaultResources([]);}} style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:9,background:"transparent",border:`1px solid ${T.border}`,color:T.sub,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>🔒 Lock vault</button>
                  </div>

                  {/* ── PASSWORD VIEW ── */}
                  {vaultView==="passwords"&&(
                    <div>
                      <button onClick={()=>{setVaultEditId(null);setVaultAddPwOpen(true);setVaultNewPw({name:"",url:"",username:"",password:"",notes:""});}} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:10,background:T.surface,border:`1px solid ${T.border}`,color:T.sub,fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 1px 2px rgba(0,0,0,0.04)",marginBottom:14}}>+ Add Password</button>
                      <div style={{marginBottom:12}}>
                        <input value={vaultPwSearch} onChange={e=>setVaultPwSearch(e.target.value)} placeholder="Search passwords…" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:13,fontFamily:"inherit",color:T.text,background:T.surface,boxSizing:"border-box"}}/>
                      </div>
                      <div className="mob-table-wrap" style={{borderRadius:16,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",marginBottom:14}}>
                        <table style={{width:"100%",borderCollapse:"collapse",background:T.surface,minWidth:isMobile?480:"auto"}}>
                          <thead><tr>
                            <TH>Service / Name</TH><TH>URL</TH><TH>Username / Email</TH><TH>Password</TH>
                          </tr></thead>
                          <tbody>
                            {vaultResources.filter(r=>r.type==="password"&&(!vaultPwSearch||[r.name,r.username,r.url,r.notes].some(v=>v&&v.toLowerCase().includes(vaultPwSearch.toLowerCase())))).sort((a,b)=>(a.name||"").toLowerCase().localeCompare((b.name||"").toLowerCase())).map(e=>(
                              <tr key={e.id} className="row" onClick={()=>setVaultViewEntry(e)} style={{cursor:"pointer"}}>
                                <TD bold>{e.name}</TD>
                                <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}>{e.url?<a href={e.url.startsWith("http")?e.url:`https://${e.url}`} target="_blank" rel="noreferrer" onClick={ev=>ev.stopPropagation()} style={{fontSize:12.5,color:T.link,textDecoration:"none"}}>{e.url}</a>:null}</td>
                                <TD muted>{e.username}</TD>
                                <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}>
                                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                                    <span style={{fontSize:12.5,color:T.sub,fontFamily:"monospace",letterSpacing:"0.04em"}}>{vaultShowPw[e.id]?e.password:"••••••••"}</span>
                                    <button onClick={ev=>{ev.stopPropagation();setVaultShowPw(p=>({...p,[e.id]:!p[e.id]}));}} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,padding:"2px 4px",color:T.muted,borderRadius:4}}>{vaultShowPw[e.id]?"🙈":"👁"}</button>
                                    <button onClick={ev=>{ev.stopPropagation();vaultCopyPw(e.id,e.password);}} style={{background:vaultCopied===e.id?"#edfaf3":"none",border:"none",cursor:"pointer",fontSize:11,padding:"3px 8px",color:vaultCopied===e.id?"#147d50":T.muted,borderRadius:5,fontFamily:"inherit",fontWeight:500,transition:"all 0.15s"}}>{vaultCopied===e.id?"Copied!":"Copy"}</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {vaultResources.filter(r=>r.type==="password").length===0&&<tr><td colSpan={4} style={{padding:36,textAlign:"center",color:T.muted,fontSize:13}}>No passwords saved yet.</td></tr>}
                            {vaultResources.filter(r=>r.type==="password").length>0&&vaultResources.filter(r=>r.type==="password"&&(!vaultPwSearch||[r.name,r.username,r.url,r.notes].some(v=>v&&v.toLowerCase().includes(vaultPwSearch.toLowerCase())))).length===0&&<tr><td colSpan={4} style={{padding:36,textAlign:"center",color:T.muted,fontSize:13}}>No results for "{vaultPwSearch}"</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── FILES VIEW ── */}
                  {vaultView==="files"&&(
                    <div>
                      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:14,marginBottom:14}}>
                        {vaultResources.filter(r=>r.type==="file").map(e=>(
                          <div key={e.id} style={{borderRadius:16,padding:20,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",display:"flex",flexDirection:"column",gap:10}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                              <div style={{fontSize:28,lineHeight:1}}>📄</div>
                              <button onClick={()=>deleteVaultEntry(e.id)} style={{background:"none",border:"none",color:T.muted,fontSize:16,cursor:"pointer",padding:0}} onMouseOver={ev=>ev.currentTarget.style.color="#c0392b"} onMouseOut={ev=>ev.currentTarget.style.color=T.muted}>×</button>
                            </div>
                            <div>
                              <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:2}}>{e.name}</div>
                              <div style={{fontSize:11,color:T.muted}}>{e.filename} · {e.size?(e.size/1024).toFixed(0)+" KB":""}</div>
                            </div>
                            <button onClick={()=>downloadVaultFile(e)} style={{marginTop:"auto",padding:"8px 14px",borderRadius:9,background:"#1d1d1f",color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>⬇ Download</button>
                          </div>
                        ))}

                        {/* Upload card */}
                        <label style={{borderRadius:16,padding:20,background:"#fafafa",border:`2px dashed ${T.border}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,minHeight:140,transition:"border-color 0.15s"}} onMouseOver={e=>e.currentTarget.style.borderColor="#1d1d1f"} onMouseOut={e=>e.currentTarget.style.borderColor=T.border}>
                          <div style={{fontSize:28,opacity:0.3}}>⬆</div>
                          <div style={{fontSize:13,fontWeight:500,color:T.sub,textAlign:"center"}}>
                            {vaultFileRef ? <span style={{color:"#1d1d1f",fontWeight:600}}>{vaultFileRef.name}</span> : "Click to upload"}
                          </div>
                          {vaultFileRef&&<div style={{fontSize:11,color:T.muted}}>{(vaultFileRef.size/1024).toFixed(0)} KB</div>}
                          <input type="file" style={{display:"none"}} onChange={e=>{if(e.target.files[0]){if(e.target.files[0].size>5*1024*1024){alert("Max file size is 5MB");return;}setVaultFileRef(e.target.files[0]);setVaultFileName(e.target.files[0].name);}}}/>
                        </label>
                      </div>

                      {vaultFileRef&&(
                        <div style={{marginBottom:14}}>
                          <div style={{display:"flex",gap:10,alignItems:"center",padding:"14px 18px",borderRadius:12,background:T.surface,border:`1px solid ${vaultFileErr?"#c0392b":T.border}`}}>
                            <input value={vaultFileName} onChange={e=>setVaultFileName(e.target.value)} placeholder="Display name (optional)" style={{flex:1,padding:"8px 12px",borderRadius:9,border:`1px solid ${T.border}`,fontSize:13,fontFamily:"inherit",color:T.text,background:"#fafafa"}}/>
                            <BtnPrimary onClick={()=>addVaultFile(vaultFileRef)} disabled={vaultSaving}>{vaultSaving?"Encrypting…":"Encrypt & Save"}</BtnPrimary>
                            <BtnSecondary onClick={()=>{setVaultFileRef(null);setVaultFileName("");setVaultFileErr("");}}>Cancel</BtnSecondary>
                          </div>
                          {vaultFileErr&&<div style={{fontSize:12,color:"#c0392b",marginTop:6,paddingLeft:4,fontWeight:500}}>{vaultFileErr}</div>}
                        </div>
                      )}

                      {vaultResources.filter(r=>r.type==="file").length===0&&!vaultFileRef&&(
                        <div style={{borderRadius:16,padding:44,textAlign:"center",background:T.surface,border:`1px solid ${T.border}`,color:T.muted,fontSize:13}}>No documents yet. Upload trade license, contracts, and other sensitive files above.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        {/* ── AGENTS TAB ── */}
        {activeTab==="Agents"&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:isMobile?36:56,paddingBottom:40,paddingLeft:16,paddingRight:16}}>
            {/* Stars row */}
            <div style={{display:"flex",gap:isMobile?28:60,justifyContent:"center",marginBottom:agentActiveIdx!==null?24:0,transition:"margin 0.2s ease"}}>
              {AGENT_DEFS.map((a,i)=>(
                <button key={a.id}
                  onClick={()=>setAgentActiveIdx(agentActiveIdx===i?null:i)}
                  onMouseEnter={()=>setAgentHoverIdx(i)}
                  onMouseLeave={()=>setAgentHoverIdx(null)}
                  style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:isMobile?4:8,padding:"8px",borderRadius:20,transition:"transform 0.18s ease",transform:agentActiveIdx===i?"scale(1.12)":"scale(1)"}}>
                  <div style={{transform:isMobile?"scale(0.72)":"scale(1)",transformOrigin:"center"}}>
                    <a.Blob mood={agentActiveIdx===i?"excited":agentHoverIdx===i?"talking":"idle"} bob={0}/>
                  </div>
                  <span style={{fontSize:10,fontWeight:700,color:"#1d1d1f",fontFamily:"Avenir,'Avenir Next',sans-serif",letterSpacing:1.2,textTransform:"uppercase"}}>{a.name}</span>
                </button>
              ))}
            </div>
            {/* Chat bubble — appears below stars when a star is active */}
            {agentActiveIdx!==null&&(
              <div style={{width:isMobile?"100%":380,background:"white",borderRadius:20,border:"1.5px solid #e5e5ea",boxShadow:"0 8px 32px rgba(0,0,0,0.08)",display:"flex",flexDirection:"column",height:isMobile?"60vh":440,overflow:"hidden"}}>
                {/* Bubble header */}
                <div style={{padding:"13px 18px 10px",borderBottom:"1px solid #f2f2f7",display:"flex",alignItems:"center",flexShrink:0}}>
                  <span style={{fontWeight:700,fontSize:12,color:"#1d1d1f",fontFamily:"Avenir,'Avenir Next',sans-serif",letterSpacing:1.2,textTransform:"uppercase"}}>{AGENT_DEFS[agentActiveIdx].name}</span>
                  <button onClick={()=>setAgentActiveIdx(null)} style={{marginLeft:"auto",background:"none",border:"none",fontSize:17,color:"#aeaeb2",cursor:"pointer",padding:"2px 6px",lineHeight:1}}>✕</button>
                </div>
                {/* AgentCard renders inline chat content */}
                {AGENT_DEFS.map((a,i)=>(
                  <AgentCard key={a.id} agent={a} active={agentActiveIdx===i} onSelect={()=>setAgentActiveIdx(i)} onClose={()=>setAgentActiveIdx(null)}
                    allVendors={a.id==="logistical"?vendors:undefined}
                    allLeads={a.id==="logistical"?localLeads:undefined}
                    onUpdateVendor={a.id==="logistical"?(id,fields)=>{setVendors(prev=>prev.map(v=>v.id===id?{...v,...fields}:v));}:undefined}
                    onUpdateLead={a.id==="logistical"?(id,fields)=>{setLocalLeads(prev=>prev.map(l=>l.id===id?{...l,...fields}:l));}:undefined}
                    gcalToken={a.id==="minnie"?gcalToken:undefined}
                    gcalEvents={a.id==="minnie"?gcalEvents:undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NOTES TAB ── */}
        {activeTab==="Notes"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div style={{fontSize:22,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Notes</div>
              <button onClick={()=>{setNoteAddOpen(true);setNoteEditId(null);setNoteDraft({title:"",content:""});}} style={{padding:"9px 18px",borderRadius:10,background:"#1d1d1f",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New Note</button>
            </div>

            {/* Add / Edit form */}
            {noteAddOpen&&(
              <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,padding:"22px 24px",marginBottom:20,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
                <input value={noteDraft.title} onChange={e=>setNoteDraft(p=>({...p,title:e.target.value}))} placeholder="Title" autoFocus style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:15,fontWeight:600,fontFamily:"inherit",color:T.text,background:"#fafafa",boxSizing:"border-box",marginBottom:10}}/>
                <textarea value={noteDraft.content} onChange={e=>setNoteDraft(p=>({...p,content:e.target.value}))} placeholder="Write your note…" rows={6} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:13,fontFamily:"inherit",color:T.text,background:"#fafafa",boxSizing:"border-box",resize:"vertical",lineHeight:1.6}}/>
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
                    } catch(e) { setNotesErr(e.message||"Failed to save. Please try again."); setNoteSaving(false); }
                  }}>{noteSaving?"Saving…":noteEditId?"Save Changes":"Save Note"}</BtnPrimary>
                  <BtnSecondary onClick={()=>{setNoteAddOpen(false);setNoteEditId(null);setNoteDraft({title:"",content:""});setNotesErr("");}}>Cancel</BtnSecondary>
                </div>
              </div>
            )}

            {notesLoading ? (
              <div style={{textAlign:"center",padding:60,color:T.muted,fontSize:13}}>Loading…</div>
            ) : notes.length===0 ? (
              <div style={{textAlign:"center",padding:60,color:T.muted,fontSize:13}}>No notes yet. Hit + New Note to start.</div>
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
                        <button onClick={async()=>{if(!confirm("Delete this note?"))return;await api.delete(`/api/notes/${n.id}`);setNotes(prev=>prev.filter(x=>x.id!==n.id));}} style={{background:"none",border:"none",fontSize:12,color:T.muted,cursor:"pointer",fontFamily:"inherit",padding:"2px 6px",borderRadius:6}} onMouseOver={ev=>ev.currentTarget.style.color="#c0392b"} onMouseOut={ev=>ev.currentTarget.style.color=T.muted}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      {isMobile&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(255,255,255,0.95)",borderTop:`1px solid ${T.border}`,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>changeTab(t.id)} className="bottom-nav-btn" style={{color:activeTab===t.id?"#1d1d1f":"#aeaeb2"}}>
              <StarIcon size={activeTab===t.id?13:11} color="currentColor"/>
              <span style={{fontSize:9,fontWeight:activeTab===t.id?700:500,letterSpacing:"0.04em"}}>{t.label}</span>
            </button>
          ))}
          <button onClick={()=>setShowArchive(true)} className="bottom-nav-btn" style={{color:"#aeaeb2"}}>
            <svg width={11} height={11} viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="3" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 4v5.5a1 1 0 001 1h7a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 7h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <span style={{fontSize:9,fontWeight:500,letterSpacing:"0.04em"}}>ARCHIVE</span>
          </button>
          <button onClick={()=>{localStorage.removeItem("onna_token");setAuthed(false);}} className="bottom-nav-btn" style={{color:"#aeaeb2"}}>
            <svg width={11} height={11} viewBox="0 0 12 12" fill="none"><path d="M4.5 2H2a1 1 0 00-1 1v6a1 1 0 001 1h2.5M8 9l3-3-3-3M11 6H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{fontSize:9,fontWeight:500,letterSpacing:"0.04em"}}>SIGN OUT</span>
          </button>
        </div>
      )}

      {/* ── LEAD MODAL ── */}
      {selectedLead&&(
        <div className="modal-bg" onClick={()=>setSelectedLead(null)}>
          <div style={{borderRadius:isMobile?"20px 20px 0 0":20,padding:isMobile?"24px 20px":28,width:isMobile?"100%":520,maxWidth:isMobile?"100%":"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <div style={{fontSize:20,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>{selectedLead.company}</div>
                <div style={{fontSize:12,color:T.muted,marginTop:3}}>{selectedLead.category} · {selectedLead.location}</div>
              </div>
              <button onClick={()=>setSelectedLead(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:16}}>
              {[["company","Company"],["contact","Contact"],["role","Role"],["email","Email"],["phone","Phone"],["date","Date Contacted"],["value","Deal Value"]].map(([field,label])=>(
                <div key={field}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}</div>
                  <input value={selectedLead[field]||""} onChange={e=>setSelectedLead(p=>({...p,[field]:e.target.value}))}
                    style={{width:"100%",padding:"8px 11px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:16}}>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Category</div>
                <Sel value={selectedLead.category||""} onChange={v=>{if(v==="＋ Add category"){const n=addNewOption(customLeadCats,setCustomLeadCats,'onna_lead_cats',"New category name:");if(n)setSelectedLead(p=>({...p,category:n}));}else setSelectedLead(p=>({...p,category:v}));}} options={allLeadCats.filter(c=>c!=="All")} minWidth="100%"/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Source</div>
                <Sel value={selectedLead.source||""} onChange={v=>setSelectedLead(p=>({...p,source:v}))} options={["Referral","LinkedIn","Website","Cold Outreach","Event","Other"]} minWidth="100%"/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Status</div>
                <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:4}}>
                  <OutreachBadge status={selectedLead.status} onClick={()=>{const next=OUTREACH_STATUSES[(OUTREACH_STATUSES.indexOf(selectedLead.status)+1)%OUTREACH_STATUSES.length];setSelectedLead(p=>({...p,status:next}));if(next==="client")promoteToClient(selectedLead);}}/>
                  <span style={{fontSize:11,color:T.muted}}>click to cycle</span>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Location</div>
                <Sel value={selectedLead.location||""} onChange={v=>{if(v==="＋ Add location"){const n=addNewOption(customLeadLocs,setCustomLeadLocs,'onna_lead_locs',"New location name:");if(n)setSelectedLead(p=>({...p,location:n}));}else setSelectedLead(p=>({...p,location:v}));}} options={allLeadLocs.filter(l=>l!=="All")} minWidth="100%"/>
              </div>
            </div>
            {/* Additional Contacts */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:10,color:T.muted,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Additional Contacts</div>
                <button onClick={()=>setAddContactForm({type:"lead",name:"",email:"",phone:"",role:""})} style={{fontSize:11,color:"#d4aa20",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,padding:0}}>＋ Add Contact</button>
              </div>
              {(selectedLead._xContacts||[]).map((c,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8,padding:"8px 10px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,position:"relative"}}>
                  <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Name</div><div style={{fontSize:12,color:T.text}}>{c.name||"—"}</div></div>
                  <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Role</div><div style={{fontSize:12,color:T.text}}>{c.role||"—"}</div></div>
                  <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Email</div><div style={{fontSize:12,color:T.text}}>{c.email||"—"}</div></div>
                  <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Phone</div><div style={{fontSize:12,color:T.text}}>{c.phone||"—"}</div></div>
                  <button onClick={()=>setSelectedLead(p=>({...p,_xContacts:(p._xContacts||[]).filter((_,j)=>j!==i)}))} style={{position:"absolute",top:4,right:8,background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:0,lineHeight:1}}>×</button>
                </div>
              ))}
              {addContactForm?.type==="lead"&&(
                <div style={{padding:"10px 12px",borderRadius:9,background:"white",border:"1.5px solid #F5D13A",marginTop:4}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                    {[["Name","name"],["Role","role"],["Email","email"],["Phone","phone"]].map(([lbl,k])=>(
                      <div key={k}><div style={{fontSize:9,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>{lbl}</div>
                        <input value={addContactForm[k]||""} onChange={e=>setAddContactForm(p=>({...p,[k]:e.target.value}))} style={{width:"100%",padding:"6px 9px",borderRadius:7,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:12,fontFamily:"inherit"}}/></div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button onClick={()=>setAddContactForm(null)} style={{padding:"5px 14px",borderRadius:8,background:"none",border:`1px solid ${T.border}`,color:T.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                    <button onClick={()=>{setSelectedLead(p=>({...p,_xContacts:[...(p._xContacts||[]),{name:addContactForm.name,email:addContactForm.email,phone:addContactForm.phone,role:addContactForm.role}]}));setAddContactForm(null);}} style={{padding:"5px 14px",borderRadius:8,background:"#F5D13A",border:"none",color:"#3d2800",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Add</button>
                  </div>
                </div>
              )}
            </div>
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Notes</div>
              <textarea value={selectedLead.notes||""} onChange={e=>setSelectedLead(p=>({...p,notes:e.target.value}))} rows={3}
                placeholder="Comments, next steps, context…"
                style={{width:"100%",padding:"10px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",lineHeight:"1.6"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={async()=>{
                if(!window.confirm(`Delete ${selectedLead.company}?`)) return;
                const snap = {...selectedLead};
                // Archive, close modal, and update list immediately — don't wait for API
                archiveItem('leads', snap);
                setSelectedLead(null);
                setLocalLeads(prev=>prev.filter(l=>l.id!==snap.id));
                // Prune and API call are non-blocking cleanup
                setTimeout(()=>{
                  setLocalLeads(prev=>{
                    pruneCustom(prev,'category',customLeadCats,setCustomLeadCats,'onna_lead_cats');
                    pruneCustom(prev,'location',customLeadLocs,setCustomLeadLocs,'onna_lead_locs');
                    return prev;
                  });
                },50);
                try{await api.delete(`/api/leads/${snap.id}`);}catch{}
              }} style={{background:"none",border:"none",color:"#c0392b",fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",padding:0}}>Delete lead</button>
              <div style={{display:"flex",gap:8}}>
                <BtnSecondary onClick={()=>setSelectedLead(null)}>Cancel</BtnSecondary>
                <BtnPrimary onClick={async()=>{
                  const {id,_xContacts,...fields} = selectedLead;
                  setXContacts('lead', id, _xContacts||[]);
                  await api.put(`/api/leads/${id}`,{...fields,value:Number(fields.value)||0});
                  setLocalLeads(prev=>prev.map(l=>l.id===id?selectedLead:l));
                  setLeadStatusOverrides(prev=>{const n={...prev};delete n[id];return n;});
                  if(selectedLead.status==="client") promoteToClient(selectedLead);
                  setSelectedLead(null);
                }}>Save Changes</BtnPrimary>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── OUTREACH MODAL ── */}
      {selectedOutreach&&(
        <div className="modal-bg" onClick={()=>setSelectedOutreach(null)}>
          <div style={{borderRadius:isMobile?"20px 20px 0 0":20,padding:isMobile?"24px 20px":28,width:isMobile?"100%":520,maxWidth:isMobile?"100%":"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <div style={{fontSize:20,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>{selectedOutreach.company}</div>
                <div style={{fontSize:12,color:T.muted,marginTop:3}}>{selectedOutreach.category} · {selectedOutreach.location}</div>
              </div>
              <button onClick={()=>setSelectedOutreach(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:16}}>
              {[["company","Company"],["clientName","Contact"],["role","Role"],["email","Email"],["phone","Phone"],["date","Date Contacted"],["value","Deal Value (AED)"]].map(([field,label])=>(
                <div key={field}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}</div>
                  <input value={selectedOutreach[field]||""} onChange={e=>setSelectedOutreach(p=>({...p,[field]:e.target.value}))}
                    style={{width:"100%",padding:"8px 11px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:16}}>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Category</div>
                <Sel value={selectedOutreach.category||""} onChange={v=>{if(v==="＋ Add category"){const n=addNewOption(customLeadCats,setCustomLeadCats,'onna_lead_cats',"New category name:");if(n)setSelectedOutreach(p=>({...p,category:n}));}else setSelectedOutreach(p=>({...p,category:v}));}} options={allLeadCats.filter(c=>c!=="All")} minWidth="100%"/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Source</div>
                <Sel value={selectedOutreach.source||"Cold Outreach"} onChange={v=>setSelectedOutreach(p=>({...p,source:v}))} options={["Referral","LinkedIn","Website","Cold Outreach","Event","Other"]} minWidth="100%"/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Status</div>
                <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:4}}>
                  <OutreachBadge status={selectedOutreach.status} onClick={()=>{const next=OUTREACH_STATUSES[(OUTREACH_STATUSES.indexOf(selectedOutreach.status)+1)%OUTREACH_STATUSES.length];setSelectedOutreach(p=>({...p,status:next}));if(next==="client")promoteToClient({...selectedOutreach,contact:selectedOutreach.clientName});}}/>
                  <span style={{fontSize:11,color:T.muted}}>click to cycle</span>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Location</div>
                <Sel value={selectedOutreach.location||""} onChange={v=>{if(v==="＋ Add location"){const n=addNewOption(customLeadLocs,setCustomLeadLocs,'onna_lead_locs',"New location name:");if(n)setSelectedOutreach(p=>({...p,location:n}));}else setSelectedOutreach(p=>({...p,location:v}));}} options={allLeadLocs.filter(l=>l!=="All")} minWidth="100%"/>
              </div>
            </div>
            {/* Additional Contacts */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:10,color:T.muted,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Additional Contacts</div>
                <button onClick={()=>setAddContactForm({type:"outreach",name:"",email:"",phone:"",role:""})} style={{fontSize:11,color:"#d4aa20",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,padding:0}}>＋ Add Contact</button>
              </div>
              {(selectedOutreach._xContacts||[]).map((c,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8,padding:"8px 10px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,position:"relative"}}>
                  <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Name</div><div style={{fontSize:12,color:T.text}}>{c.name||"—"}</div></div>
                  <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Role</div><div style={{fontSize:12,color:T.text}}>{c.role||"—"}</div></div>
                  <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Email</div><div style={{fontSize:12,color:T.text}}>{c.email||"—"}</div></div>
                  <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Phone</div><div style={{fontSize:12,color:T.text}}>{c.phone||"—"}</div></div>
                  <button onClick={()=>setSelectedOutreach(p=>({...p,_xContacts:(p._xContacts||[]).filter((_,j)=>j!==i)}))} style={{position:"absolute",top:4,right:8,background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:0,lineHeight:1}}>×</button>
                </div>
              ))}
              {addContactForm?.type==="outreach"&&(
                <div style={{padding:"10px 12px",borderRadius:9,background:"white",border:"1.5px solid #F5D13A",marginTop:4}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                    {[["Name","name"],["Role","role"],["Email","email"],["Phone","phone"]].map(([lbl,k])=>(
                      <div key={k}><div style={{fontSize:9,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>{lbl}</div>
                        <input value={addContactForm[k]||""} onChange={e=>setAddContactForm(p=>({...p,[k]:e.target.value}))} style={{width:"100%",padding:"6px 9px",borderRadius:7,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:12,fontFamily:"inherit"}}/></div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button onClick={()=>setAddContactForm(null)} style={{padding:"5px 14px",borderRadius:8,background:"none",border:`1px solid ${T.border}`,color:T.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                    <button onClick={()=>{setSelectedOutreach(p=>({...p,_xContacts:[...(p._xContacts||[]),{name:addContactForm.name,email:addContactForm.email,phone:addContactForm.phone,role:addContactForm.role}]}));setAddContactForm(null);}} style={{padding:"5px 14px",borderRadius:8,background:"#F5D13A",border:"none",color:"#3d2800",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Add</button>
                  </div>
                </div>
              )}
            </div>
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Notes</div>
              <textarea value={selectedOutreach.notes||""} onChange={e=>setSelectedOutreach(p=>({...p,notes:e.target.value}))} rows={3}
                placeholder="Context, next steps, meeting notes…"
                style={{width:"100%",padding:"10px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",lineHeight:"1.6"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={async()=>{
                if(!window.confirm(`Delete ${selectedOutreach.company}?`)) return;
                archiveItem('outreach', selectedOutreach);
                await api.delete(`/api/outreach/${selectedOutreach.id}`);
                setOutreach(prev=>prev.filter(x=>x.id!==selectedOutreach.id));
                setSelectedOutreach(null);
              }} style={{background:"none",border:"none",color:"#c0392b",fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",padding:0}}>Delete</button>
              <div style={{display:"flex",gap:8}}>
                <BtnSecondary onClick={()=>setSelectedOutreach(null)}>Cancel</BtnSecondary>
                <BtnPrimary onClick={async()=>{
                  const {id,_xContacts,...fields}=selectedOutreach;
                  setXContacts('outreach', id, _xContacts||[]);
                  await api.put(`/api/outreach/${id}`,{...fields,value:Number(fields.value)||0});
                  setOutreach(prev=>prev.map(x=>x.id===id?{...selectedOutreach,value:Number(fields.value)||0}:x));
                  if(selectedOutreach.status==="client") promoteToClient({...selectedOutreach,contact:selectedOutreach.clientName});
                  setSelectedOutreach(null);
                }}>Save Changes</BtnPrimary>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TODO MODAL ── */}
      {selectedTodo&&(
        <div className="modal-bg" onClick={()=>setSelectedTodo(null)}>
          <div style={{borderRadius:20,padding:28,width:500,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Task Details</div>
              <button onClick={()=>setSelectedTodo(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Task</div>
              <input value={selectedTodo.text} onChange={e=>{const u={...selectedTodo,text:e.target.value};setSelectedTodo(u);setTodos(prev=>prev.map(t=>t.id===u.id?u:t));}} style={{width:"100%",padding:"10px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:14,fontFamily:"inherit"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:14}}>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Type</div>
                <Sel value={selectedTodo.type||"general"} onChange={v=>{const u={...selectedTodo,type:v};setSelectedTodo(u);setTodos(prev=>prev.map(t=>t.id===u.id?u:t));}} options={["general","project"]}/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Linked Project</div>
                <Sel value={selectedTodo.project||""} onChange={v=>{const u={...selectedTodo,project:v};setSelectedTodo(u);setTodos(prev=>prev.map(t=>t.id===u.id?u:t));}} options={[{value:"",label:"None"},...allProjectsMerged.map(p=>({value:`${p.client} — ${p.name}`,label:`${p.client} — ${p.name}`}))]} minWidth={200}/>
              </div>
            </div>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Additional Notes</div>
              <textarea value={selectedTodo.details||""} onChange={e=>{const u={...selectedTodo,details:e.target.value};setSelectedTodo(u);setTodos(prev=>prev.map(t=>t.id===u.id?u:t));}} rows={4} placeholder="Add notes, links, context…" style={{width:"100%",padding:"10px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <button onClick={()=>{setTodos(prev=>prev.filter(t=>t.id!==selectedTodo.id));setSelectedTodo(null);}} style={{padding:"8px 16px",borderRadius:10,background:"#fff0f0",border:"1px solid #ffd0d0",color:"#c0392b",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>Delete task</button>
              <BtnPrimary onClick={()=>setSelectedTodo(null)}>Done</BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD PROJECT MODAL ── */}
      {showAddProject&&(
        <div className="modal-bg" onClick={()=>setShowAddProject(false)}>
          <div style={{borderRadius:20,padding:28,width:480,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>New Project</div>
              <button onClick={()=>setShowAddProject(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:18}}>
              {[["Client","client"],["Project Name","name"],["Revenue (AED)","revenue"],["Cost (AED)","cost"]].map(([label,key])=>(
                <div key={key}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>{label}</div>
                  <input value={newProject[key]} onChange={e=>setNewProject(p=>({...p,[key]:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Status</div>
                <Sel value={newProject.status} onChange={v=>setNewProject(p=>({...p,status:v}))} options={["Active","In Review","Completed"]}/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Year</div>
                <Sel value={String(newProject.year)} onChange={v=>setNewProject(p=>({...p,year:Number(v)}))} options={["2024","2025","2026"]}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
              <BtnSecondary onClick={()=>setShowAddProject(false)}>Cancel</BtnSecondary>
              <BtnPrimary onClick={async()=>{if(!newProject.client||!newProject.name)return;const saved=await api.post("/api/projects",{...newProject,revenue:Number(newProject.revenue)||0,cost:Number(newProject.cost)||0});if(saved.id)setLocalProjects(prev=>[...prev,saved]);setNewProject({client:"",name:"",revenue:"",cost:"",status:"Active",year:2026});setShowAddProject(false);}}>Save Project</BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD LEAD MODAL ── */}
      {showAddLead&&(
        <div className="modal-bg" onClick={()=>setShowAddLead(false)}>
          <div style={{borderRadius:isMobile?"20px 20px 0 0":20,padding:isMobile?"24px 20px":28,width:isMobile?"100%":520,maxWidth:isMobile?"100%":"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>New Lead</div>
              <button onClick={()=>setShowAddLead(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:18}}>
              {[["Company","company"],["Contact Name","contact"],["Role","role"],["Email","email"],["Phone","phone"],["Date Contacted","date"],["Value (AED)","value"]].map(([label,key])=>(
                <div key={key}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>{label}</div>
                  <input value={newLead[key]} onChange={e=>setNewLead(p=>({...p,[key]:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Category</div>
                <Sel value={newLead.category} onChange={v=>{if(v==="＋ Add category"){const n=addNewOption(customLeadCats,setCustomLeadCats,'onna_lead_cats',"New category name:");if(n)setNewLead(p=>({...p,category:n}));}else setNewLead(p=>({...p,category:v}));}} options={allLeadCats.filter(c=>c!=="All")} minWidth={200}/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Location</div>
                <Sel value={newLead.location} onChange={v=>{if(v==="＋ Add location"){const n=addNewOption(customLeadLocs,setCustomLeadLocs,'onna_lead_locs',"New location name:");if(n)setNewLead(p=>({...p,location:n}));}else setNewLead(p=>({...p,location:v}));}} options={allLeadLocs.filter(l=>l!=="All")} minWidth={200}/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Source</div>
                <Sel value={newLead.source} onChange={v=>setNewLead(p=>({...p,source:v}))} options={["Referral","LinkedIn","Website","Cold Outreach","Event","Other"]} minWidth={200}/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Status</div>
                <Sel value={newLead.status} onChange={v=>setNewLead(p=>({...p,status:v}))} options={OUTREACH_STATUSES.map(s=>({value:s,label:OUTREACH_STATUS_LABELS[s]}))} minWidth={200}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
              <BtnSecondary onClick={()=>setShowAddLead(false)}>Cancel</BtnSecondary>
              <BtnPrimary onClick={async()=>{if(!newLead.company)return;const saved=await api.post("/api/leads",{...newLead,value:Number(newLead.value)||0});if(saved.id)setLocalLeads(prev=>[...prev,saved]);setNewLead({company:"",contact:"",email:"",phone:"",role:"",date:"",source:"Referral",status:"not_contacted",value:"",category:"Production Companies",location:"Dubai, UAE"});setShowAddLead(false);}}>Save Lead</BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD VENDOR MODAL ── */}
      {showAddVendor&&(
        <div className="modal-bg" onClick={()=>setShowAddVendor(false)}>
          <div style={{borderRadius:isMobile?"20px 20px 0 0":20,padding:isMobile?"24px 20px":28,width:isMobile?"100%":520,maxWidth:isMobile?"100%":"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>New Vendor</div>
              <button onClick={()=>setShowAddVendor(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:18}}>
              {[["Name","name"],["Email","email"],["Phone","phone"],["Website","website"],["Rate Card","rateCard"],["Notes","notes"]].map(([label,key])=>(
                <div key={key} style={{gridColumn:key==="notes"?"span 2":"auto"}}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>{label}</div>
                  <input value={newVendor[key]} onChange={e=>setNewVendor(p=>({...p,[key]:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Category</div>
                <Sel value={newVendor.category} onChange={v=>{if(v==="＋ Add category"){const n=addNewOption(customVendorCats,setCustomVendorCats,'onna_vendor_cats',"New category name:");if(n)setNewVendor(p=>({...p,category:n}));}else setNewVendor(p=>({...p,category:v}));}} options={allVendorCats.filter(c=>c!=="All")} minWidth={200}/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Location</div>
                <Sel value={newVendor.location} onChange={v=>{if(v==="＋ Add location"){const n=addNewOption(customVendorLocs,setCustomVendorLocs,'onna_vendor_locs',"New location name:");if(n)setNewVendor(p=>({...p,location:n}));}else setNewVendor(p=>({...p,location:v}));}} options={allVendorLocs} minWidth={200}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
              <BtnSecondary onClick={()=>setShowAddVendor(false)}>Cancel</BtnSecondary>
              <BtnPrimary onClick={async()=>{if(!newVendor.name)return;const saved=await api.post("/api/vendors",newVendor);if(saved.id)setVendors(prev=>[...prev,saved]);setNewVendor({name:"",category:"Locations",email:"",phone:"",website:"",location:"Dubai, UAE",notes:"",rateCard:""});setShowAddVendor(false);}}>Save Vendor</BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {/* ── RATE CARD MODAL ── */}
      {showRateModal&&(
        <div className="modal-bg" onClick={()=>setShowRateModal(null)}>
          <div style={{borderRadius:20,padding:26,width:380,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:16,fontWeight:700,color:T.text}}>Add Rate Card</div>
              <button onClick={()=>setShowRateModal(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{fontSize:12.5,color:T.muted,marginBottom:14}}>{showRateModal.name}</div>
            <input type="text" placeholder="e.g. AED 1,500/day" value={rateInput} onChange={e=>setRateInput(e.target.value)} style={{width:"100%",padding:"10px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13.5,fontFamily:"inherit",marginBottom:16}}/>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <BtnSecondary onClick={()=>setShowRateModal(null)}>Cancel</BtnSecondary>
              <BtnPrimary onClick={async()=>{await api.put(`/api/vendors/${showRateModal.id}`,{rateCard:rateInput});setVendors(prev=>prev.map(b=>b.id===showRateModal.id?{...b,rateCard:rateInput}:b));setShowRateModal(null);}}>Save</BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT VENDOR MODAL ── */}
      {editVendor&&(
        <div className="modal-bg" onClick={()=>setEditVendor(null)}>
          <div style={{borderRadius:20,padding:28,width:580,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
              <div>
                <div style={{fontSize:20,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>{editVendor.name||"Vendor"}</div>
                <div style={{fontSize:12,color:T.muted,marginTop:3}}>{editVendor.category} · {editVendor.location}</div>
              </div>
              <button onClick={()=>setEditVendor(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
            </div>

            {/* Contact details */}
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:14}}>
              {[["Name","name"],["Email","email"],["Phone","phone"],["Website","website"]].map(([label,key])=>(
                <div key={key}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>{label}</div>
                  <input value={editVendor[key]||""} onChange={e=>setEditVendor(p=>({...p,[key]:e.target.value}))}
                    style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Category</div>
                <Sel value={editVendor.category||""} onChange={v=>{if(v==="＋ Add category"){const n=addNewOption(customVendorCats,setCustomVendorCats,'onna_vendor_cats',"New category name:");if(n)setEditVendor(p=>({...p,category:n}));}else setEditVendor(p=>({...p,category:v}));}} options={allVendorCats.filter(c=>c!=="All")} minWidth="100%"/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Location</div>
                <Sel value={editVendor.location||""} onChange={v=>{if(v==="＋ Add location"){const n=addNewOption(customVendorLocs,setCustomVendorLocs,'onna_vendor_locs',"New location name:");if(n)setEditVendor(p=>({...p,location:n}));}else setEditVendor(p=>({...p,location:v}));}} options={allVendorLocs} minWidth="100%"/>
              </div>
            </div>

            {/* Rate card */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Rate Card</div>
              <textarea value={editVendor.rateCard||""} onChange={e=>setEditVendor(p=>({...p,rateCard:e.target.value}))} rows={3}
                placeholder="e.g. AED 1,500/half day · AED 2,800/full day · overtime at AED 300/hr"
                style={{width:"100%",padding:"10px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",lineHeight:"1.6"}}/>
            </div>

            {/* Additional Contacts */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:10,color:T.muted,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Additional Contacts</div>
                <button onClick={()=>setAddContactForm({type:"vendor",name:"",email:"",phone:"",role:""})} style={{fontSize:11,color:"#d4aa20",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,padding:0}}>＋ Add Contact</button>
              </div>
              {(editVendor._xContacts||[]).map((c,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8,padding:"8px 10px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,position:"relative"}}>
                  <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Name</div><div style={{fontSize:12,color:T.text}}>{c.name||"—"}</div></div>
                  <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Role</div><div style={{fontSize:12,color:T.text}}>{c.role||"—"}</div></div>
                  <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Email</div><div style={{fontSize:12,color:T.text}}>{c.email||"—"}</div></div>
                  <div><div style={{fontSize:9,color:T.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>Phone</div><div style={{fontSize:12,color:T.text}}>{c.phone||"—"}</div></div>
                  <button onClick={()=>setEditVendor(p=>({...p,_xContacts:(p._xContacts||[]).filter((_,j)=>j!==i)}))} style={{position:"absolute",top:4,right:8,background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:0,lineHeight:1}}>×</button>
                </div>
              ))}
              {addContactForm?.type==="vendor"&&(
                <div style={{padding:"10px 12px",borderRadius:9,background:"white",border:"1.5px solid #F5D13A",marginTop:4}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                    {[["Name","name"],["Role","role"],["Email","email"],["Phone","phone"]].map(([lbl,k])=>(
                      <div key={k}><div style={{fontSize:9,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:500}}>{lbl}</div>
                        <input value={addContactForm[k]||""} onChange={e=>setAddContactForm(p=>({...p,[k]:e.target.value}))} style={{width:"100%",padding:"6px 9px",borderRadius:7,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:12,fontFamily:"inherit"}}/></div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button onClick={()=>setAddContactForm(null)} style={{padding:"5px 14px",borderRadius:8,background:"none",border:`1px solid ${T.border}`,color:T.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                    <button onClick={()=>{setEditVendor(p=>({...p,_xContacts:[...(p._xContacts||[]),{name:addContactForm.name,email:addContactForm.email,phone:addContactForm.phone,role:addContactForm.role}]}));setAddContactForm(null);}} style={{padding:"5px 14px",borderRadius:8,background:"#F5D13A",border:"none",color:"#3d2800",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Add</button>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{marginBottom:22}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Notes</div>
              <textarea value={editVendor.notes||""} onChange={e=>setEditVendor(p=>({...p,notes:e.target.value}))} rows={4}
                placeholder="Parking, access, contacts on set, booking lead time…"
                style={{width:"100%",padding:"10px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",lineHeight:"1.6"}}/>
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={async()=>{
                if(!window.confirm(`Delete ${editVendor.name}?`)) return;
                archiveItem('vendors', editVendor);
                await api.delete(`/api/vendors/${editVendor.id}`);
                const updatedVendors = vendors.filter(v=>v.id!==editVendor.id);
                setVendors(updatedVendors);
                pruneCustom(updatedVendors,'category',customVendorCats,setCustomVendorCats,'onna_vendor_cats');
                pruneCustom(updatedVendors,'location',customVendorLocs,setCustomVendorLocs,'onna_vendor_locs');
                setEditVendor(null);
              }} style={{background:"none",border:"none",color:"#c0392b",fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",padding:0}}>Delete vendor</button>
              <div style={{display:"flex",gap:8}}>
                <BtnSecondary onClick={()=>setEditVendor(null)}>Cancel</BtnSecondary>
                <BtnPrimary onClick={async()=>{
                  const {id,_xContacts,...fields}=editVendor;
                  setXContacts('vendor', id, _xContacts||[]);
                  await api.put(`/api/vendors/${id}`,fields);
                  setVendors(prev=>prev.map(v=>v.id===id?editVendor:v));
                  setEditVendor(null);
                }}>Save Changes</BtnPrimary>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VAULT VIEW PASSWORD MODAL ── */}
      {vaultViewEntry&&(
        <div className="modal-bg" onClick={()=>setVaultViewEntry(null)}>
          <div style={{borderRadius:isMobile?"20px 20px 0 0":20,padding:isMobile?"24px 20px":28,width:isMobile?"100%":480,maxWidth:isMobile?"100%":"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>{vaultViewEntry.name}</div>
              <button onClick={()=>setVaultViewEntry(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {vaultViewEntry.url&&<div><div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:4}}>URL</div><a href={vaultViewEntry.url.startsWith("http")?vaultViewEntry.url:`https://${vaultViewEntry.url}`} target="_blank" rel="noreferrer" style={{fontSize:13,color:T.link,textDecoration:"none"}}>{vaultViewEntry.url}</a></div>}
              {vaultViewEntry.username&&<div><div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:4}}>Username / Email</div><span style={{fontSize:13,color:T.text}}>{vaultViewEntry.username}</span></div>}
              <div>
                <div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:4}}>Password</div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:13,color:T.sub,fontFamily:"monospace",letterSpacing:"0.04em"}}>{vaultShowPw[vaultViewEntry.id]?vaultViewEntry.password:"••••••••••••"}</span>
                  <button onClick={()=>setVaultShowPw(p=>({...p,[vaultViewEntry.id]:!p[vaultViewEntry.id]}))} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,padding:"2px 4px",color:T.muted,borderRadius:4}}>{vaultShowPw[vaultViewEntry.id]?"🙈":"👁"}</button>
                  <button onClick={()=>vaultCopyPw(vaultViewEntry.id,vaultViewEntry.password)} style={{background:vaultCopied===vaultViewEntry.id?"#edfaf3":"#f5f5f7",border:"none",cursor:"pointer",fontSize:11,padding:"4px 10px",color:vaultCopied===vaultViewEntry.id?"#147d50":T.sub,borderRadius:6,fontFamily:"inherit",fontWeight:500,transition:"all 0.15s"}}>{vaultCopied===vaultViewEntry.id?"Copied!":"Copy"}</button>
                </div>
              </div>
              {vaultViewEntry.notes&&<div><div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:4}}>Notes</div><div style={{fontSize:13,color:T.text,whiteSpace:"pre-wrap",lineHeight:1.6,background:"#fafafa",borderRadius:9,padding:"10px 12px",border:`1px solid ${T.border}`}}>{vaultViewEntry.notes}</div></div>}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:24}}>
              <button onClick={async()=>{if(!window.confirm(`Delete ${vaultViewEntry.name}?`))return;await deleteVaultEntry(vaultViewEntry.id);setVaultViewEntry(null);}} style={{background:"none",border:"none",color:"#c0392b",fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",padding:0}}>Delete</button>
              <div style={{display:"flex",gap:8}}>
                <BtnSecondary onClick={()=>setVaultViewEntry(null)}>Close</BtnSecondary>
                <BtnPrimary onClick={()=>{setVaultEditId(vaultViewEntry.id);setVaultNewPw({name:vaultViewEntry.name||"",url:vaultViewEntry.url||"",username:vaultViewEntry.username||"",password:vaultViewEntry.password||"",notes:vaultViewEntry.notes||""});setVaultAddPwOpen(true);setVaultViewEntry(null);}}>Edit</BtnPrimary>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VAULT ADD / EDIT PASSWORD MODAL ── */}
      {vaultAddPwOpen&&(
        <div className="modal-bg" onClick={()=>{setVaultAddPwOpen(false);setVaultEditId(null);setVaultNewPw({name:"",url:"",username:"",password:"",notes:""});}}>
          <div style={{borderRadius:isMobile?"20px 20px 0 0":20,padding:isMobile?"24px 20px":28,width:isMobile?"100%":520,maxWidth:isMobile?"100%":"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>{vaultEditId?"Edit Password":"New Password"}</div>
              <button onClick={()=>{setVaultAddPwOpen(false);setVaultEditId(null);setVaultNewPw({name:"",url:"",username:"",password:"",notes:""}); }} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:16}}>
              {[["name","Service / Name *"],["url","URL"],["username","Username / Email"],["password","Password *"]].map(([k,lbl])=>(
                <div key={k}>
                  <div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:4}}>{lbl}</div>
                  <input type={k==="password"?"password":"text"} value={vaultNewPw[k]} onChange={e=>setVaultNewPw(p=>({...p,[k]:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,border:`1px solid ${T.border}`,fontSize:13,fontFamily:"inherit",color:T.text,background:"#fafafa",boxSizing:"border-box"}}/>
                </div>
              ))}
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:4}}>Notes</div>
              <textarea value={vaultNewPw.notes} onChange={e=>setVaultNewPw(p=>({...p,notes:e.target.value}))} rows={4} placeholder="Add any notes here…" style={{width:"100%",padding:"9px 12px",borderRadius:9,border:`1px solid ${T.border}`,fontSize:13,fontFamily:"inherit",color:T.text,background:"#fafafa",boxSizing:"border-box",resize:"vertical",lineHeight:1.5}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <BtnPrimary onClick={vaultEditId?updateVaultPassword:addVaultPassword} disabled={vaultSaving||!vaultNewPw.name.trim()||!vaultNewPw.password.trim()}>{vaultSaving?"Saving…":vaultEditId?"Save Changes":"Save"}</BtnPrimary>
              <BtnSecondary onClick={()=>{setVaultAddPwOpen(false);setVaultEditId(null);setVaultNewPw({name:"",url:"",username:"",password:"",notes:""});}}>Cancel</BtnSecondary>
            </div>
          </div>
        </div>
      )}

      {/* ── CATEGORY MANAGER MODAL ── */}
      {showCatManager&&(
        <div className="modal-bg" onClick={()=>setShowCatManager(false)}>
          <div style={{borderRadius:20,padding:28,width:560,maxWidth:"94vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"85vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22,flexShrink:0}}>
              <div>
                <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Manage Categories</div>
                <div style={{fontSize:12,color:T.muted,marginTop:2}}>Edit or delete client and vendor categories</div>
              </div>
              <button onClick={()=>setShowCatManager(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{overflowY:"auto",flex:1}}>
              {[
                {label:"Client Categories",type:"lead",builtin:LEAD_CATEGORIES.filter(c=>c!=="All"),custom:customLeadCats,hidden:hiddenLeadBuiltins},
                {label:"Vendor Categories",type:"vendor",builtin:VENDORS_CATEGORIES,custom:customVendorCats,hidden:hiddenVendorBuiltins},
              ].map(section=>(
                <div key={section.type} style={{marginBottom:28}}>
                  <div style={{fontSize:10,color:T.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12,paddingBottom:7,borderBottom:`1px solid ${T.border}`}}>{section.label}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {/* Built-in categories */}
                    {section.builtin.filter(c=>!section.hidden.includes(c)).map(cat=>(
                      <div key={cat} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`}}>
                        <span style={{flex:1,fontSize:13,color:T.text}}>{cat}</span>
                        <span style={{fontSize:10,color:T.muted,background:"#f0ede8",borderRadius:999,padding:"2px 8px",fontWeight:500}}>built-in</span>
                        <button disabled={catSaving} onClick={async()=>{if(!window.confirm(`Delete "${cat}"? All ${section.type==='lead'?'clients':'vendors'} in this category will have it cleared.`))return;await deleteCat(section.type,cat);}} style={{background:"none",border:"none",color:"#c0392b",fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,opacity:catSaving?0.4:1,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#fff0f0"} onMouseOut={e=>e.currentTarget.style.background="none"}>Delete</button>
                      </div>
                    ))}
                    {/* Custom categories */}
                    {section.custom.map(cat=>(
                      <div key={cat} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`}}>
                        {catEdit&&catEdit.type===section.type&&catEdit.cat===cat?(
                          <>
                            <input autoFocus value={catEditVal} onChange={e=>setCatEditVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")renameCat(section.type,cat,catEditVal);if(e.key==="Escape")setCatEdit(null);}} style={{flex:1,border:`1.5px solid ${T.accent}`,borderRadius:7,padding:"5px 8px",fontSize:13,fontFamily:"inherit",outline:"none",background:"white"}}/>
                            <button disabled={catSaving} onClick={()=>renameCat(section.type,cat,catEditVal)} style={{background:T.accent,border:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",padding:"4px 10px",borderRadius:6,fontFamily:"inherit",opacity:catSaving?0.5:1}}>Save</button>
                            <button onClick={()=>setCatEdit(null)} style={{background:"none",border:"none",color:T.muted,fontSize:11,cursor:"pointer",padding:"4px 6px",fontFamily:"inherit"}}>Cancel</button>
                          </>
                        ):(
                          <>
                            <span style={{flex:1,fontSize:13,color:T.text}}>{cat}</span>
                            <button disabled={catSaving} onClick={()=>{setCatEdit({type:section.type,cat});setCatEditVal(cat);}} style={{background:"none",border:"none",color:T.sub,fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#f0f0f5"} onMouseOut={e=>e.currentTarget.style.background="none"}>Rename</button>
                            <button disabled={catSaving} onClick={async()=>{if(!window.confirm(`Delete "${cat}"? All ${section.type==='lead'?'clients':'vendors'} in this category will have it cleared.`))return;await deleteCat(section.type,cat);}} style={{background:"none",border:"none",color:"#c0392b",fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,opacity:catSaving?0.4:1,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#fff0f0"} onMouseOut={e=>e.currentTarget.style.background="none"}>Delete</button>
                          </>
                        )}
                      </div>
                    ))}
                    {section.builtin.filter(c=>!section.hidden.includes(c)).length===0&&section.custom.length===0&&(
                      <div style={{fontSize:13,color:T.muted,padding:"12px 0",textAlign:"center"}}>No categories.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={{borderTop:`1px solid ${T.border}`,paddingTop:16,marginTop:4,flexShrink:0,display:"flex",justifyContent:"flex-end"}}>
              <BtnSecondary onClick={()=>setShowCatManager(false)}>Done</BtnSecondary>
            </div>
          </div>
        </div>
      )}

      {/* ── ARCHIVE MODAL ── */}
      {showArchive&&(
        <div className="modal-bg" onClick={()=>setShowArchive(false)}>
          <div style={{borderRadius:20,padding:28,width:680,maxWidth:"94vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"85vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22,flexShrink:0}}>
              <div>
                <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Archive</div>
                <div style={{fontSize:12,color:T.muted,marginTop:2}}>Deleted items — restore or remove permanently</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {archive.length>0&&<button onClick={()=>{if(window.confirm("Clear entire archive permanently?"))setArchive(()=>{try{localStorage.removeItem('onna_archive');}catch{}return [];});}} style={{background:"none",border:"none",color:T.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:0}}>Clear all</button>}
                <button onClick={()=>setShowArchive(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            </div>
            <div style={{overflowY:"auto",flex:1}}>
              {archive.length===0?(
                <div style={{padding:"48px 0",textAlign:"center",color:T.muted,fontSize:13}}>Archive is empty.</div>
              ):(
                ["leads","vendors","outreach"].map(table=>{
                  const entries = archive.filter(e=>e.table===table);
                  if (!entries.length) return null;
                  const label = table.charAt(0).toUpperCase()+table.slice(1);
                  return (
                    <div key={table} style={{marginBottom:24}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>{label} ({entries.length})</div>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {entries.map(entry=>{
                          const it = entry.item;
                          const name = it.company||it.name||"—";
                          const sub = it.contact||it.clientName||it.category||"";
                          const deleted = new Date(entry.deletedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
                          return (
                            <div key={entry.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.borderSub}`}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                                {sub&&<div style={{fontSize:11.5,color:T.muted,marginTop:1}}>{sub}</div>}
                              </div>
                              <div style={{fontSize:11,color:T.muted,flexShrink:0}}>Deleted {deleted}</div>
                              <button onClick={()=>restoreItem(entry)} style={{background:"#edfaf3",border:"none",color:"#147d50",padding:"5px 12px",borderRadius:7,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Restore</button>
                              <button onClick={()=>{if(window.confirm(`Permanently delete ${name}?`))permanentlyDelete(entry.id);}} style={{background:"none",border:"none",color:T.muted,fontSize:16,cursor:"pointer",padding:0,flexShrink:0}}>×</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
