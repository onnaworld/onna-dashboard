import React, { useState, useRef, useMemo, useCallback } from "react";
import { CSLogoSlot } from "./ui/DocHelpers";
import { PRINT_CLEANUP_CSS } from "../utils/helpers";

/* ── Branded constants (matching estimates/callsheets) ── */
const F = "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
const LS = 0.5;
const LS_HDR = 1.5;
const MONTHS = ["Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun"];

const CASHFLOW_INIT = () => ({
  id: Date.now(),
  label: "Cash Flow V1",
  prodLogo: null,
  clientLogo: null,
  currency: "AED",
  financialYear: "2025 – 2026",
  openingBalance: 0,
  vatRate: 5,
  inflows: [
    { label: "Client Fees / Project Revenue", v: Array(12).fill("") },
    { label: "Retainer Income", v: Array(12).fill("") },
    { label: "Licensing & Syndication", v: Array(12).fill("") },
    { label: "Grants & Funding", v: Array(12).fill("") },
    { label: "Other Income", v: Array(12).fill("") },
  ],
  outflows: [
    { label: "Salaries & Freelance Crew", v: Array(12).fill("") },
    { label: "Equipment & Rentals", v: Array(12).fill("") },
    { label: "Travel & Accommodation", v: Array(12).fill("") },
    { label: "Post Production", v: Array(12).fill("") },
    { label: "Software & Subscriptions", v: Array(12).fill("") },
    { label: "Marketing & Distribution", v: Array(12).fill("") },
    { label: "Office & Studio Rent", v: Array(12).fill("") },
    { label: "Insurance", v: Array(12).fill("") },
    { label: "Legal & Professional Fees", v: Array(12).fill("") },
    { label: "Overheads & Admin", v: Array(12).fill("") },
  ],
  capex: [
    { label: "Equipment Purchases", v: Array(12).fill("") },
    { label: "Software Licences (one-off)", v: Array(12).fill("") },
  ],
  notes: "",
});

export default function Finance({
  T, isMobile,
  allProjectsMerged, localLeads,
  getProjRevenue, getProjCost,
  apiLoading,
  cashFlowStore, setCashFlowStore,
  activeCashFlowVersion, setActiveCashFlowVersion,
  debouncedDocSave,
  allProjects,
}) {
  const [financeTab, setFinanceTab] = useState("overview");

  /* ── Overview sub-tab (original Finance KPIs) ── */
  const projects2026 = allProjectsMerged.filter(p => p.year === 2026);
  const rev2026 = projects2026.reduce((a, b) => a + getProjRevenue(b), 0);
  const profit2026 = projects2026.reduce((a, b) => a + (getProjRevenue(b) - getProjCost(b)), 0);
  const totalPipeline = localLeads.reduce((a, b) => a + (b.value || 0), 0);
  const newCount = localLeads.filter(l => l.status === "not_contacted" || l.status === "cold").length;
  const totalRev = allProjectsMerged.reduce((a, b) => a + getProjRevenue(b), 0);
  const totalProfit = allProjectsMerged.reduce((a, b) => a + (getProjRevenue(b) - getProjCost(b)), 0);
  const avgMargin = totalRev > 0 ? Math.round((totalProfit / totalRev) * 100) : 0;

  const subTabs = [
    { key: "overview", label: "Overview" },
    { key: "cashflow", label: "Cash Flow" },
  ];

  return (
    <div>
      {/* ── Sub-tab bar ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
        {subTabs.map(st => (
          <button key={st.key} onClick={() => setFinanceTab(st.key)}
            style={{
              padding: "7px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: financeTab === st.key ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
              background: financeTab === st.key ? T.accent : T.surface,
              color: financeTab === st.key ? "#fff" : T.text,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}>{st.label}</button>
        ))}
      </div>

      {financeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: isMobile ? 10 : 14, marginBottom: isMobile ? 16 : 22 }}>
          {[
            { label: "Projects 2026", value: projects2026.length, sub: projects2026.filter(p => p.status === "Active").length + " active" },
            { label: "Revenue 2026", value: "AED " + (rev2026 / 1000).toFixed(0) + "k", sub: "all projects this year" },
            { label: "Profit 2026", value: "AED " + (profit2026 / 1000).toFixed(0) + "k", sub: (rev2026 ? Math.round((profit2026 / rev2026) * 100) : 0) + "% margin" },
            { label: "Pipeline", value: apiLoading ? "\u2014" : "AED " + (totalPipeline / 1000).toFixed(0) + "k", sub: newCount + " new leads" },
            { label: "Total Revenue", value: "AED " + (totalRev / 1000).toFixed(0) + "k", sub: "all projects" },
            { label: "Total Profit", value: "AED " + (totalProfit / 1000).toFixed(0) + "k", sub: avgMargin + "% avg margin" },
          ].map((s, i) => (
            <div key={i} style={{ borderRadius: 16, padding: "20px 22px", background: T.surface, border: "1px solid " + T.border, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", color: T.muted, marginBottom: 10 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: "-0.02em", marginBottom: s.sub ? 4 : 0 }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: 12, color: T.sub }}>{s.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {financeTab === "cashflow" && (
        <CashFlowDoc
          T={T} isMobile={isMobile}
          cashFlowStore={cashFlowStore} setCashFlowStore={setCashFlowStore}
          activeCashFlowVersion={activeCashFlowVersion} setActiveCashFlowVersion={setActiveCashFlowVersion}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Cash Flow Document Component — Monthly Tracker
   ═══════════════════════════════════════════════════════════════════════════════ */
function CashFlowDoc({ T, isMobile, cashFlowStore, setCashFlowStore, activeCashFlowVersion, setActiveCashFlowVersion }) {
  const pid = "_global";
  const versions = cashFlowStore[pid] || [];
  const vIdx = activeCashFlowVersion != null ? Math.min(activeCashFlowVersion, versions.length - 1) : (versions.length > 0 ? 0 : -1);
  const data = vIdx >= 0 ? versions[vIdx] : null;

  // Auto-create first version if none exist
  React.useEffect(() => {
    if (versions.length === 0) {
      const newV = CASHFLOW_INIT();
      const logoImg = new Image(); logoImg.crossOrigin = "anonymous";
      logoImg.onload = () => { try { const cv = document.createElement("canvas"); cv.width = logoImg.naturalWidth; cv.height = logoImg.naturalHeight; cv.getContext("2d").drawImage(logoImg, 0, 0); newV.prodLogo = cv.toDataURL("image/png"); } catch {} };
      logoImg.src = "/onna-default-logo.png";
      setCashFlowStore(prev => {
        const store = JSON.parse(JSON.stringify(prev));
        if (!store[pid]) store[pid] = [];
        store[pid].push(newV);
        return store;
      });
      setActiveCashFlowVersion(0);
    }
  }, []); // eslint-disable-line

  const update = useCallback((key, val) => {
    if (vIdx < 0) return;
    setCashFlowStore(prev => {
      const store = JSON.parse(JSON.stringify(prev));
      const arr = store[pid] || [];
      const idx = Math.min(vIdx, arr.length - 1);
      if (idx < 0) return prev;
      if (typeof key === "function") { arr[idx] = key(arr[idx]); }
      else { arr[idx][key] = val; }
      store[pid] = arr;
      return store;
    });
  }, [pid, vIdx, setCashFlowStore]);

  const addVersion = () => {
    const newV = CASHFLOW_INIT();
    newV.label = `Cash Flow V${versions.length + 1}`;
    const logoImg = new Image(); logoImg.crossOrigin = "anonymous";
    logoImg.onload = () => { try { const cv = document.createElement("canvas"); cv.width = logoImg.naturalWidth; cv.height = logoImg.naturalHeight; cv.getContext("2d").drawImage(logoImg, 0, 0); newV.prodLogo = cv.toDataURL("image/png"); } catch {} };
    logoImg.src = "/onna-default-logo.png";
    setCashFlowStore(prev => {
      const store = JSON.parse(JSON.stringify(prev));
      if (!store[pid]) store[pid] = [];
      store[pid].push(newV);
      return store;
    });
    setActiveCashFlowVersion(versions.length);
  };

  const deleteVersion = (idx) => {
    if (!window.confirm("Delete this cash flow version?")) return;
    setCashFlowStore(prev => {
      const store = JSON.parse(JSON.stringify(prev));
      const arr = store[pid] || [];
      arr.splice(idx, 1);
      if (arr.length === 0) delete store[pid];
      else store[pid] = arr;
      return store;
    });
    setActiveCashFlowVersion(prev => prev >= idx ? Math.max(0, (prev || 0) - 1) : prev);
  };

  /* ── Helpers ── */
  const pv = (v) => parseFloat(String(v).replace(/[^0-9.\-]/g, "")) || 0;

  const fmt = useCallback((n) => {
    if (!data) return "0";
    const c = data.currency || "AED";
    const abs = Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return (c === "AED" ? "AED " : c === "GBP" ? "£" : c === "USD" ? "$" : "€") + abs;
  }, [data]);

  const fmtSigned = useCallback((n) => {
    return n < 0 ? "(" + fmt(Math.abs(n)) + ")" : fmt(n);
  }, [fmt]);

  /* ── Calculations ── */
  const calcs = useMemo(() => {
    if (!data) return null;
    const sumCols = (arr) => {
      const cols = Array(12).fill(0);
      (arr || []).forEach(row => { (row.v || []).forEach((v, m) => { cols[m] += pv(v); }); });
      return cols;
    };
    const rowTotal = (row) => (row.v || []).reduce((s, v) => s + pv(v), 0);

    const inC = sumCols(data.inflows);
    const outC = sumCols(data.outflows);
    const capC = sumCols(data.capex);
    const inA = inC.reduce((a, b) => a + b, 0);
    const outA = outC.reduce((a, b) => a + b, 0);
    const capA = capC.reduce((a, b) => a + b, 0);

    const vr = (data.vatRate || 0) / 100;
    const vatC = inC.map((v, m) => { const net = v - outC[m]; return net > 0 ? net * vr : 0; });
    const vatA = vatC.reduce((a, b) => a + b, 0);

    const netC = inC.map((v, m) => v - outC[m] - capC[m]);
    const netA = inA - outA - capA;

    const ob = pv(data.openingBalance);
    const closeC = [];
    let run = ob;
    for (let m = 0; m < 12; m++) { run += netC[m]; closeC.push(run); }

    return { inC, outC, capC, inA, outA, capA, vatC, vatA, netC, netA, ob, closeC, rowTotal };
  }, [data]);

  /* ── Row mutation helpers ── */
  const setVal = (type, i, m, val) => {
    update(d => {
      const arr = [...d[type]];
      const row = { ...arr[i], v: [...arr[i].v] };
      const n = pv(val);
      row.v[m] = n === 0 ? "" : String(n);
      arr[i] = row;
      return { ...d, [type]: arr };
    });
  };

  const setLabel = (type, i, val) => {
    update(d => {
      const arr = [...d[type]];
      arr[i] = { ...arr[i], label: val };
      return { ...d, [type]: arr };
    });
  };

  const addRow = (type) => {
    const labels = { inflows: "New Inflow", outflows: "New Outflow", capex: "New CapEx" };
    update(d => ({
      ...d,
      [type]: [...d[type], { label: labels[type], v: Array(12).fill("") }],
    }));
  };

  const delRow = (type, i) => {
    update(d => ({
      ...d,
      [type]: d[type].filter((_, idx) => idx !== i),
    }));
  };

  /* ── Print / PDF ── */
  const handlePrint = () => {
    if (!data || !calcs) return;
    const c = calcs;
    const cur = data.currency || "AED";
    const _fmt = (n) => {
      const abs = Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      return (cur === "AED" ? "AED " : cur === "GBP" ? "£" : cur === "USD" ? "$" : "€") + abs;
    };
    const _fmtS = (n) => n < 0 ? "(" + _fmt(Math.abs(n)) + ")" : _fmt(n);
    const logoHtml = (src) => src ? `<img src="${src}" style="max-height:30px;max-width:120px;object-fit:contain"/>` : "";
    const thH = MONTHS.map(m => `<th style="font-family:${F};font-size:8px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;border-bottom:2.5px solid #000;padding:6px 4px;text-align:right;white-space:nowrap">${m}</th>`).join("");
    const sectionRows = (arr, prefix) => arr.map((row, i) => {
      const rt = c.rowTotal(row);
      return `<tr><td style="font-family:${F};font-size:11px;padding:5px 0;border-bottom:1px solid #f0f0f0">${row.label}</td>${row.v.map(v => `<td style="font-family:${F};font-size:11px;text-align:right;padding:5px 4px;border-bottom:1px solid #f0f0f0">${pv(v) ? _fmt(pv(v)) : "—"}</td>`).join("")}<td style="font-family:${F};font-size:11px;font-weight:600;text-align:right;padding:5px 0;border-bottom:1px solid #f0f0f0">${rt ? _fmt(rt) : "—"}</td></tr>`;
    }).join("");
    const subRow = (label, cols, annual) => `<tr><td style="font-family:${F};font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:#f4f4f2;border-top:1.5px solid #bbb;border-bottom:1.5px solid #bbb;padding:7px 0">${label}</td>${cols.map(v => `<td style="font-family:${F};font-size:9px;font-weight:700;text-transform:uppercase;background:#f4f4f2;border-top:1.5px solid #bbb;border-bottom:1.5px solid #bbb;padding:7px 4px;text-align:right">${v ? _fmt(v) : "—"}</td>`).join("")}<td style="font-family:${F};font-size:9px;font-weight:700;text-transform:uppercase;background:#f4f4f2;border-top:1.5px solid #bbb;border-bottom:1.5px solid #bbb;padding:7px 0;text-align:right">${annual ? _fmt(annual) : "—"}</td></tr>`;
    const banner = (t) => `<tr><td colspan="14" style="font-family:${F};font-size:8px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;background:#000;color:#fff;padding:6px 0">${t}</td></tr>`;

    const html = `<!DOCTYPE html><html><head><style>@page{size:A4 landscape;margin:14mm 12mm}body{font-family:${F};color:#000;margin:0;padding:0;-webkit-font-smoothing:antialiased}table{width:100%;border-collapse:collapse}</style></head><body><div style="max-width:1440px;margin:0 auto;padding:40px 40px"><div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:4px">${logoHtml(data.prodLogo)}<div style="display:flex;gap:16px;align-items:center">${logoHtml(data.clientLogo)}</div></div><div style="border-top:2.5px solid #000;margin-bottom:16px"></div><div style="font-family:${F};font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:14px">Cash Flow Tracker</div><div style="border-top:1px solid #ccc;margin-bottom:14px"></div><div style="display:grid;grid-template-columns:repeat(6,1fr);border:1px solid #e0e0e0;margin-bottom:22px">${[
      { l: "Opening Balance", v: _fmt(c.ob) },
      { l: "Total Inflows", v: _fmt(c.inA), cls: "color:#1a6e3e" },
      { l: "Total Outflows", v: _fmt(c.outA + c.capA), cls: "color:#b0271d" },
      { l: "VAT Liability", v: _fmt(c.vatA), cls: "color:#b06000" },
      { l: "Net Cash Flow", v: _fmtS(c.netA), cls: c.netA >= 0 ? "color:#1a6e3e" : "color:#b0271d" },
      { l: "Year-End Balance", v: _fmtS(c.closeC[11] || 0), cls: (c.closeC[11] || 0) >= 0 ? "color:#1a6e3e" : "color:#b0271d" },
    ].map(s => `<div style="padding:11px 14px;border-right:1px solid #e0e0e0"><div style="font-family:${F};font-size:7.5px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#999;margin-bottom:4px">${s.l}</div><div style="font-family:${F};font-size:16px;font-weight:700;${s.cls || ""}">${s.v}</div></div>`).join("")}</div><table><thead><tr><th style="font-family:${F};font-size:8px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;border-bottom:2.5px solid #000;padding:6px 0;text-align:left;width:210px">Category</th>${thH}<th style="font-family:${F};font-size:8px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;border-bottom:2.5px solid #000;padding:6px 4px;text-align:right;width:105px">Annual Total</th></tr></thead><tbody><tr><td style="font-family:${F};font-size:11px;font-weight:600;background:#f9f9f7;border-bottom:1px solid #e8e8e8;padding:6px 0">Opening Balance</td>${Array(12).fill(0).map((_, m) => `<td style="font-family:${F};font-size:11px;background:#f9f9f7;border-bottom:1px solid #e8e8e8;padding:6px 4px;text-align:right">${m === 0 && c.ob ? _fmt(c.ob) : "—"}</td>`).join("")}<td style="font-family:${F};font-size:11px;background:#f9f9f7;border-bottom:1px solid #e8e8e8;padding:6px 0;text-align:right;font-weight:600">${c.ob ? _fmt(c.ob) : "—"}</td></tr>${banner("Operating Inflows")}${sectionRows(data.inflows)}${subRow("Total Inflows", c.inC, c.inA)}${banner("Operating Outflows")}${sectionRows(data.outflows)}${subRow("Total Outflows", c.outC, c.outA)}${banner("Capital Expenditure")}${sectionRows(data.capex)}${subRow("Total CapEx", c.capC, c.capA)}<tr><td style="font-family:${F};font-size:9px;font-weight:600;background:#fffbf0;border-top:1px solid #e8dfc0;border-bottom:1px solid #e8dfc0;padding:7px 0;color:#b06000">VAT Liability (on Net Revenue)</td>${c.vatC.map(v => `<td style="font-family:${F};font-size:9px;font-weight:600;background:#fffbf0;border-top:1px solid #e8dfc0;border-bottom:1px solid #e8dfc0;padding:7px 4px;text-align:right;color:#b06000">${v ? _fmt(v) : "—"}</td>`).join("")}<td style="font-family:${F};font-size:9px;font-weight:600;background:#fffbf0;border-top:1px solid #e8dfc0;border-bottom:1px solid #e8dfc0;padding:7px 0;text-align:right;color:#b06000">${c.vatA ? _fmt(c.vatA) : "—"}</td></tr><tr><td style="font-family:${F};font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:#000;color:#fff;padding:8px 0">Net Cash Flow</td>${c.netC.map(v => `<td style="font-family:${F};font-size:9px;font-weight:700;text-transform:uppercase;background:#000;padding:8px 4px;text-align:right;color:${v >= 0 ? "#7dffc4" : "#ffaaaa"}">${v ? _fmtS(v) : "—"}</td>`).join("")}<td style="font-family:${F};font-size:9px;font-weight:700;text-transform:uppercase;background:#000;padding:8px 0;text-align:right;color:${c.netA >= 0 ? "#7dffc4" : "#ffaaaa"}">${c.netA ? _fmtS(c.netA) : "—"}</td></tr><tr><td style="font-family:${F};font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:#2a2a2a;color:#fff;border-top:2px solid #000;padding:8px 0">Closing Balance</td>${c.closeC.map(v => `<td style="font-family:${F};font-size:9px;font-weight:700;text-transform:uppercase;background:#2a2a2a;border-top:2px solid #000;padding:8px 4px;text-align:right;color:${v >= 0 ? "#7dffc4" : "#ffaaaa"}">${_fmtS(v)}</td>`).join("")}<td style="font-family:${F};font-size:9px;font-weight:700;text-transform:uppercase;background:#2a2a2a;border-top:2px solid #000;padding:8px 0;text-align:right;color:${(c.closeC[11]||0) >= 0 ? "#7dffc4" : "#ffaaaa"}">${_fmtS(c.closeC[11]||0)}</td></tr></tbody></table>${data.notes ? `<div style="margin-top:22px;padding-top:12px;border-top:1px solid #e0e0e0"><div style="font-family:${F};font-size:8.5px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:6px">Notes</div><div style="font-family:${F};font-size:11px;color:#555;white-space:pre-wrap;line-height:1.7">${data.notes}</div></div>` : ""}<div style="margin-top:18px;padding-top:10px;border-top:1px solid #e8e8e8;display:flex;justify-content:space-between;font-family:${F};font-size:8px;letter-spacing:0.1em;text-transform:uppercase;color:#bbb"><span>onnaworld — onna.digital</span><span>${new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</span></div></div></body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  /* ── Styles ── */
  const hdrS = { fontFamily: F, fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", borderBottom: "2.5px solid #000", padding: "6px 4px", textAlign: "right", whiteSpace: "nowrap" };
  const cellS = { fontFamily: F, fontSize: 11, padding: "2px 4px", textAlign: "right", borderBottom: "1px solid #f0f0f0", verticalAlign: "middle" };
  const inputS = { fontFamily: F, fontSize: 11, border: "none", background: "transparent", outline: "none", textAlign: "right", width: "100%", color: "#333", padding: "3px 0" };
  const labelInputS = { fontFamily: F, fontSize: 11, border: "none", background: "transparent", outline: "none", color: "#000", width: 190 };
  const subS = { fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "#f4f4f2", borderTop: "1.5px solid #bbb", borderBottom: "1.5px solid #bbb", padding: "7px 4px", textAlign: "right" };
  const ctrlLblS = { fontFamily: F, fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#999", marginRight: 2 };
  const ctrlSelS = { fontFamily: F, fontSize: 11, border: "1px solid #ccc", background: "#fff", padding: "5px 8px", outline: "none", color: "#000", cursor: "pointer" };
  const ctrlInpS = { fontFamily: F, fontSize: 11, border: "1px solid #ccc", padding: "5px 8px", outline: "none", color: "#000" };

  /* ── Render section rows ── */
  const renderSection = (type, sectionLabel) => {
    const arr = data[type] || [];
    return (
      <>
        {/* Banner */}
        <tr><td colSpan={14} style={{ fontFamily: F, fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", background: "#000", color: "#fff", padding: "6px 0" }}>{sectionLabel}</td></tr>
        {/* Data rows */}
        {arr.map((row, i) => {
          const rt = calcs.rowTotal(row);
          return (
            <tr key={type + i} onMouseEnter={e => e.currentTarget.querySelector(".cf-del")&& (e.currentTarget.querySelector(".cf-del").style.visibility = "visible")} onMouseLeave={e => e.currentTarget.querySelector(".cf-del") && (e.currentTarget.querySelector(".cf-del").style.visibility = "hidden")}>
              <td style={{ ...cellS, textAlign: "left", padding: "5px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button className="cf-del" onClick={() => delRow(type, i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 15, lineHeight: 1, padding: 0, visibility: "hidden", flexShrink: 0 }} onMouseEnter={e => e.target.style.color = "#b0271d"} onMouseLeave={e => e.target.style.color = "#ccc"}>×</button>
                  <input value={row.label} onChange={e => setLabel(type, i, e.target.value)} style={labelInputS} placeholder="Label…" onFocus={e => e.target.style.borderBottom = "1px solid #bbb"} onBlur={e => e.target.style.borderBottom = "none"} />
                </div>
              </td>
              {row.v.map((v, m) => (
                <td key={m} style={cellS}>
                  <input value={v} onChange={e => setVal(type, i, m, e.target.value)} style={inputS} placeholder="0" inputMode="numeric" onFocus={e => { e.target.style.background = "#f0f5ff"; e.target.style.borderRadius = "2px"; }} onBlur={e => { e.target.style.background = "transparent"; }} />
                </td>
              ))}
              <td style={{ ...cellS, fontWeight: 600, padding: "5px 0" }}>{rt ? fmt(rt) : "—"}</td>
            </tr>
          );
        })}
        {/* Add row */}
        <tr><td colSpan={14} style={{ padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
          <button onClick={() => addRow(type)} style={{ fontFamily: F, fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#bbb", background: "none", border: "1px dashed #ddd", padding: "4px 10px", cursor: "pointer" }} onMouseEnter={e => { e.target.style.color = "#000"; e.target.style.borderColor = "#999"; }} onMouseLeave={e => { e.target.style.color = "#bbb"; e.target.style.borderColor = "#ddd"; }}>+ Add row</button>
        </td></tr>
      </>
    );
  };

  return (
    <div>
      {/* ── Version bar + Print ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, overflowX: "auto", whiteSpace: "nowrap", flexShrink: 0 }}>
            {versions.map((v, idx) => {
              const isActive = vIdx === idx;
              return (
                <div key={v.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: isActive ? `1px solid ${T.accent}` : `1px solid ${T.border}`, background: isActive ? (T.accent + "18") : T.surface, color: isActive ? T.accent : T.muted, transition: "all 0.15s", flexShrink: 0 }}>
                  <span onClick={() => setActiveCashFlowVersion(idx)}>{v.label}</span>
                  {versions.length > 1 && <span onClick={(e) => { e.stopPropagation(); deleteVersion(idx); }} style={{ marginLeft: 2, fontSize: 10, color: "#999", cursor: "pointer", lineHeight: 1 }} title="Delete version">&times;</span>}
                </div>
              );
            })}
            <div onClick={addVersion} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 8, border: `1.5px dashed ${T.border}`, background: "transparent", fontSize: 14, color: "#999", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }} title="New Version">+</div>
            {data && <button onClick={handlePrint} style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>Print / PDF</button>}
          </div>

          {data && calcs && (
            <div>
              {/* ── Logo header ── */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
                <CSLogoSlot label="Production Logo" image={data.prodLogo} onUpload={v => update("prodLogo", v)} onRemove={() => update("prodLogo", null)} />
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <CSLogoSlot label="Agency Logo" image={data.clientLogo} onUpload={v => update("clientLogo", v)} onRemove={() => update("clientLogo", null)} />
                </div>
              </div>
              <div style={{ borderTop: "2.5px solid #000", marginBottom: 16 }} />

              {/* ── Doc title ── */}
              <div style={{ fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 14 }}>Cash Flow Tracker</div>
              <div style={{ borderTop: "1px solid #ccc", marginBottom: 14 }} />

              {/* ── Controls ── */}
              <div style={{ display: "flex", gap: 6, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
                <span style={ctrlLblS}>Currency</span>
                <select value={data.currency || "AED"} onChange={e => update("currency", e.target.value)} style={ctrlSelS}>
                  <option value="AED">AED</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
                <span style={{ margin: "0 12px", color: "#ddd" }}>|</span>
                <span style={ctrlLblS}>Financial Year</span>
                <select value={data.financialYear || "2025 – 2026"} onChange={e => update("financialYear", e.target.value)} style={ctrlSelS}>
                  {["2024 – 2025", "2025 – 2026", "2026 – 2027", "2027 – 2028"].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span style={{ margin: "0 12px", color: "#ddd" }}>|</span>
                <span style={ctrlLblS}>Opening Balance</span>
                <input value={data.openingBalance || ""} onChange={e => update("openingBalance", e.target.value)} style={{ ...ctrlInpS, width: 120 }} placeholder="0" />
                <span style={{ margin: "0 12px", color: "#ddd" }}>|</span>
                <span style={ctrlLblS}>VAT Rate %</span>
                <input value={data.vatRate ?? 5} onChange={e => update("vatRate", e.target.value)} style={{ ...ctrlInpS, width: 60 }} placeholder="5" />
              </div>

              {/* ── Summary strip ── */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(6,1fr)", border: "1px solid #e0e0e0", marginBottom: 22 }}>
                {[
                  { l: "Opening Balance", v: fmt(calcs.ob), cls: calcs.ob < 0 ? "#b0271d" : "#000" },
                  { l: "Total Inflows", v: fmt(calcs.inA), cls: "#1a6e3e" },
                  { l: "Total Outflows", v: fmt(calcs.outA + calcs.capA), cls: "#b0271d" },
                  { l: "VAT Liability", v: fmt(calcs.vatA), cls: "#b06000" },
                  { l: "Net Cash Flow", v: fmtSigned(calcs.netA), cls: calcs.netA >= 0 ? "#1a6e3e" : "#b0271d" },
                  { l: "Year-End Balance", v: fmtSigned(calcs.closeC[11] || 0), cls: (calcs.closeC[11] || 0) >= 0 ? "#1a6e3e" : "#b0271d" },
                ].map((s, i) => (
                  <div key={i} style={{ padding: "11px 14px", borderRight: i < 5 ? "1px solid #e0e0e0" : "none" }}>
                    <div style={{ fontFamily: F, fontSize: 7.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#999", marginBottom: 4 }}>{s.l}</div>
                    <div style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: s.cls }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* ── Main table ── */}
              <div style={{ overflowX: "auto", margin: isMobile ? "0 -16px" : 0, padding: isMobile ? "0 16px" : 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
                  <thead>
                    <tr>
                      <th style={{ ...hdrS, textAlign: "left", width: 210, paddingLeft: 0 }}>Category</th>
                      {MONTHS.map(m => <th key={m} style={hdrS}>{m}</th>)}
                      <th style={{ ...hdrS, width: 105 }}>Annual Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Opening balance row */}
                    <tr>
                      <td style={{ fontFamily: F, fontSize: 11, fontWeight: 600, background: "#f9f9f7", borderBottom: "1px solid #e8e8e8", padding: "6px 0" }}>Opening Balance</td>
                      {Array(12).fill(0).map((_, m) => {
                        const v = m === 0 ? calcs.ob : 0;
                        return <td key={m} style={{ fontFamily: F, fontSize: 11, background: "#f9f9f7", borderBottom: "1px solid #e8e8e8", padding: "6px 4px", textAlign: "right", color: v < 0 ? "#b0271d" : v > 0 ? "#1a6e3e" : "#000", fontWeight: v ? 600 : 400 }}>{m === 0 && v ? fmt(v) : "—"}</td>;
                      })}
                      <td style={{ fontFamily: F, fontSize: 11, background: "#f9f9f7", borderBottom: "1px solid #e8e8e8", padding: "6px 0", textAlign: "right", fontWeight: 600, color: calcs.ob < 0 ? "#b0271d" : calcs.ob > 0 ? "#1a6e3e" : "#000" }}>{calcs.ob ? fmt(calcs.ob) : "—"}</td>
                    </tr>

                    {/* Inflows */}
                    {renderSection("inflows", "Operating Inflows")}
                    {/* Subtotal */}
                    <tr>
                      <td style={{ ...subS, textAlign: "left", paddingLeft: 0 }}>Total Inflows</td>
                      {calcs.inC.map((v, m) => <td key={m} style={subS}>{v ? fmt(v) : "—"}</td>)}
                      <td style={{ ...subS, paddingRight: 0 }}>{calcs.inA ? fmt(calcs.inA) : "—"}</td>
                    </tr>

                    {/* Outflows */}
                    {renderSection("outflows", "Operating Outflows")}
                    <tr>
                      <td style={{ ...subS, textAlign: "left", paddingLeft: 0 }}>Total Outflows</td>
                      {calcs.outC.map((v, m) => <td key={m} style={subS}>{v ? fmt(v) : "—"}</td>)}
                      <td style={{ ...subS, paddingRight: 0 }}>{calcs.outA ? fmt(calcs.outA) : "—"}</td>
                    </tr>

                    {/* CapEx */}
                    {renderSection("capex", "Capital Expenditure")}
                    <tr>
                      <td style={{ ...subS, textAlign: "left", paddingLeft: 0 }}>Total CapEx</td>
                      {calcs.capC.map((v, m) => <td key={m} style={subS}>{v ? fmt(v) : "—"}</td>)}
                      <td style={{ ...subS, paddingRight: 0 }}>{calcs.capA ? fmt(calcs.capA) : "—"}</td>
                    </tr>

                    {/* VAT row */}
                    <tr>
                      <td style={{ fontFamily: F, fontSize: 9, fontWeight: 600, background: "#fffbf0", borderTop: "1px solid #e8dfc0", borderBottom: "1px solid #e8dfc0", padding: "7px 0", color: "#b06000" }}>VAT Liability (on Net Revenue)</td>
                      {calcs.vatC.map((v, m) => <td key={m} style={{ fontFamily: F, fontSize: 9, fontWeight: 600, background: "#fffbf0", borderTop: "1px solid #e8dfc0", borderBottom: "1px solid #e8dfc0", padding: "7px 4px", textAlign: "right", color: "#b06000" }}>{v ? fmt(v) : "—"}</td>)}
                      <td style={{ fontFamily: F, fontSize: 9, fontWeight: 600, background: "#fffbf0", borderTop: "1px solid #e8dfc0", borderBottom: "1px solid #e8dfc0", padding: "7px 0", textAlign: "right", color: "#b06000" }}>{calcs.vatA ? fmt(calcs.vatA) : "—"}</td>
                    </tr>

                    {/* Net cash flow */}
                    <tr>
                      <td style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "#000", color: "#fff", padding: "8px 0" }}>Net Cash Flow</td>
                      {calcs.netC.map((v, m) => <td key={m} style={{ fontFamily: F, fontSize: 9, fontWeight: 700, textTransform: "uppercase", background: "#000", padding: "8px 4px", textAlign: "right", color: v >= 0 ? "#7dffc4" : "#ffaaaa" }}>{v ? fmtSigned(v) : "—"}</td>)}
                      <td style={{ fontFamily: F, fontSize: 9, fontWeight: 700, textTransform: "uppercase", background: "#000", padding: "8px 0", textAlign: "right", color: calcs.netA >= 0 ? "#7dffc4" : "#ffaaaa" }}>{calcs.netA ? fmtSigned(calcs.netA) : "—"}</td>
                    </tr>

                    {/* Closing balance */}
                    <tr>
                      <td style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "#2a2a2a", color: "#fff", borderTop: "2px solid #000", padding: "8px 0" }}>Closing Balance</td>
                      {calcs.closeC.map((v, m) => <td key={m} style={{ fontFamily: F, fontSize: 9, fontWeight: 700, textTransform: "uppercase", background: "#2a2a2a", borderTop: "2px solid #000", padding: "8px 4px", textAlign: "right", color: v >= 0 ? "#7dffc4" : "#ffaaaa" }}>{fmtSigned(v)}</td>)}
                      <td style={{ fontFamily: F, fontSize: 9, fontWeight: 700, textTransform: "uppercase", background: "#2a2a2a", borderTop: "2px solid #000", padding: "8px 0", textAlign: "right", color: (calcs.closeC[11] || 0) >= 0 ? "#7dffc4" : "#ffaaaa" }}>{fmtSigned(calcs.closeC[11] || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ── Notes ── */}
              <div style={{ marginTop: 22, paddingTop: 12, borderTop: "1px solid #e0e0e0" }}>
                <div style={{ fontFamily: F, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Notes</div>
                <textarea value={data.notes || ""} onChange={e => update("notes", e.target.value)}
                  rows={3} placeholder="Assumptions, exchange rates, payment terms, or other notes…"
                  style={{ fontFamily: F, fontSize: 11, border: "none", outline: "none", resize: "none", width: "100%", color: "#555", background: "transparent", lineHeight: 1.7, boxSizing: "border-box" }} />
              </div>

              {/* ── Footer ── */}
              <div style={{ marginTop: 18, paddingTop: 10, borderTop: "1px solid #e8e8e8", display: "flex", justifyContent: "space-between", fontFamily: F, fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "#bbb" }}>
                <span>onnaworld — onna.digital</span>
                <span>{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
            </div>
          )}
    </div>
  );
}
