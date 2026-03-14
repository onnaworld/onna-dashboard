import React, { useState, useRef, useMemo } from "react";
import { CSLogoSlot } from "./ui/DocHelpers";
import { PRINT_CLEANUP_CSS } from "../utils/helpers";

const CASHFLOW_CATEGORIES = ["Revenue","Cost of Goods","Operating Expense","Tax","Investment","Loan","Transfer","Other"];

const CASHFLOW_INIT = {
  id: Date.now(),
  label: "Cash Flow V1",
  prodLogo: null,
  clientLogo: null,
  rows: [{ id: 1, date: "", desc: "", category: "Revenue", income: 0, expense: 0 }],
  notes: "",
};

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
          allProjects={allProjects || allProjectsMerged}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Cash Flow Document Component
   ═══════════════════════════════════════════════════════════════════════════════ */
function CashFlowDoc({ T, isMobile, cashFlowStore, setCashFlowStore, activeCashFlowVersion, setActiveCashFlowVersion, allProjects }) {
  const [selectedProject, setSelectedProject] = useState("");
  const printRef = useRef();

  const pid = selectedProject;
  const versions = cashFlowStore[pid] || [];
  const vIdx = activeCashFlowVersion != null ? Math.min(activeCashFlowVersion, versions.length - 1) : (versions.length > 0 ? 0 : -1);
  const data = vIdx >= 0 ? versions[vIdx] : null;

  const update = (key, val) => {
    if (!pid || vIdx < 0) return;
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
  };

  const updateRow = (rowId, field, value) => {
    update(d => {
      const rows = [...d.rows];
      const ri = rows.findIndex(r => r.id === rowId);
      if (ri >= 0) rows[ri] = { ...rows[ri], [field]: value };
      return { ...d, rows };
    });
  };

  const addRow = () => {
    update(d => ({
      ...d,
      rows: [...d.rows, { id: Date.now(), date: "", desc: "", category: "Revenue", income: 0, expense: 0 }],
    }));
  };

  const deleteRow = (rowId) => {
    update(d => ({ ...d, rows: d.rows.filter(r => r.id !== rowId) }));
  };

  const addVersion = () => {
    if (!pid) return;
    const newV = { ...JSON.parse(JSON.stringify(CASHFLOW_INIT)), id: Date.now(), label: `Cash Flow V${versions.length + 1}` };
    // Load default logo
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

  /* ── Running balance calc ── */
  const rowsWithBalance = useMemo(() => {
    if (!data) return [];
    let bal = 0;
    return data.rows.map(r => {
      const inc = parseFloat(r.income) || 0;
      const exp = parseFloat(r.expense) || 0;
      bal += inc - exp;
      return { ...r, balance: bal };
    });
  }, [data]);

  const totalIncome = useMemo(() => data ? data.rows.reduce((a, r) => a + (parseFloat(r.income) || 0), 0) : 0, [data]);
  const totalExpenses = useMemo(() => data ? data.rows.reduce((a, r) => a + (parseFloat(r.expense) || 0), 0) : 0, [data]);
  const netCashFlow = totalIncome - totalExpenses;

  /* ── PDF Export ── */
  const handlePrint = () => {
    if (!data) return;
    const logoHtml = (src) => src ? `<img src="${src}" style="max-height:30px;max-width:120px;object-fit:contain"/>` : "";
    const rowsHtml = rowsWithBalance.map(r => `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:11px">${r.date||""}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:11px">${r.desc||""}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:11px">${r.category||""}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:11px;text-align:right">${r.income?parseFloat(r.income).toLocaleString():""}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:11px;text-align:right">${r.expense?parseFloat(r.expense).toLocaleString():""}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:11px;text-align:right;font-weight:600">${r.balance.toLocaleString()}</td></tr>`).join("");
    const html = `<!DOCTYPE html><html><head><style>@page{size:A4 landscape;margin:20mm}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1d1d1f;margin:0;padding:0}${PRINT_CLEANUP_CSS}table{width:100%;border-collapse:collapse}</style></head><body><div style="padding:40px 40px"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">${logoHtml(data.prodLogo)}<div style="display:flex;gap:16px;align-items:center">${logoHtml(data.clientLogo)}</div></div><div style="border-bottom:2.5px solid #000;margin-bottom:16px"></div><h2 style="font-size:16px;margin:0 0 16px;font-weight:700">${data.label||"Cash Flow"}</h2><table><thead><tr style="background:#f5f5f7"><th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #ddd">Date</th><th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #ddd">Description</th><th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #ddd">Category</th><th style="padding:8px 10px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #ddd">Income</th><th style="padding:8px 10px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #ddd">Expense</th><th style="padding:8px 10px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #ddd">Balance</th></tr></thead><tbody>${rowsHtml}<tr style="font-weight:700;border-top:2px solid #333"><td colspan="3" style="padding:8px 10px;font-size:11px">TOTALS</td><td style="padding:8px 10px;text-align:right;font-size:11px">${totalIncome.toLocaleString()}</td><td style="padding:8px 10px;text-align:right;font-size:11px">${totalExpenses.toLocaleString()}</td><td style="padding:8px 10px;text-align:right;font-size:11px">${netCashFlow.toLocaleString()}</td></tr></tbody></table>${data.notes?`<div style="margin-top:20px;font-size:11px;color:#666"><strong>Notes:</strong> ${data.notes}</div>`:""}</div></body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
  };

  const fmtNum = (n) => {
    const v = parseFloat(n) || 0;
    return v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const thStyle = { padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: T.muted, borderBottom: `2px solid ${T.border}`, whiteSpace: "nowrap" };
  const tdStyle = { padding: "4px 6px", borderBottom: `1px solid ${T.border}`, verticalAlign: "middle" };
  const inputStyle = { width: "100%", padding: "5px 8px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: "inherit", background: T.surface, color: T.text, boxSizing: "border-box" };
  const numInputStyle = { ...inputStyle, textAlign: "right", width: 100 };

  return (
    <div>
      {/* ── Project selector ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <select value={selectedProject} onChange={e => { setSelectedProject(e.target.value); setActiveCashFlowVersion(null); }}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: "inherit", background: T.surface, color: T.text, minWidth: 200 }}>
          <option value="">Select project…</option>
          {(allProjects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {pid && data && (
          <button onClick={handlePrint} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Print / PDF
          </button>
        )}
      </div>

      {!pid && (
        <div style={{ borderRadius: 14, background: "#fafafa", border: `1.5px dashed ${T.border}`, padding: 44, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.muted }}>Select a project to view or create a cash flow tracker.</div>
        </div>
      )}

      {pid && (
        <>
          {/* ── Version bar ── */}
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
          </div>

          {!data && (
            <div style={{ borderRadius: 14, background: "#fafafa", border: `1.5px dashed ${T.border}`, padding: 44, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: T.muted }}>No cash flow versions yet. Click "+" to create one.</div>
            </div>
          )}

          {data && (
            <div ref={printRef}>
              {/* ── Logo header ── */}
              <div style={{ padding: "0 0 0 0", marginBottom: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <CSLogoSlot label="Production Logo" image={data.prodLogo} onUpload={v => update("prodLogo", v)} onRemove={() => update("prodLogo", null)} />
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <CSLogoSlot label="Client Logo" image={data.clientLogo} onUpload={v => update("clientLogo", v)} onRemove={() => update("clientLogo", null)} />
                  </div>
                </div>
                <div style={{ borderBottom: "2.5px solid #000", marginBottom: 16 }} />
              </div>

              {/* ── Version label (editable) ── */}
              <input value={data.label || ""} onChange={e => update("label", e.target.value)}
                style={{ fontSize: 16, fontWeight: 700, border: "none", outline: "none", background: "transparent", color: T.text, fontFamily: "inherit", marginBottom: 14, width: "100%", padding: 0 }}
                placeholder="Cash Flow Title" />

              {/* ── Table ── */}
              <div style={{ overflowX: "auto", marginBottom: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: T.surface }}>
                      <th style={thStyle}>Date</th>
                      <th style={{ ...thStyle, minWidth: 160 }}>Description</th>
                      <th style={thStyle}>Category</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Income</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Expense</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Balance</th>
                      <th style={{ ...thStyle, width: 36 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowsWithBalance.map((r) => (
                      <tr key={r.id}>
                        <td style={tdStyle}>
                          <input type="date" value={r.date || ""} onChange={e => updateRow(r.id, "date", e.target.value)} style={{ ...inputStyle, width: 130 }} />
                        </td>
                        <td style={tdStyle}>
                          <input value={r.desc || ""} onChange={e => updateRow(r.id, "desc", e.target.value)} style={inputStyle} placeholder="Description" />
                        </td>
                        <td style={tdStyle}>
                          <select value={r.category || "Revenue"} onChange={e => updateRow(r.id, "category", e.target.value)}
                            style={{ ...inputStyle, width: 140 }}>
                            {CASHFLOW_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td style={tdStyle}>
                          <input type="number" value={r.income || ""} onChange={e => updateRow(r.id, "income", e.target.value)} style={numInputStyle} placeholder="0" min="0" step="any" />
                        </td>
                        <td style={tdStyle}>
                          <input type="number" value={r.expense || ""} onChange={e => updateRow(r.id, "expense", e.target.value)} style={numInputStyle} placeholder="0" min="0" step="any" />
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right", fontSize: 12, fontWeight: 600, color: r.balance >= 0 ? "#2e7d32" : "#c0392b", paddingRight: 10, whiteSpace: "nowrap" }}>
                          {fmtNum(r.balance)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <button onClick={() => deleteRow(r.id)} style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 14, fontFamily: "inherit", padding: 2 }} title="Delete row">&times;</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Add Row ── */}
              <button onClick={addRow} style={{ padding: "6px 16px", borderRadius: 8, border: `1.5px dashed ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 20 }}>+ Add Row</button>

              {/* ── Summary cards ── */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total Income", value: fmtNum(totalIncome), color: "#2e7d32" },
                  { label: "Total Expenses", value: fmtNum(totalExpenses), color: "#c0392b" },
                  { label: "Net Cash Flow", value: fmtNum(netCashFlow), color: netCashFlow >= 0 ? "#2e7d32" : "#c0392b" },
                ].map((s, i) => (
                  <div key={i} style={{ borderRadius: 12, padding: "16px 18px", background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* ── Notes ── */}
              <textarea value={data.notes || ""} onChange={e => update("notes", e.target.value)}
                placeholder="Notes…"
                style={{ width: "100%", minHeight: 60, padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: "inherit", background: T.surface, color: T.text, resize: "vertical", boxSizing: "border-box" }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
