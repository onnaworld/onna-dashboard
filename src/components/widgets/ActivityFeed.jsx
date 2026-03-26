import React from "react";
import { formatActivityMessage, getRelativeTime } from "../../utils/activityLog";

const ENTITY_ICONS = {
  project: "\u{1F4C1}",
  vendor: "\u{1F465}",
  lead: "\u{1F4C8}",
  outreach: "\u{1F4E7}",
  client: "\u{1F91D}",
  note: "\u{1F4DD}",
  todo: "\u2705",
};

export default function ActivityFeed({ T, activityLog, onNavigate, maxItems = 20, isMobile }) {
  const items = (activityLog || []).slice(0, maxItems);

  if (items.length === 0) {
    return (
      <div style={{ padding: "28px 14px", textAlign: "center", fontSize: 12, color: T.muted }}>
        No recent activity.
      </div>
    );
  }

  return (
    <div style={{ maxHeight: isMobile ? 300 : 360, overflowY: "auto" }}>
      {items.map((entry) => {
        const icon = ENTITY_ICONS[entry.entityType] || "\u{1F4CC}";
        const actionLabels = {
          created: "created",
          updated: "updated",
          deleted: "deleted",
          status_changed: "status changed for",
          archived: "archived",
          restored: "restored",
        };
        const actionLabel = actionLabels[entry.action] || entry.action;
        return (
          <div
            key={entry.id}
            onClick={() => onNavigate && onNavigate(entry.entityType, entry)}
            style={{
              padding: "9px 14px",
              borderBottom: `1px solid ${T.borderSub}`,
              cursor: onNavigate ? "pointer" : "default",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f7")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>
                <span style={{ textTransform: "capitalize" }}>{entry.entityType}</span>{" "}
                <strong style={{ fontWeight: 600 }}>{entry.entityName}</strong>{" "}
                {actionLabel}
                {entry.details && (
                  <span style={{ color: T.sub }}> — {entry.details}</span>
                )}
              </div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                {getRelativeTime(entry.timestamp)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
