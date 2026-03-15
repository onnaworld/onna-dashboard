import React, { useState } from "react";

const CURRENCIES = ["AED","USD","GBP","EUR","SAR"];
const PER_OPTIONS = ["day","hour","flat"];
const DEFAULT_LOCATIONS = ["Dubai","London","US"];
const LOCATION_CURRENCY = { Dubai: "AED", London: "GBP", US: "USD", "Saudi Arabia": "SAR", Europe: "EUR" };

const PRESET_RATES = {
  Dubai: [
    { role: "Photographer", rate: "3500", currency: "AED", per: "day", notes: "" },
    { role: "DOP", rate: "4000", currency: "AED", per: "day", notes: "" },
    { role: "Director", rate: "5000", currency: "AED", per: "day", notes: "" },
    { role: "Producer", rate: "3000", currency: "AED", per: "day", notes: "" },
    { role: "1st AD", rate: "2000", currency: "AED", per: "day", notes: "" },
    { role: "Gaffer", rate: "1200", currency: "AED", per: "day", notes: "" },
    { role: "Spark", rate: "700", currency: "AED", per: "day", notes: "" },
    { role: "Key Grip", rate: "800", currency: "AED", per: "day", notes: "" },
    { role: "DIT", rate: "1500", currency: "AED", per: "day", notes: "" },
    { role: "Sound Engineer", rate: "1400", currency: "AED", per: "day", notes: "" },
    { role: "Drone Operator", rate: "3000", currency: "AED", per: "day", notes: "incl. equipment" },
    { role: "Steadicam Operator", rate: "3500", currency: "AED", per: "day", notes: "incl. rig" },
    { role: "HMUA", rate: "1200", currency: "AED", per: "day", notes: "" },
    { role: "Stylist", rate: "1200", currency: "AED", per: "day", notes: "" },
    { role: "Adult Model", rate: "3500", currency: "AED", per: "day", notes: "" },
    { role: "Child Model", rate: "2500", currency: "AED", per: "day", notes: "" },
    { role: "Runner", rate: "400", currency: "AED", per: "day", notes: "" },
    { role: "Production Manager", rate: "2000", currency: "AED", per: "day", notes: "" },
    { role: "Camera Package", rate: "2500", currency: "AED", per: "day", notes: "" },
    { role: "Grip & Lighting", rate: "3000", currency: "AED", per: "day", notes: "" },
    { role: "Edit", rate: "2500", currency: "AED", per: "day", notes: "" },
    { role: "Grade", rate: "3000", currency: "AED", per: "day", notes: "" },
    { role: "Catering", rate: "120", currency: "AED", per: "day", notes: "per head" },
  ],
  London: [
    { role: "Photographer", rate: "1500", currency: "GBP", per: "day", notes: "" },
    { role: "DOP", rate: "1800", currency: "GBP", per: "day", notes: "" },
    { role: "Director", rate: "2500", currency: "GBP", per: "day", notes: "" },
    { role: "Producer", rate: "1500", currency: "GBP", per: "day", notes: "" },
    { role: "1st AD", rate: "900", currency: "GBP", per: "day", notes: "" },
    { role: "Gaffer", rate: "600", currency: "GBP", per: "day", notes: "" },
    { role: "Spark", rate: "350", currency: "GBP", per: "day", notes: "" },
    { role: "Key Grip", rate: "450", currency: "GBP", per: "day", notes: "" },
    { role: "DIT", rate: "700", currency: "GBP", per: "day", notes: "" },
    { role: "Sound Engineer", rate: "600", currency: "GBP", per: "day", notes: "" },
    { role: "HMUA", rate: "550", currency: "GBP", per: "day", notes: "" },
    { role: "Stylist", rate: "600", currency: "GBP", per: "day", notes: "" },
    { role: "Adult Model", rate: "1500", currency: "GBP", per: "day", notes: "" },
    { role: "Child Model", rate: "800", currency: "GBP", per: "day", notes: "" },
    { role: "Runner", rate: "150", currency: "GBP", per: "day", notes: "" },
    { role: "Camera Package", rate: "1200", currency: "GBP", per: "day", notes: "" },
    { role: "Grip & Lighting", rate: "1500", currency: "GBP", per: "day", notes: "" },
    { role: "Edit", rate: "1200", currency: "GBP", per: "day", notes: "" },
    { role: "Grade", rate: "1500", currency: "GBP", per: "day", notes: "" },
    { role: "Catering", rate: "25", currency: "GBP", per: "day", notes: "per head" },
  ],
  US: [
    { role: "Photographer", rate: "2500", currency: "USD", per: "day", notes: "" },
    { role: "DOP", rate: "3000", currency: "USD", per: "day", notes: "" },
    { role: "Director", rate: "4000", currency: "USD", per: "day", notes: "" },
    { role: "Producer", rate: "2500", currency: "USD", per: "day", notes: "" },
    { role: "1st AD", rate: "1500", currency: "USD", per: "day", notes: "" },
    { role: "Gaffer", rate: "1000", currency: "USD", per: "day", notes: "" },
    { role: "Key Grip", rate: "800", currency: "USD", per: "day", notes: "" },
    { role: "DIT", rate: "1200", currency: "USD", per: "day", notes: "" },
    { role: "Sound Engineer", rate: "1000", currency: "USD", per: "day", notes: "" },
    { role: "HMUA", rate: "900", currency: "USD", per: "day", notes: "" },
    { role: "Stylist", rate: "1000", currency: "USD", per: "day", notes: "" },
    { role: "Adult Model", rate: "2500", currency: "USD", per: "day", notes: "" },
    { role: "Child Model", rate: "1500", currency: "USD", per: "day", notes: "" },
    { role: "Runner", rate: "250", currency: "USD", per: "day", notes: "" },
    { role: "Camera Package", rate: "2000", currency: "USD", per: "day", notes: "" },
    { role: "Grip & Lighting", rate: "2500", currency: "USD", per: "day", notes: "" },
    { role: "Edit", rate: "2000", currency: "USD", per: "day", notes: "" },
    { role: "Grade", rate: "2500", currency: "USD", per: "day", notes: "" },
    { role: "Catering", rate: "35", currency: "USD", per: "day", notes: "per head" },
  ],
};

// Migrate flat array → location-keyed object
function migrateRateCards(data) {
  if (Array.isArray(data)) return { Dubai: data.map((r, i) => ({ ...r, id: r.id || Date.now() + i })) };
  if (data && typeof data === "object") return data;
  return {};
}

export function BillieRateCardModal({ T, BtnPrimary, BtnSecondary, isMobile, billieRateCards, setBillieRateCards, setShowBillieRates }) {
  const cards = migrateRateCards(billieRateCards);
  const locations = Object.keys(cards);
  const [activeLoc, setActiveLoc] = useState(locations[0] || "Dubai");
  const [addingLoc, setAddingLoc] = useState(false);
  const [newLocName, setNewLocName] = useState("");

  // Ensure we always write location-keyed format
  const setCards = (fn) => setBillieRateCards(prev => {
    const migrated = migrateRateCards(prev);
    return typeof fn === "function" ? fn(migrated) : fn;
  });

  const activeRates = cards[activeLoc] || [];

  const addRow = () => {
    const cur = LOCATION_CURRENCY[activeLoc] || "AED";
    setCards(prev => ({ ...prev, [activeLoc]: [...(prev[activeLoc] || []), { id: Date.now(), role: "", rate: "", currency: cur, per: "day", notes: "" }] }));
  };
  const update = (id, field, val) => setCards(prev => ({ ...prev, [activeLoc]: (prev[activeLoc] || []).map(r => r.id === id ? { ...r, [field]: val } : r) }));
  const remove = (id) => setCards(prev => ({ ...prev, [activeLoc]: (prev[activeLoc] || []).filter(r => r.id !== id) }));

  const loadPreset = (loc) => {
    const preset = PRESET_RATES[loc];
    if (!preset) return;
    setCards(prev => ({ ...prev, [loc]: preset.map((r, i) => ({ ...r, id: Date.now() + i })) }));
  };

  const addLocation = () => {
    const name = newLocName.trim();
    if (!name || cards[name]) { setAddingLoc(false); setNewLocName(""); return; }
    setCards(prev => ({ ...prev, [name]: [] }));
    setActiveLoc(name);
    setAddingLoc(false);
    setNewLocName("");
  };

  const deleteLocation = (loc) => {
    if (!confirm(`Delete "${loc}" rate card and all its rates?`)) return;
    setCards(prev => { const next = { ...prev }; delete next[loc]; return next; });
    if (activeLoc === loc) setActiveLoc(Object.keys(cards).filter(l => l !== loc)[0] || "Dubai");
  };

  const inputStyle = { padding: "6px 8px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, fontFamily: "inherit", width: "100%" };
  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const thStyle = { fontSize: 11, fontWeight: 600, color: T.sub, textTransform: "uppercase", letterSpacing: "0.5px", padding: "6px 8px", textAlign: "left", whiteSpace: "nowrap" };
  const tabStyle = (active) => ({ padding: "6px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", border: active ? "1px solid #7ab87a" : `1px solid ${T.border}`, background: active ? "#f3fff3" : T.surface, color: active ? "#1a5a1a" : T.sub, transition: "all 0.15s", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6 });

  const allLocs = [...new Set([...Object.keys(cards), ...DEFAULT_LOCATIONS])];

  return (
    <div className="modal-bg" onClick={() => setShowBillieRates(false)}>
      <div style={{ borderRadius: 20, padding: 26, width: isMobile ? "95vw" : 740, maxHeight: "85vh", overflow: "auto", background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Billie Rate Card</div>
          <button onClick={() => setShowBillieRates(false)} style={{ background: "#f5f5f7", border: "none", color: T.sub, width: 28, height: 28, borderRadius: "50%", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 14 }}>Default rates per location. Billie uses these when populating estimates based on the shoot location.</div>

        {/* Location tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
          {allLocs.map(loc => (
            <div key={loc} style={tabStyle(activeLoc === loc)} onClick={() => setActiveLoc(loc)}>
              <span>{loc}</span>
              {!DEFAULT_LOCATIONS.includes(loc) && <span onClick={e => { e.stopPropagation(); deleteLocation(loc); }} style={{ fontSize: 11, opacity: 0.5, cursor: "pointer", marginLeft: 2 }}>×</span>}
            </div>
          ))}
          {addingLoc ? (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <input autoFocus value={newLocName} onChange={e => setNewLocName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addLocation(); if (e.key === "Escape") { setAddingLoc(false); setNewLocName(""); } }} placeholder="Location name" style={{ ...inputStyle, width: 120, padding: "5px 8px", fontSize: 12 }} />
              <button onClick={addLocation} style={{ background: "#1d1d1f", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Add</button>
            </div>
          ) : (
            <div onClick={() => setAddingLoc(true)} style={{ padding: "5px 10px", borderRadius: 8, border: `1.5px dashed ${T.border}`, fontSize: 12, color: T.muted, cursor: "pointer" }}>+ Location</div>
          )}
        </div>

        {/* Preset button if location has no rates yet */}
        {activeRates.length === 0 && PRESET_RATES[activeLoc] ? (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <div style={{ color: T.muted, fontSize: 13, marginBottom: 12 }}>No rates for {activeLoc} yet.</div>
            <BtnPrimary onClick={() => loadPreset(activeLoc)}>Load {activeLoc} Preset Rates</BtnPrimary>
          </div>
        ) : activeRates.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: T.muted, fontSize: 13 }}>No rates for {activeLoc} yet. Add your first rate below.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Role / Item</th>
                  <th style={{ ...thStyle, width: 90 }}>Rate</th>
                  <th style={{ ...thStyle, width: 80 }}>Currency</th>
                  <th style={{ ...thStyle, width: 80 }}>Per</th>
                  <th style={thStyle}>Notes</th>
                  <th style={{ ...thStyle, width: 30 }}></th>
                </tr>
              </thead>
              <tbody>
                {activeRates.map(row => (
                  <tr key={row.id}>
                    <td style={{ padding: "3px 4px" }}><input style={inputStyle} value={row.role} onChange={e => update(row.id, "role", e.target.value)} placeholder="e.g. Child Model" /></td>
                    <td style={{ padding: "3px 4px" }}><input style={inputStyle} value={row.rate} onChange={e => update(row.id, "rate", e.target.value)} placeholder="2500" /></td>
                    <td style={{ padding: "3px 4px" }}>
                      <select style={selectStyle} value={row.currency} onChange={e => update(row.id, "currency", e.target.value)}>
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "3px 4px" }}>
                      <select style={selectStyle} value={row.per} onChange={e => update(row.id, "per", e.target.value)}>
                        {PER_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "3px 4px" }}><input style={inputStyle} value={row.notes} onChange={e => update(row.id, "notes", e.target.value)} placeholder="optional" /></td>
                    <td style={{ padding: "3px 4px", textAlign: "center" }}>
                      <button onClick={() => remove(row.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 15, padding: 2 }} title="Delete">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <BtnSecondary onClick={addRow}>+ Add Rate</BtnSecondary>
            {activeRates.length > 0 && PRESET_RATES[activeLoc] && <BtnSecondary onClick={() => { if (confirm(`Reset ${activeLoc} rates to defaults?`)) loadPreset(activeLoc); }}>Reset to Preset</BtnSecondary>}
          </div>
          <BtnPrimary onClick={() => setShowBillieRates(false)}>Done</BtnPrimary>
        </div>
      </div>
    </div>
  );
}
