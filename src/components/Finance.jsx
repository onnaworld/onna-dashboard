import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import Expenses from "./Expenses";
import { CSLogoSlot } from "./ui/DocHelpers";
import { PRINT_CLEANUP_CSS, estCalcTotals, actualsGrandExpenseTotal, actualsGrandEffective, actualsGrandZohoTotal, actualsSectionExpenseTotal, actualsSectionEffective, defaultSections, debouncedGlobalSave, globalApi, FINANCE_SLUGS } from "../utils/helpers";

/* ── Branded constants (matching estimates/callsheets) ── */
const F = "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
const LS = 0.5;
const LS_HDR = 1.5;
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CASHFLOW_INIT = () => ({
  id: Date.now(),
  label: "Cash Flow V1",
  prodLogo: null,
  clientLogo: null,
  currency: "AED",
  year: new Date().getFullYear(),
  availableYears: (() => { try { const s = localStorage.getItem("onna_available_years"); return s ? JSON.parse(s) : [2025, 2026]; } catch { return [2025, 2026]; } })(),
  openingBalance: 0, // legacy single value
  openingBalances: Array(12).fill(""), // per-month editable
  syncOverrides: {}, // manual overrides for synced values, keyed like "rev:ProjectName:0"
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
  vatReturns: Array(12).fill(""),
  notes: "",
});

/* ── Parse numbers with commas ── */
const parseNum = (v) => parseFloat(String(v).replace(/,/g, "")) || 0;

/* ── Shared helpers ── */
const fmtK = (n) => {
  if (n === 0) return "AED 0";
  const abs = Math.abs(n);
  if (abs >= 1000000) return (n < 0 ? "-" : "") + "AED " + (abs / 1000000).toFixed(1) + "M";
  if (abs >= 1000) return (n < 0 ? "-" : "") + "AED " + (abs / 1000).toFixed(0) + "k";
  return "AED " + n.toLocaleString("en-GB", { maximumFractionDigits: 0 });
};
const fmtFull = (n) => (n < 0 ? "-" : "") + "AED " + Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%";

/* ── Card/Table styles ── */
const cardS = (T) => ({ borderRadius: 16, padding: "20px 22px", background: T.surface, border: "1px solid " + T.border, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" });
const kpiLabelS = { fontSize: 11, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 };
const kpiValS = { fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 };

/* ── Month helpers for calendar year mapping (Jan=0 .. Dec=11) ── */
const MONTH_LABELS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const calMonthToIdx = (calMonth) => {
  // Calendar month 1-12 → index 0-11
  return (calMonth || 1) - 1;
};

/* ── Default overheads for P&L ── */
const DEFAULT_OVERHEADS = () => [
  { label: "Office & Studio Rent", amount: "", frequency: "monthly", subs: [] },
  { label: "Salaries (Non-Project)", amount: "", frequency: "monthly", subs: [] },
  { label: "Insurance", amount: "", frequency: "monthly", subs: [] },
  { label: "Software & Subscriptions", amount: "", frequency: "monthly", subs: [] },
  { label: "Marketing & Business Dev", amount: "", frequency: "monthly", subs: [] },
  { label: "Legal & Accounting", amount: "", frequency: "monthly", subs: [] },
  { label: "Utilities & Communications", amount: "", frequency: "monthly", subs: [] },
  { label: "Other Overheads", amount: "", frequency: "monthly", subs: [] },
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
  SearchBar, Pill, setUndoToastMsg,
}) {
  const [financeTab, _setFinanceTab] = useState(() => {
    const parts = window.location.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
    if (parts[0] === "finance" && parts[1] && FINANCE_SLUGS.includes(parts[1])) return parts[1];
    return null;
  });
  const setFinanceTab = useCallback((tab) => {
    _setFinanceTab(tab);
    const path = tab ? `/finance/${tab}` : "/finance";
    window.history.pushState({ tab: "Finance", financeTab: tab }, "", path);
  }, []);
  const revBoxRef = useRef(null);
  const [revBoxH, setRevBoxH] = useState(null);
  const [customFreqOpen, setCustomFreqOpen] = useState({});
  const [pnlProjectFilter, setPnlProjectFilter] = useState(null); // null = all, or project id
  const [pnlView, setPnlView] = useState("overview"); // "overview" or "byproject"

  // Sync financeTab with popstate (back/forward)
  useEffect(() => {
    const onPop = () => {
      const parts = window.location.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
      if (parts[0] === "finance" && parts[1] && FINANCE_SLUGS.includes(parts[1])) _setFinanceTab(parts[1]);
      else if (parts[0] === "finance") _setFinanceTab(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!revBoxRef.current) return;
    const ro = new ResizeObserver(([e]) => setRevBoxH(e.contentRect.height));
    ro.observe(revBoxRef.current);
    return () => ro.disconnect();
  }, [financeTab]);

  /* ── Available years (shared via localStorage + Turso) ── */
  const [availableYears, setAvailableYears] = useState(() => {
    try { const s = localStorage.getItem("onna_available_years"); return s ? JSON.parse(s) : [2025, 2026]; } catch { return [2025, 2026]; }
  });
  const financeHydratedRef = useRef(false);
  useEffect(() => { try { localStorage.setItem("onna_available_years", JSON.stringify(availableYears)); } catch {} if (financeHydratedRef.current) debouncedGlobalSave("finance_years", availableYears); }, [availableYears]);
  const [financeYear, setFinanceYear] = useState(new Date().getFullYear());

  /* ── Persisted overheads for P&L (localStorage + Turso) ── */
  const [overheads, setOverheads] = useState(() => {
    try { const s = localStorage.getItem("onna_pnl_overheads"); return s ? JSON.parse(s) : DEFAULT_OVERHEADS(); } catch { return DEFAULT_OVERHEADS(); }
  });
  useEffect(() => { try { localStorage.setItem("onna_pnl_overheads", JSON.stringify(overheads)); } catch {} if (financeHydratedRef.current) debouncedGlobalSave("pnl_overheads", overheads); }, [overheads]);

  /* ── Persisted AR/AP data (localStorage + Turso) ── */
  const [arapData, setArapData] = useState(() => {
    try { const s = localStorage.getItem("onna_arap_data"); return s ? JSON.parse(s) : DEFAULT_ARAP(); } catch { return DEFAULT_ARAP(); }
  });
  useEffect(() => { try { localStorage.setItem("onna_arap_data", JSON.stringify(arapData)); } catch {} if (financeHydratedRef.current) debouncedGlobalSave("arap_data", arapData); }, [arapData]);

  /* ── Persisted Tax data (localStorage + Turso) ── */
  const [taxData, setTaxData] = useState(() => {
    try { const s = localStorage.getItem("onna_tax_data"); return s ? JSON.parse(s) : { vatRate: 5, filings: [] }; } catch { return { vatRate: 5, filings: [] }; }
  });
  useEffect(() => { try { localStorage.setItem("onna_tax_data", JSON.stringify(taxData)); } catch {} if (financeHydratedRef.current) debouncedGlobalSave("tax_data", taxData); }, [taxData]);

  /* ── Persisted P&L project overrides (localStorage + Turso) ── */
  // Keyed by project id: { [pid]: { revenue: "...", cost: "..." } }
  const [pnlProjectOverrides, setPnlProjectOverrides] = useState(() => {
    try { const s = localStorage.getItem("onna_pnl_proj_overrides"); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  useEffect(() => { try { localStorage.setItem("onna_pnl_proj_overrides", JSON.stringify(pnlProjectOverrides)); } catch {} if (financeHydratedRef.current) debouncedGlobalSave("pnl_proj_overrides", pnlProjectOverrides); }, [pnlProjectOverrides]);

  /* ── Hydrate from Turso on mount, push localStorage → Turso if Turso is empty ── */
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      globalApi.get("pnl_overheads"),
      globalApi.get("arap_data"),
      globalApi.get("tax_data"),
      globalApi.get("finance_years"),
      globalApi.get("pnl_proj_overrides"),
    ]).then(([oh, ar, tx, yrs, po]) => {
      if (cancelled) return;
      if (oh.status === "fulfilled" && oh.value) { setOverheads(oh.value); try { localStorage.setItem("onna_pnl_overheads", JSON.stringify(oh.value)); } catch {} }
      if (ar.status === "fulfilled" && ar.value) { setArapData(ar.value); try { localStorage.setItem("onna_arap_data", JSON.stringify(ar.value)); } catch {} }
      if (tx.status === "fulfilled" && tx.value) { setTaxData(tx.value); try { localStorage.setItem("onna_tax_data", JSON.stringify(tx.value)); } catch {} }
      if (yrs.status === "fulfilled" && yrs.value && Array.isArray(yrs.value)) { setAvailableYears(yrs.value); try { localStorage.setItem("onna_available_years", JSON.stringify(yrs.value)); } catch {} }
      if (po.status === "fulfilled" && po.value) { setPnlProjectOverrides(po.value); try { localStorage.setItem("onna_pnl_proj_overrides", JSON.stringify(po.value)); } catch {} }
      financeHydratedRef.current = true;
      // Push localStorage data to Turso if Turso was empty (one-time migration)
      if (!(oh.status === "fulfilled" && oh.value)) { try { const ls = localStorage.getItem("onna_pnl_overheads"); if (ls) debouncedGlobalSave("pnl_overheads", JSON.parse(ls), 500); } catch {} }
      if (!(ar.status === "fulfilled" && ar.value)) { try { const ls = localStorage.getItem("onna_arap_data"); if (ls) debouncedGlobalSave("arap_data", JSON.parse(ls), 500); } catch {} }
      if (!(tx.status === "fulfilled" && tx.value)) { try { const ls = localStorage.getItem("onna_tax_data"); if (ls) debouncedGlobalSave("tax_data", JSON.parse(ls), 500); } catch {} }
      if (!(yrs.status === "fulfilled" && yrs.value)) { try { const ls = localStorage.getItem("onna_available_years"); if (ls) debouncedGlobalSave("finance_years", JSON.parse(ls), 500); } catch {} }
      if (!(po.status === "fulfilled" && po.value)) { try { const ls = localStorage.getItem("onna_pnl_proj_overrides"); if (ls) debouncedGlobalSave("pnl_proj_overrides", JSON.parse(ls), 500); } catch {} }
    });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line

  /* ── Computed data from projects ── */
  const projData = useMemo(() => {
    const all = allProjectsMerged || [];
    const nonTemplate = all.filter(p => p.client !== "TEMPLATE");
    const active = nonTemplate.filter(p => p.status === "Active");
    const completed = nonTemplate.filter(p => p.status === "Completed" || p.status === "Wrapped");
    const isAllTime = financeYear === "all";
    const thisYear = isAllTime ? nonTemplate : nonTemplate.filter(p => Number(p.year) === financeYear);
    const lastYear = isAllTime ? [] : nonTemplate.filter(p => Number(p.year) === financeYear - 1);

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
  }, [allProjectsMerged, localLeads, getProjRevenue, getProjCost, projectEstimates, projectActuals, financeYear]);

  /* ── P&L calculations (supports project filter) ── */
  const pnlData = useMemo(() => {
    const ovTotal = overheads.reduce((s, o) => {
      const freq = o.frequency || "monthly";
      const catAmt = parseNum(o.amount);
      const catMonthly = freq === "monthly" ? catAmt : freq === "custom" ? catAmt * ((o.months || []).length || 1) / 12 : catAmt / 12;
      const subsAmt = (o.subs || []).reduce((ss, sub) => {
        const sf = sub.frequency || "monthly";
        const sa = parseNum(sub.amount);
        if (sf === "monthly") return ss + sa;
        if (sf === "custom") return ss + sa * ((sub.months || []).length || 1) / 12;
        return ss + sa / 12;
      }, 0);
      return s + catMonthly + subsAmt;
    }, 0);

    // Filter projects for P&L
    const pnlProjects = pnlProjectFilter ? projData.thisYear.filter(p => String(p.id) === String(pnlProjectFilter)) : projData.thisYear;
    const getPnlRev = (p) => { const ov = pnlProjectOverrides[p.id]; return ov && ov.revenue !== undefined && String(ov.revenue).trim() !== "" ? parseNum(ov.revenue) : getProjRevenue(p); };
    const getPnlCost = (p) => { const ov = pnlProjectOverrides[p.id]; return ov && ov.cost !== undefined && String(ov.cost).trim() !== "" ? parseNum(ov.cost) : getProjCost(p); };
    const pnlRev = pnlProjects.reduce((s, p) => s + getPnlRev(p), 0);
    const pnlCost = pnlProjects.reduce((s, p) => s + getPnlCost(p), 0);
    const isSingleProject = pnlProjectFilter !== null;

    const grossProfit = pnlRev - pnlCost;
    const grossMargin = pnlRev > 0 ? (grossProfit / pnlRev) * 100 : 0;
    // Only include overheads when viewing all projects
    const effectiveOv = isSingleProject ? 0 : ovTotal;
    const netProfit = grossProfit - effectiveOv;
    const netMargin = pnlRev > 0 ? (netProfit / pnlRev) * 100 : 0;

    // Revenue by project
    const revByProject = pnlProjects.map(p => ({
      id: p.id,
      name: p.name || p.title || "Untitled",
      client: p.client,
      rev: getPnlRev(p),
      cost: getPnlCost(p),
      defaultRev: getProjRevenue(p),
      defaultCost: getProjCost(p),
    })).sort((a, b) => b.rev - a.rev);

    // Cost breakdown from actuals sections
    const costBreakdown = {};
    pnlProjects.forEach(p => {
      const acts = projectActuals?.[p.id];
      if (!acts) return;
      acts.forEach(sec => {
        const title = sec.title || "Other";
        const total = actualsSectionEffective(sec);
        costBreakdown[title] = (costBreakdown[title] || 0) + total;
      });
    });
    const costSections = Object.entries(costBreakdown).map(([title, total]) => ({ title, total })).sort((a, b) => b.total - a.total);

    return { ovTotal, effectiveOv, grossProfit, grossMargin, netProfit, netMargin, revByProject, costSections, pnlRev, pnlCost, isSingleProject };
  }, [projData, overheads, getProjRevenue, getProjCost, projectActuals, pnlProjectFilter, pnlProjectOverrides]);

  /* ── AR/AP calculations ── */
  const arapCalcs = useMemo(() => {
    const totalAR = (arapData.receivables || []).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const overdueAR = (arapData.receivables || []).filter(r => r.dueDate && new Date(r.dueDate) < new Date() && r.status !== "paid").reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const totalAP = (arapData.payables || []).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const overdueAP = (arapData.payables || []).filter(r => r.dueDate && new Date(r.dueDate) < new Date() && r.status !== "paid").reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    return { totalAR, overdueAR, totalAP, overdueAP, netPosition: totalAR - totalAP };
  }, [arapData]);

  const subTabs = [
    { key: "stats", label: "Stats", emoji: "\ud83d\udcca", sub: "KPIs & top projects" },
    { key: "pnl", label: "P&L", emoji: "\ud83d\udcc4", sub: "Profit & loss statement" },
    { key: "cashflow", label: "Cash Flow", emoji: "\ud83d\udcb0", sub: "Monthly cash tracker" },
    { key: "arap", label: "AR / AP", emoji: "\ud83d\udce5", sub: "Receivables & payables" },
    { key: "tax", label: "Tax & VAT", emoji: "\ud83c\udfe6", sub: "Tax filings & VAT" },
    { key: "expenses", label: "Expenses", emoji: "\ud83d\udcb3", sub: "Expense tracking" },
  ];

  /* ── Shared table styles ── */
  const thS = { fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted, padding: "10px 14px", borderBottom: `2px solid ${T.border}`, textAlign: "left" };
  const tdS = { fontSize: 12.5, padding: "11px 14px", borderBottom: `1px solid ${T.borderSub || T.border}`, color: T.text };
  const tdR = { ...tdS, textAlign: "right", fontVariantNumeric: "tabular-nums" };

  const isSubPage = financeTab !== null;
  const yearLabel = financeYear === "all" ? "All Time" : financeYear;

  return (
    <div>
      {/* ── Persistent nav bar (visible on all sub-pages) ── */}
      {isSubPage && (
        <div style={{ display: "flex", gap: 4, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setFinanceTab(null)}
            style={{
              padding: "5px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500,
              border: "1px solid #d1d1d6", background: "#e8e8ed", color: T.sub,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>
            <span style={{ fontSize: 13, lineHeight: 1 }}>&larr;</span>
          </button>
          {subTabs.map(st => (
            <button key={st.key} onClick={() => setFinanceTab(st.key)}
              style={{
                padding: "5px 12px", borderRadius: 999, fontSize: 11.5, fontWeight: 500,
                border: financeTab === st.key ? `1px solid ${T.accent}` : "1px solid #d1d1d6",
                background: financeTab === st.key ? T.accent : "#e8e8ed",
                color: financeTab === st.key ? "#fff" : T.sub,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s", whiteSpace: "nowrap",
              }}>{st.emoji} {st.label}</button>
          ))}
        </div>
      )}

      {/* ═══ HOME — year pills + card grid ═══ */}
      {!isSubPage && <>
        {/* Year selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18, alignItems: "center" }}>
          <button onClick={() => setFinanceYear("all")}
            style={{
              padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 500,
              border: financeYear === "all" ? `1px solid ${T.accent}` : "1px solid #d1d1d6",
              background: financeYear === "all" ? T.accent : "#e8e8ed",
              color: financeYear === "all" ? "#fff" : T.sub,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
            }}>All Time</button>
          {(() => { const yrs = new Set(availableYears); (allProjectsMerged || []).forEach(p => { if (p.year) yrs.add(p.year); }); return [...yrs].sort(); })().map((y, _, arr) => (
            <div key={y} style={{ display: "inline-flex", alignItems: "center", position: "relative" }}>
              <button onClick={() => setFinanceYear(y)}
                style={{
                  padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 500,
                  border: financeYear === y ? `1px solid ${T.accent}` : "1px solid #d1d1d6",
                  background: financeYear === y ? T.accent : "#e8e8ed",
                  color: financeYear === y ? "#fff" : T.sub,
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                }}>{y}</button>
              {y === arr[arr.length - 1] && availableYears.length > 1 && (
                <button onClick={e => { e.stopPropagation(); if (window.confirm(`Remove ${y}?`)) { setAvailableYears(prev => prev.filter(yr => yr !== y).sort()); if (financeYear === y) setFinanceYear(arr[arr.length - 2]); } }} style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#e0e0e0", border: "none", fontSize: 10, color: "#666", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0, zIndex: 1 }} title={`Remove ${y}`}>×</button>
              )}
            </div>
          ))}
          <button onClick={() => { const next = Math.max(...availableYears, new Date().getFullYear()) + 1; setAvailableYears(prev => [...prev, next].sort()); }} style={{ width: 28, height: 28, borderRadius: 8, border: `1.5px dashed ${T.border}`, background: "transparent", fontSize: 14, color: "#999", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }} title="Add year">+</button>
        </div>

        {/* Card grid — mirrors Projects tab */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 10 }}>
          {subTabs.map(st => (
            <button key={st.key} onClick={() => setFinanceTab(st.key)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "16px 18px", borderRadius: 16,
                background: T.surface, border: `1px solid ${T.border}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                textAlign: "left", textDecoration: "none", color: "inherit",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{st.emoji}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: T.text, marginBottom: 2 }}>{st.label}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{st.sub}</div>
              </div>
              <span style={{ marginLeft: "auto", color: T.muted, fontSize: 16, flexShrink: 0 }}>&rsaquo;</span>
            </button>
          ))}
        </div>
      </>}

      {/* ═══ STATS PAGE (KPIs + Top Projects + Budget Alerts) ═══ */}
      {financeTab === "stats" && (
        <div>
          {/* KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: isMobile ? 10 : 14, marginBottom: 22 }}>
            {(financeYear === "all" ? [
              { label: "All-Time Revenue", value: fmtK(projData.totalRev), sub: projData.nonTemplate.length + " total projects", color: T.text },
              { label: "All-Time Profit", value: fmtK(projData.totalProfit), sub: projData.avgMargin + "% avg margin", color: projData.totalProfit >= 0 ? "#1a6e3e" : "#b0271d" },
              { label: "Active Projects", value: projData.active.length, sub: projData.completed.length + " completed", color: T.text },
              { label: "Pipeline", value: apiLoading ? "\u2014" : fmtK(projData.pipeline), sub: projData.newLeads + " new leads", color: T.text },
              { label: "Outstanding AR", value: fmtK(arapCalcs.totalAR), sub: arapCalcs.overdueAR > 0 ? fmtK(arapCalcs.overdueAR) + " overdue" : "none overdue", color: arapCalcs.overdueAR > 0 ? "#b06000" : T.text },
              { label: "Avg Margin", value: projData.avgMargin + "%", color: projData.avgMargin >= 20 ? "#1a6e3e" : "#b06000" },
            ] : [
              { label: `Revenue ${financeYear}`, value: fmtK(projData.thisYearRev), sub: projData.thisYear.length + " projects", color: T.text },
              { label: `Profit ${financeYear}`, value: fmtK(projData.thisYearProfit), sub: projData.thisYearMargin + "% margin", color: projData.thisYearProfit >= 0 ? "#1a6e3e" : "#b0271d" },
              { label: "Pipeline", value: apiLoading ? "\u2014" : fmtK(projData.pipeline), sub: projData.newLeads + " new leads", color: T.text },
              { label: "Active Projects", value: projData.active.length, sub: projData.completed.length + " completed", color: T.text },
              { label: "Outstanding AR", value: fmtK(arapCalcs.totalAR), sub: arapCalcs.overdueAR > 0 ? fmtK(arapCalcs.overdueAR) + " overdue" : "none overdue", color: arapCalcs.overdueAR > 0 ? "#b06000" : T.text },
              { label: "YoY Growth", value: projData.lastYearRev > 0 ? fmtPct(((projData.thisYearRev - projData.lastYearRev) / projData.lastYearRev) * 100) : "N/A", sub: `vs ${financeYear - 1}`, color: projData.thisYearRev >= projData.lastYearRev ? "#1a6e3e" : "#b0271d" },
            ]).map((s, i) => (
              <div key={i} style={cardS(T)}>
                <div style={{ ...kpiLabelS, color: T.muted }}>{s.label}</div>
                <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4, color: s.color || T.text }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: 13, color: T.sub }}>{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Top Projects by Revenue — profitability table */}
          <div style={{ ...cardS(T), padding: 0, overflow: "hidden", marginBottom: 22 }}>
            <div style={{ padding: "16px 20px 0" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted, marginBottom: 12 }}>Top Projects by Revenue</div>
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
                  {projData.projBreakdown.sort((a, b) => b.rev - a.rev).map((p) => (
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
                        {p.variance === null ? "\u2014" : p.variance >= 0 ? "Under " + fmtK(p.variance) : "Over " + fmtK(Math.abs(p.variance))}
                      </td>
                    </tr>
                  ))}
                  {projData.projBreakdown.length === 0 && <tr><td colSpan={8} style={{ ...tdS, textAlign: "center", color: T.muted }}>No projects</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Budget Alerts */}
          <div style={{ ...cardS(T), padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted }}>Budget Alerts</div>
            </div>
            <div style={{ padding: 0 }}>
              {projData.overBudget.map((p, i) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: i < projData.overBudget.length - 1 ? `1px solid ${T.borderSub || T.border}` : "none" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>{p.client} &middot; Est: {fmtK(p.estimateTotal || 0)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#b0271d" }}>{fmtK(Math.abs(p.variance))}</div>
                    <div style={{ fontSize: 12, color: "#b0271d" }}>over budget</div>
                  </div>
                </div>
              ))}
              {projData.overBudget.length === 0 && <div style={{ padding: 24, textAlign: "center", color: T.muted, fontSize: 14 }}>All projects on budget</div>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ P&L ═══ */}
      {financeTab === "pnl" && (
        <div>
          {/* View toggle: Overview | By Project */}
          <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
            {[{ key: "overview", label: "Overview" }, { key: "byproject", label: "By Project" }].map(v => (
              <button key={v.key} onClick={() => setPnlView(v.key)}
                style={{
                  padding: "7px 20px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  border: `1px solid ${T.border}`, borderRight: v.key === "overview" ? "none" : `1px solid ${T.border}`,
                  borderRadius: v.key === "overview" ? "8px 0 0 8px" : "0 8px 8px 0",
                  background: pnlView === v.key ? "#000" : T.surface,
                  color: pnlView === v.key ? "#fff" : T.sub,
                }}>{v.label}</button>
            ))}
          </div>

          {/* Project filter (overview only) */}
          {pnlView === "overview" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => setPnlProjectFilter(null)}
              style={{
                padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 500,
                border: pnlProjectFilter === null ? `1px solid ${T.accent}` : "1px solid #d1d1d6",
                background: pnlProjectFilter === null ? T.accent : "#e8e8ed",
                color: pnlProjectFilter === null ? "#fff" : T.sub,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
              }}>All Projects</button>
            {projData.thisYear.map(p => (
              <button key={p.id} onClick={() => setPnlProjectFilter(String(p.id))}
                style={{
                  padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 500,
                  border: String(pnlProjectFilter) === String(p.id) ? `1px solid ${T.accent}` : "1px solid #d1d1d6",
                  background: String(pnlProjectFilter) === String(p.id) ? T.accent : "#e8e8ed",
                  color: String(pnlProjectFilter) === String(p.id) ? "#fff" : T.sub,
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s", whiteSpace: "nowrap",
                }}>{p.name || p.title || "Untitled"}</button>
            ))}
          </div>
          )}

          {/* ═══ BY PROJECT VIEW ═══ */}
          {pnlView === "byproject" && (
            <div style={{ ...cardS(T), padding: 0, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ padding: "16px 20px 0" }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted, marginBottom: 12 }}>{"P&L by Project \u2014 " + yearLabel}</div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>
                    <th style={thS}>Project</th>
                    <th style={thS}>Client</th>
                    <th style={{ ...thS, textAlign: "right" }}>Revenue</th>
                    <th style={{ ...thS, textAlign: "right" }}>Direct Costs</th>
                    <th style={{ ...thS, textAlign: "right" }}>Gross Profit</th>
                    <th style={{ ...thS, textAlign: "right" }}>Margin</th>
                  </tr></thead>
                  <tbody>
                    {pnlData.revByProject.map((p, i) => {
                      const ov = pnlProjectOverrides[p.id] || {};
                      const revRaw = ov.revenue !== undefined ? ov.revenue : "";
                      const costRaw = ov.cost !== undefined ? ov.cost : "";
                      const revIsOverride = String(revRaw).trim() !== "";
                      const costIsOverride = String(costRaw).trim() !== "";
                      const profit = p.rev - p.cost;
                      const margin = p.rev > 0 ? ((profit / p.rev) * 100).toFixed(1) : "0.0";
                      return (
                      <tr key={p.id || i} style={i % 2 === 1 ? { background: T.bg } : {}}>
                        <td style={{ ...tdS, fontWeight: 600 }}>{p.name}</td>
                        <td style={{ ...tdS, color: T.muted }}>{p.client}</td>
                        <td style={{ ...tdR, padding: "2px 14px 2px 4px" }}>
                          <input
                            value={revIsOverride ? revRaw : ""}
                            placeholder={p.defaultRev ? p.defaultRev.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                            onChange={e => { const val = e.target.value; setPnlProjectOverrides(prev => ({ ...prev, [p.id]: { ...(prev[p.id] || {}), revenue: val } })); }}
                            style={{ fontFamily: "inherit", fontSize: 12.5, border: "none", background: "transparent", outline: "none", textAlign: "right", width: 120, color: revIsOverride ? "#1a6e3e" : "#999", fontStyle: revIsOverride ? "normal" : "italic", padding: "4px 0" }}
                            inputMode="numeric"
                            onFocus={e => { e.target.style.background = "#f0f5ff"; e.target.style.borderRadius = "4px"; }}
                            onBlur={e => { e.target.style.background = "transparent"; }}
                          />
                        </td>
                        <td style={{ ...tdR, padding: "2px 14px 2px 4px" }}>
                          <input
                            value={costIsOverride ? costRaw : ""}
                            placeholder={p.defaultCost ? p.defaultCost.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                            onChange={e => { const val = e.target.value; setPnlProjectOverrides(prev => ({ ...prev, [p.id]: { ...(prev[p.id] || {}), cost: val } })); }}
                            style={{ fontFamily: "inherit", fontSize: 12.5, border: "none", background: "transparent", outline: "none", textAlign: "right", width: 120, color: costIsOverride ? "#b0271d" : "#999", fontStyle: costIsOverride ? "normal" : "italic", padding: "4px 0" }}
                            inputMode="numeric"
                            onFocus={e => { e.target.style.background = "#f0f5ff"; e.target.style.borderRadius = "4px"; }}
                            onBlur={e => { e.target.style.background = "transparent"; }}
                          />
                        </td>
                        <td style={{ ...tdR, fontWeight: 600, color: profit >= 0 ? "#1a6e3e" : "#b0271d" }}>{fmtFull(profit)}</td>
                        <td style={{ ...tdR, color: parseFloat(margin) >= 20 ? "#1a6e3e" : parseFloat(margin) >= 0 ? "#b06000" : "#b0271d" }}>{margin}%</td>
                      </tr>
                      );
                    })}
                    {pnlData.revByProject.length === 0 && (
                      <tr><td colSpan={6} style={{ ...tdS, textAlign: "center", color: T.muted, padding: 24 }}>No projects for {yearLabel}</td></tr>
                    )}
                    {/* Totals row */}
                    {pnlData.revByProject.length > 0 && (
                      <tr style={{ background: T.bg }}>
                        <td colSpan={2} style={{ ...tdS, fontWeight: 700, borderTop: `2px solid ${T.border}`, borderBottom: "none" }}>Total</td>
                        <td style={{ ...tdR, fontWeight: 700, borderTop: `2px solid ${T.border}`, borderBottom: "none", color: "#1a6e3e" }}>{fmtFull(pnlData.pnlRev)}</td>
                        <td style={{ ...tdR, fontWeight: 700, borderTop: `2px solid ${T.border}`, borderBottom: "none", color: "#b0271d" }}>{fmtFull(pnlData.pnlCost)}</td>
                        <td style={{ ...tdR, fontWeight: 700, borderTop: `2px solid ${T.border}`, borderBottom: "none", color: pnlData.grossProfit >= 0 ? "#1a6e3e" : "#b0271d" }}>{fmtFull(pnlData.grossProfit)}</td>
                        <td style={{ ...tdR, fontWeight: 700, borderTop: `2px solid ${T.border}`, borderBottom: "none", color: pnlData.grossMargin >= 20 ? "#1a6e3e" : "#b06000" }}>{pnlData.grossMargin.toFixed(1)}%</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ OVERVIEW VIEW ═══ */}
          {pnlView === "overview" && <>
          {/* P&L summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
            {[
              { label: "Total Revenue", value: fmtK(pnlData.pnlRev), color: T.text },
              { label: "Direct Costs", value: fmtK(pnlData.pnlCost), color: "#b0271d" },
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

          <div>
            {/* Overheads */}
            <div style={{ ...cardS(T), padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ padding: "16px 20px 0", flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted, marginBottom: 12 }}>Operating Overheads</div>
              </div>
              <div className="mob-table-wrap" style={{ overflowY: "auto", flex: 1 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>
                    <th style={{ ...thS, width: 28, textAlign: "center" }} title="Include in Cash Flow"><span style={{ fontSize: 8 }}>CF</span></th>
                    <th style={thS}>Category</th>
                    <th style={thS}>Frequency</th>
                    <th style={{ ...thS, textAlign: "right" }}>Monthly</th>
                    <th style={{ ...thS, textAlign: "right" }}>Annual</th>
                  </tr></thead>
                  <tbody>
                    {overheads.map((o, i) => {
                      const freq = o.frequency || "monthly";
                      const subs = o.subs || [];
                      const collapsed = o._collapsed;
                      const hasSubs = subs.length > 0;
                      const calcAnnual = (amt, f, months) => {
                        const v = parseNum(amt);
                        if (f === "monthly") return v * 12;
                        if (f === "custom") return v * ((months || []).length || 0);
                        return v;
                      };
                      const calcMonthly = (amt, f, months) => {
                        const v = parseNum(amt);
                        if (f === "monthly") return v;
                        if (f === "custom") return v * ((months || []).length || 0) / 12;
                        return v / 12;
                      };
                      /* Auto-sync parent total from subs */
                      const subsMonthlyTotal = hasSubs ? subs.reduce((s, sub) => s + calcMonthly(sub.amount, sub.frequency || "monthly", sub.months), 0) : 0;
                      const subsAnnualTotal = hasSubs ? subs.reduce((s, sub) => s + calcAnnual(sub.amount, sub.frequency || "monthly", sub.months), 0) : 0;
                      const displayMonthly = hasSubs ? subsMonthlyTotal : parseNum(o.amount);
                      const displayAnnual = hasSubs ? subsAnnualTotal : calcAnnual(o.amount, freq, o.months);
                      const MSHORT = ["J","F","M","A","M","J","J","A","S","O","N","D"];
                      const freqSelect = (val, onChange, monthsVal, onMonthsChange, isSmall, freqKey) => {
                        const isOpen = customFreqOpen[freqKey];
                        const selectedMonths = val === "custom" ? (monthsVal || []) : [];
                        const summaryText = selectedMonths.length > 0 ? selectedMonths.map(m => MSHORT[m - 1]).join(", ") : "";
                        return (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                          <select value={val} onChange={e => { onChange(e.target.value); if (e.target.value === "custom") setCustomFreqOpen(p => ({ ...p, [freqKey]: true })); }}
                            style={{ border: "none", outline: "none", background: "transparent", fontSize: isSmall ? 10 : 11, color: T.text, fontFamily: "inherit", cursor: "pointer" }}>
                            <option value="monthly">Monthly</option>
                            <option value="annual">One-off</option>
                            <option value="custom">Custom</option>
                          </select>
                          {val === "annual" && (
                            <select value={monthsVal || "1"} onChange={e => onMonthsChange(e.target.value)}
                              style={{ border: `1px solid ${T.border}`, outline: "none", background: "transparent", fontSize: isSmall ? 10 : 11, color: T.text, fontFamily: "inherit", cursor: "pointer", padding: "2px 4px", borderRadius: 4 }}>
                              {MONTH_LABELS_FULL.map((m, mi) => <option key={mi} value={mi + 1}>{m}</option>)}
                            </select>
                          )}
                          {val === "custom" && !isOpen && (
                            <button onClick={() => setCustomFreqOpen(p => ({ ...p, [freqKey]: true }))}
                              style={{ fontSize: isSmall ? 9 : 10, color: T.accent, background: "none", border: `1px solid ${T.border}`, borderRadius: 4, padding: "1px 6px", cursor: "pointer", fontFamily: "inherit" }}>
                              {summaryText || "Select"}
                            </button>
                          )}
                          {val === "custom" && isOpen && (
                            <div style={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                              {MSHORT.map((ml, mi) => {
                                const active = (monthsVal || []).includes(mi + 1);
                                return <button key={mi} onClick={() => { const cur = monthsVal || []; onMonthsChange(active ? cur.filter(x => x !== mi + 1) : [...cur, mi + 1].sort((a,b)=>a-b)); }}
                                  style={{ width: 20, height: 20, borderRadius: 4, fontSize: 8, fontWeight: 600, border: active ? `1px solid ${T.accent}` : `1px solid ${T.border}`, background: active ? T.accent : "transparent", color: active ? "#fff" : T.muted, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>{ml}</button>;
                              })}
                              <button onClick={() => setCustomFreqOpen(p => ({ ...p, [freqKey]: false }))}
                                style={{ fontSize: 10, color: T.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "0 4px", fontFamily: "inherit" }}>Done</button>
                            </div>
                          )}
                        </div>
                        );
                      };
                      const amtInput = (val, onChange, isSmall) => (
                        <input value={val || ""} onChange={e => onChange(e.target.value)}
                          placeholder="0"
                          style={{ border: "none", outline: "none", background: "transparent", fontSize: isSmall ? 12 : 12.5, color: isSmall ? T.sub : T.text, fontFamily: "inherit", textAlign: "right", width: 100 }}
                          onFocus={e => e.target.style.background = "#f0f5ff"} onBlur={e => e.target.style.background = "transparent"} />
                      );
                      return (
                      <React.Fragment key={i}>
                      <tr style={o._excludeFromCF ? { opacity: 0.5 } : undefined} onMouseEnter={e => { const d = e.currentTarget.querySelector(".oh-del"); if (d) d.style.visibility = "visible"; const a = e.currentTarget.querySelector(".oh-add-sub"); if (a) a.style.visibility = "visible"; }} onMouseLeave={e => { const d = e.currentTarget.querySelector(".oh-del"); if (d) d.style.visibility = "hidden"; const a = e.currentTarget.querySelector(".oh-add-sub"); if (a) a.style.visibility = "hidden"; }}>
                        <td style={{ ...tdS, textAlign: "center", width: 28, padding: "0 4px" }}>
                          <span onClick={() => { const n = [...overheads]; n[i] = { ...n[i], _excludeFromCF: !o._excludeFromCF }; setOverheads(n); }} title={o._excludeFromCF ? "Excluded from cash flow — click to include" : "Included in cash flow — click to exclude"} style={{ width: 12, height: 12, borderRadius: "50%", background: o._excludeFromCF ? "#e74c3c" : "#2ecc71", cursor: "pointer", display: "inline-block", border: "1px solid rgba(0,0,0,0.1)", transition: "background 0.15s" }} />
                        </td>
                        <td style={tdS}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button className="oh-del" onClick={() => setOverheads(prev => prev.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 14, padding: 0, visibility: "hidden", lineHeight: 1 }} onMouseEnter={e => e.target.style.color = "#b0271d"} onMouseLeave={e => e.target.style.color = "#ccc"}>×</button>
                            {hasSubs && <button onClick={() => { const n = [...overheads]; n[i] = { ...n[i], _collapsed: !collapsed }; setOverheads(n); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 10, padding: 0, lineHeight: 1, flexShrink: 0, transition: "transform 0.15s", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>▾</button>}
                            <input value={o.label} onChange={e => { const n = [...overheads]; n[i] = { ...n[i], label: e.target.value }; setOverheads(n); }}
                              style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, fontWeight: 600, color: T.text, fontFamily: "inherit", width: "100%" }} />
                            <button className="oh-add-sub" onClick={() => { const n = [...overheads]; n[i] = { ...n[i], _collapsed: false, subs: [...subs, { label: "Sub-item", amount: "", frequency: "monthly" }] }; setOverheads(n); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 14, padding: 0, visibility: "hidden", lineHeight: 1, flexShrink: 0 }} onMouseEnter={e => e.target.style.color = T.accent} onMouseLeave={e => e.target.style.color = "#ccc"} title="Add sub-category">+</button>
                          </div>
                        </td>
                        <td style={tdS}>
                          {hasSubs
                            ? <span style={{ fontSize: 10, color: T.muted }}>Auto</span>
                            : freqSelect(freq, v => { const n = [...overheads]; n[i] = { ...n[i], frequency: v }; setOverheads(n); }, freq === "custom" ? (o.months || []) : (o.month || "1"), v => { const n = [...overheads]; n[i] = freq === "custom" ? { ...n[i], months: v } : { ...n[i], month: v }; setOverheads(n); }, false, `oh-${i}`)}
                        </td>
                        <td style={tdR}>
                          {hasSubs
                            ? <span style={{ fontSize: 12.5, color: T.muted }}>{fmtFull(displayMonthly)}</span>
                            : amtInput(o.amount, v => {
                                const n = [...overheads];
                                n[i] = { ...n[i], amount: v, annual: String(calcAnnual(v, freq, o.months)) };
                                setOverheads(n);
                              })}
                        </td>
                        <td style={tdR}>
                          {hasSubs
                            ? <span style={{ fontSize: 12.5, color: T.muted }}>{fmtFull(displayAnnual)}</span>
                            : <input value={o.annual != null ? o.annual : calcAnnual(o.amount, freq, o.months) || ""} onChange={e => {
                                const ann = e.target.value;
                                const n = [...overheads];
                                const annVal = parseNum(ann);
                                if (freq === "monthly") {
                                  n[i] = { ...n[i], annual: ann, amount: String(annVal ? Math.round((annVal / 12) * 100) / 100 : 0) };
                                } else if (freq === "custom") {
                                  const mc = (o.months || []).length || 1;
                                  n[i] = { ...n[i], annual: ann, amount: String(annVal ? Math.round((annVal / mc) * 100) / 100 : 0) };
                                } else {
                                  n[i] = { ...n[i], annual: ann, amount: ann };
                                }
                                setOverheads(n);
                              }}
                                placeholder="0"
                                style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, color: T.text, fontFamily: "inherit", textAlign: "right", width: 100 }}
                                onFocus={e => e.target.style.background = "#f0f5ff"} onBlur={e => e.target.style.background = "transparent"} />
                          }
                        </td>
                      </tr>
                      {/* Sub-categories (collapsible) */}
                      {!collapsed && subs.map((sub, si) => {
                        const sf = sub.frequency || "monthly";
                        return (
                        <tr key={`${i}-sub-${si}`} style={sub._excludeFromCF ? { opacity: 0.5 } : undefined} onMouseEnter={e => { const d = e.currentTarget.querySelector(".sub-del"); if (d) d.style.visibility = "visible"; }} onMouseLeave={e => { const d = e.currentTarget.querySelector(".sub-del"); if (d) d.style.visibility = "hidden"; }}>
                          <td style={{ ...tdS, textAlign: "center", width: 28, padding: "0 4px" }}>
                            <span onClick={() => { const n = [...overheads]; const s = [...subs]; s[si] = { ...s[si], _excludeFromCF: !sub._excludeFromCF }; n[i] = { ...n[i], subs: s }; setOverheads(n); }} title={sub._excludeFromCF ? "Excluded from cash flow — click to include" : "Included in cash flow — click to exclude"} style={{ width: 10, height: 10, borderRadius: "50%", background: sub._excludeFromCF ? "#e74c3c" : "#2ecc71", cursor: "pointer", display: "inline-block", border: "1px solid rgba(0,0,0,0.1)", transition: "background 0.15s" }} />
                          </td>
                          <td style={{ ...tdS, paddingLeft: 38 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <button className="sub-del" onClick={() => { const n = [...overheads]; n[i] = { ...n[i], subs: subs.filter((_, idx) => idx !== si) }; setOverheads(n); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 12, padding: 0, visibility: "hidden", lineHeight: 1 }} onMouseEnter={e => e.target.style.color = "#b0271d"} onMouseLeave={e => e.target.style.color = "#ccc"}>×</button>
                              <input value={sub.label} onChange={e => { const n = [...overheads]; const s = [...subs]; s[si] = { ...s[si], label: e.target.value }; n[i] = { ...n[i], subs: s }; setOverheads(n); }}
                                style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, color: T.sub, fontFamily: "inherit", width: "100%" }} />
                            </div>
                          </td>
                          <td style={tdS}>
                            {freqSelect(sf, v => { const n = [...overheads]; const s = [...subs]; s[si] = { ...s[si], frequency: v }; n[i] = { ...n[i], subs: s }; setOverheads(n); }, sf === "custom" ? (sub.months || []) : (sub.month || "1"), v => { const n = [...overheads]; const s = [...subs]; s[si] = sf === "custom" ? { ...s[si], months: v } : { ...s[si], month: v }; n[i] = { ...n[i], subs: s }; setOverheads(n); }, true, `oh-${i}-sub-${si}`)}
                          </td>
                          <td style={tdR}>
                            {amtInput(sub.amount, v => { const n = [...overheads]; const s = [...subs]; s[si] = { ...s[si], amount: v }; n[i] = { ...n[i], subs: s }; setOverheads(n); }, true)}
                          </td>
                          <td style={{ ...tdR, color: T.muted, fontSize: 12 }}>{fmtFull(calcAnnual(sub.amount, sf, sub.months))}</td>
                        </tr>
                        );
                      })}
                      </React.Fragment>
                      );
                    })}
                    <tr><td colSpan={5} style={{ padding: "8px 14px", borderBottom: "none" }}>
                      <button onClick={() => setOverheads(prev => [...prev, { label: "New Overhead", amount: "", frequency: "monthly", subs: [] }])}
                        style={{ fontSize: 11, color: T.muted, background: "none", border: "1px dashed " + T.border, padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>+ Add row</button>
                    </td></tr>
                    <tr style={{ background: T.bg }}>
                      <td colSpan={3} style={{ ...tdS, fontWeight: 700, borderBottom: "none" }}>Total Overheads</td>
                      <td style={{ ...tdR, fontWeight: 700, borderBottom: "none", color: "#b0271d" }}>{fmtFull(pnlData.ovTotal)}</td>
                      <td style={{ ...tdR, fontWeight: 700, borderBottom: "none", color: "#b0271d" }}>{fmtFull(pnlData.ovTotal * 12)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "8px 20px 12px", display: "flex", gap: 14, alignItems: "center", fontSize: 10, color: T.muted }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ecc71", display: "inline-block", border: "1px solid rgba(0,0,0,0.1)" }} /> Included in Cash Flow</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#e74c3c", display: "inline-block", border: "1px solid rgba(0,0,0,0.1)" }} /> Excluded from Cash Flow</span>
              </div>
            </div>
          </div>

          {/* P&L Statement summary */}
          <div style={{ ...cardS(T), marginTop: 14, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 0" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted, marginBottom: 12 }}>{"Profit & Loss Statement \u2014 " + yearLabel + (pnlProjectFilter ? " \u2014 " + (projData.thisYear.find(p => String(p.id) === String(pnlProjectFilter))?.name || "") : "")}</div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  { label: "Revenue (Project Fees)", value: pnlData.pnlRev, bold: true },
                  ...pnlData.costSections.map(s => ({ label: "  " + s.title, value: -s.total, indent: true })),
                  { label: "Total Direct Costs", value: -pnlData.pnlCost, bold: true, border: true },
                  { label: "GROSS PROFIT", value: pnlData.grossProfit, bold: true, highlight: true, pct: pnlData.grossMargin },
                  ...(pnlData.isSingleProject ? [] : [
                    { label: "", spacer: true },
                    ...overheads.filter(o => parseNum(o.amount) > 0).map(o => ({ label: "  " + o.label, value: -(parseNum(o.amount)), indent: true })),
                    { label: "Total Overheads", value: -pnlData.effectiveOv, bold: true, border: true },
                  ]),
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
          </>}
        </div>
      )}

      {/* ═══ CASH FLOW ═══ */}
      {financeTab === "cashflow" && (
        <CashFlowDoc
          T={T} isMobile={isMobile}
          cashFlowStore={cashFlowStore} setCashFlowStore={setCashFlowStore}
          activeCashFlowVersion={activeCashFlowVersion} setActiveCashFlowVersion={setActiveCashFlowVersion}
          syncedOverheads={overheads} syncedRevenue={projData.thisYearRev} syncedCost={projData.thisYearCost}
          syncedProjects={projData.thisYear} getProjRevenue={getProjRevenue} getProjCost={getProjCost}
          financeYear={financeYear}
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

      {/* ═══ TAX & VAT ═══ */}
      {financeTab === "tax" && (
        <TaxVATTab T={T} isMobile={isMobile} taxData={taxData} setTaxData={setTaxData} projData={projData} cardS={cardS} kpiLabelS={kpiLabelS} thS={thS} tdS={tdS} tdR={tdR} />
      )}

      {financeTab === "expenses" && (
        <Expenses T={T} isMobile={isMobile} SearchBar={SearchBar} Pill={Pill} setUndoToastMsg={setUndoToastMsg} />
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
function CashFlowDoc({ T, isMobile, cashFlowStore, setCashFlowStore, activeCashFlowVersion, setActiveCashFlowVersion, syncedOverheads, syncedRevenue, syncedCost, syncedProjects, getProjRevenue, getProjCost, financeYear }) {
  const pid = "_global";
  const versions = cashFlowStore[pid] || [];
  const vIdx = activeCashFlowVersion != null ? Math.min(activeCashFlowVersion, versions.length - 1) : (versions.length > 0 ? 0 : -1);
  const data = vIdx >= 0 ? versions[vIdx] : null;
  const cfDocRef = React.useRef(null);
  const [cfMonth, setCfMonth] = React.useState(null); // null = all months, 0-11 = specific month

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

  const AED_USD = 3.6725;
  const baseCurrency = "AED"; // all values stored in AED
  const displayCurrency = data ? (data.currency || "AED") : "AED";
  const toDisplay = useCallback((n) => {
    if (displayCurrency === "USD") return n / AED_USD;
    return n;
  }, [displayCurrency]);

  // With currency prefix — for summary cards only
  const fmtC = useCallback((n) => {
    if (!data) return "0.00";
    const converted = toDisplay(n);
    const abs = Math.abs(converted).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const prefix = displayCurrency === "AED" ? "AED " : displayCurrency === "USD" ? "USD " : displayCurrency === "GBP" ? "£" : "€";
    return converted < 0 ? "-" + prefix + abs : prefix + abs;
  }, [data, toDisplay, displayCurrency]);

  // No prefix — for table values
  const fmt = useCallback((n) => {
    if (!data) return "0.00";
    const converted = toDisplay(n);
    const abs = Math.abs(converted).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return converted < 0 ? "-" + abs : abs;
  }, [data, toDisplay]);

  const fmtSigned = useCallback((n) => {
    return fmt(n);
  }, [fmt]);

  /* ── Synced data from P&L ── */
  const syncedData = useMemo(() => {
    // Map a single overhead item (or sub) to 12-month columns
    const mapOhToCol = (item) => {
      const amt = parseNum(item.amount);
      if (!amt) return null;
      const freq = item.frequency || "monthly";
      const cols = Array(12).fill(0);
      if (freq === "monthly") {
        cols.fill(amt);
      } else if (freq === "custom") {
        (item.months || []).forEach(m => { const idx = calMonthToIdx(m); cols[idx] = amt; });
      } else {
        const calMonth = parseInt(item.month) || 1;
        const idx = calMonthToIdx(calMonth);
        const annualVal = parseNum(item.annual) || amt;
        cols[idx] = annualVal;
      }
      return { label: item.label, cols, annual: cols.reduce((a, b) => a + b, 0), frequency: freq, month: item.month };
    };
    // Build grouped rows: parent overhead with nested subs
    const ohRows = [];
    (syncedOverheads || []).forEach(o => {
      const subs = (o.subs || []).map(sub => { const r = mapOhToCol(sub); if (r) r._excludeFromCF = !!sub._excludeFromCF; return r; }).filter(Boolean);
      const parentRow = mapOhToCol(o);
      const excl = !!o._excludeFromCF;
      if (subs.length > 0) {
        // Parent as group header, subs underneath
        const groupCols = Array(12).fill(0);
        subs.forEach(s => s.cols.forEach((v, m) => { groupCols[m] += v; }));
        const groupAnnual = groupCols.reduce((a, b) => a + b, 0);
        ohRows.push({ label: o.label, cols: groupCols, annual: groupAnnual, isParent: true, subs, _excludeFromCF: excl });
      } else if (parentRow) {
        parentRow._excludeFromCF = excl;
        ohRows.push(parentRow);
      }
    });
    const ohColTotals = Array(12).fill(0);
    ohRows.forEach(o => o.cols.forEach((v, m) => { ohColTotals[m] += v; }));

    // Per-project breakdown mapped to their specific month
    const projRows = (syncedProjects || []).map(p => {
      const rev = getProjRevenue ? getProjRevenue(p) : 0;
      const cost = getProjCost ? getProjCost(p) : 0;
      const calMonth = Number(p.month) || (p.created_at ? new Date(p.created_at).getMonth() + 1 : 1);
      const fyIdx = calMonthToIdx(calMonth);
      const revCols = Array(12).fill(0);
      const costCols = Array(12).fill(0);
      revCols[fyIdx] = rev;
      costCols[fyIdx] = cost;
      return { name: p.name || p.title || "Untitled", rev, cost, revCols, costCols, fyIdx, month: calMonth };
    }).filter(p => p.rev > 0 || p.cost > 0);

    // Sum project columns
    const projRevCols = Array(12).fill(0);
    const projCostCols = Array(12).fill(0);
    projRows.forEach(p => {
      p.revCols.forEach((v, m) => { projRevCols[m] += v; });
      p.costCols.forEach((v, m) => { projCostCols[m] += v; });
    });

    const totalSyncedRevenue = projRevCols.reduce((a, b) => a + b, 0);
    const totalSyncedCost = projCostCols.reduce((a, b) => a + b, 0);

    return { ohRows, ohColTotals, projRows, projRevCols, projCostCols, totalSyncedRevenue, totalSyncedCost };
  }, [syncedOverheads, syncedProjects, getProjRevenue, getProjCost]);

  /* ── Override helpers ── */
  const ov = data ? (data.syncOverrides || {}) : {};
  const getOv = (prefix, name, m, defaultVal) => {
    const key = `${prefix}:${name}:${m}`;
    if (key in ov && ov[key] !== "") return pv(ov[key]);
    return defaultVal;
  };
  const getOvRaw = (prefix, name, m) => {
    const key = `${prefix}:${name}:${m}`;
    return key in ov ? ov[key] : null;
  };
  const setOv = (prefix, name, m, val) => {
    update(d => {
      const o = { ...(d.syncOverrides || {}) };
      const key = `${prefix}:${name}:${m}`;
      if (val === "" || val === null || val === undefined) { delete o[key]; }
      else { o[key] = val; }
      return { ...d, syncOverrides: o };
    });
  };

  /* ── Calculations ── */
  const calcs = useMemo(() => {
    if (!data) return null;
    const sumCols = (arr) => {
      const cols = Array(12).fill(0);
      (arr || []).forEach(row => { (row.v || []).forEach((v, m) => { cols[m] += pv(v); }); });
      return cols;
    };
    const rowTotal = (row) => (row.v || []).reduce((s, v) => s + pv(v), 0);
    const _ov = data.syncOverrides || {};

    // Manual entries
    const inC = sumCols(data.inflows);
    const outC = sumCols(data.outflows);
    const capC = sumCols(data.capex);

    // Apply overrides to synced project revenue
    const adjProjRevCols = Array(12).fill(0);
    (syncedData.projRows || []).forEach(p => {
      for (let m = 0; m < 12; m++) {
        const key = `rev:${p.name}:${m}`;
        adjProjRevCols[m] += (key in _ov && _ov[key] !== "") ? pv(_ov[key]) : (p.revCols[m] || 0);
      }
    });

    // Apply overrides to synced project costs (COGS)
    const adjCogsC = Array(12).fill(0);
    (syncedData.projRows || []).forEach(p => {
      for (let m = 0; m < 12; m++) {
        const key = `cogs:${p.name}:${m}`;
        adjCogsC[m] += (key in _ov && _ov[key] !== "") ? pv(_ov[key]) : (p.costCols[m] || 0);
      }
    });

    // Apply overrides to synced overheads (skip excluded)
    const adjOhCols = Array(12).fill(0);
    (syncedData.ohRows || []).forEach(o => {
      if (o._excludeFromCF) return;
      if (o.isParent && o.subs) {
        o.subs.forEach(sub => {
          if (sub._excludeFromCF) return;
          for (let m = 0; m < 12; m++) {
            const key = `oh:${sub.label}:${m}`;
            adjOhCols[m] += (key in _ov && _ov[key] !== "") ? pv(_ov[key]) : (sub.cols[m] || 0);
          }
        });
      } else {
        for (let m = 0; m < 12; m++) {
          const key = `oh:${o.label}:${m}`;
          adjOhCols[m] += (key in _ov && _ov[key] !== "") ? pv(_ov[key]) : (o.cols[m] || 0);
        }
      }
    });

    const syncInC = inC.map((v, m) => v + adjProjRevCols[m]);
    const syncOutC = outC.map((v, m) => v + adjOhCols[m]);
    const cogsC = adjCogsC;
    const cogsA = cogsC.reduce((a, b) => a + b, 0);

    const inA = syncInC.reduce((a, b) => a + b, 0);
    const outA = syncOutC.reduce((a, b) => a + b, 0);
    const capA = capC.reduce((a, b) => a + b, 0);

    const vr = (data.vatRate || 0) / 100;
    const vatInAuto = adjProjRevCols.map(v => v * vr);
    const vatInRaw = data.vatInflows || Array(12).fill("");
    const vatInC = vatInRaw.map((v, m) => { const s = String(v || "").trim(); return s !== "" ? pv(s) : vatInAuto[m]; });
    const vatInA = vatInC.reduce((a, b) => a + b, 0);
    const vatOutC = (data.vatReturns || Array(12).fill("")).map(v => pv(v));
    const vatOutA = vatOutC.reduce((a, b) => a + b, 0);

    const netC = syncInC.map((v, m) => v - syncOutC[m] - cogsC[m] - capC[m]);
    const netA = inA - outA - cogsA - capA;

    const rawOb = (data.openingBalances || Array(12).fill(""));
    const obArr = []; // effective opening balance per month
    const closeC = [];
    for (let m = 0; m < 12; m++) {
      const manual = String(rawOb[m] || "").trim();
      const ob = manual !== "" ? pv(manual) : (m > 0 ? closeC[m - 1] : 0);
      obArr.push(ob);
      closeC.push(ob + netC[m]);
    }
    const ob = obArr[new Date().getMonth()] || 0; // current month's opening balance

    const manualInC = inC;
    const manualOutC = outC;

    return { inC: syncInC, outC: syncOutC, cogsC, cogsA, capC, inA, outA, capA, vatInC, vatInA, vatOutC, vatOutA, netC, netA, ob, obArr, closeC, rowTotal, manualInC, manualOutC };
  }, [data, syncedData]);

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

  /* ── Print / PDF — clones the live DOM so export always matches the app ── */
  const handlePrint = () => {
    if (!cfDocRef.current) return;
    const clone = cfDocRef.current.cloneNode(true);
    clone.querySelectorAll("input, textarea").forEach(el => {
      const span = document.createElement("span");
      span.textContent = el.value || el.placeholder || "";
      span.style.cssText = el.style.cssText;
      el.parentNode.replaceChild(span, el);
    });
    clone.querySelectorAll(".cf-del, button").forEach(el => el.remove());
    const html = `<!DOCTYPE html><html><head><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{margin:0;padding:10mm 12mm;-webkit-font-smoothing:antialiased;font-family:${F}}@media print{@page{margin:0;size:A4 landscape;}}</style></head><body>${clone.innerHTML}</body></html>`;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.style.top = "-9999px";
    iframe.style.width = "0";
    iframe.style.height = "0";
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 400);
  };

  /* ── Styles ── */
  const hdrS = { fontFamily: F, fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", borderBottom: "2.5px solid #000", padding: "6px 4px", textAlign: "right", whiteSpace: "nowrap" };
  const cellS = { fontFamily: F, fontSize: 10, padding: "2px 4px", textAlign: "right", borderBottom: "1px solid #f0f0f0", verticalAlign: "middle" };
  const inputS = { fontFamily: F, fontSize: 10, border: "none", background: "transparent", outline: "none", textAlign: "right", width: "100%", color: "#333", padding: "3px 0" };
  const labelInputS = { fontFamily: F, fontSize: 10, border: "none", background: "transparent", outline: "none", color: "#000", width: 190 };
  const subS = { fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "#f4f4f2", borderTop: "1.5px solid #bbb", borderBottom: "1.5px solid #bbb", padding: "7px 4px", textAlign: "right" };
  const ctrlLblS = { fontFamily: F, fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#999", marginRight: 2 };
  const ctrlSelS = { fontFamily: F, fontSize: 11, border: "1px solid #ccc", background: "#fff", padding: "5px 8px", outline: "none", color: "#000", cursor: "pointer" };
  const ctrlInpS = { fontFamily: F, fontSize: 11, border: "1px solid #ccc", padding: "5px 8px", outline: "none", color: "#000" };

  /* ── Render section rows ── */
  const mCols = cfMonth !== null ? [cfMonth] : [0,1,2,3,4,5,6,7,8,9,10,11];
  const colSpanAll = cfMonth !== null ? 2 : 14;

  const renderSection = (type, sectionLabel) => {
    const arr = data[type] || [];
    const isInflows = type === "inflows";
    const isOutflows = type === "outflows";
    return (
      <>
        {/* Banner */}
        <tr><td colSpan={colSpanAll} style={{ fontFamily: F, fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", background: "#000", color: "#fff", padding: "6px 0" }}>{sectionLabel}</td></tr>
        {/* Synced P&L overhead sub-rows (outflows only) — editable with include/exclude toggle */}
        {isOutflows && syncedData.ohRows.map((o, oi) => {
          const parentExcluded = !!o._excludeFromCF;
          if (o.isParent && o.subs) {
            const parentVals = Array(12).fill(0);
            o.subs.forEach(sub => {
              if (!sub._excludeFromCF) {
                for (let m = 0; m < 12; m++) parentVals[m] += getOv("oh", sub.label, m, sub.cols[m]);
              }
            });
            const parentTotal = parentVals.reduce((s, v) => s + v, 0);
            return (
            <React.Fragment key={"oh-sync-" + oi}>
              <tr style={parentExcluded ? { opacity: 0.4 } : undefined}>
                <td style={{ ...cellS, textAlign: "left", padding: "5px 0 5px 24px", color: "#555", fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span title={parentExcluded ? "Excluded from cash flow" : "Included in cash flow"} style={{ width: 8, height: 8, borderRadius: "50%", background: parentExcluded ? "#e74c3c" : "#2ecc71", flexShrink: 0, border: "1px solid rgba(0,0,0,0.1)" }} />
                    <span style={parentExcluded ? { textDecoration: "line-through" } : undefined}>{o.label}</span>
                  </div>
                </td>
                {mCols.map(m => <td key={m} style={{ ...cellS, color: "#555", fontWeight: 600 }}>{parentVals[m] ? fmt(parentVals[m]) : "—"}</td>)}
                {cfMonth === null && <td style={{ ...cellS, fontWeight: 600, color: "#555" }}>{parentTotal ? fmt(parentTotal) : "—"}</td>}
              </tr>
              {!parentExcluded && o.subs.map((sub, si) => {
                const subExcluded = !!sub._excludeFromCF;
                const subVals = sub.cols.map((def, m) => getOv("oh", sub.label, m, def));
                const subTotal = subVals.reduce((s, v) => s + v, 0);
                return (
                <tr key={"oh-sub-" + oi + "-" + si} style={subExcluded ? { opacity: 0.4 } : undefined}>
                  <td style={{ ...cellS, textAlign: "left", padding: "5px 0 5px 40px", color: "#888", fontStyle: "italic" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span title={subExcluded ? "Excluded from cash flow" : "Included in cash flow"} style={{ width: 7, height: 7, borderRadius: "50%", background: subExcluded ? "#e74c3c" : "#2ecc71", flexShrink: 0, border: "1px solid rgba(0,0,0,0.1)" }} />
                      <span style={subExcluded ? { textDecoration: "line-through" } : undefined}>{sub.label}</span>
                    </div>
                  </td>
                  {mCols.map(m => {
                    const raw = getOvRaw("oh", sub.label, m);
                    const def = sub.cols[m];
                    return <td key={m} style={cellS}>
                      <input value={raw !== null ? raw : (def || "")} onChange={e => setOv("oh", sub.label, m, e.target.value)}
                        style={{ ...inputS, color: raw !== null ? "#333" : "#888", fontStyle: raw !== null ? "normal" : "italic" }}
                        placeholder={def ? String(def) : "0"} inputMode="numeric"
                        onFocus={e => { e.target.style.background = "#f0f5ff"; e.target.style.borderRadius = "2px"; }}
                        onBlur={e => { e.target.style.background = "transparent"; }} />
                    </td>;
                  })}
                  {cfMonth === null && <td style={{ ...cellS, color: "#888" }}>{subTotal ? fmt(subTotal) : "—"}</td>}
                </tr>
                );
              })}
            </React.Fragment>
            );
          }
          const rowVals = o.cols.map((def, m) => getOv("oh", o.label, m, def));
          const rowTotal = rowVals.reduce((s, v) => s + v, 0);
          return (
          <tr key={"oh-sync-" + oi} style={parentExcluded ? { opacity: 0.4 } : undefined}>
            <td style={{ ...cellS, textAlign: "left", padding: "5px 0 5px 24px", color: "#555", fontStyle: "italic" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span title={parentExcluded ? "Excluded from cash flow" : "Included in cash flow"} style={{ width: 8, height: 8, borderRadius: "50%", background: parentExcluded ? "#e74c3c" : "#2ecc71", flexShrink: 0, border: "1px solid rgba(0,0,0,0.1)" }} />
                <span style={parentExcluded ? { textDecoration: "line-through" } : undefined}>{o.label}</span>
              </div>
            </td>
            {mCols.map(m => {
              const raw = getOvRaw("oh", o.label, m);
              const def = o.cols[m];
              return <td key={m} style={cellS}>
                <input value={raw !== null ? raw : (def || "")} onChange={e => setOv("oh", o.label, m, e.target.value)}
                  style={{ ...inputS, color: raw !== null ? "#333" : "#666", fontStyle: raw !== null ? "normal" : "italic" }}
                  placeholder={def ? String(def) : "0"} inputMode="numeric"
                  onFocus={e => { e.target.style.background = "#f0f5ff"; e.target.style.borderRadius = "2px"; }}
                  onBlur={e => { e.target.style.background = "transparent"; }} />
              </td>;
            })}
            {cfMonth === null && <td style={{ ...cellS, fontWeight: 600, color: "#555" }}>{rowTotal ? fmt(rowTotal) : "—"}</td>}
          </tr>
          );
        })}
        {/* Data rows */}
        {arr.map((row, i) => {
          const rt = calcs.rowTotal(row);
          const isClientFees = isInflows && row.label && row.label.toLowerCase().includes("client fees");
          return (
            <React.Fragment key={type + i}>
            <tr onMouseEnter={e => e.currentTarget.querySelector(".cf-del")&& (e.currentTarget.querySelector(".cf-del").style.visibility = "visible")} onMouseLeave={e => e.currentTarget.querySelector(".cf-del") && (e.currentTarget.querySelector(".cf-del").style.visibility = "hidden")}>
              <td style={{ ...cellS, textAlign: "left", padding: "5px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button className="cf-del" onClick={() => delRow(type, i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 15, lineHeight: 1, padding: 0, visibility: "hidden", flexShrink: 0 }} onMouseEnter={e => e.target.style.color = "#b0271d"} onMouseLeave={e => e.target.style.color = "#ccc"}>×</button>
                  <input value={row.label} onChange={e => setLabel(type, i, e.target.value)} style={labelInputS} placeholder="Label…" onFocus={e => e.target.style.borderBottom = "1px solid #bbb"} onBlur={e => e.target.style.borderBottom = "none"} />
                </div>
              </td>
              {mCols.map(m => (
                <td key={m} style={cellS}>
                  <input value={row.v[m]} onChange={e => setVal(type, i, m, e.target.value)} style={inputS} placeholder="0" inputMode="numeric" onFocus={e => { e.target.style.background = "#f0f5ff"; e.target.style.borderRadius = "2px"; }} onBlur={e => { e.target.style.background = "transparent"; }} />
                </td>
              ))}
              {cfMonth === null && <td style={{ ...cellS, fontWeight: 600, padding: "5px 0" }}>{rt ? fmt(rt) : "—"}</td>}
            </tr>
            {/* Synced project revenue sub-rows under Client Fees — editable */}
            {isClientFees && syncedData.projRows.map((p, pi) => {
              const rowVals = p.revCols.map((def, m) => getOv("rev", p.name, m, def));
              const rowTotal = rowVals.reduce((s, v) => s + v, 0);
              return (
              <tr key={"proj-rev-" + pi}>
                <td style={{ ...cellS, textAlign: "left", padding: "5px 0 5px 24px", color: "#666", fontStyle: "italic" }}>{p.name}</td>
                {mCols.map(m => {
                  const raw = getOvRaw("rev", p.name, m);
                  const def = p.revCols[m];
                  return <td key={m} style={cellS}>
                    <input value={raw !== null ? raw : (def || "")} onChange={e => setOv("rev", p.name, m, e.target.value)}
                      style={{ ...inputS, color: raw !== null ? "#333" : "#666", fontStyle: raw !== null ? "normal" : "italic" }}
                      placeholder={def ? String(def) : "0"} inputMode="numeric"
                      onFocus={e => { e.target.style.background = "#f0f5ff"; e.target.style.borderRadius = "2px"; }}
                      onBlur={e => { e.target.style.background = "transparent"; }} />
                  </td>;
                })}
                {cfMonth === null && <td style={{ ...cellS, fontWeight: 600, color: "#666" }}>{rowTotal ? fmt(rowTotal) : "—"}</td>}
              </tr>
              );
            })}
            </React.Fragment>
          );
        })}
        {/* Add row */}
        <tr><td colSpan={colSpanAll} style={{ padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
          <button onClick={() => addRow(type)} style={{ fontFamily: F, fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#bbb", background: "none", border: "1px dashed #ddd", padding: "4px 10px", cursor: "pointer" }} onMouseEnter={e => { e.target.style.color = "#000"; e.target.style.borderColor = "#999"; }} onMouseLeave={e => { e.target.style.color = "#bbb"; e.target.style.borderColor = "#ddd"; }}>+ Add row</button>
        </td></tr>
      </>
    );
  };

  return (
    <div>
      {/* ── Print button ── */}
      {data && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button onClick={handlePrint} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Print / PDF</button>
        </div>
      )}

          {data && calcs && (
            <div ref={cfDocRef} style={{ background: "#fff", borderRadius: 16, padding: isMobile ? 16 : 32, border: "1px solid #e8e8e8", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              {/* ── Logo header ── */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
                <CSLogoSlot label="Production Logo" image={data.prodLogo} onUpload={v => update("prodLogo", v)} onRemove={() => update("prodLogo", null)} />
              </div>
              <div style={{ borderTop: "2.5px solid #000", marginBottom: 16 }} />

              {/* ── Doc title ── */}
              <div style={{ fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 14 }}>Cash Flow Tracker</div>
              <div style={{ borderTop: "1px solid #ccc", marginBottom: 14 }} />

              {/* ── Controls ── */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
                <span style={ctrlLblS}>Year</span>
                <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: "#000", padding: "5px 8px" }}>{financeYear}</span>
                <span style={{ margin: "0 12px", color: "#ddd" }}>|</span>
                <span style={ctrlLblS}>Currency</span>
                <div style={{ display: "inline-flex", borderRadius: 6, border: "1px solid #ccc", overflow: "hidden" }}>
                  {["AED", "USD"].map(c => (
                    <button key={c} onClick={() => update("currency", c)}
                      style={{ fontFamily: F, fontSize: 11, fontWeight: 600, padding: "5px 12px", border: "none", cursor: "pointer",
                        background: displayCurrency === c ? "#000" : "#fff",
                        color: displayCurrency === c ? "#fff" : "#666" }}>{c}</button>
                  ))}
                </div>
              </div>

              {/* ── Month selector pills ── */}
              <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
                <button onClick={() => setCfMonth(null)}
                  style={{ fontFamily: F, fontSize: 10, fontWeight: 600, padding: "5px 12px", borderRadius: 6, border: cfMonth === null ? "1px solid #000" : "1px solid #ccc", background: cfMonth === null ? "#000" : "#fff", color: cfMonth === null ? "#fff" : "#666", cursor: "pointer" }}>All Months</button>
                {MONTHS.map((m, i) => (
                  <button key={i} onClick={() => setCfMonth(i)}
                    style={{ fontFamily: F, fontSize: 10, fontWeight: 600, padding: "5px 10px", borderRadius: 6, border: cfMonth === i ? "1px solid #000" : "1px solid #ccc", background: cfMonth === i ? "#000" : "#fff", color: cfMonth === i ? "#fff" : "#666", cursor: "pointer" }}>{m}</button>
                ))}
              </div>

              {/* ── Summary strip ── */}
              {(() => {
                const isMonth = cfMonth !== null;
                const m = cfMonth || 0;
                const sumOb = isMonth ? calcs.obArr[m] : calcs.ob;
                const sumIn = isMonth ? calcs.inC[m] : calcs.inA;
                const sumCogs = isMonth ? calcs.cogsC[m] : calcs.cogsA;
                const sumOut = isMonth ? (calcs.outC[m] + calcs.capC[m]) : (calcs.outA + calcs.capA);
                const sumNet = isMonth ? calcs.netC[m] : calcs.netA;
                const sumClose = isMonth ? calcs.closeC[m] : (calcs.closeC[11] || 0);
                return (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(6,1fr)", border: "1px solid #e0e0e0", marginBottom: 22 }}>
                  {[
                    { l: isMonth ? "Opening Balance" : "Current Opening Balance", v: fmtC(sumOb), cls: sumOb < 0 ? "#b0271d" : "#000" },
                    { l: "Total Sales", v: fmtC(sumIn), cls: "#1a6e3e" },
                    { l: "COGS", v: fmtC(sumCogs), cls: "#b0271d" },
                    { l: "Total Outflows", v: fmtC(sumOut), cls: "#b0271d" },
                    { l: "Net Cash Flow", v: fmtC(sumNet), cls: sumNet >= 0 ? "#1a6e3e" : "#b0271d" },
                    { l: isMonth ? "Closing Balance" : "Year-End Balance", v: fmtC(sumClose), cls: sumClose >= 0 ? "#1a6e3e" : "#b0271d" },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: "11px 14px", borderRight: i < 5 ? "1px solid #e0e0e0" : "none" }}>
                      <div style={{ fontFamily: F, fontSize: 7.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#999", marginBottom: 4 }}>{s.l}</div>
                      <div style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: s.cls }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                );
              })()}

              {/* ── Main table ── */}
              <div style={{ overflowX: "auto", margin: isMobile ? "0 -16px" : 0, padding: isMobile ? "0 16px" : 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: cfMonth !== null ? 400 : 1100 }}>
                  <thead>
                    <tr>
                      <th style={{ ...hdrS, textAlign: "left", width: cfMonth !== null ? "auto" : 210, paddingLeft: 0 }}>Category</th>
                      {cfMonth !== null
                        ? <th style={hdrS}>{MONTHS[cfMonth]}</th>
                        : MONTHS.map(m => <th key={m} style={hdrS}>{m}</th>)
                      }
                      {cfMonth === null && <th style={{ ...hdrS, width: 105 }}>Annual Total</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Opening balance row — editable per month */}
                    <tr>
                      <td style={{ ...cellS, textAlign: "left", fontWeight: 600, background: "#f9f9f7", borderBottom: "1px solid #e8e8e8", padding: "6px 0" }}>Opening Balance</td>
                      {mCols.map(m => {
                        const v = (data.openingBalances || Array(12).fill(""))[m];
                        const manual = String(v || "").trim();
                        const effective = calcs.obArr[m];
                        const isAuto = manual === "" && m > 0;
                        return (
                        <td key={m} style={{ ...cellS, background: "#f9f9f7", borderBottom: "1px solid #e8e8e8" }}>
                          <input value={manual !== "" ? v : (isAuto ? fmt(effective) : "")} onChange={e => {
                            const val = e.target.value;
                            update(d => {
                              const arr = [...(d.openingBalances || Array(12).fill(""))];
                              arr[m] = val;
                              return { ...d, openingBalances: arr };
                            });
                          }}
                            style={{ ...inputS, fontWeight: 600, color: isAuto ? "#999" : (effective < 0 ? "#b0271d" : effective > 0 ? "#1a6e3e" : "#999"), fontStyle: isAuto ? "italic" : "normal" }}
                            placeholder={fmt(0)} inputMode="numeric"
                            onFocus={e => { if (isAuto) { e.target.value = String(effective || ""); } e.target.style.background = "#f0f5ff"; e.target.style.borderRadius = "2px"; }}
                            onBlur={e => { e.target.style.background = "transparent"; }} />
                        </td>
                        );
                      })}
                      {cfMonth === null && <td style={{ ...cellS, background: "#f9f9f7", borderBottom: "1px solid #e8e8e8", fontWeight: 600, color: calcs.ob < 0 ? "#b0271d" : calcs.ob > 0 ? "#1a6e3e" : "#000" }}>{calcs.ob ? fmt(calcs.ob) : "—"}</td>}
                    </tr>

                    {/* Sales (with synced project revenue as sub-rows under Client Fees) */}
                    {renderSection("inflows", "Sales")}
                    {/* Subtotal */}
                    <tr>
                      <td style={{ ...subS, textAlign: "left", paddingLeft: 0 }}>Total Sales</td>
                      {mCols.map(m => <td key={m} style={subS}>{calcs.inC[m] ? fmt(calcs.inC[m]) : "—"}</td>)}
                      {cfMonth === null && <td style={{ ...subS, paddingRight: 0 }}>{calcs.inA ? fmt(calcs.inA) : "—"}</td>}
                    </tr>

                    {/* COGS — synced from project costs */}
                    <tr><td colSpan={colSpanAll} style={{ fontFamily: F, fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", background: "#000", color: "#fff", padding: "6px 0" }}>Cost of Goods Sold (COGS)</td></tr>
                    {syncedData.projRows.filter(p => p.cost > 0).map((p, pi) => {
                      const rowVals = p.costCols.map((def, m) => getOv("cogs", p.name, m, def));
                      const rowTotal = rowVals.reduce((s, v) => s + v, 0);
                      return (
                      <tr key={"cogs-" + pi}>
                        <td style={{ ...cellS, textAlign: "left", padding: "5px 0 5px 24px", color: "#666", fontStyle: "italic" }}>{p.name}</td>
                        {mCols.map(m => {
                          const raw = getOvRaw("cogs", p.name, m);
                          const def = p.costCols[m];
                          return <td key={m} style={cellS}>
                            <input value={raw !== null ? raw : (def || "")} onChange={e => setOv("cogs", p.name, m, e.target.value)}
                              style={{ ...inputS, color: raw !== null ? "#333" : "#666", fontStyle: raw !== null ? "normal" : "italic" }}
                              placeholder={def ? String(def) : "0"} inputMode="numeric"
                              onFocus={e => { e.target.style.background = "#f0f5ff"; e.target.style.borderRadius = "2px"; }}
                              onBlur={e => { e.target.style.background = "transparent"; }} />
                          </td>;
                        })}
                        {cfMonth === null && <td style={{ ...cellS, fontWeight: 600, color: "#666" }}>{rowTotal ? fmt(rowTotal) : "—"}</td>}
                      </tr>
                      );
                    })}
                    {syncedData.projRows.filter(p => p.cost > 0).length === 0 && (
                      <tr><td colSpan={colSpanAll} style={{ ...cellS, textAlign: "center", color: "#bbb", padding: "8px 0" }}>No project costs for {financeYear}</td></tr>
                    )}
                    <tr>
                      <td style={{ ...subS, textAlign: "left", paddingLeft: 0 }}>Total COGS</td>
                      {mCols.map(m => <td key={m} style={subS}>{calcs.cogsC[m] ? fmt(calcs.cogsC[m]) : "—"}</td>)}
                      {cfMonth === null && <td style={{ ...subS, paddingRight: 0 }}>{calcs.cogsA ? fmt(calcs.cogsA) : "—"}</td>}
                    </tr>

                    {/* Outflows (with synced P&L overheads as sub-rows) */}
                    {renderSection("outflows", "Operating Outflows")}
                    <tr>
                      <td style={{ ...subS, textAlign: "left", paddingLeft: 0 }}>Total Outflows</td>
                      {mCols.map(m => <td key={m} style={subS}>{calcs.outC[m] ? fmt(calcs.outC[m]) : "—"}</td>)}
                      {cfMonth === null && <td style={{ ...subS, paddingRight: 0 }}>{calcs.outA ? fmt(calcs.outA) : "—"}</td>}
                    </tr>

                    {/* CapEx */}
                    {renderSection("capex", "Capital Expenditure")}
                    <tr>
                      <td style={{ ...subS, textAlign: "left", paddingLeft: 0 }}>Total CapEx</td>
                      {mCols.map(m => <td key={m} style={subS}>{calcs.capC[m] ? fmt(calcs.capC[m]) : "—"}</td>)}
                      {cfMonth === null && <td style={{ ...subS, paddingRight: 0 }}>{calcs.capA ? fmt(calcs.capA) : "—"}</td>}
                    </tr>

                    {/* Net cash flow */}
                    <tr>
                      <td style={{ fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "#000", color: "#fff", padding: "8px 0" }}>Net Cash Flow</td>
                      {mCols.map(m => <td key={m} style={{ fontFamily: F, fontSize: 10, fontWeight: 700, background: "#000", padding: "8px 4px", textAlign: "right", color: calcs.netC[m] >= 0 ? "#7dffc4" : "#ffaaaa" }}>{calcs.netC[m] ? fmtSigned(calcs.netC[m]) : "—"}</td>)}
                      {cfMonth === null && <td style={{ fontFamily: F, fontSize: 10, fontWeight: 700, background: "#000", padding: "8px 0", textAlign: "right", color: calcs.netA >= 0 ? "#7dffc4" : "#ffaaaa" }}>{calcs.netA ? fmtSigned(calcs.netA) : "—"}</td>}
                    </tr>

                    {/* Closing balance */}
                    <tr>
                      <td style={{ fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "#2a2a2a", color: "#fff", borderTop: "2px solid #000", padding: "8px 0" }}>Closing Balance</td>
                      {mCols.map(m => <td key={m} style={{ fontFamily: F, fontSize: 10, fontWeight: 700, background: "#2a2a2a", borderTop: "2px solid #000", padding: "8px 4px", textAlign: "right", color: calcs.closeC[m] >= 0 ? "#7dffc4" : "#ffaaaa" }}>{fmtSigned(calcs.closeC[m])}</td>)}
                      {cfMonth === null && <td style={{ fontFamily: F, fontSize: 10, fontWeight: 700, background: "#2a2a2a", borderTop: "2px solid #000", padding: "8px 0", textAlign: "right", color: (calcs.closeC[11] || 0) >= 0 ? "#7dffc4" : "#ffaaaa" }}>{fmtSigned(calcs.closeC[11] || 0)}</td>}
                    </tr>

                    {/* Spacer */}
                    <tr><td colSpan={colSpanAll} style={{ padding: 8 }} /></tr>

                    {/* VAT Inflow — editable, defaults to revenue × VAT rate */}
                    <tr>
                      <td style={{ ...cellS, textAlign: "left", fontWeight: 600, background: "#f0faf4", borderTop: "1px solid #c0e8d0", borderBottom: "1px solid #c0e8d0", padding: "7px 0", color: "#1a6e3e" }}>VAT Inflow (on Project Revenue)</td>
                      {mCols.map(m => {
                        const raw = (data.vatInflows || Array(12).fill(""))[m];
                        const isAuto = String(raw || "").trim() === "";
                        return (
                        <td key={m} style={{ ...cellS, fontWeight: 600, background: "#f0faf4", borderTop: "1px solid #c0e8d0", borderBottom: "1px solid #c0e8d0", color: "#1a6e3e" }}>
                          <input value={isAuto ? "" : raw} onChange={e => { const val = e.target.value; update(d => { const arr = [...(d.vatInflows || Array(12).fill(""))]; arr[m] = val; return { ...d, vatInflows: arr }; }); }}
                            style={{ ...inputS, fontWeight: 600, color: isAuto ? "#7dba8e" : "#1a6e3e", fontStyle: isAuto ? "italic" : "normal" }}
                            placeholder={calcs.vatInC[m] ? String(Math.round(calcs.vatInC[m] * 100) / 100) : "0"} inputMode="numeric"
                            onFocus={e => { e.target.style.background = "#d0f0dc"; e.target.style.borderRadius = "2px"; }}
                            onBlur={e => { e.target.style.background = "transparent"; }} />
                        </td>
                        );
                      })}
                      {cfMonth === null && <td style={{ ...cellS, fontWeight: 600, background: "#f0faf4", borderTop: "1px solid #c0e8d0", borderBottom: "1px solid #c0e8d0", color: "#1a6e3e" }}>{calcs.vatInA ? fmt(calcs.vatInA) : "—"}</td>}
                    </tr>
                    {/* VAT Outflow — manually entered VAT returns */}
                    <tr>
                      <td style={{ ...cellS, textAlign: "left", fontWeight: 600, background: "#fffbf0", borderTop: "1px solid #e8dfc0", borderBottom: "1px solid #e8dfc0", padding: "7px 0", color: "#b06000" }}>VAT Outflow (Returns Paid)</td>
                      {mCols.map(m => {
                        const v = (data.vatReturns || Array(12).fill(""))[m];
                        return (
                        <td key={m} style={{ ...cellS, fontWeight: 600, background: "#fffbf0", borderTop: "1px solid #e8dfc0", borderBottom: "1px solid #e8dfc0", color: "#b06000" }}>
                          <input value={v} onChange={e => { const val = pv(e.target.value); update(d => { const arr = [...(d.vatReturns || Array(12).fill(""))]; arr[m] = val === 0 ? "" : String(val); return { ...d, vatReturns: arr }; }); }} style={{ ...inputS, fontWeight: 600, color: "#b06000" }} placeholder="0" inputMode="numeric" onFocus={e => { e.target.style.background = "#fff3d0"; e.target.style.borderRadius = "2px"; }} onBlur={e => { e.target.style.background = "transparent"; }} />
                        </td>
                        );
                      })}
                      {cfMonth === null && <td style={{ ...cellS, fontWeight: 600, background: "#fffbf0", borderTop: "1px solid #e8dfc0", borderBottom: "1px solid #e8dfc0", color: "#b06000" }}>{calcs.vatOutA ? fmt(calcs.vatOutA) : "—"}</td>}
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
              <div style={{ marginTop: 18, paddingTop: 10, borderTop: "1px solid #e8e8e8", display: "flex", justifyContent: "flex-end", fontFamily: F, fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "#bbb" }}>
                <span>{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
            </div>
          )}
    </div>
  );
}
