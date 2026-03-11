import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── IMAGE UPLOAD VALIDATION ────────────────────────────────────────────────
const MAX_IMG_SIZE = 10 * 1024 * 1024; // 10 MB
const validateImg = (f) => {
  if (!f || !f.type.startsWith("image/")) return false;
  if (f.size > MAX_IMG_SIZE) { showAlert(`"${f.name}" is too large (${(f.size/1024/1024).toFixed(1)} MB). Max image size is 10 MB.`); return false; }
  return true;
};
// ─── CALL SHEET TEMPLATE ─────────────────────────────────────────────────────
const CS_FONT = "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
const CS_LS = 1.5;
const CS_YELLOW = "#FFF9C4";
const RA_FONT = "'Avenir','Avenir Next','Nunito Sans',sans-serif";
const RA_LS = 0.5; const RA_LS_HDR = 1.5; const RA_GREY = "#F4F4F4";
const CT_FONT = "'Avenir','Avenir Next','Nunito Sans',sans-serif";
const CT_LS = 0.5; const CT_LS_HDR = 1.5;

const CSEditField = ({ value, onChange, style = {}, placeholder = "", bold = false, isPlaceholder = false, alwaysYellow = false }) => {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);
  const commit = () => { setEditing(false); onChange(temp); };
  const showYellow = alwaysYellow || (isPlaceholder && !value);
  const autoSize = useCallback((el) => { if (el) { el.style.height = "0"; el.style.height = Math.max(el.scrollHeight, 18) + "px"; } }, []);
  if (editing) return <textarea ref={el=>{if(el){requestAnimationFrame(()=>autoSize(el));}}} autoFocus value={temp} onChange={e=>{setTemp(e.target.value);autoSize(e.target);}} onBlur={commit} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();commit();}}} style={{...style,fontFamily:CS_FONT,fontSize:style.fontSize||11,fontWeight:bold?700:style.fontWeight||400,background:"#FFFDE7",border:"1px solid #E0D9A8",borderRadius:2,outline:"none",padding:"2px 5px",width:style.width||"100%",minWidth:style.minWidth||60,maxWidth:"100%",boxSizing:"border-box",color:style.color||"#1a1a1a",resize:"none",overflow:"hidden",lineHeight:1.5,display:"inline-block",verticalAlign:"middle"}} placeholder={placeholder}/>;
  return <span onClick={()=>{setTemp(value);setEditing(true);}} style={{...style,fontFamily:CS_FONT,fontWeight:bold?700:style.fontWeight||400,cursor:"text",display:"inline-block",minWidth:16,minHeight:14,background:showYellow?"#FFFDE7":"transparent",borderRadius:showYellow?2:0,padding:showYellow?"1px 4px":0,borderBottom:"1px dashed transparent",transition:"all 0.15s",whiteSpace:"pre-wrap",wordBreak:"break-word"}} onMouseEnter={e=>(e.target.style.borderBottom="1px dashed #ccc")} onMouseLeave={e=>(e.target.style.borderBottom="1px dashed transparent")}>{value||<span style={{color:"#999",fontSize:style.fontSize||10}}>{placeholder}</span>}</span>;
};

const SignaturePad = ({ value, onChange, height = 60 }) => {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const drawing = useRef(false);
  const clear = () => { const c=canvasRef.current; if(c) c.getContext("2d").clearRect(0,0,c.width,c.height); onChange(""); };
  const getPos = (e) => {
    const c=canvasRef.current; const r=c.getBoundingClientRect();
    const t=e.touches?e.touches[0]:e;
    // Scale mouse coords from CSS size to canvas internal size
    const scaleX=c.width/r.width; const scaleY=c.height/r.height;
    return {x:(t.clientX-r.left)*scaleX, y:(t.clientY-r.top)*scaleY};
  };
  const startDraw = (e) => { e.preventDefault(); drawing.current=true; const ctx=canvasRef.current.getContext("2d"); const p=getPos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); };
  const moveDraw = (e) => { if(!drawing.current)return; e.preventDefault(); const ctx=canvasRef.current.getContext("2d"); const p=getPos(e); ctx.lineWidth=2; ctx.lineCap="round"; ctx.strokeStyle="#1a1a1a"; ctx.lineTo(p.x,p.y); ctx.stroke(); };
  const endDraw = (e) => { if(!drawing.current)return; e&&e.preventDefault(); drawing.current=false; const c=canvasRef.current; if(c) onChange(c.toDataURL("image/png")); };
  // Resize canvas to match container width for crisp rendering
  useEffect(()=>{
    const c=canvasRef.current; const w=wrapRef.current; if(!c||!w)return;
    const resize=()=>{ const rect=w.getBoundingClientRect(); c.width=Math.round(rect.width); c.height=height; if(value){const img=new Image();img.onload=()=>c.getContext("2d").drawImage(img,0,0,c.width,c.height);img.src=value;} };
    resize();
    window.addEventListener("resize",resize);
    return ()=>window.removeEventListener("resize",resize);
  },[]);
  if(value) return <div style={{position:"relative",height,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #ddd",borderRadius:2,background:"#fafafa"}}><img src={value} alt="" style={{maxHeight:height-4,maxWidth:"100%"}}/><button onClick={clear} style={{position:"absolute",top:4,right:4,background:"#d32f2f",color:"#fff",border:"none",borderRadius:4,fontSize:10,padding:"3px 10px",cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>Clear</button></div>;
  return <div ref={wrapRef} style={{position:"relative"}}><canvas ref={canvasRef} width={600} height={height} onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw} onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw} style={{width:"100%",height,border:"1px solid #ddd",borderRadius:2,background:"#fafafa",cursor:"crosshair",display:"block",touchAction:"none"}}/><button onClick={clear} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.5)",color:"#fff",border:"none",borderRadius:4,fontSize:10,padding:"3px 10px",cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>Clear</button></div>;
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
  const readFile = f => { if(!validateImg(f))return; const r=new FileReader(); r.onload=ev=>onUpload(ev.target.result); r.readAsDataURL(f); };
  const handleFile = e => { readFile(e.target.files[0]); };
  const onDrop = e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.borderColor="#ccc"; readFile(e.dataTransfer.files[0]); };
  const onDragOver = e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.borderColor="#666"; };
  const onDragLeave = e => { e.preventDefault(); e.currentTarget.style.borderColor="#ccc"; };
  return <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",minWidth:90}}>{image?<div style={{position:"relative"}} onDragOver={e=>{e.preventDefault();e.stopPropagation();}} onDrop={e=>{e.preventDefault();e.stopPropagation();readFile(e.dataTransfer.files[0]);}}><img src={image} alt={label} style={{maxHeight:30,maxWidth:120,objectFit:"contain",cursor:"pointer"}} onClick={()=>ref.current.click()} title="Click or drag to replace logo"/><button onClick={onRemove} style={{position:"absolute",top:-6,right:-6,background:"#eee",border:"none",borderRadius:"50%",width:16,height:16,fontSize:10,cursor:"pointer",lineHeight:"14px",color:"#666"}}>x</button></div>:<div data-cs-placeholder="1" onClick={()=>ref.current.click()} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} style={{width:120,height:30,border:"1.5px dashed #ccc",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:9,color:"#aaa",letterSpacing:0.5,fontFamily:CS_FONT}}>+ {label}</div>}<input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/></div>;
};

const CSResizableImage = ({ label, image, onUpload, onRemove, defaultHeight = 180 }) => {
  const ref = useRef();
  const [height, setHeight] = useState(defaultHeight);
  const dragRef = useRef({ dragging: false, startY: 0, startH: 0 });
  const handleFile = e => { const f=e.target.files[0]; if(!validateImg(f))return; const r=new FileReader(); r.onload=ev=>onUpload(ev.target.result); r.readAsDataURL(f); };
  const onMouseDown = useCallback(e => {
    e.preventDefault(); dragRef.current = { dragging:true, startY:e.clientY, startH:height };
    const onMove = ev => { if(!dragRef.current.dragging)return; setHeight(Math.max(80,dragRef.current.startH+(ev.clientY-dragRef.current.startY))); };
    const onUp = () => { dragRef.current.dragging=false; window.removeEventListener("mousemove",onMove); window.removeEventListener("mouseup",onUp); };
    window.addEventListener("mousemove",onMove); window.addEventListener("mouseup",onUp);
  }, [height]);
  return <div>{image?<div style={{position:"relative"}}><img src={image} alt={label} style={{width:"100%",height,objectFit:"cover",borderRadius:4,display:"block"}}/><button onClick={onRemove} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.55)",color:"#fff",border:"none",borderRadius:"50%",width:24,height:24,fontSize:14,cursor:"pointer",lineHeight:"22px",textAlign:"center"}}>×</button><div onMouseDown={onMouseDown} style={{position:"absolute",bottom:0,left:0,right:0,height:14,cursor:"ns-resize",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(transparent, rgba(0,0,0,0.15))",borderRadius:"0 0 4px 4px"}}><div style={{width:40,height:3,background:"rgba(255,255,255,0.7)",borderRadius:2}}/></div></div>:<div data-cs-placeholder="1" onClick={()=>ref.current.click()} onDrop={e=>{e.preventDefault();e.stopPropagation();e.currentTarget.style.borderColor="#ddd";const f=e.dataTransfer.files[0];if(f&&f.type.startsWith("image/")){const r=new FileReader();r.onload=ev=>onUpload(ev.target.result);r.readAsDataURL(f);}}} onDragOver={e=>{e.preventDefault();e.stopPropagation();e.currentTarget.style.borderColor="#666";}} onDragLeave={e=>{e.preventDefault();e.currentTarget.style.borderColor="#ddd";}} style={{width:"100%",height,border:"2px dashed #ddd",borderRadius:6,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#FAFAFA"}} onMouseEnter={e=>(e.currentTarget.style.borderColor="#999")} onMouseLeave={e=>(e.currentTarget.style.borderColor="#ddd")}><div style={{fontSize:28,color:"#ccc",marginBottom:4,lineHeight:1}}>+</div><div style={{fontSize:10,color:"#aaa",letterSpacing:0.5,fontFamily:CS_FONT}}>Upload or drop {label}</div></div>}<input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/></div>;
};

const CSXbtn = ({ onClick, size = 16 }) => <button onClick={onClick} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:size,padding:"0 3px",lineHeight:1,transition:"color 0.15s"}} onMouseEnter={e=>(e.target.style.color="#d32f2f")} onMouseLeave={e=>(e.target.style.color="#ccc")}>×</button>;
const CSAddBtn = ({ onClick, label }) => <button onClick={onClick} style={{background:"none",border:"1px dashed #ddd",borderRadius:3,padding:"3px 12px",fontSize:9,color:"#aaa",cursor:"pointer",fontFamily:CS_FONT,letterSpacing:0.5,marginTop:4}} onMouseEnter={e=>{e.target.style.borderColor="#999";e.target.style.color="#666";}} onMouseLeave={e=>{e.target.style.borderColor="#ddd";e.target.style.color="#aaa";}}>+ {label}</button>;

// ─── Travel Itinerary cell components ────────────────────────────────────────
const TIHl = ({text,style:s={}}) => {if(!text)return null;const parts=String(text).split(/(\[.*?\])/g);return <span style={s}>{parts.map((pt,i)=>pt.startsWith("[")&&pt.endsWith("]")?<span key={i} style={{background:"#FFF9C4",borderRadius:2,padding:"0 2px"}}>{pt}</span>:<span key={i}>{pt}</span>)}</span>;};
const TICell = ({value,onChange,style:s={},align="left"}) => {
  const [editing,setEditing]=useState(false);const [temp,setTemp]=useState(value);
  useEffect(()=>{setTemp(value);},[value]);
  const commit=()=>{setEditing(false);onChange(temp);};
  if(editing)return <input autoFocus value={temp} onChange={e=>setTemp(e.target.value)} onBlur={commit} onKeyDown={e=>e.key==="Enter"&&commit()} style={{fontFamily:CS_FONT,fontSize:9,letterSpacing:0.5,border:"none",outline:"none",background:"#FFFDE7",width:"100%",boxSizing:"border-box",padding:"3px 4px",textAlign:align,...s}}/>;
  return <div onClick={()=>{setTemp(value);setEditing(true);}} style={{fontFamily:CS_FONT,fontSize:9,letterSpacing:0.5,cursor:"text",padding:"3px 4px",minHeight:16,textAlign:align,whiteSpace:"pre-wrap",...s}} onMouseEnter={e=>e.currentTarget.style.background="#fafafa"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{value?<TIHl text={value}/>:<span style={{color:"#ddd"}}>&mdash;</span>}</div>;
};
const TITableSection = ({title,subtitle,columns,rows,onUpdate,onAddRow,onDeleteRow,onDelete,onEditTitle,onEditSubtitle,isCustom,onAddColumn,onEditColumn,onDeleteColumn}) => (
  <div style={{marginBottom:16}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#000",padding:"4px 8px"}}>
      <div style={{display:"flex",alignItems:"baseline",gap:8,flex:1,minWidth:0}}>
        <div onClick={onEditTitle} style={{fontFamily:CS_FONT,fontSize:10,fontWeight:700,letterSpacing:0.5,color:"#fff",textTransform:"uppercase",cursor:"pointer",whiteSpace:"nowrap"}}>{title}</div>
        {subtitle&&<div onClick={onEditSubtitle} style={{fontFamily:CS_FONT,fontSize:8,letterSpacing:0.5,color:"rgba(255,255,255,0.55)",cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{subtitle}</div>}
      </div>
      <div style={{display:"flex",gap:10,flexShrink:0}}>
        {isCustom&&onAddColumn&&<span onClick={onAddColumn} style={{fontFamily:CS_FONT,fontSize:8,color:"rgba(255,255,255,0.55)",cursor:"pointer",letterSpacing:0.5}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.55)"}>+ ADD COLUMN</span>}
        <span onClick={onAddRow} style={{fontFamily:CS_FONT,fontSize:8,color:"rgba(255,255,255,0.55)",cursor:"pointer",letterSpacing:0.5}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.55)"}>+ ADD ROW</span>
        <span onClick={onDelete} style={{fontFamily:CS_FONT,fontSize:10,color:"rgba(255,255,255,0.3)",cursor:"pointer"}} onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.3)"}>×</span>
      </div>
    </div>
    <div style={{display:"flex",background:"#f4f4f4",borderBottom:"1px solid #ddd"}}>
      <div style={{width:18}}/>
      {columns.map((col,ci)=>(
        <div key={col.key} style={{flex:col.flex,fontFamily:CS_FONT,fontSize:7,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:"#999",padding:"4px 4px",display:"flex",alignItems:"center",gap:2}}>
          <span onClick={isCustom&&onEditColumn?()=>onEditColumn(ci):undefined} style={{cursor:isCustom?"pointer":"default"}}>{col.label}</span>
          {isCustom&&onDeleteColumn&&columns.length>1&&<span onClick={()=>onDeleteColumn(ci)} style={{cursor:"pointer",fontSize:8,color:"#ddd",marginLeft:2}} onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="#ddd"}>×</span>}
        </div>
      ))}
    </div>
    {rows.map((row,ri)=>(
      <div key={row.id} style={{display:"flex",borderBottom:"1px solid #f0f0f0",alignItems:"stretch",minHeight:26}}>
        <div style={{width:18,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span onClick={()=>onDeleteRow(ri)} style={{cursor:"pointer",fontSize:10,color:"#ddd"}} onMouseEnter={e=>e.target.style.color="#e53935"} onMouseLeave={e=>e.target.style.color="#ddd"}>×</span>
        </div>
        {columns.map(col=>(
          <div key={col.key} style={{flex:col.flex}}>
            <TICell value={row[col.key]||""} onChange={v=>onUpdate(ri,col.key,v)}/>
          </div>
        ))}
      </div>
    ))}
    {rows.length===0&&<div style={{fontFamily:CS_FONT,fontSize:9,color:"#ccc",letterSpacing:0.5,padding:"12px 26px",fontStyle:"italic"}}>No entries — click + ADD ROW</div>}
  </div>
);

// ─── DIETARY LIST HELPERS ────────────────────────────────────────────────────
const DIETARY_TAGS = ["None","Vegetarian","Vegan","Halal","Kosher","Gluten-Free","Dairy-Free","Nut Allergy","Shellfish Allergy","Pescatarian","Other"];
const DIETARY_TAG_COLORS = {"None":{bg:"#f4f4f4",text:"#999"},"Vegetarian":{bg:"#E8F5E9",text:"#2E7D32"},"Vegan":{bg:"#C8E6C9",text:"#1B5E20"},"Halal":{bg:"#E3F2FD",text:"#1565C0"},"Kosher":{bg:"#E8EAF6",text:"#283593"},"Gluten-Free":{bg:"#FFF3E0",text:"#E65100"},"Dairy-Free":{bg:"#FFF8E1",text:"#F57F17"},"Nut Allergy":{bg:"#FCE4EC",text:"#C62828"},"Shellfish Allergy":{bg:"#FCE4EC",text:"#C62828"},"Pescatarian":{bg:"#E0F7FA",text:"#00695C"},"Other":{bg:"#F3E5F5",text:"#6A1B9A"}};
const DietaryTagSelect = ({value,onChange}) => {
  const [open,setOpen]=useState(false);
  const current=value||"None";
  const c=DIETARY_TAG_COLORS[current]||DIETARY_TAG_COLORS["Other"];
  return (
    <div style={{position:"relative"}}>
      <div onClick={()=>setOpen(!open)} style={{fontFamily:CS_FONT,fontSize:8,fontWeight:600,letterSpacing:0.5,background:c.bg,color:c.text,padding:"3px 8px",borderRadius:2,cursor:"pointer",textAlign:"center",userSelect:"none",whiteSpace:"nowrap"}}>{current}</div>
      {open&&<div style={{position:"absolute",top:"100%",left:0,background:"#fff",border:"1px solid #ddd",zIndex:10,minWidth:130,boxShadow:"0 4px 12px rgba(0,0,0,0.1)",maxHeight:200,overflowY:"auto"}}>
        {DIETARY_TAGS.map(tag=>{const tc=DIETARY_TAG_COLORS[tag]||DIETARY_TAG_COLORS["Other"];return(
          <div key={tag} onClick={()=>{onChange(tag);setOpen(false);}} style={{fontFamily:CS_FONT,fontSize:8,letterSpacing:0.5,padding:"5px 8px",cursor:"pointer",borderBottom:"1px solid #f5f5f5",color:tc.text,display:"flex",alignItems:"center",gap:6}} onMouseEnter={e=>e.currentTarget.style.background="#f9f9f9"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
            <span style={{width:8,height:8,borderRadius:"50%",background:tc.bg,border:`1px solid ${tc.text}`,flexShrink:0}}/>{tag}
          </div>);})}
      </div>}
    </div>
  );
};
const DIETARY_INIT = {
  project:{name:"[Project Name]",client:"[Client Name]",date:"[Date]",cateringContact:"[Catering Company / Contact]"},
  people:[{id:1,name:"[Name]",role:"[Role]",department:"[Department]",dietary:"None",allergies:"",notes:""}],
  menu:[{id:1,category:"Starters",items:""}],
};

// ─── BUDGET CONNIE (ESTIMATE) CONSTANTS ──────────────────────────────────────
const EST_F = "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
const EST_LS = 0.5;
const EST_LS_HDR = 1.5;
const EST_YELLOW = "#FFF9C4";
const EstHl = ({ text, style = {} }) => {
  if (!text) return null;
  const parts = String(text).split(/(\[.*?\])/g);
  return <span style={style}>{parts.map((p, i) => p.startsWith("[") && p.endsWith("]")
    ? <span key={i} style={{ background: EST_YELLOW, borderRadius: 2, padding: "0 2px" }}>{p}</span>
    : <span key={i}>{p}</span>)}</span>;
};

const EstCell = ({ value, onChange, style = {}, align = "left" }) => {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);
  useEffect(() => { setTemp(value); }, [value]);
  const commit = () => { setEditing(false); onChange(temp); };
  const autoR = useCallback((el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }, []);
  if (editing) {
    const long = (temp || "").length > 50;
    if (long) return <textarea ref={el => autoR(el)} autoFocus value={temp}
      onChange={e => { setTemp(e.target.value); autoR(e.target); }} onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); } }}
      style={{ fontFamily: EST_F, fontSize: 10, letterSpacing: EST_LS, border: "none", outline: "none",
        background: "#FFFDE7", width: "100%", boxSizing: "border-box", padding: "4px 6px",
        textAlign: align, resize: "none", overflow: "hidden", lineHeight: 1.5, ...style }} />;
    return <input autoFocus value={temp} onChange={e => setTemp(e.target.value)}
      onBlur={commit} onKeyDown={e => e.key === "Enter" && commit()}
      style={{ fontFamily: EST_F, fontSize: 10, letterSpacing: EST_LS, border: "none", outline: "none",
        background: "#FFFDE7", width: "100%", boxSizing: "border-box", padding: "4px 6px",
        textAlign: align, ...style }} />;
  }
  return <div onClick={() => { setTemp(value); setEditing(true); }}
    style={{ fontFamily: EST_F, fontSize: 10, letterSpacing: EST_LS, cursor: "text", padding: "4px 6px",
      minHeight: 18, textAlign: align, whiteSpace: "pre-wrap", transition: "all .1s", ...style }}
    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
    {value ? <EstHl text={(() => { const n = parseFloat(String(value).replace(/,/g, "")); return (!isNaN(n) && String(value).replace(/,/g, "").match(/^\-?\d+\.?\d*$/)) ? (Math.round(n * 100) / 100).toString() : value; })()} /> : <span style={{ color: "#ccc" }}>&mdash;</span>}
  </div>;
};

const EstSignaturePad = ({ value, onChange }) => {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const drawing = useRef(false);
  const clear = () => { const c=canvasRef.current; if(c) c.getContext("2d").clearRect(0,0,c.width,c.height); onChange(""); };
  const getPos = (e) => {
    const c=canvasRef.current; const r=c.getBoundingClientRect();
    const t=e.touches?e.touches[0]:e;
    const scaleX=c.width/r.width; const scaleY=c.height/r.height;
    return {x:(t.clientX-r.left)*scaleX, y:(t.clientY-r.top)*scaleY};
  };
  const startDraw = (e) => { e.preventDefault(); drawing.current=true; const ctx=canvasRef.current.getContext("2d"); const p=getPos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); };
  const moveDraw = (e) => { if(!drawing.current)return; e.preventDefault(); const ctx=canvasRef.current.getContext("2d"); const p=getPos(e); ctx.lineWidth=2; ctx.lineCap="round"; ctx.strokeStyle="#1a1a1a"; ctx.lineTo(p.x,p.y); ctx.stroke(); };
  const endDraw = (e) => { if(!drawing.current)return; e&&e.preventDefault(); drawing.current=false; const c=canvasRef.current; if(c) onChange(c.toDataURL("image/png")); };
  useEffect(()=>{
    const c=canvasRef.current; const w=wrapRef.current; if(!c||!w)return;
    const resize=()=>{ const rect=w.getBoundingClientRect(); c.width=Math.round(rect.width); c.height=80; if(value){const img=new Image();img.onload=()=>c.getContext("2d").drawImage(img,0,0,c.width,80);img.src=value;} };
    resize(); window.addEventListener("resize",resize); return ()=>window.removeEventListener("resize",resize);
  },[]);
  if(value) return <div style={{position:"relative",height:80,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #ddd",borderRadius:2,background:"#fafafa"}}><img src={value} alt="" style={{maxHeight:76,maxWidth:"100%"}}/><button onClick={clear} style={{position:"absolute",top:4,right:4,background:"#d32f2f",color:"#fff",border:"none",borderRadius:4,fontSize:10,padding:"3px 10px",cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>Clear</button></div>;
  return <div ref={wrapRef} style={{position:"relative"}}><canvas ref={canvasRef} width={600} height={80} onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw} onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw} style={{width:"100%",height:80,border:"1px solid #ddd",borderRadius:2,background:"#fafafa",cursor:"crosshair",display:"block",touchAction:"none"}}/><button onClick={clear} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.5)",color:"#fff",border:"none",borderRadius:4,fontSize:10,padding:"3px 10px",cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>Clear</button></div>;
};

// OnnaEstLogo removed — estimates now use CSLogoSlot for logo (same as contracts/callsheets/RA)

const EST_SA_FIELDS = [
  {label:"Commencement Date", defaultValue:"[Date]"},
  {label:"Client", defaultValue:"[Name of Company] a company registered in [Country] under number [License Number] whose registered office is at [Address]"},
  {label:'Client Representative "The Brand"', defaultValue:"Name: [Client Name]\nEmail: [Client Email]\nTelephone: [Client Mobile]"},
  {label:"Campaign", defaultValue:"[Name of Shoot]"},
  {label:"Deliverables", defaultValue:"[Outline Deliverables]\n\nApproval Items\n[Directors Storyboard - note revision rounds]\n[Directors Treatment - note revision rounds]\n[Locations - note rounds]\n[Casting - note rounds]\n[Wardrobe rounds - note rounds]\n[Set Design - note rounds]\n[Timing Plans & Production Schedules]\n[Edits - note rounds]\n[Sound Design - note rounds]\n[Grade - note rounds]"},
  {label:"Timetable for Production Services", defaultValue:"[Proposed Shoot Dates]\n[Delivery Dates & Formats]\n[Date for completion of the Production Services]\n[Proposed Airdate]"},
  {label:"Production Services", defaultValue:"[Pay and source locations]\n[Maintain all necessary insurance for locations - Public Liability insurance]\n[Pay and source all necessary equipment]\n[Pay and source all necessary technical crew]\n[Produce the shoot on the day, with assistants to support]\n[Pay and source photographers / directors]\n[Pay and source all necessary Hair & Makeup]\n[Pay and source all necessary stylists & assistants]\n[Pay for travel & Accommodation]\n[Pay and source all necessary post-production crew, extending to sound designers, editors, and graders on the agreed post-production schedule]"},
  {label:"Usage", defaultValue:"[Usage Terms]"},
  {label:"Milestones", defaultValue:"[Pre-production dates]\n[Post-production dates]"},
  {label:"Key Individuals", defaultValue:"[Insert names of any personnel who are key to production services]\nDirector\nProducer\nOther"},
  {label:"Fee", defaultValue:"[Fee]"},
  {label:"Invoicing Terms", defaultValue:"75% Advance Payment before shoot 25% Remaining agreed fee billed on 30 days after the shoot.\nOverages may be agreed with Client Representative in writing and billed as an overage after the shoot.\nInterest of 2% per month will be applied to all past due invoices, if applicable."},
];

const DEFAULT_TCS = `GENERAL TERMS & CONDITIONS\n\nONNA FILM TV RADIO PRODUCTION SERVICES LLC & Subsidiary ONNA STUDIOS LTD (\u201cONNA\u201d). Client acknowledges and agrees that the Production Estimate is subject to the following terms and conditions:\n\nPAYMENTS & INVOICES\nClient will advance 75% of all expenses upon signing the Production Estimate no less than 5 days prior to the first day of the Shoot. Client\u2019s failure to pay the advance when due will delay the production and may result in cancellation. If ONNA is paying the photographer and/or talent the advance shall include 100% of the estimated photographer and/or talent fees, as applicable. The balance of all fees and expenses will be invoiced upon completion of the production and payment shall be due within 30 days of client\u2019s receipt of ONNA\u2019s final invoice. Any and all billing procedures must be clarified and approved in advance by ONNA. If Client does not notify ONNA of any disputes within 5 business days of receiving an invoice, the amounts provided for in the invoice shall be considered final and binding on Client. Due to the extra time required for post production, the post production invoice may be sent separately. Client shall be responsible for any increase in cost due to applicable exchange rate fluctuations and the final invoice will be adjusted accordingly. Certain costs provided for in this Production Estimate may be subject to tax based upon applicable laws, rules and/or regulations. If tax was not previously noted in the estimate, such amount shall be added to the final invoice. Interest of 2% per month will be applied to all past due invoices, if applicable. Client is responsible for paying all costs of collection including penalties, interest and reasonable legal fees and court costs. Client is responsible for all payments required under the Production Estimate, whether or not Client uses the resulting deliverables. Final delivery, all rights and usage are subject to the full and final payment of all monies provided for in the Production Estimate.\n\nPRODUCTION COSTS & OVERAGES\nThis Production Estimate is based on information received as of the date of the Production Estimate. The actual and final costs may differ from the Production Estimate and some items may be reallocated based upon production needs. The amount of the Service Charge provided for in the Production Estimate is a minimum amount due in connection with this Project, and shall not decrease for any underages. Overages are subject to the Client\u2019s approval and are subject to Service Charge and VAT. Client must have a representative to approve all changes and overages, if any, that may occur during production.\nThis Production Estimate is based on a 10 hour day. Quoted fees do not include overtime unless otherwise noted in the Production Estimate. In the event that the production extends beyond 10 hours, ONNA may charge overtime for crew at the rate of 1.5 times their hourly rate. In the event that the production extends beyond 12 hours, ONNA may charge overtime for crew at the rate of 2 times their hourly rate. All additional overtime incurred will be reflected on the final invoice upon the wrap of the job. This Production Estimate does not include any agency or client travel, unless otherwise noted in the Production Estimate. Back-up receipts for third-party and other costs can only be provided if requested before the confirmation of the provision of the Services. If back-up receipts are required, there will be an accountancy charge of 1.5% of the Fee. ONNA will keep all props, wardrobe, and other things used in the provision of the Services unless specified otherwise in writing before the provision of the Services. If, in the reasonable opinion of ONNA, extra insurance is required because of the value or nature of any props, wardrobes, and things used in the provision of the Services, ONNA may require the Client to pay for additional insurance. Any additional filming, including b-roll, BTS, reality filming or any other production taking place on set must be pre-approved by ONNA in writing and may result in additional costs, expenses and fees.\n\nINDEMNITY\nClient acknowledges that the creative concept was provided by Client or others engaged directly by Client and except as provided for in the Production Estimate, Client shall be responsible for obtaining all third party rights, clearances and/or releases, including with respect to talent body art, background architecture, artwork, signage or similar items appearing in the images and/or videos and ensuring that all final deliverables comply with Client\u2019s requirements, including all legal requirements. Client will indemnify and hold ONNA and its principals, employees, agents, representatives, attorneys, successors and assigns, harmless against any and all third party claims, liabilities, damages, costs, fees and expenses including reasonable attorney fees and expenses related to failure to obtain clearances for any third-party intellectual property, personal or other proprietary rights, including copyrighted or trademarked work, and for negligent acts or omissions by Client and others engaged by Client in connection with the production. Neither party shall be liable to the other for any speculative, consequential, incidental and/or punitive damages hereunder.\n\nTALENT\nClient shall be responsible to engage and pay all models and talent (including all fees, late fees, penalties and/or interest due for failure to comply with applicable laws, rules and/or regulations and confirming with agency if a chaperone is required). Client shall be responsible for all workers\u2019 compensation insurance coverage applicable to all such models and talent. If model or talent is under the age of 18, Client must notify ONNA in advance and Client is responsible for confirming with agency if a chaperone is required to be on set. If ONNA handles payments to talent, all related charges shall be billed to Client.\n\nLICENSE\nClient shall be responsible to comply with the provisions of the photographer and/or talent agreements including with respect to any renewals or extensions of usage. Client shall notify and engage ONNA at least 30 days in advance to extend any usage referenced in the Production Estimate. Client shall provide ONNA with all high-resolution final layouts and images. Client acknowledges and agrees that, after the Estimated Delivery Date, ONNA has the right to use the Materials in any manner that promotes ONNA.\n\nCANCELLATION & POSTPONMENT\nClient may not cancel this job without paying 100% of all production fees and expenses as provided for in the Production Estimate, including those necessary to cancel and/or reschedule the shoot, due to weather, force majeure events and additional costs and expenses.\n\nMISCELLANEOUS\nThe Client specifically agrees not to circumvent or bypass ONNA with respect to the provision of the Services. To give effect to this clause, the Client agrees that it will negotiate all future bookings for any member of the crew directly with ONNA in advance in writing and any costs shall be the responsibility of Client.\n\nINSURANCE\nIf Client wishes to pursue any additional non-appearance, cancellation, weather, special risks, talent or similar insurance, the costs of additional insurance shall be an expense to the Client. Any deducible and/or co-insurance in the policy shall be the responsibility of the Client. Small losses or claims that are less than the amount of the deductible will be added to the final invoice.\n\nCREDIT\nClient shall grant right to use the content on their website. For editorial jobs, Client shall grant ONNA the right to use the content on their website and social media as @onnaproduction.\n\nGOVERNING LAW\nThis Agreement will be governed by and construed in accordance with the laws in force in the Emirate of Dubai and the parties irrevocably submit to the non-exclusive jurisdiction of the courts of the Emirate of Dubai.`;

const ESTIMATE_INIT = {
  ts: { version:"PRODUCTION ESTIMATE V1", date:"[Date]", client:"[Client]", project:"[Project]",
    attention:"[Attention]", photographer:"[Photographer / Director]",
    deliverables:"[TBC]", deadlines:"[TBC]", usage:"[Usage Terms]", shootDate:"[Shoot Date]",
    shootDays:"[1 SHOOT DAY]", shootHours:"[BASED ON A 10 HOUR SHOOT DAY]",
    location:"[DUBAI]", payment:"[75% ADVANCE, 25% UPON COMPLETION (30 DAYS FROM INVOICE)]",
    notes:"" },
  sections: null,
  saFields: null,
  tcsText: null,
  saSigs: {},
  prodLogo: null,
};

const CALLSHEET_INIT = {
  shootName:"",date:"",dayNumber:"",productionContacts:"",passportNote:"ALL CREW MUST BRING VALID PASSPORT/ID TO SET",
  productionLogo:null,agencyLogo:null,clientLogo:null,mapImage:null,mapLink:"",extraMapImages:[],weatherImage:null,weatherSummary:"",weatherHighC:"",weatherHighF:"",weatherLowC:"",weatherLowF:"",weatherRealFeelHighC:"",weatherRealFeelHighF:"",weatherRealFeelLowC:"",weatherRealFeelLowF:"",weatherSunrise:"",weatherSunset:"",weatherBlueHour:"",weatherHourly:[],
  venueRows:[{label:"BASE CAMP",value:""},{label:"LOCATIONS",value:""},{label:"PARKING",value:""},{label:"ACCESS",value:""},{label:"NOTES",value:""}],
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
  emergencyNumbers:[{label:"POLICE",number:"999"},{label:"AMBULANCE",number:"998"},{label:"FIRE DEPARTMENT",number:"997"}],
  emergencyDialPrefix:"UAE DIAL:",
  emergency:{hospital:"American Hospital Nad Al Sheba Clinic, Avenue Mall - Nad Al Sheba - Nadd Al Shiba Second - Dubai, +971 800 24392",police:"Nad Al Sheba Police Administration Office, Road - Nad Al Sheba - Nad Al Sheba 1 - Dubai, +971 4 336 3535"},
  invoicing:{terms:"NET 30 days",email:"accounts@onnaproduction.com",address:"ONNA FILM, TV & RADIO PRODUCTION SERVICES LLC.\nOFFICE NO. F1-022,\nPROPERTY INVESTMENT OFFICE 4-F1\nDUBAI, UNITED ARAB EMIRATES",trn:"105161036600003"},
  protocol:"WE KINDLY ASK ALL CAST AND CREW TO BE SENSITIVE TO THE BRANDS, LOGOS, PEOPLE AND PRODUCTS BEING CAPTURED ON THIS SHOOT AND REMIND YOU THAT IN WORKING ON THIS PRODUCTION YOU AGREE TO TREAT ALL CLIENT INFORMATION, PHOTOGRAPHY AND FILMING AS CONFIDENTIAL. YOU AGREE NOT TO COMMUNICATE ANY COMMENTS OR IMAGERY OF THE SHOOT AT ANY TIME BY ANY MEANS, INCLUDING VIA SOCIAL MEDIA WITHOUT EXPRESS PERMISSION FROM PRODUCTION.",
};

// ─── CPS (Creative Production Schedule) ──────────────────────────────────────────



// Re-export everything for convenience
export { MAX_IMG_SIZE, validateImg, CS_FONT, CS_LS, CS_YELLOW, RA_FONT, RA_LS, RA_LS_HDR, RA_GREY, CT_FONT, CT_LS, CT_LS_HDR };
export { CSEditField, SignaturePad, CSEditTextarea, CSLogoSlot, CSResizableImage, CSXbtn, CSAddBtn };
export { TIHl, TICell, TITableSection };
export { DIETARY_TAGS, DIETARY_TAG_COLORS, DietaryTagSelect, DIETARY_INIT };
export { EST_F, EST_LS, EST_LS_HDR, EST_YELLOW, EstHl, EstCell, EstSignaturePad, EST_SA_FIELDS, DEFAULT_TCS, ESTIMATE_INIT };
export { CALLSHEET_INIT };
