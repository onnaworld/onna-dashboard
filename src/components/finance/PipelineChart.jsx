import React, { useMemo } from "react";

const STATUS_WEIGHTS = {
  not_contacted: 0.05,
  cold: 0.10,
  warm: 0.30,
  open: 0.60,
  client: 0.90,
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function PipelineChart({ T, isMobile, localLeads, allProjectsMerged, getProjRevenue }) {
  const data = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const months = [];

    for (let m = 0; m < 12; m++) {
      const monthKey = `${currentYear}-${String(m + 1).padStart(2, "0")}`;
      let pipeline = 0;
      let actual = 0;

      // Pipeline from leads
      (localLeads || []).forEach((lead) => {
        const d = lead.date ? new Date(lead.date) : null;
        const leadMonth = d ? d.getMonth() : now.getMonth();
        const leadYear = d ? d.getFullYear() : currentYear;
        if (leadYear === currentYear && leadMonth === m) {
          const weight = STATUS_WEIGHTS[lead.status] || 0.05;
          const value = parseFloat(lead.value) || 0;
          pipeline += value * weight;
        }
      });

      // Actual revenue from projects
      (allProjectsMerged || []).forEach((p) => {
        if (p.client === "TEMPLATE") return;
        const projMonth = p.month ? p.month - 1 : 0;
        const projYear = p.year || currentYear;
        if (projYear === currentYear && projMonth === m) {
          const rev = getProjRevenue ? getProjRevenue(p) : (p.revenue || 0);
          actual += parseFloat(rev) || 0;
        }
      });

      months.push({ month: m, label: MONTHS[m], pipeline, actual });
    }
    return months;
  }, [localLeads, allProjectsMerged, getProjRevenue]);

  const maxVal = useMemo(() => {
    let m = 0;
    data.forEach((d) => {
      m = Math.max(m, d.pipeline, d.actual);
    });
    return m || 1;
  }, [data]);

  const fmtK = (n) => {
    if (n === 0) return "0";
    const abs = Math.abs(n);
    if (abs >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (abs >= 1000) return (n / 1000).toFixed(0) + "k";
    return n.toLocaleString("en-GB", { maximumFractionDigits: 0 });
  };

  const totalPipeline = data.reduce((s, d) => s + d.pipeline, 0);
  const totalActual = data.reduce((s, d) => s + d.actual, 0);

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
        <div style={{ borderRadius: 14, padding: "16px 18px", background: T.surface, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Weighted Pipeline</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: T.text }}>AED {fmtK(totalPipeline)}</div>
        </div>
        <div style={{ borderRadius: 14, padding: "16px 18px", background: T.surface, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Actual Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#147d50" }}>AED {fmtK(totalActual)}</div>
        </div>
        <div style={{ borderRadius: 14, padding: "16px 18px", background: T.surface, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Coverage Ratio</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: T.text }}>{totalPipeline > 0 ? ((totalActual / totalPipeline) * 100).toFixed(0) + "%" : "—"}</div>
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ borderRadius: 16, padding: "20px 22px", background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>Pipeline vs Actual Revenue ({new Date().getFullYear()})</div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 20, marginBottom: 14, fontSize: 11 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(245,209,58,0.35)", border: "1px solid #d4aa20" }} />
            <span style={{ color: T.sub }}>Pipeline (weighted)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: "#147d50" }} />
            <span style={{ color: T.sub }}>Actual revenue</span>
          </div>
        </div>

        {/* Bars */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: isMobile ? 4 : 8, height: 200 }}>
          {data.map((d) => {
            const pipeH = Math.max((d.pipeline / maxVal) * 180, d.pipeline > 0 ? 4 : 0);
            const actH = Math.max((d.actual / maxVal) * 180, d.actual > 0 ? 4 : 0);
            return (
              <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", width: "100%", justifyContent: "center" }}>
                  <div
                    title={`Pipeline: AED ${fmtK(d.pipeline)}`}
                    style={{ width: isMobile ? "40%" : "42%", height: pipeH, borderRadius: "4px 4px 0 0", background: "rgba(245,209,58,0.35)", border: d.pipeline > 0 ? "1px solid rgba(212,170,32,0.4)" : "none", borderBottom: "none", transition: "height 0.3s" }}
                  />
                  <div
                    title={`Actual: AED ${fmtK(d.actual)}`}
                    style={{ width: isMobile ? "40%" : "42%", height: actH, borderRadius: "4px 4px 0 0", background: "#147d50", transition: "height 0.3s" }}
                  />
                </div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 6, fontWeight: 500 }}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status weights reference */}
      <div style={{ marginTop: 18, padding: "14px 18px", borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, fontSize: 11, color: T.sub }}>
        <span style={{ fontWeight: 600, color: T.text }}>Pipeline weight by status:</span>{" "}
        {Object.entries(STATUS_WEIGHTS).map(([k, v]) => (
          <span key={k} style={{ marginLeft: 10 }}>
            <span style={{ textTransform: "capitalize" }}>{k.replace("_", " ")}</span>: {(v * 100).toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  );
}
