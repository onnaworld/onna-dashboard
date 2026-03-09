import React, { useState } from "react";
import { CS_FONT } from "../components/ui/DocHelpers";

// ─── RECCE REPORT HELPERS ───────────────────────────────────────────────────
export const RECCE_RATINGS = ["Excellent","Good","Adequate","Poor","Not Suitable"];
export const RECCE_RATING_C = {
  "Excellent":{bg:"#E8F5E9",text:"#2E7D32"},"Good":{bg:"#E3F2FD",text:"#1565C0"},
  "Adequate":{bg:"#FFF3E0",text:"#E65100"},"Poor":{bg:"#FCE4EC",text:"#C62828"},
  "Not Suitable":{bg:"#000",text:"#fff"},
};
let _recceLocId = 0;
export const mkRecceLocation = () => ({
  id:"rloc"+(++_recceLocId),name:"",address:"",gps:"",contact:"",contactPhone:"",
  power:"",parking:"",light:"",noise:"",permits:"",
  hospital:"",facilities:"",signal:"",health:"",shootTimes:"",
  rating:"",recommendation:"",notes:"",images:[],
});
export const RECCE_REPORT_INIT = {
  project:{name:"[Project Name]",client:"[Client Name]",date:"[Date]",producer:"[Producer]",scoutedBy:"[Scouted By]"},
  locations:[mkRecceLocation()],
  selLoc:null,
};
export const RecceInp = ({value,onChange,placeholder,style:s={}}) => (
  <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{fontFamily:CS_FONT,fontSize:9,letterSpacing:0.5,border:"none",outline:"none",padding:"3px 6px",
      background:value?"transparent":"#FFFDE7",boxSizing:"border-box",width:"100%",...s}}/>
);
export const RecceField = ({label,value,onChange,placeholder,color="#999",style:s={}}) => (
  <div style={{flex:1,minWidth:140,...s}}>
    <div style={{fontFamily:CS_FONT,fontSize:7,fontWeight:700,letterSpacing:0.5,color,marginBottom:2}}>{label}</div>
    <RecceInp value={value} onChange={onChange} placeholder={placeholder}/>
  </div>
);
export const RecceImgSlot = ({src,onAdd,onRemove,h="100%"}) => {
  const [over,setOver]=useState(false);
  if(src)return(
    <div onDragOver={e=>{e.preventDefault();setOver(true);}} onDragLeave={()=>setOver(false)}
      onDrop={e=>{e.preventDefault();e.stopPropagation();setOver(false);if(e.dataTransfer.files.length>0){onRemove();setTimeout(()=>onAdd(e.dataTransfer.files),50);}}}
      style={{width:"100%",height:h,position:"relative",overflow:"hidden",borderRadius:2,border:over?"2px solid #FFD54F":"none"}}>
      <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
      <button data-hide="1" onClick={onRemove} style={{position:"absolute",top:3,right:3,background:"rgba(0,0,0,0.5)",border:"none",color:"#fff",fontSize:9,cursor:"pointer",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>×</button>
    </div>
  );
  return(
    <div onDragOver={e=>{e.preventDefault();setOver(true);}} onDragLeave={()=>setOver(false)}
      onDrop={e=>{e.preventDefault();e.stopPropagation();setOver(false);if(e.dataTransfer.files.length>0)onAdd(e.dataTransfer.files);}}
      style={{width:"100%",height:h,background:over?"#FFFDE7":"#f8f8f8",border:over?"2px dashed #FFD54F":"1px dashed #ddd",borderRadius:2,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .15s"}}>
      <label style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
        <span style={{fontSize:16,color:over?"#E65100":"#ddd"}}>+</span>
        <span style={{fontFamily:CS_FONT,fontSize:6,color:over?"#E65100":"#ccc",letterSpacing:0.5}}>Drop or click</span>
        <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{onAdd(e.target.files);e.target.value="";}}/>
      </label>
    </div>
  );
};
