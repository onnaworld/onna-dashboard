import React, { useMemo } from "react";

export default function QuickStats({ T, allProjectsMerged, activeProjects, localLeads, getProjRevenue, isMobile }) {
  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    const totalProjects = (allProjectsMerged || []).filter(p => p.client !== "TEMPLATE").length;
    const active = (activeProjects || []).length;
    const totalLeads = (localLeads || []).length;

    let pipeline = 0;
    (localLeads || []).forEach(l => { pipeline += parseFloat(l.value) || 0; });

    let revenueYTD = 0;
    (allProjectsMerged || []).forEach(p => {
      if (p.client === "TEMPLATE") return;
      const yr = p.year || currentYear;
      if (yr !== currentYear) return;
      const rev = getProjRevenue ? getProjRevenue(p) : (p.revenue || 0);
      revenueYTD += parseFloat(rev) || 0;
    });

    return { totalProjects, active, totalLeads, pipeline, revenueYTD };
  }, [allProjectsMerged, activeProjects, localLeads, getProjRevenue]);

  const fmtK = (n) => {
    if (n === 0) return "0";
    const abs = Math.abs(n);
    if (abs >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (abs >= 1000) return (n / 1000).toFixed(0) + "k";
    return n.toLocaleString("en-GB", { maximumFractionDigits: 0 });
  };

  const kpis = [
    { label: "Total Projects", value: stats.totalProjects, color: T.text },
    { label: "Active Projects", value: stats.active, color: "#147d50" },
    { label: "Total Leads", value: stats.totalLeads, color: "#1a56db" },
    { label: "Pipeline Value", value: `AED ${fmtK(stats.pipeline)}`, color: "#d4aa20" },
    { label: "Revenue YTD", value: `AED ${fmtK(stats.revenueYTD)}`, color: "#147d50" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)", gap: 12 }}>
      {kpis.map((kpi, i) => (
        <div key={i} style={{ padding: "14px 16px", borderRadius: 14, background: T.surface, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{kpi.label}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
        </div>
      ))}
    </div>
  );
}
