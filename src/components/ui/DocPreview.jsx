import React, { useState, useRef, useCallback, useEffect } from "react";

export function DocPreviewDraggable({config,onReprocess,onExport}){
  const appliesTo=(rule,i,total)=>{if(rule==="all")return true;if(rule==="first"&&i===0)return true;if(rule==="last"&&i===total-1)return true;if(Array.isArray(rule))return rule.includes(i);return rule===i;};
  const total=config.originalDoc.pages.length;
  const [signAR,setSignAR]=useState(1.8);const [stampAR,setStampAR]=useState(1.2);const [logoAR,setLogoAR]=useState(2.4);
  return <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:8}}>
    {config.originalDoc.pages.map((_,pi)=><DocPagePanel key={pi} pageIndex={pi} config={config} onReprocess={onReprocess} onExport={onExport} total={total} appliesTo={appliesTo} signAR={signAR} setSignAR={setSignAR} stampAR={stampAR} setStampAR={setStampAR} logoAR={logoAR} setLogoAR={setLogoAR}/>)}
    {total>1&&<button onClick={()=>onExport()} style={{border:"1px solid #0066cc",background:"#0066cc",color:"#fff",borderRadius:6,padding:"6px 16px",fontSize:12,fontWeight:600,cursor:"pointer",alignSelf:"flex-start"}}>Export All Pages</button>}
  </div>;
}
export function DocPagePanel({pageIndex,config,onReprocess,onExport,total,appliesTo,signAR,setSignAR,stampAR,setStampAR,logoAR,setLogoAR}){
  const containerRef=useRef(null);
  const [natW,setNatW]=useState(0);const [natH,setNatH]=useState(0);const [dispW,setDispW]=useState(0);
  const dragRef=useRef({dragging:false,target:null,startX:0,startY:0,origX:0,origY:0});
  const pageImg=config.originalDoc.pages[pageIndex];
  const scale=natW?dispW/natW:1;
  const sScale=config.signScale||1;const stScale=config.stampScale||1;
  const showSign=config.wantSign&&appliesTo(config.signPages||"last",pageIndex,total);
  const showStamp=config.wantStamp&&appliesTo(config.stampPages||"last",pageIndex,total);
  const showLetter=config.wantLetterhead&&appliesTo(config.letterPages||"first",pageIndex,total);
  const signH=80*sScale,signW=signH*signAR;
  const stampH=120*stScale,stampW=stampH*stampAR;
  const po=(config.pageOffsets||{})[pageIndex]||{};
  const signCX=60+(po.signOffsetX!=null?po.signOffsetX:(config.signOffsetX||0));
  const signCY=natH-180+(po.signOffset!=null?po.signOffset:(config.signOffset||0));
  const stampCX=natW-60-stampW+(po.stampOffsetX!=null?po.stampOffsetX:(config.stampOffsetX||0));
  const stampCY=natH-180+(po.stampOffset!=null?po.stampOffset:(config.stampOffset||0));
  const LH_H=100,lhH=50,lhX=60,lhY=22;
  const contentScale=showLetter?(natH-LH_H)/natH:1;
  const onBgLoad=useCallback(e=>{const img=e.target;setNatW(img.naturalWidth);setNatH(img.naturalHeight);setDispW(img.offsetWidth);},[]);
  useEffect(()=>{const ro=new ResizeObserver(ents=>{for(const ent of ents)setDispW(ent.contentRect.width);});if(containerRef.current)ro.observe(containerRef.current);return()=>ro.disconnect();},[]);
  const onMouseDown=useCallback((target,e)=>{
    e.preventDefault();e.stopPropagation();
    const cx=target==="sign"?signCX:stampCX;const cy=target==="sign"?signCY:stampCY;
    dragRef.current={dragging:true,target,startX:e.clientX,startY:e.clientY,origX:cx,origY:cy};
    const onMove=ev=>{if(!dragRef.current.dragging)return;const el=document.getElementById("_dpd_"+pageIndex+"_"+dragRef.current.target);if(el){el.style.left=(dragRef.current.origX*scale+(ev.clientX-dragRef.current.startX))+"px";el.style.top=(dragRef.current.origY*scale+(ev.clientY-dragRef.current.startY))+"px";}};
    const onUp=ev=>{if(!dragRef.current.dragging)return;dragRef.current.dragging=false;window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);
      const dx=(ev.clientX-dragRef.current.startX)/scale;const dy=(ev.clientY-dragRef.current.startY)/scale;const t=dragRef.current.target;const newCfg={...config,pageOffsets:{...(config.pageOffsets||{})}};
      const curPo={...(newCfg.pageOffsets[pageIndex]||{})};
      if(t==="sign"){let nx=(po.signOffsetX!=null?po.signOffsetX:(config.signOffsetX||0))+dx,ny=(po.signOffset!=null?po.signOffset:(config.signOffset||0))+dy;const sw=signW;const rawX=60+nx,rawY=natH-180+ny;if(rawX<0)nx=-60;if(rawX+sw>natW)nx=natW-60-sw;if(rawY<0)ny=-(natH-180);if(rawY+signH>natH)ny=signH;curPo.signOffsetX=Math.round(nx);curPo.signOffset=Math.round(ny);
      }else{let nx=(po.stampOffsetX!=null?po.stampOffsetX:(config.stampOffsetX||0))+dx,ny=(po.stampOffset!=null?po.stampOffset:(config.stampOffset||0))+dy;const rawX=natW-60-stampW+nx,rawY=natH-180+ny;if(rawX<0)nx=-(natW-60-stampW);if(rawX+stampW>natW)nx=60;if(rawY<0)ny=-(natH-180);if(rawY+stampH>natH)ny=stampH;curPo.stampOffsetX=Math.round(nx);curPo.stampOffset=Math.round(ny);}
      newCfg.pageOffsets[pageIndex]=curPo;
      onReprocess(newCfg);};
    window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onUp);
  },[config,pageIndex,po,scale,natW,natH,signCX,signCY,stampCX,stampCY,signAR,stampAR,signH,signW,stampH,stampW,sScale,stScale,onReprocess]);
  const onResizeDown=useCallback((target,e)=>{
    e.preventDefault();e.stopPropagation();
    const startY=e.clientY;const origScale=target==="sign"?(config.signScale||1):(config.stampScale||1);const baseH=target==="sign"?80:120;
    dragRef.current={dragging:true,target,startX:e.clientX,startY,origX:0,origY:0};
    const onMove=ev=>{if(!dragRef.current.dragging)return;const dy=ev.clientY-startY;const newS=Math.max(0.3,Math.min(3,origScale+dy/(baseH*scale)));
      const el=document.getElementById("_dpd_"+pageIndex+"_"+target);if(el){el.style.height=(baseH*newS*scale)+"px";}};
    const onUp=ev=>{dragRef.current.dragging=false;window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);
      const dy=ev.clientY-startY;const newS=Math.max(0.3,Math.min(3,origScale+dy/(baseH*scale)));const newCfg={...config};
      if(target==="sign")newCfg.signScale=Math.round(newS*100)/100;else newCfg.stampScale=Math.round(newS*100)/100;
      onReprocess(newCfg);};
    window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onUp);
  },[config,pageIndex,scale,onReprocess]);
  const resizeHandle=(target)=><div onMouseDown={e=>onResizeDown(target,e)} style={{position:"absolute",right:-3,bottom:-3,width:10,height:10,cursor:"nwse-resize",background:"#0066cc",borderRadius:2,border:"1px solid #fff",zIndex:5}}/>;
  const overlays=[];
  if(showSign)overlays.push("Signature");if(showStamp)overlays.push("Stamp");if(showLetter)overlays.push("Letterhead");
  const padT="3.4%",padS="2.7%",padB="2.7%";
  return <div ref={containerRef} style={{position:"relative",maxWidth:480,borderRadius:8,overflow:"hidden",border:"1px solid #e0e0e0",background:"#fff",userSelect:"none",padding:`${padT} ${padS} ${padB} ${padS}`}}>
    {showLetter?<div style={{position:"relative",width:"100%"}}><div style={{width:"100%",paddingBottom:(natH&&natW?(natH/natW*100):75)+"%"}}/>
      <img src={pageImg} alt={"page "+(pageIndex+1)} onLoad={onBgLoad} style={{position:"absolute",top:LH_H*scale,left:0,width:(contentScale*100)+"%",height:"auto",display:"block"}} draggable={false}/>
    </div>:<img src={pageImg} alt={"page "+(pageIndex+1)} onLoad={onBgLoad} style={{width:"100%",height:"auto",display:"block"}} draggable={false}/>}
    {showLetter&&<div style={{position:"absolute",top:padT,left:padS,right:padS,bottom:padB,pointerEvents:"none",zIndex:1}}><img src="/onna-default-logo.png" alt="logo" draggable={false} onLoad={e=>setLogoAR(e.target.naturalWidth/e.target.naturalHeight)} style={{position:"absolute",left:lhX*scale,top:lhY*scale,height:lhH*scale,width:"auto"}}/><div style={{position:"absolute",left:40*scale,right:40*scale,top:(lhY+lhH+8)*scale,height:Math.max(1,2.5*scale),background:"#000"}}/></div>}
    {showSign&&<div id={"_dpd_"+pageIndex+"_sign"} style={{position:"absolute",left:`calc(${padS} + ${signCX*scale}px)`,top:`calc(${padT} + ${signCY*scale}px)`,zIndex:2}}><img src="/SIGN.png" alt="signature" draggable={false} onLoad={e=>setSignAR(e.target.naturalWidth/e.target.naturalHeight)} onMouseDown={e=>onMouseDown("sign",e)} style={{height:signH*scale,width:"auto",cursor:"grab",filter:"drop-shadow(0 1px 3px rgba(0,0,0,0.18))",display:"block"}}/>{resizeHandle("sign")}</div>}
    {showStamp&&<div id={"_dpd_"+pageIndex+"_stamp"} style={{position:"absolute",left:`calc(${padS} + ${stampCX*scale}px)`,top:`calc(${padT} + ${stampCY*scale}px)`,zIndex:2}}><img src="/STAMP.png" alt="stamp" draggable={false} onLoad={e=>setStampAR(e.target.naturalWidth/e.target.naturalHeight)} onMouseDown={e=>onMouseDown("stamp",e)} style={{height:stampH*scale,width:"auto",cursor:"grab",filter:"drop-shadow(0 1px 3px rgba(0,0,0,0.18))",display:"block"}}/>{resizeHandle("stamp")}</div>}
    <div style={{padding:"4px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fff",borderTop:"1px solid #eee"}}>
      <span style={{fontSize:10,color:"#666"}}>Page {pageIndex+1}{overlays.length>0?" · "+overlays.join(", "):""}</span>
      <button onClick={()=>onExport(pageIndex)} style={{border:"1px solid #0066cc",background:"#fff",color:"#0066cc",borderRadius:4,padding:"2px 10px",fontSize:10,fontWeight:600,cursor:"pointer"}}>Export Page</button>
    </div>
  </div>;
}
