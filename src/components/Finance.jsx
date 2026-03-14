import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { CSLogoSlot } from "./ui/DocHelpers";
import { PRINT_CLEANUP_CSS, estCalcTotals, actualsGrandExpenseTotal, actualsGrandEffective, actualsGrandZohoTotal, actualsSectionExpenseTotal, actualsSectionEffective, defaultSections } from "../utils/helpers";

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

/* ── Shared helpers ── */
const fmtK = (n) => {
  if (n === 0) return "AED 0";
  const abs = Math.abs(n);
  if (abs >= 1000000) return (n < 0 ? "-" : "") + "AED " + (abs / 1000000).toFixed(1) + "M";
  if (abs >= 1000) return (n < 0 ? "-" : "") + "AED " + (abs / 1000).toFixed(0) + "k";
  return "AED " + n.toLocaleString("en-GB", { maximumFractionDigits: 0 });
};
const fmtFull = (n) => "AED " + Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%";

/* ── Card/Table styles ── */
const cardS = (T) => ({ borderRadius: 16, padding: "20px 22px", background: T.surface, border: "1px solid " + T.border, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" });
const kpiLabelS = { fontSize: 11, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 };
const kpiValS = { fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 };

/* ── Default overheads for P&L ── */
const DEFAULT_OVERHEADS = () => [
  { label: "Office & Studio Rent", amount: "" },
  { label: "Salaries (Non-Project)", amount: "" },
  { label: "Insurance", amount: "" },
  { label: "Software & Subscriptions", amount: "" },
  { label: "Marketing & Business Dev", amount: "" },
  { label: "Legal & Accounting", amount: "" },
  { label: "Utilities & Communications", amount: "" },
  { label: "Other Overheads", amount: "" },
];

/* ── Default AR/AP items ── */
const DEFAULT_ARAP = () => ({
  receivables: [],
  payables: [],
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
  projectEstimates, projectActuals,
}) {
  const [financeTab, setFinanceTab] = useState("overview");

  /* ── Persisted overheads for P&L ── */
  const [overheads, setOverheads] = useState(() => {
    try { const s = localStorage.getItem("onna_pnl_overheads"); return s ? JSON.parse(s) : DEFAULT_OVERHEADS(); } catch { return DEFAULT_OVERHEADS(); }
  });
  useEffect(() => { try { localStorage.setItem("onna_pnl_overheads", JSON.stringify(overheads)); } catch {} }, [overheads]);

  /* ── Persisted AR/AP data ── */
  const [arapData, setArapData] = useState(() => {
    try { const s = localStorage.getItem("onna_arap_data"); return s ? JSON.parse(s) : DEFAULT_ARAP(); } catch { return DEFAULT_ARAP(); }
  });
  useEffect(() => { try { localStorage.setItem("onna_arap_data", JSON.stringify(arapData)); } catch {} }, [arapData]);

  /* ── Persisted Tax data ── */
  const [taxData, setTaxData] = useState(() => {
    try { const s = localStorage.getItem("onna_tax_data"); return s ? JSON.parse(s) : { vatRate: 5, filings: [] }; } catch { return { vatRate: 5, filings: [] }; }
  });
  useEffect(() => { try { localStorage.setItem("onna_tax_data", JSON.stringify(taxData)); } catch {} }, [taxData]);

  /* ── Computed data from projects ── */
  const projData = useMemo(() => {
    const all = allProjectsMerged || [];
    const nonTemplate = all.filter(p => p.client !== "TEMPLATE");
    const active = nonTemplate.filter(p => p.status === "Active");
    const completed = nonTemplate.filter(p => p.status === "Completed" || p.status === "Wrapped");
    const thisYear = nonTemplate.filter(p => p.year === 2026);
    const lastYear = nonTemplate.filter(p => p.year === 2025);

    const sumRev = (arr) => arr.reduce((a, b) => a + getProjRevenue(b), 0);
    const sumCost = (arr) => arr.reduce((a, b) => a + getProjCost(b), 0);
    const sumProfit = (arr) => arr.reduce((a, b) => a + (getProjRevenue(b) - getProjCost(b)), 0);
    const margin = (rev, profit) => rev > 0 ? Math.round((profit / rev) * 100) : 0;

    const totalRev = sumRev(nonTemplate);
    const totalCost = sumCost(nonTemplate);
    const totalProfit = sumProfit(nonTemplate);

    const thisYearRev = sumRev(thisYear);
    const thisYearCost = sumCost(thisYear);
    const thisYearProfit = sumProfit(thisYear);
    const lastYearRev = sumRev(lastYear);

    const pipeline = (localLeads || []).reduce((a, b) => a + (b.value || 0), 0);
    const newLeads = (localLeads || []).filter(l => l.status === "not_contacted" || l.status === "cold").length;

    // Per-project breakdown for profitability
    const projBreakdown = nonTemplate.map(p => {
      const rev = getProjRevenue(p);
      const cost = getProjCost(p);
      const profit = rev - cost;
      // Get estimate vs actual variance
      const ests = projectEstimates?.[p.id];
      const estimateTotal = ests && ests.length > 0 ? estCalcTotals(ests[ests.length - 1].sections || defaultSections()).grandTotal : null;
      const acts = projectActuals?.[p.id];
      const actualTotal = acts ? actualsGrandEffective(acts) : null;
      const variance = estimateTotal !== null && actualTotal !== null ? estimateTotal - actualTotal : null;
      return { id: p.id, name: p.name || p.title || "Untitled", client: p.client, status: p.status, year: p.year, rev, cost, profit, margin: rev > 0 ? Math.round((profit / rev) * 100) : 0, estimateTotal, actualTotal, variance };
    });

    // Top 5 projects by revenue
    const topProjects = [...projBreakdown].sort((a, b) => b.rev - a.rev).slice(0, 5);

    // Projects with budget overruns
    const overBudget = projBreakdown.filter(p => p.variance !== null && p.variance < 0).sort((a, b) => a.variance - b.variance);

    return {
      nonTemplate, active, completed, thisYear, lastYear,
      totalRev, totalCost, totalProfit,
      thisYearRev, thisYearCost, thisYearProfit, lastYearRev,
      avgMargin: margin(totalRev, totalProfit),
      thisYearMargin: margin(thisYearRev, thisYearProfit),
      pipeline, newLeads,
      projBreakdown, topProjects, overBudget,
    };
  }, [allProjectsMerged, localLeads, getProjRevenue, getProjCost, projectEstimates, projectActuals]);

  /* ── P&L calculations ── */
  const pnlData = useMemo(() => {
    const ovTotal = overheads.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
    const grossProfit = projData.thisYearRev - projData.thisYearCost;
    const grossMargin = projData.thisYearRev > 0 ? (grossProfit / projData.thisYearRev) * 100 : 0;
    const netProfit = grossProfit - ovTotal;
    const netMargin = projData.thisYearRev > 0 ? (netProfit / projData.thisYearRev) * 100 : 0;

    // Revenue by project (this year)
    const revByProject = projData.thisYear.map(p => ({
      name: p.name || p.title || "Untitled",
      client: p.client,
      rev: getProjRevenue(p),
      cost: getProjCost(p),
    })).sort((a, b) => b.rev - a.rev);

    // Cost breakdown from actuals sections
    const costBreakdown = {};
    projData.thisYear.forEach(p => {
      const acts = projectActuals?.[p.id];
      if (!acts) return;
      acts.forEach(sec => {
        const title = sec.title || "Other";
        const total = actualsSectionEffective(sec);
        costBreakdown[title] = (costBreakdown[title] || 0) + total;
      });
    });
    const costSections = Object.entries(costBreakdown).map(([title, total]) => ({ title, total })).sort((a, b) => b.total - a.total);

    return { ovTotal, grossProfit, grossMargin, netProfit, netMargin, revByProject, costSections };
  }, [projData, overheads, getProjRevenue, getProjCost, projectActuals]);

  /* ── AR/AP calculations ── */
  const arapCalcs = useMemo(() => {
    const totalAR = (arapData.receivables || []).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const overdueAR = (arapData.receivables || []).filter(r => r.dueDate && new Date(r.dueDate) < new Date() && r.status !== "paid").reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const totalAP = (arapData.payables || []).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const overdueAP = (arapData.payables || []).filter(r => r.dueDate && new Date(r.dueDate) < new Date() && r.status !== "paid").reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    return { totalAR, overdueAR, totalAP, overdueAP, netPosition: totalAR - totalAP };
  }, [arapData]);

  const subTabs = [
    { key: "overview", label: "Overview" },
    { key: "pnl", label: "P&L" },
    { key: "cashflow", label: "Cash Flow" },
    { key: "arap", label: "AR / AP" },
    { key: "profitability", label: "Profitability" },
    { key: "tax", label: "Tax & VAT" },
  ];

  /* ── Shared table styles ── */
  const thS = { fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted, padding: "10px 14px", borderBottom: `2px solid ${T.border}`, textAlign: "left" };
  const tdS = { fontSize: 12.5, padding: "11px 14px", borderBottom: `1px solid ${T.borderSub || T.border}`, color: T.text };
  const tdR = { ...tdS, textAlign: "right", fontVariantNumeric: "tabular-nums" };

  return (
    <div>
      {/* ── Sub-tab bar ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, flexWrap: "wrap" }}>
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

      {/* ═══ OVERVIEW ═══ */}
      {financeTab === "overview" && (
        <div>
          {/* KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: isMobile ? 10 : 14, marginBottom: isMobile ? 16 : 22 }}>
            {[
              { label: "Revenue 2026", value: fmtK(projData.thisYearRev), sub: projData.thisYear.length + " projects", color: T.text },
              { label: "Profit 2026", value: fmtK(projData.thisYearProfit), sub: projData.thisYearMargin + "% margin", color: projData.thisYearProfit >= 0 ? "#1a6e3e" : "#b0271d" },
              { label: "Pipeline", value: apiLoading ? "\u2014" : fmtK(projData.pipeline), sub: projData.newLeads + " new leads", color: T.text },
              { label: "Active Projects", value: projData.active.length, sub: projData.completed.length + " completed", color: T.text },
              { label: "All-Time Revenue", value: fmtK(projData.totalRev), sub: projData.nonTemplate.length + " total projects", color: T.text },
              { label: "All-Time Profit", value: fmtK(projData.totalProfit), sub: projData.avgMargin + "% avg margin", color: projData.totalProfit >= 0 ? "#1a6e3e" : "#b0271d" },
              { label: "Outstanding AR", value: fmtK(arapCalcs.totalAR), sub: arapCalcs.overdueAR > 0 ? fmtK(arapCalcs.overdueAR) + " overdue" : "none overdue", color: arapCalcs.overdueAR > 0 ? "#b06000" : T.text },
              { label: "YoY Growth", value: projData.lastYearRev > 0 ? fmtPct(((projData.thisYearRev - projData.lastYearRev) / projData.lastYearRev) * 100) : "N/A", sub: "vs 2025", color: projData.thisYearRev >= projData.lastYearRev ? "#1a6e3e" : "#b0271d" },
            ].map((s, i) => (
              <div key={i} style={cardS(T)}>
                <div style={{ ...kpiLabelS, color: T.muted }}>{s.label}</div>
                <div style={{ ...kpiValS, color: s.color || T.text }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: 12, color: T.sub }}>{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Top projects & budget alerts side by side */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            {/* Top projects */}
            <div style={{ ...cardS(T), padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted }}>Top Projects by Revenue</div>
              </div>
              <div style={{ padding: 0 }}>
                {projData.topProjects.map((p, i) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: i < projData.topProjects.length - 1 ? `1px solid ${T.borderSub || T.border}` : "none" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{p.client}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{fmtK(p.rev)}</div>
                      <div style={{ fontSize: 11, color: p.margin >= 20 ? "#1a6e3e" : p.margin >= 0 ? "#b06000" : "#b0271d" }}>{p.margin}% margin</div>
                    </div>
                  </div>
                ))}
                {projData.topProjects.length === 0 && <div style={{ padding: 20, textAlign: "center", color: T.muted, fontSize: 13 }}>No projects yet</div>}
              </div>
            </div>

            {/* Budget alerts */}
            <div style={{ ...cardS(T), padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted }}>Budget Alerts</div>
              </div>
              <div style={{ padding: 0 }}>
                {projData.overBudget.slice(0, 5).map((p, i) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: i < Math.min(projData.overBudget.length, 5) - 1 ? `1px solid ${T.borderSub || T.border}` : "none" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>Est: {fmtK(p.estimateTotal || 0)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#b0271d" }}>{fmtK(p.variance)}</div>
                      <div style={{ fontSize: 11, color: "#b0271d" }}>over budget</div>
                    </div>
                  </div>
                ))}
                {projData.overBudget.length === 0 && <div style={{ padding: 20, textAlign: "center", color: T.muted, fontSize: 13 }}>All projects on budget</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ P&L ═══ */}
      {financeTab === "pnl" && (
        <div>
          {/* P&L summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
            {[
              { label: "Total Revenue", value: fmtK(projData.thisYearRev), color: T.text },
              { label: "Direct Costs", value: fmtK(projData.thisYearCost), color: "#b0271d" },
              { label: "Gross Profit", value: fmtK(pnlData.grossProfit), sub: pnlData.grossMargin.toFixed(1) + "% margin", color: pnlData.grossProfit >= 0 ? "#1a6e3e" : "#b0271d" },
              { label: "Net Profit", value: fmtK(pnlData.netProfit), sub: pnlData.netMargin.toFixed(1) + "% margin", color: pnlData.netProfit >= 0 ? "#1a6e3e" : "#b0271d" },
            ].map((s, i) => (
              <div key={i} style={cardS(T)}>
                <div style={{ ...kpiLabelS, color: T.muted }}>{s.label}</div>
                <div style={{ ...kpiValS, color: s.color }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: 12, color: T.sub }}>{s.sub}</div>}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            {/* Revenue by project */}
            <div style={{ ...cardS(T), padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px 0" }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted, marginBottom: 12 }}>Revenue by Project (2026)</div>
              </div>
              <div className="mob-table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>
                    <th style={thS}>Project</th>
                    <th style={{ ...thS, textAlign: "right" }}>Revenue</th>
                    <th style={{ ...thS, textAlign: "right" }}>Cost</th>
                    <th style={{ ...thS, textAlign: "right" }}>Margin</th>
                  </tr></thead>
                  <tbody>
                    {pnlData.revByProject.map((p, i) => {
                      const margin = p.rev > 0 ? Math.round(((p.rev - p.cost) / p.rev) * 100) : 0;
                      return (
                        <tr key={i}>
                          <td style={tdS}><div style={{ fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: 11, color: T.muted }}>{p.client}</div></td>
                          <td style={tdR}>{fmtFull(p.rev)}</td>
                          <td style={tdR}>{fmtFull(p.cost)}</td>
                          <td style={{ ...tdR, color: margin >= 20 ? "#1a6e3e" : margin >= 0 ? "#b06000" : "#b0271d", fontWeight: 600 }}>{margin}%</td>
                        </tr>
                      );
                    })}
                    {pnlData.revByProject.length === 0 && <tr><td colSpan={4} style={{ ...tdS, textAlign: "center", color: T.muted }}>No 2026 projects</td></tr>}
                    {/* Total row */}
                    {pnlData.revByProject.length > 0 && (
                      <tr style={{ background: T.bg }}>
                        <td style={{ ...tdS, fontWeight: 700, borderBottom: "none" }}>Total</td>
                        <td style={{ ...tdR, fontWeight: 700, borderBottom: "none" }}>{fmtFull(projData.thisYearRev)}</td>
                        <td style={{ ...tdR, fontWeight: 700, borderBottom: "none" }}>{fmtFull(projData.thisYearCost)}</td>
                        <td style={{ ...tdR, fontWeight: 700, borderBottom: "none", color: projData.thisYearMargin >= 20 ? "#1a6e3e" : "#b06000" }}>{projData.thisYearMargin}%</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Overheads */}
            <div style={{ ...cardS(T), padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px 0" }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted, marginBottom: 12 }}>Operating Overheads (Monthly)</div>
              </div>
              <div className="mob-table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>
                    <th style={thS}>Category</th>
                    <th style={{ ...thS, textAlign: "right" }}>Monthly</th>
                    <th style={{ ...thS, textAlign: "right" }}>Annual</th>
                  </tr></thead>
                  <tbody>
                    {overheads.map((o, i) => (
                      <tr key={i} onMouseEnter={e => { const d = e.currentTarget.querySelector(".oh-del"); if (d) d.style.visibility = "visible"; }} onMouseLeave={e => { const d = e.currentTarget.querySelector(".oh-del"); if (d) d.style.visibility = "hidden"; }}>
                        <td style={tdS}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button className="oh-del" onClick={() => setOverheads(prev => prev.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 14, padding: 0, visibility: "hidden", lineHeight: 1 }} onMouseEnter={e => e.target.style.color = "#b0271d"} onMouseLeave={e => e.target.style.color = "#ccc"}>×</button>
                            <input value={o.label} onChange={e => { const n = [...overheads]; n[i] = { ...n[i], label: e.target.value }; setOverheads(n); }}
                              style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, color: T.text, fontFamily: "inherit", width: "100%" }} />
                          </div>
                        </td>
                        <td style={tdR}>
                          <input value={o.amount} onChange={e => { const n = [...overheads]; n[i] = { ...n[i], amount: e.target.value }; setOverheads(n); }}
                            placeholder="0" inputMode="numeric"
                            style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, color: T.text, fontFamily: "inherit", textAlign: "right", width: 100 }}
                            onFocus={e => e.target.style.background = "#f0f5ff"} onBlur={e => e.target.style.background = "transparent"} />
                        </td>
                        <td style={{ ...tdR, color: T.sub }}>{fmtFull((parseFloat(o.amount) || 0) * 12)}</td>
                      </tr>
                    ))}
                    <tr><td colSpan={3} style={{ padding: "8px 14px", borderBottom: "none" }}>
                      <button onClick={() => setOverheads(prev => [...prev, { label: "New Overhead", amount: "" }])}
                        style={{ fontSize: 11, color: T.muted, background: "none", border: "1px dashed " + T.border, padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>+ Add row</button>
                    </td></tr>
                    <tr style={{ background: T.bg }}>
                      <td style={{ ...tdS, fontWeight: 700, borderBottom: "none" }}>Total Overheads</td>
                      <td style={{ ...tdR, fontWeight: 700, borderBottom: "none", color: "#b0271d" }}>{fmtFull(pnlData.ovTotal)}</td>
                      <td style={{ ...tdR, fontWeight: 700, borderBottom: "none", color: "#b0271d" }}>{fmtFull(pnlData.ovTotal * 12)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* P&L Statement summary */}
          <div style={{ ...cardS(T), marginTop: 14, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 0" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted, marginBottom: 12 }}>Profit & Loss Statement — 2026</div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  { label: "Revenue (Project Fees)", value: projData.thisYearRev, bold: true },
                  ...pnlData.costSections.map(s => ({ label: "  " + s.title, value: -s.total, indent: true })),
                  { label: "Total Direct Costs", value: -projData.thisYearCost, bold: true, border: true },
                  { label: "GROSS PROFIT", value: pnlData.grossProfit, bold: true, highlight: true, pct: pnlData.grossMargin },
                  { label: "", spacer: true },
                  ...overheads.filter(o => parseFloat(o.amount) > 0).map(o => ({ label: "  " + o.label, value: -(parseFloat(o.amount) || 0), indent: true })),
                  { label: "Total Overheads", value: -pnlData.ovTotal, bold: true, border: true },
                  { label: "NET PROFIT", value: pnlData.netProfit, bold: true, highlight: true, pct: pnlData.netMargin, final: true },
                ].map((row, i) => {
                  if (row.spacer) return <tr key={i}><td colSpan={3} style={{ padding: 6 }} /></tr>;
                  return (
                    <tr key={i} style={row.highlight ? { background: row.final ? "#000" : "#f4f4f2" } : {}}>
                      <td style={{ ...tdS, fontWeight: row.bold ? 700 : 400, paddingLeft: row.indent ? 34 : 20, color: row.final ? "#fff" : row.indent ? T.sub : T.text, borderTop: row.border ? `2px solid ${T.border}` : "none", fontSize: row.highlight ? 13 : 12.5, letterSpacing: row.highlight ? "0.04em" : 0 }}>{row.label}</td>
                      <td style={{ ...tdR, fontWeight: row.bold ? 700 : 400, color: row.final ? (row.value >= 0 ? "#7dffc4" : "#ffaaaa") : row.value < 0 ? "#b0271d" : row.value > 0 ? "#1a6e3e" : T.text, borderTop: row.border ? `2px solid ${T.border}` : "none", fontSize: row.highlight ? 13 : 12.5 }}>
                        {row.value < 0 ? "(" + fmtFull(Math.abs(row.value)) + ")" : fmtFull(row.value)}
                      </td>
                      <td style={{ ...tdR, fontSize: 11, color: row.final ? (row.pct >= 0 ? "#7dffc4" : "#ffaaaa") : T.muted, borderTop: row.border ? `2px solid ${T.border}` : "none", width: 80 }}>
                        {row.pct !== undefined ? row.pct.toFixed(1) + "%" : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ CASH FLOW ═══ */}
      {financeTab === "cashflow" && (
        <CashFlowDoc
          T={T} isMobile={isMobile}
          cashFlowStore={cashFlowStore} setCashFlowStore={setCashFlowStore}
          activeCashFlowVersion={activeCashFlowVersion} setActiveCashFlowVersion={setActiveCashFlowVersion}
        />
      )}

      {/* ═══ AR / AP ═══ */}
      {financeTab === "arap" && (
        <div>
          {/* AR/AP summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(5,1fr)", gap: 14, marginBottom: 22 }}>
            {[
              { label: "Total Receivable", value: fmtK(arapCalcs.totalAR), color: "#1a6e3e" },
              { label: "Overdue AR", value: fmtK(arapCalcs.overdueAR), color: arapCalcs.overdueAR > 0 ? "#b0271d" : T.text },
              { label: "Total Payable", value: fmtK(arapCalcs.totalAP), color: "#b0271d" },
              { label: "Overdue AP", value: fmtK(arapCalcs.overdueAP), color: arapCalcs.overdueAP > 0 ? "#b06000" : T.text },
              { label: "Net Position", value: fmtK(arapCalcs.netPosition), color: arapCalcs.netPosition >= 0 ? "#1a6e3e" : "#b0271d" },
            ].map((s, i) => (
              <div key={i} style={cardS(T)}>
                <div style={{ ...kpiLabelS, color: T.muted }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* AR Table */}
          <ARAPTable T={T} title="Accounts Receivable" type="receivables" data={arapData} setData={setArapData} thS={thS} tdS={tdS} tdR={tdR} isMobile={isMobile} />

          {/* AP Table */}
          <div style={{ marginTop: 14 }}>
            <ARAPTable T={T} title="Accounts Payable" type="payables" data={arapData} setData={setArapData} thS={thS} tdS={tdS} tdR={tdR} isMobile={isMobile} />
          </div>
        </div>
      )}

      {/* ═══ PROFITABILITY ═══ */}
      {financeTab === "profitability" && (
        <div>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
            {[
              { label: "Avg Project Margin", value: projData.avgMargin + "%", color: projData.avgMargin >= 20 ? "#1a6e3e" : "#b06000" },
              { label: "Projects Over Budget", value: projData.overBudget.length, sub: "of " + projData.nonTemplate.length + " total", color: projData.overBudget.length > 0 ? "#b0271d" : "#1a6e3e" },
              { label: "Most Profitable", value: projData.topProjects[0]?.margin ? projData.topProjects[0].margin + "%" : "N/A", sub: projData.topProjects[0]?.name || "", color: "#1a6e3e" },
            ].map((s, i) => (
              <div key={i} style={cardS(T)}>
                <div style={{ ...kpiLabelS, color: T.muted }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: 12, color: T.sub }}>{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Full project table */}
          <div style={{ ...cardS(T), padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 0" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted, marginBottom: 12 }}>Project Profitability Comparison</div>
            </div>
            <div className="mob-table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={thS}>Project</th>
                  <th style={thS}>Client</th>
                  <th style={thS}>Status</th>
                  <th style={{ ...thS, textAlign: "right" }}>Revenue</th>
                  <th style={{ ...thS, textAlign: "right" }}>Cost</th>
                  <th style={{ ...thS, textAlign: "right" }}>Profit</th>
                  <th style={{ ...thS, textAlign: "right" }}>Margin</th>
                  <th style={{ ...thS, textAlign: "right" }}>Est vs Act</th>
                </tr></thead>
                <tbody>
                  {projData.projBreakdown.sort((a, b) => b.margin - a.margin).map((p, i) => (
                    <tr key={p.id}>
                      <td style={{ ...tdS, fontWeight: 600 }}>{p.name}</td>
                      <td style={{ ...tdS, color: T.sub }}>{p.client}</td>
                      <td style={tdS}>
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: p.status === "Active" ? "#e8f5e9" : p.status === "Completed" || p.status === "Wrapped" ? "#e3f2fd" : "#f5f5f5", color: p.status === "Active" ? "#2e7d32" : p.status === "Completed" || p.status === "Wrapped" ? "#1565c0" : T.muted }}>
                          {p.status || "Draft"}
                        </span>
                      </td>
                      <td style={tdR}>{fmtFull(p.rev)}</td>
                      <td style={tdR}>{fmtFull(p.cost)}</td>
                      <td style={{ ...tdR, fontWeight: 600, color: p.profit >= 0 ? "#1a6e3e" : "#b0271d" }}>{fmtFull(p.profit)}</td>
                      <td style={{ ...tdR, fontWeight: 600, color: p.margin >= 20 ? "#1a6e3e" : p.margin >= 0 ? "#b06000" : "#b0271d" }}>
                        {p.margin}%
                        <div style={{ height: 3, borderRadius: 2, background: T.border, marginTop: 4 }}>
                          <div style={{ height: 3, borderRadius: 2, width: Math.min(100, Math.max(0, p.margin)) + "%", background: p.margin >= 20 ? "#1a6e3e" : p.margin >= 0 ? "#b06000" : "#b0271d" }} />
                        </div>
                      </td>
                      <td style={{ ...tdR, color: p.variance === null ? T.muted : p.variance >= 0 ? "#1a6e3e" : "#b0271d", fontWeight: p.variance !== null ? 600 : 400 }}>
                        {p.variance === null ? "—" : p.variance >= 0 ? "Under " + fmtK(p.variance) : "Over " + fmtK(Math.abs(p.variance))}
                      </td>
                    </tr>
                  ))}
                  {projData.projBreakdown.length === 0 && <tr><td colSpan={8} style={{ ...tdS, textAlign: "center", color: T.muted }}>No projects</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAX & VAT ═══ */}
      {financeTab === "tax" && (
        <TaxVATTab T={T} isMobile={isMobile} taxData={taxData} setTaxData={setTaxData} projData={projData} cardS={cardS} kpiLabelS={kpiLabelS} thS={thS} tdS={tdS} tdR={tdR} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   AR/AP Table Component
   ═══════════════════════════════════════════════════════════════════════════════ */
function ARAPTable({ T, title, type, data, setData, thS, tdS, tdR, isMobile }) {
  const items = data[type] || [];
  const statusOptions = ["pending", "invoiced", "partial", "paid", "overdue"];

  const addItem = () => {
    setData(prev => ({
      ...prev,
      [type]: [...(prev[type] || []), { id: Date.now(), entity: "", description: "", amount: "", dueDate: "", status: "pending", invoiceRef: "" }],
    }));
  };

  const updateItem = (i, key, val) => {
    setData(prev => {
      const arr = [...(prev[type] || [])];
      arr[i] = { ...arr[i], [key]: val };
      return { ...prev, [type]: arr };
    });
  };

  const deleteItem = (i) => {
    setData(prev => ({
      ...prev,
      [type]: (prev[type] || []).filter((_, idx) => idx !== i),
    }));
  };

  const statusColor = (s) => {
    if (s === "paid") return { bg: "#e8f5e9", color: "#2e7d32" };
    if (s === "overdue") return { bg: "#fce4ec", color: "#b0271d" };
    if (s === "invoiced") return { bg: "#e3f2fd", color: "#1565c0" };
    if (s === "partial") return { bg: "#fff3e0", color: "#e65100" };
    return { bg: "#f5f5f5", color: "#666" };
  };

  return (
    <div style={{ borderRadius: 16, background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 12px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted }}>{title}</div>
        <button onClick={addItem} style={{ fontSize: 11, fontWeight: 600, color: T.accent, background: "none", border: `1px solid ${T.accent}`, padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>+ Add</button>
      </div>
      <div className="mob-table-wrap">
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 700 : "auto" }}>
          <thead><tr>
            <th style={thS}>{type === "receivables" ? "Client" : "Vendor"}</th>
            <th style={thS}>Description</th>
            <th style={thS}>Invoice #</th>
            <th style={{ ...thS, textAlign: "right" }}>Amount</th>
            <th style={thS}>Due Date</th>
            <th style={thS}>Status</th>
            <th style={{ ...thS, width: 40 }}></th>
          </tr></thead>
          <tbody>
            {items.map((item, i) => {
              const sc = statusColor(item.status);
              return (
                <tr key={item.id || i}>
                  <td style={tdS}>
                    <input value={item.entity || ""} onChange={e => updateItem(i, "entity", e.target.value)} placeholder={type === "receivables" ? "Client name" : "Vendor name"}
                      style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, color: T.text, fontFamily: "inherit", width: "100%" }} />
                  </td>
                  <td style={tdS}>
                    <input value={item.description || ""} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Description"
                      style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, color: T.text, fontFamily: "inherit", width: "100%" }} />
                  </td>
                  <td style={tdS}>
                    <input value={item.invoiceRef || ""} onChange={e => updateItem(i, "invoiceRef", e.target.value)} placeholder="INV-001"
                      style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, color: T.sub, fontFamily: "inherit", width: 90 }} />
                  </td>
                  <td style={tdR}>
                    <input value={item.amount || ""} onChange={e => updateItem(i, "amount", e.target.value)} placeholder="0" inputMode="numeric"
                      style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, color: T.text, fontFamily: "inherit", textAlign: "right", width: 100 }} />
                  </td>
                  <td style={tdS}>
                    <input type="date" value={item.dueDate || ""} onChange={e => updateItem(i, "dueDate", e.target.value)}
                      style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, color: T.text, fontFamily: "inherit" }} />
                  </td>
                  <td style={tdS}>
                    <select value={item.status || "pending"} onChange={e => updateItem(i, "status", e.target.value)}
                      style={{ border: "none", outline: "none", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", background: sc.bg, color: sc.color, textTransform: "capitalize" }}>
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ ...tdS, textAlign: "center" }}>
                    <button onClick={() => deleteItem(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 14, padding: 0 }} onMouseEnter={e => e.target.style.color = "#b0271d"} onMouseLeave={e => e.target.style.color = "#ccc"}>×</button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: T.muted, fontSize: 13 }}>No {type === "receivables" ? "receivables" : "payables"} recorded. Click + Add to create one.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Tax & VAT Tab Component
   ═══════════════════════════════════════════════════════════════════════════════ */
function TaxVATTab({ T, isMobile, taxData, setTaxData, projData, cardS, kpiLabelS, thS, tdS, tdR }) {
  const vatRate = taxData.vatRate || 5;
  const filings = taxData.filings || [];

  const totalRevenue = projData.thisYearRev;
  const vatOnRevenue = totalRevenue * (vatRate / 100);
  const inputVAT = projData.thisYearCost * (vatRate / 100);
  const netVATLiability = vatOnRevenue - inputVAT;

  const addFiling = () => {
    setTaxData(prev => ({
      ...prev,
      filings: [...(prev.filings || []), { id: Date.now(), period: "", outputVAT: "", inputVAT: "", netVAT: "", dueDate: "", status: "pending", notes: "" }],
    }));
  };

  const updateFiling = (i, key, val) => {
    setTaxData(prev => {
      const arr = [...(prev.filings || [])];
      arr[i] = { ...arr[i], [key]: val };
      // Auto-calc net
      if (key === "outputVAT" || key === "inputVAT") {
        const out = parseFloat(key === "outputVAT" ? val : arr[i].outputVAT) || 0;
        const inp = parseFloat(key === "inputVAT" ? val : arr[i].inputVAT) || 0;
        arr[i].netVAT = String(out - inp);
      }
      return { ...prev, filings: arr };
    });
  };

  const deleteFiling = (i) => {
    setTaxData(prev => ({ ...prev, filings: (prev.filings || []).filter((_, idx) => idx !== i) }));
  };

  const totalFiled = filings.filter(f => f.status === "filed" || f.status === "paid").reduce((s, f) => s + (parseFloat(f.netVAT) || 0), 0);
  const totalPending = filings.filter(f => f.status === "pending" || f.status === "due").reduce((s, f) => s + (parseFloat(f.netVAT) || 0), 0);

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "VAT Rate", value: vatRate + "%", color: T.text },
          { label: "Est. Output VAT", value: fmtK(vatOnRevenue), sub: "on revenue", color: "#b06000" },
          { label: "Est. Input VAT", value: fmtK(inputVAT), sub: "on costs (reclaimable)", color: "#1a6e3e" },
          { label: "Net VAT Liability", value: fmtK(netVATLiability), sub: "estimated annual", color: netVATLiability > 0 ? "#b0271d" : "#1a6e3e" },
        ].map((s, i) => (
          <div key={i} style={cardS(T)}>
            <div style={{ ...kpiLabelS, color: T.muted }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: 12, color: T.sub }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* VAT rate control */}
      <div style={{ ...cardS(T), marginBottom: 14, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted }}>VAT Rate %</span>
        <input value={vatRate} onChange={e => setTaxData(prev => ({ ...prev, vatRate: parseFloat(e.target.value) || 0 }))} type="number" step="0.5" min="0" max="100"
          style={{ border: `1px solid ${T.border}`, outline: "none", padding: "6px 10px", fontSize: 13, width: 70, borderRadius: 6, fontFamily: "inherit", color: T.text, background: T.surface }} />
        <span style={{ fontSize: 12, color: T.sub }}>UAE standard: 5% — Adjust for your jurisdiction</span>
      </div>

      {/* VAT filings table */}
      <div style={{ ...cardS(T), padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 12px" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted }}>VAT Return Filings</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>Filed: {fmtFull(totalFiled)} | Pending: {fmtFull(totalPending)}</div>
          </div>
          <button onClick={addFiling} style={{ fontSize: 11, fontWeight: 600, color: T.accent, background: "none", border: `1px solid ${T.accent}`, padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>+ Add Filing</button>
        </div>
        <div className="mob-table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 700 : "auto" }}>
            <thead><tr>
              <th style={thS}>Period</th>
              <th style={{ ...thS, textAlign: "right" }}>Output VAT</th>
              <th style={{ ...thS, textAlign: "right" }}>Input VAT</th>
              <th style={{ ...thS, textAlign: "right" }}>Net VAT</th>
              <th style={thS}>Due Date</th>
              <th style={thS}>Status</th>
              <th style={thS}>Notes</th>
              <th style={{ ...thS, width: 40 }}></th>
            </tr></thead>
            <tbody>
              {filings.map((f, i) => {
                const net = (parseFloat(f.outputVAT) || 0) - (parseFloat(f.inputVAT) || 0);
                const sc = f.status === "paid" ? { bg: "#e8f5e9", color: "#2e7d32" } : f.status === "filed" ? { bg: "#e3f2fd", color: "#1565c0" } : f.status === "overdue" ? { bg: "#fce4ec", color: "#b0271d" } : { bg: "#fff3e0", color: "#e65100" };
                return (
                  <tr key={f.id || i}>
                    <td style={tdS}>
                      <input value={f.period || ""} onChange={e => updateFiling(i, "period", e.target.value)} placeholder="Q1 2026"
                        style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, color: T.text, fontFamily: "inherit", width: 100 }} />
                    </td>
                    <td style={tdR}>
                      <input value={f.outputVAT || ""} onChange={e => updateFiling(i, "outputVAT", e.target.value)} placeholder="0" inputMode="numeric"
                        style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, color: T.text, fontFamily: "inherit", textAlign: "right", width: 90 }} />
                    </td>
                    <td style={tdR}>
                      <input value={f.inputVAT || ""} onChange={e => updateFiling(i, "inputVAT", e.target.value)} placeholder="0" inputMode="numeric"
                        style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, color: T.text, fontFamily: "inherit", textAlign: "right", width: 90 }} />
                    </td>
                    <td style={{ ...tdR, fontWeight: 600, color: net > 0 ? "#b0271d" : "#1a6e3e" }}>{fmtFull(net)}</td>
                    <td style={tdS}>
                      <input type="date" value={f.dueDate || ""} onChange={e => updateFiling(i, "dueDate", e.target.value)}
                        style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, color: T.text, fontFamily: "inherit" }} />
                    </td>
                    <td style={tdS}>
                      <select value={f.status || "pending"} onChange={e => updateFiling(i, "status", e.target.value)}
                        style={{ border: "none", outline: "none", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", background: sc.bg, color: sc.color, textTransform: "capitalize" }}>
                        {["pending", "due", "filed", "paid", "overdue"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={tdS}>
                      <input value={f.notes || ""} onChange={e => updateFiling(i, "notes", e.target.value)} placeholder="Notes…"
                        style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, color: T.sub, fontFamily: "inherit", width: "100%" }} />
                    </td>
                    <td style={{ ...tdS, textAlign: "center" }}>
                      <button onClick={() => deleteFiling(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 14, padding: 0 }} onMouseEnter={e => e.target.style.color = "#b0271d"} onMouseLeave={e => e.target.style.color = "#ccc"}>×</button>
                    </td>
                  </tr>
                );
              })}
              {filings.length === 0 && <tr><td colSpan={8} style={{ padding: 30, textAlign: "center", color: T.muted, fontSize: 13 }}>No VAT filings recorded. Click + Add Filing to start tracking.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
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
