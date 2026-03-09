import React from "react";

export function RateCardModal({ T, BtnPrimary, BtnSecondary, showRateModal, setShowRateModal, rateInput, setRateInput, api, setVendors }) {
  return (
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
  );
}
