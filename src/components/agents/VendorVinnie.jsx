import React, { useState } from "react";

export function useVinnieCard({ agent, isMobile, pendingConv, pendingLead, pendingType, pendingId, leadEdit, getXContacts }) {
  const isVinnie = agent.id === "logistical";
  const hasVinnieCard = isVinnie && !isMobile && ((pendingConv && !pendingConv._awaitingTypeChoice && !pendingConv._awaitingUpdateName) || !!pendingLead);
  return { isVinnie, hasVinnieCard };
}

export default function VendorVinnieCard({
  agent, isMobile,
  pendingConv, setPendingConv, pendingLead, pendingType, pendingId,
  leadEdit, setLeadEdit, setPending, showEntry, saveLead, savingLead,
  setMsgs, getXContacts,
  _VENDOR_CATS, _LEAD_CATS, _SOURCES,
}) {
  const [_vinnieAddContact, _setVinnieAddContact] = useState(null);

  const _isXContactMode = pendingConv && pendingConv._saveAsXContact;
  const _cardEntry = _isXContactMode
    ? (() => { const xc = pendingConv._saveAsXContact; const e = pendingConv.entry; const existing = getXContacts(xc.type, xc.id); const inProgress = { name: e.contact || e.name || "", role: e.role || "", email: e.email || "", phone: e.phone || "", _inProgress: true }; return { ...xc.record, _xContacts: [...existing, inProgress] }; })()
    : pendingConv ? pendingConv.entry : (pendingLead ? leadEdit : null);
  const _cardType = _isXContactMode ? pendingConv._saveAsXContact.type : (pendingConv ? pendingConv.type : pendingType);
  const _cardIsEditable = !!pendingLead && !pendingConv;
  const _cardIsNew = pendingConv ? !pendingConv.updateId : !pendingId;
  const _cardTitle = _isXContactMode ? `Adding Contact to ${pendingConv._saveAsXContact.existName}` : (_cardIsNew ? (_cardType === "vendor" ? "New Vendor" : "New Lead") : (_cardType === "vendor" ? "Update Vendor" : "Update Lead"));

  const _cf = (label, key, wide = false, opts = null, inputType = "text") => {
    const val = _cardEntry?.[key] || "";
    const isCurrentQ = pendingConv && pendingConv.questions[pendingConv.idx]?.key === key;
    const onChange = (v) => {
      if (pendingConv) { setPendingConv(prev => ({ ...prev, entry: { ...prev.entry, [key]: v } })); }
      else { setLeadEdit(p => ({ ...p, [key]: v })); }
    };
    return (
      <div key={key} style={{ gridColumn: wide ? "1/-1" : "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        <label style={{ fontSize: 10, fontWeight: 600, color: isCurrentQ ? "#007aff" : "#86868b", textTransform: "uppercase", letterSpacing: "0.05em", transition: "color 0.2s" }}>{label}</label>
        {opts ? (
          <select value={val} onChange={e => onChange(e.target.value)} style={{ padding: "7px 10px", borderRadius: 8, border: isCurrentQ ? "1.5px solid #007aff" : "1px solid #e5e5ea", fontSize: 13, fontFamily: "inherit", color: "#1d1d1f", background: isCurrentQ ? "#f0f7ff" : "#f5f5f7", outline: "none", transition: "all 0.2s" }}>
            <option value="">—</option>
            {opts.map(o => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : wide ? (
          <textarea value={val} onChange={e => onChange(e.target.value)} rows={2} style={{ padding: "7px 10px", borderRadius: 8, border: isCurrentQ ? "1.5px solid #007aff" : "1px solid #e5e5ea", fontSize: 13, fontFamily: "inherit", color: val ? "#1d1d1f" : "#c7c7cc", background: isCurrentQ ? "#f0f7ff" : "#f5f5f7", outline: "none", resize: "vertical", transition: "all 0.2s" }} />
        ) : (
          <input type={inputType} value={val} onChange={e => onChange(e.target.value)} style={{ padding: "7px 10px", borderRadius: 8, border: isCurrentQ ? "1.5px solid #007aff" : "1px solid #e5e5ea", fontSize: 13, fontFamily: "inherit", color: val ? "#1d1d1f" : "#c7c7cc", background: isCurrentQ ? "#f0f7ff" : "#f5f5f7", outline: "none", transition: "all 0.2s" }} />
        )}
      </div>
    );
  };

  if (!_cardEntry) return null;
  const _statusOpts = [{ value: "not_contacted", label: "Not Contacted" }, { value: "cold", label: "Cold" }, { value: "warm", label: "Warm" }, { value: "open", label: "Open" }];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff", overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #e5e5ea" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: _cardType === "vendor" ? "#f0f0f5" : "#edf7ed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{_cardType === "vendor" ? "🏢" : "👤"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1d1d1f" }}>{_cardTitle}</div>
            <div style={{ fontSize: 11.5, color: "#86868b", marginTop: 1 }}>{pendingConv ? "Answer in chat or edit directly" : "Edit fields and save"}</div>
          </div>
          <button onClick={() => { setPending(null); setPendingConv(null); }} style={{ background: "none", border: "none", fontSize: 20, color: "#aeaeb2", cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}>×</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px", marginBottom: _cardIsEditable ? 20 : 0 }}>
          {_cardType === "vendor" ? <>
            {_cf("Name", "name")}
            {_cf("Company", "company")}
            {_cf("Category", "category", false, _VENDOR_CATS)}
            {_cf("Email", "email", false, null, "email")}
            {_cf("Phone", "phone", false, null, "tel")}
            {_cf("Website", "website")}
            {_cf("Rate Card", "rateCard")}
            {_cf("Location", "location")}
            {_cf("Notes", "notes", true)}
          </> : <>
            {_cf("Contact Name", "contact")}
            {_cf("Company", "company")}
            {_cf("Role / Title", "role")}
            {_cf("Email", "email", false, null, "email")}
            {_cf("Phone", "phone", false, null, "tel")}
            {_cf("Category", "category", false, _LEAD_CATS)}
            {_cf("Status", "status", false, _statusOpts)}
            {_cf("Est. Value (AED)", "value", false, null, "number")}
            {_cf("Date", "date", false, null, "date")}
            {_cf("Location", "location")}
            {_cf("Source", "source", false, _SOURCES)}
            {_cf("Notes", "notes", true)}
          </>}
        </div>
        {/* ── Additional Contacts ── */}
        <div style={{ marginBottom: 16, marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "#86868b", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>Additional Contacts</div>
            {_isXContactMode
              ? <span style={{ fontSize: 11, color: "#007aff", fontWeight: 600 }}>Filling in via chat...</span>
              : <button onClick={() => _setVinnieAddContact({ name: "", email: "", phone: "", role: "" })} style={{ fontSize: 11, color: "#d4aa20", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, padding: 0 }}>+ Add Contact</button>}
          </div>
          {(_cardEntry?._xContacts || []).map((c, i) => {
            const _xUpdate = (field, val) => {
              const updated = (_cardEntry._xContacts || []).map((x, j) => j === i ? { ...x, [field]: val } : x);
              if (_isXContactMode) {
                const xc = pendingConv._saveAsXContact;
                const real = updated.filter(x => !x._inProgress);
                const ip = updated.find(x => x._inProgress);
                if (ip) { setPendingConv(prev => ({ ...prev, entry: { ...prev.entry, [field]: val } })); }
              } else if (pendingConv) {
                setPendingConv(prev => ({ ...prev, entry: { ...prev.entry, _xContacts: updated } }));
              } else {
                setLeadEdit(p => ({ ...p, _xContacts: updated }));
              }
            };
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8, padding: "8px 10px", borderRadius: 9, background: c._inProgress ? "#f0f7ff" : "#f5f5f7", border: c._inProgress ? "1.5px solid #007aff" : "1px solid #e5e5ea", position: "relative" }}>
                {[["Name", "name"], ["Role", "role"], ["Email", "email"], ["Phone", "phone"]].map(([lbl, k]) => (
                  <div key={k}><div style={{ fontSize: 9, color: "#86868b", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{lbl}</div>
                    <input value={c[k] || ""} onChange={e => _xUpdate(k, e.target.value)} style={{ width: "100%", padding: "4px 7px", borderRadius: 6, border: "1px solid #e5e5ea", fontSize: 12, color: "#1d1d1f", fontFamily: "inherit", background: c._inProgress ? "#f0f7ff" : "#fff", outline: "none" }} /></div>
                ))}
                <button onClick={() => {
                  const updated = (_cardEntry._xContacts || []).filter((_, j) => j !== i);
                  if (pendingConv) { setPendingConv(prev => ({ ...prev, entry: { ...prev.entry, _xContacts: updated } })); }
                  else { setLeadEdit(p => ({ ...p, _xContacts: updated })); }
                }} style={{ position: "absolute", top: 4, right: 8, background: "none", border: "none", color: "#86868b", cursor: "pointer", fontSize: 15, padding: 0, lineHeight: 1 }}>×</button>
              </div>
            );
          })}
          {_vinnieAddContact && (
            <div style={{ padding: "10px 12px", borderRadius: 9, background: "white", border: "1.5px solid #F5D13A", marginTop: 4 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                {[["Name", "name"], ["Role", "role"], ["Email", "email"], ["Phone", "phone"]].map(([lbl, k]) => (
                  <div key={k}><div style={{ fontSize: 9, color: "#86868b", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{lbl}</div>
                    <input value={_vinnieAddContact[k] || ""} onChange={e => _setVinnieAddContact(p => ({ ...p, [k]: e.target.value }))} style={{ width: "100%", padding: "6px 9px", borderRadius: 7, background: "#f5f5f7", border: "1px solid #e5e5ea", color: "#1d1d1f", fontSize: 12, fontFamily: "inherit" }} /></div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => _setVinnieAddContact(null)} style={{ padding: "5px 14px", borderRadius: 8, background: "none", border: "1px solid #e5e5ea", color: "#86868b", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button onClick={() => {
                  const nc = { name: _vinnieAddContact.name, email: _vinnieAddContact.email, phone: _vinnieAddContact.phone, role: _vinnieAddContact.role };
                  if (pendingConv) { setPendingConv(prev => ({ ...prev, entry: { ...prev.entry, _xContacts: [...(prev.entry._xContacts || []), nc] } })); }
                  else { setLeadEdit(p => ({ ...p, _xContacts: [...(p._xContacts || []), nc] })); }
                  _setVinnieAddContact(null);
                }} style={{ padding: "5px 14px", borderRadius: 8, background: "#F5D13A", border: "none", color: "#3d2800", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
              </div>
            </div>
          )}
        </div>
        {_cardIsEditable ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPending(null)} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "#f5f5f7", border: "1px solid #e5e5ea", fontSize: 13, fontWeight: 600, color: "#6e6e73", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={saveLead} disabled={savingLead} style={{ flex: 2, padding: "11px", borderRadius: 10, background: "#1d1d1f", border: "none", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>{savingLead ? "Saving\u2026" : pendingId ? "\u2713 Save Changes" : _cardType === "vendor" ? "\u2713 Save Vendor" : "\u2713 Save to Pipeline"}</button>
          </div>
        ) : pendingConv && !_isXContactMode ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setPendingConv(null); setPending(null); setMsgs(p => [...p, { role: "assistant", content: "Cancelled." }]); }} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "#f5f5f7", border: "1px solid #e5e5ea", fontSize: 13, fontWeight: 600, color: "#6e6e73", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={() => { const e = pendingConv.entry; const t = pendingConv.type; const uid = pendingConv.updateId; const ao = pendingConv.saveAsOutreach; setPendingConv(null); showEntry(e, t, uid, ao); setMsgs(p => [...p, { role: "assistant", content: "Review and save below." }]); }} style={{ flex: 2, padding: "11px", borderRadius: 10, background: "#1d1d1f", border: "none", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>{"\u2713"} Save Now</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
