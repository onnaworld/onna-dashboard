import React, { useMemo } from "react";

export default function UpcomingDeadlines({ T, activeProjects, isMobile }) {
  const deadlines = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    return (activeProjects || [])
      .filter(p => p.endDate && new Date(p.endDate) >= now && new Date(p.endDate) <= cutoff)
      .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
  }, [activeProjects]);

  if (deadlines.length === 0) {
    return (
      <div style={{ padding: "28px 14px", textAlign: "center", fontSize: 12, color: T.muted }}>
        No upcoming deadlines in the next 14 days.
      </div>
    );
  }

  return (
    <div>
      {deadlines.map((p) => {
        const end = new Date(p.endDate);
        const now = new Date();
        const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        const urgent = daysLeft <= 3;
        return (
          <div
            key={p.id}
            style={{
              padding: "10px 14px",
              borderBottom: `1px solid ${T.borderSub}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.name}
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{p.client}</div>
            </div>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: urgent ? "#c0392b" : "#d4aa20",
              background: urgent ? "#fdd8d0" : "#fef3c0",
              padding: "3px 10px",
              borderRadius: 8,
              whiteSpace: "nowrap",
              flexShrink: 0,
              marginLeft: 10,
            }}>
              {daysLeft <= 0 ? "Today" : daysLeft === 1 ? "1 day" : `${daysLeft} days`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
