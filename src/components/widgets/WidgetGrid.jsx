import React, { useState, useRef, useCallback } from "react";
import ActivityFeed from "./ActivityFeed";
import UpcomingDeadlines from "./UpcomingDeadlines";
import QuickStats from "./QuickStats";
import PipelineSummary from "./PipelineSummary";

const WIDGET_REGISTRY = {
  "calendar-projects": { label: "Calendar & Projects", width: "full" },
  "todos": { label: "Todos", width: "full" },
  "notes": { label: "Notes", width: "full" },
  "quick-stats": { label: "Quick Stats", width: "full" },
  "recent-activity": { label: "Recent Activity", width: "half" },
  "upcoming-deadlines": { label: "Upcoming Deadlines", width: "half" },
  "pipeline-summary": { label: "Pipeline Summary", width: "half" },
};

const DEFAULT_LAYOUT = {
  widgets: ["calendar-projects", "todos", "notes"],
  widths: {},
  hidden: ["quick-stats", "recent-activity", "upcoming-deadlines", "pipeline-summary"],
};

export default function WidgetGrid({
  T, isMobile, layout, setLayout,
  // Render callbacks for the 3 original sections
  renderCalendarProjects,
  renderTodos,
  renderNotes,
  // Data for new widgets
  activityLog, onActivityNavigate,
  activeProjects, allProjectsMerged, localLeads, getProjRevenue,
}) {
  const [customizing, setCustomizing] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const dragOverIdx = useRef(null);

  const currentLayout = layout && layout.widgets ? layout : DEFAULT_LAYOUT;
  const { widgets, hidden = [] } = currentLayout;

  const handleDragStart = useCallback((idx) => {
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault();
    dragOverIdx.current = idx;
  }, []);

  const handleDrop = useCallback(() => {
    if (dragIdx === null || dragOverIdx.current === null || dragIdx === dragOverIdx.current) {
      setDragIdx(null);
      return;
    }
    const newWidgets = [...widgets];
    const [moved] = newWidgets.splice(dragIdx, 1);
    newWidgets.splice(dragOverIdx.current, 0, moved);
    setLayout({ ...currentLayout, widgets: newWidgets });
    setDragIdx(null);
  }, [dragIdx, widgets, currentLayout, setLayout]);

  const toggleWidget = useCallback((widgetId) => {
    const isVisible = widgets.includes(widgetId);
    if (isVisible) {
      setLayout({
        ...currentLayout,
        widgets: widgets.filter(w => w !== widgetId),
        hidden: [...(hidden || []), widgetId],
      });
    } else {
      setLayout({
        ...currentLayout,
        widgets: [...widgets, widgetId],
        hidden: (hidden || []).filter(h => h !== widgetId),
      });
    }
  }, [widgets, hidden, currentLayout, setLayout]);

  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case "calendar-projects":
        return renderCalendarProjects ? renderCalendarProjects() : null;
      case "todos":
        return renderTodos ? renderTodos() : null;
      case "notes":
        return renderNotes ? renderNotes() : null;
      case "quick-stats":
        return (
          <WidgetCard T={T} title="Quick Stats" isMobile={isMobile}>
            <QuickStats T={T} allProjectsMerged={allProjectsMerged} activeProjects={activeProjects} localLeads={localLeads} getProjRevenue={getProjRevenue} isMobile={isMobile} />
          </WidgetCard>
        );
      case "recent-activity":
        return (
          <WidgetCard T={T} title="Recent Activity" isMobile={isMobile}>
            <ActivityFeed T={T} activityLog={activityLog} onNavigate={onActivityNavigate} maxItems={10} isMobile={isMobile} />
          </WidgetCard>
        );
      case "upcoming-deadlines":
        return (
          <WidgetCard T={T} title="Upcoming Deadlines" isMobile={isMobile}>
            <UpcomingDeadlines T={T} activeProjects={activeProjects || allProjectsMerged} isMobile={isMobile} />
          </WidgetCard>
        );
      case "pipeline-summary":
        return (
          <WidgetCard T={T} title="Pipeline Summary" isMobile={isMobile}>
            <PipelineSummary T={T} localLeads={localLeads} allProjectsMerged={allProjectsMerged} getProjRevenue={getProjRevenue} isMobile={isMobile} />
          </WidgetCard>
        );
      default:
        return null;
    }
  };

  // Build grid layout: full-width widgets get their own row, half-width widgets pair up
  const rows = [];
  let halfQueue = [];
  widgets.forEach((wid) => {
    const reg = WIDGET_REGISTRY[wid];
    const width = currentLayout.widths?.[wid] || reg?.width || "full";
    if (width === "half" && !isMobile) {
      halfQueue.push(wid);
      if (halfQueue.length === 2) {
        rows.push({ type: "pair", widgets: halfQueue });
        halfQueue = [];
      }
    } else {
      if (halfQueue.length > 0) {
        rows.push({ type: "pair", widgets: halfQueue });
        halfQueue = [];
      }
      rows.push({ type: "full", widget: wid });
    }
  });
  if (halfQueue.length > 0) rows.push({ type: "pair", widgets: halfQueue });

  return (
    <div>
      {/* Customize button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button
          onClick={() => setCustomizing(v => !v)}
          style={{
            background: customizing ? "#F5D13A" : "#f5f5f7",
            border: `1px solid ${customizing ? "#d4aa20" : T.border}`,
            color: customizing ? "#3d2800" : T.sub,
            padding: "5px 14px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {customizing ? "Done" : "Customize"}
        </button>
      </div>

      {/* Widget toggle panel */}
      {customizing && (
        <div style={{
          marginBottom: 18,
          padding: "14px 18px",
          borderRadius: 14,
          background: T.surface,
          border: `1px solid ${T.border}`,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}>
          {Object.entries(WIDGET_REGISTRY).map(([id, reg]) => {
            const visible = widgets.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleWidget(id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: `1px solid ${visible ? "#d4aa20" : T.border}`,
                  background: visible ? "rgba(245,209,58,0.15)" : "transparent",
                  color: visible ? "#3d2800" : T.sub,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {visible ? "\u2713 " : ""}{reg.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Widgets */}
      {rows.map((row, ri) => {
        if (row.type === "full") {
          const wid = row.widget;
          const widgetIdx = widgets.indexOf(wid);
          return (
            <div
              key={wid}
              draggable={customizing}
              onDragStart={() => handleDragStart(widgetIdx)}
              onDragOver={(e) => handleDragOver(e, widgetIdx)}
              onDrop={handleDrop}
              style={{
                marginBottom: isMobile ? 12 : 18,
                opacity: dragIdx === widgetIdx ? 0.5 : 1,
                cursor: customizing ? "grab" : "default",
              }}
            >
              {renderWidget(wid)}
            </div>
          );
        }
        // pair of half-width widgets
        return (
          <div key={`pair-${ri}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
            {row.widgets.map((wid) => {
              const widgetIdx = widgets.indexOf(wid);
              return (
                <div
                  key={wid}
                  draggable={customizing}
                  onDragStart={() => handleDragStart(widgetIdx)}
                  onDragOver={(e) => handleDragOver(e, widgetIdx)}
                  onDrop={handleDrop}
                  style={{
                    opacity: dragIdx === widgetIdx ? 0.5 : 1,
                    cursor: customizing ? "grab" : "default",
                  }}
                >
                  {renderWidget(wid)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function WidgetCard({ T, title, children }) {
  return (
    <div style={{
      borderRadius: 16,
      background: T.surface,
      border: `1px solid ${T.border}`,
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        padding: "10px 14px",
        borderBottom: `1px solid ${T.borderSub}`,
        background: "#fafafa",
      }}>
        <span style={{ fontSize: 10, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
