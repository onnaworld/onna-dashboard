// ── Notifications & Reminders ─────────────────────────────────────────────────

export const REMINDER_TYPES = {
  follow_up: "follow_up",
  deadline: "deadline",
  contract_expiry: "contract_expiry",
  custom: "custom",
};

export function createReminder(type, entityType, entityId, entityName, dueDate, message) {
  return {
    id: Date.now() + Math.random().toString(36).slice(2, 6),
    type,
    entityType,
    entityId,
    entityName,
    dueDate,
    message: message || "",
    dismissed: false,
    createdAt: new Date().toISOString(),
  };
}

export function checkDueReminders(reminders) {
  const now = new Date();
  return reminders.filter(r => {
    if (r.dismissed) return false;
    const due = new Date(r.dueDate);
    return due <= now;
  });
}

export function createNotification(reminder) {
  const typeLabels = {
    follow_up: "Follow-up",
    deadline: "Deadline",
    contract_expiry: "Contract expiry",
    custom: "Reminder",
  };
  return {
    id: Date.now() + Math.random().toString(36).slice(2, 6),
    reminderId: reminder.id,
    type: reminder.type,
    entityType: reminder.entityType,
    entityId: reminder.entityId,
    entityName: reminder.entityName,
    title: `${typeLabels[reminder.type] || "Reminder"}: ${reminder.entityName}`,
    message: reminder.message || `${typeLabels[reminder.type]} for ${reminder.entityName}`,
    timestamp: new Date().toISOString(),
    read: false,
    dismissed: false,
  };
}

export async function requestPushPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
}

export function sendPushNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/onna-default-logo.png" });
  } catch {}
}
