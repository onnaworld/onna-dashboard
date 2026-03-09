import React from "react";
import { CT_FONT, CT_LS, CT_LS_HDR, SignaturePad } from "./ui/DocHelpers";
import { CONTRACT_DOC_TYPES, GENERAL_TERMS_DOC } from "./agents/ContractCody";
import { PRINT_CLEANUP_CSS } from "../utils/helpers";

export default function SigningPage({ signData, signLoading, signError, signSubmitted, signVendorName, setSignVendorName, signVendorDate, setSignVendorDate, signVendorSig, setSignVendorSig, signSubmitting, setSignSubmitting, setSignSubmitted, _signToken, _printMode, showAlert }) {
  const submitVendorSig = async () => {
    if (!signVendorSig || !signVendorName.trim() || !signVendorDate.trim()) { showAlert("Please fill in your signature, name, and date before submitting."); return; }
    setSignSubmitting(true);
    try {
      let renderedHtml = "";
      const el = document.getElementById("onna-sign-print");
      if (el) {
        const clone = el.cloneNode(true);
        clone.querySelectorAll("button").forEach(b=>b.remove());
        clone.querySelectorAll("input").forEach(inp=>{const sp=document.createElement("span");sp.textContent=inp.value;sp.style.cssText=inp.style.cssText;inp.parentNode.replaceChild(sp,inp);});
        clone.querySelectorAll("canvas").forEach(c=>{const img=document.createElement("img");img.src=c.toDataURL();img.style.cssText=c.style.cssText;c.parentNode.replaceChild(img,c);});
        renderedHtml = clone.outerHTML;
      }
      const resp = await fetch("/api/sign", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: _signToken, sigName: signVendorName, sigDate: signVendorDate, signature: signVendorSig, renderedHtml }) });
      const data = await resp.json();
      if (data.ok) {
        if (el) {
          const clone2 = el.cloneNode(true);
          clone2.querySelectorAll("button").forEach(b=>b.remove());
          clone2.querySelectorAll("input").forEach(inp=>{const sp=document.createElement("span");sp.textContent=inp.value;sp.style.cssText=inp.style.cssText;inp.parentNode.replaceChild(sp,inp);});
          clone2.querySelectorAll("canvas").forEach(c=>{const img=document.createElement("img");img.src=c.toDataURL();img.style.cssText=c.style.cssText;c.parentNode.replaceChild(img,c);});
          clone2.style.borderRadius="0";clone2.style.boxShadow="none";
          const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
          const idoc=iframe.contentDocument;idoc.open();idoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>\u200B</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;}@media print{@page{margin:0;size:A4;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);idoc.close();
          idoc.body.appendChild(idoc.adoptNode(clone2));setTimeout(()=>{idoc.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(el=>el.remove());iframe.contentWindow.focus();iframe.contentWindow.print();setTimeout(()=>document.body.removeChild(iframe),1000);},300);
        }
        setSignSubmitted(true);
      }
      else showAlert(data.error || "Submission failed");
    } catch (err) { showAlert("Error: " + err.message); }
    setSignSubmitting(false);
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  return (
    <div className="sign-outer-wrap" style={{minHeight:"100vh",background:"#f5f5f7",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"}}>
      <style>{`@viewport{width:device-width}@media(max-width:639px){.sign-field-row{flex-direction:column!important}.sign-field-label{width:100%!important;min-width:0!important;border-right:none!important;border-bottom:1px solid #eee!important}.sign-sig-cols{flex-direction:column!important}.sign-sig-left{border-right:none!important;border-bottom:1px solid #eee!important}}@media print{.sign-header-bar,.no-print,.sign-success-banner{display:none!important}body{background:#fff!important;margin:0!important;padding:0!important;}@page{margin:0;size:A4}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.sign-outer-wrap{background:#fff!important;min-height:auto!important}.sign-inner-wrap{margin:0!important;padding:0!important;max-width:none!important}#onna-sign-print{box-shadow:none!important;border-radius:0!important;margin:0!important}}`}</style>
      {!_printMode && <div className="sign-header-bar" style={{background:"#1d1d1f",padding:"14px 20px",display:"flex",alignItems:"center",gap:10}}>
        <span style={{color:"#fff",fontSize:16,fontWeight:700,letterSpacing:1.5}}>ONNA</span>
        <span style={{color:"#888",fontSize:12,fontWeight:400}}>Contract Signing</span>
      </div>}
      <div className="sign-inner-wrap" style={{maxWidth:860,margin:"20px auto",padding:"0 14px"}}>
        {signLoading && <div style={{textAlign:"center",padding:60,color:"#888"}}>Loading contract...</div>}
        {signError && <div style={{textAlign:"center",padding:60,color:"#c0392b"}}>{signError}</div>}
        {signData && (() => {
          const isSignedOrSubmitted = signData.status === "signed" || signSubmitted;
          const snap = signData.contractSnapshot || {};
          const ctType = signData.ct || signData.contractType || snap.contractType || snap.activeType || "commission_se";
          const ctDef = CONTRACT_DOC_TYPES.find(c=>c.id===ctType) || CONTRACT_DOC_TYPES[0];
          const fv = snap.fieldValues || snap.fv || {};
          const getVal = (key) => fv[key] || fv[`${ctType}_${key}`] || ctDef.fields.find(f=>f.key===key)?.defaultValue || "";
          const generalTerms = (snap.generalTermsEdits||{}).custom || snap.gte || (snap.generalTermsEdits||{})[ctType] || GENERAL_TERMS_DOC[ctType] || "";
          const readOnlySig = _printMode || isSignedOrSubmitted;
          const vs = signData.vendorSig || {};
          const printVendorSig = signSubmitted ? signVendorSig : (vs.signature || "");
          const printVendorName = signSubmitted ? signVendorName : (vs.sigName || "");
          const printVendorDate = signSubmitted ? signVendorDate : (vs.sigDate || "");
          return (
            <div id="onna-sign-print" style={{background:"#fff",borderRadius:_printMode?0:14,padding:isMobile?"28px 16px 20px":"48px 40px 32px",boxShadow:_printMode?"none":"0 2px 12px rgba(0,0,0,0.06)"}}>
              {isSignedOrSubmitted && !_printMode && (
                <div className="sign-success-banner" style={{background:"#f0faf4",border:"1px solid #c8efd4",borderRadius:10,padding:"12px 18px",marginBottom:20,textAlign:"center"}}>
                  <span style={{fontSize:14,fontWeight:600,color:"#1a5a30"}}>{signSubmitted ? "Signature submitted successfully" : "This contract has been signed"}</span>
                  {!signSubmitted && signData.signedAt && <div style={{fontSize:12,color:"#888",marginTop:4}}>Signed on {new Date(signData.signedAt).toLocaleDateString()}</div>}
                </div>
              )}
              {snap.prodLogo && <img src={snap.prodLogo} alt="" style={{maxHeight:36,maxWidth:140,objectFit:"contain",marginBottom:4}}/>}
              <div style={{borderBottom:"2.5px solid #000",marginBottom:16}}/>
              <div style={{textAlign:"center",fontFamily:CT_FONT,fontSize:isMobile?10:12,fontWeight:700,letterSpacing:CT_LS_HDR,textTransform:"uppercase",marginBottom:12}}>{ctDef.title}</div>
              {(signData.projectName || signData.label) && <div style={{fontFamily:CT_FONT,fontSize:9,color:"#1a1a1a",letterSpacing:CT_LS,marginBottom:14}}>{signData.projectName && <span>Project: {signData.projectName}</span>}{signData.projectName && signData.label && <span style={{margin:"0 6px"}}>|</span>}{signData.label && <span>{signData.label}</span>}</div>}

              {/* Head Terms (read-only) */}
              {ctDef.headTermsLabel && (<>
                <div style={{background:"#f4f4f4",padding:"6px 12px",borderBottom:"1px solid #ddd"}}>
                  <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:700,letterSpacing:CT_LS_HDR}}>{ctDef.headTermsLabel}</span>
                </div>
                {ctDef.fields.map(field => (
                  <div key={field.key} className="sign-field-row" style={{display:"flex",borderBottom:"1px solid #eee",minHeight:28}}>
                    <div className="sign-field-label" style={{width:180,minWidth:180,padding:"8px 12px",background:"#fafafa",borderRight:"1px solid #eee"}}>
                      <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS}}>{field.label}</span>
                    </div>
                    <div style={{flex:1,padding:"8px 12px"}}>
                      <span style={{fontFamily:CT_FONT,fontSize:10,letterSpacing:CT_LS,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{getVal(field.key)}</span>
                    </div>
                  </div>
                ))}
              </>)}

              {/* General Terms (read-only) */}
              <div style={{marginTop:24}}>
                <div style={{background:"#000",color:"#fff",fontFamily:CT_FONT,fontSize:10,fontWeight:700,letterSpacing:CT_LS_HDR,textAlign:"center",padding:"4px 0",textTransform:"uppercase"}}>GENERAL TERMS</div>
                <div style={{fontFamily:CT_FONT,fontSize:10,letterSpacing:CT_LS,lineHeight:1.6,color:"#1a1a1a",padding:"12px",whiteSpace:"pre-wrap",wordBreak:"break-word",border:"1px solid #eee",borderTop:"none"}}>{generalTerms}</div>
              </div>

              {/* Signature Block */}
              <div style={{marginTop:24}}>
                <div style={{background:"#000",color:"#fff",fontFamily:CT_FONT,fontSize:10,fontWeight:700,letterSpacing:CT_LS_HDR,textAlign:"center",padding:"4px 0",textTransform:"uppercase"}}>SIGNATURE</div>
                <div className="sign-sig-cols" style={{display:"flex",borderBottom:"1px solid #eee"}}>
                  {/* Left side (ONNA) - read only */}
                  <div className="sign-sig-left" style={{flex:1,padding:"12px",borderRight:"1px solid #eee"}}>
                    <div style={{fontFamily:CT_FONT,fontSize:9,fontWeight:700,letterSpacing:CT_LS,marginBottom:12}}>{ctDef.sigLeft}</div>
                    <div style={{marginBottom:8}}>
                      <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,display:"block",marginBottom:4}}>Signature:</span>
                      <div style={{height:60,border:"1px solid #ddd",borderRadius:2,background:"#fafafa",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {(snap.signatures||{}).left || (snap.signatures||{})[`${ctType}_left`] ? <img src={(snap.signatures||{}).left || (snap.signatures||{})[`${ctType}_left`]} alt="" style={{maxHeight:56,maxWidth:"100%"}}/> : <span style={{fontSize:9,color:"#bbb"}}>—</span>}
                      </div>
                    </div>
                    {["name","date"].map(f=>(
                      <div key={f} style={{display:"flex",gap:8,marginBottom:8,alignItems:"baseline",flexWrap:"wrap"}}>
                        <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,minWidth:70}}>{f==="name"?"Print Name:":"Date:"}</span>
                        <span style={{fontFamily:CT_FONT,fontSize:10,letterSpacing:CT_LS}}>{(snap.sigNames||{})[`left_${f}`] || (snap.sigNames||{})[`${ctType}_left_${f}`]||"—"}</span>
                      </div>
                    ))}
                  </div>
                  {/* Right side (Vendor) */}
                  <div style={{flex:1,padding:"12px"}}>
                    <div style={{fontFamily:CT_FONT,fontSize:9,fontWeight:700,letterSpacing:CT_LS,marginBottom:12}}>{ctDef.sigRight}</div>
                    <div style={{marginBottom:8}}>
                      <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,display:"block",marginBottom:4}}>Signature:</span>
                      {readOnlySig ? (
                        <div style={{height:80,border:"1px solid #ddd",borderRadius:2,background:"#fafafa",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {printVendorSig ? <img src={printVendorSig} alt="" style={{maxHeight:76,maxWidth:"100%"}}/> : <span style={{fontSize:9,color:"#bbb"}}>—</span>}
                        </div>
                      ) : <SignaturePad value={signVendorSig} onChange={setSignVendorSig} height={80}/>}
                    </div>
                    {readOnlySig ? (<>
                      <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"baseline",flexWrap:"wrap"}}>
                        <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,minWidth:70}}>Print Name:</span>
                        <span style={{fontFamily:CT_FONT,fontSize:10,letterSpacing:CT_LS}}>{printVendorName || "—"}</span>
                      </div>
                      <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"baseline",flexWrap:"wrap"}}>
                        <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,minWidth:70}}>Date:</span>
                        <span style={{fontFamily:CT_FONT,fontSize:10,letterSpacing:CT_LS}}>{printVendorDate || "—"}</span>
                      </div>
                    </>) : (<>
                      <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"baseline",flexWrap:"wrap"}}>
                        <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,minWidth:70}}>Print Name:</span>
                        <input value={signVendorName} onChange={e=>setSignVendorName(e.target.value)} placeholder="Print name..." style={{flex:1,minWidth:120,fontFamily:CT_FONT,fontSize:12,border:"none",borderBottom:"1px solid #ccc",outline:"none",padding:"4px 4px",background:"transparent"}}/>
                      </div>
                      <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"baseline",flexWrap:"wrap"}}>
                        <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,minWidth:70}}>Date:</span>
                        <input value={signVendorDate} onChange={e=>setSignVendorDate(e.target.value)} placeholder="Date..." style={{flex:1,minWidth:120,fontFamily:CT_FONT,fontSize:12,border:"none",borderBottom:"1px solid #ccc",outline:"none",padding:"4px 4px",background:"transparent"}}/>
                      </div>
                    </>)}
                  </div>
                </div>
              </div>

              {!_printMode && !isSignedOrSubmitted && <div style={{textAlign:"center",marginTop:24,paddingBottom:8}}>
                {(() => { const canSubmit = !!(signVendorSig && signVendorName.trim() && signVendorDate.trim()); return <button onClick={submitVendorSig} disabled={signSubmitting || !canSubmit} style={{padding:"12px 36px",borderRadius:10,background:canSubmit?"#1a5a30":"#999",color:"#fff",border:"none",fontSize:14,fontWeight:600,cursor:canSubmit?"pointer":"not-allowed",fontFamily:"inherit",opacity:signSubmitting?0.6:1,width:isMobile?"100%":"auto",transition:"background 0.2s"}}>{signSubmitting?"Submitting…":"Submit Signature"}</button>; })()}
              </div>}
              {_printMode && <div className="no-print" style={{textAlign:"center",marginTop:24,paddingBottom:8}}>
                <button onClick={()=>{
                  const el=document.getElementById("onna-sign-print");if(!el)return;
                  const clone=el.cloneNode(true);clone.querySelectorAll("button").forEach(b=>b.remove());clone.querySelectorAll(".no-print").forEach(b=>b.remove());clone.querySelectorAll(".sign-success-banner").forEach(b=>b.remove());
                  clone.style.borderRadius="0";clone.style.boxShadow="none";
                  const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
                  const idoc=iframe.contentDocument;idoc.open();idoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>\u200B</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;}@media print{@page{margin:0;size:A4;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);idoc.close();
                  idoc.body.appendChild(idoc.adoptNode(clone));setTimeout(()=>{idoc.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(el=>el.remove());iframe.contentWindow.focus();iframe.contentWindow.print();setTimeout(()=>document.body.removeChild(iframe),1000);},300);
                }} style={{padding:"12px 36px",borderRadius:10,background:"#1a5a30",color:"#fff",border:"none",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Download as PDF</button>
              </div>}
            </div>
          ); })()}
      </div>
    </div>
  );
}
