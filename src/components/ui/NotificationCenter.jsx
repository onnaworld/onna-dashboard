import React, { useState, useRef, useEffect } from "react";
import { getRelativeTime } from "../../utils/activityLog";

const TYPE_ICONS = {
  follow_up: "\u{1F4DE}",
  deadline: "\u23F0",
  contract_expiry: "\u{1F4C4}",
  custom: "\u{1F514}",
};

export function NotificationBell({ T, notifications, setNotifications }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const unread = (notifications || []).filter(n => !n.read && !n.dismissed).length;

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismiss = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, dismissed: true } : n));
  };

  const clearAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, dismissed: true, read: true })));
    setOpen(false);
  };

  const visibleNotifs = (notifications || []).filter(n => !n.dismissed);
  const today = new Date().toDateString();
  const todayNotifs = visibleNotifs.filter(n => new Date(n.timestamp).toDateString() === today);
  const earlierNotifs = visibleNotifs.filter(n => new Date(n.timestamp).toDateString() !== today);

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(v => !v); if (!open) markAllRead(); }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 6px",
          borderRadius: 8,
          position: "relative",
          fontSize: 16,
          color: T.sub,
          lineHeight: 1,
        }}
      >
        {"\u{1F514}"}
        {unread > 0 && (
          <span style={{
            position: "absolute",
            top: 0,
            right: 0,
            background: "#c0392b",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            width: 16,
            height: 16,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: 6,
          width: 340,
          maxHeight: 420,
          background: T.surface,
          borderRadius: 14,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          border: `1px solid ${T.border}`,
          zIndex: 100,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ padding: "12px 16px 8px", borderBottom: `1px solid ${T.borderSub}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Notifications</span>
            {visibleNotifs.length > 0 && (
              <button onClick={clearAll} style={{ fontSize: 11, color: T.muted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Clear all</button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {visibleNotifs.length === 0 && (
              <div style={{ padding: "32px 16px", textAlign: "center", color: T.muted, fontSize: 12 }}>No notifications</div>
            )}

            {todayNotifs.length > 0 && (
              <>
                <div style={{ padding: "8px 16px 4px", fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Today</div>
                {todayNotifs.map(n => (
                  <NotifItem key={n.id} n={n} T={T} onDismiss={() => dismiss(n.id)} />
                ))}
              </>
            )}

            {earlierNotifs.length > 0 && (
              <>
                <div style={{ padding: "8px 16px 4px", fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Earlier</div>
                {earlierNotifs.map(n => (
                  <NotifItem key={n.id} n={n} T={T} onDismiss={() => dismiss(n.id)} />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifItem({ n, T, onDismiss }) {
  const icon = TYPE_ICONS[n.type] || "\u{1F514}";
  return (
    <div style={{
      padding: "10px 16px",
      borderBottom: `1px solid ${T.borderSub}`,
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      background: n.read ? "transparent" : "rgba(245,209,58,0.06)",
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: n.read ? 400 : 600, color: T.text, lineHeight: 1.4 }}>{n.title}</div>
        {n.message && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{n.message}</div>}
        <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>{getRelativeTime(n.timestamp)}</div>
      </div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0 }}>{"\u2715"}</button>
    </div>
  );
}
