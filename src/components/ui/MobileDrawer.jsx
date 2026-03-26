import React, { useState, useRef, useCallback } from "react";

export default function MobileDrawer({ title, onClose, children }) {
  const [translateY, setTranslateY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);

  const handleTouchStart = useCallback((e) => {
    startYRef.current = e.touches[0].clientY;
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!dragging) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) setTranslateY(dy);
  }, [dragging]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    if (translateY > 120) {
      onClose();
    }
    setTranslateY(0);
  }, [translateY, onClose]);

  return (
    <div
      className="modal-bg"
      onClick={onClose}
      style={{ alignItems: "flex-end" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxHeight: "95vh",
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transform: `translateY(${translateY}px)`,
          transition: dragging ? "none" : "transform 0.2s ease-out",
        }}
      >
        {/* Drag handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ padding: "10px 0 4px", display: "flex", justifyContent: "center", cursor: "grab", flexShrink: 0 }}
        >
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#d2d2d7" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "8px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e5ea", flexShrink: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1d1d1f" }}>{title}</div>
          <button
            onClick={onClose}
            style={{ background: "#f5f5f7", border: "none", color: "#86868b", width: 28, height: 28, borderRadius: "50%", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {"\u00D7"}
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 32px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function CollapsibleSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 14 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 600,
          color: "#86868b",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 0",
          fontFamily: "inherit",
          width: "100%",
        }}
      >
        <span style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s", display: "inline-block", fontSize: 10 }}>{"\u25B6"}</span>
        {title}
      </button>
      {open && <div style={{ paddingTop: 4 }}>{children}</div>}
    </div>
  );
}
