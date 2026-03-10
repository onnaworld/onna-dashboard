import React, { useState, useRef } from "react";
import { estFmt, estNum, estRowTotal, estSectionTotal, estCalcTotals, defaultSections, PRINT_CLEANUP_CSS } from "../../utils/helpers";
import { EstHl, EstCell, EstSignaturePad, EST_F, EST_LS, EST_LS_HDR, EST_YELLOW, EST_SA_FIELDS, DEFAULT_TCS, ESTIMATE_INIT } from "../ui/DocHelpers";
import { CSLogoSlot } from "../ui/DocHelpers";

const EST_CURRENCIES = [
  { code: "AED", label: "AED — UAE Dirham", symbol: "AED", rates: { USD: 0.2723, GBP: 0.2155, EUR: 0.2510, SAR: 1.0210 } },
  { code: "USD", label: "USD — US Dollar", symbol: "USD", rates: { AED: 3.6725, GBP: 0.7916, EUR: 0.9218, SAR: 3.7500 } },
  { code: "GBP", label: "GBP — British Pound", symbol: "GBP", rates: { AED: 4.6391, USD: 1.2632, EUR: 1.1645, SAR: 4.7370 } },
  { code: "EUR", label: "EUR — Euro", symbol: "EUR", rates: { AED: 3.9841, USD: 1.0848, GBP: 0.8587, SAR: 4.0682 } },
  { code: "SAR", label: "SAR — Saudi Riyal", symbol: "SAR", rates: { AED: 0.9794, USD: 0.2667, GBP: 0.2111, EUR: 0.2458 } },
];
function EstimateView({ estData, onSet, exchangeRate = 0.27 }) {
  const [estTab, setEstTab] = useState("topsheet");
  const [showAll, setShowAll] = useState(false);
  const printRef = useRef(null);
  const [baseCurrency, setBaseCurrency] = useState(() => (estData.currency || "AED"));
  const [secondCurrency, setSecondCurrency] = useState(() => (estData.currency2 || "USD"));
  const baseCurr = EST_CURRENCIES.find(c => c.code === baseCurrency) || EST_CURRENCIES[0];
  const xRate = baseCurr.rates[secondCurrency] || exchangeRate;

  const ts = estData.ts || ESTIMATE_INIT.ts;
  const sections = estData.sections || defaultSections();
  const saFields = estData.saFields || (() => { const init = {}; EST_SA_FIELDS.forEach((f,i) => { init[i] = f.defaultValue; }); return init; })();
  const tcsText = estData.tcsText || DEFAULT_TCS;
  const saSigs = estData.saSigs || {};
  const prodLogo = estData.prodLogo || null;

  const tsSet = (k, v) => onSet(d => ({...d, ts: {...(d.ts||ESTIMATE_INIT.ts), [k]: v}}));
  const logoSet = (v) => onSet(d => ({...d, prodLogo: v}));
  const updateRow = (si,ri,field,val) => {
    onSet(d => {
      const secs = JSON.parse(JSON.stringify(d.sections || defaultSections()));
      secs[si].rows[ri][field] = val;
      return {...d, sections: secs};
    });
  };
  const addRow = (si) => {
    onSet(d => {
      const secs = JSON.parse(JSON.stringify(d.sections || defaultSections()));
      const sec = secs[si];
      const nextRef = sec.num + String.fromCharCode(65 + sec.rows.length);
      sec.rows.push({ref:nextRef,desc:"",notes:"",days:"0",qty:"0",rate:"0"});
      return {...d, sections: secs};
    });
  };
  const removeRow = (si, ri) => {
    onSet(d => {
      const secs = JSON.parse(JSON.stringify(d.sections || defaultSections()));
      if (secs[si].rows.length > 1) secs[si].rows.splice(ri, 1);
      return {...d, sections: secs};
    });
  };

  const { subtotal, feesTotal, grandTotal } = estCalcTotals(sections);

  const hdr = { fontFamily:EST_F,fontSize:9,fontWeight:700,letterSpacing:EST_LS,textTransform:"uppercase",padding:"4px 6px",background:"#f4f4f4",borderBottom:"1px solid #ddd" };
  const ETABS = [{id:"topsheet",label:"TOP SHEET"},{id:"estimates",label:"ESTIMATES"},{id:"services",label:"SERVICES AGREEMENT"},{id:"tcs",label:"T&Cs"}];

  const doPrint = () => { const el=printRef.current; if(!el)return; const clone=el.cloneNode(true);
    clone.querySelectorAll('[data-noprint]').forEach(n=>n.remove());
    clone.querySelectorAll('textarea').forEach(n=>n.remove());
    clone.querySelectorAll('button').forEach(n=>n.remove());
    clone.querySelectorAll('input[type=file]').forEach(n=>n.remove());
    const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
    const _d=iframe.contentDocument;_d.open();_d.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>\u200B</title><style>@import url("https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;700&display=swap");*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:"Avenir","Nunito Sans",sans-serif;font-size:10px;color:#1a1a1a;padding:20px 24px;}@media print{@page{margin:0;size:A4;}.page-break{page-break-before:always}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);_d.close();
    _d.body.appendChild(_d.adoptNode(clone));setTimeout(()=>{_d.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(el=>el.remove());iframe.contentWindow.focus();iframe.contentWindow.print();setTimeout(()=>document.body.removeChild(iframe),1000);},300); };
  const exportPDF = (all = false) => {
    if (all) { setShowAll(true); setTimeout(() => { doPrint(); setShowAll(false); }, 100); }
    else doPrint();
  };

  useEffect(() => {
    const handler = () => exportPDF(true);
    window.addEventListener('onna-export-estimate', handler);
    return () => window.removeEventListener('onna-export-estimate', handler);
  });

  return (
    <div style={{ maxWidth:900,margin:"0 auto",background:"#fff",fontFamily:EST_F,color:"#1a1a1a",minWidth:700 }}>
      <div style={{ display:"flex",borderBottom:"2px solid #000",overflowX:"auto" }}>
        {ETABS.map(t=><div key={t.id} onClick={()=>setEstTab(t.id)} style={{ fontFamily:EST_F,fontSize:9,fontWeight:estTab===t.id?700:400,letterSpacing:EST_LS,padding:"10px 16px",cursor:"pointer",whiteSpace:"nowrap",background:estTab===t.id?"#000":"#f5f5f5",color:estTab===t.id?"#fff":"#666",transition:"all .15s",textTransform:"uppercase",borderRight:"1px solid #ddd" }}>{t.label}</div>)}
        <div style={{ marginLeft:"auto",display:"flex" }}>
          <div onClick={()=>exportPDF(false)} style={{ fontFamily:EST_F,fontSize:9,fontWeight:700,letterSpacing:EST_LS,padding:"10px 16px",cursor:"pointer",whiteSpace:"nowrap",background:"#fff",color:"#000",textTransform:"uppercase",borderLeft:"1px solid #ddd" }}
            onMouseEnter={e=>{e.target.style.background="#000";e.target.style.color="#fff"}} onMouseLeave={e=>{e.target.style.background="#fff";e.target.style.color="#000"}}>EXPORT PAGE</div>
          <div onClick={()=>exportPDF(true)} style={{ fontFamily:EST_F,fontSize:9,fontWeight:700,letterSpacing:EST_LS,padding:"10px 16px",cursor:"pointer",whiteSpace:"nowrap",background:"#000",color:"#fff",textTransform:"uppercase",borderLeft:"1px solid #ddd" }}
            onMouseEnter={e=>{e.target.style.background="#333"}} onMouseLeave={e=>{e.target.style.background="#000"}}>EXPORT ALL</div>
        </div>
      </div>
      <div data-noprint style={{ display:"flex", gap:12, alignItems:"center", padding:"6px 16px", background:"#fafafa", borderBottom:"1px solid #eee" }}>
        <span style={{ fontFamily:EST_F, fontSize:8, fontWeight:700, letterSpacing:EST_LS, color:"#999", textTransform:"uppercase" }}>CURRENCY</span>
        <select value={baseCurrency} onChange={e => { setBaseCurrency(e.target.value); onSet(d => ({...d, currency: e.target.value})); }}
          style={{ fontFamily:EST_F, fontSize:9, letterSpacing:EST_LS, border:"1px solid #ddd", borderRadius:2, padding:"3px 6px", background:"#fff", cursor:"pointer", outline:"none" }}>
          {EST_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
        </select>
        <span style={{ fontFamily:EST_F, fontSize:8, color:"#ccc" }}>→</span>
        <select value={secondCurrency} onChange={e => { setSecondCurrency(e.target.value); onSet(d => ({...d, currency2: e.target.value})); }}
          style={{ fontFamily:EST_F, fontSize:9, letterSpacing:EST_LS, border:"1px solid #ddd", borderRadius:2, padding:"3px 6px", background:"#fff", cursor:"pointer", outline:"none" }}>
          {EST_CURRENCIES.filter(c => c.code !== baseCurrency).map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
        </select>
        <span style={{ fontFamily:EST_F, fontSize:8, color:"#999", letterSpacing:EST_LS }}>1 {baseCurrency} = {xRate.toFixed(4)} {secondCurrency}</span>
      </div>

      <div ref={printRef} id="onna-est-print" style={{ padding:"40px 40px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4 }}>
          <CSLogoSlot label="Production Logo" image={prodLogo} onUpload={logoSet} onRemove={()=>logoSet(null)} />
        </div>
        <div style={{ borderBottom:"2.5px solid #000",marginBottom:16 }} />

        {(estTab === "topsheet" || showAll) && <>
          <div style={{textAlign:"center",fontFamily:EST_F,fontSize:12,fontWeight:700,letterSpacing:EST_LS_HDR,textTransform:"uppercase",marginBottom:12}}>
            <EstCell value={ts.version} onChange={v=>tsSet("version",v)} style={{fontSize:12,fontWeight:700,letterSpacing:EST_LS_HDR,textAlign:"center"}} />
          </div>
          <div style={{marginBottom:10}}>
            {[["DATE:",ts.date,"date"],["CLIENT:",ts.client,"client"],["ATTENTION:",ts.attention,"attention"],["PROJECT:",ts.project,"project"],["PHOTOGRAPHER / DIRECTOR:",ts.photographer,"photographer"],["DELIVERABLES:",ts.deliverables,"deliverables"],["DEADLINES:",ts.deadlines,"deadlines"],["USAGE TERMS:",ts.usage,"usage"],["SHOOT DATE:",ts.shootDate,"shootDate"],["NUMBER OF SHOOT DAYS:",ts.shootDays,"shootDays"],["SHOOT HOURS:",ts.shootHours,"shootHours"],["SHOOT LOCATION:",ts.location,"location"],["PAYMENT TERMS:",ts.payment,"payment"]].map(([lbl,val,key])=>
              <div key={key} style={{display:"flex",gap:4,marginBottom:0,minHeight:20,alignItems:"baseline"}}>
                <span style={{fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS,minWidth:190,flexShrink:0}}>{lbl}</span>
                <EstCell value={val} onChange={v=>tsSet(key,v)} style={{letterSpacing:EST_LS}} />
              </div>
            )}
          </div>
          <div style={{borderTop:"2px solid #000",marginTop:8}}>
            <div style={{display:"flex",background:"#f4f4f4",borderBottom:"1px solid #ddd"}}>
              <div style={{flex:1,...hdr}}>CATEGORY</div>
              <div style={{width:100,...hdr,textAlign:"right"}}>TOTAL {baseCurrency}</div>
              <div style={{width:100,...hdr,textAlign:"right"}}>TOTAL {secondCurrency}</div>
            </div>
            {sections.map((sec)=>{const t=estSectionTotal(sec);return(
              <div key={sec.id} style={{display:"flex",borderBottom:"1px solid #f0f0f0"}}>
                <div style={{width:24,padding:"3px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS}}>{sec.num}</div>
                <div style={{flex:1,padding:"3px 6px",fontFamily:EST_F,fontSize:10,letterSpacing:EST_LS}}>{sec.title}</div>
                <div style={{width:100,padding:"3px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(t)}</div>
                <div style={{width:100,padding:"3px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(t*xRate)}</div>
              </div>
            );})}
            <div style={{display:"flex",borderTop:"2px solid #000"}}>
              <div style={{flex:1,padding:"4px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>SUB TOTAL</div>
              <div style={{width:100,padding:"4px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(subtotal)}</div>
              <div style={{width:100,padding:"4px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(subtotal*xRate)}</div>
            </div>
            <div style={{display:"flex",borderBottom:"1px solid #eee"}}>
              <div style={{flex:1,padding:"4px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>VAT (5%)</div>
              <div style={{width:100,padding:"4px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(grandTotal*0.05)}</div>
              <div style={{width:100}}></div>
            </div>
            <div style={{display:"flex",borderBottom:"2px solid #000"}}>
              <div style={{flex:1,padding:"4px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>GRAND TOTAL</div>
              <div style={{width:100,padding:"4px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(grandTotal + grandTotal*0.05)}</div>
              <div style={{width:100}}></div>
            </div>
          </div>
          {(() => {
            const pctMatch = (ts.payment || "").match(/(\d+)%/);
            const advPct = pctMatch ? parseInt(pctMatch[1]) : 75;
            const totalIncVat = grandTotal + grandTotal * 0.05;
            return (
              <div style={{display:"flex",alignItems:"baseline",gap:8,marginTop:8}}>
                <span style={{fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS}}>ADVANCE PAYMENT ({advPct}%)</span>
                <span style={{fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS}}>{baseCurrency} {estFmt(totalIncVat * (advPct / 100))}</span>
              </div>
            ); })()}
          <div style={{marginTop:12}}>
            <div style={{fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS,marginBottom:4}}>NOTES:</div>
            <EstCell value={ts.notes || ""} onChange={v=>tsSet("notes",v)} style={{fontSize:9,letterSpacing:EST_LS,lineHeight:1.6,color:"#666"}} />
          </div>
        </>}

        {(estTab === "estimates" || showAll) && <>{showAll && <div className="page-break" style={{borderTop:"3px solid #000",marginTop:32,paddingTop:16}} />}
          {sections.map((sec,si)=>{const secTot=estSectionTotal(sec);
            const isFeesSection = sec.isFees;
            const subtotalRow = isFeesSection ? (
              <div style={{borderTop:"2px solid #000",borderBottom:"2px solid #000",marginBottom:12,display:"flex",justifyContent:"flex-end"}}>
                <div style={{display:"flex",gap:0,padding:"6px 0"}}>
                  <div style={{fontFamily:EST_F,fontSize:10,fontWeight:700,padding:"0 8px",letterSpacing:EST_LS}}>SUBTOTAL</div>
                  <div style={{width:90,fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",padding:"0 6px",letterSpacing:EST_LS}}>{baseCurrency} {estFmt(subtotal)}</div>
                  <div style={{width:90,fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",padding:"0 6px",letterSpacing:EST_LS}}>USD {estFmt(subtotal*xRate)}</div>
                  <div style={{width:24}}></div>
                </div>
              </div>
            ) : null;
            const getRowDisplay = (row) => {
              let tot = estRowTotal(row);
              let autoCalc = false;
              if (isFeesSection && row.notes) {
                const pctMatch = row.notes.match(/(\d+(?:\.\d+)?)%/);
                if (pctMatch) { tot = subtotal * (parseFloat(pctMatch[1]) / 100); autoCalc = true; }
              }
              return { tot, autoCalc };
            };
            const feeSectionTotal = isFeesSection
              ? sec.rows.reduce((sum, row) => {
                  const pctMatch = (row.notes || "").match(/(\d+(?:\.\d+)?)%/);
                  if (pctMatch) return sum + subtotal * (parseFloat(pctMatch[1]) / 100);
                  return sum + estRowTotal(row);
                }, 0)
              : secTot;
            return(
            <div key={sec.id}>
              {subtotalRow}
              <div style={{marginBottom:12}}>
              <div style={{display:"flex",background:"#000",color:"#fff",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS,padding:"4px 0",textTransform:"uppercase",alignItems:"center"}}>
                <div style={{width:40,padding:"0 6px",flexShrink:0}}>{sec.num}</div>
                <div style={{flex:1,padding:"0 6px"}}>{sec.title}</div>
                <div style={{width:120,padding:"0 6px",fontSize:9,flexShrink:0}}>NOTES</div>
                <div style={{width:50,textAlign:"center",padding:"0 4px",flexShrink:0}}>DAYS</div>
                <div style={{width:40,textAlign:"center",padding:"0 4px",flexShrink:0}}>QTY</div>
                <div style={{width:90,textAlign:"right",padding:"0 4px",flexShrink:0}}>RATE</div>
                <div style={{width:90,textAlign:"right",padding:"0 4px",flexShrink:0}}>TOTAL {baseCurrency}</div>
                <div style={{width:90,textAlign:"right",padding:"0 4px",flexShrink:0}}>TOTAL {secondCurrency}</div>
                <div style={{width:24,flexShrink:0}}></div>
              </div>
              {sec.rows.map((row,ri)=>{const {tot,autoCalc}=getRowDisplay(row);return(
                <div key={ri} style={{display:"flex",borderBottom:"1px solid #f0f0f0",alignItems:"stretch"}}>
                  <div style={{width:40,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:9,color:"#999"}}>{row.ref}</div>
                  <div style={{flex:1,minWidth:0}}><EstCell value={row.desc} onChange={v=>updateRow(si,ri,"desc",v)} /></div>
                  <div style={{width:120,flexShrink:0}}><EstCell value={row.notes} onChange={v=>updateRow(si,ri,"notes",v)} style={{fontSize:9,color:"#666"}} /></div>
                  <div style={{width:50,flexShrink:0}}><EstCell value={row.days} onChange={v=>updateRow(si,ri,"days",v)} align="center" /></div>
                  <div style={{width:40,flexShrink:0}}><EstCell value={row.qty} onChange={v=>updateRow(si,ri,"qty",v)} align="center" /></div>
                  <div style={{width:90,flexShrink:0}}>{autoCalc
                    ? <div style={{padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",color:"#999",fontStyle:"italic",letterSpacing:EST_LS}}>auto</div>
                    : <EstCell value={row.rate} onChange={v=>updateRow(si,ri,"rate",v)} align="right" />}</div>
                  <div style={{width:90,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",color:tot>0?"#1a1a1a":"#ccc",letterSpacing:EST_LS}}>{estFmt(tot)}</div>
                  <div style={{width:90,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",color:tot>0?"#1a1a1a":"#ccc",letterSpacing:EST_LS}}>{estFmt(tot*xRate)}</div>
                  <div style={{width:24,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span onClick={()=>removeRow(si,ri)} style={{cursor:"pointer",fontSize:11,color:"#ccc"}} onMouseEnter={e=>{e.target.style.color="#f44"}} onMouseLeave={e=>{e.target.style.color="#ccc"}}>{"\u00d7"}</span></div>
                </div>);})}
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div onClick={()=>addRow(si)} style={{fontFamily:EST_F,fontSize:9,color:"#999",cursor:"pointer",letterSpacing:EST_LS,padding:"4px 6px"}}>+ Add Line</div>
                <div style={{display:"flex",gap:0}}>
                  <div style={{fontFamily:EST_F,fontSize:10,fontWeight:700,padding:"4px 8px",letterSpacing:EST_LS}}>TOTAL</div>
                  <div style={{width:90,fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",padding:"4px 6px",letterSpacing:EST_LS}}>{estFmt(feeSectionTotal)}</div>
                  <div style={{width:90,fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",padding:"4px 6px",letterSpacing:EST_LS}}>{estFmt(feeSectionTotal*xRate)}</div>
                  <div style={{width:24}}></div>
                </div>
              </div>
              </div>
            </div>);})}
          <div style={{borderTop:"2px solid #000",marginTop:8,display:"flex",justifyContent:"flex-end"}}>
            <div style={{width:300}}>
              <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS}}>
                <span>GRAND TOTAL</span><span>{baseCurrency} {estFmt(grandTotal)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS,borderTop:"1px solid #eee"}}>
                <span>VAT (5%)</span><span>{baseCurrency} {estFmt(grandTotal*0.05)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS,borderTop:"2px solid #000"}}>
                <span>TOTAL INC. VAT</span><span>{baseCurrency} {estFmt(grandTotal + grandTotal*0.05)}</span></div>
            </div>
          </div>
        </>}

        {(estTab === "services" || showAll) && <>{showAll && <div className="page-break" style={{borderTop:"3px solid #000",marginTop:32,paddingTop:16}} />}
          <div style={{textAlign:"center",fontFamily:EST_F,fontSize:12,fontWeight:700,letterSpacing:EST_LS_HDR,textTransform:"uppercase",marginBottom:20}}>PRODUCTION SERVICES AGREEMENT</div>
          {EST_SA_FIELDS.map((f,i)=>(
            <div key={i} style={{display:"flex",borderBottom:"1px solid #eee",minHeight:32}}>
              <div style={{width:220,minWidth:220,padding:"8px 12px",background:"#fafafa",borderRight:"1px solid #eee"}}>
                <span style={{fontFamily:EST_F,fontSize:10,fontWeight:500,letterSpacing:EST_LS}}>{f.label}</span></div>
              <div style={{flex:1,padding:"8px 12px"}}>
                <EstCell value={saFields[i]} onChange={v=>onSet(d=>({...d,saFields:{...(d.saFields||saFields),[i]:v}}))} /></div>
            </div>
          ))}
          <div style={{fontFamily:EST_F,fontSize:9,letterSpacing:EST_LS,lineHeight:1.6,color:"#666",marginTop:12,padding:"0 12px"}}>
            This Commercial Term Sheet and including the General Terms and Conditions (together the "Agreement") together constitute an agreement under which the Supplier agrees to provide the Commissioner with certain production services.
          </div>
          <div style={{background:"#000",color:"#fff",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS_HDR,textAlign:"center",padding:"4px 0",textTransform:"uppercase",marginTop:24}}>SIGNATURE</div>
          <div style={{display:"flex",borderBottom:"1px solid #eee"}}>
            {[{side:"left",label:"Signed by an authorised representative for and on behalf of ONNA"},
              {side:"right",label:"Signed by an authorised representative for and on behalf of [Client]"}].map(s=>(
              <div key={s.side} style={{flex:1,padding:12,borderRight:s.side==="left"?"1px solid #eee":"none"}}>
                <div style={{fontFamily:EST_F,fontSize:9,fontWeight:700,letterSpacing:EST_LS,marginBottom:12}}>{s.label}</div>
                <div style={{marginBottom:8}}>
                  <span style={{fontFamily:EST_F,fontSize:10,fontWeight:500,letterSpacing:EST_LS,display:"block",marginBottom:4}}>Signature:</span>
                  <EstSignaturePad value={saSigs[s.side+"_sig"]||""} onChange={v=>onSet(d=>({...d,saSigs:{...(d.saSigs||{}),[s.side+"_sig"]:v}}))} />
                </div>
                {["Print Name:","Date:"].map(lbl=>(
                  <div key={lbl} style={{display:"flex",gap:8,marginBottom:8,alignItems:"baseline"}}>
                    <span style={{fontFamily:EST_F,fontSize:10,fontWeight:500,letterSpacing:EST_LS,minWidth:80}}>{lbl}</span>
                    <div style={{flex:1,borderBottom:"1px solid #ccc",minHeight:20}}>
                      <EstCell value={saSigs[s.side+"_"+lbl]||""} onChange={v=>onSet(d=>({...d,saSigs:{...(d.saSigs||{}),[s.side+"_"+lbl]:v}}))} /></div>
                  </div>))}
              </div>))}
          </div>
        </>}

        {(estTab === "tcs" || showAll) && <>{showAll && <div className="page-break" style={{borderTop:"3px solid #000",marginTop:32,paddingTop:16}} />}
          <div style={{marginTop:8}}>
            {(() => {
              const headings = ["GENERAL TERMS & CONDITIONS","PAYMENTS & INVOICES","PRODUCTION COSTS & OVERAGES","INDEMNITY","TALENT","LICENSE","CANCELLATION & POSTPONMENT","MISCELLANEOUS","INSURANCE","CREDIT","GOVERNING LAW"];
              const lines = tcsText.split("\n");
              return lines.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} style={{height:4}} />;
                const isMainTitle = trimmed === "GENERAL TERMS & CONDITIONS";
                const isHeading = headings.some(h => trimmed.startsWith(h));
                if (isMainTitle) return <div key={i} style={{fontFamily:EST_F,fontSize:12,fontWeight:700,letterSpacing:EST_LS_HDR,textTransform:"uppercase",marginBottom:8,textAlign:"center"}}>{trimmed}</div>;
                if (isHeading) return <div key={i} style={{fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS,textTransform:"uppercase",marginTop:10,marginBottom:2}}>{trimmed}</div>;
                return <div key={i} style={{fontFamily:EST_F,fontSize:10,letterSpacing:EST_LS,lineHeight:1.5,marginBottom:1}}>{trimmed}</div>;
              }); })()}
          </div>
          <div data-noprint="1" style={{marginTop:12,padding:"8px 0",borderTop:"1px solid #eee"}}>
            <div style={{fontFamily:EST_F,fontSize:9,color:"#999",letterSpacing:EST_LS,marginBottom:4}}>Edit Terms & Conditions:</div>
            <textarea value={tcsText} onChange={e=>onSet(d=>({...d,tcsText:e.target.value}))}
              style={{width:"100%",boxSizing:"border-box",fontFamily:EST_F,fontSize:10,letterSpacing:EST_LS,lineHeight:1.5,color:"#1a1a1a",border:"1px solid #eee",padding:12,minHeight:200,resize:"vertical",outline:"none",background:"#fff",whiteSpace:"pre-wrap"}}
              onFocus={e=>{e.target.style.borderColor="#E0D9A8";e.target.style.background="#FFFDE7"}}
              onBlur={e=>{e.target.style.borderColor="#eee";e.target.style.background="#fff"}} />
          </div>
        </>}

        <div style={{marginTop:40,display:"flex",justifyContent:"space-between",fontFamily:EST_F,fontSize:9,letterSpacing:EST_LS,color:"#000",borderTop:"2px solid #000",paddingTop:12}}>
          <div><div style={{fontWeight:700}}>@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div>
          <div style={{textAlign:"right"}}><div style={{fontWeight:700}}>WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div>
        </div>
      </div>
    </div>
  );
}

// ─── AgentDocPreview — live editable document preview for split-pane ────────

export default EstimateView;
