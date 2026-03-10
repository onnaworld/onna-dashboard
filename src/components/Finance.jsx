import React from "react";

export default function Finance({
  T, isMobile,
  allProjectsMerged, localLeads,
  getProjRevenue, getProjCost,
  apiLoading,
}) {
  const projects2026 = allProjectsMerged.filter(p => p.year === 2026);
  const rev2026 = projects2026.reduce((a, b) => a + getProjRevenue(b), 0);
  const profit2026 = projects2026.reduce((a, b) => a + (getProjRevenue(b) - getProjCost(b)), 0);
  const totalPipeline = localLeads.reduce((a, b) => a + (b.value || 0), 0);
  const newCount = localLeads.filter(l => l.status === "not_contacted" || l.status === "cold").length;

  // All-time totals
  const totalRev = allProjectsMerged.reduce((a, b) => a + getProjRevenue(b), 0);
  const totalProfit = allProjectsMerged.reduce((a, b) => a + (getProjRevenue(b) - getProjCost(b)), 0);
  const avgMargin = totalRev > 0 ? Math.round((totalProfit / totalRev) * 100) : 0;

  return (
    <div>
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
    </div>
  );
}
