import React, { useState, useEffect } from "react";

// Click-to-edit text field with a type-ahead dropdown of existing values —
// used so adding a new vendor/category/location surfaces matches that
// already exist instead of silently creating a near-duplicate. Picking a
// suggestion calls onPickExisting (if given) instead of onChange, so the
// caller can e.g. open that existing record's card rather than just filling
// in the text.
export function Typeahead({ value, onChange, onPickExisting, options, placeholder, style, inputStyle }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value || "");
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!editing) setTemp(value || ""); }, [value, editing]);

  const q = temp.trim().toLowerCase();
  const filtered = q
    ? (options || []).filter(o => o && o.toLowerCase().includes(q) && o.toLowerCase() !== q).slice(0, 8)
    : [];

  const commit = () => {
    setOpen(false);
    setEditing(false);
    if (temp !== (value || "")) onChange(temp);
  };

  const pick = (opt) => {
    setOpen(false);
    setEditing(false);
    setTemp(opt);
    if (onPickExisting) onPickExisting(opt);
    else onChange(opt);
  };

  if (!editing) {
    return (
      <span
        onClick={e => { e.stopPropagation(); setEditing(true); setOpen(true); }}
        title="Click to edit"
        style={{ cursor: "text", display: "block", minHeight: 16, color: value ? undefined : "#bbb", ...style }}
      >
        {value || placeholder || "—"}
      </span>
    );
  }

  return (
    <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
      <input
        autoFocus
        value={temp}
        onChange={e => { setTemp(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === "Enter") e.target.blur();
          if (e.key === "Escape") { setTemp(value || ""); setOpen(false); setEditing(false); }
        }}
        style={{ fontSize: 12.5, fontFamily: "inherit", border: "1px solid #ddd", borderRadius: 4, padding: "3px 6px", width: "100%", boxSizing: "border-box", outline: "none", ...inputStyle }}
      />
      {open && filtered.length > 0 && (
        <div
          onMouseDown={e => e.preventDefault()}
          style={{ position: "absolute", top: "100%", left: 0, zIndex: 50, background: "#fff", border: "1px solid #ddd", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", minWidth: 180, maxHeight: 180, overflowY: "auto", marginTop: 2 }}
        >
          {filtered.map(o => (
            <div
              key={o}
              onMouseDown={e => { e.preventDefault(); pick(o); }}
              style={{ padding: "6px 10px", fontSize: 12, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f7")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
