import React, { useMemo } from "react";

const STATUS_WEIGHTS = {
  not_contacted: 0.05,
  cold: 0.10,
  warm: 0.30,
  open: 0.60,
  client: 0.90,
};

export default function PipelineSummary({ T, localLeads, allProjectsMerged, getProjRevenue, isMobile }) {
  const data = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const nextMonth = (currentMonth + 1) % 12;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const months = [
      { month: currentMonth, year: currentYear, label: MONTHS[currentMonth] },
      { month: nextMonth, year: nextMonthYear, label: MONTHS[nextMonth] },
    ];

    return months.map(({ month, year, label }) => {
      let pipeline = 0;
      let actual = 0;

      (localLeads || []).forEach(l => {
        const d = l.date ? new Date(l.date) : null;
        const lm = d ? d.getMonth() : currentMonth;
        const ly = d ? d.getFullYear() : currentYear;
        if (ly === year && lm === month) {
          const weight = STATUS_WEIGHTS[l.status] || 0.05;
          pipeline += (parseFloat(l.value) || 0) * weight;
        }
      });

      (allProjectsMerged || []).forEach(p => {
        if (p.client === "TEMPLATE") return;
        const pm = p.month ? p.month - 1 : 0;
        const py = p.year || currentYear;
        if (py === year && pm === month) {
          actual += parseFloat(getProjRevenue ? getProjRevenue(p) : (p.revenue || 0)) || 0;
        }
      });

      return { label, pipeline, actual };
    });
  }, [localLeads, allProjectsMerged, getProjRevenue]);

  const fmtK = (n) => {
    if (n === 0) return "0";
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(0) + "k";
    return n.toLocaleString("en-GB", { maximumFractionDigits: 0 });
  };

  const maxVal = Math.max(...data.map(d => Math.max(d.pipeline, d.actual)), 1);

  return (
    <div>
      {data.map((d, i) => (
        <div key={i} style={{ marginBottom: i < data.length - 1 ? 14 : 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{d.label}</span>
          </div>
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <div style={{ width: `${Math.max((d.pipeline / maxVal) * 100, d.pipeline > 0 ? 3 : 0)}%`, height: 8, borderRadius: 4, background: "rgba(245,209,58,0.4)", transition: "width 0.3s" }} />
              <span style={{ fontSize: 10, color: T.muted, whiteSpace: "nowrap" }}>AED {fmtK(d.pipeline)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: `${Math.max((d.actual / maxVal) * 100, d.actual > 0 ? 3 : 0)}%`, height: 8, borderRadius: 4, background: "#147d50", transition: "width 0.3s" }} />
              <span style={{ fontSize: 10, color: T.muted, whiteSpace: "nowrap" }}>AED {fmtK(d.actual)}</span>
            </div>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 14, fontSize: 10, color: T.muted, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(245,209,58,0.4)" }} />
          Pipeline
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: "#147d50" }} />
          Actual
        </div>
      </div>
    </div>
  );
}
