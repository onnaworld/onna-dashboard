import React, { Fragment, useState } from "react";
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
        // Compare structure AND estimate field values
        const fingerprint = (secs) => JSON.stringify(secs.map(s => ({ num: s.num, title: s.title, isFees: s.isFees, rows: s.rows.map(r => ({ ref: r.ref, desc: r.desc, notes: r.notes, days: r.days, qty: r.qty, rate: r.rate })) })));
        if (fingerprint(synced) !== fingerprint(existing)) {
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
        store[p.id][secIdx].rows[rowIdx].expenses.push({ id: Date.now(), vendor: "", desc: "", amount: "0", status: "", receiptLink: "" });
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

    // Cycle row color: none → toReconcile (yellow) → reconciled (green) → none
    const ROW_COLORS = ["", "toReconcile", "reconciled"];
    const ROW_COLOR_MAP = { "": "transparent", toReconcile: "#FFF9C4", reconciled: "#E8F5E9" };
    const ROW_COLOR_DOT = { "": "#ddd", toReconcile: "#c9a800", reconciled: "#2e7d32" };
    const cycleRowColor = (secIdx, rowIdx) => {
      setProjectActuals(prev => {
        const store = JSON.parse(JSON.stringify(prev));
        if (!store[p.id]) return prev;
        const row = store[p.id][secIdx].rows[rowIdx];
        const cur = row.rowColor || (row.highlighted ? "toReconcile" : "");
        const next = ROW_COLORS[(ROW_COLORS.indexOf(cur) + 1) % ROW_COLORS.length];
        row.rowColor = next;
        row.highlighted = false; // migrate old field
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

    // Drag-and-drop expenses between rows
    const [dragExp, setDragExp] = React.useState(null); // {si, ri, ei}
    const [dropTarget, setDropTarget] = React.useState(null); // {si, ri}
    const moveExpense = (fromSi, fromRi, fromEi, toSi, toRi) => {
      if (fromSi === toSi && fromRi === toRi) return; // same row, no-op
      setProjectActuals(prev => {
        const store = JSON.parse(JSON.stringify(prev));
        const src = store[p.id][fromSi].rows[fromRi].expenses;
        const [exp] = src.splice(fromEi, 1);
        if (!store[p.id][toSi].rows[toRi].expenses) store[p.id][toSi].rows[toRi].expenses = [];
        store[p.id][toSi].rows[toRi].expenses.push(exp);
        return store;
      });
      // Auto-expand the target row
      const targetKey = `${toSi}-${toRi}`;
      if (!expandedRows[targetKey]) {
        actualsExpandedRef.current[targetKey] = true;
        setExpandedRows(prev => {
          const next = {...prev, [targetKey]: true};
          try { localStorage.setItem(expandStorageKey, JSON.stringify(next)); } catch {}
          return next;
        });
      }
    };

    const trackerTab = actualsTrackerTab;
    const setTrackerTab = setActualsTrackerTab;

    // Collapsed sections — persisted per project
    const collapsedSecKey = `onna_collapsed_sec_${p.id}`;
    const [collapsedSecs, setCollapsedSecs] = React.useState(() => {
      try { const s = localStorage.getItem(collapsedSecKey); if (s) return JSON.parse(s); } catch {}
      return {};
    });
    const toggleSection = (si) => {
      setCollapsedSecs(prev => {
        const next = {...prev}; if (next[si]) delete next[si]; else next[si] = true;
        try { localStorage.setItem(collapsedSecKey, JSON.stringify(next)); } catch {}
        return next;
      });
    };

    const expandStorageKey = `onna_expanded_${p.id}`;
    const [expandedRows, setExpandedRows] = React.useState(() => {
      try { const s = localStorage.getItem(expandStorageKey); if (s) return JSON.parse(s); } catch {}
      const init = {};
      Object.keys(actualsExpandedRef.current || {}).forEach(k => { if (actualsExpandedRef.current[k]) init[k] = true; });
      return init;
    });
    const toggleExpand = (key) => {
      actualsExpandedRef.current[key] = !actualsExpandedRef.current[key];
      setExpandedRows(prev => {
        const next = {...prev}; if (next[key]) delete next[key]; else next[key] = true;
        try { localStorage.setItem(expandStorageKey, JSON.stringify(next)); } catch {}
        return next;
      });
    };

    const actHdr = { fontFamily:EST_F,fontSize:9,fontWeight:700,letterSpacing:EST_LS,textTransform:"uppercase",padding:"4px 6px",background:"#f4f4f4",borderBottom:"1px solid #ddd" };
    const stColors = { "": "#ccc", Pending: "#92680a", Confirmed: "#0066cc", Paid: "#147d50" };
    const stBg = { "": "transparent", Pending: "#fff8e8", Confirmed: "#e8f4fd", Paid: "#edfaf3" };

    // Editable invoiced amount
    const [invoicedOverride, setInvoicedOverride] = React.useState(() => {
      try { const v = localStorage.getItem(`onna_invoiced_${p.id}`); return v !== null ? parseFloat(v) : null; } catch { return null; }
    });
    const [invoicedEdit, setInvoicedEdit] = React.useState(null);

    // Invoiced amount calculation (hoisted for use across tabs)
    const pctMatch = (latestEst?.ts?.payment || "").match(/(\d+)%/);
    const advPct = pctMatch ? parseInt(pctMatch[1]) : 75;
    const autoInvoiced = estTotals.grandTotal * (advPct / 100);
    const invoicedAmt = invoicedOverride !== null ? invoicedOverride : autoInvoiced;
    const finalInvoice = invoicedAmt - actExpenseTotal;

    // Budget tracker notes — persisted per project
    const budgetNotesKey = `onna_budget_notes_${p.id}`;
    const [budgetNotes, setBudgetNotes] = React.useState(() => {
      try { return localStorage.getItem(budgetNotesKey) || ""; } catch { return ""; }
    });
    const saveBudgetNotes = (val) => {
      setBudgetNotes(val);
      try { localStorage.setItem(budgetNotesKey, val); } catch {}
    };

    // Export column picker
    const ALL_COLS = [
      { id:"notes", label:"Notes", w:80 },
      { id:"days", label:"Days", w:45 },
      { id:"qty", label:"Qty", w:35 },
      { id:"rate", label:"Rate", w:70 },
      { id:"estimate", label:"Estimate", w:80 },
      { id:"actuals", label:"Actuals", w:80 },
      { id:"finals", label:"Finals", w:80 },
      { id:"variance", label:"Variance", w:70 },
      { id:"status", label:"Status", w:60 },
    ];
    const hiddenColsKey = `onna_hidden_cols_${p.id}`;
    const [hiddenCols, setHiddenCols] = React.useState(() => {
      try { const s = localStorage.getItem(hiddenColsKey); if (s) return JSON.parse(s); } catch {}
      return {};
    });
    const [showColPicker, setShowColPicker] = React.useState(false);
    const colVisible = (id) => !hiddenCols[id];
    const toggleCol = (id) => setHiddenCols(prev => {const n={...prev};if(n[id])delete n[id];else n[id]=true; try{localStorage.setItem(hiddenColsKey,JSON.stringify(n));}catch{} return n;});
    const colStyle = (id, base) => colVisible(id) ? base : {...base, display:"none"};
    // Dynamic min-width: base (ref 40 + desc ~120 + actions 42) + visible column widths
    const visibleColWidth = ALL_COLS.filter(c => colVisible(c.id)).reduce((s, c) => s + c.w, 0);
    const dynamicMinWidth = 200 + visibleColWidth;

    // Tally scratchpad — local state, not persisted
    const [tallyItems, setTallyItems] = React.useState([]);
    const toggleTally = (secIdx, rowIdx, expIdx) => {
      const key = expIdx !== undefined ? `${secIdx}-${rowIdx}-e${expIdx}` : `${secIdx}-${rowIdx}`;
      setTallyItems(prev => {
        if (prev.find(t => t.key === key)) return prev.filter(t => t.key !== key);
        if (expIdx !== undefined) {
          const exp = actSections[secIdx]?.rows[rowIdx]?.expenses?.[expIdx];
          if (!exp) return prev;
          const amt = parseFloat(exp.amount) || 0;
          return [...prev, { key, ref: "", desc: exp.desc || "Expense", estimate: 0, actuals: amt }];
        }
        const row = actSections[secIdx]?.rows[rowIdx];
        const estRow = estSections[secIdx]?.rows[rowIdx];
        if (!row) return prev;
        const estVal = estRow ? estRowTotal(estRow) : 0;
        const actVal = actualsRowEffective(row);
        return [...prev, { key, ref: row.ref, desc: row.desc, estimate: estVal, actuals: actVal }];
      });
    };
    const isTallied = (secIdx, rowIdx, expIdx) => {
      const key = expIdx !== undefined ? `${secIdx}-${rowIdx}-e${expIdx}` : `${secIdx}-${rowIdx}`;
      return tallyItems.some(t => t.key === key);
    };
    const tallyEstTotal = Math.round(tallyItems.reduce((s, t) => s + t.estimate, 0) * 100) / 100;
    const tallyActTotal = Math.round(tallyItems.reduce((s, t) => s + t.actuals, 0) * 100) / 100;

    // Receipt link with OCR — paste a URL, optionally scan for amount
    const [receiptLoading, setReceiptLoading] = React.useState(null); // "si-ri-ei" key
    const [receiptOcrResult, setReceiptOcrResult] = React.useState(null); // {si, ri, ei, amount, vendor, description, currency}
    const handleReceiptLink = async (si, ri, ei) => {
      const url = window.prompt("Paste receipt link (image or PDF URL):");
      if (!url || !url.trim()) return;
      const trimmed = url.trim();
      updateExpense(si, ri, ei, "receiptLink", trimmed);
      // Try OCR on the link
      const loadKey = `${si}-${ri}-${ei}`;
      setReceiptLoading(loadKey);
      try {
        const resp = await fetch("/api/receipt-ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed }),
        });
        if (resp.ok) {
          const result = await resp.json();
          if (result.amount && result.amount > 0) {
            setReceiptOcrResult({ si, ri, ei, ...result });
          }
        }
      } catch (err) {
        console.error("Receipt OCR error:", err);
      } finally {
        setReceiptLoading(null);
      }
    };
    const applyReceiptOcr = () => {
      if (!receiptOcrResult) return;
      const { si, ri, ei, amount, vendor, description } = receiptOcrResult;
      updateExpense(si, ri, ei, "amount", String(amount));
      if (vendor) {
        const desc = description ? `${vendor} — ${description}` : vendor;
        updateExpense(si, ri, ei, "desc", desc);
      }
      setReceiptOcrResult(null);
    };

    // Print export — inject print styles and print directly
    const doActPrint = () => {
      setShowColPicker(false);
      const styleId = "actuals-print-style";
      let style = document.getElementById(styleId);
      if (!style) {
        style = document.createElement("style");
        style.id = styleId;
        document.head.appendChild(style);
      }
      style.textContent = `
        @media print {
          @page { margin: 0; size: A4 portrait; }
          body * { visibility: hidden !important; position: static !important; }
          #actuals-print-area, #actuals-print-area * { visibility: visible !important; }
          #actuals-print-area { position: absolute !important; left: 0; top: 0; width: 100% !important; max-width: none !important; padding: 20mm 18mm !important; margin: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box !important; overflow: visible !important; }
          #actuals-print-area [data-noprint] { display: none !important; }
          #actuals-print-area [data-noprint-hide] { display: none !important; }
          #actuals-print-area [data-print-only] { display: block !important; }
          #actuals-print-area [data-noprint-drag] { cursor: default !important; }
          #actuals-print-area button { display: none !important; }
          #actuals-print-area [data-col] { flex: 1 1 0 !important; width: auto !important; min-width: 0 !important; }
          #actuals-print-area [data-col-desc] { flex: 2 1 0 !important; width: auto !important; min-width: 0 !important; }
          nav, header, aside, .sidebar, [class*="lusha"], [id*="lusha"], [class*="Lusha"], [class*="grammarly"], [class*="lastpass"], [class*="honey"], [class*="chrome-extension"] { display: none !important; }
        }
      `;
      window.print();
    };

    return (
    <div onClick={()=>showColPicker&&setShowColPicker(false)}>
      <button onClick={()=>{setBudgetSubSection(null);setActualsTrackerTab("detail");}} style={{background:"none",border:"none",color:T.link,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>&#8249; Back to Budget</button>

      {/* Document container — matches EstimateView style */}
      <div style={{ overflowX:showColPicker?"visible":"auto",margin:isMobile?"0 -16px":"0",padding:isMobile?"0 16px":"0" }}>
      <div style={{ maxWidth:1000,margin:"0 auto",background:"#fff",fontFamily:EST_F,color:"#1a1a1a",minWidth:dynamicMinWidth,position:"relative" }}>
        {/* Tab bar */}
        <div style={{ display:"flex",borderBottom:"2px solid #000",position:"relative",zIndex:50 }}>
          {[{id:"summary",label:"SUMMARY"},{id:"detail",label:"ACTUALS TRACKER"}].map(t=><div key={t.id} onClick={()=>setTrackerTab(t.id)} style={{ fontFamily:EST_F,fontSize:9,fontWeight:trackerTab===t.id?700:400,letterSpacing:EST_LS,padding:"10px 16px",cursor:"pointer",whiteSpace:"nowrap",background:trackerTab===t.id?"#000":"#f5f5f5",color:trackerTab===t.id?"#fff":"#666",transition:"all .15s",textTransform:"uppercase",borderRight:"1px solid #ddd" }}>{t.label}</div>)}
          <div style={{ marginLeft:"auto",display:"flex",position:"relative" }}>
            <div onClick={e=>{e.stopPropagation();setShowColPicker(p=>!p);}} style={{ fontFamily:EST_F,fontSize:9,fontWeight:700,letterSpacing:EST_LS,padding:"10px 16px",cursor:"pointer",whiteSpace:"nowrap",background:showColPicker?"#333":"#f5f5f5",color:showColPicker?"#fff":"#666",textTransform:"uppercase",borderLeft:"1px solid #ddd",transition:"all .15s" }}
              onMouseEnter={e=>{if(!showColPicker){e.target.style.background="#e8e8e8";e.target.style.color="#333";}}} onMouseLeave={e=>{if(!showColPicker){e.target.style.background="#f5f5f5";e.target.style.color="#666";}}}>{Object.keys(hiddenCols).length>0?`COLUMNS (${ALL_COLS.length-Object.keys(hiddenCols).length}/${ALL_COLS.length})`:"COLUMNS ▾"}</div>
            <div onClick={doActPrint} style={{ fontFamily:EST_F,fontSize:9,fontWeight:700,letterSpacing:EST_LS,padding:"10px 16px",cursor:"pointer",whiteSpace:"nowrap",background:"#000",color:"#fff",textTransform:"uppercase",borderLeft:"1px solid #ddd" }}
              onMouseEnter={e=>{e.target.style.background="#333"}} onMouseLeave={e=>{e.target.style.background="#000"}}>EXPORT PDF</div>
          </div>
        </div>
        {showColPicker && (
          <div data-noprint style={{position:"absolute",top:38,right:0,background:"#fff",border:"1px solid #ddd",borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",zIndex:9999,padding:"8px 0",minWidth:200}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"6px 14px 10px",fontFamily:EST_F,fontSize:9,fontWeight:700,letterSpacing:EST_LS,color:"#999",textTransform:"uppercase",borderBottom:"1px solid #f0f0f0"}}>Show / Hide Columns</div>
            {ALL_COLS.map(c=>(
              <div key={c.id} onClick={()=>toggleCol(c.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",cursor:"pointer",fontFamily:EST_F,fontSize:12,letterSpacing:EST_LS,color:colVisible(c.id)?"#1a1a1a":"#bbb",transition:"background .1s"}} onMouseEnter={e=>{e.currentTarget.style.background="#f5f5f7"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent"}}>
                <span style={{width:16,height:16,borderRadius:3,border:colVisible(c.id)?"2px solid #1976D2":"2px solid #ccc",background:colVisible(c.id)?"#1976D2":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,color:"#fff",lineHeight:1}}>{colVisible(c.id)?"\u2713":""}</span>
                {c.label}
              </div>
            ))}
            <div style={{borderTop:"1px solid #f0f0f0",padding:"8px 14px 6px",display:"flex",gap:12}}>
              <span onClick={()=>{setHiddenCols({});try{localStorage.setItem(hiddenColsKey,JSON.stringify({}));}catch{}}} style={{fontFamily:EST_F,fontSize:10,color:"#1976D2",cursor:"pointer",letterSpacing:EST_LS,fontWeight:700}}>SELECT ALL</span>
              <span onClick={()=>{const h={};ALL_COLS.forEach(c=>{h[c.id]=true});setHiddenCols(h);try{localStorage.setItem(hiddenColsKey,JSON.stringify(h));}catch{}}} style={{fontFamily:EST_F,fontSize:10,color:"#999",cursor:"pointer",letterSpacing:EST_LS,fontWeight:700}}>DESELECT ALL</span>
            </div>
          </div>
        )}

        <div id="actuals-print-area" style={{ padding:"40px 40px" }}>
          {/* Logo + header */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4 }}>
            {actProdLogo ? <img src={actProdLogo} style={{maxHeight:36,maxWidth:140,objectFit:"contain"}} alt="Logo"/> : <div/>}
          </div>
          <div style={{ borderBottom:"2.5px solid #000",marginBottom:16 }} />

          <div style={{textAlign:"center",fontFamily:EST_F,fontSize:12,fontWeight:700,letterSpacing:EST_LS_HDR,textTransform:"uppercase",marginBottom:4}}>BUDGET TRACKER</div>
          <div style={{textAlign:"center",fontFamily:EST_F,fontSize:10,letterSpacing:EST_LS,color:"#666",marginBottom:16}}>{p.client} &#8212; {p.name}</div>

          {/* Notes section */}
          <div style={{marginBottom:16}}>
            <div style={{fontFamily:EST_F,fontSize:9,fontWeight:700,letterSpacing:EST_LS,textTransform:"uppercase",color:"#888",marginBottom:6}}>NOTES</div>
            <textarea
              data-noprint-hide
              value={budgetNotes}
              onChange={e => saveBudgetNotes(e.target.value)}
              placeholder="Add notes..."
              style={{width:"100%",minHeight:60,padding:"8px 10px",borderRadius:6,border:"1px solid #e0e0e0",fontFamily:EST_F,fontSize:10,letterSpacing:EST_LS,color:"#1a1a1a",resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.5}}
            />
            <div data-print-only style={{display:"none",fontFamily:EST_F,fontSize:10,letterSpacing:EST_LS,color:"#1a1a1a",whiteSpace:"pre-wrap",lineHeight:1.5,padding:"4px 0"}}>{budgetNotes}</div>
          </div>

          {/* Summary cards row */}
          <div style={{display:"flex",gap:0,borderTop:"2px solid #000",borderBottom:"2px solid #000",marginBottom:20}}>
            <div style={{flex:1,padding:"8px 10px",borderRight:"1px solid #ddd",textAlign:"center"}}>
              <div style={{fontFamily:EST_F,fontSize:8,fontWeight:700,letterSpacing:EST_LS,textTransform:"uppercase",color:"#888",marginBottom:2}}>INVOICED {invoicedOverride===null?`(${advPct}%)`:""}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:2}}>
                <input
                  value={invoicedEdit !== null ? invoicedEdit : estFmt(invoicedAmt)}
                  onFocus={e => { setInvoicedEdit(String(Math.round(invoicedAmt * 100) / 100)); e.target.select(); }}
                  onChange={e => setInvoicedEdit(e.target.value)}
                  onBlur={() => {
                    const v = parseFloat(String(invoicedEdit).replace(/,/g, ""));
                    if (!isNaN(v) && Math.round(v * 100) !== Math.round(autoInvoiced * 100)) {
                      setInvoicedOverride(v);
                      try { localStorage.setItem(`onna_invoiced_${p.id}`, String(v)); } catch {}
                    } else {
                      setInvoicedOverride(null);
                      try { localStorage.removeItem(`onna_invoiced_${p.id}`); } catch {}
                    }
                    setInvoicedEdit(null);
                  }}
                  onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
                  style={{fontFamily:EST_F,fontSize:11,fontWeight:700,letterSpacing:EST_LS,color:"#1a1a1a",textAlign:"center",border:"none",outline:"none",background:"transparent",width:90,padding:0}}
                />
              </div>
            </div>
            {[
              ["ESTIMATE TOTAL", estFmt(estTotals.grandTotal), "#1a1a1a", "estimate"],
              ["ACTUALS TOTAL", estFmt(actExpenseTotal), "#1a1a1a", "actuals"],
              ["FINALS (ZOHO)", estFmt(actZohoTotal), "#1a1a1a", "finals"],
              ["VARIANCE", (actVariance>=0?"+":"") + estFmt(actVariance), actVariance>=0?"#147d50":"#c0392b", "variance"],
              ["BUDGET USED", budgetUsedPct + "%", budgetUsedPct>100?"#c0392b":budgetUsedPct>80?"#92680a":"#147d50", null],
            ].filter(([,,,colId]) => !colId || colVisible(colId)).map(([lbl,val,clr],i,arr)=>(
              <div key={lbl} style={{flex:1,padding:"8px 10px",borderRight:i<arr.length-1?"1px solid #ddd":"none",textAlign:"center"}}>
                <div style={{fontFamily:EST_F,fontSize:8,fontWeight:700,letterSpacing:EST_LS,textTransform:"uppercase",color:"#888",marginBottom:2}}>{lbl}</div>
                <div style={{fontFamily:EST_F,fontSize:11,fontWeight:700,letterSpacing:EST_LS,color:clr}}>{val}</div>
              </div>
            ))}
          </div>

          {/* Summary Tab */}
          {trackerTab==="summary" && (
            <div>
              <div style={{display:"flex",background:"#f4f4f4",borderBottom:"1px solid #ddd"}}>
                <div data-col-desc style={{flex:1,...actHdr}}>SECTION</div>
                <div data-col style={colStyle("estimate",{width:110,...actHdr,textAlign:"right"})}>ESTIMATE</div>
                <div data-col style={colStyle("actuals",{width:110,...actHdr,textAlign:"right"})}>ACTUALS</div>
                <div data-col style={colStyle("finals",{width:110,...actHdr,textAlign:"right"})}>FINALS</div>
                <div data-col style={colStyle("variance",{width:110,...actHdr,textAlign:"right"})}>VARIANCE</div>
              </div>
              {actSections.map((sec, si) => {
                const estSec = estSections[si];
                const estSecTot = estSec ? (estSec.isFees ? estSec.rows.reduce((sum, row) => {
                  const pctMatch = (row.notes || "").match(/(\d+(?:\.\d+)?)%/);
                  if (pctMatch) return sum + estTotals.subtotal * (parseFloat(pctMatch[1]) / 100);
                  return sum + estRowTotal(row);
                }, 0) : estSectionTotal(estSec)) : 0;
                const actExp = actualsSectionExpenseTotal(sec);
                const actEff = actualsSectionEffective(sec);
                const actZoho = actualsSectionZohoTotal(sec);
                const sv = estSecTot - actEff;
                return (
                  <div key={si} style={{display:"flex",borderBottom:"1px solid #f0f0f0"}}>
                    <div data-col style={{width:24,padding:"4px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS}}>{sec.num}</div>
                    <div data-col-desc style={{flex:1,padding:"4px 6px",fontFamily:EST_F,fontSize:10,letterSpacing:EST_LS}}>{sec.title}</div>
                    <div data-col style={colStyle("estimate",{width:110,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",letterSpacing:EST_LS})}>{estFmt(estSecTot)}</div>
                    <div data-col style={colStyle("actuals",{width:110,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",letterSpacing:EST_LS})}>{estFmt(actExp)}</div>
                    <div data-col style={colStyle("finals",{width:110,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",letterSpacing:EST_LS})}>{estFmt(actZoho)}</div>
                    <div data-col style={colStyle("variance",{width:110,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",letterSpacing:EST_LS,fontWeight:600,color:sv>=0?"#147d50":"#c0392b"})}>{(sv>=0?"+":"")}{estFmt(sv)}</div>
                  </div>
                ); })}
              <div style={{display:"flex",borderTop:"2px solid #000"}}>
                <div data-col-desc style={{flex:1,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>GRAND TOTAL</div>
                <div data-col style={colStyle("estimate",{width:110,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS})}>{estFmt(estTotals.grandTotal)}</div>
                <div data-col style={colStyle("actuals",{width:110,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS})}>{estFmt(actExpenseTotal)}</div>
                <div data-col style={colStyle("finals",{width:110,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS})}>{estFmt(actZohoTotal)}</div>
                <div data-col style={colStyle("variance",{width:110,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS,color:actVariance>=0?"#147d50":"#c0392b"})}>{(actVariance>=0?"+":"")}{estFmt(actVariance)}</div>
              </div>
              {/* Final Invoice bar */}
              <div style={{display:"flex",background:"#1a1a1a",color:"#fff",borderTop:"1px solid #333"}}>
                <div data-col-desc style={{flex:1,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS}}>INVOICE − ACTUALS</div>
                <div data-col style={colStyle("estimate",{width:110,padding:"6px 6px"})}></div>
                <div data-col style={colStyle("actuals",{width:110,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS,color:finalInvoice>=0?"#4caf50":"#ef5350"})}>{(finalInvoice>=0?"+":"")}{estFmt(finalInvoice)}</div>
                <div data-col style={colStyle("finals",{width:110,padding:"6px 6px"})}></div>
                <div data-col style={colStyle("variance",{width:110,padding:"6px 6px"})}></div>
              </div>
            </div>
          )}

          {/* Detail Tab */}
          {trackerTab==="detail" && (
            <div>
              <div data-noprint style={{display:"flex",gap:16,alignItems:"center",marginBottom:12,padding:"6px 0"}}>
                <span style={{fontFamily:EST_F,fontSize:8,fontWeight:700,letterSpacing:EST_LS,color:"#999",textTransform:"uppercase"}}>KEY:</span>
                <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:"#FFF9C4",border:"1px solid #e0d88a",flexShrink:0}}></span><span style={{fontFamily:EST_F,fontSize:8,letterSpacing:EST_LS,color:"#666"}}>TO RECONCILE</span></span>
                <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:"#E8F5E9",border:"1px solid #a5d6a7",flexShrink:0}}></span><span style={{fontFamily:EST_F,fontSize:8,letterSpacing:EST_LS,color:"#666"}}>RECONCILED</span></span>
              </div>
              {actSections.map((sec, si) => {
                const estSec = estSections[si];
                const secEstTotal = estSec ? (estSec.isFees ? estSec.rows.reduce((sum, row) => {
                  const pctMatch = (row.notes || "").match(/(\d+(?:\.\d+)?)%/);
                  if (pctMatch) return sum + estTotals.subtotal * (parseFloat(pctMatch[1]) / 100);
                  return sum + estRowTotal(row);
                }, 0) : estSectionTotal(estSec)) : 0;
                return (
                <div key={si} style={{marginBottom:16}}>
                  {/* Section header — clickable to collapse/expand */}
                  <div onClick={()=>toggleSection(si)} style={{display:"flex",background:"#000",color:"#fff",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS,padding:"4px 0",textTransform:"uppercase",alignItems:"center",cursor:"pointer",userSelect:"none",borderBottom:collapsedSecs[si]?"2px solid #000":"none"}}>
                    <div data-col style={{width:40,padding:"0 6px",flexShrink:0}}>{sec.num}</div>
                    <div data-col-desc style={{flex:1,padding:"0 6px",display:"flex",alignItems:"center",gap:6}}>{sec.title} <span style={{fontSize:8,opacity:0.6}}>{collapsedSecs[si]?"\u25B6":"\u25BC"}</span></div>
                    {!collapsedSecs[si] && <><div data-col style={colStyle("notes",{flex:1,minWidth:80,padding:"0 6px",fontSize:9})}>NOTES</div>
                    <div data-col style={colStyle("days",{width:45,textAlign:"center",padding:"0 4px",flexShrink:0})}>DAYS</div>
                    <div data-col style={colStyle("qty",{width:35,textAlign:"center",padding:"0 4px",flexShrink:0})}>QTY</div>
                    <div data-col style={colStyle("rate",{width:70,textAlign:"right",padding:"0 4px",flexShrink:0})}>RATE</div>
                    <div data-col style={colStyle("estimate",{width:80,textAlign:"right",padding:"0 4px",flexShrink:0})}>ESTIMATE</div>
                    <div data-col style={colStyle("actuals",{width:80,textAlign:"right",padding:"0 4px",flexShrink:0})}>ACTUALS</div>
                    <div data-col style={colStyle("finals",{width:80,textAlign:"right",padding:"0 4px",flexShrink:0})}>FINALS</div>
                    <div data-col style={colStyle("variance",{width:70,textAlign:"right",padding:"0 4px",flexShrink:0})}>VARIANCE</div>
                    <div data-col style={colStyle("status",{width:60,textAlign:"center",padding:"0 4px",flexShrink:0})}>STATUS</div>
                    <div style={{width:24,flexShrink:0}} data-noprint></div>
                    <div style={{width:18,flexShrink:0}} data-noprint></div></>}
                  </div>
                  {/* Rows — hidden when section is collapsed */}
                  {!collapsedSecs[si] && sec.rows.map((row, ri) => {
                    const estRow = estSec?.rows[ri];
                    const isFeeSec = estSec?.isFees;
                    let estVal = estRow ? estRowTotal(estRow) : 0;
                    if (isFeeSec && estRow) {
                      const pctMatch = (estRow.notes || "").match(/(\d+(?:\.\d+)?)%/);
                      if (pctMatch) estVal = estTotals.subtotal * (parseFloat(pctMatch[1]) / 100);
                    }
                    const expTotal = actualsRowExpenseTotal(row);
                    const zohoVal = estNum(row.zohoAmount);
                    const actVal = actualsRowEffective(row);
                    const rv = estVal - actVal;
                    const rowKey = `${si}-${ri}`;
                    const isExpanded = expandedRows[rowKey];
                    return (
                      <Fragment key={ri}>
                        <div
                          onDragOver={e=>{if(dragExp){e.preventDefault();e.dataTransfer.dropEffect="move";setDropTarget({si,ri});}}}
                          onDragLeave={()=>setDropTarget(null)}
                          onDrop={e=>{e.preventDefault();if(dragExp){moveExpense(dragExp.si,dragExp.ri,dragExp.ei,si,ri);setDragExp(null);setDropTarget(null);}}}
                          style={{display:"flex",borderBottom:"1px solid #f0f0f0",alignItems:"stretch",background:dropTarget?.si===si&&dropTarget?.ri===ri?"#e3f2fd":ROW_COLOR_MAP[row.rowColor||(row.highlighted?"toReconcile":"")]||"transparent",transition:"background 0.15s"}}>
                          <div data-col style={{width:40,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:9,color:"#999"}}>{row.ref}</div>
                          <div data-col-desc style={{flex:1,padding:"4px 6px",fontFamily:EST_F,fontSize:10,letterSpacing:EST_LS,minWidth:0}}>{row.desc}</div>
                          <div data-col style={colStyle("notes",{flex:1,minWidth:80,padding:"4px 6px",fontFamily:EST_F,fontSize:9,color:"#666",letterSpacing:EST_LS})}>{row.notes}</div>
                          <div data-col style={colStyle("days",{width:45,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"center",letterSpacing:EST_LS,color:estNum(row.days)>0?"#1a1a1a":"#ccc"})}>{row.days}</div>
                          <div data-col style={colStyle("qty",{width:35,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"center",letterSpacing:EST_LS,color:estNum(row.qty)>0?"#1a1a1a":"#ccc"})}>{row.qty}</div>
                          <div data-col style={colStyle("rate",{width:70,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",letterSpacing:EST_LS,color:estNum(row.rate)>0?"#1a1a1a":"#ccc"})}>{estFmt(estNum(row.rate))}</div>
                          <div data-col style={colStyle("estimate",{width:80,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",letterSpacing:EST_LS,color:estVal>0?"#1a1a1a":"#ccc"})}>{estFmt(estVal)}</div>
                          <div data-col style={colStyle("actuals",{width:80,flexShrink:0})}><EstCell value={row.actualsAmount||String(expTotal||"")} onChange={v2 => updateActRow(si, ri, "actualsAmount", v2)} align="right" /></div>
                          <div data-col style={colStyle("finals",{width:80,flexShrink:0})}><EstCell value={row.zohoAmount} onChange={v2 => updateActRow(si, ri, "zohoAmount", v2)} align="right" /></div>
                          <div data-col style={colStyle("variance",{width:70,flexShrink:0,padding:"4px 6px",fontFamily:EST_F,fontSize:10,textAlign:"right",letterSpacing:EST_LS,fontWeight:600,color:rv>0?"#147d50":rv<0?"#c0392b":"#1a1a1a"})}>{(rv>=0?"+":"") + estFmt(rv)}</div>
                          <div data-col style={colStyle("status",{width:60,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"})}>
                            <span onClick={()=>{const idx=ACTUALS_STATUSES.indexOf(row.status);updateActRow(si,ri,"status",ACTUALS_STATUSES[(idx+1)%ACTUALS_STATUSES.length]);}} style={{fontFamily:EST_F,fontSize:8,fontWeight:700,letterSpacing:0.5,padding:"2px 6px",borderRadius:3,cursor:"pointer",userSelect:"none",background:stBg[row.status]||"transparent",color:stColors[row.status]||"#ccc",textTransform:"uppercase"}}>{row.status||"\u2014"}</span>
                          </div>
                          <div style={{width:24,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}} data-noprint>
                            <span onClick={()=>toggleExpand(rowKey)} style={{cursor:"pointer",fontSize:11,color:"#999",userSelect:"none"}}>{isExpanded?"\u25BE":"\u25B8"}</span>
                          </div>
                          <div style={{width:18,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3}} data-noprint>
                            <span onClick={()=>toggleTally(si,ri)} title="Add to tally" style={{cursor:"pointer",fontSize:9,color:isTallied(si,ri)?"#0066cc":"#ddd",userSelect:"none",lineHeight:1,fontWeight:700}} onMouseEnter={e=>{e.target.style.color="#0066cc"}} onMouseLeave={e=>{if(!isTallied(si,ri))e.target.style.color="#ddd"}}>+</span>
                            <span onClick={()=>cycleRowColor(si,ri)} title="Cycle: To Reconcile / Reconciled / None" style={{cursor:"pointer",fontSize:9,color:ROW_COLOR_DOT[row.rowColor||(row.highlighted?"toReconcile":"")]||"#ddd",userSelect:"none",lineHeight:1}} onMouseEnter={e=>{e.target.style.opacity="0.7"}} onMouseLeave={e=>{e.target.style.opacity="1"}}>{"\u25CF"}</span>
                            <span onClick={()=>deleteActRow(si,ri)} title="Delete row" style={{cursor:"pointer",fontSize:11,color:"#ccc",userSelect:"none",lineHeight:1}} onMouseEnter={e=>{e.target.style.color="#f44"}} onMouseLeave={e=>{e.target.style.color="#ccc"}}>{"\u00d7"}</span>
                          </div>
                        </div>
                        {/* Expandable expenses dropdown */}
                        {isExpanded && (
                          <div style={{background:"#fafafa",borderBottom:"1px solid #eee"}}>
                            {(row.expenses||[]).map((exp, ei) => (
                              <div key={exp.id} draggable data-noprint-drag
                                onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain","");setDragExp({si,ri,ei});}}
                                onDragEnd={()=>{setDragExp(null);setDropTarget(null);}}
                                style={{display:"flex",alignItems:"stretch",borderBottom:"1px solid #f0f0f0",opacity:dragExp?.si===si&&dragExp?.ri===ri&&dragExp?.ei===ei?0.4:1}}>
                                <div data-col style={{width:40,flexShrink:0,padding:"3px 6px",fontFamily:EST_F,fontSize:8,color:"#ccc",display:"flex",alignItems:"center",cursor:"grab"}} title="Drag to move to another line">&#x2630;</div>
                                <div data-col-desc style={{flex:1,minWidth:0}}><EstCell value={exp.desc} onChange={v2 => updateExpense(si, ri, ei, "desc", v2)} style={{fontSize:9,color:"#666"}} /></div>
                                <div data-col style={colStyle("notes",{flex:1,minWidth:80,display:"flex",alignItems:"center",padding:"0 4px",gap:4})}>
                                  {exp.receiptLink ? (
                                    <span style={{display:"flex",alignItems:"center",gap:3,maxWidth:"100%"}}>
                                      <a href={exp.receiptLink} target="_blank" rel="noopener noreferrer" style={{fontFamily:EST_F,fontSize:8,color:"#0066cc",letterSpacing:EST_LS,textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer"}} title={exp.receiptLink}>RECEIPT</a>
                                      <span onClick={()=>updateExpense(si,ri,ei,"receiptLink","")} style={{cursor:"pointer",fontSize:9,color:"#ccc",lineHeight:1}} onMouseEnter={e=>{e.target.style.color="#f44"}} onMouseLeave={e=>{e.target.style.color="#ccc"}}>{"\u00d7"}</span>
                                    </span>
                                  ) : (
                                    <span onClick={()=>handleReceiptLink(si,ri,ei)} style={{fontFamily:EST_F,fontSize:8,color:receiptLoading===`${si}-${ri}-${ei}`?"#999":"#ccc",letterSpacing:EST_LS,cursor:"pointer",userSelect:"none"}} onMouseEnter={e=>{if(receiptLoading!==`${si}-${ri}-${ei}`)e.target.style.color="#0066cc"}} onMouseLeave={e=>{if(receiptLoading!==`${si}-${ri}-${ei}`)e.target.style.color="#ccc"}}>{receiptLoading===`${si}-${ri}-${ei}`?"SCANNING...":"+ RECEIPT"}</span>
                                  )}
                                </div>
                                <div data-col style={colStyle("days",{width:45,flexShrink:0})}></div>
                                <div data-col style={colStyle("qty",{width:35,flexShrink:0})}></div>
                                <div data-col style={colStyle("rate",{width:70,flexShrink:0})}></div>
                                <div data-col style={colStyle("estimate",{width:80,flexShrink:0})}></div>
                                <div data-col style={colStyle("actuals",{width:80,flexShrink:0})}><EstCell value={exp.amount} onChange={v2 => updateExpense(si, ri, ei, "amount", v2)} align="right" /></div>
                                <div data-col style={colStyle("finals",{width:80,flexShrink:0})}></div>
                                <div data-col style={colStyle("variance",{width:70,flexShrink:0})}></div>
                                <div style={colStyle("status",{width:60,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"})}>
                                  <span onClick={()=>{const sts=["","Pending","Paid","Unpaid"];const idx=sts.indexOf(exp.status||"");updateExpense(si,ri,ei,"status",sts[(idx+1)%sts.length]);}} style={{fontFamily:EST_F,fontSize:8,fontWeight:700,letterSpacing:0.5,padding:"2px 6px",borderRadius:3,cursor:"pointer",userSelect:"none",textTransform:"uppercase",background:({"":"transparent",Pending:"#fff8e8",Paid:"#edfaf3",Unpaid:"#fff3f0"})[exp.status||""]||"transparent",color:({"":"#ccc",Pending:"#92680a",Paid:"#147d50",Unpaid:"#c0392b"})[exp.status||""]||"#ccc"}}>{exp.status||"\u2014"}</span>
                                </div>
                                <div style={{width:24,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}} data-noprint>
                                  <span onClick={()=>deleteExpense(si, ri, ei)} style={{cursor:"pointer",fontSize:11,color:"#ccc"}} onMouseEnter={e=>{e.target.style.color="#f44"}} onMouseLeave={e=>{e.target.style.color="#ccc"}}>{"\u00d7"}</span>
                                </div>
                                <div style={{width:18,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}} data-noprint>
                                  <span onClick={()=>toggleTally(si,ri,ei)} title="Add to tally" style={{cursor:"pointer",fontSize:9,color:isTallied(si,ri,ei)?"#0066cc":"#ddd",userSelect:"none",lineHeight:1,fontWeight:700}} onMouseEnter={e=>{e.target.style.color="#0066cc"}} onMouseLeave={e=>{if(!isTallied(si,ri,ei))e.target.style.color="#ddd"}}>+</span>
                                </div>
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
                  {/* Section total — hidden when collapsed */}
                  {!collapsedSecs[si] && <div style={{display:"flex",justifyContent:"flex-end",borderBottom:"2px solid #000"}}>
                    <div style={{display:"flex",gap:0,padding:"4px 0"}}>
                      <div style={{fontFamily:EST_F,fontSize:10,fontWeight:700,padding:"0 8px",letterSpacing:EST_LS}}>TOTAL</div>
                      <div data-col style={colStyle("estimate",{width:80,fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",padding:"0 6px",letterSpacing:EST_LS})}>{estFmt(secEstTotal)}</div>
                      <div data-col style={colStyle("actuals",{width:80,fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",padding:"0 6px",letterSpacing:EST_LS,color:"#0066cc"})}>{estFmt(actualsSectionExpenseTotal(sec))}</div>
                      <div data-col style={colStyle("finals",{width:80,fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",padding:"0 6px",letterSpacing:EST_LS})}>{estFmt(actualsSectionZohoTotal(sec))}</div>
                      <div data-col style={colStyle("variance",{width:70,fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",padding:"0 6px",letterSpacing:EST_LS,color:(secEstTotal-actualsSectionEffective(sec))>=0?"#147d50":"#c0392b"})}>{(secEstTotal-actualsSectionEffective(sec)>=0?"+":"")}{estFmt(secEstTotal-actualsSectionEffective(sec))}</div>
                      <div data-col style={colStyle("status",{width:60})}></div>
                      <div style={{width:24}}></div>
                      <div style={{width:18}}></div>
                    </div>
                  </div>}
                </div>
                ); })}

              {/* Grand total bar */}
              <div style={{display:"flex",background:"#000",color:"#fff",marginTop:4}}>
                <div data-col-desc style={{flex:1,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS,textAlign:"right"}}>GRAND TOTAL</div>
                <div data-col style={colStyle("estimate",{width:80,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS})}>{estFmt(estTotals.grandTotal)}</div>
                <div data-col style={colStyle("actuals",{width:80,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS})}>{estFmt(actExpenseTotal)}</div>
                <div data-col style={colStyle("finals",{width:80,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS})}>{estFmt(actZohoTotal)}</div>
                <div data-col style={colStyle("variance",{width:70,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS})}>{(actVariance>=0?"+":"")}{estFmt(actVariance)}</div>
                <div data-col style={colStyle("status",{width:60})}></div>
                <div style={{width:24}}></div>
                <div style={{width:18}}></div>
              </div>
              {/* Final Invoice bar */}
              <div style={{display:"flex",background:"#1a1a1a",color:"#fff",borderTop:"1px solid #333"}}>
                <div data-col-desc style={{flex:1,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,letterSpacing:EST_LS,textAlign:"right"}}>INVOICE − ACTUALS</div>
                <div data-col style={colStyle("estimate",{width:80,padding:"6px 6px"})}></div>
                <div data-col style={colStyle("actuals",{width:80,padding:"6px 6px",fontFamily:EST_F,fontSize:10,fontWeight:700,textAlign:"right",letterSpacing:EST_LS,color:finalInvoice>=0?"#4caf50":"#ef5350"})}>{(finalInvoice>=0?"+":"")}{estFmt(finalInvoice)}</div>
                <div data-col style={colStyle("finals",{width:80,padding:"6px 6px"})}></div>
                <div data-col style={colStyle("variance",{width:70,padding:"6px 6px"})}></div>
                <div data-col style={colStyle("status",{width:60})}></div>
                <div style={{width:24}}></div>
                <div style={{width:18}}></div>
              </div>
            </div>
          )}

        </div>
      </div>
      </div>

      {/* Receipt OCR confirmation modal */}
      {receiptOcrResult && (
        <div onClick={()=>setReceiptOcrResult(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:14,padding:"24px 28px",width:380,maxWidth:"90vw",boxShadow:"0 20px 50px rgba(0,0,0,0.2)",fontFamily:EST_F}}>
            <div style={{fontSize:13,fontWeight:700,color:"#1d1d1f",marginBottom:16,letterSpacing:"-0.02em"}}>Sync Data from Receipt?</div>
            <div style={{fontSize:11,color:"#666",marginBottom:12,letterSpacing:EST_LS}}>The following was extracted from the receipt:</div>
            <div style={{background:"#f8f8f8",borderRadius:8,padding:"12px 14px",marginBottom:16}}>
              {receiptOcrResult.vendor && <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:10,color:"#999",fontWeight:600,letterSpacing:EST_LS}}>VENDOR</span><span style={{fontSize:11,color:"#1a1a1a",fontWeight:600}}>{receiptOcrResult.vendor}</span></div>}
              {receiptOcrResult.description && <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:10,color:"#999",fontWeight:600,letterSpacing:EST_LS}}>DESCRIPTION</span><span style={{fontSize:11,color:"#1a1a1a"}}>{receiptOcrResult.description}</span></div>}
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:10,color:"#999",fontWeight:600,letterSpacing:EST_LS}}>AMOUNT</span><span style={{fontSize:13,color:"#1a1a1a",fontWeight:700}}>{receiptOcrResult.currency} {parseFloat(receiptOcrResult.amount).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setReceiptOcrResult(null)} style={{background:"#f5f5f7",border:"1px solid #ddd",color:"#666",padding:"8px 16px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:EST_F,letterSpacing:EST_LS}}>SKIP</button>
              <button onClick={applyReceiptOcr} style={{background:"#000",border:"none",color:"#fff",padding:"8px 16px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:EST_F,letterSpacing:EST_LS}}>SYNC DATA</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating tally scratchpad */}
      {tallyItems.length > 0 && (
        <div data-noprint style={{position:"fixed",bottom:24,right:24,width:320,background:"#fff",border:"1px solid #ddd",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",zIndex:9000,fontFamily:EST_F,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#f8f8f8",borderBottom:"1px solid #eee"}}>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:EST_LS,textTransform:"uppercase",color:"#666"}}>TALLY ({tallyItems.length} items)</span>
            <span onClick={()=>setTallyItems([])} style={{fontSize:9,fontWeight:700,letterSpacing:EST_LS,color:"#999",cursor:"pointer",textTransform:"uppercase"}} onMouseEnter={e=>{e.target.style.color="#f44"}} onMouseLeave={e=>{e.target.style.color="#999"}}>CLEAR</span>
          </div>
          <div style={{maxHeight:240,overflowY:"auto",padding:"6px 0"}}>
            {tallyItems.map(t => (
              <div key={t.key} style={{display:"flex",alignItems:"center",padding:"4px 14px",gap:8,borderBottom:"1px solid #f5f5f5"}}>
                <span onClick={()=>setTallyItems(prev=>prev.filter(x=>x.key!==t.key))} style={{cursor:"pointer",fontSize:11,color:"#ccc",flexShrink:0}} onMouseEnter={e=>{e.target.style.color="#f44"}} onMouseLeave={e=>{e.target.style.color="#ccc"}}>{"\u00d7"}</span>
                <span style={{fontSize:8,color:"#999",fontWeight:700,letterSpacing:EST_LS,flexShrink:0,width:28}}>{t.ref}</span>
                <span style={{fontSize:9,color:"#333",letterSpacing:EST_LS,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.desc}</span>
                <span style={{fontSize:9,fontWeight:600,letterSpacing:EST_LS,color:"#1a1a1a",flexShrink:0,textAlign:"right",minWidth:60}}>{estFmt(t.estimate)}</span>
              </div>
            ))}
          </div>
          <div style={{borderTop:"2px solid #000",padding:"8px 14px",display:"flex",flexDirection:"column",gap:4}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:9,fontWeight:700,letterSpacing:EST_LS,color:"#666",textTransform:"uppercase"}}>Estimate Total</span>
              <span style={{fontSize:10,fontWeight:700,letterSpacing:EST_LS,color:"#1a1a1a"}}>{estFmt(tallyEstTotal)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:9,fontWeight:700,letterSpacing:EST_LS,color:"#666",textTransform:"uppercase"}}>Actuals Total</span>
              <span style={{fontSize:10,fontWeight:700,letterSpacing:EST_LS,color:"#0066cc"}}>{estFmt(tallyActTotal)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid #eee",paddingTop:4}}>
              <span style={{fontSize:9,fontWeight:700,letterSpacing:EST_LS,color:"#666",textTransform:"uppercase"}}>Difference</span>
              <span style={{fontSize:10,fontWeight:700,letterSpacing:EST_LS,color:(tallyEstTotal-tallyActTotal)>=0?"#147d50":"#c0392b"}}>{(tallyEstTotal-tallyActTotal>=0?"+":"")}{estFmt(tallyEstTotal-tallyActTotal)}</span>
            </div>
          </div>
        </div>
      )}
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
                <div style={{position:"absolute",top:36,right:0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:200,overflow:"hidden"}}>
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,est:false}));addEstNew();}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Blank</div>
                  {estimates.length>0&&<div onClick={()=>{setCreateMenuOpen(prev=>({...prev,est:false}));pushUndo("duplicate estimate");const prev2=estimates[estimates.length-1];const dup={...JSON.parse(JSON.stringify(prev2)),id:Date.now()};dup.ts={...dup.ts,version:`PRODUCTION ESTIMATE ${versionLabels[estimates.length]||`V${estimates.length+1}`}`};setProjectEstimates(prev=>({...prev,[p.id]:[...(prev[p.id]||[]),dup]}));}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Previous</div>}
                  <div onClick={()=>{setCreateMenuOpen(prev=>({...prev,est:false}));setDuplicateModal({type:"estimate"});setDuplicateSearch("");}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Copy from Project</div>
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
