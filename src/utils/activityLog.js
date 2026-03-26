// ── Activity Log / Audit Trail ────────────────────────────────────────────────
const MAX_ENTRIES = 500;

const ENTITY_ICONS = {
  project: "\u{1F4C1}",
  vendor: "\u{1F465}",
  lead: "\u{1F4C8}",
  outreach: "\u{1F4E7}",
  client: "\u{1F91D}",
  note: "\u{1F4DD}",
  todo: "\u2705",
};

export const ACTIONS = {
  created: "created",
  updated: "updated",
  deleted: "deleted",
  status_changed: "status_changed",
  archived: "archived",
  restored: "restored",
};

export function logActivity(action, entityType, entityId, entityName, details, setActivityLog) {
  const entry = {
    id: Date.now() + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    action,
    entityType,
    entityId,
    entityName: entityName || "Unknown",
    details: details || "",
  };
  setActivityLog(prev => {
    const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
    return updated;
  });
}

export function formatActivityMessage(entry) {
  const icon = ENTITY_ICONS[entry.entityType] || "\u{1F4CC}";
  const actionLabels = {
    created: "created",
    updated: "updated",
    deleted: "deleted",
    status_changed: "status changed",
    archived: "archived",
    restored: "restored",
  };
  const actionLabel = actionLabels[entry.action] || entry.action;
  const detail = entry.details ? ` — ${entry.details}` : "";
  return `${icon} ${entry.entityType} "${entry.entityName}" ${actionLabel}${detail}`;
}

export function getRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
