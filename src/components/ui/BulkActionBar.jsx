import React from "react";

export default function BulkActionBar({ T, selectedIds, onDelete, onChangeCategory, onChangeLocation, onClear }) {
  const count = selectedIds instanceof Set ? selectedIds.size : 0;
  if (count === 0) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 80,
      background: "rgba(29,29,31,0.92)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderRadius: 16,
      padding: "10px 20px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      color: "#fff",
      fontFamily: "inherit",
    }}>
      <span style={{
        background: "#F5D13A",
        color: "#1d1d1f",
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 10,
      }}>
        {count}
      </span>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>selected</span>

      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />

      {onDelete && (
        <button
          onClick={onDelete}
          style={{
            background: "rgba(192,57,43,0.2)",
            border: "1px solid rgba(192,57,43,0.4)",
            color: "#ff6b6b",
            padding: "6px 14px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Delete
        </button>
      )}

      {onChangeCategory && (
        <button
          onClick={onChangeCategory}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            padding: "6px 14px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Category
        </button>
      )}

      {onChangeLocation && (
        <button
          onClick={onChangeLocation}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            padding: "6px 14px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Location
        </button>
      )}

      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />

      <button
        onClick={onClear}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
          fontSize: 14,
          padding: "2px 4px",
          lineHeight: 1,
        }}
      >
        {"\u2715"}
      </button>
    </div>
  );
}
