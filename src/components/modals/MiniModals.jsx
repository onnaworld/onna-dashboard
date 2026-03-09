import React from "react";

export function TimeoutWarning({ setShowTimeoutWarning }) {
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,background:"#E65100",color:"#fff",padding:"10px 20px",textAlign:"center",fontSize:13,fontWeight:600,fontFamily:"inherit",zIndex:100001,display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>Session expires in 1 minute due to inactivity<button onClick={()=>{setShowTimeoutWarning(false);}} style={{background:"#fff",color:"#E65100",border:"none",borderRadius:6,padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>I'm still here</button></div>
  );
}

export function GlobalAlertModal({ _modal, _closeModal, _modalInputRef }) {
  return (
    <div onClick={()=>_closeModal(_modal.type==="prompt"?null:undefined)} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.45)",zIndex:100000,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Avenir','Avenir Next','Nunito Sans',sans-serif"}}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,padding:"28px 32px",minWidth:340,maxWidth:480,boxShadow:"0 12px 40px rgba(0,0,0,0.18)",border:"1px solid #e5e5e5"}}>
      <div style={{fontSize:14,color:"#1a1a1a",lineHeight:1.6,whiteSpace:"pre-wrap",marginBottom:20}}>{_modal.message}</div>
      {_modal.type==="prompt"&&<input ref={_modalInputRef} defaultValue={_modal.defaultVal} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();_closeModal(e.target.value);}if(e.key==="Escape")_closeModal(null);}} style={{width:"100%",padding:"10px 12px",fontSize:14,border:"1.5px solid #ddd",borderRadius:8,fontFamily:"inherit",marginBottom:16,boxSizing:"border-box"}}/>}
      <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
        {_modal.type==="prompt"&&<button onClick={()=>_closeModal(null)} style={{padding:"9px 20px",fontSize:13,fontWeight:600,border:"1.5px solid #ddd",borderRadius:8,background:"#fff",color:"#666",cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>}
        <button onClick={()=>{if(_modal.type==="prompt"){const v=_modalInputRef.current?_modalInputRef.current.value:_modal.defaultVal;_closeModal(v);}else _closeModal(undefined);}} style={{padding:"9px 20px",fontSize:13,fontWeight:600,border:"none",borderRadius:8,background:"#1a1a1a",color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>OK</button>
      </div>
    </div></div>
  );
}

export function UndoToast({ undoToastMsg }) {
  return (
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#1d1d1f",color:"#fff",padding:"10px 24px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"inherit",zIndex:99999,boxShadow:"0 8px 32px rgba(0,0,0,0.25)",pointerEvents:"none"}}>{undoToastMsg}</div>
  );
}
