import React, { Fragment } from "react";
import { defaultSections, estCalcTotals, estSectionTotal, estRowTotal, estNum, estFmt, buildActualsFromEstimate, syncActualsWithEstimate, actualsRowExpenseTotal, actualsRowEffective, actualsSectionExpenseTotal, actualsSectionEffective, actualsSectionZohoTotal, actualsGrandExpenseTotal, actualsGrandEffective, actualsGrandZohoTotal, ACTUALS_STATUSES } from "../../utils/helpers";
import { EST_F, EST_LS, EST_LS_HDR, EST_SA_FIELDS, ESTIMATE_INIT, EST_YELLOW } from "../ui/DocHelpers";

export default function Budget({
  T, isMobile, p,
  budgetSubSection, setBudgetSubSection,
  projectEstimates, setProjectEstimates, editingEstimate, setEditingEstimate,
  projectActuals, setProjectActuals, actualsTrackerTab, setActualsTrackerTab,

  quotes, invoiceTab, setInvoiceTab,
  invoiceSearchTerm, setInvoiceSearchTerm, quoteSearchTerm, setQuoteSearchTerm,
  previewFile, setPreviewFile,
  projectFileStore, setProjectFileStore, projectCreativeLinks, setProjectCreativeLinks,
  linkUploading, linkUploadProgress, uploadFromLink,
  createMenuOpen, setCreateMenuOpen, setDuplicateModal, setDuplicateSearch,
  pushUndo, archiveItem, pushNav, showAlert, showPrompt, buildPath,
  projectInfoRef, actualsExpandedRef,
  EstCell, EstimateView, BtnPrimary, PRINT_CLEANUP_CSS,
}) {
  const estimates    = projectEstimates[p.id]||[];
  const versionLabels= ["V1","V2","V3","V4","V5"];

  // Budget sub-navigation
  if (!budgetSubSection) return (
    <div>
      <p style={{fontSize:13,color:T.sub,marginBottom:18}}>Budget management for this project.</p>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:12}}>
        {[["tracker","Budget Tracker","💰","Track income & expenses"],["estimates","Estimates","📋",`${estimates.length} version(s)`],["quotations","Quotations","💬",`${quotes.length} quote(s)`],["invoices","Invoices & Receipts","🧾","Upload invoices & receipts"]].map(([key,label,emoji,desc])=>(
          <a key={key} href={buildPath("Projects",p.id,"Budget",key)} onClick={(e)=>{if(e.metaKey||e.ctrlKey)return;e.preventDefault();setBudgetSubSection(key);pushNav("Projects",p,"Budget",key);}} className="proj-card" style={{borderRadius:16,padding:"22px 22px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",textDecoration:"none",color:"inherit"}}>
            <span style={{fontSize:28,flexShrink:0}}>{emoji}</span>
            <div style={{minWidth:0,flex:1}}>
              <div style={{fontSize:15,fontWeight:600,color:T.text,marginBottom:3}}>{label}</div>
              <div style={{fontSize:12,color:T.muted}}>{desc}</div>
            </div>
            <span style={{color:T.muted,fontSize:16,flexShrink:0}}>›</span>
          </a>
        ))}
      </div>
    </div>
  );

  // Budget Tracker sub-section
  if (budgetSubSection==="tracker") {
    // Pull estimate data
    const estVersions = projectEstimates[p.id] || [];
    const latestEst = estVersions.length > 0 ? estVersions[estVersions.length - 1] : null;
    const estSections = latestEst ? (latestEst.sections || defaultSections()) : defaultSections();
    const estTotals = estCalcTotals(estSections);
    const actProdLogo = latestEst?.prodLogo || null;

    // Auto-sync actuals with estimate — merges new sections/rows without wiping existing data
    if (latestEst) {
      const existing = projectActuals[p.id];
      if (!existing) {
        setProjectActuals(prev => ({ ...prev, [p.id]: buildActualsFromEstimate(estSections) }));
      } else {
        const synced = syncActualsWithEstimate(existing, estSections);
        const syncedStr = JSON.stringify(synced.map(s => ({ num: s.num, title: s.title, rowCount: s.rows.length, refs: s.rows.map(r => r.ref) })));
        const existStr = JSON.stringify(existing.map(s => ({ num: s.num, title: s.title, rowCount: s.rows.length, refs: s.rows.map(r => r.ref) })));
        if (syncedStr !== existStr) {
          setProjectActuals(prev => ({ ...prev, [p.id]: synced }));
        }
      }
    }
    const actSections = projectActuals[p.id] || buildActualsFromEstimate(estSections);

    const actExpenseTotal = actualsGrandExpenseTotal(actSections);
    const actEffectiveTotal = actualsGrandEffective(actSections);
    const actZohoTotal = actualsGrandZohoTotal(actSections);
    const actVariance = estTotals.grandTotal - actEffectiveTotal;
    const budgetUsedPct = estTotals.grandTotal > 0 ? Math.round((actEffectiveTotal / estTotals.grandTotal) * 100) : 0;

    // Update a row in actuals
    const updateActRow = (secIdx, rowIdx, field, value) => {
      setProjectActuals(prev => {
        const store = JSON.parse(JSON.stringify(prev));
        if (!store[p.id]) store[p.id] = buildActualsFromEstimate(estSections);
        store[p.id][secIdx].rows[rowIdx][field] = value;
        return store;
      });
    };

    // Add expense to a row
    const addExpense = (secIdx, rowIdx) => {
      setProjectActuals(prev => {
        const store = JSON.parse(JSON.stringify(prev));
        if (!store[p.id]) store[p.id] = buildActualsFromEstimate(estSections);
        store[p.id][secIdx].rows[rowIdx].expenses.push({ id: Date.now(), vendor: "", desc: "", amount: "0", status: "" });
        return store;
      });
    };

    // Update an expense
    const updateExpense = (secIdx, rowIdx, expIdx, field, value) => {
      setProjectActuals(prev => {
        const store = JSON.parse(JSON.stringify(prev));
        store[p.id][secIdx].rows[rowIdx].expenses[expIdx][field] = value;
        return store;
      });
    };

    // Delete a row from actuals
    const deleteActRow = (secIdx, rowIdx) => {
      setProjectActuals(prev => {
        const store = JSON.parse(JSON.stringify(prev));
        if (!store[p.id]) return prev;
        if (store[p.id][secIdx].rows.length <= 1) return prev; // keep at least 1 row
        store[p.id][secIdx].rows.splice(rowIdx, 1);
        return store;
      });
    };

    // Toggle highlight on a row
    const toggleHighlight = (secIdx, rowIdx) => {
      setProjectActuals(prev => {
        const store = JSON.parse(JSON.stringify(prev));
        if (!store[p.id]) return prev;
        store[p.id][secIdx].rows[rowIdx].highlighted = !store[p.id][secIdx].rows[rowIdx].highlighted;
        return store;
      });
    };

    // Delete expense
    const deleteExpense = (secIdx, rowIdx, expIdx) => {
      setProjectActuals(prev => {
        const store = JSON.parse(JSON.stringify(prev));
        store[p.id][secIdx].rows[rowIdx].expenses.splice(expIdx, 1);
        return store;
      });
    };

    const trackerTab = actualsTrackerTab;
    const setTrackerTab = setActualsTrackerTab;
    const toggleExpand = (key) => { actualsExpandedRef.current[key] = !actualsExpandedRef.current[key]; setProjectActuals(prev => ({...prev})); };

    const actHdr = { fontFamily:EST_F,fontSize:9,fontWeight:700,letterSpacing:EST_LS,textTransform:"uppercase",padding:"4px 6px",background:"#f4f4f4",borderBottom:"1px solid #ddd" };
    const stColors = { "": "#ccc", Pending: "#92680a", Confirmed: "#0066cc", Paid: "#147d50" };
    const stBg = { "": "transparent", Pending: "#fff8e8", Confirmed: "#e8f4fd", Paid: "#edfaf3" };

    // Print export — inject print styles and print directly
    const doActPrint = () => {
      const styleId = "actuals-print-style";
      let style = document.getElementById(styleId);
      if (!style) {
        style = document.createElement("style");
        style.id = styleId;
        document.head.appendChild(style);
      }
      style.textContent = `
        @media print {
          @page { margin: 15mm 12mm; size: A4 landscape; }
          body * { visibility: hidden !important; }
          #actuals-print-area, #actuals-print-area * { visibility: visible !important; }
          #actuals-print-area { position: absolute !important; left: 0; top: 0; width: 100% !important; max-width: none !important; padding: 0 !important; margin: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #actuals-print-area [data-noprint] { display: none !important; }
          #actuals-print-area button { display: none !important; }
          nav, header, aside, .sidebar, [class*="lusha"], [id*="lusha"], [class*="Lusha"], [class*="grammarly"], [class*="lastpass"], [class*="honey"], [class*="chrome-extension"] { display: none !important; }
        }
      `;
      window.print();
    };

    return (
    <div>
      <button onClick={()=>{setBudgetSubSection(null);setActualsTrackerTab("detail");}} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>&#8249; Back to Budget</button>

      {/* Document container — matches EstimateView style */}
      <div style={{ overflowX:"auto",margin:isMobile?"0 -16px":"0",padding:isMobile?"0 16px":"0" }}>
      <div style={{ maxWidth:1000,margin:"0 auto",background:"#fff",fontFamily:EST_F,color:"#1a1a1a",minWidth:700 }}>
        {/* Tab bar */}
        <div style={{ display:"flex",borderBottom:"2px solid #000",overflowX:"auto" }}>
          {[{id:"summary",label:"SUMMARY"},{id:"detail",label:"ACTUALS TRACKER"}].map(t=><div key={t.id} onClick={()=>setTrackerTab(t.id)} style={{ fontFamily:EST_F,fontSize:9,fontWeight:trackerTab===t.id?700:400,letterSpacing:EST_LS,padding:"10px 16px",cursor:"pointer",whiteSpace:"nowrap",background:trackerTab===t.id?"#000":"#f5f5f5",color:trackerTab===t.id?"#fff":"#666",transition:"all .15s",textTransform:"uppercase",borderRight:"1px solid #ddd" }}>{t.label}</div>)}
          <div style={{ marginLeft:"auto",display:"flex" }}>
            <div onClick={doActPrint} style={{ fontFamily:EST_F,fontSize:9,fontWeight:700,letterSpacing:EST_LS,padding:"10px 16px",cursor:"pointer",whiteSpace:"nowrap",background:"#000",color:"#fff",textTransform:"uppercase",borderLeft:"1px solid #ddd" }}
              onMouseEnter={e=>{e.target.style.background="#333"}} onMouseLeave={e=>{e.target.style.background="#000"}}>EXPORT PDF</div>
          </div>
        </div>

        <div id="actuals-print-area" style={{ padding:"40px 40px" }}>
          {/* Logo + header */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4 }}>
            {actProdLogo ? <img src={actProdLogo} style={{maxHeight:36,maxWidth:140,objectFit:"contain"}} alt="Logo"/> : <div/>}
          </div>
          <div style={{ borderBottom:"2.5px solid #000",marginBottom:16 }} />

          <div style={{textAlign:"center",fontFamily:EST_F,fontSize:12,fontWeight:700,letterSpacing:EST_LS_HDR,textTransform:"uppercase",marginBottom:4}}>BUDGET TRACKER</div>
          <div style={{textAlign:"center",fontFamily:EST_F,fontSize:10,letterSpacing:EST_LS,color:"#666",marginBottom:16}}>{p.client} &#8212; {p.name}</div>

          {/* Summary cards row */}
          <div style={{display:"flex",gap:0,borderTop:"2px solid #000",borderBottom:"2px solid #000",marginBottom:20}}>
            {[
              ["ESTIMATE TOTAL", estFmt(estTotals.grandTotal), "#1a1a1a"],
              ["ACTUALS TOTAL", estFmt(actExpenseTotal), "#1a1a1a"],
              ["FINALS (ZOHO)", estFmt(actZohoTotal), "#1a1a1a"],
              ["VARIANCE", (actVariance>=0?"+":"") + estFmt(actVariance), actVariance>=0?"#147d50":"#c0392b"],
              ["BUDGET USED", budgetUsedPct + "%", budgetUsedPct>100?"#c0392b":budgetUsedPct>80?"#92680a":"#147d50"],
            ].map(([lbl,val,clr],i)=>(
              <div key={lbl} style={{flex:1,padding:"8px 10px",borderRight:i<4?"1px solid #ddd":"none",textAlign:"center"}}>
                <div style={{fontFamily:EST_F,fontSize:8,fontWeight:700,letterSpacing:EST_LS,textTransform:"uppercase",color:"#888",marginBottom:2}}>{lbl}</div>
                <div style={{fontFamily:EST_F,fontSize:11,fontWeight:700,letterSpacing:EST_LS,color:clr}}>{val}</div>
              </div>
            ))}
          </div>

          {/* Summary Tab */}
          {trackerTab==="summary" && (
            <div>
              <div style={{display:"flex",background:"#f4f4f4",borderBottom:"1px solid #ddd"}}>
                <div style={{flex:1,...actHdr}}>SECTION</div>
                <div style={{width:110,...actHdr,textAlign:"right"}}>ESTIMATE</div>
                <div style={{width:110,...actHdr,textAlign:"right"}}>ACTUALS</div>
                <div style={{width:110,...actHdr,textAlign:"right"}}>FINALS</div>
                <div style={{width:110,...actHdr,textAlign:"right"}}>VARIANCE</div>
              </div>
              {actSections.map((sec, si) => {
                const estSec = estSections[si];
                const estSecTot = estSec ? estSectionTotal(estSec) : 0;
                const actExp = actualsSectionExpenseTotal(sec);
                const actEff = actualsSectionEffective(sec);
                const actZoho = actualsSectionZohoTotal(sec);
                const sv = estSecTot - actEff;
                return (
                  <div key={si} style={{display:"flex",borderBottom:"1px solid #f0f0f0"}}>
                    <div style={{width:24,padding:"4px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS}}>{sec.num}</div>
                    <div style={{flex:1,padding:"4px 6px",fontFamily:EST_F,fontSize:10,letterSpacing:EST_LS}}>{sec.title}</div>
                    <div style={{width:110,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(estSecTot)}</div>
                    <div style={{width:110,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(actExp)}</div>
                    <div style={{width:110,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(actZoho)}</div>
                    <div style={{width:110,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",letterSpacing:EST_LS,fontWeight:600,color:sv>=0?"#147d50":"#c0392b"}}>{(sv>=0?"+":"")}{estFmt(sv)}</div>
                  </div>
                ); })}
              <div style={{display:"flex",borderTop:"2px solid #000"}}>
                <div style={{flex:1,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>GRAND TOTAL</div>
                <div style={{width:110,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(estTotals.grandTotal)}</div>
                <div style={{width:110,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(actExpenseTotal)}</div>
                <div style={{width:110,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(actZohoTotal)}</div>
                <div style={{width:110,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS,color:actVariance>=0?"#147d50":"#c0392b"}}>{(actVariance>=0?"+":"")}{estFmt(actVariance)}</div>
              </div>
            </div>
          )}

          {/* Detail Tab */}
          {trackerTab==="detail" && (
            <div>
              {actSections.map((sec, si) => {
                const estSec = estSections[si];
                const secEstTotal = estSec ? estSectionTotal(estSec) : 0;
                return (
                <div key={si} style={{marginBottom:16}}>
                  {/* Section header — matches estimate format with actuals columns */}
                  <div style={{display:"flex",background:"#000",color:"#fff",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS,padding:"4px 0",textTransform:"uppercase",alignItems:"center"}}>
                    <div style={{width:40,padding:"0 6px",flexShrink:0}}>{sec.num}</div>
                    <div style={{flex:1,padding:"0 6px"}}>{sec.title}</div>
                    <div style={{width:110,padding:"0 6px",fontSize:9,flexShrink:0}}>NOTES</div>
                    <div style={{width:45,textAlign:"center",padding:"0 4px",flexShrink:0}}>DAYS</div>
                    <div style={{width:35,textAlign:"center",padding:"0 4px",flexShrink:0}}>QTY</div>
                    <div style={{width:70,textAlign:"right",padding:"0 4px",flexShrink:0}}>RATE</div>
                    <div style={{width:80,textAlign:"right",padding:"0 4px",flexShrink:0}}>ESTIMATE</div>
                    <div style={{width:80,textAlign:"right",padding:"0 4px",flexShrink:0}}>ACTUALS</div>
                    <div style={{width:80,textAlign:"right",padding:"0 4px",flexShrink:0}}>FINALS</div>
                    <div style={{width:70,textAlign:"right",padding:"0 4px",flexShrink:0}}>VARIANCE</div>
                    <div style={{width:60,textAlign:"center",padding:"0 4px",flexShrink:0}}>STATUS</div>
                    <div style={{width:24,flexShrink:0}} data-noprint></div>
                    <div style={{width:18,flexShrink:0}} data-noprint></div>
                  </div>
                  {/* Rows */}
                  {sec.rows.map((row, ri) => {
                    const estRow = estSec?.rows[ri];
                    const estVal = estRow ? estRowTotal(estRow) : 0;
                    const expTotal = actualsRowExpenseTotal(row);
                    const zohoVal = estNum(row.zohoAmount);
                    const actVal = actualsRowEffective(row);
                    const rv = estVal - actVal;
                    const rowKey = `${si}-${ri}`;
                    const isExpanded = actualsExpandedRef.current[rowKey];
                    return (
                      <Fragment key={ri}>
                        <div style={{display:"flex",borderBottom:"1px solid #f0f0f0",alignItems:"stretch",background:row.highlighted?EST_YELLOW:"transparent"}}>
                          <div style={{width:40,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:9,color:"#999"}}>{row.ref}</div>
                          <div style={{flex:1,padding:"4px 6px",fontFamily:EST_F,fontSize:10,letterSpacing:EST_LS,minWidth:0}}>{row.desc}</div>
                          <div style={{width:110,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:9,color:"#666",letterSpacing:EST_LS}}>{row.notes}</div>
                          <div style={{width:45,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"center",letterSpacing:EST_LS,color:estNum(row.days)>0?"#1a1a1a":"#ccc"}}>{row.days}</div>
                          <div style={{width:35,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"center",letterSpacing:EST_LS,color:estNum(row.qty)>0?"#1a1a1a":"#ccc"}}>{row.qty}</div>
                          <div style={{width:70,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",letterSpacing:EST_LS,color:estNum(row.rate)>0?"#1a1a1a":"#ccc"}}>{estFmt(estNum(row.rate))}</div>
                          <div style={{width:80,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",letterSpacing:EST_LS,color:estVal>0?"#1a1a1a":"#ccc"}}>{estFmt(estVal)}</div>
                          <div style={{width:80,flexShrink:0}}><EstCell value={row.actualsAmount||String(expTotal||"")} onChange={v2 => updateActRow(si, ri, "actualsAmount", v2)} align="right" /></div>
                          <div style={{width:80,flexShrink:0}}><EstCell value={row.zohoAmount} onChange={v2 => updateActRow(si, ri, "zohoAmount", v2)} align="right" /></div>
                          <div style={{width:70,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",letterSpacing:EST_LS,fontWeight:600,color:rv>0?"#147d50":rv<0?"#c0392b":"#1a1a1a"}}>{(rv>=0?"+":"") + estFmt(rv)}</div>
                          <div style={{width:60,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <span onClick={()=>{const idx=ACTUALS_STATUSES.indexOf(row.status);updateActRow(si,ri,"status",ACTUALS_STATUSES[(idx+1)%ACTUALS_STATUSES.length]);}} style={{fontFamily:EST_F,fontSize:8,fontWeight:700,letterSpacing:0.5,padding:"2px 6px",borderRadius:3,cursor:"pointer",userSelect:"none",background:stBg[row.status]||"transparent",color:stColors[row.status]||"#ccc",textTransform:"uppercase"}}>{row.status||"\u2014"}</span>
                          </div>
                          <div style={{width:24,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}} data-noprint>
                            <span onClick={()=>toggleExpand(rowKey)} style={{cursor:"pointer",fontSize:11,color:"#999",userSelect:"none"}}>{isExpanded?"\u25BE":"\u25B8"}</span>
                          </div>
                          <div style={{width:18,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}} data-noprint>
                            <span onClick={()=>toggleHighlight(si,ri)} title="Highlight" style={{cursor:"pointer",fontSize:9,color:row.highlighted?"#c9a800":"#ddd",userSelect:"none",lineHeight:1}} onMouseEnter={e=>{e.target.style.color="#c9a800"}} onMouseLeave={e=>{e.target.style.color=row.highlighted?"#c9a800":"#ddd"}}>{"\u25CF"}</span>
                            <span onClick={()=>deleteActRow(si,ri)} title="Delete row" style={{cursor:"pointer",fontSize:11,color:"#ccc",userSelect:"none",lineHeight:1}} onMouseEnter={e=>{e.target.style.color="#f44"}} onMouseLeave={e=>{e.target.style.color="#ccc"}}>{"\u00d7"}</span>
                          </div>
                        </div>
                        {/* Expandable expenses dropdown */}
                        {isExpanded && (
                          <div style={{background:"#fafafa",borderBottom:"1px solid #eee"}}>
                            {(row.expenses||[]).map((exp, ei) => (
                              <div key={exp.id} style={{display:"flex",alignItems:"stretch",borderBottom:"1px solid #f0f0f0"}}>
                                <div style={{width:40,flexShrink:0,padding:"3px 6px",fontFamily:EST_F,fontSize:8,color:"#ccc",display:"flex",alignItems:"center"}}>{"\u2514"}</div>
                                <div style={{flex:1,minWidth:0}}><EstCell value={exp.desc} onChange={v2 => updateExpense(si, ri, ei, "desc", v2)} style={{fontSize:9,color:"#666"}} /></div>
                                <div style={{width:110,flexShrink:0}}></div>
                                <div style={{width:45,flexShrink:0}}></div>
                                <div style={{width:35,flexShrink:0}}></div>
                                <div style={{width:70,flexShrink:0}}></div>
                                <div style={{width:80,flexShrink:0}}></div>
                                <div style={{width:80,flexShrink:0}}><EstCell value={exp.amount} onChange={v2 => updateExpense(si, ri, ei, "amount", v2)} align="right" /></div>
                                <div style={{width:80,flexShrink:0}}></div>
                                <div style={{width:70,flexShrink:0}}></div>
                                <div style={{width:60,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                                  <span onClick={()=>{const sts=["","Pending","Paid","Unpaid"];const idx=sts.indexOf(exp.status||"");updateExpense(si,ri,ei,"status",sts[(idx+1)%sts.length]);}} style={{fontFamily:EST_F,fontSize:8,fontWeight:700,letterSpacing:0.5,padding:"2px 6px",borderRadius:3,cursor:"pointer",userSelect:"none",textTransform:"uppercase",background:({"":"transparent",Pending:"#fff8e8",Paid:"#edfaf3",Unpaid:"#fff3f0"})[exp.status||""]||"transparent",color:({"":"#ccc",Pending:"#92680a",Paid:"#147d50",Unpaid:"#c0392b"})[exp.status||""]||"#ccc"}}>{exp.status||"\u2014"}</span>
                                </div>
                                <div style={{width:24,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}} data-noprint>
                                  <span onClick={()=>deleteExpense(si, ri, ei)} style={{cursor:"pointer",fontSize:11,color:"#ccc"}} onMouseEnter={e=>{e.target.style.color="#f44"}} onMouseLeave={e=>{e.target.style.color="#ccc"}}>{"\u00d7"}</span>
                                </div>
                                <div style={{width:18,flexShrink:0}}></div>
                              </div>
                            ))}
                            <div style={{display:"flex"}}>
                              <div style={{width:40,flexShrink:0}}></div>
                              <div onClick={()=>addExpense(si, ri)} style={{fontFamily:EST_F,fontSize:9,color:"#999",cursor:"pointer",letterSpacing:EST_LS,padding:"4px 6px"}} data-noprint>+ Add Expense</div>
                            </div>
                          </div>
                        )}
                      </Fragment>
                    ); })}
                  {/* Section total */}
                  <div style={{display:"flex",justifyContent:"flex-end",borderBottom:"2px solid #000"}}>
                    <div style={{display:"flex",gap:0,padding:"4px 0"}}>
                      <div style={{fontFamily:EST_F,fontSize:10,fontWeight:700,padding:"0 8px",letterSpacing:EST_LS}}>TOTAL</div>
                      <div style={{width:80,fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",padding:"0 6px",letterSpacing:EST_LS}}>{estFmt(secEstTotal)}</div>
                      <div style={{width:80,fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",padding:"0 6px",letterSpacing:EST_LS,color:"#0066cc"}}>{estFmt(actualsSectionExpenseTotal(sec))}</div>
                      <div style={{width:80,fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",padding:"0 6px",letterSpacing:EST_LS}}>{estFmt(actualsSectionZohoTotal(sec))}</div>
                      <div style={{width:70,fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",padding:"0 6px",letterSpacing:EST_LS,color:(secEstTotal-actualsSectionEffective(sec))>=0?"#147d50":"#c0392b"}}>{(secEstTotal-actualsSectionEffective(sec)>=0?"+":"")}{estFmt(secEstTotal-actualsSectionEffective(sec))}</div>
                      <div style={{width:60}}></div>
                      <div style={{width:24}}></div>
                      <div style={{width:18}}></div>
                    </div>
                  </div>
                </div>
                ); })}

              {/* Grand total bar */}
              <div style={{display:"flex",background:"#000",color:"#fff",marginTop:4}}>
                <div style={{flex:1,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS,textAlign:"right"}}>GRAND TOTAL</div>
                <div style={{width:80,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(estTotals.grandTotal)}</div>
                <div style={{width:80,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(actExpenseTotal)}</div>
                <div style={{width:80,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>{estFmt(actZohoTotal)}</div>
                <div style={{width:70,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>{(actVariance>=0?"+":"")}{estFmt(actVariance)}</div>
                <div style={{width:60}}></div>
                <div style={{width:24}}></div>
                <div style={{width:18}}></div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
    );
  }

  // Quotations sub-section
  if (budgetSubSection==="quotations") {
    const quoteFiles = (projectFileStore[p.id]||{}).quotations||[];
    const addQuoteFiles = async (fileList) => {
      const newEntries = [];
      for (const f of fileList) {
        if (f.size > 40*1024*1024) { showAlert(`"${f.name}" is over 40 MB.`); continue; }
        const data = await new Promise(r=>{const fr=new FileReader();fr.onload=e=>r(e.target.result);fr.readAsDataURL(f);});
        newEntries.push({id:Date.now()+Math.random(),name:f.name,size:f.size,type:f.type,data,createdAt:Date.now()});
      }
      if (newEntries.length===0) return;
      setProjectFileStore(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),quotations:[...((prev[p.id]||{}).quotations||[]),...newEntries]}}));
    };
    const deleteQuoteFile = (fileId) => setProjectFileStore(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),quotations:((prev[p.id]||{}).quotations||[]).filter(f=>f.id!==fileId)}}));
    const renameQuoteFile = (fileId, newName) => setProjectFileStore(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),quotations:((prev[p.id]||{}).quotations||[]).map(f=>f.id===fileId?{...f,name:newName}:f)}}));
    const downloadQuoteFile = (file) => {const a=document.createElement("a");a.href=file.data;a.download=file.name;a.click();};
    const filteredQuotes = quoteSearchTerm.trim() ? quoteFiles.filter(f=>f.name.toLowerCase().includes(quoteSearchTerm.trim().toLowerCase())) : quoteFiles;
    return (
    <div>
      <button onClick={()=>window.history.back()} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>‹ Back to Budget</button>
      <div style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:14}}>Quotations</div>
      <p style={{fontSize:13,color:T.sub,marginBottom:16}}>Upload vendor quotations here, paste a Dropbox / Drive link to import, or click a file to preview.</p>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Dropbox / Drive Link</div>
        <div style={{display:"flex",gap:10}}>
          <input value={(projectCreativeLinks[p.id]||{}).quotations||""} onChange={e=>setProjectCreativeLinks(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),quotations:e.target.value}}))} placeholder="https://www.dropbox.com/sh/..." style={{flex:1,padding:"9px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
          {(projectCreativeLinks[p.id]||{}).quotations&&<button disabled={linkUploading} onClick={()=>uploadFromLink((projectCreativeLinks[p.id]||{}).quotations,"quotations")} style={{display:"flex",alignItems:"center",padding:"9px 18px",borderRadius:10,background:linkUploading?"#999":T.accent,color:"#fff",fontSize:13,fontWeight:600,border:"none",cursor:linkUploading?"default":"pointer",flexShrink:0,fontFamily:"inherit"}}>{linkUploading?"Uploading…":"Upload"}</button>}
        </div>
        {linkUploadProgress!==null&&<div style={{marginTop:8}}><div style={{height:6,borderRadius:3,background:"#e5e5ea",overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:linkUploadProgress===100?"#34c759":T.accent,width:`${linkUploadProgress}%`,transition:"width 0.3s ease"}}/></div><div style={{fontSize:11,color:T.muted,marginTop:4}}>{linkUploadProgress===100?"Complete!":linkUploadProgress<50?"Sending…":"Downloading…"} {linkUploadProgress}%</div></div>}
      </div>
      <label onDrop={e=>{e.preventDefault();addQuoteFiles(Array.from(e.dataTransfer.files));}} onDragOver={e=>e.preventDefault()} style={{display:"block",border:`1.5px dashed ${T.border}`,borderRadius:14,padding:36,textAlign:"center",cursor:"pointer",background:"#fafafa",transition:"border-color 0.15s",marginBottom:18}}>
        <div style={{fontSize:26,marginBottom:8,opacity:0.35}}>⬆</div>
        <div style={{fontSize:13,color:T.sub,marginBottom:4,fontWeight:500}}>Upload vendor quotations (PDF, images, spreadsheets)</div>
        <div style={{fontSize:12,color:T.muted}}>Drag & drop or click to upload</div>
        <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" style={{display:"none"}} onChange={e=>addQuoteFiles(Array.from(e.target.files))}/>
      </label>
      {quoteFiles.length>0&&<input value={quoteSearchTerm} onChange={e=>setQuoteSearchTerm(e.target.value)} placeholder="Search quotations…" style={{width:"100%",padding:"9px 14px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",marginBottom:12,boxSizing:"border-box"}}/>}
      {filteredQuotes.length>0&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filteredQuotes.map((f)=>(
          <div key={f.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:12,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 2px rgba(0,0,0,0.04)",cursor:f.type?.includes("pdf")||f.type?.includes("image")?"pointer":"default"}} onClick={()=>{if(f.type?.includes("pdf")||f.type?.includes("image"))setPreviewFile(f);}}>
            <span style={{fontSize:15,flexShrink:0}}>{f.type?.includes("pdf")?"📄":f.type?.includes("image")?"🖼":"📎"}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,color:T.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
              <div style={{fontSize:11,color:T.muted,marginTop:1}}>{(f.size/1024).toFixed(0)} KB · {new Date(f.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
            </div>
            <button onClick={async e=>{e.stopPropagation();const n=await showPrompt("Rename file:",f.name);if(n&&n.trim())renameQuoteFile(f.id,n.trim());}} style={{background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.sub,padding:"6px 10px",borderRadius:8,fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"inherit",flexShrink:0}} title="Rename">Rename</button>
            <button onClick={e=>{e.stopPropagation();downloadQuoteFile(f);}} style={{background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.sub,padding:"6px 10px",borderRadius:8,fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"inherit",flexShrink:0}} title="Download">Export</button>
            <button onClick={e=>{e.stopPropagation();if(confirm(`Delete "${f.name}"?`))deleteQuoteFile(f.id);}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:"0 4px",lineHeight:1,flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#c0392b"} onMouseOut={e=>e.currentTarget.style.color=T.muted} title="Delete">×</button>
          </div>
        ))}
      </div>}
      {previewFile&&<div className="modal-bg" onClick={()=>setPreviewFile(null)}>
        <div style={{width:"90vw",maxWidth:900,height:"85vh",background:T.surface,borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.25)"}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{fontSize:14,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{previewFile.name}</div>
            <button onClick={()=>setPreviewFile(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
          </div>
          <div style={{flex:1,overflow:"auto",background:"#f0f0f2"}}>
            {previewFile.type?.includes("pdf")?<iframe src={previewFile.data} style={{width:"100%",height:"100%",border:"none"}}/>
            :previewFile.type?.includes("image")?<img src={previewFile.data} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",display:"block",margin:"auto"}} alt={previewFile.name}/>
            :<div style={{padding:40,textAlign:"center",color:T.muted}}>Preview not available for this file type.</div>}
          </div>
        </div>
      </div>}
    </div>
  );}

  // Invoices & Receipts sub-section
  if (budgetSubSection==="invoices") {
    const activeKey = invoiceTab;
    const invFiles = (projectFileStore[p.id]||{})[activeKey]||[];
    const addInvFiles = async (fileList) => {
      const newEntries = [];
      for (const f of fileList) {
        if (f.size > 40*1024*1024) { showAlert(`"${f.name}" is over 40 MB.`); continue; }
        const data = await new Promise(r=>{const fr=new FileReader();fr.onload=e=>r(e.target.result);fr.readAsDataURL(f);});
        newEntries.push({id:Date.now()+Math.random(),name:f.name,size:f.size,type:f.type,data,createdAt:Date.now()});
      }
      if (newEntries.length===0) return;
      setProjectFileStore(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),[activeKey]:[...((prev[p.id]||{})[activeKey]||[]),...newEntries]}}));
    };
    const deleteInvFile = (fileId) => setProjectFileStore(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),[activeKey]:((prev[p.id]||{})[activeKey]||[]).filter(f=>f.id!==fileId)}}));
    const renameInvFile = (fileId, newName) => setProjectFileStore(prev=>({...prev,[p.id]:{...(prev[p.id]||{}),[activeKey]:((prev[p.id]||{})[activeKey]||[]).map(f=>f.id===fileId?{...f,name:newName}:f)}}));
    const downloadInvFile = (file) => {const a=document.createElement("a");a.href=file.data;a.download=file.name;a.click();};
    const filteredInv = invoiceSearchTerm.trim() ? invFiles.filter(f=>f.name.toLowerCase().includes(invoiceSearchTerm.trim().toLowerCase())) : invFiles;
    return (
    <div>
      <button onClick={()=>window.history.back()} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>‹ Back to Budget</button>
      <div style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:14}}>Invoices & Receipts</div>
      <div style={{display:"flex",gap:6,marginBottom:18}}>
        {[["invoices","Invoices"],["receipts","Receipts"]].map(([key,label])=>(
          <button key={key} onClick={()=>{setInvoiceTab(key);setInvoiceSearchTerm("");}} style={{padding:"7px 18px",borderRadius:20,fontSize:13,fontWeight:600,fontFamily:"inherit",cursor:"pointer",border:`1px solid ${invoiceTab===key?T.accent:T.border}`,background:invoiceTab===key?T.accent:"transparent",color:invoiceTab===key?"#fff":T.sub,transition:"all 0.15s"}}>{label}</button>
        ))}
      </div>
      <label onDrop={e=>{e.preventDefault();addInvFiles(Array.from(e.dataTransfer.files));}} onDragOver={e=>e.preventDefault()} style={{display:"block",border:`1.5px dashed ${T.border}`,borderRadius:14,padding:36,textAlign:"center",cursor:"pointer",background:"#fafafa",transition:"border-color 0.15s",marginBottom:18}}>
        <div style={{fontSize:26,marginBottom:8,opacity:0.35}}>⬆</div>
        <div style={{fontSize:13,color:T.sub,marginBottom:4,fontWeight:500}}>Upload {invoiceTab==="invoices"?"invoices":"receipts"} (PDF, images, docs, spreadsheets)</div>
        <div style={{fontSize:12,color:T.muted}}>Drag & drop or click to upload</div>
        <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" style={{display:"none"}} onChange={e=>addInvFiles(Array.from(e.target.files))}/>
      </label>
      {invFiles.length>0&&<input value={invoiceSearchTerm} onChange={e=>setInvoiceSearchTerm(e.target.value)} placeholder={`Search ${invoiceTab}…`} style={{width:"100%",padding:"9px 14px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",marginBottom:12,boxSizing:"border-box"}}/>}
      {filteredInv.length>0&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filteredInv.map((f)=>(
          <div key={f.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:12,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 2px rgba(0,0,0,0.04)",cursor:f.type?.includes("pdf")||f.type?.includes("image")?"pointer":"default"}} onClick={()=>{if(f.type?.includes("pdf")||f.type?.includes("image"))setPreviewFile(f);}}>
            <span style={{fontSize:15,flexShrink:0}}>{f.type?.includes("pdf")?"📄":f.type?.includes("image")?"🖼":"📎"}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,color:T.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
              <div style={{fontSize:11,color:T.muted,marginTop:1}}>{(f.size/1024).toFixed(0)} KB · {new Date(f.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
            </div>
            <button onClick={async e=>{e.stopPropagation();const n=await showPrompt("Rename file:",f.name);if(n&&n.trim())renameInvFile(f.id,n.trim());}} style={{background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.sub,padding:"6px 10px",borderRadius:8,fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"inherit",flexShrink:0}} title="Rename">Rename</button>
            <button onClick={e=>{e.stopPropagation();downloadInvFile(f);}} style={{background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.sub,padding:"6px 10px",borderRadius:8,fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"inherit",flexShrink:0}} title="Download">Export</button>
            <button onClick={e=>{e.stopPropagation();if(confirm(`Delete "${f.name}"?`))deleteInvFile(f.id);}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:"0 4px",lineHeight:1,flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#c0392b"} onMouseOut={e=>e.currentTarget.style.color=T.muted} title="Delete">×</button>
          </div>
        ))}
      </div>}
      {previewFile&&<div className="modal-bg" onClick={()=>setPreviewFile(null)}>
        <div style={{width:"90vw",maxWidth:900,height:"85vh",background:T.surface,borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.25)"}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{fontSize:14,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{previewFile.name}</div>
            <button onClick={()=>setPreviewFile(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
          </div>
          <div style={{flex:1,overflow:"auto",background:"#f0f0f2"}}>
            {previewFile.type?.includes("pdf")?<iframe src={previewFile.data} style={{width:"100%",height:"100%",border:"none"}}/>
            :previewFile.type?.includes("image")?<img src={previewFile.data} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",display:"block",margin:"auto"}} alt={previewFile.name}/>
            :<div style={{padding:40,textAlign:"center",color:T.muted}}>Preview not available for this file type.</div>}
          </div>
        </div>
      </div>}
    </div>
  );}

  // Estimates sub-section
  if (budgetSubSection!=="estimates") return null;
  if (editingEstimate) {
    const estIdx = estimates.findIndex(e => e.id === editingEstimate);
    if (estIdx < 0) { setEditingEstimate(null); return null; }
    const est = estimates[estIdx];
    const estSetFn = (fn) => {
      setProjectEstimates(prev => {
        const arr = JSON.parse(JSON.stringify(prev[p.id] || []));
        arr[estIdx] = fn(arr[estIdx]);
        return {...prev, [p.id]: arr};
      });
    };
    return (
      <div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <button onClick={()=>setEditingEstimate(null)} style={{background:"none",border:"none",color:T.sub,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,display:"flex",alignItems:"center",gap:4,fontWeight:500}}>‹ Back</button>
          <span style={{fontSize:12,color:T.muted}}>{est.ts?.version||`V${estIdx+1}`}</span>
        </div>
        <EstimateView estData={est} onSet={estSetFn} />
      </div>
    );
  }
  return (
    <div>
      <button onClick={()=>window.history.back()} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>‹ Back to Budget</button>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <div style={{fontSize:18,fontWeight:700,color:T.text}}>Estimates</div>
        {(()=>{
          const addEstNew=()=>{pushUndo("add estimate");const ne={...JSON.parse(JSON.stringify(ESTIMATE_INIT)),id:Date.now()};const _pi6=(projectInfoRef.current||{})[p.id];ne.ts={...ne.ts,version:`PRODUCTION ESTIMATE ${versionLabels[estimates.length]||`V${estimates.length+1}`}`,client:p.client||"",project:_pi6?.shootName||p.name||"",usage:_pi6?.usage||ne.ts.usage,shootDate:_pi6?.shootDate||ne.ts.shootDate,location:_pi6?.shootLocation||ne.ts.location};if(_pi6){const _sa2={};EST_SA_FIELDS.forEach((_f,i)=>{_sa2[i]=EST_SA_FIELDS[i].defaultValue;});if(_pi6.shootName)_sa2[3]=_pi6.shootName;if(_pi6.shootDate)_sa2[5]=_pi6.shootDate;if(_pi6.usage)_sa2[7]=_pi6.usage;ne.saFields=_sa2;}setProjectEstimates(prev=>({...prev,[p.id]:[...(prev[p.id]||[]),ne]}));const logoImg=new Image();logoImg.crossOrigin="anonymous";logoImg.onload=()=>{try{const cv=document.createElement("canvas");cv.width=logoImg.naturalWidth;cv.height=logoImg.naturalHeight;cv.getContext("2d").drawImage(logoImg,0,0);const dataUrl=cv.toDataURL("image/png");setProjectEstimates(prev=>{const s=JSON.parse(JSON.stringify(prev));const arr=s[p.id]||[];const idx=arr.findIndex(e=>e.id===ne.id);if(idx>=0&&!arr[idx].prodLogo)arr[idx].prodLogo=dataUrl;return s;});}catch{}};logoImg.src="/onna-default-logo.png";};
          return(
            <div style={{position:"relative"}}>
              <BtnPrimary onClick={()=>setCreateMenuOpen(prev=>({...prev,est:!prev.est}))}>+ New Estimate ▾</BtnPrimary>
              {createMenuOpen.est&&<div onClick={()=>setCreateMenuOpen(prev=>({...prev,est:false}))} style={{position:"fixed",inset:0,zIndex:9998}} />}
              {createMenuOpen.est&&(
                <div style={{position:"absolute",top:36,right:0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:180,overflow:"hidden"}}>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,est:false}));addEstNew();}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Blank</div>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,est:false}));setDuplicateModal({type:"estimate"});setDuplicateSearch("");}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Existing</div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
      {estimates.length===0?(projectEstimates[p.id]===undefined?<div style={{padding:44,textAlign:"center"}}><div style={{fontSize:13,color:T.muted}}>Loading estimates…</div></div>:<div style={{borderRadius:14,background:"#fafafa",border:`1.5px dashed ${T.border}`,padding:44,textAlign:"center"}}><div style={{fontSize:13,color:T.muted}}>No estimates yet. Click "+ New Estimate" to get started, or ask Billie to build one for you.</div></div>):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {estimates.map((est)=>{
            const secs = est.sections || defaultSections();
            const { grandTotal: gt } = estCalcTotals(secs);
            const totalIncVat = gt + gt * 0.05;
            return (
              <div key={est.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border-color 0.15s"}} onClick={()=>setEditingEstimate(est.id)} onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:"#eee",padding:"2px 8px",borderRadius:4,color:"#555"}}>{est.ts?.version||"V1"}</span>
                    <span style={{fontSize:8,fontWeight:600,letterSpacing:0.5,background:gt>0?"#e8f5e9":"#f5f5f5",color:gt>0?"#2e7d32":"#999",padding:"2px 8px",borderRadius:4}}>AED {totalIncVat.toLocaleString(undefined,{maximumFractionDigits:0})} inc. VAT</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:T.text}}>{est.ts?.project||p.name}</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:2}}>{est.ts?.date||"No date set"}</div>
                </div>
                <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>{if(!window.confirm(`Delete this estimate (${est.ts?.version||"V1"})? It will be moved to Deleted.`))return;archiveItem("estimates",{projectId:p.id,estimate:est});setProjectEstimates(prev=>{const arr=(prev[p.id]||[]).filter(x=>x.id!==est.id);const updated={...prev};if(arr.length===0)delete updated[p.id];else updated[p.id]=arr;return updated;});}} style={{padding:"4px 10px",borderRadius:7,background:"#fff5f5",color:"#c0392b",border:"1px solid #f5c6cb",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                </div>
              </div>
            ); })}
        </div>
      )}
    </div>
  );
}
