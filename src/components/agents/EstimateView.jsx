import React, { useState, useRef, useEffect } from "react";
import { estFmt, estNum, estRowTotal, estSectionTotal, estCalcTotals, isFeeSec, defaultSections, PRINT_CLEANUP_CSS } from "../../utils/helpers";
import { EstHl, EstCell, EstSignaturePad, EST_F, EST_LS, EST_LS_HDR, EST_YELLOW, EST_SA_FIELDS, DEFAULT_TCS, ESTIMATE_INIT } from "../ui/DocHelpers";
import { CSLogoSlot } from "../ui/DocHelpers";

const EST_CURRENCIES = [
  { code: "AED", label: "AED — UAE Dirham", symbol: "AED", rates: { USD: 0.2722, GBP: 0.2043, EUR: 0.2300, SAR: 1.0206 } },
  { code: "USD", label: "USD — US Dollar", symbol: "USD", rates: { AED: 3.6725, GBP: 0.7505, EUR: 0.8452, SAR: 3.7500 } },
  { code: "GBP", label: "GBP — British Pound", symbol: "GBP", rates: { AED: 4.8940, USD: 1.3325, EUR: 1.1262, SAR: 4.9975 } },
  { code: "EUR", label: "EUR — Euro", symbol: "EUR", rates: { AED: 4.3478, USD: 1.1832, GBP: 0.8879, SAR: 4.4398 } },
  { code: "SAR", label: "SAR — Saudi Riyal", symbol: "SAR", rates: { AED: 0.9798, USD: 0.2667, GBP: 0.2001, EUR: 0.2252 } },
];
function EstimateView({ estData, onSet: _rawOnSet, exchangeRate = 0.27, pendingReview, onAcceptMarker, onDeclineMarker, projectName }) {
  const [estTab, setEstTab] = useState("topsheet");
  const [showAll, setShowAll] = useState(false);
  // Responsive: measure container width
  const _containerRef = useRef(null);
  const [_cw, _setCw] = useState(900);
  useEffect(() => {
    const el = _containerRef.current; if (!el) return;
    const ro = new ResizeObserver(entries => { for (const e of entries) _setCw(e.contentRect.width); });
    ro.observe(el); _setCw(el.offsetWidth);
    return () => ro.disconnect();
  }, []);
  const _narrow = _cw < 600;
  const printRef = useRef(null);
  const [baseCurrency, setBaseCurrency] = useState(() => (estData.currency || "AED"));
  const [secondCurrency, setSecondCurrency] = useState(() => (estData.currency2 || "USD"));
  const baseCurr = EST_CURRENCIES.find(c => c.code === baseCurrency) || EST_CURRENCIES[0];
  const customRateKey = `${baseCurrency}_${secondCurrency}`;
  const xRate = (estData.customRates && estData.customRates[customRateKey] != null) ? estData.customRates[customRateKey] : (baseCurr.rates[secondCurrency] || exchangeRate);
  const [rateInput, setRateInput] = useState(xRate.toFixed(4));
  const [rateEditing, setRateEditing] = useState(false);
  useEffect(() => { if (!rateEditing) setRateInput(xRate.toFixed(4)); }, [xRate, rateEditing]);

  // ── Undo / Redo stack (⌘Z / ⌘⇧Z) ──
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const estDataRef = useRef(estData);
  estDataRef.current = estData;
  const onSet = (updater) => {
    undoStack.current.push(JSON.parse(JSON.stringify(estDataRef.current)));
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = []; // new change clears redo
    _rawOnSet(updater);
  };
  const undo = () => {
    if (undoStack.current.length === 0) return false;
    redoStack.current.push(JSON.parse(JSON.stringify(estDataRef.current)));
    const prev = undoStack.current.pop();
    _rawOnSet(() => prev);
    return true;
  };
  const redo = () => {
    if (redoStack.current.length === 0) return false;
    undoStack.current.push(JSON.parse(JSON.stringify(estDataRef.current)));
    const next = redoStack.current.pop();
    _rawOnSet(() => next);
    return true;
  };
  useEffect(() => {
    const handler = (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'z') return;
      // Always consume ⌘Z/⌘⇧Z when an estimate is open — prevents global/agent undo from wiping the whole estimate
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, []);

  const ts = estData.ts || ESTIMATE_INIT.ts;
  const sections = estData.sections || defaultSections();
  const saFields = estData.saFields || (() => { const init = {}; EST_SA_FIELDS.forEach((f,i) => { init[i] = f.defaultValue; }); return init; })();
  const tcsText = estData.tcsText || DEFAULT_TCS;
  const saSigs = estData.saSigs || {};
  const prodLogo = estData.prodLogo || null;
  const vatPct = estData.vatPct !== undefined ? estData.vatPct : 5;
  const vatRate = vatPct / 100;

  // ── Tally scratchpad ──
  const [tallyItems, setTallyItems] = useState([]);
  const toggleTally = (si, ri, tot) => {
    const key = `${si}-${ri}`;
    setTallyItems(prev => {
      if (prev.find(t => t.key === key)) return prev.filter(t => t.key !== key);
      const sec = sections[si]; const row = sec?.rows[ri]; if (!row) return prev;
      return [...prev, { key, ref: row.ref, desc: row.desc, amount: tot }];
    });
  };
  const toggleTallySection = (si, secTotal) => {
    const key = `sec-${si}`;
    setTallyItems(prev => {
      if (prev.find(t => t.key === key)) return prev.filter(t => t.key !== key);
      const sec = sections[si]; if (!sec) return prev;
      return [...prev, { key, ref: sec.num, desc: sec.title, amount: secTotal, isSection: true }];
    });
  };
  const isTallied = (si, ri) => tallyItems.some(t => t.key === `${si}-${ri}`);
  const isSectionTallied = (si) => tallyItems.some(t => t.key === `sec-${si}`);
  const tallyTotal = Math.round(tallyItems.reduce((s, t) => s + t.amount, 0) * 100) / 100;

  const _bprMarkers = pendingReview ? new Set(pendingReview.markers) : null;
  const _hasBM = (m) => _bprMarkers && _bprMarkers.has(m);
  const _bRevBtn = (type) => ({width:16,height:16,borderRadius:3,border:"none",background:type==="accept"?"#4caf50":"#ef5350",color:"#fff",fontSize:9,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:2,lineHeight:1,verticalAlign:"middle"});
  const _bHL = {borderLeft:"3px solid #4caf50",paddingLeft:4,marginLeft:-7};

  const tsSet = (k, v) => onSet(d => ({...d, ts: {...(d.ts||ESTIMATE_INIT.ts), [k]: v}}));
  const logoSet = (v) => onSet(d => ({...d, prodLogo: v}));
  const reRefRows = (sec) => { sec.rows.forEach((r, i) => { r.ref = sec.num + String.fromCharCode(65 + i); }); };
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
      if (secs[si].rows.length > 1) { secs[si].rows.splice(ri, 1); reRefRows(secs[si]); }
      return {...d, sections: secs};
    });
  };

  const EST_STATUSES = ["", "Pending", "Confirmed", "Paid"];
  const EST_ST_BG = { "": "transparent", Pending: "#fff8e8", Confirmed: "#e8f4fd", Paid: "#edfaf3" };
  const EST_ST_COLOR = { "": "#ccc", Pending: "#92680a", Confirmed: "#0066cc", Paid: "#147d50" };
  const EST_ST_DOT = { "": "#ddd", Pending: "#d4a800", Confirmed: "#3399ff", Paid: "#2e7d32" };
  const cycleRowStatus = (si, ri) => {
    onSet(d => {
      const secs = JSON.parse(JSON.stringify(d.sections || defaultSections()));
      const row = secs[si].rows[ri];
      const cur = row.rowStatus || "";
      row.rowStatus = EST_STATUSES[(EST_STATUSES.indexOf(cur) + 1) % EST_STATUSES.length];
      return {...d, sections: secs};
    });
  };

  // ── Drag & reorder state ──
  const dragRef = useRef(null);
  const [dropIndicator, setDropIndicator] = useState(null); // {type:"row"|"section", si, ri?}

  const reorderRows = (si, fromRi, toRi) => {
    if (fromRi === toRi) return;
    onSet(d => {
      const secs = JSON.parse(JSON.stringify(d.sections || defaultSections()));
      const [moved] = secs[si].rows.splice(fromRi, 1);
      secs[si].rows.splice(toRi > fromRi ? toRi - 1 : toRi, 0, moved);
      reRefRows(secs[si]);
      return { ...d, sections: secs };
    });
  };

  const moveRowToSection = (fromSi, fromRi, toSi, toRi) => {
    onSet(d => {
      const secs = JSON.parse(JSON.stringify(d.sections || defaultSections()));
      const [moved] = secs[fromSi].rows.splice(fromRi, 1);
      secs[toSi].rows.splice(toRi, 0, moved);
      reRefRows(secs[fromSi]);
      reRefRows(secs[toSi]);
      return { ...d, sections: secs };
    });
  };

  const reorderSections = (fromSi, toSi) => {
    if (fromSi === toSi) return;
    onSet(d => {
      const secs = JSON.parse(JSON.stringify(d.sections || defaultSections()));
      const [moved] = secs.splice(fromSi, 1);
      secs.splice(toSi > fromSi ? toSi - 1 : toSi, 0, moved);
      return { ...d, sections: secs };
    });
  };

  const { subtotal, feesTotal, grandTotal } = estCalcTotals(sections);

  const hdr = { fontFamily:EST_F,fontSize:9,fontWeight:700,letterSpacing:EST_LS,textTransform:"uppercase",padding:"4px 6px",background:"#f4f4f4",borderBottom:"1px solid #ddd" };
  const ETABS = [{id:"topsheet",label:"TOP SHEET"},{id:"estimates",label:"ESTIMATES"},{id:"services",label:"SERVICES AGREEMENT"},{id:"tcs",label:"T&Cs"}];

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportPages, setExportPages] = useState(["topsheet","estimates","services","tcs"]);
  const toggleExportPage = (id) => setExportPages(prev => prev.includes(id) ? prev.filter(p=>p!==id) : [...prev,id]);
  const doPrint = (pages) => {
    // pages = array of page ids to include, e.g. ["topsheet","estimates","services","tcs"]
    setShowAll(true);
    setTimeout(() => {
      const el=printRef.current; if(!el){setShowAll(false);return;}
      const clone=el.cloneNode(true);
      clone.querySelectorAll('[data-noprint]').forEach(n=>n.remove());
      clone.querySelectorAll('textarea').forEach(n=>n.remove());
      clone.querySelectorAll('button').forEach(n=>n.remove());
      clone.querySelectorAll('input[type=file]').forEach(n=>n.remove());
      clone.querySelectorAll('input').forEach(inp=>{const sp=document.createElement('span');sp.textContent=inp.value||"";sp.style.cssText=inp.style.cssText;sp.style.border="none";sp.style.outline="none";sp.style.background="transparent";inp.parentNode.replaceChild(sp,inp);});
      clone.querySelectorAll('select').forEach(sel=>{const sp=document.createElement('span');sp.textContent=sel.options[sel.selectedIndex]?.text||sel.value||"";sp.style.cssText=sel.style.cssText;sel.parentNode.replaceChild(sp,sel);});
      // Remove pages not selected
      if (pages) {
        clone.querySelectorAll('[data-page]').forEach(pg => {
          if (!pages.includes(pg.getAttribute('data-page'))) pg.remove();
        });
      }
      const vLabel=(ts.version||"V1").replace(/\s*production\s*estimate/i,"").trim();
      const docTitle=`${vLabel} Production Estimate${projectName?" | "+projectName:""}`;
      clone.style.padding="10mm 12mm";clone.style.maxWidth="none";clone.style.width="100%";clone.style.minWidth="0";clone.style.boxSizing="border-box";
      const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
      const _d=iframe.contentDocument;_d.open();_d.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${docTitle}</title><style>@import url("https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;700&display=swap");*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:"Avenir","Nunito Sans",sans-serif;font-size:10px;color:#1a1a1a;margin:0;padding:0;}[data-page]+[data-page]{break-before:page;}@media print{@page{size:A4;margin:0;}[data-page]+[data-page]{break-before:page;}*{overflow:visible!important;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);_d.close();_d.body.appendChild(_d.adoptNode(clone));const prevTitle=document.title;document.title=docTitle;const restoreTitle=()=>{document.title=prevTitle;document.body.removeChild(iframe);window.removeEventListener("afterprint",restoreTitle);};window.addEventListener("afterprint",restoreTitle);setTimeout(()=>{_d.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(el=>el.remove());iframe.contentWindow.focus();iframe.contentWindow.print();},300);
      setShowAll(false);
    }, 150);
  };

  useEffect(() => {
    const handler = () => doPrint(null);
    window.addEventListener('onna-export-estimate', handler);
    return () => window.removeEventListener('onna-export-estimate', handler);
  });

  return (
    <div ref={_containerRef} style={{ maxWidth:900,margin:"0 auto",background:"#fff",fontFamily:EST_F,color:"#1a1a1a" }}>
      <div style={{ display:"flex",borderBottom:"2px solid #000",flexWrap:_narrow?"wrap":"nowrap" }}>
        {ETABS.map(t=><div key={t.id} onClick={()=>setEstTab(t.id)} style={{ fontFamily:EST_F,fontSize:_narrow?8:9,fontWeight:estTab===t.id?700:400,letterSpacing:EST_LS,padding:_narrow?"7px 8px":"10px 16px",cursor:"pointer",whiteSpace:"nowrap",background:estTab===t.id?"#000":"#f5f5f5",color:estTab===t.id?"#fff":"#666",transition:"all .15s",textTransform:"uppercase",borderRight:"1px solid #ddd" }}>{_narrow&&t.id==="services"?"SERVICES":t.label}</div>)}
        <div style={{ marginLeft:"auto",display:"flex",position:"relative" }}>
          <div onClick={()=>setShowExportMenu(v=>!v)} style={{ fontFamily:EST_F,fontSize:_narrow?8:9,fontWeight:700,letterSpacing:EST_LS,padding:_narrow?"7px 8px":"10px 16px",cursor:"pointer",whiteSpace:"nowrap",background:showExportMenu?"#333":"#000",color:"#fff",textTransform:"uppercase",borderLeft:"1px solid #ddd",userSelect:"none" }}
            onMouseEnter={e=>{e.target.style.background="#333"}} onMouseLeave={e=>{if(!showExportMenu)e.target.style.background="#000"}}>EXPORT ▾</div>
          {showExportMenu && <>
            <div onClick={()=>setShowExportMenu(false)} style={{position:"fixed",inset:0,zIndex:999}} />
            <div style={{position:"absolute",top:"100%",right:0,background:"#fff",border:"1px solid #ddd",boxShadow:"0 4px 16px rgba(0,0,0,0.12)",zIndex:1000,minWidth:190,borderRadius:4,overflow:"hidden",marginTop:2}}>
              {[{id:"topsheet",label:"Top Sheet"},{id:"estimates",label:"Estimates"},{id:"services",label:"Services Agreement"},{id:"tcs",label:"T&Cs"}].map(opt=>(
                <div key={opt.id} onClick={()=>toggleExportPage(opt.id)}
                  style={{fontFamily:EST_F,fontSize:9,letterSpacing:EST_LS,padding:"7px 12px",cursor:"pointer",borderBottom:"1px solid #f0f0f0",textTransform:"uppercase",color:"#333",display:"flex",alignItems:"center",gap:8}}
                  onMouseEnter={e=>{e.currentTarget.style.background="#f5f5f5"}} onMouseLeave={e=>{e.currentTarget.style.background="#fff"}}>
                  <span style={{width:14,height:14,border:"1.5px solid #999",borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:exportPages.includes(opt.id)?"#000":"#fff",color:"#fff",fontSize:10,lineHeight:1}}>{exportPages.includes(opt.id)?"✓":""}</span>
                  {opt.label}
                </div>
              ))}
              <div onClick={()=>{if(exportPages.length>0){setShowExportMenu(false);doPrint(exportPages);}}}
                style={{fontFamily:EST_F,fontSize:9,fontWeight:700,letterSpacing:EST_LS,padding:"8px 12px",cursor:exportPages.length>0?"pointer":"default",textTransform:"uppercase",color:"#fff",background:exportPages.length>0?"#000":"#ccc",textAlign:"center"}}
                onMouseEnter={e=>{if(exportPages.length>0)e.target.style.background="#333"}} onMouseLeave={e=>{if(exportPages.length>0)e.target.style.background="#000"}}>EXPORT {exportPages.length === 4 ? "ALL" : `(${exportPages.length})`}</div>
            </div>
          </>}
        </div>
      </div>
      <div data-noprint style={{ display:"flex", gap:_narrow?6:12, alignItems:"center", padding:_narrow?"6px 10px":"6px 16px", background:"#fafafa", borderBottom:"1px solid #eee" }}>
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
        <span style={{ fontFamily:EST_F, fontSize:8, color:"#999", letterSpacing:EST_LS }}>1 {baseCurrency} =</span>
        <input
          type="text"
          value={rateEditing ? rateInput : xRate.toFixed(4)}
          onFocus={() => { setRateEditing(true); setRateInput(xRate.toFixed(4)); }}
          onChange={e => setRateInput(e.target.value)}
          onBlur={() => {
            setRateEditing(false);
            const v = parseFloat(rateInput);
            if (!isNaN(v) && v > 0) {
              onSet(d => ({ ...d, customRates: { ...(d.customRates || {}), [customRateKey]: v } }));
            }
          }}
          onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
          style={{ fontFamily:EST_F, fontSize:9, letterSpacing:EST_LS, width:52, border:"1px solid #ddd", borderRadius:2, padding:"2px 4px", background:"#fff", textAlign:"center", outline:"none", color:"#333" }}
        />
        <span style={{ fontFamily:EST_F, fontSize:8, color:"#999", letterSpacing:EST_LS }}>{secondCurrency}</span>
      </div>

      <div ref={printRef} id="onna-est-print" style={{ padding:_narrow?"20px 16px":"40px 40px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4 }}>
          <CSLogoSlot label="Production Logo" image={prodLogo} onUpload={logoSet} onRemove={()=>logoSet(null)} />
        </div>
        <div style={{ borderBottom:"2.5px solid #000",marginBottom:16 }} />

        {(estTab === "topsheet" || showAll) && <div data-page="topsheet">
          <div style={{textAlign:"center",fontFamily:EST_F,fontSize:12,fontWeight:700,letterSpacing:EST_LS_HDR,textTransform:"uppercase",marginBottom:12}}>
            <EstCell value={ts.version} onChange={v=>tsSet("version",v)} style={{fontSize:12,fontWeight:700,letterSpacing:EST_LS_HDR,textAlign:"center"}} />
          </div>
          <div style={{textAlign:"right",fontFamily:EST_F,fontSize:8,letterSpacing:EST_LS,color:"#999",marginBottom:8}}>1 {baseCurrency} = {xRate.toFixed(4)} {secondCurrency}</div>
          <div style={{marginBottom:10}}>
            {[["DATE:",ts.date,"date"],["CLIENT:",ts.client,"client"],["ATTENTION:",ts.attention,"attention"],["PROJECT:",ts.project,"project"],["PHOTOGRAPHER / DIRECTOR:",ts.photographer,"photographer"],["DELIVERABLES:",ts.deliverables,"deliverables"],["DEADLINES:",ts.deadlines,"deadlines"],["USAGE TERMS:",ts.usage,"usage"],["SHOOT DATE:",ts.shootDate,"shootDate"],["NUMBER OF SHOOT DAYS:",ts.shootDays,"shootDays"],["SHOOT HOURS:",ts.shootHours,"shootHours"],["SHOOT LOCATION:",ts.location,"location"],["PAYMENT TERMS:",ts.payment,"payment"]].map(([lbl,val,key])=>{
              const _tsm = "est:ts:"+key; const _tsHas = _hasBM(_tsm);
              return(
              <div key={key} style={{display:"flex",gap:4,marginBottom:0,minHeight:20,alignItems:"baseline",position:"relative",...(_tsHas?{background:"#E8F5E9"}:{})}}>
                {_tsHas&&<span style={{position:"absolute",left:-28,top:2,display:"flex",gap:1}}><button onClick={()=>onAcceptMarker&&onAcceptMarker(_tsm)} style={_bRevBtn("accept")}>{"✓"}</button><button onClick={()=>onDeclineMarker&&onDeclineMarker(_tsm)} style={_bRevBtn("decline")}>{"✕"}</button></span>}
                <span style={{fontFamily:EST_F,fontSize:_narrow?9:10,fontWeight:700,letterSpacing:EST_LS,minWidth:_narrow?120:190,flexShrink:0}}>{lbl}</span>
                <EstCell value={val} onChange={v=>tsSet(key,v)} style={{letterSpacing:EST_LS}} />
              </div>);
            })}
          </div>
          <div style={{borderTop:"2px solid #000",marginTop:8}}>
            <div style={{display:"flex",background:"#f4f4f4",borderBottom:"1px solid #ddd"}}>
              <div style={{flex:1,...hdr}}>CATEGORY</div>
              <div style={{width:_narrow?70:100,...hdr,textAlign:"right"}}>{baseCurrency}</div>
              <div style={{width:_narrow?70:100,...hdr,textAlign:"right"}}>{secondCurrency}</div>
            </div>
            {sections.map((sec)=>{
              const isF = isFeeSec(sec);
              const t = isF ? sec.rows.reduce((sum, row) => {
                const pctMatch = (row.notes || "").match(/(\d+(?:\.\d+)?)%/);
                if (pctMatch) return sum + subtotal * (parseFloat(pctMatch[1]) / 100);
                return sum + estRowTotal(row);
              }, 0) : estSectionTotal(sec);
              return(
              <div key={sec.id} style={{display:"flex",borderBottom:"1px solid #f0f0f0"}}>
                <div style={{width:24,padding:"3px 6px",fontFamily:EST_F,fontSize:_narrow?9:10,fontWeight:700,letterSpacing:EST_LS}}>{sec.num}</div>
                <div style={{flex:1,padding:"3px 6px",fontFamily:EST_F,fontSize:_narrow?9:10,letterSpacing:EST_LS,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sec.title}</div>
                <div style={{width:_narrow?70:100,padding:"3px 6px",fontFamily:EST_F,fontSize:_narrow?9:10,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(t)}</div>
                <div style={{width:_narrow?70:100,padding:"3px 6px",fontFamily:EST_F,fontSize:_narrow?9:10,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(t*xRate)}</div>
              </div>);
            })}
            <div style={{display:"flex",borderTop:"2px solid #000"}}>
              <div style={{flex:1,padding:"4px 6px",fontFamily:EST_F,fontSize:_narrow?9:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>SUB TOTAL</div>
              <div style={{width:_narrow?70:100,padding:"4px 6px",fontFamily:EST_F,fontSize:_narrow?9:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(grandTotal)}</div>
              <div style={{width:_narrow?70:100,padding:"4px 6px",fontFamily:EST_F,fontSize:_narrow?9:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(grandTotal*xRate)}</div>
            </div>
            <div style={{display:"flex",borderBottom:"1px solid #eee",alignItems:"center"}}>
              <div style={{flex:1,padding:"4px 6px",fontFamily:EST_F,fontSize:_narrow?9:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS,display:"flex",alignItems:"center",justifyContent:"flex-end",gap:2}}>VAT (<input data-noprint value={vatPct} onChange={e=>{const v=parseFloat(e.target.value);onSet(d=>({...d,vatPct:isNaN(v)?0:v}));}} style={{width:28,fontFamily:EST_F,fontSize:_narrow?9:10,fontWeight:700,letterSpacing:EST_LS,border:"none",borderBottom:"1px solid #ccc",textAlign:"center",padding:0,outline:"none",background:"transparent"}} /><span data-noprint style={{display:"none"}}></span>%)</div>
              <div style={{width:_narrow?70:100,padding:"4px 6px",fontFamily:EST_F,fontSize:_narrow?9:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(grandTotal*vatRate)}</div>
              <div style={{width:_narrow?70:100}}></div>
            </div>
            <div style={{display:"flex",borderBottom:"2px solid #000"}}>
              <div style={{flex:1,padding:"4px 6px",fontFamily:EST_F,fontSize:_narrow?9:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>GRAND TOTAL</div>
              <div style={{width:_narrow?70:100,padding:"4px 6px",fontFamily:EST_F,fontSize:_narrow?9:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(grandTotal + grandTotal*vatRate)}</div>
              <div style={{width:_narrow?70:100,padding:"4px 6px",fontFamily:EST_F,fontSize:_narrow?9:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>{estFmt((grandTotal + grandTotal*vatRate)*xRate)}</div>
            </div>
          </div>
          {(() => {
            const pctMatch = (ts.payment || "").match(/(\d+)%/);
            const advPct = pctMatch ? parseInt(pctMatch[1]) : 75;
            const totalIncVat = grandTotal + grandTotal * vatRate;
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
        </div>}

        {(estTab === "estimates" || showAll) && <div data-page="estimates">
          {sections.map((sec,si)=>{const secTot=estSectionTotal(sec);
            const isFeesSection = isFeeSec(sec);
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
              <div style={{marginBottom:12}}>
              <div
                draggable={!isFeeSec(sec)}
                onDragStart={e => { if (isFeeSec(sec)) { e.preventDefault(); return; } dragRef.current = { type: "section", si }; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", `section:${si}`); e.currentTarget.style.opacity = "0.4"; }}
                onDragEnd={e => { e.currentTarget.style.opacity = "1"; dragRef.current = null; setDropIndicator(null); }}
                onDragOver={e => { e.preventDefault(); const src = dragRef.current; if (!src || src.type !== "section") return; if (src.si !== si && !isFeeSec(sec)) setDropIndicator({ type: "section", si }); }}
                onDragLeave={() => { if (dropIndicator?.type === "section" && dropIndicator.si === si) setDropIndicator(null); }}
                onDrop={e => { e.preventDefault(); setDropIndicator(null); const src = dragRef.current; if (!src || src.type !== "section" || isFeeSec(sec)) return; reorderSections(src.si, si); }}
                style={{display:"flex",background:"#000",color:"#fff",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS,padding:"4px 0",textTransform:"uppercase",alignItems:"center",cursor:isFeeSec(sec)?"default":"grab",position:"relative",
                  ...(dropIndicator?.type === "section" && dropIndicator.si === si ? { boxShadow: "0 -2px 0 0 #2196F3" } : {})}}>
                <div data-noprint style={{width:16,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"rgba(255,255,255,0.4)",cursor:isFeeSec(sec)?"default":"grab"}}>{isFeeSec(sec) ? "" : "⠿"}</div>
                <div style={{width:34,padding:"0 2px",flexShrink:0}}>{sec.num}</div>
                <div style={{flex:1,padding:"0 6px"}}>{sec.title}</div>
                <div style={{width:120,padding:"0 6px",fontSize:9,flexShrink:0}}>NOTES</div>
                <div style={{width:50,textAlign:"center",padding:"0 4px",flexShrink:0}}>DAYS</div>
                <div style={{width:40,textAlign:"center",padding:"0 4px",flexShrink:0}}>QTY</div>
                <div style={{width:90,textAlign:"right",padding:"0 4px",flexShrink:0}}>RATE</div>
                <div style={{width:90,textAlign:"right",padding:"0 4px",flexShrink:0}}>TOTAL {baseCurrency}</div>
                <div style={{width:90,textAlign:"right",padding:"0 4px",flexShrink:0}}>TOTAL {secondCurrency}</div>
                <div style={{width:24,flexShrink:0}}></div>
              </div>
              {sec.rows.map((row,ri)=>{const {tot,autoCalc}=getRowDisplay(row);const _rm="est:row:"+row.ref;const _rHas=_hasBM(_rm);const _rowBg=_rHas?"#E8F5E9":(EST_ST_BG[row.rowStatus||""]||"transparent");return(
                <div key={ri}
                  draggable
                  onDragStart={e => { dragRef.current = { type: "row", si, ri }; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", `row:${si}:${ri}`); e.currentTarget.style.opacity = "0.4"; }}
                  onDragEnd={e => { e.currentTarget.style.opacity = "1"; dragRef.current = null; setDropIndicator(null); }}
                  onDragOver={e => { e.preventDefault(); const src = dragRef.current; if (!src || src.type !== "row") return; setDropIndicator({ type: "row", si, ri }); }}
                  onDragLeave={() => { if (dropIndicator?.type === "row" && dropIndicator.si === si && dropIndicator.ri === ri) setDropIndicator(null); }}
                  onDrop={e => { e.preventDefault(); setDropIndicator(null); const src = dragRef.current; if (!src || src.type !== "row") return; if (src.si === si) reorderRows(si, src.ri, ri); else moveRowToSection(src.si, src.ri, si, ri); }}
                  style={{display:"flex",borderBottom:"1px solid #f0f0f0",alignItems:"stretch",position:"relative",background:_rowBg,transition:"background 0.15s",
                    ...(dropIndicator?.type === "row" && dropIndicator.si === si && dropIndicator.ri === ri ? { boxShadow: "0 -2px 0 0 #2196F3" } : {})}}>
                  {_rHas&&<div style={{position:"absolute",left:-28,top:4,display:"flex",gap:1,zIndex:1}}><button onClick={()=>onAcceptMarker&&onAcceptMarker(_rm)} style={_bRevBtn("accept")}>{"✓"}</button><button onClick={()=>onDeclineMarker&&onDeclineMarker(_rm)} style={_bRevBtn("decline")}>{"✕"}</button></div>}
                  <div data-noprint style={{width:16,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",cursor:"grab",fontSize:10,color:"#ccc"}} onMouseEnter={e=>{e.currentTarget.style.color="#666"}} onMouseLeave={e=>{e.currentTarget.style.color="#ccc"}}>
                    <span style={{userSelect:"none",lineHeight:1,pointerEvents:"none"}}>⠿</span>
                  </div>
                  <div data-noprint style={{width:16,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span onClick={()=>cycleRowStatus(si,ri)} title={(row.rowStatus||"No status")+" — click to cycle"} style={{cursor:"pointer",fontSize:8,color:EST_ST_DOT[row.rowStatus||""]||"#ddd",userSelect:"none",lineHeight:1}}>●</span>
                  </div>
                  <div style={{width:34,flexShrink:0,padding:"4px 2px",fontFamily:EST_F,fontSize:9,color:"#999"}}>{row.ref}</div>
                  <div style={{flex:1,minWidth:0}}><EstCell value={row.desc} onChange={v=>updateRow(si,ri,"desc",v)} /></div>
                  <div style={{width:120,flexShrink:0}}><EstCell value={row.notes} onChange={v=>updateRow(si,ri,"notes",v)} style={{fontSize:9,color:"#666"}} /></div>
                  <div style={{width:50,flexShrink:0}}><EstCell value={row.days} onChange={v=>updateRow(si,ri,"days",v)} align="center" /></div>
                  <div style={{width:40,flexShrink:0}}><EstCell value={row.qty} onChange={v=>updateRow(si,ri,"qty",v)} align="center" /></div>
                  <div style={{width:90,flexShrink:0}}>{autoCalc
                    ? <div style={{padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",color:"#999",fontStyle:"italic",letterSpacing:EST_LS}}>auto</div>
                    : <EstCell value={row.rate} onChange={v=>updateRow(si,ri,"rate",v)} align="right" />}</div>
                  <div onClick={()=>tot>0&&toggleTally(si,ri,tot)} style={{width:90,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",color:tot>0?"#1a1a1a":"#ccc",letterSpacing:EST_LS,cursor:tot>0?"pointer":"default",background:isTallied(si,ri)?"#E8F5E9":"transparent",borderRadius:2,transition:"background 0.15s"}}>{estFmt(tot)}</div>
                  <div style={{width:90,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",color:tot>0?"#1a1a1a":"#ccc",letterSpacing:EST_LS}}>{estFmt(tot*xRate)}</div>
                  <div style={{width:24,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span onClick={()=>removeRow(si,ri)} style={{cursor:"pointer",fontSize:11,color:"#ccc"}} onMouseEnter={e=>{e.target.style.color="#f44"}} onMouseLeave={e=>{e.target.style.color="#ccc"}}>{"\u00d7"}</span></div>
                </div>);})}
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div data-noprint onClick={()=>addRow(si)} style={{fontFamily:EST_F,fontSize:9,color:"#999",cursor:"pointer",letterSpacing:EST_LS,padding:"4px 6px"}}>+ Add Line</div>
                <div style={{display:"flex",gap:0}}>
                  <div style={{fontFamily:EST_F,fontSize:10,fontWeight:700,padding:"4px 8px",letterSpacing:EST_LS}}>TOTAL</div>
                  <div onClick={()=>feeSectionTotal>0&&toggleTallySection(si,feeSectionTotal)} style={{width:90,fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",padding:"4px 6px",letterSpacing:EST_LS,cursor:feeSectionTotal>0?"pointer":"default",background:isSectionTallied(si)?"#E8F5E9":"transparent",borderRadius:2,transition:"background 0.15s"}}>{estFmt(feeSectionTotal)}</div>
                  <div style={{width:90,fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",padding:"4px 6px",letterSpacing:EST_LS}}>{estFmt(feeSectionTotal*xRate)}</div>
                  <div style={{width:24}}></div>
                </div>
              </div>
              </div>
            </div>);})}
          <div style={{borderTop:"2px solid #000",marginTop:8,display:"flex",justifyContent:"flex-end"}}>
            <div style={{width:420}}>
              <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS}}>
                <span>GRAND TOTAL</span><span>{baseCurrency} {estFmt(grandTotal)}</span><span style={{width:110,textAlign:"right"}}>{secondCurrency} {estFmt(grandTotal*xRate)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS,borderTop:"1px solid #eee"}}>
                <span>VAT ({vatPct}%)</span><span>{baseCurrency} {estFmt(grandTotal*vatRate)}</span><span style={{width:110,textAlign:"right"}}>{secondCurrency} {estFmt(grandTotal*vatRate*xRate)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS,borderTop:"2px solid #000"}}>
                <span>TOTAL INC. VAT</span><span>{baseCurrency} {estFmt(grandTotal + grandTotal*vatRate)}</span><span style={{width:110,textAlign:"right"}}>{secondCurrency} {estFmt((grandTotal + grandTotal*vatRate)*xRate)}</span></div>
            </div>
          </div>
        </div>}

        {(estTab === "services" || showAll) && <div data-page="services">
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
        </div>}

        {(estTab === "tcs" || showAll) && <div data-page="tcs">
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
        </div>}

        <div style={{marginTop:40,display:"flex",justifyContent:"space-between",fontFamily:EST_F,fontSize:9,letterSpacing:EST_LS,color:"#000",borderTop:"2px solid #000",paddingTop:12}}>
          <div><div style={{fontWeight:700}}>@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div>
          <div style={{textAlign:"right"}}><div style={{fontWeight:700}}>WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div>
        </div>
      </div>
      {tallyItems.length > 0 && (
        <div data-noprint style={{position:"fixed",bottom:24,right:24,width:300,background:"#fff",border:"1px solid #ddd",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",zIndex:9000,fontFamily:EST_F,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#f8f8f8",borderBottom:"1px solid #eee"}}>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:EST_LS,textTransform:"uppercase",color:"#666"}}>TALLY ({tallyItems.length} items)</span>
            <span onClick={()=>setTallyItems([])} style={{fontSize:9,fontWeight:700,letterSpacing:EST_LS,color:"#999",cursor:"pointer",textTransform:"uppercase"}} onMouseEnter={e=>{e.target.style.color="#f44"}} onMouseLeave={e=>{e.target.style.color="#999"}}>CLEAR</span>
          </div>
          <div style={{maxHeight:200,overflowY:"auto",padding:"6px 0"}}>
            {tallyItems.map(t => (
              <div key={t.key} style={{display:"flex",alignItems:"center",padding:"4px 14px",gap:8,borderBottom:"1px solid #f5f5f5"}}>
                <span onClick={()=>setTallyItems(prev=>prev.filter(x=>x.key!==t.key))} style={{cursor:"pointer",fontSize:11,color:"#ccc",flexShrink:0}} onMouseEnter={e=>{e.target.style.color="#f44"}} onMouseLeave={e=>{e.target.style.color="#ccc"}}>{"\u00d7"}</span>
                <span style={{fontSize:8,color:t.isSection?"#666":"#999",fontWeight:700,letterSpacing:EST_LS,flexShrink:0,width:28}}>{t.ref}</span>
                <span style={{fontSize:9,color:"#333",letterSpacing:EST_LS,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:t.isSection?700:400,textTransform:t.isSection?"uppercase":"none"}}>{t.desc}</span>
                <span style={{fontSize:9,fontWeight:t.isSection?700:600,letterSpacing:EST_LS,color:"#1a1a1a",flexShrink:0,textAlign:"right",minWidth:60}}>{estFmt(t.amount)}</span>
              </div>
            ))}
          </div>
          <div style={{borderTop:"2px solid #000",padding:"8px 14px",display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:EST_LS,color:"#666",textTransform:"uppercase"}}>TOTAL</span>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:EST_LS,color:"#1a1a1a"}}>{baseCurrency} {estFmt(tallyTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AgentDocPreview — live editable document preview for split-pane ────────

export default EstimateView;
